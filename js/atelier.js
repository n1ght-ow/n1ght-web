/* Shared gallery gestures. Component animation lives in its own module. */
(function () {
  'use strict';
  // One stroke-based icon family. Replace only text nodes, preserving controls,
  // event listeners, stored IDs, and accessible action names.
  const iconPaths = {
    '←': 'M20 12H4m6-6-6 6 6 6',
    '→': 'M4 12h16m-6-6 6 6-6 6',
    '↑': 'M12 20V4m-6 6 6-6 6 6',
    '↓': 'M12 4v16m-6-6 6 6 6-6',
    '↗': 'M5 19 19 5M7 5h12v12',
    '↖': 'M19 19 5 5m0 12V5h12',
    '×': 'm6 6 12 12M18 6 6 18',
    '+': 'M12 5v14M5 12h14',
    '⠿': 'M8 5h.01M16 5h.01M8 12h.01M16 12h.01M8 19h.01M16 19h.01'
  };
  const glyphPattern = /[←→↑↓↗↖×+⠿]/;
  function replaceControlIcons(root) {
    const element = root instanceof Element ? root : root.parentElement;
    if (!element || element.closest('svg')) return;
    const controls = element.matches('button,a') ? [element] : [...element.querySelectorAll('button,a')];
    const enclosing = element.closest('button,a');
    if (enclosing && !controls.includes(enclosing)) controls.push(enclosing);
    controls.forEach((control) => {
      const walker = document.createTreeWalker(control, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) {
        const node = walker.currentNode;
        const actionCopy = control.matches('.photo-surprise,.photo-look,.photo-keep,.photo-room-tabs button,.photo-story-actions button,.curator-text-btn,.curator-primary,.curator-collect,.curator-collect-link,.curator-more,.poem-turn,.lb-meta-link,.collection-room-action');
        if (glyphPattern.test(node.textContent) && (node.textContent.trim().length === 1 || actionCopy) && !node.parentElement.closest('svg')) nodes.push(node);
      }
      nodes.forEach((node) => {
        const fragment = document.createDocumentFragment();
        node.textContent.split(/([←→↑↓↗↖×+⠿])/).filter(Boolean).forEach((part) => {
          if (!iconPaths[part]) { fragment.append(document.createTextNode(part)); return; }
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.setAttribute('viewBox', '0 0 24 24');
          svg.setAttribute('class', 'gallery-icon');
          svg.setAttribute('aria-hidden', 'true');
          svg.setAttribute('focusable', 'false');
          const path = document.createElementNS(svg.namespaceURI, 'path');
          path.setAttribute('d', iconPaths[part]); path.setAttribute('fill', 'none');
          path.setAttribute('stroke', 'currentColor'); path.setAttribute('stroke-width', part === '⠿' ? '3' : '1.6');
          path.setAttribute('stroke-linecap', 'round'); path.setAttribute('stroke-linejoin', 'round');
          svg.append(path); fragment.append(svg);
        });
        node.replaceWith(fragment);
      });
    });
  }
  replaceControlIcons(document.body);
  const icons = new MutationObserver((records) => {
    const roots = new Set();
    records.forEach((record) => {
      if (record.type === 'characterData') roots.add(record.target.parentElement);
      else record.addedNodes.forEach((node) => { if (node.nodeType === 1 || node.nodeType === 3) roots.add(node); });
    });
    roots.forEach(replaceControlIcons);
  });
  icons.observe(document.body, { childList: true, subtree: true, characterData: true });
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
