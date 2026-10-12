/* Three photographs and four collection pieces compose one visitor exhibition. */
(function () {
  "use strict";
  const root = document.getElementById("curate");
  if (!root) return;
  const $ = (id) => document.getElementById(id);
  const PHOTOS = ["photo", "photo2", "photo3"];
  const TYPES = [...PHOTOS, "book", "film", "series", "music"];
  const LABELS = { photo: "Photo 1", photo2: "Photo 2", photo3: "Photo 3", book: "Book", film: "Film", series: "Series", music: "Song" };
  const INVITES = { photo: "Choose a photograph", photo2: "Choose a photograph", photo3: "Choose a photograph", book: "Choose a book", film: "Choose a film", series: "Choose a series", music: "Choose a song" };
  const KEY = "night:creation-desk:v1";
  const paper = "#ffffff", ink = "#1c3154", muted = "#4b5d7a";
  const canvas = $("curator-poster"), ctx = canvas.getContext("2d");
  if (!ctx) return;
  const slots = $("curator-slots"), picker = $("curator-picker");
  const enlargeButton = $("curator-enlarge");
  const viewer = document.createElement('dialog');
  viewer.className = 'curator-poster-viewer'; viewer.id = 'curator-poster-viewer';
  viewer.setAttribute('aria-labelledby', 'curator-poster-viewer-title'); viewer.setAttribute('data-lenis-prevent', '');
  viewer.innerHTML = '<div class="curator-poster-viewer-head"><h2 id="curator-poster-viewer-title">Poster preview</h2><button type="button" class="curator-poster-close" aria-label="Close poster preview"><svg class="gallery-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button></div><canvas width="1200" height="1800" role="img"></canvas>';
  document.body.append(viewer);
  const enlargedCanvas = viewer.querySelector('canvas');
  function syncViewer() {
    if (!viewer.open) return;
    enlargedCanvas.getContext('2d').drawImage(canvas, 0, 0);
    enlargedCanvas.setAttribute('aria-label', canvas.getAttribute('aria-label'));
  }
  enlargeButton.addEventListener('click', () => { viewer.showModal(); viewer.scrollTop = 0; syncViewer(); syncOverlays(); viewer.querySelector('button').focus(); });
  viewer.querySelector('button').addEventListener('click', () => viewer.close());
  viewer.addEventListener('cancel', event => { event.preventDefault(); viewer.close(); });
  viewer.addEventListener('close', () => { syncOverlays(); enlargeButton.focus({ preventScroll: true }); });
  viewer.addEventListener('click', event => {
    const box = viewer.getBoundingClientRect();
    if (event.target === viewer && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) viewer.close();
  });
  const nameInput = $("curator-name"), byInput = $("curator-by"), noteInput = $("curator-note");
  const exportButton = $("curator-export"), resetButton = $("curator-reset");
  const images = new Map();
  const catalog = {
    photo: Array.from(document.querySelectorAll(".photo-frame")).map((frame) => {
      const img = frame.querySelector("img");
      return { id: frame.dataset.photoIndex, type: "photo", title: frame.querySelector(".photo-frame-text").textContent.trim(),
        meta: frame.querySelector(".photo-frame-text").textContent.trim(), alt: img.alt,
        src: img.dataset.full || img.getAttribute("src"), thumb: img.dataset.rail || img.getAttribute("src"), tag: frame.dataset.act };
    }),
    book: (window.BOOK_SHELF || []).map((b) => ({ ...b, type: "book", meta: b.author, src: "" })),
    film: (window.FILM_DATA || []).map((f) => ({ ...f, type: "film", meta: f.director + " / " + f.year, src: f.poster })),
    series: (window.SERIES_DATA || []).map((s) => ({ ...s, type: "series", meta: s.years + " / " + s.seasons, src: s.poster })),
    music: (window.MUSIC_DATA || []).flatMap((g) => g.tracks.map((t) => ({ ...t, type: "music", meta: t.artist, tag: g.en,
      src: window.MUSIC_COVERS[t.id] ? "album-covers/" + window.MUSIC_COVERS[t.id] : "",
      thumb: window.MUSIC_COVERS[t.id] ? "album-covers/thumbs/" + window.MUSIC_COVERS[t.id].replace(/\.[^.]+$/, ".webp") : "" })))
  };
  catalog.photo2 = catalog.photo; catalog.photo3 = catalog.photo;
  const searchIndex = new Map();
  TYPES.forEach((type) => catalog[type].forEach((item) => {
    searchIndex.set(item, [item.title, item.meta, item.alt, item.tag, item.spine].filter(Boolean).join(" ").toLocaleLowerCase());
  }));
  // Store only IDs and visitor text. Collection metadata stays in the original sources.
  const blank = () => ({ order: TYPES.slice(), picks: {}, name: "", by: "", note: "", layout: "gallery" });
  let state = blank(), undo = null, exporting = false, saveTimer = 0;
  let pickerType = "photo", pickerLimit = 40, pickerReturn = null;
  let renderTicket = 0, previewTimer = 0, drag = null;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let slotsReady = false, lastComplete = false, revealPending = false, previewMotion = null, suppressClickUntil = 0;
  const itemFor = (type) => catalog[type].find((item) => String(item.id) === String(state.picks[type]));
  const selected = () => state.order.map((type) => itemFor(type));
  const complete = () => TYPES.every((type) => itemFor(type));
  const text = (value, max) => typeof value === "string" ? value.slice(0, max) : "";
  const photoIds = () => PHOTOS.map(type => state.picks[type]).filter(id => id != null);
  let photoState = '';
  const notifyPhotos = () => {
    const next = JSON.stringify([photoIds(), exporting]);
    if (next === photoState) return;
    photoState = next;
    window.dispatchEvent(new Event("night:creation-change"));
  };
  function restore() {
    try {
      let stored = JSON.parse(localStorage.getItem(KEY));
      if (!stored) {
        const exhibition = JSON.parse(localStorage.getItem('night:curator-desk:v1'));
        const story = JSON.parse(localStorage.getItem('night:wandering-room:v1'));
        if (exhibition || story) {
          const photos = [...new Set([...(Array.isArray(story?.kept) ? story.kept.map(String) : []), exhibition?.picks?.photo].filter(id => catalog.photo.some(item => String(item.id) === String(id))))].slice(0, 3);
          stored = { ...exhibition, order: TYPES.slice(), picks: { ...exhibition?.picks }, name: exhibition?.name || story?.title || '' };
          PHOTOS.forEach((type, index) => { delete stored.picks[type]; if (photos[index] != null) stored.picks[type] = photos[index]; });
        }
      }
      if (!stored || typeof stored !== "object") return;
      if (Array.isArray(stored.order) && stored.order.length === TYPES.length && new Set(stored.order).size === TYPES.length && stored.order.every((t) => TYPES.includes(t))) state.order = stored.order;
      TYPES.forEach((type) => {
        const id = stored.picks && stored.picks[type];
        if (catalog[type].some((item) => String(item.id) === String(id)) && (!PHOTOS.includes(type) || !photoIds().includes(String(id)))) state.picks[type] = String(id);
      });
      state.name = text(stored.name, 48); state.by = text(stored.by, 32); state.note = text(stored.note, 120);
      if (["gallery", "contact", "night"].includes(stored.layout)) state.layout = stored.layout;
    } catch (_) { $("curator-storage").textContent = "Your draft could not be restored. You can still curate and save a poster."; }
  }
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(KEY, JSON.stringify(state)); }
      catch (_) { $("curator-storage").textContent = "Your draft could not be saved. Save your poster before leaving."; }
    }, 180);
  }
  function el(tag, cls, value) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (value != null) node.textContent = value;
    return node;
  }
  function button(cls, value, label) {
    const b = el("button", cls, value); b.type = "button";
    if (label) b.setAttribute("aria-label", label);
    return b;
  }
  function art(item, thumbnail) {
    const box = el("div", "curator-art" + (item && item.type === "photo" ? " is-photo" : ""));
    if (!item) { box.append(el("span", "curator-empty", "+")); return box; }
    if (item.type === "book") {
      const book = el("div", "curator-book"); book.style.background = item.cloth; book.style.color = item.ink;
      book.append(el("small", "", "N1GHT LIBRARY"), el("strong", "", item.title), el("small", "", item.author)); box.append(book);
    } else if (item.src) {
      const img = el("img"); img.src = thumbnail ? item.thumb || item.src : item.src; img.alt = "";
      img.loading = "lazy"; img.decoding = "async";
      img.addEventListener("error", () => {
        // A missing derived thumbnail gets one attempt at the original artwork.
        if (img.dataset.fallback !== "1") { img.dataset.fallback = "1"; img.src = item.src; }
        else { img.replaceWith(el("span", "curator-empty", item.type === "music" ? "♪" : "—")); }
      });
      box.append(img);
    } else box.append(el("span", "curator-empty", "♪"));
    return box;
  }
  function announce(message) { $("curator-status").textContent = message; }
  function renderSlots(focusType, action) {
    if (drag) finishDrag(false);
    const scrollLeft = slots.scrollLeft;
    const cards = new Map(Array.from(slots.children).map((card) => [card.dataset.type, card]));
    const before = new Map(Array.from(cards, ([type, card]) => [type, card.getBoundingClientRect()]));
    if (window.gsap) cards.forEach((card) => {
      gsap.killTweensOf(card);
      gsap.set(card, { clearProps: 'transform,willChange' });
    });
    const changed = [];
    state.order.forEach((type, index) => {
      const item = itemFor(type);
      let card = cards.get(type);
      if (!card) {
        card = el("li", "curator-slot"); card.dataset.type = type;
        const handle = button("curator-handle", "", "Move " + LABELS[type] + "; use the left and right arrow keys to rearrange");
        handle.dataset.action = "handle"; handle.append(el("span", "", String(index + 1).padStart(2, "0") + " / " + LABELS[type]), el("span", "", "⠿"));
        const pick = button("curator-pick", "", item ? "Change " + LABELS[type] + ": " + item.title : INVITES[type]); pick.dataset.action = "pick";
        pick.append(art(item, true), el("span", "curator-piece-title", item ? item.title : INVITES[type]));
        if (item) pick.title = item.title + " · " + item.meta;
        const tools = el("div", "curator-slot-tools");
        [["left", "←", "Move " + LABELS[type] + " earlier"], ["remove", "×", "Remove " + LABELS[type]], ["right", "→", "Move " + LABELS[type] + " later"]].forEach(([act, value, label]) => {
          const b = button("", value, label); b.dataset.action = act;
          b.disabled = act === "left" ? index === 0 : act === "right" ? index === TYPES.length - 1 : !item;
          tools.append(b);
        });
        card.append(handle, pick, tools);
      } else {
        card.querySelector('.curator-handle span').textContent = String(index + 1).padStart(2, '0') + ' / ' + LABELS[type];
        const pick = card.querySelector('.curator-pick');
        if (card.dataset.pickId !== String(item?.id ?? '')) {
          if (window.gsap) gsap.killTweensOf(pick.children);
          pick.replaceChildren(art(item, true), el('span', 'curator-piece-title', item ? item.title : INVITES[type]));
          changed.push(pick.querySelector('.curator-art'));
        }
        pick.setAttribute('aria-label', item ? 'Change ' + LABELS[type] + ': ' + item.title : INVITES[type]);
        if (item) pick.title = item.title + ' · ' + item.meta;
        else pick.removeAttribute('title');
        card.querySelector('[data-action="left"]').disabled = index === 0;
        card.querySelector('[data-action="right"]').disabled = index === TYPES.length - 1;
        card.querySelector('[data-action="remove"]').disabled = !item;
      }
      card.dataset.pickId = String(item?.id ?? '');
      slots.append(card);
    });
    slots.scrollLeft = scrollLeft;
    // Reuse the same cards, so focus and decoded artwork survive rearrangement.
    if (slotsReady && !reduced.matches && window.gsap) {
      const after = Array.from(slots.children).map((card, i) => ({ card, box: card.getBoundingClientRect(), old: before.get(card.dataset.type), baseY: 0 }));
      after.forEach(({ card, box, old, baseY }) => {
        if (!old || (Math.abs(old.left - box.left) < .5 && Math.abs(old.top - box.top) < .5)) return;
        gsap.fromTo(card, { x: old.left - box.left, y: baseY + old.top - box.top, scale: card.dataset.type === focusType ? 1.025 : 1 },
          { x: 0, y: baseY, scale: 1, rotation: 0, duration: .48, ease: 'power3.out', clearProps: 'transform,willChange' });
      });
      if (changed.length) gsap.fromTo(changed, { y: 12, scale: .95, opacity: .6 }, { y: 0, scale: 1, opacity: 1, duration: .48, stagger: .045, ease: 'power3.out', clearProps: 'transform,opacity' });
    }
    const count = TYPES.filter((type) => itemFor(type)).length;
    $("curator-count").textContent = "Selected " + count + " / 7";
    exportButton.disabled = !complete() || exporting;
    if (slotsReady && complete() && !lastComplete) revealPending = true;
    if (!complete()) revealPending = false;
    lastComplete = !!complete();
    slotsReady = true;
    $("curator-surprise").textContent = "Shuffle all seven";
    if (focusType) {
      const target = slots.querySelector('[data-type="' + focusType + '"] [data-action="' + (action || "pick") + '"]');
      if (target && !target.disabled) target.focus({ preventScroll: true });
      else slots.querySelector('[data-type="' + focusType + '"] [data-action="handle"]')?.focus({ preventScroll: true });
    }
    schedulePreview();
    save(); notifyPhotos();
  }
  function select(type, item) {
    if (exporting) { announce("Your poster is being saved. You can change pieces when it is ready."); return false; }
    if (PHOTOS.includes(type) && PHOTOS.some(slot => slot !== type && String(state.picks[slot]) === String(item.id))) {
      announce('This photograph is already selected. Choose another frame.'); return false;
    }
    state.picks[type] = String(item.id); undo = null; resetButton.textContent = "Start again";
    renderSlots(); announce("Added “" + item.title + "”. " + (complete() ? "All seven are here." : "Keep choosing your pieces."));
    return true;
  }
  function move(type, target, action) {
    const from = state.order.indexOf(type);
    if (from === target || target < 0 || target >= TYPES.length) return;
    state.order.splice(from, 1); state.order.splice(target, 0, type);
    renderSlots(type, action || "handle"); announce(LABELS[type] + " moved to position " + (target + 1) + ". Your poster follows the new order.");
  }
  slots.addEventListener("click", (event) => {
    if (Date.now() < suppressClickUntil) return;
    const b = event.target.closest("button"), card = event.target.closest(".curator-slot");
    if (!b || !card) return;
    const type = card.dataset.type, index = state.order.indexOf(type), act = b.dataset.action;
    if (act === "pick") openPicker(type, b);
    else if (act === "left" || act === "right") move(type, index + (act === "left" ? -1 : 1), act);
    else if (act === "remove") { delete state.picks[type]; renderSlots(type); announce(LABELS[type] + " removed. Choose another piece."); }
  });
  slots.addEventListener("keydown", (event) => {
    if (event.target.dataset.action !== "handle" || !["ArrowLeft", "ArrowRight", "Escape"].includes(event.key)) return;
    event.preventDefault();
    if (event.key === "Escape") { finishDrag(false); return; }
    const type = event.target.closest(".curator-slot").dataset.type;
    move(type, state.order.indexOf(type) + (event.key === "ArrowLeft" ? -1 : 1));
  });
  slots.addEventListener("pointerdown", (event) => {
    const handle = event.target.closest(".curator-handle");
    if (!handle || event.button !== 0 || event.isPrimary === false || exporting || drag) return;
    const cards = Array.from(slots.children);
    if (window.gsap) cards.forEach((card) => { gsap.killTweensOf(card); gsap.set(card, { clearProps: 'transform,willChange' }); });
    drag = { type: handle.closest('.curator-slot').dataset.type, target: null, x: event.clientX, y: event.clientY, active: false, id: event.pointerId,
      scrollLeft: slots.scrollLeft, cards, boxes: cards.map((card) => card.getBoundingClientRect()) };
    slots.setPointerCapture(event.pointerId);
  });
  let dragFrame = 0, dragPoint = null;
  slots.addEventListener("pointermove", (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    dragPoint = { clientX: event.clientX, clientY: event.clientY };
    if (!dragFrame) dragFrame = requestAnimationFrame(paintDrag);
  });
  function paintDrag() {
    dragFrame = 0;
    const event = dragPoint;
    dragPoint = null;
    if (!drag || !event) return;
    if (!drag.active && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 6) return;
    drag.active = true;
    const bounds = slots.getBoundingClientRect();
    if (slots.scrollWidth > slots.clientWidth) {
      if (event.clientX < bounds.left + 28) slots.scrollLeft -= 12;
      else if (event.clientX > bounds.right - 28) slots.scrollLeft += 12;
    }
    const shift = slots.scrollLeft - drag.scrollLeft;
    const inDesk = event.clientY >= bounds.top - 35 && event.clientY <= bounds.bottom + 35 && event.clientX >= bounds.left - 35 && event.clientX <= bounds.right + 35;
    let targetIndex = state.order.indexOf(drag.type), distance = Infinity;
    drag.boxes.forEach((box, index) => {
      const gap = Math.hypot(event.clientX - (box.left + box.width / 2 - shift), event.clientY - (box.top + box.height / 2));
      if (gap < distance) { distance = gap; targetIndex = index; }
    });
    const target = inDesk ? state.order[targetIndex] : null;
    const targetChanged = target !== drag.target;
    drag.target = target;
    const projected = state.order.filter((type) => type !== drag.type);
    projected.splice(inDesk ? targetIndex : state.order.indexOf(drag.type), 0, drag.type);
    drag.cards.forEach((card, index) => {
      card.classList.toggle("is-dragging", card.dataset.type === drag.type);
      card.classList.toggle("is-drop", card.dataset.type === drag.target && drag.target !== drag.type);
      if (reduced.matches || !window.gsap) return;
      if (card.dataset.type === drag.type) {
        gsap.set(card, { x: event.clientX - drag.x + shift, y: event.clientY - drag.y - 10, rotation: Math.max(-3, Math.min(3, (event.clientX - drag.x) / 70)), scale: 1.035, willChange: 'transform' });
      } else if (targetChanged) {
        const destination = projected.indexOf(card.dataset.type);
        gsap.to(card, { x: drag.boxes[destination].left - drag.boxes[index].left, y: drag.boxes[destination].top - drag.boxes[index].top, duration: .2, ease: 'power2.out', overwrite: true });
      }
    });
  }
  function finishDrag(commit) {
    if (!drag) return;
    if (dragFrame) cancelAnimationFrame(dragFrame);
    dragFrame = 0;
    // Commit the latest pointer position even when release precedes the frame.
    if (commit && dragPoint) paintDrag();
    dragPoint = null;
    const current = drag; drag = null;
    if (slots.hasPointerCapture(current.id)) slots.releasePointerCapture(current.id);
    slots.querySelectorAll(".curator-slot").forEach((card) => card.classList.remove("is-dragging", "is-drop"));
    if (current.active) suppressClickUntil = Date.now() + 300;
    if (commit && current.active && current.target && current.target !== current.type) move(current.type, state.order.indexOf(current.target));
    else if (window.gsap) current.cards.forEach((card) => {
      gsap.to(card, { x: 0, y: 0, scale: 1, rotation: 0, duration: reduced.matches ? 0 : .36, ease: 'power3.out', overwrite: true, clearProps: 'transform,willChange' });
    });
  }
  slots.addEventListener("pointerup", (event) => { if (drag?.id === event.pointerId) finishDrag(true); });
  slots.addEventListener("pointercancel", (event) => { if (drag?.id === event.pointerId) finishDrag(false); });
  slots.addEventListener("lostpointercapture", (event) => { if (drag?.id === event.pointerId) finishDrag(false); });
  window.addEventListener('blur', () => finishDrag(false));
  document.addEventListener('visibilitychange', () => { if (document.hidden) finishDrag(false); });
  window.addEventListener('resize', () => finishDrag(false));
  reduced.addEventListener('change', () => {
    finishDrag(false);
    if (previewMotion) previewMotion.kill();
    previewMotion = null;
    if (window.gsap) {
      const targets = [canvas, ...slots.children, ...slots.querySelectorAll('.curator-art')];
      gsap.killTweensOf(targets);
      gsap.set(targets, { clearProps: 'transform,opacity,clipPath,willChange' });
    }
  });

  function renderPicker(append) {
    const query = $("curator-search").value.trim().toLocaleLowerCase();
    const list = catalog[pickerType].filter((item) => searchIndex.get(item).includes(query));
    const results = $("curator-results");
    if (!append) results.replaceChildren();
    const fragment = document.createDocumentFragment();
    list.slice(results.children.length, pickerLimit).forEach((item) => {
      const b = button("curator-result", "", "Choose “" + item.title + "”, " + item.meta);
      b.disabled = PHOTOS.includes(pickerType) && PHOTOS.some(slot => slot !== pickerType && String(state.picks[slot]) === String(item.id));
      if (b.disabled) b.title = "Already selected in another photo slot";
      b.dataset.id = item.id; b.setAttribute("aria-pressed", String(String(state.picks[pickerType]) === String(item.id)));
      b.append(art(item, true), el("p", "curator-result-title", item.title));
      if (item.meta !== item.title) b.append(el("p", "curator-result-meta", item.meta));
      if (item.type === "photo") b.append(el("p", "curator-result-meta", item.alt));
      fragment.append(b);
    });
    results.append(fragment);
    $("curator-results-count").textContent = list.length ? Math.min(pickerLimit, list.length) + " / " + list.length + " pieces" : "No matches. Try another keyword.";
    $("curator-more").hidden = pickerLimit >= list.length;
  }
  function openPicker(type, trigger) {
    pickerType = type; pickerLimit = 40; pickerReturn = trigger;
    $("curator-picker-title").textContent = INVITES[type]; $("curator-search").value = "";
    renderPicker(); picker.showModal(); picker.scrollTop = 0;
    syncOverlays();
    $("curator-search").focus();
  }
  $("curator-search").addEventListener("input", () => { pickerLimit = 40; renderPicker(); picker.scrollTop = 0; });
  $("curator-results").addEventListener("click", (event) => {
    const b = event.target.closest(".curator-result"); if (!b) return;
    const item = catalog[pickerType].find((i) => String(i.id) === b.dataset.id);
    if (item && select(pickerType, item)) picker.close();
  });
  $("curator-more").addEventListener("click", () => {
    const previous = pickerLimit; pickerLimit += 40; renderPicker(true);
    $("curator-results").children[previous]?.focus({ preventScroll: true });
  });
  $("curator-picker-close").addEventListener("click", () => picker.close());
  picker.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    event.preventDefault(); event.stopPropagation(); picker.close();
  });
  picker.addEventListener("click", (event) => {
    const rect = picker.getBoundingClientRect();
    if (event.target === picker && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) picker.close();
  });
  picker.addEventListener("close", () => {
    syncOverlays();
    const target = pickerReturn?.isConnected ? pickerReturn : slots.querySelector('[data-type="' + pickerType + '"] [data-action="pick"]');
    target?.focus({ preventScroll: true });
  });
  [[nameInput, "name"], [byInput, "by"], [noteInput, "note"]].forEach(([input, key]) => input.addEventListener("input", () => {
    state[key] = input.value; schedulePreview(); save();
  }));
  root.querySelectorAll('[name="curator-layout"]').forEach((radio) => radio.addEventListener("change", () => {
    state.layout = radio.value; schedulePreview(); save();
  }));
  $("curator-surprise").addEventListener("click", () => {
    const bag = catalog.photo.slice();
    PHOTOS.forEach(type => { const index = Math.floor(Math.random() * bag.length); state.picks[type] = String(bag.splice(index, 1)[0].id); });
    TYPES.filter(type => !PHOTOS.includes(type)).forEach((type) => { const pool = catalog[type]; if (pool.length) state.picks[type] = String(pool[Math.floor(Math.random() * pool.length)].id); });
    undo = null; resetButton.textContent = "Start again"; renderSlots(); announce("Seven pieces selected.");
  });
  function syncFields() {
    nameInput.value = state.name; byInput.value = state.by; noteInput.value = state.note;
    root.querySelector('[name="curator-layout"][value="' + state.layout + '"]').checked = true;
  }
  resetButton.addEventListener("click", () => {
    if (undo) { state = undo; undo = null; resetButton.textContent = "Start again"; announce("Your previous exhibition is back."); }
    else { undo = JSON.parse(JSON.stringify(state)); state = blank(); resetButton.textContent = "Undo reset"; announce("Desk cleared. Undo is available."); }
    syncFields(); renderSlots();
  });

  // One cached decode per selected artwork, never load the full catalog into canvas.
  function loadImage(item) {
    if (!item?.src) return Promise.resolve(null);
    if (!images.has(item.src)) {
      const pending = new Promise((resolve) => {
        const img = new Image(); let finished = false;
        const finish = (value) => {
          if (finished) return;
          finished = true; clearTimeout(timer);
          img.onload = img.onerror = null;
          resolve(value);
        };
        const timer = setTimeout(() => finish(null), 10000);
        img.onload = () => finish(img); img.onerror = () => finish(null); img.src = item.src;
      });
      images.set(item.src, pending);
      // Failed previews must not poison a later export after the network recovers.
      pending.then((value) => {
        if (!value && images.get(item.src) === pending) images.delete(item.src);
      });
    }
    if (images.size > 15) {
      const keep = new Set(selected().map((entry) => entry?.src));
      for (const source of images.keys()) { if (images.size <= 15) break; if (!keep.has(source)) images.delete(source); }
    }
    return images.get(item.src);
  }
  function schedulePreview() {
    if (exporting) return;
    ++renderTicket;
    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => drawPreview(), 100);
  }
  const font = (size, serif) => size + 'px ' + (serif ? '"Calistoga", Georgia, "Songti SC", serif' : '"Space Grotesk", "Microsoft YaHei", sans-serif');
  function linesFor(value, width, size, serif) {
    ctx.font = font(size, serif);
    const lines = []; let line = "";
    // Keep Latin words together, while allowing CJK text to wrap between characters.
    const tokens = value.replace(/\s+/g, " ").trim().match(/[ \t]+|[A-Za-z0-9\u00c0-\u024f]+(?:['’][A-Za-z0-9]+)*|./gu) || [];
    for (const token of tokens) {
      if (token === "\n") { lines.push(line); line = ""; continue; }
      const parts = ctx.measureText(token).width > width ? Array.from(token) : [token];
      for (const part of parts) {
        if (line && ctx.measureText(line + part).width > width) { lines.push(line.trimEnd()); line = part.trimStart(); }
        else line += part;
      }
    }
    if (line) lines.push(line);
    return lines;
  }
  function write(value, x, y, width, size, maxLines, color, serif, minSize) {
    let lines = linesFor(value, width, size, serif);
    while (lines.length > maxLines && size > (minSize || 14)) { size -= 1; lines = linesFor(value, width, size, serif); }
    ctx.fillStyle = color; ctx.font = font(size, serif); ctx.textBaseline = "top";
    lines.forEach((line, i) => ctx.fillText(line, x, y + i * size * 1.35));
    return lines.length * size * 1.35;
  }
  function rect(x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); }
  function line(x, y, w, color) { rect(x, y, w, 1, color); }
  function drawBook(item, x, y, w, h) {
    const bw = Math.min(w * .86, h * .64), bx = x + (w - bw) / 2, bh = Math.min(h * .94, bw * 1.5), by = y + (h - bh) / 2;
    rect(bx, by, bw, bh, item.cloth); rect(bx, by, Math.max(5, bw * .035), bh, "rgba(0,0,0,.13)");
    line(bx + bw * .14, by + bh * .17, bw * .72, item.band);
    write(item.title, bx + bw * .12, by + bh * .29, bw * .76, Math.min(48, bw * .13), 4, item.ink, true);
    write(item.author, bx + bw * .12, by + bh * .78, bw * .76, Math.min(24, bw * .07), 2, item.ink);
  }
  function drawArt(item, img, x, y, w, h, dark) {
    if (item?.type === "book") { drawBook(item, x, y, w, h); return; }
    if (img) {
      const ratio = Math.min(w / img.naturalWidth, h / img.naturalHeight);
      const dw = img.naturalWidth * ratio, dh = img.naturalHeight * ratio;
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh); ctx.restore();
      return;
    }
    ctx.save();
    ctx.strokeStyle = dark ? '#7e94bc' : '#c5cddd'; ctx.lineWidth = 1.5;
    ctx.setLineDash([7, 7]); ctx.strokeRect(x + 1, y + 1, w - 2, h - 2); ctx.setLineDash([]);
    if (item) write('Artwork unavailable', x + 16, y + h / 2 - 10, w - 32, 20, 2, dark ? paper : muted);
    else {
      const cx = x + w / 2, cy = y + h / 2;
      ctx.beginPath(); ctx.moveTo(cx - 10, cy); ctx.lineTo(cx + 10, cy); ctx.moveTo(cx, cy - 10); ctx.lineTo(cx, cy + 10); ctx.stroke();
    }
    ctx.restore();
  }
  function caption(item, type, index, x, y, width, dark, showMeta) {
    const color = dark ? paper : ink, secondary = dark ? '#b9c9e8' : muted;
    write(String(index + 1).padStart(2, '0'), x, y + 3, 30, 18, 1, secondary);
    const used = write(item?.title || LABELS[type], x + 36, y, width - 36, 26, 2, color, false, 14);
    if (showMeta && item?.meta && item.meta !== item.title) write(item.meta, x + 36, y + used + 8, width - 36, 18, 2, secondary, false, 12);
  }
  async function drawPreview(snapshot) {
    const ticket = ++renderTicket, draft = snapshot || JSON.parse(JSON.stringify(state));
    const items = draft.order.map((type) => catalog[type].find((item) => String(item.id) === String(draft.picks[type])));
    const artImages = await Promise.all(items.map(loadImage));
    if (ticket !== renderTicket) return null;
    const dark = draft.layout === "night", color = dark ? paper : ink, secondary = dark ? "#dbe5ff" : muted;
    rect(0, 0, 1200, 1800, dark ? "#102348" : paper);
    const titleHeight = write(draft.name.trim() || 'Your exhibition', 72, 74, 1056, 84, 2, color, true, 42);
    const noteY = 74 + titleHeight + 20;
    const noteHeight = draft.note.trim() ? write(draft.note.trim(), 72, noteY, 1056, 25, 4, secondary, false, 20) : 0;
    const top = noteY + noteHeight + (noteHeight ? 36 : 20);
    if (draft.layout === 'contact') {
      const band = (1630 - top) / TYPES.length;
      items.forEach((item, i) => {
        const y = top + i * band;
        drawArt(item, artImages[i], 72, y, 222, band - 20, false);
        caption(item, draft.order[i], i, 330, y + 10, 798, false, true);
        if (i < TYPES.length - 1) line(330, y + band - 10, 798, '#d4dceb');
      });
    } else {
      // One leading work, a pair of companions, and four collected pieces share a single sheet.
      const available = 1620 - top - 314;
      const leadHeight = available * .50, pairHeight = available * .24, collectionHeight = available * .26;
      drawArt(items[0], artImages[0], 72, top, 1056, leadHeight, dark);
      caption(items[0], draft.order[0], 0, 72, top + leadHeight + 12, 1056, dark, false);
      const pairY = top + leadHeight + 88;
      items.slice(1, 3).forEach((item, j) => {
        const x = 72 + j * 540;
        drawArt(item, artImages[j + 1], x, pairY, 516, pairHeight, dark);
        caption(item, draft.order[j + 1], j + 1, x, pairY + pairHeight + 12, 516, dark, false);
      });
      const collectionY = pairY + pairHeight + 96;
      line(72, collectionY - 18, 1056, dark ? '#617ca9' : '#d4dceb');
      items.slice(3).forEach((item, j) => {
        const x = 72 + j * 270;
        drawArt(item, artImages[j + 3], x, collectionY, 246, collectionHeight, dark);
        caption(item, draft.order[j + 3], j + 3, x, collectionY + collectionHeight + 16, 246, dark, true);
      });
    }
    line(72, 1704, 1056, dark ? '#617ca9' : '#d4dceb');
    write('N1GHT CHXN9', 72, 1727, 480, 22, 1, color);
    if (draft.by.trim()) {
      const signature = 'Curated by ' + draft.by.trim();
      ctx.textAlign = 'right'; write(signature, 1128, 1727, 520, 21, 2, secondary); ctx.textAlign = 'left';
    }
    canvas.setAttribute("aria-label", (draft.name.trim() || "Untitled exhibition") + ", " + ({ gallery: "Gallery", contact: "Contact sheet", night: "After dark" })[draft.layout] + " layout. " + items.map((item, i) => LABELS[draft.order[i]] + ": " + (item?.title || "Not selected")).join("; "));
    $("curator-preview-caption").textContent = "";
    syncViewer();
    if (!snapshot && revealPending) {
      revealPending = false;
      if (!reduced.matches && window.gsap) {
        if (previewMotion) previewMotion.kill();
        previewMotion = gsap.fromTo(canvas, { clipPath: 'inset(0 0 100% 0)', y: 12 }, { clipPath: 'inset(0 0 0% 0)', y: 0, duration: .85, ease: 'power3.inOut', clearProps: 'clipPath,transform', onComplete: () => { previewMotion = null; } });
      }
    }
    return { draft, missing: items.filter((item, i) => item?.src && !artImages[i]).length };
  }
  exportButton.addEventListener("click", async () => {
    if (!complete() || exporting) return;
    finishDrag(false);
    exporting = true; notifyPhotos(); exportButton.disabled = true; exportButton.textContent = "Making your poster…";
    // Freeze this export's composition while allowing the saved browser draft to remain intact.
    const snapshot = JSON.parse(JSON.stringify(state));
    root.querySelectorAll("button, input, textarea").forEach((node) => { if (node !== exportButton) node.dataset.wasDisabled = String(node.disabled); node.disabled = true; });
    clearTimeout(previewTimer);
    try {
      await document.fonts.ready;
      const result = await drawPreview(snapshot);
      if (!result) throw new Error("The preview changed. Please save it again.");
      if (result.missing) { images.clear(); throw new Error("Some artwork could not load. Try again or choose another piece before saving."); }
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("The browser could not create the image. Please try again.");
      const url = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = url; a.download = (snapshot.name.trim() || "My exhibition").replace(/[<>:"/\\|?*\x00-\x1f]/g, "_").slice(0, 48) + ".png";
      document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
      announce("Your poster is ready and the download has started. Try another layout for a different edition.");
    } catch (error) { announce(error.message || "The poster could not be made. Please try again."); }
    finally {
      exporting = false; notifyPhotos();
      root.querySelectorAll("[data-was-disabled]").forEach((node) => { node.disabled = node.dataset.wasDisabled === "true"; delete node.dataset.wasDisabled; });
      exportButton.disabled = !complete(); exportButton.textContent = "Save PNG ↓";
    }
  });

  // Optional entry points alongside the original gallery, without altering its selection logic.
  function collector(mount, getItem, label) {
    if (!mount) return null;
    const tray = el("div", "curator-collect-tray"), b = button("curator-collect", "Add to the desk +", label);
    const status = el("span", "curator-collect-status"); status.setAttribute("role", "status");
    const link = el("a", "curator-collect-link", "Visit the desk →"); link.href = "#curate";
    tray.append(b, link, status); mount.append(tray);
    b.addEventListener("click", () => {
      const item = getItem();
      if (!item) { status.textContent = "Select a piece first."; return; }
      if ((item.type === "photo" ? addPhoto(item.id) : select(item.type, item))) status.textContent = "Selected: " + item.title;
    });
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const visitDesk = () => {
        if (typeof lenis !== 'undefined' && lenis) lenis.scrollTo(root, { duration: .8 });
        else root.scrollIntoView({ behavior: 'auto', block: 'start' });
        nameInput.focus({ preventScroll: true });
      };
      if (document.querySelector('#lightbox.is-open') && typeof closeDetail === 'function') closeDetail(visitDesk);
      else visitDesk();
    });
    return tray;
  }
  collector(document.querySelector("#panel-books .book-shelf")?.parentElement, () => {
    const id = document.querySelector('.bs-book[data-picked="true"]')?.dataset.book;
    return catalog.book.find((item) => item.id === id);
  }, "Add the current book to the desk");
  function attachReelCollectors() {
    ["film", "series"].forEach((type) => {
      const mount = document.querySelector("." + type + "-detail-copy");
      if (!mount || mount.querySelector(".curator-collect-tray")) return;
      collector(mount, () => {
        const id = document.querySelector("." + type + "-card.is-active")?.dataset[type + "Id"];
        return catalog[type].find((item) => item.id === id);
      }, "Add the current " + LABELS[type].toLowerCase() + " to the desk");
    });
  }
  attachReelCollectors();
  // main.js initializes the two reels on DOMContentLoaded; attach after that mount exists.
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", attachReelCollectors, { once: true });
  const lbTray = collector(document.getElementById("lb-actions"), () => {
    if (typeof detailType === "undefined" || typeof detailItems === "undefined") return null;
    const data = detailItems[lbIndex];
    if (detailType === "music") return catalog.music.find((item) => String(item.id) === String(data?.id));
    if (detailType === "photo") return catalog.photo.find((item) => item.id === String(lbIndex));
    return null;
  }, "Add the current piece to the desk");
  if (lbTray) {
    const update = () => { lbTray.hidden = typeof detailType === "undefined" || detailType !== "music"; lbTray.querySelector(".curator-collect-status").textContent = ""; };
    const observer = new MutationObserver(update); observer.observe($("lb-count"), { childList: true, characterData: true, subtree: true }); update();
  }
  function addPhoto(id) {
    if (exporting) return false;
    if (photoIds().includes(String(id))) { announce('This photograph is already selected.'); return false; }
    const type = PHOTOS.find(slot => !itemFor(slot));
    const item = catalog.photo.find(entry => String(entry.id) === String(id));
    if (!type || !item) { announce('All three photographs are here. Change a photo at the desk.'); return false; }
    return select(type, item);
  }
  function visit() {
    const scroll = () => {
      if (typeof lenis !== 'undefined' && lenis) lenis.scrollTo(root, { duration: .8 });
      else root.scrollIntoView({ behavior: 'auto', block: 'start' });
      nameInput.focus({ preventScroll: true });
    };
    if (document.querySelector('#lightbox.is-open') && typeof closeDetail === 'function') closeDetail(scroll);
    else scroll();
  }
  window.CuratorDesk = { addPhoto, photoIds, busy: () => exporting, visit };
  restore(); syncFields(); renderSlots();
  $("curator-workspace").hidden = false;
  if (TYPES.some((type) => itemFor(type))) announce("Draft restored.");
  document.fonts.ready.then(() => schedulePreview());
  if (typeof scheduleRefresh === "function") scheduleRefresh(250);
  window.addEventListener("pagehide", () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {} });
})();
