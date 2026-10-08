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
  const stopMotion = () => {
    if (tween) tween.kill();
    tween = null;
    verse.style.removeProperty('opacity');
    verse.style.removeProperty('transform');
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
    if (announce && !reduced.matches && window.gsap && panel.classList.contains('is-active')) {
      tween = window.gsap.fromTo(verse, { opacity: .6, y: 6 }, {
        opacity: 1, y: 0, duration: .3, ease: 'power1.out', clearProps: 'opacity,transform',
        onComplete: () => { tween = null; }
      });
    }
    refresh();
  };

  grid.addEventListener('click', (event) => {
    const button = event.target.closest('.poem-choice');
    const index = choices.indexOf(button);
    if (index >= 0 && index !== selected) select(index);
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
  reduced.addEventListener('change', () => { stopMotion(); refresh(); });
  document.getElementById('archive-tabbar')?.addEventListener('night:archive-tab', (event) => {
    if (event.detail?.token !== 'poems') stopMotion();
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
