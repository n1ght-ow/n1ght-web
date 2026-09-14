/* ============================================================
   N1GHT CHXN9 - the smooth cursor.

   A vanilla port of Framer's "Smoothcursor"
   (https://framer.com/m/Smoothcursor-o8zdlR.js). The original is React +
   framer-motion; this site has neither and does not gain them. This file is
   the whole dependency, and it fetches nothing.

   WHAT IT DOES
   The native arrow is switched off and an SVG arrow is drawn in its place. It
   does not sit under the pointer - a spring pulls it there - so a fast flick
   reads as the arrow catching up instead of teleporting. While it travels it
   turns to face the direction of travel and squishes to 0.95; while the button
   is down it shrinks to 0.7.

   THREE SPRINGS, NONE OF THEM OVERSHOOTING
   position k400 c45 m1 (zeta 1.13) . rotation k300 c60 (zeta 1.73) .
   scale k500 c45 (zeta 1.01). Stepped semi-implicitly in fixed 1/120s slices,
   so the feel does not change with the refresh rate. The upstream scale
   spring is c35 - zeta 0.78, measured overshoot 0.64%, which is 0.26px on a
   40px arrow: invisible, but springs are retired site-wide for overshoot
   alone, so the damping was raised instead of the rule being bent.

   THE TIP IS THE HOTSPOT
   The arrow pivots on its own point and that point is what lands on the
   pointer, so the pixel the user aims with is the pixel they click with. The
   upstream component centres the whole 40px box on the pointer instead, which
   puts the tip 18.2px above it (measured off the rendered box). Geometry is
   read from css/smooth-cursor.css - never written down twice.

   NOT ENABLED WHEN
   - the pointer is coarse, or the device reports touch: there is no hover to
     follow and the arrow would fight the finger;
   - narrower than 768px, or portrait: the same three constraints the component
     ships with;
   - prefers-reduced-motion. The pointer is a machine the user is holding, and
     a lagging arrow is the one motion that cannot be made static, so it is
     removed rather than stilled: the native cursor simply stays.
   The first three are repeated as a media query in css/smooth-cursor.css, so
   a failure here can never leave the page with no cursor at all.

   ONE FRAME LOOP, STOPPED WHEN IDLE
   Position goes straight to transform every frame (never left/top) on a fixed,
   pointer-events:none layer - the same discipline as the reel, the board and
   the pill. The loop stops the moment all four springs settle and restarts on
   the next pointer move, so a still pointer costs nothing.
   ============================================================ */

