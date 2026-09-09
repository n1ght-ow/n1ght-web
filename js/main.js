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

/* ---------- motion tokens ----------
   One place for the site's reusable motion values. New interactions should
   pick a category instead of inventing a one-off duration/ease:
   - feedback: high-frequency hover / press / drag-follow, <=150ms
   - enter: low-frequency entrances, 0.7-1.1s
   - spring: low-frequency state changes only, never high-frequency
   Every animation still needs a one-line motivation and a reduced-motion
   static alternative at the call site. */
const MOTION = {
  feedback: { duration: 0.15, press: 0.12, ease: "power2.out" },
  enter: { duration: 0.85, longDuration: 1.1, ease: "power3.out", heavyEase: "power4.out", stagger: 0.09 },
  spring: { duration: 0.6, ease: "back.out(1.7)" },
};

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
  // feedback: cursor follow is high-frequency direct manipulation
  const cx = gsap.quickTo(cursor, "x", { duration: MOTION.feedback.duration, ease: MOTION.feedback.ease });
  const cy = gsap.quickTo(cursor, "y", { duration: MOTION.feedback.duration, ease: MOTION.feedback.ease });
  // gsap.quickTo on the scaled `scale` alias does not tween the dot, so drive
  // scaleX + scaleY (together with gsap.to on mousedown/mouseup) to expand the
  // badge and keep the mono label centered inside it.
  const growX = gsap.quickTo(dot, "scaleX", { duration: MOTION.feedback.duration, ease: MOTION.feedback.ease });
  const growY = gsap.quickTo(dot, "scaleY", { duration: MOTION.feedback.duration, ease: MOTION.feedback.ease });
  const grow = (v) => { growX(v); growY(v); };

  let baseScale = 1;

  window.addEventListener("pointermove", (e) => { cx(e.clientX); cy(e.clientY); }, { passive: true });

  document.addEventListener("mouseover", (e) => {
    const labelled = e.target.closest("[data-cursor]");
    if (labelled) {
      label.textContent = labelled.getAttribute("data-cursor");
      baseScale = 6;
      gsap.to(label, { opacity: 1, duration: MOTION.feedback.duration, overwrite: "auto" });
    } else if (e.target.closest("a, button, .photo-frame-btn, .hof-card, .idx-row, .idx-card")) {
      baseScale = 2.6;
      gsap.to(label, { opacity: 0, duration: MOTION.feedback.duration, overwrite: "auto" });
    } else {
      baseScale = 1;
      gsap.to(label, { opacity: 0, duration: MOTION.feedback.duration, overwrite: "auto" });
    }
    grow(baseScale);
  });

  document.addEventListener("mousedown", () => gsap.to(dot, { scale: baseScale * 0.75, duration: MOTION.feedback.press, ease: "power2.in", overwrite: "auto" }));
  document.addEventListener("mouseup", () => gsap.to(dot, { scale: baseScale, duration: MOTION.feedback.duration, ease: MOTION.feedback.ease, overwrite: "auto" }));
  document.documentElement.addEventListener("mouseleave", () => gsap.to(cursor, { autoAlpha: 0, duration: MOTION.feedback.duration, overwrite: "auto" }));
  document.documentElement.addEventListener("mouseenter", () => gsap.to(cursor, { autoAlpha: 1, duration: MOTION.feedback.duration, overwrite: "auto" }));
}
initCursor();

