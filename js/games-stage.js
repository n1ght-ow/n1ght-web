(function () {
  "use strict";

  /* The games panel: eighteen covers on a detent dial.

     WHERE THE LOOK COMES FROM. Detent, a Framer code component
     (https://framer.com/m/Detent-ienXnN.js), read line by line and rebuilt in
     plain DOM - no React, no new dependency. Its makeLayout() is copied
     verbatim below: a card's width, offset, opacity and haze are a pure
     function of its distance from the centre. One neighbour sits at NEAR, the
     rest decay geometrically, everything past REACH is culled. One card is
     centred and in focus; the roster is behind it.

     WHAT CHANGED FOR A PAPER PAGE, and why:
       - the eighteen .hof-item elements ARE the deck. The reference keeps a
         ring of eleven recycled cells and swaps their art; that would mean
         eleven buttons for eighteen games, and main.js's gameItemData() reads
         rank, name, hours, quote and src off each item. Here every game keeps
         its own element, its own alt text and its own tab stop, and the ring
         is applied to the LAYOUT instead: an item's offset is its index
         measured the short way round the deck.
       - the meta is painted once, not eighteen times. .hof-name / .hof-hours /
         .hof-quote stay in the DOM as the data source and are painted under the
         centred cover into .hof-now. Eighteen covers at once was the grid; a
         dial shows one, so it says one.
       - the settle is gsap power3.out with a distance-proportional duration,
         not a spring integrator: the house rule for a strip, and a flick picks
         the detent it would have reached instead of leaving a free-flight state
         that can get stuck.
       - the wheel is deltaX only (+ shift), the same contract as the
         photography board. This dial is one band inside a long document and
         swallowing deltaY would be a scroll trap.
       - reduced motion snaps between detents and drops the flick.

     MAIN.JS STILL OWNS THE DETAIL LAYER, untouched. Clicking the centred
     cover opens #lightbox exactly as the grid did. Clicking a cover that is
     NOT centred brings it in instead - a half-opacity ghost is not something
     anyone means to open - and a drag never opens anything (swiped, cleared on
     pointerdown, consumed in the capture phase). Enter and Space on a focused
     card are main.js's, and keyboard focus frames its cover the way it does
     on the photography board. */

  var track = document.getElementById("hof-grid");
  var panel = document.getElementById("panel-games");
  if (!track || !panel) return;
  var items = Array.prototype.slice.call(track.querySelectorAll(".hof-item"));
  var SPAN = items.length;
  if (SPAN < 2) return;

  var cue = track.querySelector(".hof-cue");
  var labels = track.querySelector(".hof-labels");
  var elRank = track.querySelector(".hof-rank");
  var elNow = track.querySelector(".hof-now");
  var elName = track.querySelector(".hof-now-name");
  var elHours = track.querySelector(".hof-now-hours");
  var elQuote = track.querySelector(".hof-now-quote");

  /* ---------- the knobs ----------
     The lab (a scratch page, not in the repo) shipped these as sliders; this is
     the tuned "fits the site" position they were left on. css/games-stage.css
     reads none of them, so this is the only copy. */
  var CARD = 520;        /* centre card width, before fit() */
  var RATIO = 16 / 9;    /* every cover in covers/ is 16:9, so nothing crops */
  var GAP = 14;          /* between slots */
  /* This is what makes the dial big or small, and CARD is NOT: the band is
     scaled to the width it is given, so the rendered cover is
     avail / (band width / CARD) - a shape constant. Raising CARD alone just
     scales the whole ribbon back down. Reach and falloff are the real levers:
     nine slots cost 2.96x the card, eleven cost 3.45x. */
  var NEAR = 0.28;       /* the neighbour's size, 1 = same as the centre */
  var FALLOFF = 0.78;    /* per-step decay after that first neighbour */
  var FADE = 0.5;        /* the neighbour's opacity */
  var BLUR = 6;          /* px of haze at the far end, scaled by distance */
  var REACH = 4;         /* slots either side of the centre, on a wide window */
  var DRAG_SPAN = 220;   /* px of drag per detent */
  var WHEEL_STEP = 90;   /* pooled deltaX per detent */
  var FLICK = 0.26;      /* seconds of travel a flick is worth, in detents */
  var FLICK_MAX = 14;    /* detents/s, clamped: an unclamped flick spins the dial */
  var GLIDE_MIN = 0.34;  /* settle duration, seconds */
  var GLIDE_MAX = 0.78;
  var MIN_CARD = 280;    /* px: below this the reach gives way instead of the card */
  var LABEL_FALLBACK = 26;
  var PAD_FALLBACK = 24;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var mover = { pos: 0 };   /* continuous detent position; round() is current */
  var fit = 1;
  var reach = REACH;
  var shown = -1;           /* deck index currently painted into .hof-now */
  var drag = null;
  var trail = [];
  var swiped = false;
  var pooled = 0;
  var glide = null;
  var followFocus = false;  /* an arrow key asked focus to walk with the dial */
  var warmed = false;

  /* ---------- geometry ---------- */

  /* The short way round the ring. Detent wraps its deck (ringIndex); with the
     deck living in the DOM instead, the wrap moves here: game 18 (index 17) is
     one slot to the LEFT of game 1, so a dial never hits a wall. */
  function wrapDelta(d) {
    var half = SPAN / 2;
    return ((d % SPAN) + SPAN + half) % SPAN - half;
  }

  /* Detent's makeLayout, verbatim. */
  function makeLayout(c) {
    var decay = Math.min(0.95, Math.max(0.4, c.decay));
    var slope = Math.log(decay);
    var firstHop = c.w * (1 + c.near) / 2 + c.gap;
    return function at(offset) {
      var dist = Math.abs(offset);
      var way = offset < 0 ? -1 : 1;
      var ratio, shift;
      if (dist <= 1) {
        ratio = 1 + (c.near - 1) * dist;
        shift = firstHop * dist;
      } else {
        var faded = Math.pow(decay, dist - 1);
        ratio = c.near * faded;
        shift = firstHop + c.gap * (dist - 1) + c.w * c.near * (faded - 1) / slope;
      }
      var alpha;
      if (dist > c.reach + 0.5) alpha = 0;
      else if (dist <= 1) alpha = 1 + (c.fade - 1) * dist;
      else alpha = c.fade * Math.pow(0.7, dist - 1);
      var haze = Math.min(c.blur, c.blur * dist / Math.max(1, c.reach));
      return {
        w: c.w * ratio,
        h: c.h * ratio,
        x: (isFinite(shift) ? shift : firstHop * dist) * way,
        alpha: Math.max(0, Math.min(1, alpha)),
        haze: haze,
        depth: 400 - Math.round(dist * 12),
      };
    };
  }

  function layout(scale, reach) {
    var w = CARD * scale;
    return makeLayout({
      w: w, h: w / RATIO, gap: GAP * scale, near: NEAR,
      decay: FALLOFF, fade: FADE, blur: BLUR, reach: reach,
    });
  }

  function liveW() { return CARD * fit; }
  function liveH() { return liveW() / RATIO; }

  /* CSS owns the two spacing numbers the JS also needs. They are static
     custom properties on .hof.is-live, so they are read ONCE: sizeTrack() runs
     inside the paint path (paintNow -> sizeTrack), and a getComputedStyle there
     is a forced style flush wedged into the middle of the frame's own writes.
     The cache is dropped on resize, where the geometry is re-derived anyway. */
  var cssCache = {};
  function cssPx(name, fallback) {
    if (cssCache[name] !== undefined) return cssCache[name];
    var raw = window.getComputedStyle(track).getPropertyValue(name);
    var n = parseFloat(raw);
    cssCache[name] = isFinite(n) ? n : fallback;
    return cssCache[name];
  }

  /* The band has to hold the furthest slot plus half its card, twice. Because
     every term is linear in w and gap, one pass is exact: need(f) = f * need(1). */
  function fitFor(reach, avail) {
    var far = layout(1, reach)(reach);
    return Math.min(1, avail / (2 * (far.x + far.w / 2)));
  }

  /* The band is a multiplier on the card, so a narrow window would otherwise
     shrink the centre cover to a postage stamp: five slots either side ask for
     3.5x the card width, and 320px leaves 78px of cover. The reach gives way
     first, and the card keeps the most the window can pay for. Detent has no
     such rule - it only scales - which is why it is a desktop component. */
  function gauge() {
    var avail = Math.max(160, track.clientWidth - 2 * cssPx("--hof-pad", PAD_FALLBACK));
    reach = 1;
    for (var r = REACH; r > 1; r--) {
      if (CARD * fitFor(r, avail) >= MIN_CARD) { reach = r; break; }
    }
    fit = fitFor(reach, avail);
  }

  /* ---------- paint ---------- */

  /* The last values written per card. paint() runs on every frame of a drag and
     of the glide; the transform carries the position and has to be written, but
     width / height / opacity / z-index / filter only move when the card travels
     into a different part of the band. Writing an identical string still dirties
     style and forces the card's subtree to re-lay-out, so the ones that did not
     change are skipped. */
  var wrote = [];

  function paint() {
    var at = layout(fit, reach);
    var p = mover.pos;
    var centre = Math.round(p);
    var cueOff = Math.abs(p - centre);

    for (var i = 0; i < SPAN; i++) {
      var el = items[i];
      var box = at(wrapDelta(i - p));
      if (box.alpha <= 0.001) {
        /* out of the band: one write, once. These are the ones the browser is
           allowed to keep unloaded, and the ones the tab order skips. */
        if (el.getAttribute("data-culled") !== "1") {
          el.style.visibility = "hidden";
          el.setAttribute("data-culled", "1");
        }
        continue;
      }
      if (el.getAttribute("data-culled") === "1") {
        el.style.visibility = "visible";
        el.removeAttribute("data-culled");
      }
      var w = box.w.toFixed(1) + "px";
      var h = box.h.toFixed(1) + "px";
      var alpha = box.alpha.toFixed(3);
      var depth = String(box.depth);
      var haze = box.haze > 0.05 ? "blur(" + box.haze.toFixed(2) + "px)" : "";
      var was = wrote[i] || (wrote[i] = {});
      if (was.w !== w) { el.style.width = w; was.w = w; }
      if (was.h !== h) { el.style.height = h; was.h = h; }
      if (was.a !== alpha) { el.style.opacity = alpha; was.a = alpha; }
      if (was.z !== depth) { el.style.zIndex = depth; was.z = depth; }
      if (was.f !== haze) { el.style.filter = haze; was.f = haze; }
      /* the one that always moves, and the only compositable one of the six */
      el.style.transform = "translate3d(" + box.x.toFixed(2) + "px, 0, 0) translate(-50%, -50%)";
      var isCentre = i === ((centre % SPAN) + SPAN) % SPAN;
      if (el.classList.contains("is-centre") !== isCentre) el.classList.toggle("is-centre", isCentre);
    }

    if (cue) {
      /* The mark is a detent, not a frame: it gives as the dial sits between
         two slots, so the reader can see the pull before it lands. */
      cue.style.transform = "translate(-50%, -50%) scale(" + (1 - cueOff * 0.3).toFixed(4) + ")";
      cue.style.opacity = (1 - cueOff * 0.9).toFixed(3);
    }

    var want = ((centre % SPAN) + SPAN) % SPAN;
    if (want !== shown) {
      shown = want;
      paintNow(want);
    }
  }

  function paintNow(i) {
    var el = items[i];
    var name = el.querySelector(".hof-name");
    var hours = el.querySelector(".hof-hours");
    var quote = el.querySelector(".hof-quote");
    if (elRank) elRank.textContent = pad2(i + 1) + " / " + pad2(SPAN);
    if (elName) elName.textContent = name ? name.textContent : "";
    if (elHours) elHours.textContent = hours ? hours.textContent : "";
    if (elQuote) elQuote.textContent = quote ? quote.textContent : "";
    sizeTrack();
    /* Keyboard focus walks with the dial, but only when the dial was asked to
       move by a key: tabbing in must not fight the browser. */
    if (followFocus) {
      followFocus = false;
      focusAt(i);
    }
  }

  /* The label block is centred on the card, so BOTH rows overflow it
     symmetrically: the band has to clear twice the taller row, not the sum of
     the two. Getting this wrong clips the hours line and the note. */
  function sizeTrack() {
    /* WIDTH FIRST, then measure. The label rows are sized by the box they sit
       in, so measuring before place() sets that box reports the height the rows
       had at the PREVIOUS width - and a resize then leaves the band one reflow
       stale, which clips the hours line and the note. */
    place(labels);
    place(cue);
    var gap = cssPx("--hof-gap", LABEL_FALLBACK);
    var pad = cssPx("--hof-pad", PAD_FALLBACK);
    var rankH = elRank ? elRank.offsetHeight : 0;
    var nowH = elNow ? elNow.offsetHeight : 0;
    var need = liveH() + 2 * (gap + Math.max(rankH, nowH) + pad);
    track.style.height = Math.round(need) + "px";
  }

  function place(el) {
    if (!el) return;
    el.style.width = liveW().toFixed(1) + "px";
    el.style.height = liveH().toFixed(1) + "px";
  }

  /* ---------- the detent mark ----------
     Built once; Detent offers six marks and this is the one that matches the
     site's selected-card language (an accent rule under the current one). */
  function buildCue() {
    if (!cue) return;
    var WEIGHT = 2, SIZE = 8, OFF = 20;   /* must stay inside --hof-gap */
    var tint = "var(--color-accent-text)";
    cue.innerHTML =
      '<div style="position:absolute;inset-inline:0;inset-block-end:-' + OFF + 'px;height:' + WEIGHT + 'px;background:' + tint + '"></div>' +
      '<div style="position:absolute;inset-block-end:-' + (OFF + SIZE) + 'px;inset-inline-start:50%;margin-inline-start:' + (-WEIGHT / 2) + 'px;width:' + WEIGHT + 'px;height:' + SIZE + 'px;background:' + tint + '"></div>';
  }

  /* ---------- moving ---------- */

  function stopGlide() {
    if (glide) {
      glide.kill();
      glide = null;
    }
    /* the promotion scoped to motion goes with the motion (see the
       .is-dragging / .is-gliding rule in css/games-stage.css) */
    track.classList.remove("is-gliding");
  }

  function goTo(target, keyed) {
    if (keyed) followFocus = true;
    var dist = Math.abs(target - mover.pos);
    if (reduce.matches || dist < 0.002) {
      stopGlide();
      mover.pos = target;
      paint();
      return;
    }
    var dur = Math.min(GLIDE_MAX, Math.max(GLIDE_MIN, 0.16 + dist * 0.09));
    stopGlide();
    track.classList.add("is-gliding");
    glide = window.gsap.to(mover, {
      pos: target,
      duration: dur,
      ease: "power3.out",
      overwrite: true,
      onUpdate: paint,
      onComplete: function () {
        mover.pos = target;
        glide = null;
        track.classList.remove("is-gliding");
        paint();
      },
    });
  }

  function focusAt(i) {
    var el = items[((i % SPAN) + SPAN) % SPAN];
    if (el && document.activeElement !== el) el.focus({ preventScroll: true });
  }

  function focusedIndex() {
    var a = document.activeElement;
    if (!a || !a.closest) return -1;
    var el = a.closest(".hof-item");
    return el ? items.indexOf(el) : -1;
  }

  function pad2(v) { return v < 10 ? "0" + v : String(v); }

  /* ---------- pointer ----------
     Direct write for the whole gesture, exactly like the photography board:
     every pointermove sets mover.pos and paints, no tween in the path. One
     slot of travel costs DRAG_SPAN px, so the dial is 1:1 with the hand. */
  function onDown(e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    swiped = false;              /* never left set from the previous gesture */
    stopGlide();
    drag = { x: e.clientX, pos: mover.pos, moved: false };
    trail = [{ x: e.clientX, t: e.timeStamp }];
    track.classList.add("is-dragging");
    /* The rest of the gesture is heard on the window, NOT by capturing the
       pointer. setPointerCapture retargets pointerup AND the click to the
       capture element, so e.target.closest(".hof-item") stops matching and both
       the dial and main.js's delegated click go deaf. Measured with a witness
       listener before this changed:
         pointerdown -> .hof-img-wrap [card=true]
         pointerup   -> .hof.is-live   [card=false]   <- captured
         click       -> .hof.is-live   [card=false]   <- captured, detail=1
       Window listeners also survive a drag that leaves the band. */
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }

  function endDrag() {
    drag = null;
    trail = [];
    track.classList.remove("is-dragging");
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
  }

  function onMove(e) {
    if (!drag) return;
    var dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 6) {
      drag.moved = true;
      swiped = true;
    }
    if (!drag.moved) return;
    var span = Math.max(40, DRAG_SPAN * fit);   /* px per detent */
    mover.pos = drag.pos - dx / span;
    trail.push({ x: e.clientX, t: e.timeStamp });
    while (trail.length > 2 && e.timeStamp - trail[0].t > 110) trail.shift();
    paint();
  }

  function onUp(e) {
    if (!drag) return;
    var moved = drag.moved;
    /* Read the velocity BEFORE endDrag(): it empties the trail, and an empty
       trail reads as zero, which silently turned every flick into a plain
       drop-on-the-nearest-slot. Measured before the fix: a 1.5-detent gesture
       finished on +1.5 rounded, exactly as if it had been dragged slowly. */
    var v = moved ? Math.max(-FLICK_MAX, Math.min(FLICK_MAX, velocity())) : 0;
    endDrag();
    if (!moved) return;   /* a tap is decided by the click, below */
    /* The flick decides how far it travels. Detent integrates a free throw and
       brakes into the nearest slot; here the same intent is one step earlier:
       the velocity names the slot, and power3.out goes there. */
    var from = mover.pos;
    var target = Math.abs(v) > 0.6 ? from + v * FLICK : from;
    goTo(Math.round(target));
  }

  function velocity() {
    if (trail.length < 2) return 0;
    var head = trail[0];
    var tail = trail[trail.length - 1];
    var gap = tail.t - head.t;
    if (gap <= 0) return 0;
    var span = Math.max(40, DRAG_SPAN * fit);
    return -(tail.x - head.x) / span * (1000 / gap);
  }

  function onDragStart(e) { e.preventDefault(); }

  /* ---------- wheel: deltaX only ----------
     Shift+wheel arrives as deltaX, a trackpad's horizontal swipe arrives as
     deltaX, and a vertical scroll arrives as deltaY with nothing to consume -
     so the page keeps scrolling under the pointer. Pooled, because a trackpad
     reports dozens of small deltas where a wheel reports one big one. */
  function onWheel(e) {
    var dx = e.deltaX * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1);
    var dy = Math.abs(e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1));
    if (Math.abs(dx) < 1 || Math.abs(dx) <= dy) return;
    e.preventDefault();
    pooled += dx;
    if (Math.abs(pooled) >= WHEEL_STEP) {
      var way = pooled > 0 ? 1 : -1;
      pooled -= way * WHEEL_STEP;
      goTo(Math.round(mover.pos) + way);
    }
  }

  /* ---------- keys ----------
     Left/Right only: Up/Down belong to the page. Home/End are the site's own
     convention for a rail (see the reel). Enter and Space are main.js's. */
  function onKeyDown(e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    var here = focusedIndex();
    var cur = here < 0 ? Math.round(mover.pos) : here;
    if (e.key === "ArrowRight") { e.preventDefault(); goTo(cur + 1, true); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); goTo(cur - 1, true); }
    else if (e.key === "Home") { e.preventDefault(); goTo(0, true); }
    else if (e.key === "End") { e.preventDefault(); goTo(SPAN - 1, true); }
  }

  /* Keyboard focus frames its cover. Gated on :focus-visible because
     pointerdown focuses the card too, and a finger touching a poster must not
     also mean "bring this one in". */
  function onFocusIn(e) {
    var card = e.target && e.target.closest ? e.target.closest(".hof-item") : null;
    if (!card || !card.matches(":focus-visible")) return;
    var i = items.indexOf(card);
    if (i < 0 || i === ((Math.round(mover.pos) % SPAN) + SPAN) % SPAN) return;
    goTo(i);
  }

  /* A drag is browsing, so it must not also be a click - and a cover that is
     not the centred one comes in rather than opening. Captured, because both
     clicks land on #panel-games, where main.js is listening in the bubble
     phase for exactly the click that opens the detail layer. */
  function onClickCapture(e) {
    if (e.detail === 0) return;                 /* keyboard Enter still opens */
    if (swiped) {
      swiped = false;
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    var card = e.target && e.target.closest ? e.target.closest(".hof-item") : null;
    if (!card) return;
    var i = items.indexOf(card);
    if (i < 0) return;
    if (i === ((Math.round(mover.pos) % SPAN) + SPAN) % SPAN) return;
    e.stopPropagation();
    e.preventDefault();
    goTo(i);
  }

  track.addEventListener("pointerdown", onDown);
  track.addEventListener("dragstart", onDragStart);
  track.addEventListener("wheel", onWheel, { passive: false });
  track.addEventListener("keydown", onKeyDown);
  track.addEventListener("focusin", onFocusIn);
  track.addEventListener("click", onClickCapture, true);

  /* ---------- measurement ---------- */

  /* The panel mounts display:none, so the first measurement is a zero-width
     band. Everything re-measures when the tab is opened: the tab strip fires
     night:archive-tab, and a ResizeObserver catches the 0 -> real transition
     even if that event is ever renamed. */
  function activate() {
    if (!panel.classList.contains("is-active")) return;
    gauge();
    paintNow(((Math.round(mover.pos) % SPAN) + SPAN) % SPAN);
    paint();
    sizeTrack();
    warm();
  }

  document.addEventListener("night:archive-tab", activate);

  /* Covers are lazy. The browser loads the band on its own; the seven cards
     hidden behind it are not in the viewport, and a dial must not deal a blank
     card. Deferred past the tab wipe (0.8s) so six megabytes of covers are not
     competing with the entrance. */
  function warm() {
    if (warmed) return;
    warmed = true;
    window.setTimeout(function () {
      for (var i = 0; i < SPAN; i++) {
        var img = items[i].querySelector("img");
        if (img) img.loading = "eager";
      }
    }, 900);
  }

  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(function () {
      if (!track.clientWidth) return;
      gauge();
      sizeTrack();
      paint();
    }).observe(track);
  }

  window.addEventListener("resize", function () {
    cssCache = {};
    gauge();
    sizeTrack();
    paint();
  });

  if (reduce.addEventListener) reduce.addEventListener("change", function () { stopGlide(); paint(); });

  /* ---------- boot ----------
     .is-live first, so the band is never measured against the fallback grid. */
  track.classList.add("is-live");
  buildCue();
  gauge();
  sizeTrack();
  paint();
  /* Space Grotesk lands after first paint and moves the label block by a pixel
     or two; the band is sized around the real height, not the fallback's. */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { sizeTrack(); });
  if (panel.classList.contains("is-active")) activate();
})();
