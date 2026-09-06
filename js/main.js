/* ============================================================
   N1GHT CHXN9 - interaction layer
   GSAP + ScrollTrigger. All scrub tweens invalidateOnRefresh.
   ============================================================ */

gsap.registerPlugin(ScrollTrigger);
if (window.SplitText) gsap.registerPlugin(SplitText);

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const TOUCH = window.matchMedia("(pointer: coarse)").matches;
const FINE_POINTER = window.matchMedia("(pointer: fine)").matches;

/* ---------- smooth scrolling (Lenis, full-motion only) ----------
   Native scroll under reduced motion. Programmatic jumps (dragbar seek,
   anchors) route through lenis.scrollTo so the internal value stays in sync. */
let lenis = null;
if (!REDUCED && typeof Lenis !== "undefined") {
  lenis = new Lenis({ autoRaf: false });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const target = a.getAttribute("href");
      if (target.length > 1 && document.querySelector(target)) {
        e.preventDefault();
        lenis.scrollTo(target, { duration: 1.4 });
      }
    });
  });
}

/* ---------- helpers ---------- */

// One shared scheduler for full ScrollTrigger.refresh passes: bursts of
// layout-changing events (accordion toggles, image loads, font swaps)
// collapse into a single recalc after the window quiets down.
let refreshTimer = 0;
function scheduleRefresh(delay) {
  if (!window.ScrollTrigger || !window.ScrollTrigger.refresh) return;
  window.clearTimeout(refreshTimer);
  refreshTimer = window.setTimeout(() => {
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }, delay || 200);
}

// split text into chars inside .ch spans (preserves word wrappers)
function splitChars(el) {
  const words = el.textContent.split(/(\s+)/);
  el.innerHTML = "";
  words.forEach((w) => {
    if (/^\s+$/.test(w) || w === "") {
      el.appendChild(document.createTextNode(" "));
      return;
    }
    const wordSpan = document.createElement("span");
    wordSpan.style.display = "inline-block";
    wordSpan.style.whiteSpace = "nowrap";
    [...w].forEach((c) => {
      const s = document.createElement("span");
      s.className = "ch";
      s.textContent = c;
      wordSpan.appendChild(s);
    });
    el.appendChild(wordSpan);
  });
  return el.querySelectorAll(".ch");
}

const SVG_NS = "http://www.w3.org/2000/svg";

/* Build the signature SVG into a container from SIG_DATA.
   Returns { svg, paths, fills } or null when data/container missing.
   Each glyph outline is drawn twice:
   - .sig-path  : stroked outline (stroke-dashoffset draw animation)
   - .sig-fill  : solid fill that fades in after the draw lands
*/
function buildSignature(containerId) {
  const container = document.getElementById(containerId);
  if (!container || typeof SIG_DATA === "undefined") return null;

  const vb = SIG_DATA.viewBox;
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", vb.x + " " + vb.y + " " + vb.w + " " + vb.h);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "N1GHT CHXN9");

  const paths = [];
  const fills = [];

  SIG_DATA.glyphs.forEach((g) => {
    const p = document.createElementNS(SVG_NS, "path");
    p.setAttribute("d", g.d);
    p.setAttribute("class", "sig-path");
    svg.appendChild(p);
    paths.push(p);

    const f = document.createElementNS(SVG_NS, "path");
    f.setAttribute("d", g.d);
    f.setAttribute("class", "sig-fill");
    svg.appendChild(f);
    fills.push(f);
  });

  container.appendChild(svg);
  return { svg, paths, fills };
}

// Measure every path, set up dasharray/dashoffset and return total length
function setupSignatureDraw(sig) {
  if (!sig) return null;
  let totalLen = 0;
  sig.paths.forEach((p) => {
    const len = p.getTotalLength();
    p.dataset.len = len;
    totalLen += len;
    p.style.strokeDasharray = len;
    p.style.strokeDashoffset = len;
  });
  return totalLen;
}

function animateSignature(sig, opts) {
  if (!sig || !sig.paths.length) return;
  const o = opts || {};

  if (REDUCED) {
    sig.paths.forEach((p) => {
      gsap.set(p, { strokeDashoffset: 0 });
      p.style.strokeDasharray = "none";
    });
    gsap.set(sig.fills, { opacity: 1 });
    if (o.onComplete) o.onComplete();
    return;
  }

  const tl = gsap.timeline({
    delay: o.delay || 0,
    onComplete: o.onComplete,
  });

  tl.to(sig.paths, {
    strokeDashoffset: 0,
    duration: o.duration || 1.15,
    ease: o.ease || "power2.inOut",
    stagger: o.stagger || 0.085,
  }, 0);

  tl.to(sig.fills, {
    opacity: 1,
    duration: o.fillDuration || 0.7,
    ease: "power2.out",
    stagger: 0.05,
  }, o.fillAt || "<0.25");
}

/* ---------- custom cursor + magnetic (fine pointers, motion allowed) ----------
   One ink dot: grows on anything interactive, expands into a mono label on
   [data-cursor] targets (VIEW / DRAG / OPEN / STAMP). Magnetic elements lean
   toward the pointer and spring back on leave. */

function initCursor() {
  if (TOUCH || !FINE_POINTER || REDUCED) return;
  const cursor = document.createElement("div");
  cursor.className = "custom-cursor";
  cursor.setAttribute("aria-hidden", "true");
  cursor.innerHTML = '<div class="cc-dot"></div><span class="cc-label mono"></span>';
  document.body.appendChild(cursor);
  document.documentElement.classList.add("has-cursor");

  const dot = cursor.querySelector(".cc-dot");
  const label = cursor.querySelector(".cc-label");

  gsap.set(cursor, { xPercent: -50, yPercent: -50, x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const cx = gsap.quickTo(cursor, "x", { duration: 0.18, ease: "power2.out" });
  const cy = gsap.quickTo(cursor, "y", { duration: 0.18, ease: "power2.out" });
  // gsap.quickTo on the scaled `scale` alias does not tween the dot, so drive
  // scaleX + scaleY (together with gsap.to on mousedown/mouseup) to expand the
  // badge and keep the mono label centered inside it.
  const growX = gsap.quickTo(dot, "scaleX", { duration: 0.25, ease: "power2.out" });
  const growY = gsap.quickTo(dot, "scaleY", { duration: 0.25, ease: "power2.out" });
  const grow = (v) => { growX(v); growY(v); };

  let baseScale = 1;

  window.addEventListener("pointermove", (e) => { cx(e.clientX); cy(e.clientY); }, { passive: true });

  document.addEventListener("mouseover", (e) => {
    const labelled = e.target.closest("[data-cursor]");
    if (labelled) {
      label.textContent = labelled.getAttribute("data-cursor");
      baseScale = 6;
      gsap.to(label, { opacity: 1, duration: 0.18, overwrite: "auto" });
    } else if (e.target.closest("a, button, .hs-card, .hof-card, .idx-row, .idx-card")) {
      baseScale = 2.6;
      gsap.to(label, { opacity: 0, duration: 0.15, overwrite: "auto" });
    } else {
      baseScale = 1;
      gsap.to(label, { opacity: 0, duration: 0.15, overwrite: "auto" });
    }
    grow(baseScale);
  });

  document.addEventListener("mousedown", () => gsap.to(dot, { scale: baseScale * 0.75, duration: 0.12, ease: "power2.in", overwrite: "auto" }));
  document.addEventListener("mouseup", () => gsap.to(dot, { scale: baseScale, duration: 0.25, ease: "power2.out", overwrite: "auto" }));
  document.documentElement.addEventListener("mouseleave", () => gsap.to(cursor, { autoAlpha: 0, duration: 0.2, overwrite: "auto" }));
  document.documentElement.addEventListener("mouseenter", () => gsap.to(cursor, { autoAlpha: 1, duration: 0.2, overwrite: "auto" }));
}
initCursor();

function initMagnetic() {
  if (TOUCH || !FINE_POINTER || REDUCED) return;
  gsap.utils.toArray(".nav-links a, .tab-btn, .lb-close, .lb-nav, .footer-links a").forEach((el) => {
    // high-frequency drag-follow: tight near-instant follow, no elastic release
    const xTo = gsap.quickTo(el, "x", { duration: 0.18, ease: "power2.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.18, ease: "power2.out" });
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.3);
    });
    el.addEventListener("pointerleave", () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.3, ease: "power2.out", overwrite: "auto" });
    });
  });
}
initMagnetic();

