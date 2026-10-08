/* An anthology within Archive: select and read without leaving the room. */
(() => {
  'use strict';

  const poem = document.getElementById('poem');
  const grid = document.getElementById('poem-selection-grid');
  const panel = document.getElementById('panel-poems');
  const works = Array.isArray(window.POEM_DATA) ? window.POEM_DATA : [];
  if (!poem || !grid || !panel || poem.dataset.atelierPoem || !works.length) return;
  const verse = poem.querySelector('.poem-verse');
  const credit = poem.querySelector('.poem-credit');
  const title = poem.querySelector('.poem-title');
  const standfirst = poem.querySelector('.poem-standfirst');
  const source = poem.querySelector('.poem-source-link');
  const signature = poem.querySelector('.poem-sign');
  const position = panel.querySelector('.poem-position');
  const status = document.getElementById('poem-selection-status');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!verse || !credit || !title || !standfirst || !source || !signature) return;
  poem.dataset.atelierPoem = 'true';

  let selected = 0;
  let tween = null;
  let readingObserver = null;
  let readingFrame = 0;
  const stopMotion = () => {
    if (tween) tween.kill();
    tween = null;
    verse.style.removeProperty('opacity');
    verse.style.removeProperty('transform');
    cancelAnimationFrame(readingFrame);
    if (readingObserver) readingObserver.disconnect();
    readingObserver = null;
    const stanzas = verse.querySelectorAll('.poem-stanza');
    stanzas.forEach((stanza) => stanza.classList.remove('is-reading'));
    if (window.gsap) gsap.set([title, credit, standfirst, poem.querySelector('.poem-foot'), ...verse.querySelectorAll('.poem-leaf-label'), ...stanzas], { clearProps: 'transform,opacity,clipPath,willChange' });
  };
  const readStanzas = (animate) => {
    stopMotion();
    if (reduced.matches || !panel.classList.contains('is-active')) return;
    const stanzas = Array.from(verse.querySelectorAll('.poem-stanza'));
    if (animate && window.gsap) {
      // Reserve the full page before revealing its lines. The mask unfolds
      // each stanza in reading order without changing layout or scroll speed.
      gsap.set(stanzas, { willChange: 'transform,opacity' });
      tween = gsap.timeline({ onComplete: () => { tween = null; } })
        .fromTo(title, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: .55, ease: 'power2.out', clearProps: 'transform,opacity' }, 0)
        .fromTo(credit, { y: 6, opacity: 0 }, { y: 0, opacity: 1, duration: .5, ease: 'power2.out', clearProps: 'transform,opacity' }, .08)
        .fromTo(standfirst, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: .65, ease: 'power2.out', clearProps: 'transform,opacity' }, .14)
        .fromTo(verse.querySelectorAll('.poem-leaf-label'), { opacity: 0 }, { opacity: 1, duration: .5, clearProps: 'opacity' }, .2)
        .fromTo(stanzas, { y: 16, opacity: 0, clipPath: 'inset(0 0 100% 0)' }, { y: 0, opacity: 1, clipPath: 'inset(0 0 0% 0)', duration: .85, stagger: .18, ease: 'power2.out', clearProps: 'transform,opacity,clipPath,willChange' }, .18)
        .fromTo(poem.querySelector('.poem-foot'), { opacity: 0 }, { opacity: 1, duration: .3, clearProps: 'opacity' }, .88 + (stanzas.length - 1) * .18);
    }
    // A margin mark follows the stanza in view; the text itself stays still.
    const updateReading = () => {
      let nearest = null, distance = Infinity;
      stanzas.forEach((stanza) => {
        const box = stanza.getBoundingClientRect();
        if (box.bottom < innerHeight * .18 || box.top > innerHeight * .78) return;
        const gap = Math.abs((box.top + box.bottom) / 2 - innerHeight * .46);
        if (gap < distance) { nearest = stanza; distance = gap; }
      });
      stanzas.forEach((stanza) => stanza.classList.toggle('is-reading', stanza === nearest));
    };
    readingObserver = new IntersectionObserver(updateReading, { rootMargin: '-18% 0px -22% 0px', threshold: [0, .25, .5, .75, 1] });
    stanzas.forEach((stanza) => readingObserver.observe(stanza));
    updateReading();
  };
  const refresh = () => {
    if (typeof scheduleRefresh === 'function') scheduleRefresh();
  };

  const choices = works.map((work, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'poem-choice';
    button.dataset.poemId = work.id;
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-controls', 'poem');
    button.setAttribute('aria-label', `Read ${work.title} by ${work.author}`);
    const number = document.createElement('span');
    number.className = 'poem-choice-index';
    number.setAttribute('aria-hidden', 'true');
    number.textContent = String(index + 1).padStart(2, '0');
    const name = document.createElement('span');
    name.className = 'poem-choice-title';
    name.textContent = work.title;
    const author = document.createElement('span');
    author.className = 'poem-choice-author';
    author.textContent = work.author;
    const mark = document.createElement('span');
    mark.className = 'poem-choice-mark';
    mark.setAttribute('aria-hidden', 'true');
    mark.textContent = '→';
    button.append(number, name, author, mark);
    return button;
  });
  grid.replaceChildren(...choices);

  const select = (index, announce = true) => {
    stopMotion();
    selected = (index + works.length) % works.length;
    const work = works[selected];
    choices.forEach((button, i) => button.setAttribute('aria-pressed', String(i === selected)));
    const authorLink = document.createElement('a');
    authorLink.href = work.authorUrl;
    authorLink.target = '_blank';
    authorLink.rel = 'noopener';
    authorLink.textContent = work.author;
    credit.replaceChildren(authorLink, document.createTextNode(` · ${work.form} · ${work.year}`));
    title.textContent = work.title;
    standfirst.textContent = work.note;
    source.href = work.sourceUrl;
    source.textContent = work.sourceLabel;
    const lineCount = work.stanzas.reduce((total, lines) => total + lines.length, 0);
    signature.textContent = `${lineCount} lines · ${work.stanzas.length} stanzas`;
    if (position) position.textContent = `${String(selected + 1).padStart(2, '0')} / ${String(works.length).padStart(2, '0')}`;

    const split = Math.ceil(work.stanzas.length / 2);
    const leaves = [work.stanzas.slice(0, split), work.stanzas.slice(split)].filter((leaf) => leaf.length);
    const fragment = document.createDocumentFragment();
    leaves.forEach((stanzas, leafIndex) => {
      const leaf = document.createElement('div');
      leaf.className = 'poem-col';
      const label = document.createElement('span');
      label.className = 'poem-leaf-label';
      label.setAttribute('aria-hidden', 'true');
      label.textContent = leafIndex === 0 ? 'THE POEM / I' : 'CONTINUED / II';
      leaf.append(label);
      stanzas.forEach((lines) => {
        const stanza = document.createElement('p');
        stanza.className = 'poem-stanza';
        lines.forEach((text, lineIndex) => {
          if (lineIndex) stanza.append(document.createTextNode('\n'));
          const line = document.createElement('span');
          line.className = 'poem-line';
          if ((work.refrains || []).includes(text)) line.classList.add('refrain');
          line.textContent = text;
          stanza.append(line);
        });
        leaf.append(stanza);
      });
      fragment.append(leaf);
    });
    verse.replaceChildren(fragment);
    if (announce && status) status.textContent = `${work.title} by ${work.author}. ${lineCount} lines. Full poem displayed below the contents.`;
    readStanzas(announce);
    refresh();
  };

  grid.addEventListener('click', (event) => {
    const button = event.target.closest('.poem-choice');
    const index = choices.indexOf(button);
    if (index < 0) return;
    if (index === selected) readStanzas(true);
    else select(index);
  });
  grid.addEventListener('keydown', (event) => {
    const index = choices.indexOf(event.target.closest('.poem-choice'));
    if (index < 0) return;
    const keys = { ArrowRight: index + 1, ArrowDown: index + 1, ArrowLeft: index - 1, ArrowUp: index - 1, Home: 0, End: works.length - 1 };
    if (!(event.key in keys)) return;
    event.preventDefault();
    select(keys[event.key]);
    choices[selected].focus({ preventScroll: true });
  });
  panel.querySelectorAll('[data-poem-step]').forEach((button) => {
    button.addEventListener('click', () => select(selected + Number(button.dataset.poemStep)));
  });
  reduced.addEventListener('change', () => { readStanzas(false); refresh(); });
  document.getElementById('archive-tabbar')?.addEventListener('night:archive-tab', (event) => {
    if (event.detail?.token !== 'poems') stopMotion();
    else readingFrame = requestAnimationFrame(() => readStanzas(true));
  });
  const poemsTab = document.getElementById('tab-poems');
  document.querySelectorAll('a[href="#tab-poems"]').forEach((link) => {
    link.addEventListener('click', () => {
      if (poemsTab?.getAttribute('aria-selected') !== 'true') poemsTab.click();
    });
  });
  select(0, false);
  if (location.hash === '#tab-poems' || location.hash === '#about') {
    poemsTab?.click();
    if (location.hash === '#about') {
      requestAnimationFrame(() => document.getElementById('about')?.scrollIntoView({ behavior: 'auto', block: 'start' }));
    }
  }
})();