function initMagnetic() {
  if (TOUCH || !FINE_POINTER || REDUCED) return;
  gsap.utils.toArray(".nav-links a, .tab-btn, .lb-close, .lb-nav, .footer-links a").forEach((el) => {
    // high-frequency drag-follow: tight near-instant follow, no elastic release
    // feedback: magnetic follow is high-frequency direct manipulation
    const xTo = gsap.quickTo(el, "x", { duration: MOTION.feedback.duration, ease: MOTION.feedback.ease });
    const yTo = gsap.quickTo(el, "y", { duration: MOTION.feedback.duration, ease: MOTION.feedback.ease });
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.3);
    });
    el.addEventListener("pointerleave", () => {
      gsap.to(el, { x: 0, y: 0, duration: MOTION.feedback.duration, ease: MOTION.feedback.ease, overwrite: "auto" });
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

/* ---------- horizontal scroller (game roster) ----------
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
  let itemCount = opts.itemCount;

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
    const frame = Math.min(itemCount, Math.max(1, Math.round(clamped * (itemCount - 1)) + 1));
    if (frame !== lastFrame) {
      lastFrame = frame;
      barCount.textContent = opts.label + " " + String(frame).padStart(2, "0") + " / " + String(itemCount).padStart(2, "0");
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
        // one-off inertia glide: not an entrance, so it stays out of MOTION.enter
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
  return {
    render,
    setItemCount: (nextCount) => {
      itemCount = Math.max(1, nextCount);
      lastFrame = -1;
      render(progress);
    },
  };
}

const gameScroller = makeHorizontalScroller({
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

/* ---------- photo field roll: entrance + progress line ---------- */

const photoRoll = document.querySelector(".photo-roll");
const photoMeterFill = document.getElementById("photo-roll-fill");
const photoMeterAct = document.getElementById("photo-roll-act");
const photoMeterCount = document.getElementById("photo-roll-count");

if (photoRoll && !REDUCED && window.ScrollTrigger) {
  // signature moment: the gold roll line fills as the chapter scrolls
  if (photoMeterFill) {
    let lastMeterFrame = 0;
    let lastMeterAct = "";
    gsap.fromTo(photoMeterFill, { scaleX: 0 }, {
      scaleX: 1,
      ease: "none",
      scrollTrigger: {
        trigger: photoRoll,
        start: "top 72%",
        end: "bottom 72%",
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const frame = Math.min(11, Math.max(1, Math.round(self.progress * 10) + 1));
          if (frame !== lastMeterFrame) {
            lastMeterFrame = frame;
            if (photoMeterCount) photoMeterCount.textContent = "FRAME " + String(frame).padStart(2, "0") + " / 11";
            const act = frame <= 7 ? "BLOOM" : "HORIZON";
            if (act !== lastMeterAct) {
              lastMeterAct = act;
              if (photoMeterAct) photoMeterAct.textContent = act;
            }
          }
        },
      },
    });
  }

  // enter: photo field roll is a low-frequency narrative entrance
  gsap.utils.toArray(".photo-act").forEach((act) => {
    gsap.from(act.querySelectorAll(".photo-frame"), {
      clipPath: "inset(0 0 100% 0)",
      y: 24,
      autoAlpha: 0,
      duration: MOTION.enter.duration,
      ease: MOTION.enter.ease,
      stagger: MOTION.enter.stagger,
      immediateRender: false,
      scrollTrigger: { trigger: act, start: "top 78%", toggleActions: "play none none none" },
    });
  });
  gsap.from(".photo-frame-lead", {
    clipPath: "inset(0 0 100% 0)",
    y: 24,
    autoAlpha: 0,
    duration: MOTION.enter.duration,
    ease: MOTION.enter.ease,
    immediateRender: false,
    scrollTrigger: { trigger: ".photo-roll-head", start: "top 82%", toggleActions: "play none none none" },
  });
}

/* ---------- unified detail layer: photo / film / series / game / music ----------
   One #lightbox serves every archive type. The photo viewer keeps its frame
   rail; films/series add poster + meta + IMDb; games add cover + hours + quote;
   music adds the NetEase link. Opening, closing, inert, focus trap and swipe
   are shared. */

const lightbox = document.getElementById("lightbox");
const lbStage = document.getElementById("lb-stage");
const lbImg = document.getElementById("lb-img");
const lbCap = document.getElementById("lb-cap");
const lbMusic = document.getElementById("lb-music");
const lbMusicLabel = lbMusic ? lbMusic.querySelector(".lb-music-label") : null;
const lbMeta = document.getElementById("lb-meta");
const lbKicker = document.getElementById("lb-kicker");
const lbTitle = document.getElementById("lb-title");
const lbLines = document.getElementById("lb-lines");
const lbQuote = document.getElementById("lb-quote");
const lbLink = document.getElementById("lb-link");
const lbCount = document.getElementById("lb-count");
const lbAct = document.getElementById("lb-act");
const lbCloseBtn = document.getElementById("lb-close");
const lbPrevBtn = document.getElementById("lb-prev");
const lbNextBtn = document.getElementById("lb-next");
const lbRail = document.getElementById("lb-rail");
const lbLive = document.getElementById("lb-live");
const photoFrames = Array.from(document.querySelectorAll(".photo-frame"));

let lbIndex = 0;
let isLbOpen = false;
let lbTrigger = null;
let lbThumbs = [];
let detailType = "photo";
let detailItems = [];
let openNetEaseSong = null;

function detailText(root, selector) {
  const node = root.querySelector(selector);
  return node ? node.textContent.trim() : "";
}

function photoFrameData(frame) {
  const img = frame.querySelector("img");
  const cap = frame.querySelector(".photo-frame-text");
  const no = frame.querySelector(".photo-frame-no");
  return {
    type: "photo",
    src: img ? img.getAttribute("src") : "",
    alt: img ? img.alt : "",
    caption: cap ? cap.textContent.trim() : "",
    number: no ? no.textContent.trim() : "",
    act: frame.closest(".photo-act-horizon") ? "HORIZON" : "BLOOM",
  };
}

function gameItemData(item) {
  const img = item.querySelector("img");
  const name = detailText(item, ".hof-name");
  return {
    type: "game",
    id: item.getAttribute("data-game"),
    name: name,
    hours: detailText(item, ".hof-hours"),
    quote: detailText(item, ".hof-quote"),
    src: img ? img.getAttribute("src") : "",
    alt: img ? img.alt : name,
    rank: Array.from(document.querySelectorAll("#panel-games .hof-item")).indexOf(item) + 1,
  };
}

function musicItemData(card) {
  const genre = card.closest(".genre");
  return {
    type: "music",
    id: card.getAttribute("data-song-id"),
    title: detailText(card, ".idx-title"),
    artist: detailText(card, ".idx-artist"),
    genre: genre ? detailText(genre, ".genre-title") : "",
  };
}

function detailItemsFor(type) {
  if (type === "photo") return photoFrames.map(photoFrameData);
  if (type === "film") {
    return (window.FilmStage && window.FilmStage.data ? window.FilmStage.data : (window.FILM_DATA || [])).slice();
  }
  if (type === "series") {
    return (window.SeriesStage && window.SeriesStage.data ? window.SeriesStage.data : (window.SERIES_DATA || [])).slice();
  }
  if (type === "game") {
    return Array.from(document.querySelectorAll("#panel-games .hof-item")).map(gameItemData);
  }
  if (type === "music") {
    const panel = document.getElementById("panel-music");
    if (!panel) return [];
    return Array.from(panel.querySelectorAll(".idx-card[data-song-id]"))
      .filter((card) => card.offsetParent !== null)
      .map(musicItemData);
  }
  return [];
}

function detailLabel(type) {
  if (type === "film") return "FILM";
  if (type === "series") return "SERIES";
  if (type === "game") return "GAME";
  if (type === "music") return "TRACK";
  return "FRAME";
}

function detailAct(type, item) {
  if (type === "photo") return item.act;
  if (type === "film") return item.genre;
  if (type === "series") return item.category;
  if (type === "game") return "GAME";
  if (type === "music") return item.genre || "TRACK";
  return "";
}

function setPageInert(on) {
  Array.from(document.body.children).forEach((el) => {
    if (el === lightbox || el.tagName === "SCRIPT") return;
    if (on) el.setAttribute("inert", "");
    else el.removeAttribute("inert");
  });
}

function lbBuildRail() {
  if (!lbRail) return;
  lbRail.innerHTML = "";
  lbThumbs = photoFrames.map((frame, i) => {
    const data = photoFrameData(frame);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "lb-thumb";
    btn.setAttribute("aria-label", "Frame " + String(i + 1).padStart(2, "0") + ": " + data.caption);
    const thumbImg = document.createElement("img");
    thumbImg.src = data.src;
    thumbImg.alt = "";
    thumbImg.loading = "lazy";
    thumbImg.decoding = "async";
    btn.appendChild(thumbImg);
    btn.addEventListener("click", () => lbLoad(i));
    lbRail.appendChild(btn);
    return btn;
  });
}

function setDetailVisibility(show) {
  if (lbImg) lbImg.hidden = !show.image;
  if (lbCap) lbCap.hidden = !show.caption;
  if (lbMusic) lbMusic.hidden = !show.music;
  if (lbMeta) lbMeta.hidden = !show.meta;
  if (lbRail) lbRail.hidden = !show.rail;
}

function renderDetail() {
  const item = detailItems[lbIndex];
  if (!item) return;
  const label = detailLabel(detailType);
  const total = detailItems.length;
  lbCount.textContent = label + " " + String(lbIndex + 1).padStart(2, "0") + " / " + String(total).padStart(2, "0");
  if (lbAct) lbAct.textContent = detailAct(detailType, item);
  if (lbPrevBtn) lbPrevBtn.setAttribute("aria-label", "Previous " + label.toLowerCase());
  if (lbNextBtn) lbNextBtn.setAttribute("aria-label", "Next " + label.toLowerCase());

  if (detailType === "photo") {
    setDetailVisibility({ image: true, caption: true, music: false, meta: false, rail: true });
    lbImg.classList.remove("is-loaded");
    lbImg.alt = item.alt;
    lbImg.src = item.src;
    lbCap.textContent = item.caption;
    lbThumbs.forEach((btn, i) => {
      if (i === lbIndex) btn.setAttribute("aria-current", "true");
      else btn.removeAttribute("aria-current");
    });
    if (lbLive) {
      lbLive.textContent = "Frame " + String(lbIndex + 1).padStart(2, "0") + " of " + total + ", " + item.act + ". " + item.caption;
    }
    return;
  }

  if (detailType === "music") {
    setDetailVisibility({ image: false, caption: false, music: true, meta: true, rail: false });
    if (lbMusicLabel) lbMusicLabel.textContent = "NETEASE CLOUD MUSIC";
    lbKicker.textContent = item.genre;
    lbTitle.textContent = item.title;
    lbLines.textContent = item.artist;
    lbQuote.textContent = "Open in NetEase Cloud Music to play this track.";
    lbLink.hidden = false;
    lbLink.textContent = "OPEN IN NETEASE ↗";
    lbLink.href = "https://music.163.com/#/song?id=" + item.id;
    lbLink.dataset.songId = item.id;
    if (lbLive) {
      lbLive.textContent = "Track " + String(lbIndex + 1).padStart(2, "0") + " of " + total + ", " + item.title + " by " + item.artist + ". " + item.genre;
    }
    return;
  }

  setDetailVisibility({ image: true, caption: false, music: false, meta: true, rail: false });
  lbImg.classList.remove("is-loaded");
  lbLink.dataset.songId = "";
  if (detailType === "film") {
    lbImg.alt = item.title + " poster";
    lbImg.src = item.poster;
    lbKicker.textContent = item.genre + " · " + item.year;
    lbTitle.textContent = item.title;
    lbLines.textContent = item.director;
    lbQuote.textContent = item.quote;
    lbLink.hidden = false;
    lbLink.textContent = "OPEN ON IMDb ↗";
    lbLink.href = "https://www.imdb.com/title/" + item.imdb + "/";
    if (lbLive) {
      lbLive.textContent = "Film " + String(lbIndex + 1).padStart(2, "0") + " of " + total + ", " + item.title + ". " + item.director + ", " + item.year + ". " + item.quote;
    }
  } else if (detailType === "series") {
    lbImg.alt = item.title + " poster";
    lbImg.src = item.poster;
    lbKicker.textContent = item.category + " · " + item.years;
    lbTitle.textContent = item.title;
    lbLines.textContent = item.seasons;
    lbQuote.textContent = item.quote;
    lbLink.hidden = false;
    lbLink.textContent = "OPEN ON IMDb ↗";
    lbLink.href = "https://www.imdb.com/title/" + item.imdb + "/";
    if (lbLive) {
      lbLive.textContent = "Series " + String(lbIndex + 1).padStart(2, "0") + " of " + total + ", " + item.title + ". " + item.years + ", " + item.seasons + ". " + item.quote;
    }
  } else if (detailType === "game") {
    lbImg.alt = item.alt;
    lbImg.src = item.src;
    lbKicker.textContent = "RANK " + String(item.rank).padStart(2, "0");
    lbTitle.textContent = item.name;
    lbLines.textContent = item.hours;
    lbQuote.textContent = item.quote;
    lbLink.hidden = true;
    if (lbLive) {
      lbLive.textContent = "Game " + String(lbIndex + 1).padStart(2, "0") + " of " + total + ", " + item.name + ". " + item.hours + ". " + item.quote;
    }
  }
}

function lbLoad(i) {
  if (!detailItems.length) return;
  lbIndex = ((i % detailItems.length) + detailItems.length) % detailItems.length;
  renderDetail();
}

function lbFocusables() {
  if (!lightbox) return [];
  return Array.from(lightbox.querySelectorAll("button:not([disabled]), [href], [tabindex]:not([tabindex='-1'])"))
    .filter((el) => el.offsetParent !== null || el === document.activeElement);
}

function openDetail(type, index) {
  if (!lightbox) return;
  const items = detailItemsFor(type);
  if (!items.length) return;
  detailType = type;
  detailItems = items;
  lbIndex = Math.max(0, Math.min(Number(index) || 0, items.length - 1));
  lbTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  if (type === "photo" && !lbThumbs.length) lbBuildRail();
  renderDetail();
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  setPageInert(true);
  if (lenis) lenis.stop();
  isLbOpen = true;
  lbCloseBtn.focus();
}

function closeDetail() {
  if (!lightbox) return;
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  setPageInert(false);
  if (lenis) lenis.start();
  // empty src would re-request the page URL itself; drop the attribute
  lbImg.removeAttribute("src");
  isLbOpen = false;
  // hand focus back to the card that opened the detail layer
  if (lbTrigger && document.contains(lbTrigger)) lbTrigger.focus();
  lbTrigger = null;
}

function initUnifiedDetail() {
  if (!lightbox) return;
  lbBuildRail();

  photoFrames.forEach((frame, i) => {
    const btn = frame.querySelector(".photo-frame-btn");
    if (btn) btn.addEventListener("click", () => openDetail("photo", i));
  });

  [["films", "film"], ["series", "series"]].forEach(([token, type]) => {
    const panel = document.getElementById("panel-" + token);
    if (!panel) return;
    panel.addEventListener("click", (e) => {
      const card = e.target.closest(".film-card, .series-card");
      if (!card) return;
      const cards = Array.from(panel.querySelectorAll(".film-card, .series-card"));
      const index = cards.indexOf(card);
      if (index >= 0) openDetail(type, index);
    });
  });

  const gamePanel = document.getElementById("panel-games");
  if (gamePanel) {
    Array.from(gamePanel.querySelectorAll(".hof-item")).forEach((item) => {
      item.setAttribute("role", "button");
      item.setAttribute("tabindex", "0");
      item.setAttribute("aria-label", "Open details for " + detailText(item, ".hof-name") + ", " + detailText(item, ".hof-hours"));
    });
    const openGame = (item) => {
      const items = Array.from(gamePanel.querySelectorAll(".hof-item"));
      const index = items.indexOf(item);
      if (index >= 0) openDetail("game", index);
    };
    gamePanel.addEventListener("click", (e) => {
      const item = e.target.closest(".hof-item");
      if (item) openGame(item);
    });
    gamePanel.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const item = e.target.closest(".hof-item");
      if (!item) return;
      e.preventDefault();
      openGame(item);
    });
  }

  const musicPanel = document.getElementById("panel-music");
  if (musicPanel) {
    Array.from(musicPanel.querySelectorAll(".idx-card[data-song-id]")).forEach((card) => {
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-label", "Open details for " + detailText(card, ".idx-title") + " by " + detailText(card, ".idx-artist"));
    });
    const openMusic = (card) => {
      const visible = Array.from(musicPanel.querySelectorAll(".idx-card[data-song-id]")).filter((c) => c.offsetParent !== null);
      const index = visible.indexOf(card);
      if (index >= 0) openDetail("music", index);
    };
    musicPanel.addEventListener("click", (e) => {
      const card = e.target.closest(".idx-card[data-song-id]");
      if (card) openMusic(card);
    });
    musicPanel.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const card = e.target.closest(".idx-card[data-song-id]");
      if (!card) return;
      e.preventDefault();
      openMusic(card);
    });
  }

  lbCloseBtn.addEventListener("click", closeDetail);
  lbPrevBtn.addEventListener("click", () => lbLoad(lbIndex - 1));
  lbNextBtn.addEventListener("click", () => lbLoad(lbIndex + 1));
  lbImg.addEventListener("load", () => lbImg.classList.add("is-loaded"));
  if (lbLink) {
    lbLink.addEventListener("click", (e) => {
      const songId = lbLink.dataset.songId;
      if (!songId) return;
      e.preventDefault();
      if (typeof openNetEaseSong === "function") openNetEaseSong(songId);
    });
  }

  // clicking the dark backdrop closes
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeDetail();
  });

  document.addEventListener("keydown", (e) => {
    if (!isLbOpen) return;
    if (e.key === "Escape") { e.preventDefault(); closeDetail(); return; }
    if (e.key === "ArrowLeft") { e.preventDefault(); lbLoad(lbIndex - 1); return; }
    if (e.key === "ArrowRight") { e.preventDefault(); lbLoad(lbIndex + 1); return; }
    if (e.key !== "Tab") return;
    // focus trap: cycle through every control inside the viewer
    const focusables = lbFocusables();
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
  });

  // touch: horizontal swipe on the stage changes items
  if (lbStage) {
    let swipeX = 0, swipeY = 0, trackingSwipe = false;
    lbStage.addEventListener("touchstart", (e) => {
      swipeX = e.changedTouches[0].clientX;
      swipeY = e.changedTouches[0].clientY;
      trackingSwipe = true;
    }, { passive: true });
    lbStage.addEventListener("touchend", (e) => {
      if (!trackingSwipe) return;
      trackingSwipe = false;
      const dx = e.changedTouches[0].clientX - swipeX;
      const dy = e.changedTouches[0].clientY - swipeY;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        lbLoad(lbIndex + (dx < 0 ? 1 : -1));
      }
    }, { passive: true });
  }
}

