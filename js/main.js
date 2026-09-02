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
  const cx = gsap.quickTo(cursor, "x", { duration: 0.32, ease: "power3.out" });
  const cy = gsap.quickTo(cursor, "y", { duration: 0.32, ease: "power3.out" });
  // gsap.quickTo on the scaled `scale` alias does not tween the dot, so drive
  // scaleX + scaleY (together with gsap.to on mousedown/mouseup) to expand the
  // badge and keep the mono label centered inside it.
  const growX = gsap.quickTo(dot, "scaleX", { duration: 0.35, ease: "power3.out" });
  const growY = gsap.quickTo(dot, "scaleY", { duration: 0.35, ease: "power3.out" });
  const grow = (v) => { growX(v); growY(v); };

  let baseScale = 1;

  window.addEventListener("pointermove", (e) => { cx(e.clientX); cy(e.clientY); }, { passive: true });

  document.addEventListener("mouseover", (e) => {
    const labelled = e.target.closest("[data-cursor]");
    if (labelled) {
      label.textContent = labelled.getAttribute("data-cursor");
      baseScale = 6;
      gsap.to(label, { opacity: 1, duration: 0.18 });
    } else if (e.target.closest("a, button, .acc-head, .hs-card, .hof-card, .idx-row, .idx-card")) {
      baseScale = 2.6;
      gsap.to(label, { opacity: 0, duration: 0.15 });
    } else {
      baseScale = 1;
      gsap.to(label, { opacity: 0, duration: 0.15 });
    }
    grow(baseScale);
  });

  document.addEventListener("mousedown", () => gsap.to(dot, { scale: baseScale * 0.75, duration: 0.12, ease: "power2.in" }));
  document.addEventListener("mouseup", () => gsap.to(dot, { scale: baseScale, duration: 0.3, ease: "back.out(2.5)" }));
  document.documentElement.addEventListener("mouseleave", () => gsap.to(cursor, { autoAlpha: 0, duration: 0.2 }));
  document.documentElement.addEventListener("mouseenter", () => gsap.to(cursor, { autoAlpha: 1, duration: 0.2 }));
}
initCursor();

function initMagnetic() {
  if (TOUCH || !FINE_POINTER || REDUCED) return;
  gsap.utils.toArray(".nav-links a, .tab-btn, .lb-close, .lb-nav, .footer-links a").forEach((el) => {
    const xTo = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" });
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.3);
    });
    el.addEventListener("pointerleave", () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.45)" });
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
gsap.set(".hero-sub span", { yPercent: 140, opacity: 0 });

// build the hero signature before the reveal so it can draw right after
const heroSig = buildSignature("sig-hero");
const sigTotalLen = setupSignatureDraw(heroSig);
gsap.set(heroSig ? heroSig.fills : [], { opacity: 0 });

let preloadFinished = false;

