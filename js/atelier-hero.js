/* A photographic cover. Reveal once, then let the image follow the page. */
(() => {
  const hero = document.getElementById("hero");
  if (!hero || hero.dataset.atelierHero) return;
  hero.dataset.atelierHero = "true";
  const oldMark = hero.querySelector(".hero-wordmark");
  if (window.gsap && oldMark) gsap.killTweensOf(oldMark);
  hero.classList.add("atelier-hero");


  hero.querySelector(".atelier-enter")?.addEventListener("click", (event) => {
    const photo = document.getElementById("photo");
    if (!photo) return;
    event.preventDefault();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (typeof lenis !== "undefined" && lenis) lenis.scrollTo(photo, { duration: 1.1, immediate: reduce });
    else photo.scrollIntoView({ behavior: reduce ? "instant" : "smooth" });
  }, { capture: true });

  if (!window.gsap || !window.ScrollTrigger) return;
  const mm = gsap.matchMedia();
  mm.add("(prefers-reduced-motion: no-preference)", () => {
    const media = hero.querySelector(".atelier-media");
    const image = hero.querySelector(".hero-plate img");
    const heading = hero.querySelector(".hero-wordmark");
    const edition = hero.querySelector(".atelier-edition");
    const bottom = hero.querySelector(".atelier-bottom");

    /* The media is visible without scripting; arrival never hides the subject. */
    gsap.timeline({ defaults: { ease: "power3.out" } })
      .from(edition, { y: 10, opacity: 0, duration: .75 }, .08)
      .from(heading, { y: 18, opacity: 0, duration: .8 }, .14)
      .from(media, { y: 16, duration: .9 }, .2)
      .from(bottom, { y: 10, opacity: 0, duration: .65 }, .4);

    gsap.to(image, {
      scale: 1.035,
      ease: "none",
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: .7, invalidateOnRefresh: true }
    });
  });
  const image = hero.querySelector("img");
  const refresh = () => { if (typeof scheduleRefresh === "function") scheduleRefresh(250); else ScrollTrigger.refresh(); };
  if (!image.complete) image.addEventListener("load", refresh, { once: true });
  refresh();
})();