initUnifiedDetail();

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
    tabbar.dispatchEvent(new CustomEvent("night:archive-tab", {
      detail: { token: tabs[idx].getAttribute("data-tab"), index: idx },
    }));
  };

  const animateIn = (idx, rows) => {
    const panel = panels[idx];
    if (!panel) return;
    if (!rows || !rows.length) return;
    if (REDUCED) {
      gsap.set(rows, { y: 0 });
      return;
    }
    // one-off state transition: tab wipe uses power4.inOut, deliberately
    // different from MOTION.enter (it is a state change, not an entrance).
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
    // the games panel measures lazily (it mounts display:none); refresh so
    // the in-panel ScrollTrigger and the drag scroller re-measure
    scheduleRefresh();
    const rows = panels[idx] ? Array.from(panels[idx].querySelectorAll(".idx-row, .genre, .hof-item")) : [];
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
  // enter: dense rows use a tighter 0.06 stagger; duration/ease stay shared.
  if (!REDUCED) {
    const firstPanel = panels[0];
    const firstRows = Array.from(firstPanel.querySelectorAll(".idx-row, .genre"));
    if (firstRows.length) {
      gsap.from(firstRows, {
        clipPath: "inset(0 0 100% 0)",
        y: 14,
        duration: MOTION.enter.duration,
        stagger: { each: 0.06, from: "start" },
        ease: MOTION.enter.ease,
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

/* ---------- archive favorites: localStorage-backed star toggles ---------- */

const FAV_KEY = "night:favorites";
const FAV_TYPES = ["photo", "book", "film", "series", "sport", "game", "music"];
const favorites = {};
FAV_TYPES.forEach((type) => { favorites[type] = new Set(); });

function loadFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem(FAV_KEY) || "{}");
    FAV_TYPES.forEach((type) => {
      favorites[type].clear();
      if (Array.isArray(saved[type])) {
        saved[type].forEach((id) => favorites[type].add(String(id)));
      }
    });
  } catch (err) {
    // private mode / corrupt JSON: keep the in-memory defaults
  }
}

function saveFavorites() {
  try {
    const out = {};
    FAV_TYPES.forEach((type) => { out[type] = Array.from(favorites[type]); });
    localStorage.setItem(FAV_KEY, JSON.stringify(out));
  } catch (err) {
    // storage unavailable: favorites stay session-only
  }
}

function isFavorite(type, id) {
  return Boolean(favorites[type] && favorites[type].has(String(id)));
}

function toggleFavorite(type, id) {
  const key = String(id);
  if (!favorites[type]) favorites[type] = new Set();
  if (favorites[type].has(key)) favorites[type].delete(key);
  else favorites[type].add(key);
  saveFavorites();
}

function favoriteSlug(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-").replace(/^-+|-+$/g, "");
}

function createFavoriteButton(type, id, name) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "fav-btn";
  btn.setAttribute("data-fav-type", type);
  btn.setAttribute("data-fav-id", String(id));
  btn.setAttribute("data-fav-name", name);
  btn.setAttribute("aria-pressed", "false");
  btn.setAttribute("aria-label", "Save " + name + " to favorites");
  btn.textContent = "☆";
  return btn;
}

function syncFavoriteButtons() {
  document.querySelectorAll(".fav-btn[data-fav-type][data-fav-id]").forEach((btn) => {
    const type = btn.getAttribute("data-fav-type");
    const id = btn.getAttribute("data-fav-id");
    const on = isFavorite(type, id);
    const name = btn.getAttribute("data-fav-name") || "this item";
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.textContent = on ? "★" : "☆";
    btn.setAttribute("aria-label", (on ? "Remove " : "Save ") + name + (on ? " from favorites" : " to favorites"));
  });
}

function addFavoriteButton(item, type, id, name) {
  if (!item || item.querySelector(":scope > .fav-btn")) return;
  item.appendChild(createFavoriteButton(type, id, name));
}

function wrapWithFavorite(item, wrapClass, type, id, name) {
  if (!item) return;
  const parent = item.parentElement;
  if (parent && parent.classList.contains(wrapClass)) {
    if (!parent.querySelector(":scope > .fav-btn")) {
      parent.appendChild(createFavoriteButton(type, id, name));
    }
    return;
  }
  const wrap = document.createElement("div");
  wrap.className = wrapClass;
  parent.insertBefore(wrap, item);
  wrap.appendChild(item);
  wrap.appendChild(createFavoriteButton(type, id, name));
}

function initFavorites() {
  loadFavorites();

  Array.from(document.querySelectorAll(".photo-frame")).forEach((frame, i) => {
    const img = frame.querySelector("img");
    const id = img ? img.getAttribute("src").split("/").pop() : "photo-" + (i + 1);
    addFavoriteButton(frame, "photo", id, "Frame " + String(i + 1).padStart(2, "0"));
  });

  Array.from(document.querySelectorAll("#panel-books .idx-row")).forEach((row) => {
    const title = detailText(row, ".idx-title");
    addFavoriteButton(row, "book", favoriteSlug(title), title);
  });

  Array.from(document.querySelectorAll("#panel-sport .idx-row")).forEach((row) => {
    const title = detailText(row, ".idx-title");
    addFavoriteButton(row, "sport", favoriteSlug(title), title);
  });

  Array.from(document.querySelectorAll("#panel-games .hof-item")).forEach((item) => {
    const name = detailText(item, ".hof-name");
    wrapWithFavorite(item, "hof-item-wrap", "game", item.getAttribute("data-game"), name);
  });

  Array.from(document.querySelectorAll("#panel-music .idx-card[data-song-id]")).forEach((card) => {
    const title = detailText(card, ".idx-title");
    const artist = detailText(card, ".idx-artist");
    wrapWithFavorite(card, "idx-card-wrap", "music", card.getAttribute("data-song-id"), title + " by " + artist);
  });

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".fav-btn");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(btn.getAttribute("data-fav-type"), btn.getAttribute("data-fav-id"));
    syncFavoriteButtons();
    document.dispatchEvent(new CustomEvent("night:favorites-changed"));
  });

  document.addEventListener("night:reel-rendered", syncFavoriteButtons);
  window.syncFavoriteButtons = syncFavoriteButtons;
  syncFavoriteButtons();
}

