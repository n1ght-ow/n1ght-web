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
  const actionPaths = {
    shuffle: 'M4 7h3c4 0 6 10 10 10h3m-4-4 4 4-4 4M4 17h3c1.5 0 2.8-1.4 4-3m2-4c1.2-1.6 2.5-3 4-3h3m-4-4 4 4-4 4',
    zoom: 'M15.5 15.5 21 21M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0M10 7v6M7 10h6',
    collect: 'M4 6h16v14H4ZM9 3h6M12 10v6M9 13h6',
    desk: 'M4 8h16v5H4ZM6 13v7M18 13v7M9 4h6',
    center: 'M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
    reset: 'M4 10a8 8 0 1 1 2 8M4 4v6h6',
    undo: 'M9 4 4 9l5 5M4 9h10a6 6 0 0 1 0 12',
    close: 'm6 6 12 12M18 6 6 18'
  };
  const compactActions = [

    ['.photo-surprise', 'shuffle', 'Random photograph'],
    ['[data-recenter]', 'center', 'Center the current photograph'],
    ['.photo-look', 'zoom', 'Open photograph'],
    ['[data-deal]', 'shuffle', 'Choose three random photographs'],
    ['.collection-room-action', 'shuffle', 'Explore a random collection'],
    ['.curator-collect', 'collect'],
    ['.curator-collect-link', 'desk', 'Visit the curator’s desk'],
    ['#curator-surprise', 'shuffle', 'Choose seven random pieces'],
    ['#curator-reset', 'reset'],
    ['#curator-picker-close', 'close', 'Close collection picker'],
    ['.lb-close', 'close', 'Close detail viewer']
  ];
  function compactAction(control) {
    const action = compactActions.find(([selector]) => control.matches(selector));
    if (!action) return false;
    // Component state updates replace textContent. Rebuild only then, never
    // in response to our own SVG mutations or an unrelated state change.
    if (control.querySelector('.gallery-action-icon')) return true;
    const copy = control.textContent.trim().replace(/[↗↖→+✓×]/g, '').trim();
    const label = action[2] || (control.matches('.curator-collect') ? control.getAttribute('aria-label') : copy);
    let icon = action[1];
    if (control.matches('#curator-reset') && copy === 'Undo reset') icon = 'undo';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('class', 'gallery-icon gallery-action-icon');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const path = document.createElementNS(svg.namespaceURI, 'path');
    path.setAttribute('d', actionPaths[icon]);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '1.6');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    svg.append(path);
    control.classList.add('gallery-icon-action');
    control.setAttribute('aria-label', label);
    control.title = label;
    control.replaceChildren(svg);
    return true;
  }
  function replaceControlIcons(root) {
    const element = root instanceof Element ? root : root.parentElement;
    if (!element || element.closest('svg')) return;
    const controls = element.matches('button,a') ? [element] : [...element.querySelectorAll('button,a')];
    const enclosing = element.closest('button,a');
    if (enclosing && !controls.includes(enclosing)) controls.push(enclosing);
    controls.forEach((control) => {
      if (compactAction(control)) return;
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
  if (!window.gsap || !window.ScrollTrigger) return;
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: self => {
    if (nav) nav.classList.toggle('is-scrolled', self.scroll() > 45);
  } });
  const refresh = () => scheduleRefresh(250);
  window.addEventListener('load', refresh, { once: true });
  if (document.fonts) document.fonts.ready.then(refresh);
  document.addEventListener('load', (event) => {
    if (event.target instanceof HTMLImageElement &&
        !event.target.closest('#lightbox, dialog, .atelier-photo, [hidden], .tab-panel:not(.is-active)')) refresh();
  }, true);
})();
