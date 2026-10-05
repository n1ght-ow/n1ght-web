/* A new opening spread. Each movement is tied to arrival, scroll, or touch. */
(() => {
  const hero = document.getElementById("hero");
  if (!hero || hero.dataset.atelierHero) return;
  hero.dataset.atelierHero = "true";
  const oldMark = hero.querySelector(".hero-wordmark");
  if (window.gsap && oldMark) gsap.killTweensOf(oldMark);
  hero.classList.add("atelier-hero");


  hero.querySelector(".atelier-enter").addEventListener("click", (event) => {
    const photo = document.getElementById("photo");
    if (!photo) return;
    event.preventDefault();
    if (typeof lenis !== "undefined" && lenis) lenis.scrollTo(photo, { duration: 1.5, offset: -30 });
    else photo.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  });

  if (!window.gsap || !window.ScrollTrigger) return;
  const mm = gsap.matchMedia();
  mm.add("(prefers-reduced-motion: no-preference)", () => {
    const copy = hero.querySelector(".atelier-copy");
    const media = hero.querySelector(".atelier-media");
    const imageWindow = hero.querySelector(".atelier-image-window");
    const heading = hero.querySelector(".hero-wordmark");
    const subtitle = hero.querySelector(".atelier-subtitle");
    const intro = hero.querySelector(".atelier-intro");
    const edition = hero.querySelector(".atelier-edition");
    const bottom = hero.querySelector(".atelier-bottom");

    /* One measured reveal, as though opening the first page of an exhibition. */
    gsap.timeline({ defaults: { ease: "power3.out" } })
      .from(edition, { y: 10, opacity: 0, duration: .75 }, .08)
      .from(heading, { y: 35, opacity: 0, duration: 1.05 }, .14)
      .from([subtitle, intro], { y: 16, opacity: 0, duration: .8, stagger: .12 }, .38)
      .from(imageWindow, { clipPath: "inset(100% 0% 0% 0%)", duration: 1.2 }, .12)
      .from(bottom, { y: 12, opacity: 0, duration: .75 }, .65);

    /* The framed image rises by a few centimetres as the reader turns the page. */
    gsap.timeline({
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: .7, invalidateOnRefresh: true }
    })
      .to(media, { y: () => window.innerWidth <= 720 ? -28 : -75, rotation: -.75, ease: "none" }, 0)
      .to(copy, { y: () => window.innerWidth <= 720 ? -12 : -34, ease: "none" }, 0)
      .to(hero.querySelector(".atelier-scroll-track i"), { scaleX: 1, ease: "none" }, 0);
  });
  const image = hero.querySelector("img");
  const refresh = () => { if (typeof scheduleRefresh === "function") scheduleRefresh(250); else ScrollTrigger.refresh(); };
  if (!image.complete) image.addEventListener("load", refresh, { once: true });
  refresh();
})();
