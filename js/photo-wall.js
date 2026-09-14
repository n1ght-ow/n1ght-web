(function () {
  "use strict";

  /* The photography wall, and the full-screen view it lives in.

     WHERE THE LOOK COMES FROM. cmscurvegallery.framer.website, measured over
     CDP. The first attempt at this assumed a uniform grid and got it wrong:
     the reference is a JUSTIFIED layout. Every frame in a row shares one
     height, each frame keeps its OWN aspect ratio, and the row is stretched
     until it exactly fills its width - which is where the mosaic's
     irregularity comes from, because the frames run from 0.50 to 1.00 and no
     two rows pack the same way. Eleven 3:2 photographs cannot produce that
     without each tile taking its own aspect, so each tile draws one.

     THE SURFACE. The rows are laid out on a sphere whose centre is the viewer,
     so a frame further from the middle of the stage is larger, further from
     its neighbour, and turned away. Three transforms on three elements:

       .photo-wall          perspective: R
       .photo-wall__sphere  translateZ(R) rotateY(a)        <- the drag
       each frame           rotateY(-t) rotateX(phi) translateZ(-R)

     The sphere is pushed forward by exactly R so its centre lands on the
     viewer, and it is a ZERO-SIZE box because a stage-sized box sitting on the
     viewer's plane projects to infinity and Chrome then fails to raster whole
     columns of it. Both of those cost a bug; both are documented in
     css/photo-wall.css.

     THE PACKING, per row:
       tan(phi) is spaced evenly  ->  the rows are evenly spaced ON SCREEN,
       because screen y for a point at latitude phi is R * tan(phi).
       h_world = rowHeight * cos(phi), so the row renders at rowHeight.
       The parallel at phi is 2*PI*R*cos(phi) long, so that is the width the
       row must fill; tile count is estimated from it, the aspects are drawn
       from the PRNG, and h is solved so the row closes EXACTLY. That closure
       is what lets the whole ring be rotated forever without a seam.

     Two knobs, not interchangeable: R (via R_RATIO) is how much the wall
     curls, and the zoom is the row height - which is derived from the stage's
     own aspect rather than fixed, because the tile width follows from the
     aspect distribution and a portrait frame on a portrait screen has to be
     much smaller to keep the same number across. */

  var view = document.getElementById("photo-view");
  var wall = document.getElementById("photo-wall");
  var canvas = document.querySelector("[data-photo-fallback]");
  if (!view || !wall || !canvas) return;

  var frames = [].slice.call(canvas.querySelectorAll(".photo-frame"));
  if (frames.length < 2) return;
  var PHOTOS = frames.length;

  /* ---------- layout constants ---------- */

  /* sphere radius as a fraction of the stage width. The reference measures
     929px on a 1418px stage. */
  var R_RATIO = 0.66;
  /* The zoom, expressed as "how many rows fill the stage height" - but derived
     from the stage's own shape rather than fixed, because a portrait tile on a
     portrait screen has to be much smaller to keep the same number ACROSS.
     Fixed at 2 on a 390x844 phone the wall showed a single column; the
     reference shows about 2.5. Solving rows = H * A_PEAK / (k * W) for a
     frame that is k of the stage wide gives 3.46 * H / W at the reference's
     density: ~2.2 on a 1440x900 laptop, capped at 4.6 on a phone. */
  var ROWS_K = 3.46;
  var ROWS_MIN = 2.0;
  var ROWS_MAX = 4.6;
  /* Tile shape, as WIDTH / HEIGHT, before the perspective: the smaller this
     is the taller the frame. Triangular on [A_MIN, A_MAX] peaked at 0.80,
     which is where the reference's frames cluster (measured 0.60 to 1.24
     across its thirty-five tiles, and mostly 0.75-0.85). A_MEAN is only the
     mean of this distribution, and it is used for one thing: how far one
     arrow-key press turns the wall. Row packing draws and then solves, so it
     never depends on a guessed mean. */
  var A_MIN = 0.60;
  var A_MAX = 1.06;
  var A_SKEW = 1.55;
  var A_PEAK = 0.75;
  var A_MEAN = 0.70;
  /* hairline gutter, as measured off the reference (0.63vw at 1418px) */
  var GUT_MAX = 10;
  var GUT_MIN = 6;
  var GUT_VW = 0.0062;
  /* nothing past this longitude can be on screen; see cull() */
  var CULL = 60;
  /* pointer travel below this is a click, not a drag */
  var SLOP = 6;
  var DEG = 180 / Math.PI;

  var reduce =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- seeded random ----------
     A fresh seed per page load, held for the session: a resize must re-pack
     the same wall, not a new one, or the mosaic would reshuffle every time
     the window moves. */

  var seed = (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;

  function srand(s) {
    seed = s >>> 0;
  }

  function rand() {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  function aspect() {
    /* averaging two uniforms gives a triangular distribution; the skew moves
       its peak from the middle of the range down to A_PEAK */
    var t = (rand() + rand()) / 2;
    var at = (A_PEAK - A_MIN) / (A_MAX - A_MIN);
    return A_MIN + (A_MAX - A_MIN) * Math.pow(t, Math.log(at) / Math.log(0.5));
  }

  /* ---------- stage ---------- */

  var sphere = document.createElement("div");
  sphere.className = "photo-wall__sphere";

  var clones = [];
  var tiles = [];
  var radius = 1;
  var stepDeg = 12;
  var state = { a: 0 };
  var settle = null;
  var drag = null;
  var swiped = false;
  var built = false;
  var builtW = -1;
  var builtH = -1;
  var resizeTimer = 0;

  function makeClone(i) {
    var node = frames[i % PHOTOS].cloneNode(true);
    node.className = "photo-wall__tile";
    /* a duplicate is decorative: the same photograph is already a real control
       somewhere in the wall, so this one keeps the click but leaves the tab
       order and the accessibility tree */
    node.setAttribute("aria-hidden", "true");
    var cap = node.querySelector(".photo-frame-cap");
    if (cap && cap.parentNode) cap.parentNode.removeChild(cap);
    var btn = node.querySelector("button");
    if (btn) btn.tabIndex = -1;
    return node;
  }

  function ensureClones(n) {
    while (clones.length < n) clones.push(makeClone(clones.length));
  }

  /* Per-row height, as a stable function of the row index rather than of the
     order the rows happen to be walked in: the wall must re-pack identically
     for a given seed. The reference's rows are not one height either - that
     sameness is what makes a justified grid read as a spreadsheet. */
  function rowHeightFor(k, rowH) {
    var s = Math.sin(k * 12.9898 + 4.1) * 43758.5453;
    var f = s - Math.floor(s);
    return rowH * (0.90 + 0.20 * f);
  }

  function shuffleBag() {
    var bag = [];
    for (var i = 0; i < PHOTOS; i++) bag.push(i);
    for (var j = bag.length - 1; j > 0; j--) {
      var k = Math.floor(rand() * (j + 1));
      var t = bag[j];
      bag[j] = bag[k];
      bag[k] = t;
    }
    return bag;
  }

  function layout(W, H) {
    var gutter = Math.min(GUT_MAX, Math.max(GUT_MIN, W * GUT_VW));
    var R = R_RATIO * W;
    var rowsVisible = Math.min(ROWS_MAX, Math.max(ROWS_MIN, (ROWS_K * H) / W));
    var rowH = H / rowsVisible;
    var maxTan = (H / 2 + rowH) / R;

    /* Walk outwards from the equator. tan(phi) is spaced by half of each
       neighbouring row's own height, because screen y for latitude phi is
       R * tan(phi) - so unequal row heights stay equally gapped on screen. */
    var rows = [{ phi: 0, screenH: rowHeightFor(0, rowH) }];
    var tUp = 0;
    var tDown = 0;
    var prevUp = rows[0].screenH;
    var prevDown = rows[0].screenH;
    for (var k = 1; k < 40; k++) {
      var hUp = rowHeightFor(k, rowH);
      var hDown = rowHeightFor(k + 100, rowH);
      var nUp = tUp + ((prevUp + hUp) / 2 + gutter) / R;
      var nDown = tDown + ((prevDown + hDown) / 2 + gutter) / R;
      if (nUp > maxTan && nDown > maxTan) break;
      if (nUp <= maxTan) rows.push({ phi: Math.atan(nUp), screenH: hUp });
      if (nDown <= maxTan) rows.push({ phi: -Math.atan(nDown), screenH: hDown });
      tUp = nUp;
      tDown = nDown;
      prevUp = hUp;
      prevDown = hDown;
    }

    var out = [];
    var bag = shuffleBag();
    var bagAt = 0;

    for (var r = 0; r < rows.length; r++) {
      var lat = rows[r].phi;
      var cos = Math.cos(lat);
      var circ = 2 * Math.PI * R * cos;
      var worldH = rows[r].screenH * cos;
      /* THE ROW HEIGHT IS THE TARGET and the widths absorb the slack, not the
         other way round. Solving the height instead (h = (circ - n*g)/sum)
         always comes out below the target, because the row is drawn until it
         overflows and the last tile is never given back - measured 10% short,
         which opened a 40px black band under every row. Keeping h and scaling
         the widths by circ/their-natural-width closes the ring EXACTLY and
         moves each aspect by a few percent, which is invisible. It also means
         the gap between rows is exactly one gutter, at every latitude. */
      var n = Math.max(3, Math.round(circ / (worldH * A_MEAN + gutter)));
      var as = [];
      var sum = 0;
      for (var i = 0; i < n; i++) {
        var a = aspect();
        as.push(a);
        sum += a;
      }
      var h = worldH;
      var slack = circ / (sum * h + n * gutter);
      var x = 0;
      for (var j = 0; j < n; j++) {
        var w = h * as[j] * slack;
        if (bagAt >= bag.length) {
          bag = shuffleBag();
          bagAt = 0;
        }
        out.push({
          theta: ((x + w / 2) / (R * cos)) * DEG,
          phi: lat,
          w: w,
          h: h,
          photo: bag[bagAt++]
        });
        x += w + gutter;
      }
    }

    return { tiles: out, R: R, gutter: gutter, stepDeg: ((rowH * A_MEAN + gutter) / R) * DEG };
  }

  function build() {
    var W = wall.clientWidth;
    var H = wall.clientHeight;
    if (W < 2 || H < 2) return;

    srand(seed);
    var g = layout(W, H);
    radius = g.R;
    stepDeg = g.stepDeg;

    wall.style.setProperty("--wall-r", g.R.toFixed(2) + "px");

    ensureClones(g.tiles.length - PHOTOS);
    var frag = document.createDocumentFragment();
    var canon = {};
    var pool = 0;
    tiles = [];

    for (var i = 0; i < g.tiles.length; i++) {
      var t = g.tiles[i];
      var el;
      /* the eleven real figures are the eleven tab stops, and each one lands
         on the first tile that carries its photograph - so tab order, DOM
         order and data-photo-index all still agree */
      if (canon[t.photo] === undefined) {
        canon[t.photo] = i;
        el = frames[t.photo];
      } else {
        el = clones[pool++];
        el.setAttribute("data-photo-index", String(t.photo));
      }
      el.style.setProperty("--wall-w", t.w.toFixed(1) + "px");
      el.style.setProperty("--wall-h", t.h.toFixed(1) + "px");
      el.style.setProperty(
        "--wall-t",
        "translate(-50%,-50%) rotateY(" + (-t.theta).toFixed(4) + "deg)" +
          " rotateX(" + (t.phi * DEG).toFixed(4) + "deg)" +
          " translateZ(" + (-g.R).toFixed(2) + "px)"
      );
      el.__wallTheta = t.theta;
      tiles.push({ el: el, theta: t.theta, hidden: null });
      frag.appendChild(el);
    }

    while (pool < clones.length) {
      var extra = clones[pool++];
      if (extra.parentNode) extra.parentNode.removeChild(extra);
    }

    sphere.appendChild(frag);
    builtW = W;
    builtH = H;
    built = true;
    write(state.a);
  }

  /* ---------- the single write ---------- */

  function cull() {
    for (var i = 0; i < tiles.length; i++) {
      var t = tiles[i];
      var lon = (((t.theta - state.a) % 360) + 540) % 360 - 180;
      var hide = lon > CULL || lon < -CULL;
      if (hide === t.hidden) continue;
      t.hidden = hide;
      t.el.style.visibility = hide ? "hidden" : "";
    }
  }

  function write(a) {
    sphere.style.transform =
      "translateZ(" + radius.toFixed(2) + "px) rotateY(" + a.toFixed(3) + "deg)";
    cull();
  }

  function settleTo(target) {
    if (settle) {
      settle.kill();
      settle = null;
    }
    var dist = Math.abs(target - state.a);
    var dur = reduce ? 0 : Math.min(1.1, Math.max(0.25, dist / 900));
    if (dur === 0 || !window.gsap) {
      state.a = target;
      write(state.a);
      return;
    }
    settle = gsap.to(state, {
      a: target,
      duration: dur,
      /* distance-proportional, and power3.out never overshoots: the wall
         settles onto the lattice instead of bouncing past it */
      ease: "power3.out",
      overwrite: true,
      onUpdate: function () {
        write(state.a);
      },
      onComplete: function () {
        settle = null;
      }
    });
  }

  /* ---------- drag ---------- */

  function onMove(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > SLOP) drag.moved = true;
    /* 1:1 by construction: the pointer travels dx across a ring of radius R,
       so the wall turns by dx / R radians. No easing, no lerp, no tween - the
       lag that comes from pushing every move through an interpolator is
       already documented in js/reel-stage.js (131px at 1000px/s). */
    state.a = drag.a - (dx / radius) * DEG;
    drag.samples.push([e.timeStamp, state.a]);
    if (drag.samples.length > 8) drag.samples.shift();
    write(state.a);
  }

  function endDrag(e) {
    if (!drag || (e && e.pointerId !== undefined && e.pointerId !== drag.id)) return;
    var moved = drag.moved;
    var samples = drag.samples;
    drag = null;
    swiped = moved;
    wall.classList.remove("is-dragging");
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerup", endDrag);
    document.removeEventListener("pointercancel", endDrag);
    if (!moved) return;

    /* velocity from the tail of the gesture only: a pointer that stopped
       before release must not fling */
    var v = 0;
    if (samples.length > 1) {
      var lastT = samples[samples.length - 1][0];
      var first = samples[0];
      for (var i = 0; i < samples.length; i++) {
        if (lastT - samples[i][0] <= 100) {
          first = samples[i];
          break;
        }
      }
      var dt = lastT - first[0];
      if (dt > 0) v = (samples[samples.length - 1][1] - first[1]) / dt;
    }
    if (reduce || Math.abs(v) < 0.02) return;
    settleTo(state.a + v * 300);
  }

  function onDown(e) {
    if (drag) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    /* cleared here, never left to the click that may never come: a drag that
       ends over ANOTHER frame produces no click at all, and the flag would
       then eat the next honest tap */
    swiped = false;
    drag = { id: e.pointerId, x: e.clientX, a: state.a, moved: false, samples: [] };
    wall.classList.add("is-dragging");
    if (settle) {
      settle.kill();
      settle = null;
    }
    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerup", endDrag);
    document.addEventListener("pointercancel", endDrag);
  }

  wall.addEventListener("pointerdown", onDown);
  wall.addEventListener("dragstart", function (e) {
    e.preventDefault();
  });

  /* A drag must not also open the viewer. Capture phase, so this settles it
     before js/main.js sees the click at all. e.detail === 0 is a click the
     keyboard made (Enter on a focused frame), which is never a drag. */
  wall.addEventListener(
    "click",
    function (e) {
      if (!swiped || e.detail === 0) {
        swiped = false;
        return;
      }
      swiped = false;
      e.stopPropagation();
      e.preventDefault();
    },
    true
  );

  /* ---------- wheel ---------- */

  wall.addEventListener(
    "wheel",
    function (e) {
      /* Horizontal intent only. The view does swallow vertical wheel while it
         is open, but the wall itself must not: a trackpad two-finger scroll
         still has to be able to leave. */
      var d = e.deltaX;
      if (e.shiftKey && Math.abs(e.deltaY) > Math.abs(d)) d = e.deltaY;
      if (!d) return;
      settleTo(state.a + (d / radius) * DEG);
    },
    { passive: true }
  );

  /* ---------- keyboard ---------- */

  /* On the VIEW, not the wall: when the view opens, focus is on the Close
     pill, which is not inside the wall - bound to the wall the arrows did
     nothing until the reader had already tabbed into a frame. */
  view.addEventListener("keydown", function (e) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    settleTo(state.a + (e.key === "ArrowRight" ? stepDeg : -stepDeg));
  });

  /* Keyboard focus brings its frame to the front. Gated on :focus-visible
     because pointerdown focuses the button too - without the gate, putting a
     finger on the wall would already count as choosing a frame, which is the
     same trap js/reel-stage.js documents. */
  wall.addEventListener("focusin", function (e) {
    var btn = e.target && e.target.closest ? e.target.closest(".photo-frame-btn") : null;
    if (!btn || !btn.matches(":focus-visible")) return;
    var fig = btn.closest("[data-photo-index]");
    if (!fig || typeof fig.__wallTheta !== "number") return;
    var cur = state.a;
    /* shortest way round, so tabbing backwards does not unwind the wall */
    var delta = (((fig.__wallTheta - cur) % 360) + 540) % 360 - 180;
    settleTo(cur + delta);
  });

  /* ---------- the view ---------- */

  var closeBtn = view.querySelector(".photo-view__close");
  var lastFocus = null;

  function isOpen() {
    return view.classList.contains("is-open");
  }

  function setInert(on) {
    ["main", "footer"].forEach(function (sel) {
      var el = document.querySelector(sel);
      if (!el) return;
      if (on) el.setAttribute("inert", "");
      else el.removeAttribute("inert");
    });
  }

  function lock(on) {
    if (!window.NightScroll) return;
    if (on) window.NightScroll.stop();
    else window.NightScroll.start();
  }

  function open(trigger) {
    if (isOpen()) return;
    lastFocus = trigger || document.activeElement;
    view.hidden = false;
    /* force layout so the wall has a box to measure before it is revealed */
    void view.offsetWidth;
    if (!built || wall.clientWidth !== builtW || wall.clientHeight !== builtH) {
      if (!sphere.parentNode) wall.appendChild(sphere);
      if (canvas) {
        for (var i = 0; i < frames.length; i++) sphere.appendChild(frames[i]);
      }
      build();
    }
    view.classList.add("is-open");
    lock(true);
    setInert(true);
    if (closeBtn) closeBtn.focus();
  }

  function close() {
    if (!isOpen()) return;
    view.classList.remove("is-open");
    lock(false);
    setInert(false);
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
    lastFocus = null;
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", function () {
      close();
    });
  }

  /* Capture phase on purpose: js/main.js turns every in-page anchor into a
     lenis scroll, and the chapter link must open the view instead of scrolling
     to it. Stopping the event here is what keeps the two from both firing. */
  document.addEventListener(
    "click",
    function (e) {
      var target = e.target;
      if (!target || !target.closest) return;
      var opener = target.closest('a[href="#photo"], [data-photo-open]');
      if (opener) {
        e.preventDefault();
        e.stopPropagation();
        open(opener);
        return;
      }
      if (!isOpen()) return;
      /* any other in-page jump means leaving: hand the page back first */
      if (target.closest('a[href^="#"]')) close();
    },
    true
  );

  /* #lightbox can be opened from the wall. Closing it clears every inert
     attribute and hands the page its scroll back, neither of which is true
     while the wall is still up, so the wall restates both. */
  document.addEventListener("night:detail-closed", function () {
    if (!isOpen()) return;
    lock(true);
    setInert(true);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape" || !isOpen()) return;
    /* the viewer sits above the wall; when it is up, Escape is its key */
    var lb = document.getElementById("lightbox");
    if (lb && lb.classList.contains("is-open")) return;
    e.preventDefault();
    close();
  });

  /* ---------- rebuild ---------- */

  function schedule() {
    if (!isOpen()) return;
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      resizeTimer = 0;
      if (wall.clientWidth === builtW && wall.clientHeight === builtH) return;
      build();
    }, 150);
  }

  if (window.ResizeObserver) new ResizeObserver(schedule).observe(wall);
  else window.addEventListener("resize", schedule);

  /* read-only surface for the self-check and for anyone debugging the wall */
  window.PhotoWall = {
    get radius() {
      return radius;
    },
    get angle() {
      return state.a;
    },
    get tiles() {
      return tiles.length;
    },
    get visible() {
      var n = 0;
      for (var i = 0; i < tiles.length; i++) if (!tiles[i].hidden) n++;
      return n;
    },
    get state() {
      return { photos: PHOTOS, reduce: reduce, built: built };
    },
    open: open,
    close: close,
    isOpen: isOpen,
    to: settleTo,
    rebuild: build,
    /* a new wall without a reload: the seed is the whole layout, so this is
       also how a layout gets reproduced when something looks wrong */
    reseed: function (s) {
      seed = (s === undefined ? (Date.now() ^ (Math.random() * 0xffffffff)) : s) >>> 0;
      if (built) build();
      return seed;
    },
    get seed() {
      return seed;
    }
  };
})();
