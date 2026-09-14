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
       title, sub:      head texts ("TWENTY-FOUR FILMS", "MOTION / REEL")
       detailAria:      aria-label for the detail section
       sortKey:         item => number        // optional; the panel is shown as a
                                              //   timeline while the data file keeps
                                              //   its curated order
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
    /* The data files keep their curated order; the panels show a timeline. The
       sort lives here, not in the adapters, so both panels get it from one line
       of config and the data file stays the single canonical list. Array.sort is
       stable, so equal keys keep the curated order. */
    if (typeof options.sortKey === "function") {
      items = items.slice().sort(function (a, b) {
        return options.sortKey(a) - options.sortKey(b);
      });
    }
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

    /* ---------- the rail ----------

       The rail is a LAP, not a bounded strip: the poster set is laid down twice
       and the position is taken modulo one set width, so a drag never runs into
       an end and never shows blank paper. That is also what lets the FIRST
       poster reach the centre, which a clamped strip cannot do.

       state.pos is the single source of truth and it is deliberately UNBOUNDED:
       it grows as the rail is dragged, and only the transform, the range and the
       apex are derived from it through wrapPos().

       THE RAIL DOES NOT MOVE ON ITS OWN. There is no autoplay and no pause
       control, because there is nothing to pause: the focused poster is whatever
       sits at the apex, it is marked by rising one line with its title appearing
       underneath (see .is-active in css/reel-stage.css), and the only motion is
       the reader's - a drag carries momentum, and choosing a poster eases it to
       the apex.

       SEEK_TAU: seconds for that ease. */
    /* how many times the poster set is laid down: a lap needs at least two, so
       that the seam always has content on both sides of it */
    const CLONE_SETS = 2;
    const SEEK_TAU = 0.16;

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

    /* ---------- reel position: one continuous, wrapped lap ----------

       The rail is no longer a bounded strip clamped at both ends; it is a LAP.
       The card set is rendered twice and the position is taken modulo one set
       width, so there is no first card and no last card. That is also what
       finally lets the FIRST poster reach the apex - a clamped strip never
       could, because centring it needs a negative position, which is the same
       thing as half a viewport of blank paper at each end.

       state.pos is the single source of truth and it is deliberately UNBOUNDED:
       it keeps growing as the rail drifts, and only the transform, the range and
       the arc are derived from it through wrapPos(). Wrapping the state itself
       would make a seek across the seam take the long way round.

       Everything that moves the rail - the drift, a flick's momentum, a seek to
       a chosen poster, a finger - writes state.pos, and place() is the one
       function that turns it into pixels. There is deliberately NO GSAP tween on
       this element any more: a tween would be a second writer fighting the loop
       on every frame, and the loop is both cheaper and exact. */

    /* Cached. maxX() used to read strip.scrollWidth and viewport.clientWidth
       on EVERY call, and it is called on every pointermove - so the old version
       forced a style/layout flush per frame of every drag. */
    function measureMax(state) {
      /* viewportW and the lap are cached here because the drag writes the
         transform on every pointermove and must not read layout. */
      state.viewportW = state.viewport.clientWidth;
      /* One lap is the distance from the first card of copy 1 to the first card
         of copy 2 - measured from the DOM rather than derived from card width
         plus gap, so a CSS change to either cannot silently desync the wrap. */
      const all = state.allCards || [];
      const n = state.realCards ? state.realCards.length : 0;
      state.setW = (all.length > n && all[n])
        ? Math.max(1, all[n].offsetLeft - all[0].offsetLeft)
        : 1;
      state.maxX = state.setW;
      return state.maxX;
    }

    function maxX(state) {
      return state.maxX == null ? measureMax(state) : state.maxX;
    }

    /* The lap is the visual truth; state.pos is the logical one. */
    function wrapPos(state, p) {
      const w = state.setW || 1;
      const r = p % w;
      return r < 0 ? r + w : r;
    }

    /* THE ONE PLACE THE RAIL BECOMES PIXELS. Called by the motion loop, by the
       finger, and by nothing else. */
    function place(state, pos) {
      maxX(state);                       /* refreshes setW before the wrap */
      state.pos = pos;
      const x = wrapPos(state, pos);
      state.x = x;
      state.viewport.scrollLeft = 0;
      state.strip.style.transform = x ? "translate3d(" + -x + "px, 0, 0)" : "";
      syncApex(state);
      return x;
    }

    /* The rail has ONE writer: the motion loop, through place(). The drag calls
       place() directly on every pointermove, exactly as js/glass-pill.js writes
       the pill's transform, and exactly as AGENTS.md requires - the 1:1 rule the
       old quickTo broke by 131px at 1000px/s. Massing every write behind one
       function is what keeps the transform and the apex selection from ever
       disagreeing.

       There is no scrubber. The rail is dragged directly, in either direction,
       and the keyboard arrows step it; a second position control under the rail
       was only ever a mirror of those two, and it had to be told about every
       writer to stay honest. */

    /* Card offsets relative to the strip, cached.

       Used ONLY to work out where the rail has to sit for a card to be dead
       centre. The drag deliberately does NOT snap to these any more: snapping
       to a card position asserts "this card is the current one", and dragging
       is defined as browsing that does not change the selection. A rail parked
       on card 7 while card 3 carried the ring is a state that reads broken. */
    function cardOffsets(state) {
      if (state.offsets) return state.offsets;
      /* offsetLeft / offsetWidth, NEVER getBoundingClientRect. The cards are
         tilted on an arc now, and a rotated box reports its axis-aligned
         envelope - a 300px-tall card at 30deg reports ~150px of extra height.
         Feeding that envelope to the centring maths makes the target drift as
         a card travels, and the drift is worst exactly where the tilt is.
         offset* reads the LAYOUT box and ignores transforms, which is what
         "where would this card sit if it were flat" actually means. It needs
         the strip to be position:relative - that is the offsetParent. */
      state.offsets = Array.prototype.slice
        .call(state.strip.querySelectorAll("." + prefix + "-card"))
        .map((card) => ({ x: card.offsetLeft, w: card.offsetWidth }));
      return state.offsets;
    }

    /* Where the rail must sit for card `index` to be dead centre - as the
       NEAREST equivalent position to where the rail already is. On a lap every
       card has one centred position per copy, so the naive target would spin
       the rail most of a lap backwards whenever the chosen card happened to sit
       just across the seam. */
    function ringTarget(state, index) {
      const list = state.realCards || [];
      if (!list.length) return state.pos;
      const idx = ((index % list.length) + list.length) % list.length;
      let o = cardOffsets(state)[idx];
      if (!o) {
        const node = list[idx];
        if (!node) return state.pos;
        o = { x: node.offsetLeft, w: node.offsetWidth };
      }
      const base = o.x + o.w / 2 - state.viewport.clientWidth / 2;
      const w = state.setW || 1;
      return base + Math.round((state.pos - base) / w) * w;
    }

    /* Choosing a poster never teleports the rail. The detail and the ring change
       at once, the loop is handed a target and eases the rail over, and the
       reading window opens when it LANDS - so a long seek cannot eat into the
       time the reader was given. */
    function selectIndex(stage, state, index, animate) {
      const list = state.realCards || [];
      if (!state || !list.length) return;
      const idx = ((index % list.length) + list.length) % list.length;
      const item = items[idx];
      if (!item) return;

      state.apexIndex = idx;
      setActive(state, idx);
      renderDetail(stage, item, animate !== false);

      if (animate === false) {
        state.seekTarget = null;
        place(state, ringTarget(state, idx));
        return;
      }
      state.seekTarget = ringTarget(state, idx);
    }

    /* A chosen poster, by node. A clone resolves to the real card it mirrors,
       because every copy carries the same data id. */
    function selectCard(stage, state, card, animate) {
      if (!card || !state) return;
      const id = String(card.dataset[prefix + "Id"]);
      const idx = (state.realCards || []).findIndex(
        (c) => String(c.dataset[prefix + "Id"]) === id
      );
      if (idx < 0) return;
      selectIndex(stage, state, idx, animate);
    }

    /* ---------- the motion ----------

       There is exactly one kind, and it is all the reader's: a flick's momentum,
       which decays to rest, and the exponential ease that carries a chosen
       poster to the apex. Nothing moves on its own, so nothing needs a pause
       control and nothing needs a "held" flag. */

    /* ONE rAF loop owns the rail's motion: the seek, and the coast after a
       flick. Both are exponential approaches - monotone, never overshooting. */
    function frame(state, now) {
      state.raf = window.requestAnimationFrame((t) => frame(state, t));
      if (!state.last) { state.last = now; return; }
      const dt = Math.min(0.05, (now - state.last) / 1000);
      state.last = now;
      if (REDUCED || !state.setW) return;

      /* a seek outranks everything else: the reader asked for THIS poster */
      if (state.seekTarget != null) {
        const k = 1 - Math.exp(-dt / SEEK_TAU);
        state.pos += (state.seekTarget - state.pos) * k;
        state.vel = 0;
        if (Math.abs(state.seekTarget - state.pos) < 0.4) {
          state.pos = state.seekTarget;
          state.seekTarget = null;
        }
        place(state, state.pos);
        return;
      }

      /* A finger is the ONLY writer while it is down - not even the residue of
         the last flick may creep under it. Without this the position kept
         integrating for the half second the velocity took to decay, so a poster
         that had just been grabbed went on sliding under the finger. */
      if (state.dragActive) {
        state.vel = 0;
        return;
      }

      /* the coast after a release: momentum decaying to rest */
      state.vel *= Math.exp(-dt / 0.5);
      if (Math.abs(state.vel) < 1) { state.vel = 0; return; }
      place(state, state.pos + state.vel * dt);
    }

    /* The poster at the apex IS the chosen one. On a lap that is a pure
       function of the position, so nothing has to keep the two in step. */
    function syncApex(state) {
      const list = state.realCards || [];
      const all = state.allCards || [];
      if (!list.length || !all.length) return;
      const offs = cardOffsets(state);
      const apex = state.x + (state.viewportW || state.viewport.clientWidth) / 2;
      /* EVERY copy is a candidate, and the winner is mapped back to its item.
         Searching only the real cards was wrong in the one place it mattered
         most: just across the seam the poster on screen IS the clone, so the
         nearest real card was a whole lap away and the selection jumped to
         whichever poster happened to sit at the far end of the strip. */
      let best = 0;
      let bd = Infinity;
      for (let i = 0; i < all.length; i++) {
        const o = offs[i];
        if (!o) continue;
        const d = Math.abs(o.x + o.w / 2 - apex);
        if (d < bd) { bd = d; best = i % list.length; }
      }
      if (best === state.apexIndex) return;
      state.apexIndex = best;
      setActive(state, best);
      /* while a seek is running the detail already shows the poster that was
         asked for; trailering it through every card on the way would flicker */
      if (state.seekTarget == null) renderDetail(state.stage, items[best], true);
    }

    /* Marking the chosen poster. EVERY copy of it marks, because at a seam the
       copy on screen is the clone - but the copies sit a lap apart, so only one
       of them can ever be inside the viewport. */
    function setActive(state, index) {
      const item = items[index];
      const id = item ? String(item.id) : "";
      (state.allCards || []).forEach((card) => {
        const on = String(card.dataset[prefix + "Id"]) === id;
        card.classList.toggle("is-active", on);
        if (on) card.setAttribute("aria-pressed", "true");
        else if (!card.dataset[prefix + "Clone"]) card.setAttribute("aria-pressed", "false");
      });
    }

    /* One poster. Called once per copy: the second call builds the inert copy
       that makes the lap seamless. */
    function buildCard(item, index, clone) {
      const card = document.createElement("button");
      card.type = "button";
      card.className = prefix + "-card";
      card.dataset[prefix + "Id"] = item.id;
      card.dataset.cursor = "OPEN";
      card.setAttribute("role", "button");
      card.setAttribute("aria-pressed", index === 0 ? "true" : "false");
      card.setAttribute("aria-label", options.cardAria(item));
      if (clone) {
        card.dataset[prefix + "Clone"] = "true";
        card.setAttribute("aria-hidden", "true");
        card.tabIndex = -1;
      }

      const img = document.createElement("img");
      img.className = prefix + "-card-img";
      img.src = item.poster;
      img.alt = "";
      /* never a drag source: the browser's own image drag would fight the rail */
      img.draggable = false;
      img.loading = index === 0 && !clone ? "eager" : "lazy";
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
      return card;
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

      /* TWO COPIES, because the rail is a lap and a lap needs its content to
         repeat: without the second copy the wrap would open a hole at the seam.
         The clone is inert - aria-hidden, out of the tab order, and never the
         node the selection talks to - so a screen reader and the keyboard still
         see exactly sixteen posters, not thirty-two. */
      for (let copy = 0; copy < CLONE_SETS; copy++) {
        items.forEach((item, index) => {
          strip.appendChild(buildCard(item, index, copy > 0));
        });
      }

      stage.appendChild(viewport);

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
      const linkButton = document.createElement("a");
      linkButton.className =
        prefix + "-detail-link glass glass--pill glass--accent";
      linkButton.href = "#";
      linkButton.target = "_blank";
      linkButton.rel = "noopener";
      linkButton.dataset.cursor = "VIEW";
      ["glass__body", "glass__edge", "glass__press"].forEach((cls) => {
        const layer = document.createElement("span");
        layer.className = cls;
        layer.setAttribute("aria-hidden", "true");
        linkButton.appendChild(layer);
      });
      const linkLabel = document.createElement("span");
      linkLabel.className = "glass__content";
      linkLabel.textContent = "OPEN ON DOUBAN";
      linkButton.appendChild(linkLabel);

      copy.appendChild(kicker);
      copy.appendChild(title);
      copy.appendChild(line);
      copy.appendChild(quote);
      /* The action belongs to the READING column, not the identity column.
         It used to ride the trailing edge of the kicker row, which put the one
         clickable thing as far from what it acts on as the layout allowed. */
      copy.appendChild(linkButton);
      detail.appendChild(copy);
      stage.appendChild(detail);
    }

    function renderDetail(stage, item, animate) {
      const title = q(stage, "." + prefix + "-detail-title");
      const line = q(stage, "." + options.detailLine.cls);
      const quote = q(stage, "." + prefix + "-detail-quote");
      const linkButton = q(stage, "." + prefix + "-detail-link");
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
      /* Douban, not IMDb: the archive is read in Chinese and Douban is the
         page this reader actually opens. The id is the numeric subject id. */
      linkButton.href = "https://movie.douban.com/subject/" + item.douban + "/";

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

         The replacement is one settle: no clip, no stagger, 180ms. It confirms
         the panel changed without ever cutting a letter.

         THE FADE GOES ON THE TYPE, NEVER ON THE COLUMN.

         The column is an ANCESTOR of the accent glass button, and an ancestor
         at opacity < 1 erases that element's backdrop read (DESIGN.md 4.2 -
         measured there at ancestor opacity 0.99). Tweening the copy block
         therefore faded the champagne pill up out of the paper and then
         snapped it onto its real surface on the final frame: a flash around
         the button's label every time a different poster was chosen.

         The rise stays on the block, because transform IS safe on an ancestor
         - that is why the button still travels the 6px with the text it
         belongs to. Measured on the accent glass in the film panel (headless
         Chrome 152, DPR 1, interior mean RGB): settled 212,192,132; the block
         at opacity 0.6 -> 217,198,140, at 0.3 -> 227,218,187, at 0 ->
         239,239,234, which is the bare paper. */
      const copy = q(stage, "." + prefix + "-detail-copy");
      if (canTween() && copy) {
        /* the four type nodes, never the button that closes the column */
        const type = [
          q(stage, "." + prefix + "-detail-kicker"),
          title,
          line,
          quote
        ].filter(Boolean);
        if (animate) {
          window.gsap.fromTo(
            type,
            { opacity: 0 },
            {
              opacity: 1,
              duration: 0.18,
              ease: "power2.out",
              overwrite: true,
              clearProps: "opacity"
            }
          );
          window.gsap.fromTo(
            copy,
            { y: 6 },
            {
              y: 0,
              duration: 0.18,
              ease: "power2.out",
              overwrite: true,
              clearProps: "transform"
            }
          );
        } else {
          window.gsap.set(type.concat([copy]), {
            clearProps: "opacity,transform"
          });
        }
      }

    }

    function bindInteractions(stage, state) {
      const viewport = state.viewport;

      /* A poster must never start the browser's own image drag: it paints a
         translucent copy of the artwork that follows the cursor and fights the
         rail's own 1:1 gesture underneath. css/reel-stage.css takes the pointer
         off the image entirely and buildCard sets draggable=false; this cancels
         whatever is left. */
      viewport.addEventListener("dragstart", (event) => event.preventDefault());

      /* ---------- swipe ----------
         The viewport is overflow:hidden and the strip moves on a transform,
         so a finger drag across it used to do NOTHING. This writes the same
         place() the loop uses, so the transform and the apex keep exactly one
         owner.

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
        state.dragActive = true;
        /* a finger owns the rail while it is down: drop any seek, or the loop
           and the finger would be two writers on the same position */
        state.seekTarget = null;
        drag = {
          id: event.pointerId,
          pointerType: event.pointerType,
          startX: event.clientX,
          startAt: state.pos,
          moved: false
        };
        velReset(state.pos);
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
        /* 1:1, written straight into the position. Dragging right moves the
           rail right, which on this axis means the logical position decreases.
           No rubber band any more: a lap has no ends to resist against. */
        place(state, drag.startAt - dx);
        velSample(state.pos);
      });

      function endSwipe(event) {
        if (!drag || (event && event.pointerId !== drag.id)) return;
        if (drag.moved) {
          swiped = true;
          try { viewport.releasePointerCapture(drag.id); } catch (err) { /* already released */ }
          viewport.classList.remove(prefix + "-stage-dragging");

          if (!event || event.type !== "pointercancel") {
            /* The flick is handed to the loop as a VELOCITY, not converted into
               a tween target: the loop lets it decay into the drift speed, so
               the rail is already travelling again by the time the coast ends.
               That decay is the whole "spin it, let go, and it comes back"
               behaviour. Sampling is in strip space, so the sign carries over
               unchanged. */
            state.vel = velRead() * 1000;
          }
        }
        state.dragActive = false;
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
        const cards = state.realCards || [];
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
        if (keyboard) {
          /* Keyboard focus chooses. The same :focus-visible test the selection
             already trusts keeps a mouse press from choosing - pressing a
             poster focuses it too. */
          selectCard(stage, state, card, true);
        }
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
      /* The very first measurement happens while this panel may still be
         display:none inside an inactive tab - and a hidden panel measures every
         card at offset 0, so there is no lap to centre on. Remember that, and
         put the chosen poster back on the apex the first time there IS one. */
      const wasBlank = !state.setW || state.setW <= 1;
      /* Read the chosen index BEFORE place() re-derives it: with a blank
         measurement every card sits at 0, so the first real place() would
         declare whatever card happens to fall under the apex the "chosen" one
         and we would centre the wrong poster. */
      const keep = state.apexIndex || 0;
      state.maxX = null;
      state.offsets = null;
      /* The circle has to be re-derived with the viewport, or a resize leaves
         the fan tuned to the old width. This fires on every poster load and on
         every resize, and it simply re-measures and re-places: the loop owns the
         position, so there is nothing in flight to fight. The whole
         settle-vs-setupMode race the tween version had to guard against - and
         the flag that silently disabled this function when it leaked - went
         with the tween. */
      state.viewportW = state.viewport.clientWidth;
      /* place() -> maxX() -> measureMax() re-derives setW and the curve radius
         with it, so there is no second copy of that maths here. */
      place(state, state.pos || 0);
      if (wasBlank && state.realCards && state.realCards.length) {
        selectIndex(stage, state, keep, false);
      }
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
      /* The cards never change after render, so the paint loop holds them. The
         first `items.length` nodes are the real posters; everything after them
         is the inert copy that closes the lap. */
      const allCards = Array.prototype.slice.call(
        strip.querySelectorAll("." + prefix + "-card")
      );
      const state = {
        stage: container,
        viewport: q(container, "." + prefix + "-stage-viewport"),
        strip: strip,
        realCards: allCards.slice(0, items.length),
        allCards: allCards,
        /* the loop's state: pos is unbounded px, vel is px/s, setW is one lap */
        pos: 0,
        x: 0,
        vel: 0,
        last: 0,
        raf: 0,
        setW: 1,
        apexIndex: 0,
        seekTarget: null,
        viewportW: 0,
        dragActive: false
      };
      states.set(container, state);

      bindInteractions(container, state);
      selectIndex(container, state, 0, false);
      bindReveal(container, state);
      state.raf = window.requestAnimationFrame((t) => frame(state, t));

      const boot = () => {
        state.last = 0;
        setupMode(container, state);
        refreshScrollTrigger();
      };

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
      } else {
        requestAnimationFrame(boot);
      }

      /* Re-arm on every path that can reveal this panel. main.js's showMeta
         dispatches night:archive-tab for clicks, arrow keys, Home/End AND the
         draggable tab pill; a plain click listener only ever saw the first of
         those. The 420ms delay is the tab wipe's length - measuring earlier
         measures a panel that is still fully hidden. */
      const tabbar = document.getElementById("archive-tabbar");
      const onTabEvent = (event) => {
        if (!event.detail || event.detail.token !== options.tabToken) return;
        window.setTimeout(() => {
          state.last = 0;
          setupMode(container, state);
        }, 420);
      };
      if (tabbar) tabbar.addEventListener("night:archive-tab", onTabEvent);

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
        if (tabbar) tabbar.removeEventListener("night:archive-tab", onTabEvent);
        if (state.raf) window.cancelAnimationFrame(state.raf);
        window.removeEventListener("resize", onResize);
        window.clearTimeout(resizeTimer);
      };
    }

    function destroy(container) {
      const state = states.get(container);
      if (!state) return;
      if (state.cleanup) state.cleanup();
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
