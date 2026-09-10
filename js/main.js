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
   Native scroll under reduced motion. Programmatic jumps (anchors) route
   through lenis.scrollTo so the internal value stays in sync. */
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
   Ink needle + floating label: the dot stays small, a thin ring marks
   interactive targets, and [data-cursor] targets (VIEW / DRAG / OPEN /
   STAMP) show a compact mono pill offset from the pointer. Magnetic elements
   lean toward the pointer and spring back on leave. */

function initCursor() {
  if (TOUCH || !FINE_POINTER || REDUCED) return;
  const cursor = document.createElement("div");
  cursor.className = "custom-cursor";
  cursor.setAttribute("aria-hidden", "true");
  cursor.innerHTML = '<span class="cc-ring"></span><span class="cc-dot"></span><span class="cc-label mono"></span>';
  document.body.appendChild(cursor);
  document.documentElement.classList.add("has-cursor");

  const dot = cursor.querySelector(".cc-dot");
  const ring = cursor.querySelector(".cc-ring");
  const label = cursor.querySelector(".cc-label");

  // the container is a 0x0 point; children center themselves on it
  gsap.set(cursor, { x: window.innerWidth / 2, y: window.innerHeight / 2 });
  gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });
  gsap.set(ring, { autoAlpha: 0, scale: 0.6 });
  gsap.set(label, { autoAlpha: 0, scale: 0.94 });

  // feedback: cursor follow is high-frequency direct manipulation
  const cx = gsap.quickTo(cursor, "x", { duration: MOTION.feedback.duration, ease: MOTION.feedback.ease });
  const cy = gsap.quickTo(cursor, "y", { duration: MOTION.feedback.duration, ease: MOTION.feedback.ease });
  // quickTo on the `scale` alias does not tween reliably, so drive scaleX +
  // scaleY on the dot and keep the label as a separate element.
  const growX = gsap.quickTo(dot, "scaleX", { duration: MOTION.feedback.duration, ease: MOTION.feedback.ease });
  const growY = gsap.quickTo(dot, "scaleY", { duration: MOTION.feedback.duration, ease: MOTION.feedback.ease });
  const grow = (v) => { growX(v); growY(v); };

  let pointerX = window.innerWidth / 2;
  let pointerY = window.innerHeight / 2;
  let baseScale = 1;
  let ringScale = 0.6;
  let activeEl = null;
  let labelW = 0;
  let labelH = 0;
  let labelFlipX = false;
  let labelFlipY = false;

  // the label docks beside the dot and flips near the viewport edges; only
  // re-position when the flip state changes so pointermove stays cheap
  const positionLabel = () => {
    if (!labelW) return;
    const gap = 20;
    const flipX = pointerX + gap + labelW > window.innerWidth - 12;
    const flipY = pointerY + gap + labelH > window.innerHeight - 12;
    if (flipX === labelFlipX && flipY === labelFlipY) return;
    labelFlipX = flipX;
    labelFlipY = flipY;
    gsap.set(label, {
      x: flipX ? -(labelW + gap) : gap,
      y: flipY ? -(labelH + gap) : gap,
      transformOrigin: `${flipX ? "100%" : "0%"} ${flipY ? "100%" : "0%"}`
    });
  };

  window.addEventListener("pointermove", (e) => {
    pointerX = e.clientX;
    pointerY = e.clientY;
    cx(pointerX);
    cy(pointerY);
    if (activeEl && activeEl.hasAttribute("data-cursor")) positionLabel();
  }, { passive: true });

  const showLabel = (el) => {
    label.textContent = el.getAttribute("data-cursor");
    const gap = 20;
    labelW = label.offsetWidth;
    labelH = label.offsetHeight;
    labelFlipX = pointerX + gap + labelW > window.innerWidth - 12;
    labelFlipY = pointerY + gap + labelH > window.innerHeight - 12;
    gsap.set(label, {
      x: labelFlipX ? -(labelW + gap) : gap,
      y: labelFlipY ? -(labelH + gap) : gap,
      transformOrigin: `${labelFlipX ? "100%" : "0%"} ${labelFlipY ? "100%" : "0%"}`
    });
    gsap.to(label, { autoAlpha: 1, scale: 1, duration: MOTION.feedback.duration, ease: MOTION.feedback.ease, overwrite: "auto" });
  };

  const hideLabel = () => {
    gsap.to(label, { autoAlpha: 0, scale: 0.94, duration: MOTION.feedback.duration, ease: MOTION.feedback.ease, overwrite: "auto" });
  };

  document.addEventListener("mouseover", (e) => {
    pointerX = e.clientX;
    pointerY = e.clientY;
    // text fields keep the native I-beam; range controls keep the custom cursor
    const overText = e.target.closest("input:not([type='range']), textarea, select, [contenteditable='true']");
    cursor.classList.toggle("is-hidden", Boolean(overText));
    if (overText) return;

    const labelled = e.target.closest("[data-cursor]");
    const interactive = e.target.closest("a, button, .photo-frame-btn, .hof-card, .hof-item, .idx-row, .idx-card");
    const next = labelled || interactive || null;
    if (next === activeEl) return;
    activeEl = next;

    if (labelled) {
      baseScale = 1.35;
      ringScale = 1.25;
      showLabel(labelled);
      gsap.to(ring, { autoAlpha: 0.6, scale: ringScale, duration: MOTION.feedback.duration, ease: MOTION.feedback.ease, overwrite: "auto" });
    } else if (interactive) {
      baseScale = 1;
      ringScale = 1;
      hideLabel();
      gsap.to(ring, { autoAlpha: 0.6, scale: ringScale, duration: MOTION.feedback.duration, ease: MOTION.feedback.ease, overwrite: "auto" });
    } else {
      baseScale = 1;
      ringScale = 0.6;
      hideLabel();
      gsap.to(ring, { autoAlpha: 0, scale: ringScale, duration: MOTION.feedback.duration, ease: MOTION.feedback.ease, overwrite: "auto" });
    }
    grow(baseScale);
  });

  document.addEventListener("mousedown", () => {
    grow(baseScale * 0.96);
    gsap.to(ring, { scale: ringScale * 0.96, duration: MOTION.feedback.press, ease: "power2.in", overwrite: "auto" });
  });
  document.addEventListener("mouseup", () => {
    grow(baseScale);
    gsap.to(ring, { scale: ringScale, duration: MOTION.feedback.duration, ease: MOTION.feedback.ease, overwrite: "auto" });
  });
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
const lbMusicCover = document.getElementById("lb-music-cover");
const lbMusicGlyph = lbMusic ? lbMusic.querySelector(".lb-music-glyph") : null;
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
  const id = card.getAttribute("data-song-id");
  return {
    type: "music",
    id: id,
    title: detailText(card, ".idx-title"),
    artist: detailText(card, ".idx-artist"),
    genre: genre ? detailText(genre, ".genre-title") : "",
    cover: window.MUSIC_COVERS && window.MUSIC_COVERS[id] ? "album-covers/" + window.MUSIC_COVERS[id] : "",
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
    // real sleeve when the archive has artwork for this song, otherwise the
    // placeholder sleeve keeps the layer honest instead of showing a broken img
    if (lbMusicCover) {
      if (item.cover) {
        lbMusicCover.src = item.cover;
        lbMusicCover.alt = item.title + " album cover";
        lbMusicCover.hidden = false;
      } else {
        lbMusicCover.hidden = true;
        lbMusicCover.removeAttribute("src");
        lbMusicCover.removeAttribute("alt");
      }
    }
    if (lbMusicGlyph) lbMusicGlyph.hidden = Boolean(item.cover);
    if (lbMusicLabel) lbMusicLabel.textContent = "NETEASE CLOUD MUSIC";
    lbKicker.textContent = item.genre;
    lbTitle.textContent = item.title;
    lbLines.textContent = item.artist;
    lbQuote.textContent = "Open in NetEase Cloud Music to play this track.";
    lbLink.hidden = false;
    lbLink.textContent = "OPEN IN NETEASE";
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
    lbLink.textContent = "OPEN ON IMDb";
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
    lbLink.textContent = "OPEN ON IMDb";
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
        // the wipe is the reveal, not a permanent mask: any clip-path left on
        // the panel also slices every focus ring / glow that reaches past the
        // panel box (the search field sits flush with the panel's left edge)
        clearProps: "clipPath",
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
      gsap.set(panels[idx], { clearProps: "clipPath" });
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
  const emptyText = document.getElementById("music-search-empty-text");
  const jump = document.getElementById("music-search-jump");
  const filterMount = document.getElementById("genre-filter");
  const randomBtn = document.getElementById("music-random");
  if (!panel || !input || !clear || !count || !empty || !emptyText || !jump) return;

  const cards = Array.from(panel.querySelectorAll(".idx-card[data-song-id]"));
  const genres = Array.from(panel.querySelectorAll(".genre"));
  const cardGenres = cards.map((card) => card.closest(".genre"));
  const genreIndexOf = cardGenres.map((genre) => genres.indexOf(genre));
  // the chips are rendered by music-stage.js before this file runs and carry
  // their own totals ("HIP-HOP · 100"); keep the bare genre names too, for
  // the empty-state jump button
  const chips = filterMount ? Array.from(filterMount.querySelectorAll(".genre-chip")) : [];
  const chipLabels = chips.map((chip) => chip.textContent.replace(/\s*·\s*\d+\s*$/, "").trim());
  // active genre index into `genres`; one genre is visible at a time and
  // music-stage.js hides every group except index 0 on first render.
  let activeGenre = 0;

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

    // one pass over all 763 cards: `hit` is genre-independent, so the same
    // pass can credit genres other than the visible one and feed the
    // "no match here, results elsewhere" jump button
    const hitsByGenre = new Array(genres.length).fill(0);
    let visible = 0;
    cards.forEach((card, i) => {
      const hit = matchCard(cardHaystacks[i], qNorm);
      const genreHidden = cardGenres[i] ? cardGenres[i].hidden : false;
      card.classList.toggle("is-search-hidden", !hit || genreHidden);
      if (!hit) return;
      const gi = genreIndexOf[i];
      if (gi >= 0) hitsByGenre[gi]++;
      if (!genreHidden) visible++;
    });

    genres.forEach((genre) => {
      if (genre.hidden) return;
      const visibleInGenre = genre.querySelectorAll(".idx-card:not(.is-search-hidden)").length;
      genre.classList.toggle("is-search-empty", visibleInGenre === 0);
    });

    // the counter is a search readout: hidden while browsing a genre, and
    // scoped to "matches / songs in the visible genre" while searching
    const genreTotal = genres[activeGenre] ? genres[activeGenre].querySelectorAll(".idx-card[data-song-id]").length : 0;
    count.hidden = !searching;
    count.textContent = visible + " / " + genreTotal;
    clear.hidden = !searching;
    updateEmpty(searching ? hitsByGenre : null);
    refreshScroll();
  }

  // A miss inside the active genre is not a dead end while another genre
  // holds the results: name it, count it, and jump there on click.
  function updateEmpty(hitsByGenre) {
    const activeHits = hitsByGenre ? (hitsByGenre[activeGenre] || 0) : 0;
    empty.hidden = !hitsByGenre || activeHits > 0;
    if (!hitsByGenre || activeHits > 0) {
      jump.hidden = true;
      return;
    }

    let best = -1;
    let bestCount = 0;
    hitsByGenre.forEach((hits, gi) => {
      if (gi !== activeGenre && hits > bestCount) {
        best = gi;
        bestCount = hits;
      }
    });

    emptyText.textContent = best < 0 ? "NO MATCH" : "NO MATCH IN THIS GENRE";
    jump.hidden = best < 0;
    if (best < 0) return;
    jump.setAttribute("data-genre", String(best));
    jump.textContent = "查看 " + (chipLabels[best] || "其它流派") + " · " + bestCount;
  }

  function clearSearch() {
    input.value = "";
    applySearch();
  }

  // ---- genre filter chips (rendered by music-stage.js) ----
  function selectGenre(index) {
    if (!Number.isFinite(index) || index < 0 || index >= genres.length) return;
    activeGenre = index;
    chips.forEach((chip, i) => {
      const on = i === index;
      chip.classList.toggle("is-active", on);
      chip.setAttribute("aria-pressed", on ? "true" : "false");
    });
    genres.forEach((genre, i) => {
      genre.hidden = i !== index;
    });
    applySearch();
  }

  if (filterMount) {
    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        selectGenre(parseInt(chip.getAttribute("data-genre"), 10));
      });
    });
    // the chip row scrolls horizontally on phones; Chromium does not always
    // bring a keyboard-focused chip fully into view, so do it explicitly
    filterMount.addEventListener("focusin", (e) => {
      const chip = e.target.closest(".genre-chip");
      if (chip) chip.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
  }

  jump.addEventListener("click", () => {
    selectGenre(parseInt(jump.getAttribute("data-genre"), 10));
    input.focus();
  });

  // ---- random pick: play one card from whatever is currently browsable ----
  if (randomBtn) {
    randomBtn.addEventListener("click", () => {
      const pool = cards.filter((card, i) => {
        return !(cardGenres[i] && cardGenres[i].hidden) &&
          !card.classList.contains("is-search-hidden");
      });
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

  // The music cards now open the unified detail layer; this function keeps
  // the NetEase deep-link strategy for the detail layer's external link.
  openNetEaseSong = openSong;
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
      // trigger the grid itself: the cards are laid out in one track, so the
      // reveal plays once for the whole roster.
      trigger: ".hof",
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