/* ---------- preloader ---------- */

const preloader = document.getElementById("preloader");
const preLetters = document.querySelectorAll("#pre-letters span:not(.pre-gap)");
const preBar = document.getElementById("pre-bar");
const preCount = document.getElementById("pre-count");

// only eager images gate the preloader; the lazy gallery images load on
// demand as they approach the viewport and must not block the loader
const images = Array.from(document.images).filter((img) => img.loading !== "lazy");
let loaded = 0;
const total = images.length;

const heroChars = [];
document.querySelectorAll("[data-split]").forEach((el) => {
  heroChars.push(...splitChars(el));
});
gsap.set(heroChars, { yPercent: 120 });

let preloadFinished = false;

function finishPreload() {
  if (preloadFinished) return;
  preloadFinished = true;

  const settle = () => {
    // recalc once the reveal is done, then again after lazy gallery
    // images settle so the drag distances stay accurate
    ScrollTrigger.refresh();
    scheduleRefresh(800);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => scheduleRefresh(100));
    }
  };

  if (REDUCED) {
    // static reveal: plain sets apply synchronously — the reduced-motion
    // path must never depend on the animation ticker, or a paused rAF
    // (background tab, throttled webview) would trap the user on the loader
    gsap.set(heroChars, { yPercent: 0 });
    preloader.remove();
    settle();
    return;
  }

  const tl = gsap.timeline({
    onComplete: () => {
      preloader.remove();
      settle();
    },
  });

  tl.to("#preloader .pre-inner", { autoAlpha: 0, duration: 0.45, ease: "power2.in" })
    .to(".pre-shutter.s1", { y: "0%", duration: 0.55, ease: "power4.inOut" }, "-=0.15")
    .to(".pre-shutter.s2", { y: "0%", duration: 0.55, ease: "power4.inOut" }, "-=0.42")
    .to(".pre-shutter.s3", { y: "0%", duration: 0.55, ease: "power4.inOut" }, "-=0.42")
    .add(() => {
      gsap.set(".pre-shutter", { zIndex: 5 });
    })
    .to(".pre-shutter.s1", { y: "-101%", duration: 0.7, ease: "power4.inOut" })
    .to(".pre-shutter.s2", { y: "-101%", duration: 0.7, ease: "power4.inOut" }, "-=0.55")
    .to(".pre-shutter.s3", { y: "-101%", duration: 0.7, ease: "power4.inOut" }, "-=0.55")
    // hero entrance
    .to(heroChars, { yPercent: 0, duration: 1.1, stagger: 0.035, ease: "power4.out" }, "-=0.45");
}

