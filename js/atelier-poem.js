/* The six stanzas remain fully readable. Motion follows the reader, never a timer. */
(() => {
  'use strict';
  const poem = document.getElementById('poem');
  if (!poem || poem.dataset.atelierPoem) return;
  poem.dataset.atelierPoem = 'true';
  const verse = poem.querySelector('.poem-verse');
  const originals = [...verse.querySelectorAll('.poem-col > p')];
  const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI'];
  const fragment = document.createDocumentFragment();
  originals.forEach((stanza, index) => {
    const pieces = stanza.innerHTML.split(/<br\s*\/?\s*>/i);
    stanza.replaceChildren();
    stanza.className = 'poem-stanza';
    const note = document.createElement('span');
    note.className = 'poem-stanza-note';
    note.setAttribute('aria-hidden', 'true');
    note.innerHTML = `<span>${numerals[index]}</span><em>Reading here</em>`;
    stanza.append(note);
    pieces.forEach(piece => {
      const line = document.createElement('span');
      line.className = 'poem-line';
      line.innerHTML = piece.trim();
      stanza.append(line);
    });
    fragment.append(stanza);
  });
  verse.replaceChildren(fragment);

  const reader = document.createElement('div');
  reader.className = 'poem-reader';
  reader.setAttribute('aria-hidden', 'true');
  reader.innerHTML = '<div class="poem-reader-dial"><svg viewBox="0 0 62 62"><circle class="poem-reader-track" cx="31" cy="31" r="28"/><circle class="poem-reader-arc" cx="31" cy="31" r="28"/></svg><span class="poem-reader-needle"></span></div><div class="poem-reader-copy"><em>Stay with the light.</em><span class="poem-reader-count">Stanza I / VI</span></div>';
  poem.querySelector('.poem-head').append(reader);

  const stanzas = [...verse.querySelectorAll('.poem-stanza')];
  const count = reader.querySelector('.poem-reader-count');
  const setCurrent = index => {
    stanzas.forEach((stanza, i) => stanza.classList.toggle('is-reading', i === index));
    count.textContent = `Stanza ${numerals[index]} / VI`;
  };
  setCurrent(0);
  if (!window.gsap || !window.ScrollTrigger) return;
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    stanzas.forEach((stanza, index) => {
      ScrollTrigger.create({
        trigger: stanza,
        start: 'top 65%',
        end: 'bottom 35%',
        onEnter: () => setCurrent(index),
        onEnterBack: () => setCurrent(index)
      });
      gsap.fromTo(stanza, { y: 16 }, {
        y: -8,
        ease: 'none',
        scrollTrigger: {
          trigger: stanza,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
          invalidateOnRefresh: true
        }
      });
      gsap.fromTo(stanza.querySelectorAll('.refrain'), { '--poem-mark': 0 }, {
        '--poem-mark': 1,
        ease: 'none',
        scrollTrigger: {
          trigger: stanza,
          start: 'top 75%',
          end: 'bottom 45%',
          scrub: 0.6,
          invalidateOnRefresh: true
        }
      });
    });
    const dial = gsap.timeline({
      scrollTrigger: {
        trigger: verse,
        start: 'top 65%',
        end: 'bottom 45%',
        scrub: 0.8,
        invalidateOnRefresh: true
      }
    });
    dial.to(reader.querySelector('.poem-reader-needle'), { rotation: 140, ease: 'none' }, 0)
      .to(reader.querySelector('.poem-reader-arc'), { strokeDashoffset: 0, ease: 'none' }, 0);
  });
  scheduleRefresh();
})();