function finishPreload() {
  if (preloadFinished) return;
  preloadFinished = true;

  const settle = () => {
    // recalc once the reveal is done, then again after lazy gallery
    // images settle so the pinned ranges stay accurate
    ScrollTrigger.refresh();
    setTimeout(() => ScrollTrigger.refresh(), 800);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => ScrollTrigger.refresh());
    }
  };

  if (REDUCED) {
    // static reveal: plain sets apply synchronously — the reduced-motion
    // path must never depend on the animation ticker, or a paused rAF
    // (background tab, throttled webview) would trap the user on the loader
    gsap.set(heroChars, { yPercent: 0 });
    gsap.set(".hero-sub span", { yPercent: 0, opacity: 1 });
    if (heroSig) {
      heroSig.paths.forEach((p) => gsap.set(p, { strokeDashoffset: 0 }));
      gsap.set(heroSig.fills, { opacity: 1 });
    }
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
    .to(heroChars, { yPercent: 0, duration: 1.1, stagger: 0.035, ease: "power4.out" }, "-=0.45")
    .to(".hero-sub span", { yPercent: 0, opacity: 1, duration: 0.9, stagger: 0.12, ease: "power3.out" }, "<+0.4");

  // signature draw starts as the shutters open
  if (heroSig) {
    tl.add(() => {
      animateSignature(heroSig, { delay: 0, duration: 1.25, stagger: 0.09 });
    }, "-=3.2");
  }
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
    if (img.complete && img.naturalWidth !== 0) onImgDone();
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
   Always active. The scroll-follow is the core interaction of these
   sections, so it is NOT gated behind prefers-reduced-motion (many desktop
   setups report it and used to kill the effect entirely). */

function makeHorizontalScroller(opts) {
  const wrap = document.getElementById(opts.wrapId);
  const track = document.getElementById(opts.trackId);
  if (!wrap || !track) return null;

  const getDistance = () => Math.max(0, track.scrollWidth - window.innerWidth);

  const bar = document.getElementById(opts.barId);
  const barTrack = document.getElementById(opts.barTrackId);
  const barFill = document.getElementById(opts.barFillId);
  const barHandle = document.getElementById(opts.barHandleId);
  const barCount = document.getElementById(opts.barCountId);

  let isDraggingBar = false;
  let isGrabbing = false;

  let lastFrame = -1;
  function renderDragbar(progress) {
    if (!bar || !barFill || !barHandle || !barCount) return;
    const p = Math.max(0, Math.min(1, progress));
    // transform write, not width: keeps the fill off the layout path
    barFill.style.transform = "scaleX(" + p + ")";
    barHandle.style.left = p * 100 + "%";
    const frame = Math.min(opts.itemCount, Math.max(1, Math.round(p * (opts.itemCount - 1)) + 1));
    if (frame !== lastFrame) {
      lastFrame = frame;
      barCount.textContent = opts.label + " " + String(frame).padStart(2, "0") + " / " + String(opts.itemCount).padStart(2, "0");
    }
  }

  const tween = gsap.to(track, {
    x: () => -getDistance(),
    ease: "none",
    scrollTrigger: {
      trigger: wrap,
      start: "top top",
      end: () => "+=" + getDistance(),
      pin: true,
      scrub: REDUCED ? 0.5 : 1,
      invalidateOnRefresh: true,
      anticipatePin: 1,
      onUpdate: (self) => {
        if (!isDraggingBar && !isGrabbing) renderDragbar(self.progress);
      },
    },
  });

  const st = tween.scrollTrigger;

  // scroll the page so the pinned scrub lands exactly on target progress
  const seek = (progress) => {
    const y = st.start + (st.end - st.start) * progress;
    if (lenis) lenis.scrollTo(y, { immediate: true });
    else window.scrollTo(0, y);
  };

  if (bar && barTrack) {
    // keep handle in sync with scroll-driven progress
    ScrollTrigger.create({
      trigger: wrap,
      start: "top top",
      end: () => "+=" + getDistance(),
      onEnter: () => bar.classList.add("is-active"),
      onEnterBack: () => bar.classList.add("is-active"),
      onLeave: () => bar.classList.remove("is-active"),
      onLeaveBack: () => bar.classList.remove("is-active"),
    });

    const barEventToProgress = (e) => {
      const rect = barTrack.getBoundingClientRect();
      return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    };

    barTrack.addEventListener("pointerdown", (e) => {
      isDraggingBar = true;
      barTrack.classList.add("is-dragging");
      barTrack.setPointerCapture(e.pointerId);
      const p = barEventToProgress(e);
      renderDragbar(p);
      seek(p);
    });

    barTrack.addEventListener("pointermove", (e) => {
      if (!isDraggingBar) return;
      const p = barEventToProgress(e);
      renderDragbar(p);
      seek(p);
    });

    const endBarDrag = () => {
      isDraggingBar = false;
      barTrack.classList.remove("is-dragging");
    };
    barTrack.addEventListener("pointerup", endBarDrag);
    barTrack.addEventListener("pointercancel", endBarDrag);
  }

  /* ---- direct grab-drag on the pinned section (desktop fine pointers) ----
     Under DRAG_THRESHOLD px of travel it stays a normal click (lightbox etc.);
     past it the drag captures the pointer and drives scroll through seek().
     Release flings with inertia. Direct manipulation, so NOT gated by REDUCED. */
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    const DRAG_THRESHOLD = 6;
    let dragId = null, dragStartX = 0, dragStartP = 0, dragArmed = false, dragMoved = false;
    let lastX = 0, lastT = 0, dragVel = 0; // px/ms, signed
    let glideTween = null;

    const suppressClick = (e) => { e.stopPropagation(); e.preventDefault(); };

    wrap.addEventListener("dragstart", (e) => e.preventDefault());

    wrap.addEventListener("pointerdown", (e) => {
      if (isDraggingBar || e.button !== 0) return;
      if (glideTween) { glideTween.kill(); glideTween = null; }
      dragId = e.pointerId;
      dragStartX = lastX = e.clientX;
      lastT = performance.now();
      dragVel = 0;
      dragStartP = st.progress;
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
      const p = Math.max(0, Math.min(1, dragStartP - dx / dist));
      renderDragbar(p);
      seek(p);
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
        const from = st.progress;
        const target = Math.max(0, Math.min(1, from - (dragVel * 140) / dist));
        const proxy = { p: from };
        glideTween = gsap.to(proxy, {
          p: target,
          duration: 0.9,
          ease: "power3.out",
          onUpdate: () => { renderDragbar(proxy.p); seek(proxy.p); },
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

  return tween;
}

const hsTween = makeHorizontalScroller({
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

const hofTween = makeHorizontalScroller({
  wrapId: "hof-scroll",
  trackId: "hof-row",
  barId: "hof-dragbar",
  barTrackId: "hof-dragbar-track",
  barFillId: "hof-dragbar-fill",
  barHandleId: "hof-dragbar-handle",
  barCountId: "hof-dragbar-count",
  itemCount: 7,
  label: "CARD",
});

/* ---------- hero bubbles: click to pop, respawn at a random spot ---------- */

const bubbleField = document.getElementById("bubble-field");
const BUBBLE_COUNT = window.innerWidth < 720 ? 14 : 24;

const BUBBLE_TINTS = [
  "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.5) 16%, rgba(43,76,255,0.28) 42%, rgba(43,76,255,0.06) 100%)",
  "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.5) 16%, rgba(255,92,31,0.22) 42%, rgba(255,92,31,0.05) 100%)",
  "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.5) 16%, rgba(198,244,57,0.32) 42%, rgba(198,244,57,0.07) 100%)",
];

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
    gsap.to(b, {
      y: -bob,
      x: (Math.random() - 0.5) * 46,
      duration: dur,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
      delay: Math.random() * 2,
    });
  }

  b.addEventListener("click", () => {
    b.style.pointerEvents = "none";
    gsap.killTweensOf(b);
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
  lbImg.src = img.src.replace("/photo/", "/photo/full/");

  // preload neighbours for instant arrows
  [lbIndex + 1, lbIndex - 1].forEach((n) => {
    const c = photoCards[((n % photoCards.length) + photoCards.length) % photoCards.length];
    const pre = new Image();
    pre.src = c.querySelector("img").src.replace("/photo/", "/photo/full/");
  });
}

function lbOpenAt(i) {
  if (!lightbox || !photoCards.length) return;
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
  lbImg.src = "";
  isLbOpen = false;
}

if (lightbox && photoCards.length) {
  photoCards.forEach((card, i) => {
    card.addEventListener("click", () => lbOpenAt(i));
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
  const panels = Array.from(document.querySelectorAll(".tab-panel"));
  if (!tabs.length || !panels.length) return;

  let current = tabs.findIndex((t) => t.classList.contains("is-active"));
  if (current < 0) current = 0;

  const showMeta = (idx) => {
    tabs.forEach((t, i) => {
      const on = i === idx;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
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
    const rows = panels[idx] ? Array.from(panels[idx].querySelectorAll(".idx-row, .film-group, .genre")) : [];
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

  // first panel: baseline entrance on scroll into view
  const firstPanel = panels[0];
  const firstRows = Array.from(firstPanel.querySelectorAll(".idx-row, .film-group, .genre"));
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

initArchiveTabs();

/* ---------- group accordions: FILMS groups + MUSIC genres ----------
   Mutually exclusive per panel: opening one group collapses its siblings.
   Clicking an open group closes it (all closed is allowed). */

function initGroupAccordion() {
  // each entry: [panelSelector, headSelector, bodySelector]
  const CONFIG = [
    ["#panel-films", ".film-group-head", ".idx-list"],
    ["#panel-series", ".film-group-head", ".idx-list"],
    ["#panel-music", ".genre-head", ".track-index"],
  ];

  CONFIG.forEach(([panelSel, headSel, bodySel]) => {
    const panel = document.querySelector(panelSel);
    if (!panel) return;

    const groups = Array.from(panel.querySelectorAll(headSel)).map(head => ({
      head,
      body: head.nextElementSibling, // idx-list / track-index follows the head
    }));
    if (!groups.length) return;

    groups.forEach((g) => {
      g.head.classList.add("acc-head");
      g.head.setAttribute("role", "button");
      g.head.setAttribute("tabindex", "0");
      g.head.setAttribute("aria-expanded", "false");
      g.head.insertAdjacentHTML("beforeend", '<span class="acc-arrow mono">\u25B8</span>');

      const setOpen = (open, animate) => {
        if (g.open === open) return;
        g.open = open;
        g.head.setAttribute("aria-expanded", open ? "true" : "false");
        g.head.classList.toggle("is-open", open);
        if (open) {
          gsap.set(g.body, { height: "auto" });
          gsap.from(g.body, {
            height: 0,
            duration: animate && !REDUCED ? 0.65 : 0,
            ease: "power3.inOut",
            onComplete: () => {
              gsap.set(g.body, { height: "auto" });
              ScrollTrigger.refresh();
            },
          });
        } else {
          gsap.to(g.body, {
            height: 0,
            duration: animate && !REDUCED ? 0.5 : 0,
            ease: "power3.inOut",
            onComplete: () => ScrollTrigger.refresh(),
          });
        }
      };
      g.setOpen = setOpen;
      g.open = false;
      g.head._accGroup = g;

      const toggle = () => {
        const willOpen = !g.open;
        // mutual exclusion inside the same panel
        groups.forEach((other) => { if (other !== g && other.open) other.setOpen(false, true); });
        setOpen(willOpen, true);
      };

      g.head.addEventListener("click", toggle);
      g.head.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
      });

      // start collapsed
      gsap.set(g.body, { height: 0, overflow: "hidden" });
    });
  });
}

initGroupAccordion();

/* ---------- similar tracks: click a card to open the song on NetEase ---------- */

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

/* ---------- music search: fuzzy title / artist filter inside MUSIC ---------- */

function initMusicSearch() {
  const panel = document.getElementById("panel-music");
  const input = document.getElementById("music-search-input");
  const clear = document.getElementById("music-search-clear");
  const count = document.getElementById("music-search-count");
  const empty = document.getElementById("music-search-empty");
  if (!panel || !input || !clear || !count || !empty) return;

  const cards = Array.from(panel.querySelectorAll(".idx-card[data-song-id]"));
  const genres = Array.from(panel.querySelectorAll(".genre"));
  const heads = Array.from(panel.querySelectorAll(".genre-head"));

  let active = false;
  let preOpen = new Set();

  function normalize(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, " ").trim();
  }

  function levenshtein(a, b) {
    const m = a.length;
    const n = b.length;
    if (!m) return n;
    if (!n) return m;
    const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
    for (let j = 1; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
        );
      }
    }
    return dp[m][n];
  }

  function matchCard(card, query) {
    const qNorm = normalize(query);
    if (!qNorm) return true;

    const title = card.querySelector(".idx-title");
    const artist = card.querySelector(".idx-artist");
    const hay = normalize((title ? title.textContent : "") + " " + (artist ? artist.textContent : ""));
    const compact = hay.replace(/\s+/g, "");
    const qCompact = qNorm.replace(/\s+/g, "");

    // Partial substring match: "lose" -> Lose Yourself, "kend" -> Kendrick Lamar.
    if (compact.includes(qCompact)) return true;

    // Multi-token fuzzy match: "god plan" can find "God's Plan".
    const qTokens = qNorm.split(" ").filter(Boolean);
    if (qTokens.every((token) => hay.includes(token))) return true;

    // Single-word typo/suffix tolerance for short inputs like "emine" -> Eminem.
    if (qTokens.length === 1 && qTokens[0].length >= 5) {
      const target = qTokens[0];
      const hayTokens = hay.split(" ").filter(Boolean);
      return hayTokens.some((token) => {
        if (token.length < 4 || Math.abs(token.length - target.length) > 2) return false;
        const limit = target.length >= 6 ? 2 : 1;
        return levenshtein(token.slice(0, target.length), target) <= limit;
      });
    }

    return false;
  }

  function headOpen(head) {
    return head.getAttribute("aria-expanded") === "true";
  }

  function setHead(head, open, animate) {
    const group = head._accGroup;
    if (group) {
      group.setOpen(open, animate);
      return;
    }
    head.setAttribute("aria-expanded", open ? "true" : "false");
    head.classList.toggle("is-open", open);
    if (head.nextElementSibling) {
      head.nextElementSibling.style.height = open ? "auto" : "0";
    }
  }

  function refreshScroll() {
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }

  function applySearch() {
    const trimmed = input.value.trim();
    if (!trimmed) {
      clearSearch();
      return;
    }

    if (!active) {
      active = true;
      preOpen = new Set(heads.filter(headOpen));
    }

    let visible = 0;
    cards.forEach((card) => {
      const on = matchCard(card, trimmed);
      card.classList.toggle("is-search-hidden", !on);
      if (on) visible++;
    });

    genres.forEach((genre) => {
      const visibleInGenre = genre.querySelectorAll(".idx-card:not(.is-search-hidden)").length;
      genre.classList.toggle("is-search-empty", visibleInGenre === 0);
      const head = genre.querySelector(".genre-head");
      if (visibleInGenre > 0 && head && !headOpen(head)) {
        setHead(head, true, false);
      }
    });

    count.hidden = false;
    count.textContent = visible + " / " + cards.length;
    empty.hidden = visible !== 0;
    clear.hidden = false;
    refreshScroll();
  }

  function clearSearch() {
    if (active) {
      active = false;
      cards.forEach((card) => card.classList.remove("is-search-hidden"));
      genres.forEach((genre) => {
        genre.classList.remove("is-search-empty");
        const head = genre.querySelector(".genre-head");
        if (head && headOpen(head) && !preOpen.has(head)) {
          setHead(head, false, false);
        }
      });
      preOpen.forEach((head) => {
        if (head && !headOpen(head)) setHead(head, true, false);
      });
      preOpen = new Set();
    }
    input.value = "";
    count.hidden = true;
    clear.hidden = true;
    empty.hidden = true;
    refreshScroll();
  }

  input.addEventListener("input", applySearch);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") clearSearch();
  });
  clear.addEventListener("click", () => {
    clearSearch();
    input.focus();
  });
}

initMusicSearch();

/* ---------- IMDb quick links: click a film/series row to open its IMDb page ---------- */

function initImdbLinks() {
  const panels = document.querySelectorAll("#panel-films, #panel-series");
  if (!panels.length) return;

  const openImdb = (row) => {
    const id = row.getAttribute("data-imdb");
    if (!id) return;
    window.open("https://www.imdb.com/title/" + id + "/", "_blank", "noopener");
  };

  panels.forEach((panel) => {
    // click delegation: only rows that carry data-imdb are clickable
    panel.addEventListener("click", (e) => {
      const row = e.target.closest(".idx-row[data-imdb]");
      if (!row) return;
      openImdb(row);
    });

    // keyboard accessibility (rows are plain articles -> make Enter/Space work)
    panel.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const row = e.target.closest(".idx-row[data-imdb]");
      if (!row) return;
      e.preventDefault();
      openImdb(row);
    });

    // focusable, screen-reader friendly links
    panel.querySelectorAll(".idx-row[data-imdb]").forEach((row) => {
      row.setAttribute("role", "link");
      row.setAttribute("tabindex", "0");
      row.setAttribute(
        "aria-label",
        row.textContent.trim().replace(/\s+/g, " ") + ", open on IMDb"
      );
    });
  });
}

initImdbLinks();

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

/* ---------- books/sport rows: physical press feedback (fine pointers) ----------
   GSAP owns the transform for these rows (CSS transform transition is
   dropped via .is-pressable): hover lifts the slab with a hard acid/punch
   shadow, leave springs back; team crests pop with it. */

(function initRowFeedback() {
  if (REDUCED || TOUCH || !FINE_POINTER) return;
  document.querySelectorAll("#panel-books .idx-row, #panel-sport .idx-row").forEach((row) => {
    row.classList.add("is-pressable");
    const logo = row.querySelector(".idx-logo");
    row.addEventListener("mouseenter", () => {
      gsap.to(row, { x: 8, y: -3, duration: 0.38, ease: "back.out(2)" });
      row.classList.add("is-pressed");
      if (logo) gsap.to(logo, { rotation: -7, scale: 1.07, duration: 0.4, ease: "back.out(2.4)" });
    });
    row.addEventListener("mouseleave", () => {
      gsap.to(row, { x: 0, y: 0, duration: 0.75, ease: "elastic.out(1, 0.5)" });
      row.classList.remove("is-pressed");
      if (logo) gsap.to(logo, { rotation: 0, scale: 1, duration: 0.7, ease: "elastic.out(1.2, 0.45)" });
    });
  });
})();

/* ---------- reduced motion: decorative animations only ---------- */
if (!REDUCED) {
  /* ---------- hero: floating orbs + mouse parallax ---------- */

  gsap.to(".orb-1", { y: 60, x: -30, duration: 14, repeat: -1, yoyo: true, ease: "sine.inOut" });
  gsap.to(".orb-2", { y: -50, x: 40, duration: 11, repeat: -1, yoyo: true, ease: "sine.inOut" });
  gsap.to(".orb-3", { y: 40, x: 25, duration: 9, repeat: -1, yoyo: true, ease: "sine.inOut" });

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

  /* ---------- big split headers: opposite-direction parallax ---------- */

  function splitHeadParallax(headId) {
    const head = document.getElementById(headId);
    if (!head) return;
    const left = head.querySelector(".bh-left h2");
    const right = head.querySelector(".bh-right h2");

    gsap.fromTo(left, { xPercent: -14 }, {
      xPercent: 6,
      ease: "none",
      scrollTrigger: {
        trigger: head,
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });
    gsap.fromTo(right, { xPercent: 14 }, {
      xPercent: -6,
      ease: "none",
      scrollTrigger: {
        trigger: head,
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });

    // entrance: lines rise out of their overflow masks
    gsap.from(head.querySelectorAll(".bh-line h2"), {
      yPercent: 110,
      duration: 1.2,
      stagger: 0.12,
      ease: "power4.out",
      scrollTrigger: {
        trigger: head,
        start: "top 78%",
        toggleActions: "play none none reverse",
      },
    });
    gsap.from(head.querySelectorAll(".bh-meta span"), {
      clipPath: "inset(0 0 100% 0)",
      yPercent: 60,
      duration: 0.9,
      stagger: 0.1,
      ease: "power3.out",
      clearProps: "clipPath",
      scrollTrigger: {
        trigger: head,
        start: "top 70%",
        toggleActions: "play none none reverse",
      },
    });
  }

  splitHeadParallax("photo-head");
  splitHeadParallax("game-head");
  splitHeadParallax("archive-head");
  splitHeadParallax("poem-head");
  splitHeadParallax("about-head");

  // inner image parallax against the track movement
  gsap.utils.toArray(".hs-img-wrap img").forEach((img) => {
    gsap.fromTo(img, { xPercent: -6 }, {
      xPercent: 6,
      ease: "none",
      scrollTrigger: {
        trigger: img.closest(".hs-card"),
        containerAnimation: hsTween,
        start: "left right",
        end: "right left",
        scrub: true,
        invalidateOnRefresh: true,
      },
    });
  });

  // caption reveal per card (curtain + rise, no bare fade)
  gsap.utils.toArray(".hs-card figcaption").forEach((cap) => {
    gsap.from(cap.children, {
      clipPath: "inset(0 0 100% 0)",
      yPercent: 70,
      duration: 0.7,
      stagger: 0.08,
      ease: "power3.out",
      clearProps: "clipPath",
      scrollTrigger: {
        trigger: cap,
        containerAnimation: hsTween,
        start: "left 85%",
        toggleActions: "play none none reverse",
      },
    });
  });

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
    scrollTrigger: {
      trigger: ".hof-row",
      start: "top 82%",
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

  const aboutSig = buildSignature("sig-about");
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
        const speed = 1 + (Math.abs(v) / 9) * 2.2;
        marqueeTweens.forEach((tw) => tw.timeScale(speed));
        skewSetters.forEach((fn) => fn(v));
        clearTimeout(skewIdle);
        skewIdle = setTimeout(() => {
          settleTweens = marqueeTweens.map((tw) =>
            gsap.to(tw, { timeScale: 1, duration: 0.9, ease: "power2.out" })
          );
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
  window.addEventListener("load", () => ScrollTrigger.refresh());
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
}

/* ---------- nav active section + scroll progress (always active) ---------- */

const navAnchors = Array.from(document.querySelectorAll(".nav-links a"));
const navSections = navAnchors
  .map((a) => document.querySelector(a.getAttribute("href")))
  .filter(Boolean);

const progressFill = document.getElementById("scroll-progress-fill");

function updateNavAndProgress(self) {
  const y = self.scroll() + window.innerHeight * 0.45;
  let current = -1;
  navSections.forEach((s, i) => {
    if (s.offsetTop <= y) current = i;
  });
  if (self.scroll() + window.innerHeight >= document.documentElement.scrollHeight - 4) {
    current = navSections.length - 1;
  }
  navAnchors.forEach((a, i) => a.classList.toggle("is-active", i === current));
  if (progressFill) progressFill.style.transform = "scaleX(" + self.progress + ")";
}

ScrollTrigger.create({
  start: 0,
  end: "max",
  onUpdate: updateNavAndProgress,
  onRefresh: updateNavAndProgress,
});
