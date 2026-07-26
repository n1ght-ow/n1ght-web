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

const images = Array.from(document.images);
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
  }, 9000);
}

/* ---------- reduced motion: stop here, static site ---------- */
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

  /* ---------- horizontal photography gallery ---------- */

  const hsWrap = document.getElementById("hs-wrap");
  const hsTrack = document.getElementById("hs-track");

  const getDistance = () => Math.max(0, hsTrack.scrollWidth - window.innerWidth);

  const hsTween = gsap.to(hsTrack, {
    x: () => -getDistance(),
    ease: "none",
    scrollTrigger: {
      trigger: hsWrap,
      start: "top top",
      end: () => "+=" + getDistance(),
      pin: true,
      scrub: 1,
      invalidateOnRefresh: true,
      anticipatePin: 1,
      onUpdate: (self) => {
        if (!isDraggingBar) renderDragbar(self.progress);
      },
    },
  });

  const hsST = hsTween.scrollTrigger;

  /* ---------- gallery drag bar ---------- */

  const dragbar = document.getElementById("hs-dragbar");
  const dragTrack = document.getElementById("hs-dragbar-track");
  const dragFill = document.getElementById("hs-dragbar-fill");
  const dragHandle = document.getElementById("hs-dragbar-handle");
  const dragCount = document.getElementById("hs-dragbar-count");

  let isDraggingBar = false;

  function renderDragbar(progress) {
    const pct = Math.max(0, Math.min(1, progress)) * 100;
    dragFill.style.width = pct + "%";
    dragHandle.style.left = pct + "%";
    const frame = Math.min(11, Math.max(1, Math.round(progress * 10) + 1));
    dragCount.textContent = "FRAME " + String(frame).padStart(2, "0") + " / 11";
  }

  function barEventToProgress(e) {
    const rect = dragTrack.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  }

  // scroll the page so the pinned scrub lands exactly on target progress
  function seekGallery(progress) {
    const y = hsST.start + (hsST.end - hsST.start) * progress;
    window.scrollTo(0, y);
  }

  // keep handle in sync with scroll-driven progress
  ScrollTrigger.create({
    trigger: hsWrap,
    start: "top top",
    end: () => "+=" + getDistance(),
    onEnter: () => dragbar.classList.add("is-active"),
    onEnterBack: () => dragbar.classList.add("is-active"),
    onLeave: () => dragbar.classList.remove("is-active"),
    onLeaveBack: () => dragbar.classList.remove("is-active"),
  });

  dragTrack.addEventListener("pointerdown", (e) => {
    isDraggingBar = true;
    dragTrack.classList.add("is-dragging");
    dragTrack.setPointerCapture(e.pointerId);
    const p = barEventToProgress(e);
    renderDragbar(p);
    seekGallery(p);
  });

  dragTrack.addEventListener("pointermove", (e) => {
    if (!isDraggingBar) return;
    const p = barEventToProgress(e);
    renderDragbar(p);
    seekGallery(p);
  });

  function endBarDrag() {
    isDraggingBar = false;
    dragTrack.classList.remove("is-dragging");
  }
  dragTrack.addEventListener("pointerup", endBarDrag);
  dragTrack.addEventListener("pointercancel", endBarDrag);

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

  /* ---------- featured game: pinned scrub showcase ---------- */

  const featPanels = gsap.utils.toArray(".feat-panel");
  const featImgs = [
    document.querySelector(".feat-img-1"),
    document.querySelector(".feat-img-2"),
    document.querySelector(".feat-img-3"),
  ];
  const featCount = document.getElementById("feat-count");

  gsap.set(featPanels[0], { autoAlpha: 1 });

  const featTl = gsap.timeline({
    scrollTrigger: {
      trigger: "#featured",
      start: "top top",
      end: "+=2600",
      pin: true,
      scrub: 1,
      invalidateOnRefresh: true,
      anticipatePin: 1,
      onUpdate: (self) => {
        const idx = Math.min(2, Math.floor(self.progress * 3));
        featCount.textContent = "CASE 0" + (idx + 1) + " / 03";
      },
    },
  });

  // panel 1 -> 2
  featTl
    .to(featPanels[0], { autoAlpha: 0, y: -46, duration: 0.6, ease: "power2.in" }, 0.55)
    .to(featImgs[1], { clipPath: "inset(0% 0 0 0)", duration: 0.9, ease: "power3.inOut" }, 0.7)
    .fromTo(featImgs[1], { scale: 1.15 }, { scale: 1, duration: 1.4, ease: "power2.out" }, 0.7)
    .fromTo(featPanels[1], { autoAlpha: 0, y: 46 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out" }, 1.15)
    // panel 2 -> 3
    .to(featPanels[1], { autoAlpha: 0, y: -46, duration: 0.6, ease: "power2.in" }, 2.1)
    .to(featImgs[2], { clipPath: "inset(0% 0 0 0)", duration: 0.9, ease: "power3.inOut" }, 2.25)
    .fromTo(featImgs[2], { scale: 1.15 }, { scale: 1, duration: 1.4, ease: "power2.out" }, 2.25)
    .fromTo(featPanels[2], { autoAlpha: 0, y: 46 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out" }, 2.7)
    .to({}, { duration: 0.5 }); // hold on the final frame before release

  /* ---------- about title char reveal (BR preserved as real line break) ---------- */

  const aboutTitle = document.getElementById("about-title");
  const aboutLines = [];
  aboutTitle.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) aboutLines.push(node.textContent);
  });
  aboutTitle.innerHTML = "";
  aboutLines.forEach((line, i) => {
    if (i > 0) aboutTitle.appendChild(document.createElement("br"));
    const holder = document.createElement("span");
    holder.style.display = "inline-block";
    [...line].forEach((c) => {
      const s = document.createElement("span");
      s.className = "ch";
      s.textContent = c;
      holder.appendChild(s);
    });
    aboutTitle.appendChild(holder);
  });

  gsap.from(aboutTitle.querySelectorAll(".ch"), {
    yPercent: 110,
    duration: 1,
    stagger: 0.025,
    ease: "power4.out",
    scrollTrigger: {
      trigger: aboutTitle,
      start: "top 80%",
      toggleActions: "play none none reverse",
    },
  });

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
} else {
  /* reduced motion: everything visible, no pins or scrubs */
  document.querySelectorAll(".feat-panel").forEach((p) => {
    p.style.position = "relative";
    p.style.opacity = 1;
    p.style.visibility = "visible";
  });
  document.querySelectorAll(".feat-img").forEach((img, i) => {
    img.style.position = i === 0 ? "relative" : "absolute";
    img.style.clipPath = "none";
  });
}