// progress-driven letter ignition
function setProgress(ratio) {
  const pct = Math.round(ratio * 100);
  preCount.textContent = String(pct).padStart(3, "0");
  gsap.to(preBar, { scaleX: ratio, duration: 0.3, ease: "power2.out", overwrite: true });
  const lit = Math.floor(ratio * preLetters.length);
  preLetters.forEach((el, i) => {
    if (i < lit && !el.dataset.lit) {
      el.dataset.lit = "1";
      gsap.to(el, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" });
    }
  });
}

function onImgDone() {
  loaded++;
  setProgress(loaded / total);
  if (loaded >= total) setTimeout(finishPreload, 350);
}

if (REDUCED) {
  finishPreload();
} else if (total === 0) {
  setProgress(1);
  setTimeout(finishPreload, 350);
} else {
  images.forEach((img) => {
    // complete === true also covers failed loads (the error listener below
    // would never fire retroactively) — count them as done so the loader
    // can't hang on a broken file
    if (img.complete) onImgDone();
    else {
      img.addEventListener("load", onImgDone, { once: true });
      img.addEventListener("error", onImgDone, { once: true });
    }
  });
  // hard fail-safe: never trap the user on the loader
  setTimeout(() => {
    if (document.body.contains(preloader)) finishPreload();
  }, 4500);
}

/* ---------- horizontal scrollers (photo gallery + game roster) ----------
   Drag-only: the page wheel scrolls vertically past these sections and
   never drives the track. Horizontal movement comes from grabbing the
   section, the scrubber bar, or touch drag (touch-action: pan-y lets
   horizontal gestures through on touch). NOT gated by REDUCED — dragging
   is direct user input. */

function makeHorizontalScroller(opts) {
  const wrap = document.getElementById(opts.wrapId);
  const track = document.getElementById(opts.trackId);
  if (!wrap || !track) return null;

  const getDistance = () => Math.max(0, track.scrollWidth - wrap.clientWidth);

  const bar = document.getElementById(opts.barId);
  const barTrack = document.getElementById(opts.barTrackId);
  const barFill = document.getElementById(opts.barFillId);
  const barHandle = document.getElementById(opts.barHandleId);
  const barCount = document.getElementById(opts.barCountId);

  let isDraggingBar = false;
  let isGrabbing = false;
  let glideTween = null;

  let progress = 0;
  let lastFrame = -1;
  // Handle X is a transform write (translateX). Track/handle widths are
  // cached and re-measured on refresh/resize, so the per-frame path never
  // reads layout between writes.
  let barW = 0;
  let handleHalf = 0;
  const measureHandle = () => {
    if (!barTrack || !barHandle) return;
    barW = barTrack.clientWidth;
    handleHalf = barHandle.offsetWidth / 2;
  };
  function renderDragbar(p) {
    if (!bar || !barFill || !barHandle || !barCount) return;
    const clamped = Math.max(0, Math.min(1, p));
    // transform writes only: fill via scaleX, handle via translateX
    // (center of handle lands at p * trackWidth, matching the old left:%)
    barFill.style.transform = "scaleX(" + clamped + ")";
    if (!barW || !handleHalf) measureHandle();
    barHandle.style.transform = "translate(" + (clamped * barW - handleHalf).toFixed(2) + "px, -50%)";
    const frame = Math.min(opts.itemCount, Math.max(1, Math.round(clamped * (opts.itemCount - 1)) + 1));
    if (frame !== lastFrame) {
      lastFrame = frame;
      barCount.textContent = opts.label + " " + String(frame).padStart(2, "0") + " / " + String(opts.itemCount).padStart(2, "0");
    }
  }

  // single write path: progress -> track transform + scrubber state
  const render = (p) => {
    progress = Math.max(0, Math.min(1, p));
    gsap.set(track, { x: -getDistance() * progress });
    renderDragbar(progress);
  };

  if (bar && barTrack) {
    // the scrubber only shows while its section is on screen
    new IntersectionObserver((entries) => {
      entries.forEach((en) => bar.classList.toggle("is-active", en.isIntersecting));
    }, { threshold: 0.15 }).observe(wrap);

    measureHandle();
    window.addEventListener("resize", () => { measureHandle(); render(progress); });
    // lazy images grow the track; keep the clamped position honest
    if (typeof ResizeObserver === "function") {
      new ResizeObserver(() => render(progress)).observe(track);
    }

    const barEventToProgress = (e) => {
      const rect = barTrack.getBoundingClientRect();
      return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    };

    barTrack.addEventListener("pointerdown", (e) => {
      isDraggingBar = true;
      barTrack.classList.add("is-dragging");
      barTrack.setPointerCapture(e.pointerId);
      if (glideTween) { glideTween.kill(); glideTween = null; }
      render(barEventToProgress(e));
    });

    barTrack.addEventListener("pointermove", (e) => {
      if (!isDraggingBar) return;
      render(barEventToProgress(e));
    });

    const endBarDrag = () => {
      isDraggingBar = false;
      barTrack.classList.remove("is-dragging");
    };
    barTrack.addEventListener("pointerup", endBarDrag);
    barTrack.addEventListener("pointercancel", endBarDrag);
  }

  /* ---- direct grab-drag on the section (all pointers) ----
     Under DRAG_THRESHOLD px of travel it stays a normal click (lightbox etc.);
     past it the drag captures the pointer and moves the track directly.
     Release flings with inertia. Direct manipulation, so NOT gated by REDUCED. */
  {
    const DRAG_THRESHOLD = 6;
    let dragId = null, dragStartX = 0, dragStartP = 0, dragArmed = false, dragMoved = false;
    let lastX = 0, lastT = 0, dragVel = 0; // px/ms, signed

    const suppressClick = (e) => { e.stopPropagation(); e.preventDefault(); };

    wrap.addEventListener("dragstart", (e) => e.preventDefault());

    wrap.addEventListener("pointerdown", (e) => {
      if (isDraggingBar || e.button !== 0) return;
      if (glideTween) { glideTween.kill(); glideTween = null; }
      dragId = e.pointerId;
      dragStartX = lastX = e.clientX;
      lastT = performance.now();
      dragVel = 0;
      dragStartP = progress;
      dragArmed = false;
      dragMoved = false;
    });

    wrap.addEventListener("pointermove", (e) => {
      if (e.pointerId !== dragId) return;
      const dx = e.clientX - dragStartX;
      if (!dragArmed) {
        if (Math.abs(dx) < DRAG_THRESHOLD) return;
        dragArmed = true;
        dragMoved = true;
        isGrabbing = true;
        wrap.classList.add("is-grabbing");
        wrap.setPointerCapture(dragId);
      }
      const now = performance.now();
      const dt = now - lastT;
      if (dt > 0) dragVel = 0.8 * dragVel + 0.2 * ((e.clientX - lastX) / dt);
      lastX = e.clientX;
      lastT = now;
      const dist = getDistance();
      if (!dist) return;
      render(dragStartP - dx / dist);
    });

    const endGrab = (e) => {
      if (e.pointerId !== dragId) return;
      dragId = null;
      if (!dragArmed) return;
      dragArmed = false;
      isGrabbing = false;
      wrap.classList.remove("is-grabbing");
      // inertia: project release velocity onto progress and glide out
      const dist = getDistance();
      if (dist && Math.abs(dragVel) > 0.15) {
        const from = progress;
        const target = Math.max(0, Math.min(1, from - (dragVel * 140) / dist));
        const proxy = { p: from };
        glideTween = gsap.to(proxy, {
          p: target,
          duration: 0.9,
          ease: "power3.out",
          onUpdate: () => render(proxy.p),
          onComplete: () => { glideTween = null; },
        });
      }
      if (dragMoved) {
        dragMoved = false;
        // one-shot: eat the synthetic click this drag would produce
        wrap.addEventListener("click", suppressClick, { capture: true, once: true });
      }
    };
    wrap.addEventListener("pointerup", endGrab);
    wrap.addEventListener("pointercancel", endGrab);

    // wheeling away kills any glide immediately
    wrap.addEventListener("wheel", () => {
      if (glideTween) { glideTween.kill(); glideTween = null; }
    }, { passive: true });
  }

  render(0);
  return { render };
}

makeHorizontalScroller({
  wrapId: "hs-wrap",
  trackId: "hs-track",
  barId: "hs-dragbar",
  barTrackId: "hs-dragbar-track",
  barFillId: "hs-dragbar-fill",
  barHandleId: "hs-dragbar-handle",
  barCountId: "hs-dragbar-count",
  itemCount: 11,
  label: "FRAME",
});

makeHorizontalScroller({
  wrapId: "hof-scroll",
  trackId: "hof-row",
  barId: "hof-dragbar",
  barTrackId: "hof-dragbar-track",
  barFillId: "hof-dragbar-fill",
  barHandleId: "hof-dragbar-handle",
  barCountId: "hof-dragbar-count",
  itemCount: 18,
  label: "CARD",
});

/* ---------- hero bubbles: click to pop, respawn at a random spot ---------- */

const bubbleField = document.getElementById("bubble-field");
const BUBBLE_COUNT = window.innerWidth < 720 ? 14 : 24;

const BUBBLE_TINTS = [
  "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.5) 16%, rgba(221,183,107,0.45) 42%, rgba(201,162,39,0.10) 100%)",
  "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.5) 16%, rgba(243,233,210,0.6) 42%, rgba(221,183,107,0.12) 100%)",
  "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.5) 16%, rgba(126,95,32,0.26) 42%, rgba(126,95,32,0.06) 100%)",
];

// Infinite decorative loops that should only tick while the hero is on
// screen (bubbles + hero orbs). Paused tweens stop costing gsap.ticker.
const heroLoopTweens = new Set();

function spawnBubble() {
  if (!bubbleField) return;
  const b = document.createElement("div");
  b.className = "bubble";
  const small = window.innerWidth < 720;
  const size = small ? 26 + Math.random() * 56 : 34 + Math.random() * 76;
  b.style.width = size + "px";
  b.style.height = size + "px";
  b.style.left = 2 + Math.random() * 90 + "%";
  b.style.top = 4 + Math.random() * 88 + "%";
  b.style.opacity = 0.4 + Math.random() * 0.3;
  b.style.background = BUBBLE_TINTS[Math.floor(Math.random() * BUBBLE_TINTS.length)];
  bubbleField.appendChild(b);

  // gentle bob/sway; bubbles never leave the hero
  const bob = 14 + Math.random() * 30;
  const dur = 4 + Math.random() * 5;

  if (!REDUCED) {
    heroLoopTweens.add(gsap.to(b, {
      y: -bob,
      x: (Math.random() - 0.5) * 46,
      duration: dur,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
      delay: Math.random() * 2,
    }));
  }

  b.addEventListener("click", () => {
    b.style.pointerEvents = "none";
    gsap.killTweensOf(b);
    heroLoopTweens.forEach((tw) => {
      if (tw.targets()[0] === b) heroLoopTweens.delete(tw);
    });
    if (REDUCED) {
      // no pop animation under reduced motion: swap in place
      b.remove();
      spawnBubble();
      return;
    }
    gsap.timeline({
      onComplete: () => { b.remove(); spawnBubble(); },
    }).to(b, { scale: 1.9, autoAlpha: 0, duration: 0.28, ease: "power2.in" });
  });
}

for (let i = 0; i < BUBBLE_COUNT; i++) spawnBubble();

/* ---------- photo lightbox: click a frame to see the full frame ---------- */

const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lb-img");
const lbCap = document.getElementById("lb-cap");
const lbCount = document.getElementById("lb-count");
const lbCloseBtn = document.getElementById("lb-close");
const lbPrevBtn = document.getElementById("lb-prev");
const lbNextBtn = document.getElementById("lb-next");
const photoCards = Array.from(document.querySelectorAll(".hs-card"));

let lbIndex = 0;
let isLbOpen = false;
let lbTrigger = null;

function lbLoad(i) {
  lbIndex = ((i % photoCards.length) + photoCards.length) % photoCards.length;
  const card = photoCards[lbIndex];
  const img = card.querySelector("img");
  const cap = card.querySelector(".hs-cap");
  lbCount.textContent =
    "FRAME " + String(lbIndex + 1).padStart(2, "0") + " / " + String(photoCards.length).padStart(2, "0");
  lbCap.textContent = cap ? cap.textContent : "";
  lbImg.alt = img ? img.alt : "";
  lbImg.classList.remove("is-loaded");
  // show the low-res archive copy, not the multi-MB full original
  lbImg.src = img.src;
}

function lbOpenAt(i) {
  if (!lightbox || !photoCards.length) return;
  lbTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  lbLoad(i);
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  if (lenis) lenis.stop();
  isLbOpen = true;
  lbCloseBtn.focus();
}

function lbCloseFn() {
  if (!lightbox) return;
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  if (lenis) lenis.start();
  // empty src would re-request the page URL itself; drop the attribute
  lbImg.removeAttribute("src");
  isLbOpen = false;
  // hand focus back to the card that opened the lightbox
  if (lbTrigger && document.contains(lbTrigger)) lbTrigger.focus();
  lbTrigger = null;
}

if (lightbox && photoCards.length) {
  photoCards.forEach((card, i) => {
    card.addEventListener("click", () => lbOpenAt(i));
    card.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      lbOpenAt(i);
    });
  });

  lbCloseBtn.addEventListener("click", lbCloseFn);
  lbPrevBtn.addEventListener("click", () => lbLoad(lbIndex - 1));
  lbNextBtn.addEventListener("click", () => lbLoad(lbIndex + 1));

  // clicking the dark backdrop closes
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) lbCloseFn();
  });

  document.addEventListener("keydown", (e) => {
    if (!isLbOpen) return;
    if (e.key === "Escape") lbCloseFn();
    if (e.key === "ArrowLeft") lbLoad(lbIndex - 1);
    if (e.key === "ArrowRight") lbLoad(lbIndex + 1);
    if (e.key === "Tab") {
      // simple focus trap: cycle the lightbox controls
      const focusables = [lbCloseBtn, lbPrevBtn, lbNextBtn].filter(
        (btn) => btn && btn.offsetParent !== null
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // touch: horizontal swipe changes frames
  let swipeX = 0, swipeY = 0, trackingSwipe = false;
  lightbox.addEventListener("touchstart", (e) => {
    swipeX = e.changedTouches[0].clientX;
    swipeY = e.changedTouches[0].clientY;
    trackingSwipe = true;
  }, { passive: true });
  lightbox.addEventListener("touchend", (e) => {
    if (!trackingSwipe) return;
    trackingSwipe = false;
    const dx = e.changedTouches[0].clientX - swipeX;
    const dy = e.changedTouches[0].clientY - swipeY;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      lbLoad(lbIndex + (dx < 0 ? 1 : -1));
    }
  }, { passive: true });

  lbImg.addEventListener("load", () => lbImg.classList.add("is-loaded"));
}

/* ---------- The Archive: tab switching (clip-path wipe + row stagger) ---------- */

function initArchiveTabs() {
  const tabbar = document.getElementById("archive-tabbar");
  if (!tabbar) return;
  const tabs = Array.from(tabbar.querySelectorAll(".tab-btn"));
  const tabPanels = tabbar.closest("#archive") && tabbar.closest("#archive").querySelector(":scope > .tab-panels");
  if (!tabs.length || !tabPanels) return;

  const panels = tabs.map((tab) =>
    document.getElementById(tab.getAttribute("aria-controls"))
  );
  if (panels.some((panel) => !panel)) return;

  // A panel must stay a direct child of .tab-panels. If a later edit nests it
  // inside another panel or drawer, put it back before wiring tab clicks.
  panels.forEach((panel) => {
    if (panel.parentElement !== tabPanels) tabPanels.appendChild(panel);
  });

  let current = tabs.findIndex((t) => t.classList.contains("is-active"));
  if (current < 0) current = 0;

  // roving tabindex: only the active tab participates in the Tab order
  tabs.forEach((t, i) => { t.tabIndex = i === current ? 0 : -1; });

  const showMeta = (idx) => {
    tabs.forEach((t, i) => {
      const on = i === idx;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
    });
    panels.forEach((p, i) => p.classList.toggle("is-active", i === idx));
  };

  const animateIn = (idx, rows) => {
    const panel = panels[idx];
    if (!panel) return;
    if (!rows || !rows.length) return;
    if (REDUCED) {
      gsap.set(rows, { y: 0 });
      return;
    }
    gsap.fromTo(panel,
      { clipPath: "inset(0 0 0 100%)" },
      {
        clipPath: "inset(0 0 0 0%)",
        duration: 0.8,
        ease: "power4.inOut",
      });
    gsap.from(rows, {
      clipPath: "inset(0 0 100% 0)",
      y: 14,
      duration: 0.75,
      stagger: { each: 0.06, from: "start" },
      ease: "power3.out",
      delay: 0.08,
      clearProps: "clipPath",
    });
  };

  const select = (idx, instant) => {
    if (idx === current && !instant) return;
    current = idx;
    showMeta(idx);
    const rows = panels[idx] ? Array.from(panels[idx].querySelectorAll(".idx-row, .genre")) : [];
    if (instant) {
      gsap.set(rows, { y: 0, clearProps: "clipPath" });
      gsap.set(panels[idx], { clipPath: "inset(0 0 0 0%)" });
    } else {
      animateIn(idx, rows);
    }
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(i));
    tab.addEventListener("keydown", (e) => {
      const isFirst = i === 0;
      const isLast = i === tabs.length - 1;
      if (e.key === "ArrowRight" || (e.key === "ArrowDown" && i < tabs.length - 1)) {
        e.preventDefault();
        const next = isLast ? 0 : i + 1;
        tabs[next].focus();
        select(next);
      } else if (e.key === "ArrowLeft" || (e.key === "ArrowUp" && i > 0)) {
        e.preventDefault();
        const prev = isFirst ? tabs.length - 1 : i - 1;
        tabs[prev].focus();
        select(prev);
      } else if (e.key === "Home") {
        e.preventDefault();
        tabs[0].focus();
        select(0);
      } else if (e.key === "End") {
        e.preventDefault();
        tabs[tabs.length - 1].focus();
        select(tabs.length - 1);
      }
    });
  });

  // first panel: baseline entrance on scroll into view. Skipped under
  // reduced motion — the rows simply render in their final position.
  if (!REDUCED) {
    const firstPanel = panels[0];
    const firstRows = Array.from(firstPanel.querySelectorAll(".idx-row, .genre"));
    if (firstRows.length) {
      gsap.from(firstRows, {
        clipPath: "inset(0 0 100% 0)",
        y: 14,
        duration: 0.8,
        stagger: { each: 0.06, from: "start" },
        ease: "power3.out",
        clearProps: "clipPath",
        scrollTrigger: {
          trigger: firstPanel,
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
      });
    }
  }
}

initArchiveTabs();

/* ---------- music panel: genre filter + search + random pick ----------
   The playlist renders fully expanded (no accordion); the chip row filters
   by genre, the search filters within the visible genres, and the random
   button plays one card from whatever is currently browsable. */

function initMusicSearch() {
  const panel = document.getElementById("panel-music");
  const input = document.getElementById("music-search-input");
  const clear = document.getElementById("music-search-clear");
  const count = document.getElementById("music-search-count");
  const empty = document.getElementById("music-search-empty");
  const filterMount = document.getElementById("genre-filter");
  const randomBtn = document.getElementById("music-random");
  if (!panel || !input || !clear || !count || !empty) return;

  const cards = Array.from(panel.querySelectorAll(".idx-card[data-song-id]"));
  const genres = Array.from(panel.querySelectorAll(".genre"));
  const cardGenres = cards.map((card) => card.closest(".genre"));
  // active genre index into `genres`; -1 = 全部
  let activeGenre = -1;

  function normalize(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, " ").trim();
  }

  // Normalized per-card haystack, built once at init: matchCard then only
  // compares precomputed strings instead of re-querying and re-normalizing
  // all 763 cards on every keystroke.
  const cardHaystacks = cards.map((card) => {
    const title = card.querySelector(".idx-title");
    const artist = card.querySelector(".idx-artist");
    const hay = normalize((title ? title.textContent : "") + " " + (artist ? artist.textContent : ""));
    return { hay, compact: hay.replace(/\s+/g, ""), tokens: hay.split(" ").filter(Boolean) };
  });

  function levenshtein(a, b) {
    const m = a.length;
    const n = b.length;
    if (!m) return n;
    if (!n) return m;
    const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
    for (let j = 1; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    return dp[m][n];
  }

  function matchCard(haystack, qNorm) {
    if (!qNorm) return true;

    const { hay, compact, tokens } = haystack;
    const qCompact = qNorm.replace(/\s+/g, "");

    // Partial substring match: "lose" -> Lose Yourself, "kend" -> Kendrick Lamar.
    if (compact.includes(qCompact)) return true;

    // Multi-token fuzzy match: "god plan" can find "God's Plan".
    const qTokens = qNorm.split(" ").filter(Boolean);
    if (qTokens.every((token) => hay.includes(token))) return true;

    // Single-word typo/suffix tolerance for short inputs like "emine" -> Eminem.
    if (qTokens.length === 1 && qTokens[0].length >= 5) {
      const target = qTokens[0];
      return tokens.some((token) => {
        if (token.length < 4 || Math.abs(token.length - target.length) > 2) return false;
        const limit = target.length >= 6 ? 2 : 1;
        return levenshtein(token.slice(0, target.length), target) <= limit;
      });
    }

    return false;
  }

  // Global ScrollTrigger.refresh() walks the page's triggers — routed
  // through the shared debounced scheduler so keystroke bursts settle
  // into a single refresh.
  function refreshScroll() {
    scheduleRefresh();
  }

  // One visibility pass: the genre filter owns panel-level `hidden`, the
  // search owns per-card `is-search-hidden`; the counter only credits cards
  // inside genres the filter still shows.
  function applySearch() {
    const trimmed = input.value.trim();
    const searching = Boolean(trimmed);
    const qNorm = searching ? normalize(trimmed) : "";

    let visible = 0;
    cards.forEach((card, i) => {
      const genreHidden = cardGenres[i] ? cardGenres[i].hidden : false;
      const on = !genreHidden && matchCard(cardHaystacks[i], qNorm);
      card.classList.toggle("is-search-hidden", !on);
      if (on) visible++;
    });

    genres.forEach((genre) => {
      if (genre.hidden) return;
      const visibleInGenre = genre.querySelectorAll(".idx-card:not(.is-search-hidden)").length;
      genre.classList.toggle("is-search-empty", visibleInGenre === 0);
    });

    count.hidden = !searching && activeGenre === -1;
    count.textContent = visible + " / " + cards.length;
    empty.hidden = visible !== 0;
    clear.hidden = !searching;
    refreshScroll();
  }

  function clearSearch() {
    input.value = "";
    applySearch();
  }

  // ---- genre filter chips (rendered by music-stage.js) ----
  if (filterMount) {
    const chips = Array.from(filterMount.querySelectorAll(".genre-chip"));
    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        activeGenre = parseInt(chip.getAttribute("data-genre"), 10);
        chips.forEach((c) => {
          const on = c === chip;
          c.classList.toggle("is-active", on);
          c.setAttribute("aria-pressed", on ? "true" : "false");
        });
        genres.forEach((genre, i) => {
          genre.hidden = activeGenre !== -1 && i !== activeGenre;
        });
        applySearch();
      });
    });
  }

  // ---- random pick: play one card from whatever is currently browsable ----
  if (randomBtn) {
    randomBtn.addEventListener("click", () => {
      const pool = cards.filter((card, i) =>
        !(cardGenres[i] && cardGenres[i].hidden) && !card.classList.contains("is-search-hidden")
      );
      if (!pool.length) return;
      pool[Math.floor(Math.random() * pool.length)].click();
    });
  }

  // Coalesce keystroke bursts: each frame applies at most one search pass
  // over the 763 cards instead of one per input event.
  let searchFrame = 0;
  function requestApply() {
    if (searchFrame) return;
    searchFrame = requestAnimationFrame(() => {
      searchFrame = 0;
      applySearch();
    });
  }

  // IME safety: skip filtering during pinyin/IME composition — every
  // intermediate keystroke would otherwise run a full panel filter.
  let composing = false;
  input.addEventListener("compositionstart", () => { composing = true; });
  input.addEventListener("compositionend", () => {
    composing = false;
    requestApply();
  });
  input.addEventListener("input", () => {
    if (!composing) requestApply();
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") clearSearch();
  });
  clear.addEventListener("click", () => {
    clearSearch();
    input.focus();
  });
}