/* ---------- The Archive: shared filter / sort / density toolbar ----------
   One toolbar above the panels, re-rendered for the active shelf. Sort and
   filter work on the existing DOM (books / sport / music / games) or on the
   reel-stage data arrays (films / series); no content moves between panels. */

function initArchiveToolbar() {
  const toolbar = document.getElementById("archive-toolbar");
  const tabbar = document.getElementById("archive-tabbar");
  const filterMount = document.getElementById("archive-toolbar-filters");
  const countEl = document.getElementById("archive-toolbar-count");
  const emptyEl = document.getElementById("archive-toolbar-empty");
  const emptyText = document.getElementById("archive-toolbar-empty-text");
  const emptyClear = document.getElementById("archive-toolbar-empty-clear");
  const sortSelect = document.getElementById("archive-sort");
  const favoritesToggle = document.getElementById("archive-favorites-toggle");
  const densityButtons = Array.from(toolbar.querySelectorAll(".archive-density-btn"));
  if (!toolbar || !tabbar || !filterMount || !countEl || !sortSelect) return;

  const panels = {
    books: document.getElementById("panel-books"),
    films: document.getElementById("panel-films"),
    series: document.getElementById("panel-series"),
    music: document.getElementById("panel-music"),
    sport: document.getElementById("panel-sport"),
    games: document.getElementById("panel-games"),
  };
  if (Object.keys(panels).some((key) => !panels[key])) return;

  const SPORT_FILTERS = [
    { value: "basketball", label: "BASKETBALL" },
    { value: "football", label: "FOOTBALL" },
    { value: "formula-1", label: "FORMULA 1" },
    { value: "american-football", label: "AMERICAN FOOTBALL" },
    { value: "esports", label: "ESPORTS" },
  ];

  const CONFIG = {
    books: {
      label: "BOOKS",
      count: (n, total) => (n === total ? n + " BOOKS" : n + " / " + total + " BOOKS"),
      sorts: [["curated", "CURATED"], ["title", "TITLE A-Z"], ["author", "AUTHOR A-Z"]],
      filters: null,
    },
    films: {
      label: "FILMS",
      count: (n, total) => (n === total ? n + " FILMS" : n + " / " + total + " FILMS"),
      sorts: [["curated", "CURATED"], ["year", "YEAR ↓"], ["title", "TITLE A-Z"]],
      filters: () => allStringFilters(uniqueValues((window.FILM_DATA || []).map((item) => item.genre))),
      filterKey: (item, value) => item.genre === value,
    },
    series: {
      label: "SERIES",
      count: (n, total) => (n === total ? n + " SERIES" : n + " / " + total + " SERIES"),
      sorts: [["curated", "CURATED"], ["years", "YEARS ↓"], ["title", "TITLE A-Z"]],
      filters: () => allStringFilters(uniqueValues((window.SERIES_DATA || []).map((item) => item.category))),
      filterKey: (item, value) => item.category === value,
    },
    music: {
      label: "SONGS",
      count: (n, total) => (n === total ? n + " SONGS" : n + " / " + total + " SONGS"),
      sorts: [["curated", "CURATED"], ["title", "TITLE A-Z"], ["artist", "ARTIST A-Z"]],
      filters: null,
    },
    sport: {
      label: "TEAMS",
      count: (n, total) => (n === total ? n + " TEAMS" : n + " / " + total + " TEAMS"),
      sorts: [["curated", "CURATED"], ["name", "NAME A-Z"], ["city", "CITY A-Z"]],
      filters: () => allObjectFilters(SPORT_FILTERS),
      filterKey: (item, value) => item.getAttribute("data-sport") === value,
    },
    games: {
      label: "GAMES",
      count: (n, total) => (n === total ? n + " GAMES" : n + " / " + total + " GAMES"),
      sorts: [["curated", "CURATED"], ["hours", "HOURS ↓"], ["name", "NAME A-Z"]],
      filters: null,
    },
  };

  const state = {};
  Object.keys(CONFIG).forEach((key) => {
    state[key] = { filter: "all", sort: "curated", density: "comfort", favoritesOnly: false };
  });
  try {
    const savedView = JSON.parse(localStorage.getItem("night:view") || "{}");
    Object.keys(CONFIG).forEach((key) => {
      const saved = savedView[key];
      if (!saved) return;
      if (typeof saved.filter === "string") state[key].filter = saved.filter;
      if (typeof saved.sort === "string") state[key].sort = saved.sort;
      if (typeof saved.density === "string") state[key].density = saved.density;
      if (typeof saved.favoritesOnly === "boolean") state[key].favoritesOnly = saved.favoritesOnly;
    });
  } catch (err) {
    // storage unavailable or corrupt JSON: keep defaults
  }

  function saveView() {
    try {
      localStorage.setItem("night:view", JSON.stringify(state));
    } catch (err) {
      // storage unavailable: keep the session state
    }
  }
  // films/series are already rendered in curated order; skip the first
  // redundant setData pass and only re-render when filter/sort changes.
  const appliedReel = { films: "all|curated|all", series: "all|curated|all" };

  const originalOrder = new WeakMap();
  function recordOrder(container, selector) {
    Array.from(container.querySelectorAll(selector)).forEach((item, index) => {
      originalOrder.set(item, index);
    });
  }
  recordOrder(panels.books, ".idx-row");
  recordOrder(panels.music, ".idx-card[data-song-id]");
  recordOrder(panels.sport, ".idx-row");
  recordOrder(panels.games, ".hof-item");

  function textOf(root, selector) {
    const node = root.querySelector(selector);
    return node ? node.textContent.trim() : "";
  }

  function hoursOf(item) {
    return parseInt(textOf(item, ".hof-hours").replace(/[^0-9]/g, ""), 10) || 0;
  }

  function startYear(item) {
    const value = parseInt(String(item.year || item.years || ""), 10);
    return Number.isFinite(value) ? value : -1;
  }

  function uniqueValues(values) {
    return Array.from(new Set(values.filter(Boolean)));
  }

  function allStringFilters(values) {
    return [{ value: "all", label: "ALL" }].concat(
      values.map((value) => ({ value: value, label: value }))
    );
  }

  function allObjectFilters(values) {
    return [{ value: "all", label: "ALL" }].concat(values);
  }

  function activeToken() {
    const active = tabbar.querySelector(".tab-btn.is-active");
    return active ? active.getAttribute("data-tab") : "books";
  }

  function syncDensity(token) {
    const value = state[token].density;
    densityButtons.forEach((btn) => {
      const on = btn.getAttribute("data-density") === value;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function syncFavoritesToggle(token) {
    if (!favoritesToggle) return;
    const on = Boolean(state[token].favoritesOnly);
    favoritesToggle.setAttribute("aria-pressed", on ? "true" : "false");
    favoritesToggle.classList.toggle("is-active", on);
    favoritesToggle.textContent = (on ? "★" : "☆") + " FAVORITES ONLY";
  }

  function bookId(row) {
    return favoriteSlug(textOf(row, ".idx-title"));
  }

  function sportId(row) {
    return favoriteSlug(textOf(row, ".idx-title"));
  }

  function hideEmpty() {
    if (emptyEl) emptyEl.hidden = true;
  }

  function showEmpty(message) {
    if (emptyText) emptyText.textContent = message;
    if (emptyEl) emptyEl.hidden = false;
  }

  function apply(token) {
    const config = CONFIG[token] || CONFIG.books;
    const s = state[token];
    let visible = 0;
    let total = 0;
    let emptyMessage = "";

    if (token === "books") {
      const panel = panels.books;
      const list = panel.querySelector(".idx-list");
      const rows = Array.from(list.querySelectorAll(".idx-row"));
      rows.forEach((row) => {
        const on = !s.favoritesOnly || isFavorite("book", bookId(row));
        row.classList.toggle("is-filter-hidden", !on);
      });
      const visibleRows = rows.filter((row) => !row.classList.contains("is-filter-hidden"));
      visibleRows.slice().sort((a, b) => {
        if (s.sort === "title") return textOf(a, ".idx-title").localeCompare(textOf(b, ".idx-title"));
        if (s.sort === "author") return textOf(a, ".idx-meta").localeCompare(textOf(b, ".idx-meta"));
        return originalOrder.get(a) - originalOrder.get(b);
      }).forEach((row) => list.appendChild(row));
      panel.classList.toggle("is-compact", s.density === "compact");
      visible = visibleRows.length;
      total = rows.length;
      emptyMessage = "NO FAVORITES YET. OPEN A CARD TO SAVE ONE.";
    } else if (token === "films" || token === "series") {
      const panel = panels[token];
      const data = token === "films" ? (window.FILM_DATA || []) : (window.SERIES_DATA || []);
      const stage = token === "films" ? window.FilmStage : window.SeriesStage;
      const originalIndex = new Map(data.map((item, index) => [item, index]));
      const filtered = data.filter((item) =>
        (s.filter === "all" || config.filterKey(item, s.filter)) &&
        (!s.favoritesOnly || isFavorite(token === "films" ? "film" : "series", item.id))
      );
      const sorted = filtered.slice().sort((a, b) => {
        if (s.sort === "title") return a.title.localeCompare(b.title);
        if (token === "films" && s.sort === "year") return startYear(b) - startYear(a);
        if (token === "series" && s.sort === "years") return startYear(b) - startYear(a);
        return originalIndex.get(a) - originalIndex.get(b);
      });
      const signature = s.filter + "|" + s.sort + "|" + (s.favoritesOnly ? "fav" : "all");
      if (sorted.length && stage && typeof stage.setData === "function" && appliedReel[token] !== signature) {
        stage.setData(sorted);
        appliedReel[token] = signature;
      }
      Array.from(panel.children).forEach((child) => { child.hidden = sorted.length === 0; });
      panel.classList.toggle("is-compact", s.density === "compact");
      visible = sorted.length;
      total = data.length;
      emptyMessage = "NO " + config.label + " IN THIS FILTER.";
    } else if (token === "music") {
      const panel = panels.music;
      Array.from(panel.querySelectorAll(".artist-tracks")).forEach((group) => {
        const cards = Array.from(group.querySelectorAll(".idx-card[data-song-id]"));
        cards.forEach((card) => {
          const wrap = card.parentElement && card.parentElement.classList.contains("idx-card-wrap") ? card.parentElement : card;
          const on = !s.favoritesOnly || isFavorite("music", card.getAttribute("data-song-id"));
          wrap.classList.toggle("is-filter-hidden", !on);
        });
        const visibleCards = cards.filter((card) => {
          const wrap = card.parentElement && card.parentElement.classList.contains("idx-card-wrap") ? card.parentElement : card;
          return !wrap.classList.contains("is-filter-hidden");
        });
        visibleCards.slice().sort((a, b) => {
          if (s.sort === "title") return textOf(a, ".idx-title").localeCompare(textOf(b, ".idx-title"));
          if (s.sort === "artist") return textOf(a, ".idx-artist").localeCompare(textOf(b, ".idx-artist"));
          return originalOrder.get(a) - originalOrder.get(b);
        }).forEach((card) => {
          const wrap = card.parentElement && card.parentElement.classList.contains("idx-card-wrap") ? card.parentElement : card;
          group.appendChild(wrap);
        });
      });
      document.dispatchEvent(new CustomEvent("night:music-filter"));
      panel.classList.toggle("is-compact", s.density === "compact");
      visible = Array.from(panel.querySelectorAll(".idx-card[data-song-id]")).filter((card) => {
        const wrap = card.parentElement && card.parentElement.classList.contains("idx-card-wrap") ? card.parentElement : card;
        return !wrap.classList.contains("is-filter-hidden");
      }).length;
      total = panel.querySelectorAll(".idx-card[data-song-id]").length;
      emptyMessage = "NO FAVORITES YET. OPEN A CARD TO SAVE ONE.";
    } else if (token === "sport") {
      const panel = panels.sport;
      const list = panel.querySelector(".idx-list");
      const rows = Array.from(list.querySelectorAll(".idx-row"));
      rows.forEach((row) => {
        const on = (s.filter === "all" || row.getAttribute("data-sport") === s.filter) &&
          (!s.favoritesOnly || isFavorite("sport", sportId(row)));
        row.classList.toggle("is-filter-hidden", !on);
      });
      const visibleRows = rows.filter((row) => !row.classList.contains("is-filter-hidden"));
      visibleRows.slice().sort((a, b) => {
        if (s.sort === "name") return textOf(a, ".idx-title").localeCompare(textOf(b, ".idx-title"));
        if (s.sort === "city") return textOf(a, ".idx-meta").localeCompare(textOf(b, ".idx-meta"));
        return originalOrder.get(a) - originalOrder.get(b);
      }).forEach((row) => list.appendChild(row));
      panel.classList.toggle("is-compact", s.density === "compact");
      visible = visibleRows.length;
      total = rows.length;
      emptyMessage = "NO TEAMS IN THIS SPORT.";
    } else if (token === "games") {
      const panel = panels.games;
      const row = panel.querySelector("#hof-row");
      const end = row.querySelector(".hof-end");
      const items = Array.from(row.querySelectorAll(".hof-item"));
      items.forEach((item) => {
        const wrap = item.parentElement && item.parentElement.classList.contains("hof-item-wrap") ? item.parentElement : item;
        const on = !s.favoritesOnly || isFavorite("game", item.getAttribute("data-game"));
        wrap.classList.toggle("is-filter-hidden", !on);
      });
      const visibleItems = items.filter((item) => {
        const wrap = item.parentElement && item.parentElement.classList.contains("hof-item-wrap") ? item.parentElement : item;
        return !wrap.classList.contains("is-filter-hidden");
      });
      items.slice().sort((a, b) => {
        if (s.sort === "hours") return hoursOf(b) - hoursOf(a);
        if (s.sort === "name") return textOf(a, ".hof-name").localeCompare(textOf(b, ".hof-name"));
        return originalOrder.get(a) - originalOrder.get(b);
      }).forEach((item) => {
        const wrap = item.parentElement && item.parentElement.classList.contains("hof-item-wrap") ? item.parentElement : item;
        row.insertBefore(wrap, end);
      });
      if (gameScroller && gameScroller.setItemCount) {
        gameScroller.setItemCount(visibleItems.length);
      }
      panel.classList.toggle("is-compact", s.density === "compact");
      visible = visibleItems.length;
      total = items.length;
      emptyMessage = "NO FAVORITES YET. OPEN A CARD TO SAVE ONE.";
    }

    countEl.textContent = config.count(visible, total);
    if (visible === 0 && emptyMessage) {
      showEmpty(s.favoritesOnly ? "NO FAVORITES YET. OPEN A CARD TO SAVE ONE." : emptyMessage);
    } else {
      hideEmpty();
    }
    scheduleRefresh();
  }

  function render() {
    const token = activeToken();
    const config = CONFIG[token] || CONFIG.books;
    const s = state[token];

    filterMount.innerHTML = "";
    const filters = config.filters ? config.filters() : [];
    filterMount.hidden = filters.length === 0;
    filters.forEach((filter) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "genre-chip mono";
      chip.setAttribute("data-filter", filter.value);
      chip.setAttribute("aria-pressed", filter.value === s.filter ? "true" : "false");
      chip.classList.toggle("is-active", filter.value === s.filter);
      chip.textContent = filter.label;
      chip.addEventListener("click", () => {
        s.filter = filter.value;
        filterMount.querySelectorAll(".genre-chip").forEach((other) => {
          const on = other.getAttribute("data-filter") === s.filter;
          other.classList.toggle("is-active", on);
          other.setAttribute("aria-pressed", on ? "true" : "false");
        });
        saveView();
        apply(token);
      });
      filterMount.appendChild(chip);
    });

    sortSelect.innerHTML = "";
    config.sorts.forEach(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      sortSelect.appendChild(option);
    });
    sortSelect.value = s.sort;

    syncDensity(token);
    syncFavoritesToggle(token);
    apply(token);
  }

  sortSelect.addEventListener("change", () => {
    const token = activeToken();
    state[token].sort = sortSelect.value;
    saveView();
    apply(token);
  });

  densityButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const token = activeToken();
      state[token].density = btn.getAttribute("data-density");
      syncDensity(token);
      saveView();
      apply(token);
    });
  });

  if (favoritesToggle) {
    favoritesToggle.addEventListener("click", () => {
      const token = activeToken();
      state[token].favoritesOnly = !state[token].favoritesOnly;
      syncFavoritesToggle(token);
      saveView();
      apply(token);
    });
  }

  document.addEventListener("night:favorites-changed", () => {
    const token = activeToken();
    if (state[token].favoritesOnly) apply(token);
  });

  if (emptyClear) {
    emptyClear.addEventListener("click", () => {
      const token = activeToken();
      state[token].filter = "all";
      state[token].favoritesOnly = false;
      saveView();
      render();
    });
  }

  tabbar.addEventListener("night:archive-tab", () => render());

  toolbar.hidden = false;
  render();
}

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
      const wrap = card.parentElement && card.parentElement.classList.contains("idx-card-wrap") ? card.parentElement : card;
      const filterHidden = wrap.classList.contains("is-filter-hidden");
      const on = !genreHidden && !filterHidden && matchCard(cardHaystacks[i], qNorm);
      card.classList.toggle("is-search-hidden", !on);
      wrap.classList.toggle("is-search-hidden", !on);
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
      const pool = cards.filter((card, i) => {
        const wrap = card.parentElement && card.parentElement.classList.contains("idx-card-wrap") ? card.parentElement : card;
        return !(cardGenres[i] && cardGenres[i].hidden) &&
          !wrap.classList.contains("is-search-hidden") &&
          !wrap.classList.contains("is-filter-hidden");
      });
      if (!pool.length) return;
      pool[Math.floor(Math.random() * pool.length)].click();
    });
  }

  document.addEventListener("night:music-filter", () => applySearch());

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

  // The music cards now open the unified detail layer; this function keeps
  // the NetEase deep-link strategy for the detail layer's external link.
  openNetEaseSong = openSong;
}

