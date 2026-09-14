/* ============================================================================
   glass-lens.js - the nav's refraction map.

   Ported from Framer's LiquidGlass, the component behind
   framer.com/m/Liquid-Glass-Nav-Pro-bjAIfL.js. This is THEIR formation, not
   ours, and it differs in three ways that matter:

     1. the map is GENERATED FOR THE ELEMENT'S OWN SIZE, not a fixed 1600x100
        picture stretched over the filter region;
     2. it is a signed-distance field of the rounded rect: neutral (128,128)
        everywhere, and only inside a `bezel` band does the offset ramp toward
        the OUTWARD RADIAL normal, with a quadratic falloff;
     3. the whole chain lives in one SVG filter, so backdrop-filter takes a
        single url() and nothing is left in CSS.

   Their numbers, unaltered: bezel 14, refraction 40 (feDisplacementMap scale
   in #lg-nav), max channel offset 118/255, map's long side capped at 320 px,
   devicePixelRatio capped at 1.25.

   No worker. Theirs exists because the component is arbitrary-sized and
   resizable; here it is one bar, and a 320x16 bitmap is five thousand pixels.

   Only the map is dynamic. Blur, saturation and brightness stay declarative in
   index.html, where the rest of the material lives.
   ========================================================================= */
(function () {
  "use strict";

  var body = document.querySelector(".nav .glass__body");
  var map = document.querySelector("#lg-nav feImage");
  /* the same gate the rest of the glass uses; without it there is no url()
     backdrop-filter to feed and the honest output is a plain blur */
  if (!body || !map || !document.documentElement.classList.contains("has-lens")) return;

  var MAX_SIDE = 320;     /* their maxInternalDimension */
  var MAX_DPR = 1.25;     /* their dpr cap */
  var MAX_OFFSET = 118;   /* their maxChannelOffset, in 0-255 channel units */
  var BEZEL = 14;         /* their bezelWidth, in CSS px */
  var RADIUS = 999;       /* the bar is a pill; the generator clamps to h/2 */

  var last = { w: 0, h: 0 };

  function build(w, h) {
    var dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    var sw = Math.max(2, Math.round(w * dpr));
    var sh = Math.max(2, Math.round(h * dpr));
    var k = Math.min(1, MAX_SIDE / Math.max(sw, sh));
    var pw = Math.max(2, Math.round(sw * k));
    var ph = Math.max(2, Math.round(sh * k));
    var sd = dpr * k;
    var r = Math.min(RADIUS * sd, pw * 0.5, ph * 0.5);
    var bz = Math.max(1, BEZEL * sd);

    var data = new Uint8ClampedArray(pw * ph * 4);
    var hw = pw / 2;
    var hh = ph / 2;
    var bx = Math.max(0, hw - r);
    var by = Math.max(0, hh - r);

    for (var y = 0; y < ph; y++) {
      var py = y + 0.5 - hh;
      for (var x = 0; x < pw; x++) {
        var px = x + 0.5 - hw;
        /* signed distance to the rounded-rect edge */
        var qx = Math.abs(px) - bx;
        var qy = Math.abs(py) - by;
        var outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
        var inside = Math.min(Math.max(qx, qy), 0);
        var sdf = outside + inside - r;
        var inward = Math.max(0, -sdf);
        var edge = Math.max(0, Math.min(1, 1 - inward / bz));
        var strength = edge * edge;              /* 1 at the edge, 0 at the bezel */

        var nx0 = px / Math.max(1, hw);
        var ny0 = py / Math.max(1, hh);
        var len = Math.hypot(nx0, ny0) || 1;
        var off = MAX_OFFSET * strength;

        var i = (y * pw + x) * 4;
        data[i] = Math.max(0, Math.min(255, Math.round(128 + (nx0 / len) * off)));
        data[i + 1] = Math.max(0, Math.min(255, Math.round(128 + (ny0 / len) * off)));
        data[i + 2] = 128;
        data[i + 3] = 255;
      }
    }

    var cv = document.createElement("canvas");
    cv.width = pw;
    cv.height = ph;
    cv.getContext("2d").putImageData(new ImageData(data, pw, ph), 0, 0);
    map.setAttribute("href", cv.toDataURL("image/png"));
    /* feImage is placed in the element's own user space, so the map covers the
       bar exactly and is never stretched across the filter region */
    map.setAttribute("width", String(w));
    map.setAttribute("height", String(h));
  }

  function sync() {
    var r = body.getBoundingClientRect();
    var w = Math.max(1, Math.round(r.width));
    var h = Math.max(1, Math.round(r.height));
    if (w === last.w && h === last.h) return;
    last = { w: w, h: h };
    build(w, h);
  }

  sync();
  /* the bar's width is min(1180px, 100vw - 2 * gutter), so it changes with the
     viewport; regenerate only when the measured box actually changes */
  if (typeof ResizeObserver !== "undefined") new ResizeObserver(sync).observe(body);
  else window.addEventListener("resize", sync, { passive: true });
})();