function initNetEaseLinks() {
  const drawer = document.getElementById("music-drawer");
  if (!drawer) return;

  // desktop platform check: only try the orpheus:// app scheme on Win/Mac/Linux
  // (belt-and-braces: check platform AND user agent so mobile browsers never
  // get the desktop scheme even when the platform string is unreliable)
  const ua = navigator.userAgent || "";
  const looksMobile = /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(ua);
  const isDesktop = /Win|Mac|Linux/.test(navigator.platform || "") && !looksMobile;

  // Launch the desktop app via the OFFICIAL orpheus:// deep-link format.
  // NetEase's own web player uses:
  //   location.href = "orpheus://" + base64(JSON.stringify({type,id,cmd:"play"}))
  function buildAppUrl(id) {
    const payload = JSON.stringify({ type: "song", id: id, cmd: "play" });
    const b64 = btoa(unescape(encodeURIComponent(payload)));
    return "orpheus://" + b64;
  }

  function tryAppLaunch(id) {
    const url = buildAppUrl(id);
    try {
      const a = document.createElement("a");
      a.href = url;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      a.remove();
      return true;
    } catch (err) {
      return false;
    }
  }

  // Dual strategy: prefer the desktop app; fall back to the web player.
  function openSong(id) {
    const webUrl = "https://music.163.com/#/song?id=" + id;

    // ---- mobile: launch the phone app directly ----
    if (looksMobile) {
      if (/Android/i.test(ua)) {
        // Android: intent:// lets Chrome launch the app and auto-fall back to
        // the web player when the app isn't installed (no timer needed).
        const fallback = encodeURIComponent(webUrl);
        location.href =
          "intent://song/" + id + "/#Intent;scheme=orpheus;package=com.netease.cloudmusic;S.browser_fallback_url=" + fallback + ";end";
        return;
      }
      // iOS / other mobile: orpheus:// scheme pulls the app and plays;
      // if nothing handles it, fall back to the web player after a beat.
      location.href = "orpheus://song/" + id;
      setTimeout(() => {
        if (!document.hidden) window.open(webUrl, "_blank", "noopener");
      }, 1500);
      return;
    }

    // ---- desktop: unchanged dual strategy ----
    if (!isDesktop) {
      window.open(webUrl, "_blank", "noopener");
      return;
    }
    const launched = tryAppLaunch(id);
    if (!launched) {
      window.open(webUrl, "_blank", "noopener");
      return;
    }
    let stillVisible = true;
    const onHide = () => { stillVisible = false; };
    document.addEventListener("visibilitychange", onHide, { once: true });
    window.addEventListener("blur", onHide, { once: true });
    setTimeout(() => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("blur", onHide);
      if (stillVisible) {
        window.open(webUrl, "_blank", "noopener");
      }
    }, 1200);
  }

  // event delegation: any card with data-song-id opens the song
  // (.track-sim = SIMILAR rows, .track-own = personally collected tracks)
  drawer.addEventListener("click", (e) => {
    const row = e.target.closest("[data-song-id]");
    if (!row) return;
    const id = row.getAttribute("data-song-id");
    if (!id) return;
    openSong(id);
  });

  // keyboard accessibility: Enter/Space opens too (focusable cards only)
  drawer.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const row = e.target.closest("[data-song-id]");
    if (!row) return;
    const id = row.getAttribute("data-song-id");
    if (!id) return;
    e.preventDefault();
    openSong(id);
  });

  // turn song cards into focusable, screen-reader friendly links.
  // Only add keyboard affordance to cards that actually carry an ID.
  drawer.querySelectorAll("[data-song-id]").forEach((card) => {
    card.setAttribute("role", "link");
    card.setAttribute("tabindex", "0");
    card.setAttribute(
      "aria-label",
      card.textContent.trim().replace(/\s+/g, " ") + ", open in NetEase Cloud Music"
    );
  });
}