initNetEaseLinks();

initFavorites();

initMusicSearch();

initArchiveToolbar();

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

/* ---------- poem stamp under reduced motion: purely decorative ----------
   The slam/restamp handlers live inside the !REDUCED guard below; without
   this the stamp would render as a focusable button that does nothing. */
if (REDUCED) {
  const stamp = document.querySelector(".poem-stamp");
  if (stamp) {
    stamp.removeAttribute("tabindex");
    stamp.removeAttribute("role");
    stamp.setAttribute("aria-hidden", "true");
    stamp.style.cursor = "default";
    stamp.classList.add("is-static");
  }
}

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
  splitHeadParallax("archive-head");
  splitHeadParallax("about-head");

  /* ---------- section mask reveals (curtain wipe) ----------
     one-off narrative curtain: 1.25s power4.inOut is intentionally longer
     than MOTION.enter; the mask is a section-level reveal, not a card entrance. */

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

  /* ---------- hall of fame cards: staggered entrance ----------
     enter: HOF card reveal is the longest low-frequency entrance (top of range) */

  gsap.from(".hof-card", {
    y: 90,
    rotationX: -8,
    clipPath: "inset(0 0 100% 0)",
    transformOrigin: "center bottom",
    duration: MOTION.enter.longDuration,
    stagger: { each: MOTION.enter.stagger, from: "start" },
    ease: MOTION.enter.heavyEase,
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
      duration: MOTION.enter.duration,
      stagger: 0.05,
      ease: MOTION.enter.ease,
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
      duration: MOTION.enter.duration,
      stagger: 0.14,
      ease: MOTION.enter.ease,
      clearProps: "clipPath",
      scrollTrigger: {
        trigger: ".about-body",
        start: "top 82%",
        toggleActions: "play none none reverse",
      },
    });
  }

  /* ---------- about stats entrance ----------
     enter: low-frequency reveal; MOTION.enter.duration replaces the old 0.7s */

  gsap.from(".about-stats span", {
    yPercent: 110,
    duration: MOTION.enter.duration,
    stagger: 0.08,
    ease: MOTION.enter.ease,
    scrollTrigger: {
      trigger: ".about-stats",
      start: "top 85%",
      toggleActions: "play none none reverse",
    },
  });

  /* ---------- coda entrance ----------
     enter: closing title is the longest low-frequency entrance (1.1s) */

  gsap.from(".coda-title", {
    yPercent: 110,
    duration: MOTION.enter.longDuration,
    stagger: 0.14,
    ease: MOTION.enter.heavyEase,
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
