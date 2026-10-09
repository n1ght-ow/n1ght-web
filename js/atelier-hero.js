/* A photographic cover. Reveal once, then let the image follow the page. */
(() => {
  const hero = document.getElementById("hero");
  if (!hero || hero.dataset.atelierHero) return;
  hero.dataset.atelierHero = "true";
  const oldMark = hero.querySelector(".hero-wordmark");
  if (window.gsap && oldMark) gsap.killTweensOf(oldMark);
  hero.classList.add("atelier-hero");

  // Decode the next view before replacing the visible photograph.
  const picture = hero.querySelector('.hero-plate');
  const mainImage = picture?.querySelector('img');
  const source = picture?.querySelector('source');
  const caption = document.getElementById('gallery-view-caption');
  const changeView = hero.querySelector('.gallery-change-view');
  const views = [
    { src: 'hero/launch-1600.webp?v=1', srcset: 'hero/launch-800.webp?v=1 800w, hero/launch-1600.webp?v=1 1600w, hero/launch-2400.webp?v=1 2400w', caption: 'Liftoff. Keep looking up.', alt: 'A rocket lifting off between towering clouds of smoke, with orange light reflected in the water', width: 3360, height: 1890 },
    { src: 'photo/wall/1789470372631.webp', caption: 'Somewhere beyond the everyday.', alt: 'White cumulus towers above green hills and wind turbines', width: 1600, height: 1067 },
    { src: 'photo/wall/1779456446231.webp', caption: 'Small things. A wider world.', alt: 'A white blossom branch reaching into the blue sky', width: 1600, height: 1067 }
  ];
  let viewIndex = 0;
  if (changeView && mainImage && caption) {
    const feedback = document.createElement('span');
    feedback.className = 'sr-only';
    feedback.setAttribute('role', 'status');
    changeView.after(feedback);
    changeView.addEventListener('click', async () => {
      if (changeView.disabled) return;
      changeView.disabled = true;
      changeView.setAttribute('aria-busy', 'true');
      const nextIndex = (viewIndex + 1) % views.length;
      const next = views[nextIndex];
      const preload = new Image();
      preload.src = next.src;
      let timeout;
      try {
        await Promise.race([preload.decode(), new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('Image loading timed out')), 12000); })]);
        if (source) {
          if (next.srcset) source.setAttribute('srcset', next.srcset);
          else source.removeAttribute('srcset');
        }
        mainImage.src = next.src;
        mainImage.alt = next.alt;
        mainImage.width = next.width;
        mainImage.height = next.height;
        caption.textContent = next.caption;
        feedback.textContent = next.caption;
        viewIndex = nextIndex;
        if (window.gsap && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          gsap.fromTo(mainImage, { clipPath: 'inset(0 0 0 100%)' }, { clipPath: 'inset(0 0 0 0%)', duration: .6, ease: 'power3.out', clearProps: 'clipPath', overwrite: 'auto' });
        }
      } catch {
        feedback.textContent = 'This view could not load. Try another view again.';
      } finally {
        clearTimeout(timeout);
        changeView.disabled = false;
        changeView.removeAttribute('aria-busy');
      }
    });
  }


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
    const heading = hero.querySelector(".hero-wordmark");
    const bottom = hero.querySelector(".atelier-bottom");

    /* One opening gesture establishes the gallery; the collection stays calm. */
    gsap.timeline({ defaults: { ease: "power3.out" } })
      .from(heading.querySelectorAll('span'), { yPercent: 70, opacity: 0, duration: .9, stagger: .1, clearProps: 'transform,opacity' }, .1)
      .from(media.querySelector('.atelier-frame'), { clipPath: 'inset(0 0 20% 0)', y: 22, opacity: .7, duration: 1, clearProps: 'clipPath,transform,opacity' }, .22)
      .from(media.querySelector('.atelier-caption'), { y: 8, opacity: 0, duration: .5, clearProps: 'transform,opacity' }, .65)
      .from(bottom.children, { y: 18, opacity: 0, duration: .65, stagger: .08, clearProps: 'transform,opacity' }, .55);
    gsap.from('.gallery-satellite', { y: 35, opacity: 0, duration: .9, stagger: .12, ease: 'power3.out', clearProps: 'transform,opacity' });
  });
  const image = hero.querySelector("img");
  const refresh = () => { if (typeof scheduleRefresh === "function") scheduleRefresh(250); else ScrollTrigger.refresh(); };
  if (!image.complete) image.addEventListener("load", refresh, { once: true });
  refresh();
})();