(function () {
  "use strict";

  var FINE = "(pointer: fine) and (min-width: 768px) and (orientation: landscape)";
  var COARSE = "(pointer: coarse)";
  var REDUCED = "(prefers-reduced-motion: reduce)";

  /* The elements that keep the native cursor and hide the arrow. This is the
     same list as the :is(...) rule in css/smooth-cursor.css - the CSS is what
     actually repaints the caret, this is only what tells the arrow to step
     aside. Keep the two identical. */
  var NATIVE_CURSOR = "input, textarea, [contenteditable]:not([contenteditable='false'])";

  var SPRINGS = {
    position: { k: 400, c: 45, m: 1 },
    rotation: { k: 300, c: 60, m: 1 },
    scale: { k: 500, c: 45, m: 1 }
  };

  var STEP = 1 / 120;        /* fixed integration slice, seconds */
  var MAX_STEPS = 8;         /* a stalled tab never turns into a spiral */
  var REST_DIST = 0.5;       /* px / deg / scale units */
  var REST_SPEED = 4;        /* px per second */
  var TURN_MIN_SPEED = 100;  /* px per second; below it the heading holds */
  var SQUISH = 0.95;
  var SQUISH_HOLD = 150;     /* ms */
  var PRESS = 0.7;
  var OFFSCREEN = -200;

  /* The default icon, path data unchanged from the component. Fill and stroke
     are left to CSS so the two colours stay on the site's tokens. */
  var ARROW =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 54" fill="none" aria-hidden="true" focusable="false">' +
      '<g filter="url(#sc-shadow)">' +
        '<path class="sc-fill" d="M42.6817 41.1495L27.5103 6.79925C26.7269 5.02557 24.2082 5.02558 23.3927 6.79925L7.59814 41.1495C6.75833 42.9759 8.52712 44.8902 10.4125 44.1954L24.3757 39.0496C24.8829 38.8627 25.4385 38.8627 25.9422 39.0496L39.8121 44.1954C41.6849 44.8902 43.4884 42.9759 42.6817 41.1495Z"/>' +
        '<path class="sc-line" d="M43.7146 40.6933L28.5431 6.34306C27.3556 3.65428 23.5772 3.69516 22.3668 6.32755L6.57226 40.6778C5.3134 43.4156 7.97238 46.298 10.803 45.2549L24.7662 40.109C25.0221 40.0147 25.2999 40.0156 25.5494 40.1082L39.4193 45.254C42.2261 46.2953 44.9254 43.4347 43.7146 40.6933Z" stroke-width="2.25825"/>' +
      "</g>" +
      '<defs><filter id="sc-shadow" x=".602397" y=".952444" width="49.0584" height="52.428" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">' +
        '<feFlood flood-opacity="0" result="BackgroundImageFix"/>' +
        '<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>' +
        '<feOffset dy="2.25825"/><feGaussianBlur stdDeviation="2.25825"/>' +
        '<feComposite in2="hardAlpha" operator="out"/>' +
        '<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0"/>' +
        '<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>' +
        '<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>' +
      "</filter></defs>" +
    "</svg>";

  var el = null;
  var mounted = false;
  var visible = false;
  var yielding = false;

  var raf = 0;
  var lastFrame = 0;
  var squishTimer = 0;
  var pressed = false;

  var sizeW = 0;
  var sizeH = 0;
  var tipX = 0;              /* px from the box's top-left corner */
  var tipY = 0;

  var px = -1;               /* latest pointer position, viewport coords */
  var py = -1;
  var ax = -1;               /* where it was at the previous frame */
  var ay = -1;
  var aTime = 0;
  var heading = 0;           /* last raw travel angle, degrees */
  var turned = 0;            /* unwrapped heading the spring chases */

  var sx = null;
  var sy = null;
  var sr = null;
  var ss = null;

  function makeSpring(cfg, value) {
    return { x: value, v: 0, target: value, k: cfg.k, c: cfg.c, m: cfg.m };
  }

  function to(s, value) {
    s.target = value;
  }

  function snap(s, value) {
    s.target = value;
    s.x = value;
    s.v = 0;
  }

  function atRest(s) {
    return Math.abs(s.x - s.target) < REST_DIST && Math.abs(s.v) < REST_SPEED;
  }

  function step(s) {
    var accel = (-s.k * (s.x - s.target) - s.c * s.v) / s.m;
    s.v += accel * STEP;
    s.x += s.v * STEP;
  }

  function round(value, places) {
    var f = Math.pow(10, places);
    return Math.round(value * f) / f;
  }

  function write() {
    if (!el) return;
    el.style.transform =
      "translate3d(" + round(sx.x - tipX, 2) + "px," + round(sy.x - tipY, 2) + "px,0)" +
      " rotate(" + round(sr.x, 2) + "deg)" +
      " scale(" + round(ss.x, 4) + ")";
  }

  /* The heading is sampled once per frame, never once per pointer event. A
     1000Hz mouse reports sub-pixel steps, and atan2 on a 0.4px delta is noise;
     one frame of travel is the unit the eye actually reads as direction. The
     upstream component reaches the same place by throttling mousemove to rAF. */
  function steer(now) {
    if (ax >= 0 && px >= 0) {
      var dt = now - aTime;
      if (dt > 0 && (px !== ax || py !== ay)) {
        var vx = (px - ax) / dt;
        var vy = (py - ay) / dt;
        var speed = Math.sqrt(vx * vx + vy * vy) * 1000;
        if (speed > TURN_MIN_SPEED) {
          var angle = Math.atan2(vy, vx) * 180 / Math.PI + 90;
          var diff = angle - heading;
          if (diff > 180) diff -= 360;
          if (diff < -180) diff += 360;
          turned += diff;
          heading = angle;
          to(sr, turned);
          if (!pressed) {
            to(ss, SQUISH);
            if (!squishTimer) squishTimer = window.setTimeout(unSquish, SQUISH_HOLD);
          }
        }
      }
    }
    ax = px;
    ay = py;
    aTime = now;
  }

  function frame(now) {
    raf = 0;
    var dt = lastFrame ? Math.min((now - lastFrame) / 1000, STEP * MAX_STEPS) : STEP;
    lastFrame = now;
    steer(now);

    var steps = Math.max(1, Math.round(dt / STEP));
    for (var i = 0; i < steps; i++) {
      step(sx);
      step(sy);
      step(sr);
      step(ss);
    }

    if (atRest(sx) && atRest(sy) && atRest(sr) && atRest(ss)) {
      snap(sx, sx.target);
      snap(sy, sy.target);
      snap(sr, sr.target);
      snap(ss, ss.target);
      write();
      lastFrame = 0;
      return;
    }

    write();
    raf = window.requestAnimationFrame(frame);
  }

  function start() {
    if (!mounted || raf) return;
    raf = window.requestAnimationFrame(frame);
  }

  /* ---- geometry ---------------------------------------------------- */

  function measure() {
    var cs = window.getComputedStyle(el);
    sizeW = parseFloat(cs.width) || 40;
    sizeH = parseFloat(cs.height) || 43;
    tipX = (parseFloat(cs.getPropertyValue("--cursor-tip-x")) || 0) / 100 * sizeW;
    tipY = (parseFloat(cs.getPropertyValue("--cursor-tip-y")) || 0) / 100 * sizeH;
  }

  /* ---- show / hide -------------------------------------------------- */

  function show(x, y) {
    visible = true;
    px = x;
    py = y;
    ax = x;
    ay = y;
    aTime = performance.now();
    snap(sx, x);
    snap(sy, y);
    write();
    el.classList.add("is-visible");
    document.documentElement.classList.add("has-smooth-cursor");
    /* pointerover only reports a boundary crossing, so a pointer that was
       already resting on a text field when this mounted would otherwise show
       the arrow and the caret at once. */
    considerYield(document.elementFromPoint(x, y));
  }

  function hide() {
    if (!visible) return;
    visible = false;
    el.classList.remove("is-visible");
    document.documentElement.classList.remove("has-smooth-cursor");
  }

  /* ---- pointer ------------------------------------------------------ */

  function onMove(e) {
    var x = e.clientX;
    var y = e.clientY;

    if (!visible) {
      /* Revealed in the same frame the native cursor is switched off, already
         on the pointer: no gap with no cursor, and no arrow flying in from a
         corner (that entrance is exactly the decoration V2 retired). */
      show(x, y);
      return;
    }

    px = x;
    py = y;
    to(sx, x);
    to(sy, y);
    start();
  }

  function unSquish() {
    squishTimer = 0;
    if (!pressed) {
      to(ss, 1);
      start();
    }
  }

  function onDown() {
    pressed = true;
    to(ss, PRESS);
    start();
  }

  function onUp() {
    pressed = false;
    to(ss, 1);
    start();
  }

  function onBlur() {
    onUp();
    hide();
  }

  /* The arrow stands aside for the one thing the native cursor still owns:
     the text caret. Its own visibility is CSS. */
  function considerYield(target) {
    var next = !!(target && target.closest && target.closest(NATIVE_CURSOR));
    if (next === yielding) return;
    yielding = next;
    if (el) el.classList.toggle("is-yielded", yielding);
  }

  function onOver(e) {
    considerYield(e.target);
  }

  /* ---- lifecycle ---------------------------------------------------- */

  function mount() {
    mounted = true;
    visible = false;
    yielding = false;
    pressed = false;
    px = -1;
    py = -1;
    ax = -1;
    ay = -1;
    aTime = 0;
    heading = 0;
    turned = 0;
    lastFrame = 0;

    el = document.createElement("div");
    el.className = "smooth-cursor";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = ARROW;
    document.body.appendChild(el);

    sx = makeSpring(SPRINGS.position, OFFSCREEN);
    sy = makeSpring(SPRINGS.position, OFFSCREEN);
    sr = makeSpring(SPRINGS.rotation, 0);
    ss = makeSpring(SPRINGS.scale, 1);
    measure();
    write();

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", onUp, { passive: true });
    window.addEventListener("blur", onBlur);
    document.addEventListener("pointerover", onOver, { passive: true });
    document.documentElement.addEventListener("pointerleave", hide);
  }

  function unmount() {
    mounted = false;
    hide();
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerdown", onDown);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
    window.removeEventListener("blur", onBlur);
    document.removeEventListener("pointerover", onOver);
    document.documentElement.removeEventListener("pointerleave", hide);
    if (raf) window.cancelAnimationFrame(raf);
    if (squishTimer) window.clearTimeout(squishTimer);
    raf = 0;
    squishTimer = 0;
    if (el && el.parentNode) el.parentNode.removeChild(el);
    el = null;
    sx = sy = sr = ss = null;
  }

  var gates = [
    window.matchMedia(FINE),
    window.matchMedia(COARSE),
    window.matchMedia(REDUCED)
  ];

  function allowed() {
    return gates[0].matches && !gates[1].matches && !gates[2].matches &&
      navigator.maxTouchPoints === 0 && !("ontouchstart" in window);
  }

  function sync() {
    if (allowed() === mounted) return;
    if (mounted) unmount();
    else mount();
  }

  for (var i = 0; i < gates.length; i++) {
    if (gates[i].addEventListener) gates[i].addEventListener("change", sync);
    else if (gates[i].addListener) gates[i].addListener(sync);
  }

  sync();
})();
