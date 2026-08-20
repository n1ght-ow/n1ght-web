/* ============================================================
   N1GHT CHXN9 - interaction layer
   GSAP + ScrollTrigger. All scrub tweens invalidateOnRefresh.
   ============================================================ */

gsap.registerPlugin(ScrollTrigger);

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

let preloadFinished = false;

function finishPreload() {
  if (preloadFinished) return;
  preloadFinished = true;

  const tl = gsap.timeline({
    onComplete: () => {
      preloader.remove();
      // recalc once the reveal is done, then again after lazy gallery
      // images settle so the pinned ranges stay accurate
      ScrollTrigger.refresh();
      setTimeout(() => ScrollTrigger.refresh(), 800);
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => ScrollTrigger.refresh());
      }
    },
  });

  if (REDUCED) {
    tl.set(preloader, { display: "none" })
      .set(heroChars, { yPercent: 0 })
      .set(".hero-sub span", { yPercent: 0, opacity: 1 });
    return;
  }

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

  function renderDragbar(progress) {
    if (!bar || !barFill || !barHandle || !barCount) return;
    const pct = Math.max(0, Math.min(1, progress)) * 100;
    barFill.style.width = pct + "%";
    barHandle.style.left = pct + "%";
    const frame = Math.min(opts.itemCount, Math.max(1, Math.round(progress * (opts.itemCount - 1)) + 1));
    barCount.textContent = opts.label + " " + String(frame).padStart(2, "0") + " / " + String(opts.itemCount).padStart(2, "0");
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
        if (!isDraggingBar) renderDragbar(self.progress);
      },
    },
  });

  const st = tween.scrollTrigger;

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

    // scroll the page so the pinned scrub lands exactly on target progress
    const seek = (progress) => {
      const y = st.start + (st.end - st.start) * progress;
      window.scrollTo(0, y);
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

/* ---------- mantra: big words drift apart on scroll (always active) ---------- */

const mantra = document.getElementById("mantra");
if (mantra) {
  const mLine1 = mantra.querySelector(".mantra-line-1");
  const mLine2 = mantra.querySelector(".mantra-line-2");

  gsap.fromTo(mLine1, { xPercent: 4 }, {
    xPercent: -14,
    ease: "none",
    scrollTrigger: {
      trigger: mantra,
      start: "top top",
      end: "+=1400",
      pin: true,
      scrub: REDUCED ? 0.5 : 1,
      invalidateOnRefresh: true,
      anticipatePin: 1,
    },
  });

  gsap.fromTo(mLine2, { xPercent: -4 }, {
    xPercent: 14,
    ease: "none",
    scrollTrigger: {
      trigger: mantra,
      start: "top top",
      end: "+=1400",
      scrub: REDUCED ? 0.5 : 1,
      invalidateOnRefresh: true,
    },
  });
}

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
  isLbOpen = true;
  lbCloseBtn.focus();
}

function lbCloseFn() {
  if (!lightbox) return;
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
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

  lbImg.addEventListener("load", () => lbImg.classList.add("is-loaded"));
}

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
      y: 24,
      autoAlpha: 0,
      duration: 0.9,
      stagger: 0.1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: head,
        start: "top 70%",
        toggleActions: "play none none reverse",
      },
    });
  }

  splitHeadParallax("photo-head");
  splitHeadParallax("game-head");
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

  // caption reveal per card
  gsap.utils.toArray(".hs-card figcaption").forEach((cap) => {
    gsap.from(cap.children, {
      y: 18,
      autoAlpha: 0,
      duration: 0.7,
      stagger: 0.08,
      ease: "power3.out",
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
    autoAlpha: 0,
    rotationX: -8,
    transformOrigin: "center bottom",
    duration: 1.1,
    stagger: { each: 0.09, from: "start" },
    ease: "power4.out",
    scrollTrigger: {
      trigger: ".hof-row",
      start: "top 82%",
      toggleActions: "play none none reverse",
    },
  });

  // touch support: tap flips card instead of hover
  if (window.matchMedia("(hover: none)").matches) {
    document.querySelectorAll(".hof-card").forEach((card) => {
      card.addEventListener("click", () => card.classList.toggle("is-flipped"));
    });
  }

  /* ---------- about body entrance ---------- */

  gsap.from(".about-body p", {
    y: 34,
    autoAlpha: 0,
    duration: 0.9,
    stagger: 0.14,
    ease: "power3.out",
    scrollTrigger: {
      trigger: ".about-body",
      start: "top 82%",
      toggleActions: "play none none reverse",
    },
  });

  /* ---------- footer entrance ---------- */

  gsap.from(".footer-name", {
    yPercent: 60,
    autoAlpha: 0,
    duration: 1,
    ease: "power4.out",
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
