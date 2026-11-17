/* One closing reveal. The artwork itself remains owned by LiminalLight. */
(function () {
  "use strict";

  const footer = document.getElementById("closing");
  if (!footer || !footer.classList.contains("liminal-footer")) return;

  const stage = footer.querySelector(".liminal-footer__stage");
  const lineMasks = Array.from(footer.querySelectorAll(".liminal-return__words > span"));
  const arrow = footer.querySelector(".liminal-return__arrow");
  const base = footer.querySelector(".liminal-footer__base");
  if (!stage || !lineMasks.length || !arrow || !base) return;

  const words = lineMasks.map((mask) => {
    let line = mask.querySelector(":scope > .liminal-return__line");
    if (!line) {
      line = document.createElement("span");
      line.className = "liminal-return__line";
      line.textContent = mask.textContent;
      mask.replaceChildren(line);
    }
    return line;
  });

  let matchMedia = null;
  let active = null;
  let motionPaused = false;
  let destroyed = false;

  function setMotionState(paused) {
    motionPaused = paused;
    footer.dataset.motionPaused = String(paused);
  }

  function reveal(state) {
    if (!state || state.played || state !== active) return;
    state.played = true;
    if (motionPaused) state.intro.progress(1).pause();
    else state.intro.play(0);
  }

  function onMotionState(event) {
    const detail = event.detail;
    let paused = false;
    if (typeof detail === "boolean") paused = detail;
    else if (detail && typeof detail === "object") {
      if (typeof detail.paused === "boolean") paused = detail.paused;
      else if (typeof detail.playing === "boolean") paused = !detail.playing;
      else if (typeof detail.motion === "string") paused = detail.motion === "paused" || detail.motion === "off";
    }
    setMotionState(paused);

    if (!paused || !active) return;
    if (active.intro?.isActive()) {
      active.intro.progress(1).pause();
    } else if (active.trigger?.isActive) {
      reveal(active);
    }
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    window.removeEventListener("liminal:motion-state", onMotionState);
    window.removeEventListener("pagehide", destroy);
    if (matchMedia) matchMedia.revert();
    matchMedia = null;
    active = null;
    footer.removeAttribute("data-motion-paused");
  }

  window.addEventListener("liminal:motion-state", onMotionState);
  window.addEventListener("pagehide", destroy, { once: true });

  if (!window.gsap || !window.ScrollTrigger) {
    footer.dataset.liminalMotion = "static";
    return;
  }

  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  matchMedia = gsap.matchMedia();

  matchMedia.add("(prefers-reduced-motion: no-preference)", () => {
    const intro = gsap.timeline({
      paused: true,
      defaults: { ease: "power3.out" }
    });
    const state = { intro, trigger: null, played: false };
    active = state;

    gsap.set(stage, { scale: 1.08, transformOrigin: "50% 50%" });
    gsap.set(words, { yPercent: 112 });
    gsap.set(arrow, { opacity: 0 });
    gsap.set(base, { y: 18, opacity: 0 });

    intro
      .to(stage, { scale: 1, duration: 1.55, ease: "power2.out", clearProps: "transform" }, 0)
      .to(words, {
        yPercent: 0,
        duration: .95,
        stagger: .14,
        clearProps: "transform"
      }, .12)
      .to(arrow, { opacity: 1, duration: .55, ease: "power2.out", clearProps: "opacity" }, .52)
      .to(base, {
        y: 0,
        opacity: 1,
        duration: .68,
        clearProps: "transform,opacity"
      }, .6);

    state.trigger = ScrollTrigger.create({
      trigger: footer,
      start: "top 88%",
      once: true,
      invalidateOnRefresh: true,
      onEnter: () => reveal(state)
    });

    footer.dataset.liminalMotion = "animated";
    if (footer.getBoundingClientRect().top < window.innerHeight * .88) reveal(state);

    return () => {
      state.trigger?.kill();
      intro.kill();
      if (active === state) active = null;
    };
  });

  matchMedia.add("(prefers-reduced-motion: reduce)", () => {
    gsap.set([stage, words, arrow, base], {
      clearProps: "transform,opacity"
    });
    footer.dataset.liminalMotion = "static";
    if (active) {
      active.trigger?.kill();
      active.intro.kill();
      active = null;
    }
  });
})();
