/* Shared gallery gestures. Component animation lives in its own module. */
(function () {
  'use strict';
  const nav = document.getElementById('nav');
  const footerShell = document.querySelector('.footer .shell');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (footerShell) {
    const note = document.createElement('div');
    note.className = 'atelier-colophon';
    const closing = document.createElement('em');
    closing.textContent = 'Some things are worth keeping.';
    const description = document.createElement('span');
    description.lang = 'zh';
    description.textContent = '一座小小的私人馆藏。持续收藏，慢慢观看。';
    note.append(closing, description);
    footerShell.appendChild(note);
  }
  if (!window.gsap || !window.ScrollTrigger) return;
  const line = document.createElement('span');
  line.className = 'atelier-reading-line';
  line.setAttribute('aria-hidden', 'true');
  if (nav) nav.appendChild(line);
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      if (nav) nav.classList.toggle('is-scrolled', self.scroll() > 45);
      if (!reduced.matches) line.style.transform = 'scaleX(' + self.progress + ')';
    },
  });
  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    // Titles follow the reader very slightly; running text remains still.
    document.querySelectorAll('#photo .sec-title, #archive .sec-title').forEach((title) => {
      gsap.fromTo(title, { y: 18 }, {
        y: -14,
        ease: 'none',
        scrollTrigger: {
          trigger: title.closest('section'),
          start: 'top bottom', end: 'bottom top', scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });
    });
    gsap.from('.footer-top, .atelier-colophon', {
      y: 20, opacity: 0, duration: 0.9, stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.footer', start: 'top 94%', once: true },
    });
  });
  let refreshTimer;
  const refresh = () => {
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 250);
  };
  window.addEventListener('load', refresh, { once: true });
  if (document.fonts) document.fonts.ready.then(refresh);
  document.addEventListener('load', (event) => {
    if (event.target instanceof HTMLImageElement) refresh();
  }, true);
  window.addEventListener('pagehide', () => mm.revert(), { once: true });
})();
