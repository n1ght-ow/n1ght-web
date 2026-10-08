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

    /* The cover opens in reading order: name, photograph, label, invitation. */
    gsap.timeline({ defaults: { ease: "power3.out" } })
      .from(edition, { y: 10, opacity: 0, duration: .55, clearProps: 'transform,opacity' }, .04)
      .from(heading.querySelectorAll('span'), { yPercent: 70, opacity: 0, duration: .9, stagger: .1, clearProps: 'transform,opacity' }, .1)
      .from(media.querySelector('.atelier-frame'), { clipPath: 'inset(0 0 20% 0)', y: 22, opacity: .7, duration: 1, clearProps: 'clipPath,transform,opacity' }, .22)
      .from(media.querySelector('.atelier-caption'), { y: 8, opacity: 0, duration: .5, clearProps: 'transform,opacity' }, .65)
      .from(bottom.children, { y: 18, opacity: 0, duration: .65, stagger: .08, clearProps: 'transform,opacity' }, .55);

    gsap.to(image, {
      scale: 1.055,
      ease: "none",
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: .7, invalidateOnRefresh: true }
    });
  });
  const image = hero.querySelector("img");
  const refresh = () => { if (typeof scheduleRefresh === "function") scheduleRefresh(250); else ScrollTrigger.refresh(); };
  if (!image.complete) image.addEventListener("load", refresh, { once: true });
  refresh();
})();