initNetEaseLinks();

initMusicSearch();

/* ---------- game cards on touch: tap toggles the hover state ---------- */

if (TOUCH) {
  document.querySelectorAll(".hof-item").forEach((item) => {
    item.addEventListener("click", () => {
      const wasOpen = item.classList.contains("is-active");
      document.querySelectorAll(".hof-item.is-active").forEach((other) => other.classList.remove("is-active"));
      if (!wasOpen) item.classList.add("is-active");
    });
  });
}

/* ---------- books/sport rows: hover feedback is CSS-only (immediate
   background + chip swap, no transform) — high-frequency interactions
   get instant feedback per the motion rules in AGENTS.md ---------- */

/* ---------- about signature: build for everyone; REDUCED shows it statically ---------- */
const aboutSig = buildSignature("sig-about");

/* ---------- reduced motion: decorative animations only ---------- */
if (!REDUCED) {
  /* ---------- hero: floating orbs + mouse parallax ---------- */

  const orbLoops = [
    gsap.to(".orb-1", { y: 60, x: -30, duration: 14, repeat: -1, yoyo: true, ease: "sine.inOut" }),
    gsap.to(".orb-2", { y: -50, x: 40, duration: 11, repeat: -1, yoyo: true, ease: "sine.inOut" }),
    gsap.to(".orb-3", { y: 40, x: 25, duration: 9, repeat: -1, yoyo: true, ease: "sine.inOut" }),
  ];
  orbLoops.forEach((tw) => heroLoopTweens.add(tw));

  // Hibernate offscreen decor: pause the bubble/orb loops while the hero is
  // out of view, resume in place when it returns. onRefresh re-syncs after
  // global refreshes (e.g. a mid-page reload that restores scroll).
  const heroHibernator = ScrollTrigger.create({
    trigger: ".hero",
    start: "top top",
    end: "bottom top",
    onToggle: (self) => heroLoopTweens.forEach((tw) => tw.paused(!self.isActive)),
    onRefresh: (self) => heroLoopTweens.forEach((tw) => tw.paused(!self.isActive)),
  });
  heroLoopTweens.forEach((tw) => tw.paused(!heroHibernator.isActive));

  const hero = document.querySelector(".hero");
  const depthEls = gsap.utils.toArray("[data-depth]").map((el) => ({
    el,
    depth: parseFloat(el.dataset.depth),
    qx: gsap.quickTo(el, "x", { duration: 1.2, ease: "power3.out" }),
    qy: gsap.quickTo(el, "y", { duration: 1.2, ease: "power3.out" }),
  }));

  hero.addEventListener("pointermove", (e) => {
    const nx = e.clientX / window.innerWidth - 0.5;
    const ny = e.clientY / window.innerHeight - 0.5;
    depthEls.forEach(({ depth, qx, qy }) => {
      qx(nx * depth);
      qy(ny * depth);
    });
  });

  // hero drifts up slightly as you leave it
  gsap.to(".hero-inner", {
    yPercent: -12,
    opacity: 0.25,
    ease: "none",
    scrollTrigger: {
      trigger: ".hero",
      start: "top top",
      end: "bottom top",
      scrub: true,
      invalidateOnRefresh: true,
    },
  });

  /* ---------- big split headers: edge words slide to a centered lockup ----------
     All header motion is scrub-locked to scroll position (no time-based
     toggles), so fast scrolling can never leave the titles mid-animation. */

  function splitHeadParallax(headId) {
    const head = document.getElementById(headId);
    if (!head) return;
    const left = head.querySelector(".bh-left .bh-word");
    const right = head.querySelector(".bh-right .bh-word");

    // shift (in % of the word's own width) that centers the word in its line;
    // left word slides right (+), right word slides left (-)
    const slideToCenter = (word, sign) => () => {
      const line = word.parentElement;
      const lw = line.clientWidth;
      const ww = word.offsetWidth;
      if (!lw || !ww) return 0;
      return (sign * ((lw - ww) / 2) * 100) / ww;
    };

    const converge = { start: "top 95%", end: "center center", scrub: true, invalidateOnRefresh: true };
    if (left) {
      gsap.fromTo(left, { xPercent: 0 }, {
        xPercent: slideToCenter(left, 1),
        ease: "none",
        scrollTrigger: { trigger: head, ...converge },
      });
    }
    if (right) {
      gsap.fromTo(right, { xPercent: 0 }, {
        xPercent: slideToCenter(right, -1),
        ease: "none",
        scrollTrigger: { trigger: head, ...converge },
      });
    }

    // rise out of the overflow masks while converging
    gsap.from(head.querySelectorAll(".bh-line .bh-word"), {
      yPercent: 110,
      ease: "none",
      scrollTrigger: {
        trigger: head,
        start: "top 98%",
        end: "top 50%",
        scrub: true,
        invalidateOnRefresh: true,
      },
    });
    gsap.from(head.querySelectorAll(".bh-meta span"), {
      clipPath: "inset(0 0 100% 0)",
      yPercent: 60,
      ease: "none",
      stagger: 0.08,
      scrollTrigger: {
        trigger: head,
        start: "top 85%",
        end: "top 42%",
        scrub: true,
        invalidateOnRefresh: true,
      },
    });
  }

  splitHeadParallax("photo-head");
  splitHeadParallax("game-head");
  splitHeadParallax("archive-head");
  splitHeadParallax("poem-head");
  splitHeadParallax("about-head");

  /* ---------- section mask reveals (curtain wipe) ---------- */

  gsap.utils.toArray(".sec-mask").forEach((mask) => {
    gsap.fromTo(mask,
      { clipPath: "inset(0 0 100% 0)" },
      {
        clipPath: "inset(0 0 0% 0)",
        duration: 1.25,
        ease: "power4.inOut",
        scrollTrigger: {
          trigger: mask,
          start: "top 88%",
          toggleActions: "play none none reverse",
        },
      });
  });

  /* ---------- hall of fame cards: staggered entrance ---------- */

  gsap.from(".hof-card", {
    y: 90,
    rotationX: -8,
    clipPath: "inset(0 0 100% 0)",
    transformOrigin: "center bottom",
    duration: 1.1,
    stagger: { each: 0.09, from: "start" },
    ease: "power4.out",
    clearProps: "clipPath",
    // never hide the cards before the trigger fires: if the trigger is
    // missed for any reason the cards stay visible instead of blanking.
    immediateRender: false,
    scrollTrigger: {
      // trigger the OUTER .hof-scroll: the row itself is a transform
      // target, and triggers inside a transformed element measure
      // degenerately.
      trigger: ".hof-scroll",
      start: "top 70%",
      toggleActions: "play none none reverse",
    },
  });

  /* ---------- about body: SplitText line masks (curtain fallback) ---------- */

  if (window.SplitText) {
    const aboutSplit = SplitText.create(".about-body p", { type: "lines", mask: "lines", autoSplit: true });
    gsap.from(aboutSplit.lines, {
      yPercent: 110,
      duration: 0.9,
      stagger: 0.05,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".about-body",
        start: "top 82%",
        toggleActions: "play none none reverse",
      },
    });
  } else {
    gsap.from(".about-body p", {
      y: 16,
      clipPath: "inset(0 0 100% 0)",
      duration: 0.9,
      stagger: 0.14,
      ease: "power3.out",
      clearProps: "clipPath",
      scrollTrigger: {
        trigger: ".about-body",
        start: "top 82%",
        toggleActions: "play none none reverse",
      },
    });
  }

  /* ---------- about stats + signature entrance ---------- */

  if (aboutSig) {
    setupSignatureDraw(aboutSig);
    // draw when the about section scrolls into view; redraw each time
    // (toggleActions reverse hides it again on the way up)
    const st = ScrollTrigger.create({
      trigger: "#about .about-stats",
      start: "top 80%",
      end: "bottom 40%",
      toggleActions: "play pause reverse pause",
      onEnter: () => {
        gsap.set(aboutSig.fills, { opacity: 0 });
        animateSignature(aboutSig, { duration: 1.1, stagger: 0.08, fillAt: "<0.2" });
      },
      onLeaveBack: () => {
        aboutSig.paths.forEach((p) => gsap.set(p, { strokeDashoffset: p.dataset.len }));
        gsap.set(aboutSig.fills, { opacity: 0 });
      },
      onEnterBack: () => {
        gsap.set(aboutSig.fills, { opacity: 0 });
        animateSignature(aboutSig, { duration: 1.1, stagger: 0.08, fillAt: "<0.2" });
      },
    });
  }

  gsap.from(".about-stats span", {
    yPercent: 110,
    duration: 0.7,
    stagger: 0.08,
    ease: "power3.out",
    scrollTrigger: {
      trigger: ".about-stats",
      start: "top 85%",
      toggleActions: "play none none reverse",
    },
  });

  /* ---------- coda entrance ---------- */

  gsap.from(".coda-title", {
    yPercent: 110,
    duration: 1.1,
    stagger: 0.14,
    ease: "power4.out",
    scrollTrigger: {
      trigger: ".coda",
      start: "top 85%",
      toggleActions: "play none none reverse",
    },
  });

  gsap.from(".coda-mono", {
    clipPath: "inset(0 0 100% 0)",
    yPercent: 40,
    duration: 1,
    delay: 0.5,
    ease: "power3.inOut",
    clearProps: "clipPath",
    scrollTrigger: {
      trigger: ".coda",
      start: "top 85%",
      toggleActions: "play none none reverse",
    },
  });

  /* ---------- poem: stamp slam + ink-develop entrance (the section's signature) ---------- */

  const poemSheet = document.querySelector(".poem-sheet");
  const poemStamp = document.querySelector(".poem-stamp");
  const poemLines = gsap.utils.toArray(".poem-text p");

  if (poemSheet && poemStamp && poemLines.length) {
    gsap.set(poemLines, { clipPath: "inset(0 100% 0 0)" });
    gsap.set(poemStamp, { opacity: 0, scale: 1.9, rotation: 14 });

    const slamStamp = () => {
      gsap.timeline()
        .to(poemStamp, { opacity: 1, scale: 1, rotation: 4, duration: 0.45, ease: "back.in(1.8)" })
        .to(poemSheet, { y: 6, duration: 0.09, ease: "power2.in" }, ">-0.04")
        .to(poemSheet, { y: 0, duration: 0.55, ease: "elastic.out(1.4, 0.3)" })
        .to(poemLines, {
          clipPath: "inset(0 0% 0 0)",
          duration: 0.9,
          stagger: 0.14,
          ease: "power2.inOut",
          clearProps: "clipPath",
        }, "<0.1");
    };

    ScrollTrigger.create({
      trigger: poemSheet,
      start: "top 72%",
      once: true,
      onEnter: slamStamp,
    });

    // the stamp is a state machine: click or Enter/Space to re-stamp
    const restamp = () => {
      gsap.set(poemLines, { clipPath: "inset(0 100% 0 0)" });
      gsap.set(poemStamp, { opacity: 0, scale: 1.9, rotation: 14 });
      slamStamp();
    };
    poemStamp.addEventListener("click", restamp);
    poemStamp.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      restamp();
    });
  }

  gsap.from(".poem-block", {
    y: 40,
    clipPath: "inset(0 0 100% 0)",
    duration: 0.9,
    stagger: 0.14,
    ease: "power3.out",
    clearProps: "clipPath",
    scrollTrigger: {
      trigger: ".poem-notes",
      start: "top 86%",
      toggleActions: "play none none reverse",
    },
  });

  /* ---------- ticker: scroll velocity drives speed + skew ----------
     The marquee loop is owned by GSAP (CSS animation is disabled via
     .is-js-driven) so fast scrolling can accelerate it; stop settles back. */

  const tickerTracks = gsap.utils.toArray(".ticker-track");
  if (tickerTracks.length) {
    const skewSetters = tickerTracks.map((t) => gsap.quickTo(t, "skewX", { duration: 0.55, ease: "power3.out" }));
    const marqueeTweens = tickerTracks.map((t) => {
      t.classList.add("is-js-driven");
      return gsap.to(t, { xPercent: -50, ease: "none", duration: 26, repeat: -1 });
    });

    // Pause each marquee while its ticker strip is offscreen and resume it in
    // place on return. The velocity handler below skips paused tweens, so an
    // offscreen ticker's timeScale stays untouched until it is visible again.
    tickerTracks.forEach((track, i) => {
      ScrollTrigger.create({
        trigger: track.closest(".ticker") || track,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => marqueeTweens[i].paused(!self.isActive),
      });
    });

    let settleTweens = [];
    let skewIdle;
    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        settleTweens.forEach((t) => t.kill());
        settleTweens = [];
        const v = gsap.utils.clamp(-9, 9, self.getVelocity() / -300);
        // velocity magnitude boosts the marquee: 1x idle → ~3.2x flat-out
        // (visible marquees only; offscreen ones stay paused and untouched)
        const speed = 1 + (Math.abs(v) / 9) * 2.2;
        marqueeTweens.forEach((tw) => {
          if (!tw.paused()) tw.timeScale(speed);
        });
        skewSetters.forEach((fn) => fn(v));
        clearTimeout(skewIdle);
        skewIdle = setTimeout(() => {
          settleTweens = marqueeTweens
            .filter((tw) => !tw.paused())
            .map((tw) => gsap.to(tw, { timeScale: 1, duration: 0.9, ease: "power2.out" }));
          skewSetters.forEach((fn) => fn(0));
        }, 140);
      },
    });
  }

  /* ---------- footer entrance ---------- */

  gsap.from(".footer-name", {
    clipPath: "inset(0 0 100% 0)",
    yPercent: 60,
    duration: 1,
    ease: "power4.out",
    clearProps: "clipPath",
    scrollTrigger: {
      trigger: ".footer",
      start: "top 85%",
      toggleActions: "play none none reverse",
    },
  });

  /* ---------- refresh after everything settles ---------- */
  window.addEventListener("load", () => scheduleRefresh(100));
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => scheduleRefresh(100));
  }
} else if (aboutSig) {
  // reduced motion: show the about signature statically (no draw animation,
  // no scroll-linked redraw)
  gsap.set(aboutSig.fills, { opacity: 1 });
}

