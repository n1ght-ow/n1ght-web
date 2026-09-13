(function () {
  "use strict";

  /* Shared reel-stage factory: ONE implementation behind the film and series
     panels. The adapters (film-stage.js / series-stage.js) only pass config;
     every emitted class name stays prefixed per panel, so css and main.js
     bindings are untouched. See AGENTS.md for the config contract.

     options = {
       data:            [...]                      // already-defined data array
       prefix:          "film" | "series"          // class/attr/dataset prefix
       mountSelector:   "[data-film-stage='auto']" // containers to render into
       tabToken:        "films"                    // .tab-btn[data-tab=...] that
                                                   // re-measures after the wipe
       title, sub:      head texts ("SIXTEEN FILMS", "MOTION / REEL")
       rangeAria:       aria-label for the range slider
       detailAria:      aria-label for the detail section
       cardAria:        item => accessible name for a card button
       cardMetaLine:    item => "director / year" style meta line
       cardTag:         { cls, get }               // third meta line
       detailKicker:    item => [{ cls, text }, { cls, text }]
       detailLine:      { cls, get }               // middle line under title
     } */

  const states = new WeakMap();
  const pad = (n) => String(n).padStart(2, "0");

  /* CJK-bearing lines get lang="zh" so the browser picks proper system
     CJK fallback fonts (site fonts are latin-subset only). */
  const CJK = /[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]/;
  function tagLang(node, text) {
    if (CJK.test(String(text))) node.setAttribute("lang", "zh");
    else node.removeAttribute("lang");
  }

  window.createReelStage = function (options) {
    let items = (options.data || []).slice();
    const REDUCED = window.matchMedia
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;
    const prefix = options.prefix;

    /* How far a finger must travel before a touch on the strip counts as a
       swipe rather than a tap on a poster. Small enough to feel immediate,
       large enough that a slightly smudged tap still opens the card. */
    const SWIPE_THRESHOLD = 6;

    /* Velocity sampling window, in ms (Embla's DragTracker uses 170). Samples
       older than this are dropped, which is also the stale-flick guard: flick,
       pause, release must NOT launch the rail. */
    const VEL_WINDOW = 170;

    /* Rubber-band constant. 0.55 is iOS; 0.15 is @use-gesture's default and is
       what a mouse-driven rail wants - iOS's value resists so little it reads
       as a bug on desktop. */
    const RUBBER = 0.15;

    function rubberOffset(distance, dimension, constant) {
      if (!dimension) return Math.pow(distance, constant * 5);
      return (distance * dimension * constant) / (dimension + constant * distance);
    }

    /* Past either end the strip keeps following the finger, at a decreasing
       rate, instead of stopping dead under the cursor. */
    function rubberBand(state, x) {
      const max = maxX(state);
      if (x < 0) return -rubberOffset(-x, max, RUBBER);
      if (x > max) return max + rubberOffset(x - max, max, RUBBER);
      return x;
    }

    const canTween = () =>
      !REDUCED &&
      typeof window.gsap !== "undefined" &&
      typeof window.ScrollTrigger !== "undefined";

    function el(tag, cls, text) {
      const node = document.createElement(tag);
      if (cls) node.className = cls;
      if (text != null) node.textContent = text;
      return node;
    }

    function q(stage, selector) {
      return stage.querySelector(selector);
    }

    /* Debounced global refresh: lazy poster loads settle in bursts, so many
       load events inside 250ms collapse into one refresh pass. setupMode()
       still runs per image; only the global recalc is batched. */
    let refreshTimer = 0;
    function refreshScrollTrigger() {
      if (!window.ScrollTrigger || !window.ScrollTrigger.refresh) return;
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => {
        if (window.ScrollTrigger && window.ScrollTrigger.refresh) {
          window.ScrollTrigger.refresh();
        }
      }, 250);
    }

    /* ---------- reel position ----------
       The viewport is never a scroll container (overflow: hidden), so the
       page wheel always moves the page — the reel only moves when the
       range slider is dragged, or a card is clicked / keyboard-focused.
       The strip is shifted with a transform; every write goes through the
       single quickTo (never killTweensOf — that would kill quickTo itself).
       state.x is the single source of truth. */

    /* Cached. maxX() used to read strip.scrollWidth and viewport.clientWidth
       on EVERY call, and setStrip is called on every pointermove - so the old
       version forced a style/layout flush per frame of every drag. */
    function measureMax(state) {
      state.maxX = Math.max(0, state.strip.scrollWidth - state.viewport.clientWidth);
      return state.maxX;
    }

    function maxX(state) {
      return state.maxX == null ? measureMax(state) : state.maxX;
    }

    /* THE ONE PLACE THAT MOVES THE STRIP.

       x is the committed position and the single source of truth. Every write
       goes through here so clamp / state.x / the range / the tween can never
       disagree.

       WHY animate IS NOW REAL. This function used to take an animate argument
       and ignore it: every call, including every pointermove, went through
       state.moveTo, which is gsap.quickTo(strip, "x", { duration: .35,
       ease: "power2.out" }). Measured against the project's own vendored
       GSAP 3.15, a quickTo with those settings trails a continuously moving
       target by roughly 0.37 x duration x velocity:

         finger at  400 px/s -> poster lags  52 px
         finger at 1000 px/s -> poster lags 131 px
         finger at 2000 px/s -> poster lags 262 px

       The finger and the poster were about eight frames apart for the whole
       gesture. That lag - not a shortage of animation - is what made the rail
       feel cheap. A drag must be 1:1, so during a drag the transform is
       written DIRECTLY (exactly what js/glass-pill.js does, and what
       AGENTS.md documents as 位置每帧直写). The tween is only for a release,
       a range commit, or a card reveal, where nobody is holding anything. */
    function setStrip(stage, state, x, animate, free) {
      const max = maxX(state);
      /* free === true only while a finger is down and past an end, where the
         strip is deliberately allowed out of range so the rubber band can be
         seen. Everything else - release, range, reveal - is clamped. */
      const target = free ? x : Math.max(0, Math.min(x, max));
      state.x = target;
      state.viewport.scrollLeft = 0;

      if (animate && state.moveTo) {
        state.moveTo(-target);
      } else {
        state.strip.style.transform = target
          ? "translate3d(" + -target + "px, 0, 0)"
          : "";
      }

      syncRange(state, target);
      return target;
    }

    /* The rail's position has TWO writers - setStrip for anything instantaneous
       and settle's tween for anything that travels - and the range indicator
       has to hear about both.

       It used to hear about only the first, because the write lived inside
       setStrip. A setter tap on range.value proved it: during a selection every
       single write came from an image load event (setupMode -> setStrip), and
       NONE came from the selection itself. The thumb only kept up by accident,
       whenever a poster happened to finish loading afterwards. On a machine
       where every poster is already cached no load ever fires again, so the
       thumb froze wherever it was - reported as "the little circle sits at the
       far left and never moves".

       Never write back into the control the user is currently holding, or the
       thumb fights the finger and inherits the same lag. */
    function syncRange(state, x) {
      if (state.rangeHeld) return;
      const max = maxX(state);
      state.range.value = max ? String((x / max) * 100) : "0";
    }

    /* quickTo is a REUSABLE tween, so killing it leaves the setter pointing at
       a dead tween and every later call silently does nothing. When a drag
       takes over from a settle the in-flight tween has to go - otherwise it
       keeps writing x on the next tick and fights the finger - so the mover is
       rebuilt rather than killed. */
    function resetMover(state) {
      /* Also clears the in-flight flag. resetMover runs both when a settle
         finishes AND when a pointerdown interrupts one - and an interrupted
         settle never fires onComplete, so without this the flag would stay set
         for the rest of the session and setupMode (re-measure + re-clamp on
         resize and on every poster load) would silently stop doing anything. */
      state.settling = false;
      if (!canTween()) return;
      window.gsap.killTweensOf(state.strip, "x");
      state.moveTo = window.gsap.quickTo(state.strip, "x", {
        duration: 0.35,
        ease: "power2.out"
      });
    }

    /* Card offsets relative to the strip, cached.

       Used ONLY to work out where the rail has to sit for a card to be dead
       centre. The drag deliberately does NOT snap to these any more: snapping
       to a card position asserts "this card is the current one", and dragging
       is defined as browsing that does not change the selection. A rail parked
       on card 7 while card 3 carried the ring is a state that reads broken. */
    function cardOffsets(state) {
      if (state.offsets) return state.offsets;
      const stripLeft = state.strip.getBoundingClientRect().left;
      state.offsets = Array.prototype.slice
        .call(state.strip.querySelectorAll("." + prefix + "-card"))
        .map((card) => {
          const r = card.getBoundingClientRect();
          return { x: r.left - stripLeft, w: r.width };
        });
      return state.offsets;
    }

    /* Where the strip must sit for card `index` to be centred in the viewport.
       Clamped, because the rail is bounded: the first two and the last two
       cards cannot reach the centre and rest against the end instead. That is
       unavoidable without spacer elements at both ends, and it is what every
       centre-mode carousel does. */
    function centeredX(state, index) {
      let o = cardOffsets(state)[index];
      if (!o) {
        /* The cache can be short or stale after a layout change. The old
           fallback was `return state.x`, which makes the whole feature fail
           SILENTLY - the rail simply does not move and nothing reports why.
           That is how this hid for so long. Measure the one card we actually
           need instead. */
        const card = state.strip.querySelectorAll("." + prefix + "-card")[index];
        if (!card) return state.x;
        const stripLeft = state.strip.getBoundingClientRect().left;
        const r = card.getBoundingClientRect();
        o = { x: r.left - stripLeft, w: r.width };
      }
      const max = maxX(state);
      return Math.max(0, Math.min(o.x + o.w / 2 - state.viewport.clientWidth / 2, max));
    }

    /* The ONE way the rail travels to a position nobody is holding.

       Distance-proportional, and power3.out cannot overshoot: measured max
       exactly 1.000000. No spring - the project retired back/elastic, and a
       release here carries real momentum, so a bounce would be a false
       statement about the gesture. The drag release and selection centring
       both go through here, so they land identically. */
    function settle(stage, state, target) {
      const delta = target - state.x;
      state.x = target;
      if (!canTween() || REDUCED) {
        setStrip(stage, state, target, false);
        return;
      }
      if (state.moveTo && Math.abs(delta) < 1) {
        state.moveTo(-target);
        syncRange(state, target);
        return;
      }
      window.gsap.killTweensOf(state.strip, "x");
      state.settling = true;
      window.gsap.to(state.strip, {
        x: -target,
        duration: Math.max(0.3, Math.min(0.9, 0.22 + Math.abs(delta) / 2600)),
        ease: "power3.out",
        overwrite: true,
        force3D: true,
        onUpdate: () => {
          /* Follow the LIVE value, not the target. Writing the target here
             would teleport the thumb to the destination on frame one and leave
             it sitting there waiting for the rail to arrive - which is exactly
             the "rail is in the middle, circle is at the far left" mismatch. */
          const live = -Number(window.gsap.getProperty(state.strip, "x")) || 0;
          syncRange(state, live);
        },
        onComplete: () => {
          state.settling = false;
          syncRange(state, target);
          resetMover(state);
        }
      });
    }

    function render(stage) {
      stage.innerHTML = "";
      stage.classList.add(prefix + "-stage");
      stage.classList.toggle(prefix + "-stage-reduced", REDUCED);

      const head = el("div", prefix + "-stage-head");
      const headLeft = el("div", prefix + "-stage-head-left");
      headLeft.appendChild(el("span", prefix + "-stage-title", options.title));
      headLeft.appendChild(el("span", prefix + "-stage-sub", options.sub));
      const headRight = el("div", prefix + "-stage-head-right");
      headRight.appendChild(el("span", prefix + "-stage-count", "01-" + pad(items.length)));
      head.appendChild(headLeft);
      head.appendChild(headRight);
      stage.appendChild(head);

      const viewport = el("div", prefix + "-stage-viewport");
      const strip = el("div", prefix + "-stage-strip");
      viewport.appendChild(strip);

      items.forEach((item, index) => {
        const card = document.createElement("button");
        card.type = "button";
        card.className = prefix + "-card";
        card.dataset[prefix + "Id"] = item.id;
        card.dataset.cursor = "OPEN";
        card.setAttribute("role", "button");
        card.setAttribute("aria-pressed", index === 0 ? "true" : "false");
        card.setAttribute("aria-label", options.cardAria(item));

        const img = document.createElement("img");
        img.className = prefix + "-card-img";
        img.src = item.poster;
        img.alt = "";
        img.loading = index === 0 ? "eager" : "lazy";
        img.decoding = "async";
        img.referrerPolicy = "no-referrer";

        const meta = el("span", prefix + "-card-meta");
        const titleEl = el("span", prefix + "-card-title", item.title);
        tagLang(titleEl, item.title);
        meta.appendChild(titleEl);
        const metaLine = el("span", prefix + "-card-meta-line", options.cardMetaLine(item));
        tagLang(metaLine, metaLine.textContent);
        meta.appendChild(metaLine);
        const tag = options.cardTag;
        meta.appendChild(el("span", tag.cls, tag.get(item)));

        const sleeve = el("span", prefix + "-card-sleeve");
        sleeve.setAttribute("aria-hidden", "true");
        sleeve.textContent = "OPEN";

        card.appendChild(el("span", prefix + "-card-no", pad(index + 1)));
        card.appendChild(img);
        card.appendChild(meta);
        card.appendChild(sleeve);
        strip.appendChild(card);
      });

      stage.appendChild(viewport);

      const dragWrap = el("div", prefix + "-stage-dragwrap");
      const range = document.createElement("input");
      range.type = "range";
      range.className = prefix + "-stage-range";
      range.min = "0";
      range.max = "100";
      range.step = "0.1";
      range.value = "0";
      range.dataset.cursor = "DRAG";
      range.setAttribute("aria-label", options.rangeAria);
      dragWrap.appendChild(range);
      stage.appendChild(dragWrap);

      const detail = el("section", prefix + "-stage-detail");
      detail.setAttribute("aria-label", options.detailAria);

      /* NO POSTER HERE, ON PURPOSE.
         The rail sits directly above this block, so a poster in both places
         put the same picture on screen twice, 60px apart. Measured across
         Criterion (48px thumbnail column inside a table), Hardwax (200px
         cover + hanging indent), Boomkat (155px pinned cover + padding-left,
         and it is their DEFAULT view) and Second Run: every one of them keeps
         the artwork at ONE size in the row and lets the selected item's detail
         be columns of type. No museum in the survey shows a same-screen
         selected panel at all. So this region carries no image, and the
         duplication stops being possible rather than being reduced. */
      const copy = el("div", prefix + "-detail-copy");
      const kicker = el("div", prefix + "-detail-kicker");
      /* the position marker ties the block to the card that is selected */
      kicker.appendChild(el("span", prefix + "-detail-index mono", ""));
      options.detailKicker(items[0] || {}).forEach((part) => {
        kicker.appendChild(el("span", part.cls, ""));
      });

      const title = el("h3", prefix + "-detail-title", "");

      const line = el("div", options.detailLine.cls, "");

      const quote = el("p", prefix + "-detail-quote", "");

      /* A real glass control, not an ink pill. The lens displacement map is
         authored for a wide flat bar and is deliberately NOT used here (it
         magnifies the centre of a small pill into a bright blob - reproduced
         on the selected pill). Its material comes from the blur, the tint and
         the specular rim, which is exactly what the accent variant is for. */
      const imdbButton = document.createElement("a");
      imdbButton.className =
        prefix + "-detail-imdb glass glass--pill glass--accent";
      imdbButton.href = "#";
      imdbButton.target = "_blank";
      imdbButton.rel = "noopener";
      imdbButton.dataset.cursor = "VIEW";
      ["glass__body", "glass__edge", "glass__press"].forEach((cls) => {
        const layer = document.createElement("span");
        layer.className = cls;
        layer.setAttribute("aria-hidden", "true");
        imdbButton.appendChild(layer);
      });
      const imdbLabel = document.createElement("span");
      imdbLabel.className = "glass__content";
      imdbLabel.textContent = "OPEN ON IMDb";
      imdbButton.appendChild(imdbLabel);

      copy.appendChild(kicker);
      copy.appendChild(title);
      copy.appendChild(line);
      copy.appendChild(quote);
      /* The action belongs to the READING column, not the identity column.
         It used to ride the trailing edge of the kicker row, which put the one
         clickable thing as far from what it acts on as the layout allowed. */
      copy.appendChild(imdbButton);
      detail.appendChild(copy);
      stage.appendChild(detail);
    }

    function renderDetail(stage, item, animate) {
      const title = q(stage, "." + prefix + "-detail-title");
      const line = q(stage, "." + options.detailLine.cls);
      const quote = q(stage, "." + prefix + "-detail-quote");
      const imdbButton = q(stage, "." + prefix + "-detail-imdb");
      if (!item) return;

      const indexEl = q(stage, "." + prefix + "-detail-index");
      if (indexEl) {
        /* the card carries its own id, so the marker is derived from the
           rendered strip rather than from a second source of truth */
        const cards = Array.from(stage.querySelectorAll("." + prefix + "-card"));
        const at = cards.findIndex(
          (c) => c.dataset[prefix + "Id"] === String(item.id)
        );
        indexEl.textContent = pad((at < 0 ? 0 : at) + 1) + " / " + pad(items.length);
      }
      const kickerSpans = stage.querySelectorAll("." + prefix + "-detail-kicker > span:not(." + prefix + "-detail-index)");
      options.detailKicker(item).forEach((part, i) => {
        if (kickerSpans[i]) kickerSpans[i].textContent = part.text;
      });
      title.textContent = item.title;
      tagLang(title, item.title);
      line.textContent = options.detailLine.get(item);
      tagLang(line, options.detailLine.get(item));
      quote.textContent = item.quote;
      tagLang(quote, item.quote);
      imdbButton.href = "https://www.imdb.com/title/" + item.imdb + "/";

      /* ONE calm settle for the whole block.

         This used to be a clip-path wipe, staggered across five elements:
         `inset(0 0 100% 0)` to `inset(0)`, 0.7s with a 0.07s step. Two things
         were wrong with it.

         It slices glyphs. The wipe is a hard horizontal edge travelling up
         through the text, so mid-flight every line is cut in half - measured
         at 120ms the kicker was clipped 54% and the title 84%, which is
         literally the bottom half of the letters missing. On a paper-white
         page of ink type that reads as flicker, not as a reveal.

         And it was slow. Last element starts at 0.33s and runs 0.7s, so a
         selection took about a second to land - for a panel whose whole job is
         letting you compare one entry against the next. Picking a different
         film should feel like the text was already there.

         The replacement is a single tween on the copy block: no clip, no
         stagger, 180ms. It confirms the panel changed without ever cutting a
         letter. */
      const copy = q(stage, "." + prefix + "-detail-copy");
      if (canTween() && animate && copy) {
        window.gsap.fromTo(
          copy,
          { opacity: 0, y: 6 },
          {
            opacity: 1,
            y: 0,
            duration: 0.18,
            ease: "power2.out",
            overwrite: true,
            clearProps: "opacity,transform"
          }
        );
      } else if (canTween() && copy) {
        window.gsap.set(copy, { clearProps: "opacity,transform" });
      }

    }

    /* state is a PARAMETER, not a lookup.
       This used to do `states.get(stage)` - the only reverse lookup in the
       file, where every other function takes state directly. When it missed,
       `if (state && ...)` skipped the centring with no error at all: the
       detail text still updated, so the panel looked like it had worked. */
    function selectCard(stage, state, card, animate) {
      if (!card || !state) return;
      const cards = Array.from(stage.querySelectorAll("." + prefix + "-card"));
      const index = cards.indexOf(card);
      if (index < 0) return;

      cards.forEach((item, i) => {
        const on = i === index;
        item.classList.toggle("is-active", on);
        item.setAttribute("aria-pressed", on ? "true" : "false");
      });

      renderDetail(stage, items[index], animate !== false);

      /* Selection centres the poster. This is the only thing that moves the
         rail on its own - the drag deliberately does not, and the rail is not
         a picker, so "the card in the middle" is not a second source of truth
         for "the card that is selected". The rail simply follows the choice.
         animate === false is the boot call, which must not fly the rail
         anywhere before the layout has settled. */
      if (animate !== false) {
        settle(stage, state, centeredX(state, index));
      }
    }

    function bindInteractions(stage, state) {
      const viewport = state.viewport;
      const range = state.range;

      /* ---------- swipe ----------
         The viewport is overflow:hidden and the strip moves on a transform,
         so a finger drag across it used to do NOTHING: the only touch path
         was the range track below. This drives the same setStrip() the range
         and the reveal already use, so the clamp, state.x and the range
         value keep exactly one owner.

         Pointer capture is taken only AFTER the threshold is crossed, never
         on pointerdown. Capturing on contact retargets the subsequent click
         to the viewport, which would break "tap a poster to open it". */
      var drag = null;
      var swiped = false;

      /* ---------- velocity, for the release ----------
         Embla's sliding window: keep the sample from ~170ms ago and divide by
         the elapsed time. The stale-flick guard is the part that matters - a
         user who flicks and then pauses before lifting has a stale last sample,
         and without the guard the rail launches anyway. */
      var vel = { x: 0, t: 0, sx: 0, st: 0 };
      function velReset(x) {
        vel.x = x; vel.t = performance.now();
        vel.sx = x; vel.st = vel.t;
      }
      function velSample(x) {
        var now = performance.now();
        if (now - vel.st > VEL_WINDOW) { vel.sx = vel.x; vel.st = vel.t; }
        vel.x = x; vel.t = now;
      }
      function velRead() {
        var dt = vel.t - vel.st;
        if (!dt || performance.now() - vel.t > VEL_WINDOW) return 0;
        var f = (vel.x - vel.sx) / dt;              // px per ms
        return Math.abs(f) > 0.1 ? f : 0;
      }


      viewport.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        /* Clear the swipe guard HERE, not only in the click handler.
           It used to be cleared by the click that follows a drag - but a drag
           that ends over a DIFFERENT card produces no click at all (down and
           up are on different elements), so the flag stayed set and silently
           ate the user's next genuine tap. Resetting per gesture bounds the
           suppression to the gesture that caused it. */
        swiped = false;
        state.offsets = null;
        resetMover(state);
        /* Grab from where the strip ACTUALLY is, not from state.x: a release
           tween commits state.x to its target immediately, so grabbing
           mid-settle would otherwise jump. */
        let live = state.x;
        if (canTween()) live = -Number(window.gsap.getProperty(state.strip, "x")) || 0;
        drag = {
          id: event.pointerId,
          pointerType: event.pointerType,
          startX: event.clientX,
          startAt: live,
          moved: false
        };
        velReset(live);
      });

      viewport.addEventListener("pointermove", (event) => {
        if (!drag || event.pointerId !== drag.id) return;
        const dx = event.clientX - drag.startX;
        if (!drag.moved && Math.abs(dx) < SWIPE_THRESHOLD) return;
        if (!drag.moved) {
          drag.moved = true;
          try { viewport.setPointerCapture(drag.id); } catch (err) { /* synthetic event */ }
          viewport.classList.add(prefix + "-stage-dragging");
        }
        /* Past the end the strip resists instead of stopping dead. */
        setStrip(stage, state, rubberBand(state, drag.startAt - dx), false, true);
        velSample(state.x);
      });

      function endSwipe(event) {
        if (!drag || (event && event.pointerId !== drag.id)) return;
        if (drag.moved) {
          swiped = true;
          try { viewport.releasePointerCapture(drag.id); } catch (err) { /* already released */ }
          viewport.classList.remove(prefix + "-stage-dragging");

          if (!event || event.type !== "pointercancel") {
            /* FREE BROWSE - no snap to card positions.
               Dragging moves the rail and nothing else: it does not change
               which poster is selected. Snapping to a card would park that card
               dead centre while a different card carried the ring, and the
               mismatch between "the one in the middle" and "the one that is
               selected" reads as a bug. So the release just carries the
               gesture's momentum and stops where the physics put it.

               Everything here is in STRIP space: state.x grows as the strip
               scrolls toward its end, so a positive force means the strip was
               travelling that way and the coast continues that way. (Sampling
               the finger instead would flip the sign.) */
            var force = velRead() * (drag.pointerType === "mouse" ? 400 : 600);
            settle(stage, state, Math.max(0, Math.min(state.x + force, maxX(state))));
          }
        }
        drag = null;
      }

      viewport.addEventListener("pointerup", endSwipe);
      viewport.addEventListener("pointercancel", endSwipe);

      viewport.addEventListener("click", (event) => {
        // a drag that ends back on the same poster must not also select it
        if (swiped) { swiped = false; return; }
        const card = event.target.closest("." + prefix + "-card");
        if (card) {
          /* Select - and selectCard centres the poster as part of selecting. */
          selectCard(stage, state, card, true);
        }
      });

      viewport.addEventListener("keydown", (event) => {
        const target = event.target.closest && event.target.closest("." + prefix + "-card");
        if (!target) return;
        const cards = Array.from(state.strip.querySelectorAll("." + prefix + "-card"));
        const index = cards.indexOf(target);
        if (index < 0) return;

        let next = -1;
        if (event.key === "ArrowRight") next = (index + 1) % cards.length;
        if (event.key === "ArrowLeft") next = (index - 1 + cards.length) % cards.length;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = cards.length - 1;
        if (next < 0) return;

        event.preventDefault();
        cards[next].focus({ preventScroll: true });
        /* selectCard centres now, so there is no separate reveal step. */
        selectCard(stage, state, cards[next], true);
      });

      /* While the thumb is held, setStrip must not write back into it: the
         control the user is dragging would fight the finger and inherit the
         same tween lag. */
      range.addEventListener("pointerdown", () => { state.rangeHeld = true; });
      range.addEventListener("pointerup", () => { state.rangeHeld = false; });
      range.addEventListener("pointercancel", () => { state.rangeHeld = false; });

      /* The thumb is a direct-manipulation control: the strip follows it 1:1,
         no tween. The tween is now only for a card reveal and a drag release,
         where nobody is holding anything. */
      range.addEventListener("input", () => {
        const ratio = parseFloat(range.value) / 100;
        setStrip(stage, state, ratio * maxX(state), false);
      });

      /* Keyboard focus selects; POINTER focus does not.
         A card is a <button>, so pressing down on one focuses it - and focus
         used to select. That quietly broke the whole browse gesture: putting a
         finger on a poster to drag the rail selected that poster (and fired a
         centring tween) before a single pixel had moved, so "dragging browses,
         it does not choose" was not true.
         :focus-visible is the platform's own answer to exactly this question -
         it matches keyboard focus and not a mouse press - so the two paths need
         no extra bookkeeping. */
      stage.addEventListener("focusin", (event) => {
        const card = event.target.closest && event.target.closest("." + prefix + "-card");
        if (!card) return;
        let keyboard = true;
        try { keyboard = card.matches(":focus-visible"); } catch (err) { /* old engine */ }
        if (keyboard) selectCard(stage, state, card, true);
      });

      stage.querySelectorAll("img").forEach((img) => {
        if (img.complete && img.naturalWidth) return;
        img.addEventListener(
          "load",
          () => {
            setupMode(stage, state);
            refreshScrollTrigger();
          },
          { once: true }
        );
        img.addEventListener(
          "error",
          () => refreshScrollTrigger(),
          { once: true }
        );
      });
    }

    /* Called on boot, on every poster load, and on resize - which is exactly
       when the strip's width changes, so this is the one place the cached
       measurements have to be thrown away. setupMode is also the only caller
       that re-clamps, so invalidating here keeps maxX and the card offsets in
       step with the layout without an extra observer. */
    function setupMode(stage, state) {
      state.maxX = null;
      state.offsets = null;
      /* Re-measure and re-clamp, but NEVER fight a running settle.
         This fires on every poster load, and setStrip writes state.x - which a
         settle has already committed to its TARGET. So a poster finishing its
         load mid-flight used to snap the rail straight to the end of the
         animation: a hidden jolt that only shows up on a cold cache or a slow
         connection, i.e. exactly when the rail is most likely to be moving. */
      if (state.settling) {
        refreshScrollTrigger();
        return;
      }
      setStrip(stage, state, state.x || 0, false);
      refreshScrollTrigger();
    }

    /* ---------- the rail's own entrance ----------
       Once, when the shelf first scrolls into view, and on the VIEWPORT rather
       than on the cards. A per-card stagger is arithmetically impossible here:
       16 and 19 posters at even a cheap 30ms each is already 1.62s before the
       last one starts, and the sourced ceiling for a UI transition is 300ms
       (ambient-only territory starts at 600ms). The clip-path wipe is the
       reveal language this component already uses for its detail text, so the
       rail inherits it rather than inventing a second one. */
    function bindReveal(stage, state) {
      if (!canTween() || REDUCED || !state.viewport) return;
      window.gsap.fromTo(
        state.viewport,
        { clipPath: "inset(0 100% 0 0)" },
        {
          clipPath: "inset(0 0% 0 0)",
          duration: 0.9,
          ease: "power3.out",
          clearProps: "clipPath",
          scrollTrigger: {
            trigger: stage,
            start: "top 88%",
            toggleActions: "play none none none",
            once: true
          }
        }
      );
    }

    function init(container) {
      if (!container || states.has(container)) return;
      render(container);

      const strip = q(container, "." + prefix + "-stage-strip");
      const state = {
        viewport: q(container, "." + prefix + "-stage-viewport"),
        strip: strip,
        range: q(container, "." + prefix + "-stage-range"),
        x: 0,
        moveTo: canTween()
          ? window.gsap.quickTo(strip, "x", {
              duration: 0.35,
              ease: "power2.out"
            })
          : null
      };
      states.set(container, state);

      bindInteractions(container, state);
      selectCard(container, state, state.strip.querySelector("." + prefix + "-card"), false);
      bindReveal(container, state);

      const boot = () => {
        setupMode(container, state);
        refreshScrollTrigger();
      };

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
      } else {
        requestAnimationFrame(boot);
      }

      const onTabClick = (event) => {
        const tab = event.target.closest && event.target.closest(".tab-btn[data-tab='" + options.tabToken + "']");
        if (!tab) return;
        window.setTimeout(() => setupMode(container, state), 420);
      };
      document.addEventListener("click", onTabClick);

      let resizeTimer = null;
      const onResize = () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => {
          setupMode(container, state);
          refreshScrollTrigger();
        }, 160);
      };
      window.addEventListener("resize", onResize);

      state.cleanup = () => {
        document.removeEventListener("click", onTabClick);
        window.removeEventListener("resize", onResize);
        window.clearTimeout(resizeTimer);
      };
    }

    function destroy(container) {
      const state = states.get(container);
      if (!state) return;
      if (state.cleanup) state.cleanup();
      if (state.moveTo && window.gsap) {
        window.gsap.killTweensOf(state.strip, "x");
      }
      states.delete(container);
      container.innerHTML = "";
    }

    function autoInit() {
      document
        .querySelectorAll(options.mountSelector)
        .forEach((container) => init(container));
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", autoInit);
    } else {
      autoInit();
    }

    return {
      init,
      destroy,
      get data() {
        return items.slice();
      }
    };
  };
})();
