/* ============================================================
   N1GHT CHXN9 - the draggable glass pill.

   One factory, two call sites (the archive tab bar and the primary nav),
   the same discipline as reel-stage.js: the implementation is shared, the
   callers only pass configuration.

   WHAT IT DOES
   Press the selected pill and it shrinks slightly under the cursor. Keep the
   button down and drag: the lozenge follows the pointer 1:1 and morphs its
   WIDTH live to whatever segment is underneath. Release and it fills that
   segment at full size. Escape or pointercancel puts it back without
   committing.

   THE ONE IDEA WORTH KEEPING
   Position and size are animated by different clocks. While the pointer is
   driving, transform is dropped from the transition list so the pill sits
   exactly under the cursor, while width keeps a short tween - so crossing a
   boundary reads as a continuous stretch rather than a snap. On release the
   full transition comes back and the pill travels. Everything else here is
   bookkeeping.

   WHAT IT DELIBERATELY IS NOT
   - Not a control. The pill is aria-hidden decoration; the buttons and links
     underneath keep their ARIA APG behaviour, their roving tabindex and
     their focus rings. Dragging is an enhancement on top of a working
     keyboard control, never a replacement for one.
   - No activation threshold. pointerdown enters the drag immediately and a
     plain click is simply a drag that never moved, so there is no dead zone
     where a press does nothing.
   - No hit-testing through the DOM. elementFromPoint would be answering a
     question about an element that is sitting on top of the answer; the
     segment under the pointer is pure arithmetic on cached rects instead,
     which also means no layout flush per frame.
   - Not enabled inside a horizontal scroller. Below 721px both bars scroll
     sideways, and a drag gesture there fights the scroll.

   Geometry is written as width/height/transform - never left/top - so the
   whole thing stays on the compositor. opacity is never touched: a glass
   element with opacity < 1 loses its own backdrop read.
   ============================================================ */