/* ---------- nav active section + scroll progress (always active) ---------- */

const navAnchors = Array.from(document.querySelectorAll(".nav-links a"));
// Pair each anchor with its section up front so a missing href target can
// never shift the active-highlight index (anchor[i] vs section[i] drift).
const navPairs = navAnchors
  .map((a) => ({ anchor: a, section: document.querySelector(a.getAttribute("href")) }))
  .filter((pair) => pair.section);

const progressFill = document.getElementById("scroll-progress-fill");

// Section offsets are cached on ScrollTrigger refresh (and once at boot);
// the per-scroll onUpdate only reads these. Reading offsetTop/scrollHeight
// on every scroll event forces a synchronous layout each time.
let navOffsets = navPairs.map((p) => p.section.offsetTop);
let navMaxScroll = document.documentElement.scrollHeight - window.innerHeight;
function cacheNavMetrics() {
  navOffsets = navPairs.map((p) => p.section.offsetTop);
  navMaxScroll = document.documentElement.scrollHeight - window.innerHeight;
}

function updateNavAndProgress(self) {
  const y = self.scroll() + window.innerHeight * 0.45;
  let current = -1;
  for (let i = 0; i < navOffsets.length; i++) {
    if (navOffsets[i] <= y) current = i;
  }
  if (self.scroll() >= navMaxScroll - 4) {
    current = navPairs.length - 1;
  }
  navPairs.forEach((pair, i) => pair.anchor.classList.toggle("is-active", i === current));
  if (progressFill) progressFill.style.transform = "scaleX(" + self.progress + ")";
}

ScrollTrigger.create({
  start: 0,
  end: "max",
  onUpdate: updateNavAndProgress,
  onRefresh: (self) => {
    cacheNavMetrics();
    updateNavAndProgress(self);
  },
});
