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
    description.lang = 'en';
    description.textContent = 'A small private collection. Keep collecting. Take your time.';
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
    // Each chapter unfolds once; reading text remains stable afterwards.
    document.querySelectorAll('#photo .sec-head, #archive .sec-head, .curator-head').forEach((head) => {
      const title = head.querySelector('.sec-title, h2');
      const eyebrow = head.querySelector('.sec-eyebrow, .curator-kicker');
      const copy = head.querySelector('.sec-copy') || head.querySelector('p:last-child');
      head.classList.add('has-motion-stroke');
      const entrance = gsap.timeline({ defaults: { ease: 'power3.out' }, scrollTrigger: { trigger: head, start: 'top 88%', once: true } });
      entrance.fromTo(head, { '--stroke-scale': 0 }, { '--stroke-scale': 1, duration: .8 }, 0);
      if (eyebrow) entrance.from(eyebrow, { y: 8, opacity: 0, duration: .5, clearProps: 'transform,opacity' }, .04);
      if (title) entrance.from(title, { y: 30, opacity: .5, duration: .8, clearProps: 'transform,opacity' }, .12);
      if (copy) entrance.from(copy, { y: 12, opacity: .5, duration: .65, clearProps: 'transform,opacity' }, .24);
    });
    gsap.from('.footer-top, .atelier-colophon', {
      y: 20, opacity: 0, duration: .9, stagger: .1, ease: 'power3.out',
      scrollTrigger: { trigger: '.footer', start: 'top 94%', once: true },
    });
    return () => document.querySelectorAll('.has-motion-stroke').forEach((head) => { head.classList.remove('has-motion-stroke'); head.style.removeProperty('--stroke-scale'); });
  });
  const refresh = () => scheduleRefresh(250);
  window.addEventListener('load', refresh, { once: true });
  if (document.fonts) document.fonts.ready.then(refresh);
  document.addEventListener('load', (event) => {
    if (event.target instanceof HTMLImageElement &&
        !event.target.closest('#lightbox, dialog, .atelier-photo, [hidden], .tab-panel:not(.is-active)')) refresh();
  }, true);
})();