(function () {
  "use strict";

  var DRAG_MIN_WIDTH = "(min-width: 721px)";
  var SETTLE_MS = 320;
  var SUPPRESS_MS = 120;
  var HIT_SLOP = 4;
  var CLASS_DRAGGING = "is-dragging";
  var CLASS_GRABBED = "is-grabbed";
  var CLASS_SETTLING = "is-settling";
  var CLASS_DROP = "is-drop-target";

  function clamp(value, lo, hi) {
    return value < lo ? lo : value > hi ? hi : value;
  }

  /**
   * @param {object} options
   * @param {HTMLElement} options.root    positioning context (must be position:relative)
   * @param {HTMLElement[]} options.items the segments, in index order
   * @param {HTMLElement} options.pill    the indicator element
   * @param {number} [options.index]      which segment starts selected
   * @param {(index:number, meta:{via:string}) => void} [options.onChange]
   *        fired ONLY when a drag commits to a different segment. Click and
   *        keyboard paths must not route through here or they would loop.
   * @param {() => boolean} [options.isEnabled] extra gate, on top of width
   */
  function createGlassPill(options) {
    var root = options && options.root;
    var pill = options && options.pill;
    var items = options && options.items ? Array.prototype.slice.call(options.items) : [];
    if (!root || !pill || !items.length) return null;

    var onChange = typeof options.onChange === "function" ? options.onChange : function () {};
    var extraGate = typeof options.isEnabled === "function" ? options.isEnabled : function () { return true; };
    var media = window.matchMedia(DRAG_MIN_WIDTH);

    var current = typeof options.index === "number" ? options.index : 0;
    /* Starts hidden. Nothing has painted it yet, so a pill that claims to be
       visible at boot is a zero-width element - and a zero-width glass pill is
       NOT invisible: its rim, bevel and bloom do not scale away with the
       width, so it renders as a 1px vertical line through whichever label it
       is parked on. It becomes visible in moveTo(). */
    var visible = false;
    var geo = [];         // segment rects, relative to root
    var rootWidth = 0;
    var rootLeft = 0;     // cached at pointerdown; horizontal page scroll
                          // cannot move these bars, so re-reading per frame
                          // would buy nothing and cost a layout flush
    var drag = null;
    var preview = -1;     // segment the pointer is currently over
    var rafId = 0;
    var pendingX = 0;
    var suppressClick = false;
    var suppressTimer = 0;
    var settleTimer = 0;

    /* ---------- measurement ---------- */

    function measure() {
      var rootRect = root.getBoundingClientRect();
      rootWidth = rootRect.width;
      rootLeft = rootRect.left;
      geo = items.map(function (el) {
        var r = el.getBoundingClientRect();
        var x = r.left - rootRect.left;
        return { x: x, y: r.top - rootRect.top, w: r.width, h: r.height, center: x + r.width / 2 };
      });
    }

    /* Exact rect for a segment; when a pointer x is supplied the pill is
       centred on it but clamped so it can never overshoot either end. */
    function geometryFor(index, pointerX) {
      var g = geo[index];
      if (!g) return null;
      if (pointerX == null) return { x: g.x, y: g.y, w: g.w, h: g.h };
      return {
        x: clamp(pointerX - g.w / 2, 0, Math.max(rootWidth - g.w, 0)),
        y: g.y,
        w: g.w,
        h: g.h,
      };
    }

    function paint(g) {
      if (!g) return;
      pill.style.width = g.w + "px";
      pill.style.height = g.h + "px";
      pill.style.transform = "translate3d(" + g.x + "px," + g.y + "px,0)";
    }

    function segmentAt(x) {
      var i;
      for (i = 0; i < geo.length; i++) {
        if (x >= geo[i].x && x <= geo[i].x + geo[i].w) return i;
      }
      // outside every segment: nearest centre wins
      var best = -1;
      var bestDistance = Infinity;
      for (i = 0; i < geo.length; i++) {
        var d = Math.abs(x - geo[i].center);
        if (d < bestDistance) { bestDistance = d; best = i; }
      }
      return best;
    }

    function hitPill(clientX, clientY) {
      var r = pill.getBoundingClientRect();
      return (
        clientX >= r.left - HIT_SLOP &&
        clientX <= r.right + HIT_SLOP &&
        clientY >= r.top - HIT_SLOP &&
        clientY <= r.bottom + HIT_SLOP
      );
    }

    /* ---------- the committed position ---------- */

    function moveTo(index, opts) {
      if (index < 0 || index >= items.length) return;
      current = index;
      visible = true;
      pill.style.visibility = "";
      var instant = !!(opts && opts.instant);
      if (instant) pill.style.transition = "none";
      paint(geometryFor(index));
      if (instant) {
        void pill.offsetWidth; // force the style to land before transitions return
        pill.style.transition = "";
      }
    }

    /* Leave the stage entirely. Used by the nav, where no section is active at
       the top of the page.

       Collapsing the width to 0 is NOT enough, and that was the bug: the rim,
       the inset bevel and the ::before bead are painted on the pill's box
       regardless of how narrow it is, so a "collapsed" pill shows up as a 1px
       vertical line sitting on a label. visibility is used rather than opacity
       because a glass element below opacity 1 loses its own backdrop read, so
       a fade would visibly degrade the material on the way out. */
    function hide() {
      if (!visible) return;
      var g = geo[current] || geo[0];
      if (!g) return;
      visible = false;
      paint({ x: g.center, y: g.y, w: 0, h: g.h });
      pill.style.visibility = "hidden";
    }

    /* ---------- drag ---------- */

    /* The label under the cursor has to go light, because the pill is about to
       be sitting on it; and the label the pill has LEFT has to go back to ink,
       because it is now sitting on bare glass. Without this the active label
       stays --color-on-dark while the pill is somewhere else, i.e. white on
       white for the whole length of the drag. */
    function setPreview(index) {
      if (index === preview) return;
      if (preview >= 0 && items[preview]) items[preview].classList.remove(CLASS_DROP);
      preview = index;
      if (preview >= 0 && items[preview]) items[preview].classList.add(CLASS_DROP);
    }

    function applyDrag() {
      rafId = 0;
      if (!drag) return;
      var x = pendingX - rootLeft;
      var next = segmentAt(x);
      setPreview(next);
      paint(geometryFor(next, x));
    }

    function onPointerMove(event) {
      if (!drag || event.pointerId !== drag.pointerId) return;
      drag.moved = true;
      if (!pill.classList.contains(CLASS_DRAGGING)) {
        pill.classList.add(CLASS_DRAGGING);
        // root carries the state the labels style themselves from; the pill
        // carries only its own transition change
        root.classList.add(CLASS_DRAGGING);
        setPreview(current);
      }
      pendingX = event.clientX;
      if (!rafId) rafId = window.requestAnimationFrame(applyDrag);
    }

    function onPointerUp(event) {
      if (!drag || event.pointerId !== drag.pointerId) return;
      var moved = drag.moved;
      var target = moved ? segmentAt(pendingX - rootLeft) : current;
      var from = current;
      endDrag();

      // The pointer capture retargets the click, but do not rely on it: a
      // click that lands on the segment must not also fire its own handler.
      suppressClick = true;
      window.clearTimeout(suppressTimer);
      suppressTimer = window.setTimeout(function () { suppressClick = false; }, SUPPRESS_MS);

      pill.classList.add(CLASS_SETTLING);
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(function () { pill.classList.remove(CLASS_SETTLING); }, SETTLE_MS);

      moveTo(target);
      if (target !== from) onChange(target, { via: "drag" });
    }

    function onPointerCancel(event) {
      if (!drag || event.pointerId !== drag.pointerId) return;
      cancelDrag();
    }

    function onKeyDown(event) {
      if (event.key !== "Escape" && event.key !== "Esc") return;
      event.preventDefault();
      cancelDrag();
    }

    // Put the pill back where it was committed. Same animation as a commit,
    // but no onChange - a cancelled gesture must not change the selection.
    function cancelDrag() {
      if (!drag) return;
      var committed = current;
      endDrag();
      moveTo(committed);
    }

    function endDrag() {
      if (!drag) return;
      try { root.releasePointerCapture(drag.pointerId); } catch (err) { /* not capturable */ }
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerup", onPointerUp);
      root.removeEventListener("pointercancel", onPointerCancel);
      window.removeEventListener("keydown", onKeyDown);
      drag = null;
      if (rafId) { window.cancelAnimationFrame(rafId); rafId = 0; }
      pill.classList.remove(CLASS_GRABBED, CLASS_DRAGGING);
      root.classList.remove(CLASS_DRAGGING);
      setPreview(-1);
    }

    function onPointerDown(event) {
      if (drag) return;
      if (!media.matches || !extraGate()) return;
      // primary button only; touch and pen report button 0 too
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (!visible || current < 0) return;
      if (!hitPill(event.clientX, event.clientY)) return;

      measure();
      drag = { pointerId: event.pointerId, moved: false };
      pendingX = event.clientX;

      // Capture on ROOT, not on the pill. The pill sits underneath the
      // segments, so a press on the selected segment targets the button;
      // capturing at the root makes the gesture survive that and keeps the
      // segment's own hover state from fighting the drag.
      try { root.setPointerCapture(event.pointerId); } catch (err) { /* synthetic event */ }

      root.addEventListener("pointermove", onPointerMove);
      root.addEventListener("pointerup", onPointerUp);
      root.addEventListener("pointercancel", onPointerCancel);
      window.addEventListener("keydown", onKeyDown);
      pill.classList.add(CLASS_GRABBED);
    }

    function onClickCapture(event) {
      if (!suppressClick) return;
      event.stopPropagation();
      event.preventDefault();
    }

    /* ---------- re-measure ---------- */

    var rafRefresh = 0;
    function refresh() {
      if (rafRefresh) return;
      rafRefresh = window.requestAnimationFrame(function () {
        rafRefresh = 0;
        if (drag) return;
        measure();
        if (current < 0) return;
        pill.style.transition = "none";
        if (visible) paint(geometryFor(current));
        void pill.offsetWidth;
        pill.style.transition = "";
      });
    }

    function syncTouchAction() {
      // Only claim the horizontal axis while the drag is actually available;
      // below 721px the bars scroll sideways and must keep their own gesture.
      root.style.touchAction = media.matches ? "pan-y" : "";
    }

    /* ---------- wire up ---------- */

    root.addEventListener("pointerdown", onPointerDown);
    root.addEventListener("click", onClickCapture, true);
    window.addEventListener("resize", refresh);

    var observer = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(refresh);
      observer.observe(root);
    }
    // A webfont swap changes every label width, so the geometry measured at
    // boot is stale by the time the page settles.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);

    if (typeof media.addEventListener === "function") media.addEventListener("change", syncTouchAction);
    else if (typeof media.addListener === "function") media.addListener(syncTouchAction);
    syncTouchAction();

    measure();
    moveTo(current, { instant: true });

    return {
      moveTo: moveTo,
      hide: hide,
      refresh: refresh,
      index: function () { return current; },
      visible: function () { return visible; },
      destroy: function () {
        endDrag();
        root.removeEventListener("pointerdown", onPointerDown);
        root.removeEventListener("click", onClickCapture, true);
        window.removeEventListener("resize", refresh);
        if (observer) observer.disconnect();
        root.style.touchAction = "";
      },
    };
  }

  window.createGlassPill = createGlassPill;
})();
