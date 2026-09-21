(function () {
  "use strict";

  /* The photography board.

     WHERE THE LOOK COMES FROM. PhantomInfiniteGallery, a Framer code component
     (https://framer.com/m/PhantomInfiniteGallery-KBne.js), read line by line and
     rebuilt here in plain DOM. It is a BOARD, not a carousel: a window of cells
     over an infinite plane, dragged in two axes with momentum, its cells turned
     on a cylinder centred on the board, its mouse offset eased behind the
     pointer. No WebGL, no React, no new dependency - the reference is divs,
     transforms and one rAF, and so is this.

     WHAT CHANGED FOR A PAPER PAGE, and why:
       - the board is IN the chapter, one band tall, not a full-screen layer. The
         reference is a black canvas with nothing around it; ours sits between
         the section head and the poem, so it reads as part of the page.
       - no background colour, no dark vignette, no cell fill, no pink hover.
         Colour here is the photographs' reward, not the interface's.
       - cells are 3:2, not square: the reference covers a square with the
         artwork and crops a third of a landscape frame. Twenty-one 3:2
         photographs go in uncropped.
       - captions stay out of the cells (sr-only, as the ring wall before it).
       - the throw STOPS. The reference deliberately never comes to rest (it
         holds a 1e-4 residual velocity); a board that creeps forever is wrong to
         read and keeps the compositor awake.
       - touch-action is pan-y, not none: inline, swallowing vertical touch would
         be a scroll trap.

     THE PLANE IS PERIODIC. A cell's content is a pure function of its WORLD
     coordinates - index = |(x + 3y) mod n|, the reference's diagonal rhythm - so
     panning forever never runs out and the same world cell always shows the same
     photograph. The pattern repeats every n columns, and every n / gcd(3, n)
     rows - 21 and 7 at the current n, which is what lets the focus pan below
     take the SHORT way round. The board is under four rows tall, so the shorter
     row period can never read as a repeat.

     THE TWENTY-ONE AUTHORED FIGURES ARE CELLS, NOT DECORATION. They sit in
     world row 0 at x = 0..20 and are never recycled; every other visible cell is a
     pooled clone of one of them, aria-hidden and out of the tab order. That is
     the same contract the ring wall had, so main.js still finds exactly
     twenty-one .photo-frame elements and still delegates clicks on #photo-wall
     once. */

  var wall = document.getElementById("photo-wall");
  var canvas = document.querySelector("[data-photo-fallback]");
  if (!wall || !canvas) return;

  /* ---------- the knobs ----------
     The board's HEIGHT comes from css/photo-wall.css (clamp(400px, 62vh,
     720px)); --pw-cell and --pw-cell-h are written from here. Neither side keeps
     a second copy of the other's numbers.

     CELL_MIN is the phone end and stays where it was: at a 350px board a 132px
     cell already fills 38% of the width, and one more step up would leave two
     columns and kill the plane. Everything from about 730px of viewport upward
     is governed by CELL_VW, and CELL_MAX is the guard above it. */
  var CELL_MIN = 132;          /* px, the narrow end */
  var CELL_VW = 0.20;          /* share of the board's width */
  var CELL_MAX = 280;          /* px, the wide end */
  var IMG_RATIO = 3 / 2;       /* the photographs' own ratio: no crop */
  var GAP = 18;                /* px between cells, both axes */
  var MARGIN = 1;              /* extra ring of cells around the window */

  /* The arc. ARC_MAX_ANGLE is the reference's 28deg cut down for a band: on a
     black canvas the turn is what sells the space, on paper it only has to be
     legible. ARC_AMOUNT scales it again, exactly as the reference does, and
     EDGE_FADE / EDGE_OPACITY are the reference's own edge falloff. */
  var ARC_MAX_ANGLE = 18;
  var ARC_AMOUNT = 1;
  var ARC_CLAMP = 1.2;         /* cells past the edge stop turning */
  var EDGE_FADE = 0.18;
  var EDGE_OPACITY = 0.4;

  var PARALLAX_STRENGTH = 0.06;   /* the reference's .1, softened for a band */
  var PARALLAX_EASE = 0.12;

  var THROW_FRICTION = 0.92;
  var THROW_MIN = 80;          /* px/s: below this a release is not a throw */
  var THROW_MAX = 2500;
  var REST = 1;                /* px/s: below this the board is stopped */
  var DRAG_THRESHOLD = 4;      /* px before a press becomes a drag */
  var SWIPE_SLOP = 6;          /* px before a drag eats the click */
  var HOLD_ZOOM_DELAY = 320;   /* ms held without moving before it zooms out */
  var HOLD_ZOOM_VALUE = 0.7;
  var SEEK_TAU = 0.16;         /* s, the ease that frames a chosen photograph */

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- the twenty-one, and the plane ---------- */
  var figures = Array.prototype.slice.call(canvas.querySelectorAll(".photo-frame"));
  if (!figures.length) return;
  var PHOTOS = figures.length;
  var srcs = figures.map(function (f) {
    var img = f.querySelector("img");
    return img ? img.getAttribute("src") : "";
  });

  var layer = document.createElement("div");
  layer.className = "photo-wall__layer";
  wall.appendChild(layer);

  /* the authored figures move in as themselves: same nodes, same data, same
     buttons. Nothing is rebuilt, so main.js's node list and every aria-label
     survive the move. */
  figures.forEach(function (f) {
    f.classList.add("photo-cell");
    /* never a drag source: the browser's own image drag paints a translucent
       copy of the artwork that fights the board's 1:1 gesture. The clones are
       copied FROM these nodes, so setting it here covers every cell. */
    var img = f.querySelector("img");
    if (img) img.draggable = false;
    layer.appendChild(f);
  });

  var built = false;
  var vw = 0, vh = 0, cellW = 0, cellH = 0, pitchX = 1, pitchY = 1, radius = 1;

  /* pos is the board's offset in px and unbounded, par is the mouse offset, size
     is the hold-zoom factor. There is ONE writer of all three: frame(). */
  var pos = { x: 0, y: 0 };
  var vel = { x: 0, y: 0 };
  var par = { x: 0, y: 0 }, parWant = { x: 0, y: 0 };
  var size = 1, sizeWant = 1;
  var seek = null;             /* the offset the board is easing toward */
  var raf = 0, last = 0;

  var pool = new Map();        /* "x,y" -> node, for the cells that ARE clones */
  var free = [];

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* The reference's calcArcTransform, horizontal branch, kept as it wrote it:
     the angle is the cell centre's normalised distance from the board's centre
     times the maximum, the radius is the one that puts the edge cell exactly at
     that maximum, and z pulls the cell toward the reader - so the SIDES come
     forward and the middle sits back, the "standing inside a cylinder" read.
     rotateY(-angle) turns the cell to stay tangent to that cylinder. */
  function calcArc(centerX) {
    var dx = (centerX - vw / 2) / (vw / 2);
    var a = (clamp(dx, -ARC_CLAMP, ARC_CLAMP) * ARC_MAX_ANGLE * ARC_AMOUNT * Math.PI) / 180;
    var edge = Math.min(1, Math.abs(dx));
    return {
      z: -radius * (Math.cos(a) - 1),
      yaw: (-a * 180) / Math.PI,
      scale: 1 - EDGE_FADE * edge * edge,
      opacity: 1 - EDGE_OPACITY * edge * ARC_AMOUNT
    };
  }

  /* Keeps the world point under the pivot still while the cell size changes -
     the reference's computePinnedOffset, with the PITCH as the px-per-world
     unit (the reference can use its cell size there because in the reference the
     cell IS the pitch). Without this the hold-zoom would slide the board out
     from under the thing the reader was looking at. */
  function pinned(prevPitch, nextPitch, pivot, offset) {
    var worldX = (pivot.x - offset.x) / prevPitch.x;
    var worldY = (pivot.y - offset.y) / prevPitch.y;
    return { x: pivot.x - worldX * nextPitch.x, y: pivot.y - worldY * nextPitch.y };
  }

  /* Shortest way round the pattern, per axis: a focus pan never walks the board
     more than half a period. */
  function wrapDelta(delta, period) {
    var d = delta % period;
    if (d > period / 2) d -= period;
    if (d < -period / 2) d += period;
    return d;
  }

  function measure() {
    vw = wall.clientWidth;
    vh = wall.clientHeight;
    cellW = Math.round(clamp(vw * CELL_VW, CELL_MIN, CELL_MAX));
    cellH = Math.round(cellW / IMG_RATIO);
    pitchX = cellW + GAP;
    pitchY = cellH + GAP;
    radius = vw / (2 * Math.sin((ARC_MAX_ANGLE * Math.PI) / 180)) || 1;
    wall.style.setProperty("--pw-cell", cellW + "px");
    wall.style.setProperty("--pw-cell-h", cellH + "px");
  }

  function itemAt(x, y) {
    return Math.abs((x + y * 3) % PHOTOS);
  }

  /* The authored twenty-one own world row 0; anywhere else is a clone of
     whatever the pattern asks for. */
  function canonicalAt(x, y) {
    return y === 0 && x >= 0 && x < PHOTOS ? x : -1;
  }

  /* ---------- the window ---------- */

  function makeClone() {
    var node = figures[0].cloneNode(true);
    node.className = "photo-cell";
    /* a duplicate is decoration: the same photograph is already a real control
       in the board, so this one keeps the click (main.js reads its index) but
       leaves the tab order and the accessibility tree */
    node.setAttribute("aria-hidden", "true");
    var cap = node.querySelector(".photo-frame-cap");
    if (cap && cap.parentNode) cap.parentNode.removeChild(cap);
    var btn = node.querySelector("button");
    if (btn) btn.tabIndex = -1;
    return node;
  }

  /* A cell is addressed by its WORLD slot, so it keeps its content for as long
     as it lives: panning a column costs one cell, not a boardful of src swaps. */
  function acquire(x, y) {
    var node = free.pop();
    if (!node) {
      node = makeClone();
      layer.appendChild(node);
    }
    node.style.display = "";
    var item = itemAt(x, y);
    node.setAttribute("data-photo-index", String(item));
    var img = node.querySelector("img");
    if (img) {
      var src = srcs[item];
      if (img.getAttribute("src") !== src) img.setAttribute("src", src);
      img.setAttribute("alt", "");
    }
    return node;
  }

  function place(node, x, y, scale) {
    var left = x * pitchX * scale + pos.x + par.x;
    var top = y * pitchY * scale + pos.y + par.y;
    var arc = calcArc(left + (cellW * scale) / 2);
    /* ONE transform write per cell per frame, and it carries the position too:
       writing left/top would flush layout on every frame of every drag. */
    node.style.transform =
      "translate3d(" + left.toFixed(2) + "px," + top.toFixed(2) + "px," +
      arc.z.toFixed(2) + "px) rotateY(" + arc.yaw.toFixed(3) + "deg) scale(" +
      (arc.scale * scale).toFixed(4) + ")";
    node.style.opacity = arc.opacity.toFixed(3);
  }

  function paint() {
    var px = pitchX * size;
    var py = pitchY * size;
    var x0 = Math.floor(-(pos.x + par.x) / px) - MARGIN;
    var x1 = Math.ceil((vw - pos.x - par.x) / px) + MARGIN;
    var y0 = Math.floor(-(pos.y + par.y) / py) - MARGIN;
    var y1 = Math.ceil((vh - pos.y - par.y) / py) + MARGIN;
    var live = {};
    var x, y, key, node;
    for (y = y0; y <= y1; y++) {
      for (x = x0; x <= x1; x++) {
        key = x + "," + y;
        if (canonicalAt(x, y) >= 0) continue;
        node = pool.get(key);
        if (!node) {
          node = acquire(x, y);
          pool.set(key, node);
        }
        live[key] = 1;
        place(node, x, y, size);
      }
    }
    pool.forEach(function (n, k) {
      if (live[k]) return;
      n.style.display = "none";
      free.push(n);
      pool["delete"](k);
    });
    for (var i = 0; i < PHOTOS; i++) place(figures[i], i, 0, size);
  }

  /* ---------- the one loop ---------- */

  function busy() {
    return dragging || seek || Math.abs(vel.x) + Math.abs(vel.y) > REST ||
      Math.abs(par.x - parWant.x) + Math.abs(par.y - parWant.y) > 0.5 ||
      size !== sizeWant;
  }

  /* Starts the loop if it is not already running. It must NOT touch the clock:
     frame() re-kicks itself, so zeroing last here zeroes dt on EVERY frame and
     silently kills everything that depends on time - the throw, the seek, the
     size ease. It did. Measured before the fix: 30 frames in 500ms all with
     dt 0, and a 2490px/s throw that never moved a pixel. The clock is set once,
     when it has never run, and a long idle is absorbed by the clamp below. */
  function kick() {
    if (raf) return;
    raf = window.requestAnimationFrame(frame);
    /* the layer promotion in css/photo-wall.css is scoped to this class: it
       goes on with the loop and comes off when the loop parks */
    wall.classList.add("is-live");
  }

  function frame(now) {
    raf = 0;
    if (!last) last = now;
    var dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;

    /* the hold-zoom eases the cell size and re-pins the offset as it goes */
    if (size !== sizeWant) {
      var next = size + (sizeWant - size) * 0.15;
      if (Math.abs(next - sizeWant) < 0.002) next = sizeWant;
      pos = pinned(
        { x: pitchX * size, y: pitchY * size },
        { x: pitchX * next, y: pitchY * next },
        { x: vw / 2, y: vh / 2 },
        pos
      );
      size = next;
    }

    if (seek) {
      var k = 1 - Math.exp(-dt / SEEK_TAU);
      pos = { x: pos.x + (seek.x - pos.x) * k, y: pos.y + (seek.y - pos.y) * k };
      if (Math.abs(seek.x - pos.x) < 0.5 && Math.abs(seek.y - pos.y) < 0.5) {
        pos = { x: seek.x, y: seek.y };
        seek = null;
      }
    } else if (!dragging) {
      var speed = Math.hypot(vel.x, vel.y);
      if (speed > REST) {
        var f = Math.pow(THROW_FRICTION, dt * 60);
        vel = { x: vel.x * f, y: vel.y * f };
        pos = { x: pos.x + vel.x * dt, y: pos.y + vel.y * dt };
      } else if (speed) {
        vel = { x: 0, y: 0 };
      }
    }

    par = {
      x: par.x + (parWant.x - par.x) * PARALLAX_EASE,
      y: par.y + (parWant.y - par.y) * PARALLAX_EASE
    };
    if (Math.abs(par.x - parWant.x) < 0.1 && Math.abs(par.y - parWant.y) < 0.1) {
      par = { x: parWant.x, y: parWant.y };
    }

    paint();
    if (busy()) kick();
    else wall.classList.remove("is-live");
  }

  /* ---------- the hand ---------- */

  var drag = null;
  var dragging = false;
  var swiped = false;
  var holdFired = false;
  var holdTimer = 0;
  var lastMove = { x: 0, y: 0, t: 0 };
  var velNow = { x: 0, y: 0 };
  var resizeTimer = 0;

  function localPoint(e) {
    var r = wall.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  /* The hold-zoom keeps the world point under the CENTRE still while the cells
     shrink - the reference's one "step back and look at the whole board"
     gesture, held rather than toggled. */
  function zoom(target) {
    pos = pinned(
      { x: pitchX * size, y: pitchY * size },
      { x: pitchX * target, y: pitchY * target },
      { x: vw / 2, y: vh / 2 },
      pos
    );
    seek = null;
    sizeWant = target;
    kick();
  }

  function onDown(e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    /* a new press takes the board as it looks right now: a throw still running
       must not be added to the drag */
    vel = { x: 0, y: 0 };
    seek = null;
    swiped = false;
    holdFired = false;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, ox: pos.x, oy: pos.y, moved: false };
    lastMove = { x: e.clientX, y: e.clientY, t: performance.now() };
    velNow = { x: 0, y: 0 };
    /* Only a press that does NOT become a drag counts as a hold; the delay is
       long enough that an ordinary click never reaches it. */
    if (!reduce) {
      window.clearTimeout(holdTimer);
      holdTimer = window.setTimeout(function () {
        if (!drag || drag.moved) return;
        holdFired = true;
        zoom(HOLD_ZOOM_VALUE);
      }, HOLD_ZOOM_DELAY);
    }
  }

  function onMove(e) {
    if (!drag) {
      if (reduce) return;
      /* the reference eases the whole board away from the pointer: the one piece
         of motion here that is not the reader's own */
      var p = localPoint(e);
      parWant = {
        x: (vw / 2 - p.x) * PARALLAX_STRENGTH,
        y: (vh / 2 - p.y) * PARALLAX_STRENGTH
      };
      kick();
      return;
    }
    if (drag.id !== e.pointerId) return;
    var dx = e.clientX - drag.x;
    var dy = e.clientY - drag.y;
    if (!drag.moved && Math.abs(dx) + Math.abs(dy) < DRAG_THRESHOLD) return;
    if (!drag.moved) {
      drag.moved = true;
      dragging = true;
      wall.classList.add("is-dragging");
      /* THE DRAG WRITES PAINT() DIRECTLY, so it never goes through kick() -
         and kick() is what turns the cells' layer promotion on. Without this
         the one gesture that writes a transform and an opacity for every cell
         on every frame would be the one gesture running unpromoted. The class
         comes off again in onUp, once nothing is moving. */
      wall.classList.add("is-live");
      window.clearTimeout(holdTimer);
      try { wall.setPointerCapture(drag.id); } catch (err) { /* older engine */ }
    }
    if (Math.abs(dx) > SWIPE_SLOP || Math.abs(dy) > SWIPE_SLOP) swiped = true;
    var now = performance.now();
    var dtms = Math.max(1, now - lastMove.t);
    var vx = clamp(((e.clientX - lastMove.x) / dtms) * 1000, -THROW_MAX, THROW_MAX);
    var vy = clamp(((e.clientY - lastMove.y) / dtms) * 1000, -THROW_MAX, THROW_MAX);
    velNow = { x: vx * 0.6 + velNow.x * 0.4, y: vy * 0.6 + velNow.y * 0.4 };
    lastMove = { x: e.clientX, y: e.clientY, t: now };
    /* 1:1, straight onto the offset: the drag NEVER goes through a tween */
    pos = { x: drag.ox + dx, y: drag.oy + dy };
    paint();
  }

  function onUp(e) {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    var moved = drag.moved;
    drag = null;
    dragging = false;
    window.clearTimeout(holdTimer);
    wall.classList.remove("is-dragging");
    if (holdFired) {
      /* the press became a look-closer, so it is not also a click */
      holdFired = false;
      zoom(1);
      return;
    }
    if (moved) {
      if (!reduce && Math.hypot(velNow.x, velNow.y) >= THROW_MIN) vel = velNow;
      kick();
      return;
    }
    vel = { x: 0, y: 0 };
    /* a press that never became a drag leaves nothing to animate; the class
       added above only exists on the drag path, this is the belt to it */
    if (!busy()) wall.classList.remove("is-live");
  }

  function onLeave() {
    parWant = { x: 0, y: 0 };
    kick();
  }

  /* Horizontal wheel only, plus Shift+wheel: this board is one band inside a
     long document, so eating a plain deltaY would be a scroll trap - with the
     pointer over the board the page would stop scrolling. (The guard used to
     read "if there is no deltaX, take deltaY", which is exactly that trap.) */
  function onWheel(e) {
    var dx = e.deltaX;
    if (Math.abs(dx) < 0.5 && e.shiftKey) dx = e.deltaY;
    if (e.deltaMode === 1) dx *= 16;
    if (!dx) return;
    e.preventDefault();
    seek = null;
    vel = { x: 0, y: 0 };
    pos = { x: pos.x - dx * 1.6, y: pos.y };
    kick();
  }

  /* An image must never start the browser's own drag: it paints a translucent
     copy of the artwork that follows the cursor while the board's 1:1 gesture
     runs underneath. css/photo-wall.css takes the pointer off the image
     entirely; this cancels whatever is left. */
  function onDragStart(e) { e.preventDefault(); }

  /* A drag is browsing, so it must not also be a click. Captured, because the
     click lands whether or not the pointer is still over the cell. */
  function onClickCapture(e) {
    if (e.detail === 0) return;                 /* keyboard Enter still opens */
    if (swiped || holdFired) {
      swiped = false;
      e.stopPropagation();
      e.preventDefault();
    }
  }

  /* Keyboard focus frames its photograph. The pattern repeats every PHOTOS
     cells, so the pan takes the short way round instead of walking the plane.
     Gated on :focus-visible because pointerdown focuses the button too. */
  function onFocusIn(e) {
    var btn = e.target && e.target.closest ? e.target.closest(".photo-frame-btn") : null;
    if (!btn || !btn.matches(":focus-visible")) return;
    var fig = btn.closest("[data-photo-index]");
    if (!fig) return;
    var i = Number(fig.getAttribute("data-photo-index"));
    if (!(i >= 0 && i < PHOTOS)) return;
    var want = {
      x: pos.x + wrapDelta((vw - cellW * size) / 2 - i * pitchX * size - pos.x, pitchX * size * PHOTOS),
      y: pos.y + wrapDelta((vh - cellH * size) / 2 - pos.y, pitchY * size * PHOTOS)
    };
    if (reduce) { pos = want; paint(); return; }
    vel = { x: 0, y: 0 };
    seek = want;
    kick();
  }

  /* The arrows step one photograph at a time once something in the board has
     focus - the same contract as the film rail's arrow keys. */
  function onKeyDown(e) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    var step = e.key === "ArrowRight" ? -pitchX * size : pitchX * size;
    if (reduce) { pos = { x: pos.x + step, y: pos.y }; paint(); return; }
    vel = { x: 0, y: 0 };
    seek = { x: pos.x + step, y: pos.y };
    kick();
  }

  wall.addEventListener("pointerdown", onDown);
  wall.addEventListener("pointermove", onMove);
  wall.addEventListener("pointerup", onUp);
  wall.addEventListener("pointercancel", onUp);
  wall.addEventListener("pointerleave", onLeave);
  wall.addEventListener("wheel", onWheel, { passive: false });
  wall.addEventListener("dragstart", onDragStart);
  wall.addEventListener("click", onClickCapture, true);
  wall.addEventListener("focusin", onFocusIn);
  wall.addEventListener("keydown", onKeyDown);

  /* ---------- build ---------- */

  function build() {
    measure();
    size = 1;
    sizeWant = 1;
    /* the board opens ON the twenty-one: the authored row is centred, and the
       pattern fills in around it */
    pos = {
      x: ((vw - cellW) / 2) - ((PHOTOS - 1) / 2) * pitchX,
      y: (vh - cellH) / 2
    };
    par = { x: 0, y: 0 };
    parWant = { x: 0, y: 0 };
    vel = { x: 0, y: 0 };
    seek = null;
    built = true;
    paint();
  }

  function schedule() {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(function () {
      var before = { w: vw, h: vh };
      measure();
      if (!built || before.w !== vw || before.h !== vh) paint();
    }, 150);
  }
  window.addEventListener("resize", schedule);

  var boot = function () {
    build();
    kick();
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    window.requestAnimationFrame(boot);
  }

  /* read-only surface for the self-check and for anyone debugging the board */
  window.PhotoWall = {
    get cell() {
      return { w: cellW, h: cellH, pitchX: pitchX, pitchY: pitchY, scale: size };
    },
    get offset() {
      return { x: pos.x, y: pos.y, parX: par.x, parY: par.y, seek: seek };
    },
    get cells() {
      return { pooled: pool.size, free: free.length, authored: PHOTOS };
    },
    get velocity() {
      return { x: vel.x, y: vel.y, dragVelocity: velNow, dragging: dragging, raf: raf };
    },
    get state() {
      return { photos: PHOTOS, reduce: reduce, built: built, radius: radius };
    },
    to: function (index) {
      var i = Number(index);
      if (!(i >= 0 && i < PHOTOS)) return null;
      pos = {
        x: pos.x + wrapDelta(((vw - cellW * size) / 2) - i * pitchX * size - pos.x, pitchX * size * PHOTOS),
        y: pos.y + wrapDelta(((vh - cellH * size) / 2) - pos.y, pitchY * size * PHOTOS)
      };
      seek = null;
      paint();
      return { x: pos.x, y: pos.y };
    },
    zoom: function (v) {
      zoom(v === undefined ? HOLD_ZOOM_VALUE : v);
    },
    stop: function () {
      vel = { x: 0, y: 0 };
      seek = null;
      sizeWant = 1;
      paint();
    }
  };
})();
