(function () {
  "use strict";

  /* THE DECK - twenty-one photographs as a pile.

     WHERE THE LOOK COMES FROM. The photograph stack: a deck you deal one card
     at a time, the card that was underneath rising to take its place. It
     replaces PhantomInfiniteGallery's infinite board - a window of cells over an
     infinite plane - because that board spends the reader's attention on the
     interface, and this chapter's one rule is that the photographs ARE the
     page. A pile has no grid, no chrome and no indicator, so there is nothing
     in it to compete with a picture.

     WHAT CHANGED FOR THIS ARCHIVE, and why:
       - the deck is IN THE PAGE. There is no full-screen layer and no "open
         the wall" button; the first card IS the chapter's opening image. What
         the layer used to do - one photograph at a time, as large as the screen
         allows - the shared #lightbox already does, with a twenty-one thumbnail
         rail for jumping, so the layer was a second copy of a thing that
         already existed. Opening it also meant a second scroll lock, a second
         Escape path and a second focus trap to keep honest.
       - twenty-one cards, no clones, no world coordinates. The board tiled an
         infinite plane from a pure function of world position,
         index = |(x + 3y) mod n|, because an infinite plane HAS to be filled
         from something. A deck is finite and already in order. Everything that
         existed only to serve those two facts is gone: the clone pool and its
         window scan, the cylinder (calcArc / radius / preserve-3d), two-axis
         drag and throw, hold-to-zoom, mouse parallax, the wheel handler, and
         wrapDelta()'s short way round. What is left is three numbers of state:
         top, fly, back.
       - the plate is 800 CSS px painted from the 1600px photo/ rendition. The
         board painted 258-280px cells out of the 560px photo/wall/ one. 800 is
         exactly half of 1600, so the plate is never upscaled at dpr2 either.
       - the vertical axis belongs to the page. A full-screen board could take
         both axes and lock the document behind it; a pile sitting in the text
         cannot, and must not, or the chapter is a trap you can only leave by
         finding the close button. Only the horizontal axis deals.

     THE ORDER IS THE SEQUENCE, not a pattern. The twenty-one <figure> elements
     ship in index.html in the order the reader meets them, DOM order IS the
     order of the pile, and nothing maps one onto the other any more.
     Re-sequencing means reordering the markup and renumbering .photo-frame-no
     and each aria-label in the same pass - the board's three-place rule, minus
     the world formula.

     THE DECK HAS A TOP AND A BOTTOM. No wrap, no seam: dealing past frame 21
     does nothing and dealing back past frame 1 does nothing. A pile has a
     bottom, and the infinite loop the board bought is not worth the cost of
     pretending otherwise. Jumping to an arbitrary frame is the lightbox rail's
     job, one Enter away, with a label on every thumbnail.

     ONE WRITER. paint() is the only place a card's transform is written, and
     it is called from three places that are not allowed to write anything
     else: a held card (the offset is read off drag, never tweened), the rAF
     loop (one exponential approach, no GSAP anywhere in this file), and the
     initial layout. A tween on the same property would be the second writer and
     the two would fight every frame. */

  var host = document.getElementById("photo-deck");
  var canvas = document.querySelector("[data-photo-fallback]");
  if (!host || !canvas) return;

  var figures = Array.prototype.slice.call(canvas.querySelectorAll(".photo-frame"));
  var PHOTOS = figures.length;
  if (!PHOTOS) return;

  var foot = document.getElementById("photo-deck-foot");
  var footCap = document.getElementById("photo-deck-caption");
  var footIdx = document.getElementById("photo-deck-index");

  /* ---------- the knobs ---------- */
  var VISIBLE     = 3;      /* cards drawn behind the top one */
  var STEP_Y      = 10;     /* px each of those sits lower */
  var STEP_S      = 0.045;  /* scale each of them gives up */
  var FAN         = 1;      /* deg, the unit fan() works in */
  var TILT        = 0.02;   /* deg of lean per px of horizontal drag */
  var SLOP        = 6;      /* px before a press is a drag and not a click */
  var COMMIT_PX   = 88;     /* px of travel that deals on its own */
  var COMMIT_V    = 420;    /* px/s that deals on its own, for a short flick */
  var SETTLE_T    = 0.10;   /* s, the exponential approach */
  var SETTLE_DONE = 0.96;   /* where a transient counts as finished */
  var FLY         = 120;    /* px a card travels as it is lifted off the pile */

  var stack = document.createElement("div");
  stack.className = "photo-deck__stack";
  host.insertBefore(stack, canvas);
  figures.forEach(function (f) { stack.appendChild(f); });

  var btns = figures.map(function (f) { return f.querySelector(".photo-frame-btn"); });
  var imgs = figures.map(function (f) { return f.querySelector("img"); });

  /* data-rail is the small rendition, snapshotted before anything touches src.
     The detail layer's rail wants a 32 KB thumbnail for all twenty-one; the
     plate wants the 1600px one for at most five. Asking both off \`src\` would
     force the rail to download twenty-one linearised files, so the two jobs
     get two fields and loadWindow() below owns the plate's. */
  imgs.forEach(function (img) {
    if (img) img.setAttribute("data-rail", img.getAttribute("src") || "");
  });

  var mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reduce = mq.matches;

  var top = 0;
  var fly = null;   /* { i, from, to, t } - a card crossing the front edge */
  var back = null;  /* { i, from, t }     - a card returning to its slot */
  var drag = null;  /* { id, x0, px, pt, x, on } while a finger holds the top card */
  var swiped = false;
  var raf = 0;
  var last = 0;

  /* the fan: alternating, growing a little, never zero. A second card sitting
     at exactly 0deg reads as a duplicate of the first rather than as the one
     under it. A pure function of depth, so it is identical on every reload and
     at every width - there is no Math.random() anywhere in this file, and
     adding one would make the pile flicker between two states on every
     repaint. */
  function fan(d) {
    if (reduce) return 0;
    return (d % 2 ? -1 : 1) * (0.35 + 0.28 * d) * FAN;
  }

  function paint() {
    /* A held card is not a transient: its offset is read straight off the
     pointer, so this is the same 1:1 the film rail keeps, with no easing
     between the finger and the photograph. */
    var held = drag && drag.on ? drag.x : 0;

    for (var i = 0; i < PHOTOS; i++) {
      var node = figures[i];
      var d = i - top;
      var flying = !!(fly && fly.i === i);
      var off = 0;

      if (flying) {
        if (d < 0) d = 0;                              /* it left across the front */
        off = fly.from + (fly.to - fly.from) * fly.t;
      } else if (back && back.i === i) {
        off = back.from * (1 - back.t);
      } else if (i === top) {
        off = held;
      }

      if (d < 0 || d > VISIBLE) {
        if (node._vis !== false) {
          node._vis = false;
          node.style.visibility = "hidden";
        }
        continue;
      }
      /* the guard is "!== true", not "!== false": a card that has been hidden
         once must be able to come back. Inverted, the first card that dealt out
         of the window never returned, and the pile went dark. */
      if (node._vis !== true) {
        node._vis = true;
        /* explicit "visible", not "": the stylesheet defaults .photo-frame to
           visibility:hidden so a half-built pile is never painted, and clearing
           the inline value would fall straight back to that. */
        node.style.visibility = "visible";
      }

      /* z-index follows depth, so the pile sorts back to front without the DOM
         being reversed - and a card crossing the front edge is briefly above
         everything, which is the only moment it should be. */
      var z = VISIBLE + 1 - d;
      if (node._z !== z) { node._z = z; node.style.zIndex = z; }

      var scale = 1 - d * STEP_S;
      var rot = d === 0 ? (reduce ? 0 : off * TILT) : fan(d);
      if (flying) scale *= 1 + fly.t * 0.04;   /* lifted off the pile, toward you */

      node.style.transform =
        "translate3d(" + off.toFixed(2) + "px," + (d * STEP_Y).toFixed(2) + "px,0)" +
        (rot ? " rotate(" + rot.toFixed(3) + "deg)" : "") +
        " scale(" + scale.toFixed(4) + ")";

      var alpha = flying ? (1 - fly.t).toFixed(3) : "";
      if (node._alpha !== alpha) { node._alpha = alpha; node.style.opacity = alpha; }
      if (node._fly !== flying) {
        node._fly = flying;
        node.classList.toggle("is-flying", flying);
      }
    }
  }

  /* ---------- the window of live images ----------
     A card is given the linearised src only while it is within reach of the
     top: top-1 through top+VISIBLE, five of twenty-one. top+1 is the card the
     next deal promotes, so a deal never waits on the network in either
     direction, and five 153 KB files is still less than the 650 KB the board
     spent on twenty-one 32 KB thumbnails. Everything else keeps data-rail and
     nothing else. */
  function loadWindow() {
    var lo = Math.max(0, top - 1);
    var hi = Math.min(PHOTOS - 1, top + VISIBLE);
    for (var i = 0; i < PHOTOS; i++) {
      var img = imgs[i];
      if (!img) continue;
      var full = img.getAttribute("data-full") || "";
      var want = (i >= lo && i <= hi) ? full : "";
      if ((img.getAttribute("src") || "") !== want) {
        if (want) img.setAttribute("src", want);
        else img.removeAttribute("src");
      }
    }
  }

  function syncTop(moveFocus) {
    /* Read the focus intent FIRST. paint() below hides the card the reader is
       standing on, and a hidden element cannot hold focus - the browser drops
       it to <body> the instant visibility goes, so by the end of this function
       activeElement is nowhere near the pile any more and the test always
       fails. ArrowRight once and being thrown back to the top of the document
       is the failure this ordering prevents. */
    var hadFocus = !!(moveFocus && document.activeElement &&
      document.activeElement.closest(".photo-frame"));
    for (var i = 0; i < PHOTOS; i++) {
      var on = i === top;
      figures[i].classList.toggle("is-top", on);
      if (btns[i]) btns[i].tabIndex = on ? 0 : -1;
      if (on) figures[i].removeAttribute("aria-hidden");
      else figures[i].setAttribute("aria-hidden", "true");
    }

    var f = figures[top];
    var txt = f.querySelector(".photo-frame-text");
    var no = f.querySelector(".photo-frame-no");
    var act = f.getAttribute("data-act") || "";
    if (footCap) footCap.textContent = txt ? txt.textContent.trim() : "";
    if (footIdx) {
      footIdx.textContent =
        (no ? no.textContent.trim() : "") + " / " + PHOTOS + (act ? "  ·  " + act : "");
    }

    loadWindow();
    /* paint HERE, not only in frame(): top has already moved, so the foot text,
       the tabindex and the transform of a card the reader is about to touch all
       have to agree in the same turn. Leaving paint() to the next rAF frame
       opens a window where the pile is logically one card forward and visually
       still on the old one - which is exactly the window a hand lands in. */
    paint();

    /* focus follows the deal, but only if it was already inside the pile. A
       reader who dealt by dragging should not be teleported by the mouse; a
       reader who dealt with the arrow keys must be, or their next keypress
       would land on a card that is no longer on top - and the lightbox hands
       focus back to lbTrigger on close, which has to be a live control. */
    if (hadFocus) {
      var btn = btns[top];
      if (btn && btn.focus) btn.focus({ preventScroll: true });
    }
  }

  /* ---------- the loop ---------- */
  function busy() { return !!(fly || back); }

  function kick() {
    if (raf) return;
    host.classList.add("is-live");
    raf = requestAnimationFrame(frame);
  }

  function frame(now) {
    raf = 0;                                   /* clear first: kick() below must be free to re-arm */
    if (!last) last = now;
    var dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;

    var k = reduce ? 1 : 1 - Math.exp(-dt / SETTLE_T);
    if (fly) { fly.t += (1 - fly.t) * k; if (fly.t >= SETTLE_DONE) fly = null; }
    if (back) { back.t += (1 - back.t) * k; if (back.t >= SETTLE_DONE) back = null; }

    paint();
    if (busy()) kick();
    else { host.classList.remove("is-live"); last = 0; }
  }

  /* ---------- dealing ----------
     dir 1 is forward. The drag is physical - flick the card left, the next one
     is already underneath it - and the keys are semantic (-> is next), and the
     two disagree on purpose: one is a gesture, the other is a command, and
     giving each the convention its own users already carry is worth more than
     making them match. */
  function deal(dir, from) {
    var next = top + dir;
    if (next < 0 || next > PHOTOS - 1) {
      back = { i: top, from: from, t: 0 };       /* a pile has a bottom: refuse, and put it back */
      paint(); kick();
      return false;
    }
    /* The side is decided by dir ALONE, never by the sign of from. A keyboard
       deal passes from = 0, and "from < 0 ? -1 : 1" read that 0 as positive, so
       every ArrowRight threw the card off to the RIGHT while the equivalent
       left-drag threw it left - the same gesture leaving two directions.
       Forward deals off to the LEFT, matching a left flick, and a card coming
       back arrives from that same side, so a deal and its undo leave and return
       by one road rather than two. */
    var side = -dir * Math.max(FLY, Math.abs(from));
    if (dir > 0) {
      /* the top card leaves along the gesture; the one under it is already in
         place, so there is nothing to slide in */
      fly = { i: top, from: from, to: side, t: 0 };
    } else {
      back = { i: top, from: from, t: 0 };
      fly = { i: top - 1, from: -side, to: 0, t: 0 };
    }
    top = next;
    syncTop(true);
    kick();
    return true;
  }

  function select(i) {
    i = Math.max(0, Math.min(PHOTOS - 1, Number(i) || 0));
    if (i === top) return;
    /* Brought to the top from the side: it arrives from the side it sits
       further along the sequence on, which is the only reading that makes
       "put this one on top" legible. The card it replaces drops back into the
       pile at its new depth, with no transition - a click is a discrete act
       and a half-hearted slide there would only slow the eye down. */
    fly = { i: i, from: i > top ? FLY : -FLY, to: 0, t: 0 };
    top = i;
    syncTop(true);
    kick();
  }

  /* ---------- pointer ----------
     No capture on pointerdown: capturing there redirects the click to the
     element that captured, and "click the photograph" would stop opening
     anything - the same trap the film rail documents. Tracking on window
     instead, and pointercancel (the browser taking the vertical axis for a
     scroll) simply drops the gesture. */
  stack.addEventListener("pointerdown", function (e) {
    if (e.button) return;
    swiped = false;      /* cleared on press, never only on click: a drag released
                             over ANOTHER card produces no click at all, and a
                             leftover flag would eat the next real one */
    /* A hand on the pile settles it. A card that is still leaving the front edge
       would otherwise keep writing its flight offset over the 1:1 one, and the
       finger would be holding a card that is not going where the finger is
       going. The deal is already committed; only the travel is dropped. */
    if (fly || back) { fly = null; back = null; last = 0; }
    drag = { id: e.pointerId, x0: e.clientX, px: 0, pt: e.timeStamp, x: 0, on: false };
  });

  window.addEventListener("pointermove", function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var x = e.clientX - drag.x0;
    if (!drag.on) {
      if (Math.abs(x) <= SLOP) return;
      drag.on = true;
      swiped = true;
      /* is-live by hand: the drag writes through paint() and never goes
         through kick(), and the compositor layer is still wanted. */
      host.classList.add("is-live");
    }
    drag.x = x;
    drag.px = x;
    drag.pt = e.timeStamp;
    paint();
  }, { passive: true });

  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var d = drag;
    drag = null;
    if (!d.on) return;

    var held = d.x;
    var ms = e.timeStamp - d.pt;
    /* A flick counts as a deal even when it never travelled the full 88px: a
       fast hand covers that in three frames. DIRECTION always comes from the
       offset, never from the speed - "which way did the card end up" has one
       answer, and letting a decaying velocity pick a different one is how a
       card deals backwards under a rightward flick. */
    var v = ms > 0 ? (held - d.px) / (ms / 1000) : 0;
    if (Math.abs(held) > COMMIT_PX || Math.abs(v) > COMMIT_V) deal(held < 0 ? 1 : -1, held);
    else { back = { i: top, from: held, t: 0 }; paint(); kick(); }
  }

  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);

  /* A drag is swallowed in the capture phase, before main.js's delegated click
     runs. A keyboard Enter produces a click with detail 0 and is let through. */
  stack.addEventListener("click", function (e) {
    if (!swiped) return;
    swiped = false;
    e.stopPropagation();
    e.preventDefault();
  }, true);

  /* ---------- keyboard ---------- */
  host.addEventListener("keydown", function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === "ArrowRight") { e.preventDefault(); deal(1, 0); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); deal(-1, 0); }
    else if (e.key === "Home") { e.preventDefault(); if (top !== 0) select(0); }
    else if (e.key === "End") { e.preventDefault(); if (top !== PHOTOS - 1) select(PHOTOS - 1); }
  });

  if (mq.addEventListener) {
    mq.addEventListener("change", function () { reduce = mq.matches; paint(); });
  }

  syncTop(false);
  paint();
  /* The foot ships hidden: it is a caption of the card on top, so with scripting
     off there is no card on top and an empty line of dead space under the grid
     is worse than no foot. js/main.js's detail layer reads the same
     .photo-frame-text whether the foot exists or not. */
  if (foot) foot.hidden = false;

  window.PhotoDeck = {
    top: function () { return top; },
    count: function () { return PHOTOS; },
    select: select,
    deal: deal,
    stop: function () {
      drag = null; fly = null; back = null; raf = 0; last = 0;
      host.classList.remove("is-live");
      paint();
    },
    get state() {
      return { top: top, photos: PHOTOS, reduce: reduce, busy: busy(), live: host.classList.contains("is-live") };
    }
  };
})();
