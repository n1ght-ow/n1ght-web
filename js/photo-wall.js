(function () {
  "use strict";

  /* The photography wall. One stage of frames, arranged on the inside of a
     sphere around the viewer and dragged sideways forever.

     Where the look comes from: cmscurvegallery.framer.website renders its
     gallery as frames that carry a full 3D matrix each, all nominally the same
     size and placed entirely by transform. Measured over CDP, the further a
     frame sits from the middle of the screen the larger it is and the wider
     the gap to its neighbour (centre 393px, edge 822px). That is what a
     surface wrapping AROUND the viewer does, so this is built as one: frames
     tangent to a sphere of radius R with the viewer at its CENTRE.

     The construction is three transforms on three elements, and the split is
     the whole trick:

       .photo-wall          perspective: R
       .photo-wall__sphere  translateZ(R) rotateY(a)     <- the drag
       each frame           rotateY(-s*STEP) rotateX(phi) translateZ(-R) ...

     The sphere is pushed forward by exactly R, which puts its centre on the
     viewer and the viewer INSIDE the sphere. Without that translateZ the
     sphere sits at z = 0, the viewer ends up on its surface instead, and the
     whole wall renders at half size with its far half mirrored into the middle
     of the screen. That failure has been seen.

     What the model buys, with no per-frame math:
       - a frame dead ahead is on the projection plane, so it renders at its
         own CSS size: the tile width in px is literally what you see;
       - a frame at angle t is magnified by sec(t) and its gap by sec(t)^2, so
         the mosaic loosens towards the edges like the reference;
       - the projection supplies the lean, so nothing is skewed by hand.

     Geometry. Two knobs, and they are not interchangeable:
       SLOTS - frames per ring, i.e. how much the wall curls. It must stay a
               multiple of the photo count: a duplicate 180 degrees away is
               never on screen, a nearer one would be.
       COLS  - frame centres across the stage, i.e. the zoom.
     R and the row step both follow from those. R is never authored.

     The back half of the sphere is CULLED, not hidden by luck: past 90 degrees
     a frame is behind the viewer, its projected w goes negative and Chrome
     paints it mirrored across the middle of the stage, at enormous scale near
     the singularity. cull() keeps only the slots whose longitude is inside
     +/-60, which is well past the ~37 degrees the stage can actually show.

     Everything below writes one property per frame, once per build; during a
     drag the sphere gets one direct transform write per frame and nothing is
     tweened - the strip experience in js/reel-stage.js applies here too. */

  var wall = document.querySelector("[data-photo-wall]");
  if (!wall) return;

  var frames = Array.prototype.slice.call(wall.querySelectorAll(".photo-frame"));
  if (frames.length < 2) return;

  var PHOTOS = frames.length;
  /* a ring of 2x the photos: the duplicate of any frame is always 180 degrees
     away, and the visible span never reaches that far */
  var SLOTS = PHOTOS * 2;
  /* how many slots each row is staggered by, so no two rows line up into a
     vertical seam */
  var SHIFT = 4;
  /* rows are generated to cover the stage plus one row of bleed either side;
     past this the tile count stops being worth it on a tall narrow screen */
  var MAX_ROWS = 7;
  /* the sphere is only ever sampled near its equator: past this latitude the
     parallels converge and the correction starts eating the frames */
  var MAX_PHI = 40 * Math.PI / 180;
  /* nothing past this longitude can be on screen; see the header */
  var CULL = 60;
  /* pointer travel below this is a click, not a drag */
  var SLOP = 6;
  var DEG = 180 / Math.PI;
  var STEP = 360 / SLOTS;

  var reduce =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- stage ---------- */

  var sphere = document.createElement("div");
  sphere.className = "photo-wall__sphere";
  frames.forEach(function (frame) {
    sphere.appendChild(frame);
  });
  wall.appendChild(sphere);

  /* duplicates, built once and re-used across rebuilds */
  var clones = [];
  /* tiles grouped by slot, so culling is per column and not per frame */
  var bySlot = [];
  var hidden = [];
  var radius = 1;
  var state = { a: 0 };
  var settle = null;
  var drag = null;
  var swiped = false;
  var resizeTimer = 0;
  var builtW = -1;
  var builtH = -1;

  function makeClone(i) {
    var node = frames[i % PHOTOS].cloneNode(true);
    node.className = "photo-wall__tile";
    /* a duplicate is decorative: the same photo is already a real control in
       the middle row, so this one keeps the click but leaves the tab order and
       the accessibility tree */
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

  function rowsFor(pitch, gutter, h) {
    var tileH = (pitch - gutter) * 2 / 3;
    return Math.ceil(h / (tileH + gutter)) + 2;
  }

  function geometry() {
    var w = wall.clientWidth || 1;
    var h = wall.clientHeight || 1;
    var gutter = Math.min(10, Math.max(6, w * 0.0062));
    var cols = w >= 1100 ? 5.2 : w >= 720 ? 4.2 : 3.2;
    var pitch = w / cols;
    var rows = rowsFor(pitch, gutter, h);
    if (rows > MAX_ROWS) {
      /* Too many rows to be worth it. Solve for the row step that makes six
         rows cover the stage and pin the count, rather than scaling a guess:
         pitchY = (pitch - gutter) * 2/3 + gutter is affine, so it inverts. */
      var target = h / (MAX_ROWS - 2);
      pitch = (target - gutter) * 1.5 + gutter;
      rows = rowsFor(pitch, gutter, h);
    }
    var tileW = pitch - gutter;
    var tileH = tileW * 2 / 3;
    /* the ring closes at 2PI/SLOTS, so the radius is whatever makes one slot
       subtend exactly the on-screen pitch. tan, not the arc: the projection is
       rectilinear, and using the arc here widens every gutter by ~15%. */
    var R = pitch / Math.tan((2 * Math.PI) / SLOTS);
    return {
      gutter: gutter,
      tileW: tileW,
      tileH: tileH,
      rows: rows,
      R: R,
      dPhi: Math.atan((tileH + gutter) / R)
    };
  }

  function build() {
    var g = geometry();
    radius = g.R;

    wall.style.setProperty("--wall-r", g.R.toFixed(2) + "px");
    wall.style.setProperty("--wall-tile-w", g.tileW.toFixed(2) + "px");
    wall.style.setProperty("--wall-tile-h", g.tileH.toFixed(2) + "px");

    var midRow = Math.round((g.rows - 1) / 2);
    var total = g.rows * SLOTS;
    ensureClones(total - PHOTOS);

    var frag = document.createDocumentFragment();
    var c = 0;
    bySlot = [];
    for (var s = 0; s < SLOTS; s++) bySlot.push([]);

    for (var r = 0; r < g.rows; r++) {
      var phi = (r - midRow) * g.dPhi;
      if (phi > MAX_PHI) phi = MAX_PHI;
      else if (phi < -MAX_PHI) phi = -MAX_PHI;
      var phiDeg = phi * DEG;
      /* the parallel at latitude phi is smaller by cos(phi); without this the
         frames of the outer rows overlap instead of keeping their gutter */
      var squash = Math.cos(phi);
      var shift = (r - midRow) * SHIFT;

      for (var s2 = 0; s2 < SLOTS; s2++) {
        /* the middle row IS the canonical set: photo i sits at slot i, so
           "bring photo i to the front" is just "rotate to i * STEP" and the
           eleven real buttons never move between rows */
        var canonical = r === midRow && s2 < PHOTOS;
        var photo = canonical ? s2 : (((s2 + shift) % PHOTOS) + PHOTOS) % PHOTOS;
        var el = canonical ? frames[s2] : clones[c++];
        if (!canonical) el.setAttribute("data-photo-index", String(photo));
        el.style.setProperty(
          "--wall-t",
          "translate(-50%,-50%) rotateY(" + (-s2 * STEP).toFixed(4) + "deg)" +
            " rotateX(" + phiDeg.toFixed(4) + "deg)" +
            " translateZ(" + (-g.R).toFixed(2) + "px)" +
            " scaleX(" + squash.toFixed(5) + ")"
        );
        bySlot[s2].push(el);
        frag.appendChild(el);
      }
    }

    /* detach anything a previous, larger build had left attached */
    while (c < clones.length) {
      var extra = clones[c++];
      if (extra.parentNode) extra.parentNode.removeChild(extra);
    }

    sphere.appendChild(frag);
    /* null, not false: false is the value cull() compares against, so seeding
       it would make every already-visible column skip its write and keep
       whatever visibility the PREVIOUS build left on the re-used clone. The
       wall builds twice on load (the ResizeObserver fires once on observe), so
       that is not a hypothetical - it left half the ring dark. */
    hidden = [];
    for (var i = 0; i < SLOTS; i++) hidden.push(null);
    builtW = wall.clientWidth;
    builtH = wall.clientHeight;
    wall.classList.add("is-built");
    /* write(), not cull(): the sphere's own translateZ is half of the
       projection and has to be re-stated whenever R changes. Leaving it out is
       invisible until the FIRST resize, and then the sphere keeps the old
       radius while --wall-r takes the new one, so every frame renders at the
       wrong scale against the wrong horizon. Seen at 390px: the tiles came out
       at 82% and the rows overlapped. */
    write(state.a);
  }

  /* ---------- the single write ---------- */

  function cull() {
    for (var s = 0; s < SLOTS; s++) {
      /* longitude of this column relative to the front of the stage */
      var lon = (((state.a - s * STEP) % 360) + 540) % 360 - 180;
      var hide = lon > CULL || lon < -CULL;
      if (hide === hidden[s]) continue;
      hidden[s] = hide;
      var arr = bySlot[s];
      for (var i = 0; i < arr.length; i++) {
        arr[i].style.visibility = hide ? "hidden" : "";
      }
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
      /* distance-proportional, and power3.out never overshoots: the frames
         settle onto the lattice instead of bouncing past it */
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
      /* Horizontal intent only. The reference site can swallow vertical wheel
         because the wall IS the page; here the wall is one screen of a long
         document, and eating deltaY would trap the reader inside it. Trackpad
         sideways swipe, shift+wheel and the drag all still turn the wall. */
      var d = e.deltaX;
      if (e.shiftKey && Math.abs(e.deltaY) > Math.abs(d)) d = e.deltaY;
      if (!d) return;
      /* half a screen of travel is half a screen of wall */
      settleTo(state.a + (d / radius) * DEG);
    },
    { passive: true }
  );

  /* ---------- keyboard ---------- */

  wall.addEventListener("keydown", function (e) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    settleTo(state.a + (e.key === "ArrowRight" ? STEP : -STEP));
  });

  /* Keyboard focus brings its frame to the front. Gated on :focus-visible
     because pointerdown focuses the button too - without the gate, putting a
     finger on the wall would already count as choosing a frame, which is the
     same trap js/reel-stage.js documents. */
  wall.addEventListener("focusin", function (e) {
    var btn = e.target && e.target.closest ? e.target.closest(".photo-frame-btn") : null;
    if (!btn || !btn.matches(":focus-visible")) return;
    var fig = btn.closest("[data-photo-index]");
    if (!fig) return;
    var i = Number(fig.getAttribute("data-photo-index"));
    if (!(i >= 0)) return;
    var cur = state.a;
    /* shortest way round, so tabbing backwards does not unwind the wall */
    var delta = (((i * STEP - cur) % 360) + 540) % 360 - 180;
    settleTo(cur + delta);
  });

  /* ---------- rebuild ---------- */

  function schedule() {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      resizeTimer = 0;
      /* the observer fires once as soon as it is attached, with the size the
         first build already used; rebuilding there is pure waste */
      if (wall.clientWidth === builtW && wall.clientHeight === builtH) return;
      build();
    }, 150);
  }

  build();

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
      return sphere.children.length;
    },
    get visible() {
      var n = 0;
      for (var s = 0; s < SLOTS; s++) if (!hidden[s]) n += bySlot[s].length;
      return n;
    },
    get state() {
      return { photos: PHOTOS, slots: SLOTS, step: STEP, reduce: reduce };
    },
    to: settleTo,
    rebuild: build
  };
})();
