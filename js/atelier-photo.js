/* The wandering room: a spatial album and a three-frame souvenir. */
(function () {
  'use strict';
  const host = document.getElementById('photo-deck');
  if (!host) return;
  const frames = Array.from(host.querySelectorAll('.photo-frame'));
  if (!frames.length) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const groups = { CITY: 'Chase the light', LAND: 'Take the long way', NIGHT: 'Stay out late', WINTER: 'Find the quiet' };
  const category = frame => groups[frame.dataset.act] ? frame.dataset.act : 'LAND';
  const data = frames.map((frame, index) => {
    const image = frame.querySelector('img');
    image.dataset.rail = image.getAttribute('src');
    image.draggable = false;
    frame.querySelector('.photo-frame-cap').classList.remove('sr-only');
    return { index, title: frame.querySelector('.photo-frame-text').textContent.trim(), alt: image.alt,
      thumb: image.getAttribute('src'), src: image.dataset.full || image.getAttribute('src'),
      ratio: Number(image.getAttribute('width')) / Number(image.getAttribute('height')) };
  });
  const KEY = 'night:wandering-room:v1';
  let active = Math.max(0, data.findIndex(item => item.title === 'The last red light'));
  let filter = 'ALL', mode = 'wander', drag = null, suppressUntil = 0;
  let kept = [], storyTitle = '', previewTicket = 0, exporting = false, panMotion = null;
  const thumbnails = new Map();
  let positions = new Map(), worldWidth = 0, worldHeight = 0;
  // Mix near and far, day and night: neighbouring prints suggest unexpected connections.
  const opening = [38, 35, 37, 2, 4, 26, 45, 43, 21, 10, 39, 24, 22, 36].filter(i => data[i]);
  const initialOrder = [...opening, ...frames.map((_, i) => i).filter(i => !opening.includes(i))];
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && Array.isArray(saved.kept)) kept = [...new Set(saved.kept)].filter(i => Number.isInteger(i) && data[i]).slice(0, 3);
    if (typeof saved?.title === 'string') storyTitle = saved.title.slice(0, 48);
  } catch (_) { /* The room works without browser storage. */ }
  host.classList.add('atelier-photo');
  host.dataset.view = mode;
  host.setAttribute('aria-label', 'The wandering room, ' + frames.length + ' photographs');
  host.innerHTML = `
    <div class="photo-room-bar">
      <div class="photo-room-tabs" role="group" aria-label="Photo viewing mode">
        <button type="button" data-view="wander" aria-pressed="true">Wander <span aria-hidden="true">↗</span></button>
        <button type="button" data-view="index" aria-pressed="false">All frames <span class="mono">${frames.length}</span></button>
      </div>
      <button type="button" class="photo-surprise" data-surprise>Somewhere unexpected <span aria-hidden="true">↗</span></button>
    </div>
    <div class="photo-routes" role="group" aria-label="Choose a photographic journey"></div>
    <div class="photo-map-shell">
      <div class="photo-map" tabindex="0" role="region" aria-label="Draggable photo map. Drag to explore, or use the arrow keys to choose a photograph." aria-describedby="photo-map-help" data-lenis-prevent>
        <div class="photo-world"></div>
      </div>
      <div class="photo-map-tools">
        <p id="photo-map-help">Drag to get lost. Click to look closer.</p>
        <button type="button" class="photo-room-map" aria-label="Photo room map. Click a place to travel there; Enter returns to the current frame."><canvas width="240" height="150" aria-hidden="true"></canvas><span>Room map</span></button>
        <button type="button" data-recenter aria-label="Center the current photograph">Back to this frame <span aria-hidden="true">↖</span></button>
      </div>
    </div>
    <div class="photo-navigator">
      <div class="photo-feature__label"><p class="photo-location mono"></p><h3 class="photo-current-title"></h3></div>
      <div class="photo-nav-actions">
        <div class="photo-turns"><button type="button" data-step="-1" aria-label="Previous photograph">←</button><span class="photo-position mono"></span><button type="button" data-step="1" aria-label="Next photograph">→</button></div>
        <button type="button" class="photo-look" data-look>Look closer ↗</button>
        <button type="button" class="photo-keep" data-keep>Keep this frame +</button>
      </div>
    </div>
    <section class="photo-story" aria-labelledby="photo-story-heading">
      <div class="photo-story-copy">
        <p class="photo-story-kicker mono">A souvenir, made by you</p>
        <h3 id="photo-story-heading">Three frames.<br>Your kind of story.</h3>
        <p>A beginning, a detour, an ending. Collect three photographs and take a little piece of the room with you.</p>
        <label class="photo-story-title-label" for="photo-story-title">Give your story a title</label>
        <input id="photo-story-title" maxlength="48" placeholder="Somewhere I would stay" autocomplete="off">
        <ol class="photo-story-picks" aria-label="Your three photographs"></ol>
        <div class="photo-story-actions"><button type="button" data-print disabled>Save my story ↓</button><button type="button" data-deal>Deal me three ↗</button></div>
        <p class="photo-story-status" role="status" aria-live="polite"></p>
      </div>
      <figure class="photo-story-preview"><canvas width="1800" height="1080" role="img" aria-label="Preview of your three-frame story"></canvas><figcaption><span>Your pocket story</span><span class="mono">1800 × 1080 / PNG</span></figcaption></figure>
    </section>
    <p class="sr-only photo-live" role="status" aria-live="polite"></p>`;
  const world = host.querySelector('.photo-world'), map = host.querySelector('.photo-map');
  const routes = host.querySelector('.photo-routes'), live = host.querySelector('.photo-live');
  const keepButton = host.querySelector('[data-keep]'), printButton = host.querySelector('[data-print]');
  const titleInput = host.querySelector('#photo-story-title'), status = host.querySelector('.photo-story-status');
  const preview = host.querySelector('.photo-story canvas'), picks = host.querySelector('.photo-story-picks');
  const roomMap = host.querySelector('.photo-room-map'), mini = roomMap.querySelector('canvas');
  let mapPaintFrame = 0;
  titleInput.value = storyTitle;
  initialOrder.forEach(index => world.append(frames[index]));
  // Native image lazy-loading can retain the pre-reparenting geometry after
  // the spatial map becomes a multi-column index. Load the small contact
  // prints together when the room approaches; originals remain click-only.
  function loadRoomPrints() {
    frames.forEach(frame => { frame.querySelector('img').loading = 'eager'; });
  }
  if ('IntersectionObserver' in window) {
    const roomLoader = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      loadRoomPrints(); roomLoader.disconnect();
    }, { rootMargin: '700px 0px' });
    roomLoader.observe(host);
  } else loadRoomPrints();
  const matching = () => initialOrder.filter(index => filter === 'ALL' || (filter === 'NEW' ? !!frames[index].dataset.new : category(frames[index]) === filter));
  const announce = value => { live.textContent = value; };
  const button = (label, name, cls) => {
    const node = document.createElement('button'); node.type = 'button'; node.textContent = label;
    if (name) node.setAttribute('aria-label', name);
    if (cls) node.className = cls;
    return node;
  };
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ kept, title: storyTitle })); }
    catch (_) { status.textContent = 'Your story cannot be stored in this browser. You can still save the PNG.'; }
  }
  function stopPan() {
    panMotion?.kill(); panMotion = null;
    // Cancel a pending native smooth scroll before a gesture or mode change.
    map.scrollTo({ left: map.scrollLeft, top: map.scrollTop, behavior: 'instant' });
  }
  function paintRoomMap() {
    const ctx = mini.getContext('2d');
    if (!ctx || mode !== 'wander' || !worldWidth || !worldHeight) return;
    ctx.clearRect(0, 0, mini.width, mini.height);
    const sx = mini.width / worldWidth, sy = mini.height / worldHeight;
    positions.forEach((pos, index) => {
      ctx.fillStyle = index === active ? '#243a33' : '#a5b4a0';
      ctx.fillRect(pos.x * sx, pos.y * sy, pos.w * sx, pos.h * sy);
    });
    ctx.strokeStyle = '#243a33'; ctx.lineWidth = 2;
    ctx.strokeRect(map.scrollLeft * sx + 1, map.scrollTop * sy + 1, map.clientWidth * sx - 2, map.clientHeight * sy - 2);
  }
  map.addEventListener('scroll', () => {
    if (!mapPaintFrame) mapPaintFrame = requestAnimationFrame(() => { mapPaintFrame = 0; paintRoomMap(); });
  }, { passive: true });
  roomMap.addEventListener('click', event => {
    const box = mini.getBoundingClientRect();
    if (!event.detail || event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) { center(active); return; }
    const x = (event.clientX - box.left) / box.width * worldWidth, y = (event.clientY - box.top) / box.height * worldHeight;
    let target = active, distance = Infinity;
    positions.forEach((pos, index) => {
      const d = Math.hypot(pos.x + pos.w / 2 - x, pos.y + pos.h / 2 - y);
      if (d < distance) { distance = d; target = index; }
    });
    select(target);
  });
  function center(index, animate = true) {
    if (mode !== 'wander') return;
    const pos = positions.get(index);
    if (!pos) return;
    stopPan();
    const left = Math.max(0, Math.min(worldWidth - map.clientWidth, pos.x + pos.w / 2 - map.clientWidth / 2));
    const top = Math.max(0, Math.min(worldHeight - map.clientHeight, pos.y + pos.h / 2 - map.clientHeight / 2));
    if (animate && !reduced.matches && window.gsap) {
      panMotion = gsap.to(map, { scrollLeft: left, scrollTop: top, duration: .65, ease: 'power3.inOut', onComplete: () => { panMotion = null; } });
    } else map.scrollTo({ left, top, behavior: 'instant' });
  }
  function renderSelection(announceChange) {
    const indices = matching(), position = indices.indexOf(active);
    frames.forEach((frame, index) => {
      frame.classList.toggle('is-featured', index === active);
      frame.classList.toggle('is-kept', kept.includes(index));
      const b = frame.querySelector('button');
      if (index === active) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
    });
    host.querySelector('.photo-location').textContent = (filter === 'ALL' ? 'A room with ' + frames.length + ' views' : routes.querySelector('[aria-pressed="true"] span').textContent) + ' / FRAME ' + String(active + 1).padStart(2, '0');
    host.querySelector('.photo-current-title').textContent = data[active].title;
    host.querySelector('.photo-position').textContent = String(position + 1).padStart(2, '0') + ' / ' + String(indices.length).padStart(2, '0');
    const isKept = kept.includes(active);
    keepButton.textContent = isKept ? 'Kept in your story ✓' : kept.length === 3 ? 'Your story is full' : 'Keep this frame +';
    keepButton.disabled = exporting || isKept || kept.length === 3;
    paintRoomMap();
    if (announceChange) announce('Frame ' + (active + 1) + ': ' + data[active].title);
  }
  function select(index, animate = true, move = true) {
    if (!data[index]) return;
    active = index;
    renderSelection(animate);
    if (move) center(index, animate);
  }
  function layout() {
    const indices = matching();
    frames.forEach((frame, index) => { frame.hidden = !indices.includes(index); });
    positions = new Map();
    if (mode === 'index') {
      world.style.removeProperty('width'); world.style.removeProperty('height');
      frames.forEach(frame => { frame.style.cssText = ''; });
      map.scrollTo({ left: 0, top: 0, behavior: 'instant' });
      return;
    }
    const narrow = map.clientWidth < 600, pitchX = narrow ? 270 : 380, pitchY = narrow ? 245 : 320;
    const columns = Math.min(7, Math.max(1, Math.ceil(Math.sqrt(indices.length * 1.4))));
    worldWidth = Math.max(map.clientWidth, columns * pitchX + 160);
    worldHeight = Math.max(map.clientHeight, Math.ceil(indices.length / columns) * pitchY + 180);
    world.style.width = worldWidth + 'px'; world.style.height = worldHeight + 'px';
    indices.forEach((index, slot) => {
      const col = slot % columns, row = Math.floor(slot / columns);
      const n = (index * 17) % 13;
      const w = (narrow ? 188 : 264) + n * (narrow ? 3 : 4);
      const imageHeight = Math.min(narrow ? 192 : 245, (w - 20) / data[index].ratio);
      const h = imageHeight + 56;
      const x = 80 + col * pitchX + (n % 3) * 13;
      const y = 80 + row * pitchY + (col % 2 ? 35 : 0) + (n % 4) * 7;
      positions.set(index, { x, y, w, h });
      frames[index].style.cssText = '--print-x:' + x + 'px;--print-y:' + y + 'px;--print-w:' + w + 'px;--print-h:' + imageHeight + 'px;--print-tilt:' + ((n % 7) - 3) * 1.2 + 'deg;';
    });
    center(active, false);
    paintRoomMap();
  }
  function filterTo(key) {
    cancelDrag(); stopPan(); filter = key;
    routes.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.route === filter)));
    const indices = matching();
    if (!indices.includes(active)) active = indices[0];
    layout(); renderSelection(true); window.scheduleRefresh?.(100);
  }
  [['ALL', 'Everywhere'], ...Object.entries(groups), ['NEW', 'Fresh arrivals']].forEach(([key, label]) => {
    const count = initialOrder.filter(index => key === 'ALL' || (key === 'NEW' ? !!frames[index].dataset.new : category(frames[index]) === key)).length;
    if (!count) return;
    const b = button('', null, 'photo-route'); b.dataset.route = key;
    b.setAttribute('aria-pressed', String(key === filter));
    const name = document.createElement('span'); name.textContent = label;
    const total = document.createElement('small'); total.textContent = String(count).padStart(2, '0');
    b.append(name, total); b.addEventListener('click', () => filterTo(key)); routes.append(b);
  });
  host.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => {
    cancelDrag(); stopPan(); mode = b.dataset.view; host.dataset.view = mode;
    loadRoomPrints();
    host.querySelectorAll('[data-view]').forEach(item => item.setAttribute('aria-pressed', String(item === b)));
    map.tabIndex = mode === 'wander' ? 0 : -1;
    map.setAttribute('aria-label', mode === 'wander' ? 'Draggable photo map. Drag to explore, or use the arrow keys to choose a photograph.' : 'Photograph index');
    layout(); window.scheduleRefresh?.(120);
    announce(mode === 'wander' ? 'Photo map. Drag or use the arrow keys to explore.' : matching().length + ' photographs in the index.');
  }));
  function step(direction) {
    const indices = matching(); select(indices[(indices.indexOf(active) + direction + indices.length) % indices.length]);
  }
  host.querySelectorAll('[data-step]').forEach(b => b.addEventListener('click', () => step(Number(b.dataset.step))));
  host.querySelector('[data-recenter]').addEventListener('click', () => center(active));
  host.querySelector('[data-surprise]').addEventListener('click', () => {
    const indices = matching().filter(i => i !== active);
    select(indices[Math.floor(Math.random() * indices.length)] ?? active);
  });
  host.querySelector('[data-look]').addEventListener('click', event => {
    center(active, false); openDetail('photo', active, event.currentTarget);
  });
  map.addEventListener('keydown', event => {
    if (event.target !== map || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Enter' || event.key === ' ') { openDetail('photo', active, map); return; }
    const indices = matching();
    if (event.key === 'Home' || event.key === 'End') select(indices[event.key === 'Home' ? 0 : indices.length - 1]);
    else step(event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1);
  });
  host.addEventListener('click', event => {
    if (performance.now() < suppressUntil) { event.preventDefault(); event.stopImmediatePropagation(); return; }
    const frame = event.target.closest('.photo-frame');
    if (frame) select(Number(frame.dataset.photoIndex), false, false);
  }, true);
  world.addEventListener('focusin', event => {
    const frame = event.target.closest('.photo-frame');
    if (frame) {
      const index = Number(frame.dataset.photoIndex);
      select(index, false, !drag && index !== active);
    }
  });
  function cancelDrag(event) {
    if (!drag || (event?.pointerId !== undefined && event.pointerId !== drag.id)) return;
    const previous = drag; drag = null; map.classList.remove('is-dragging');
    if (previous.moved) suppressUntil = performance.now() + 160;
    if (map.hasPointerCapture(previous.id)) map.releasePointerCapture(previous.id);
    window.removeEventListener('pointermove', moveDrag);
    window.removeEventListener('pointerup', cancelDrag);
    window.removeEventListener('pointercancel', cancelDrag);
  }
  function moveDrag(event) {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 6) return;
    if (!drag.moved) { drag.moved = true; map.setPointerCapture(event.pointerId); map.classList.add('is-dragging'); }
    event.preventDefault(); map.scrollLeft = drag.left - dx; map.scrollTop = drag.top - dy;
  }
  map.addEventListener('pointerdown', event => {
    // Touch keeps native two-axis scrolling. Vertical scrolling elsewhere stays native.
    if (mode !== 'wander' || event.pointerType === 'touch' || !event.isPrimary || event.button !== 0) return;
    cancelDrag(); stopPan();
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, left: map.scrollLeft, top: map.scrollTop, moved: false };
    window.addEventListener('pointermove', moveDrag, { passive: false });
    window.addEventListener('pointerup', cancelDrag); window.addEventListener('pointercancel', cancelDrag);
  });
  map.addEventListener('lostpointercapture', cancelDrag);
  window.addEventListener('blur', () => cancelDrag());
  map.addEventListener('wheel', stopPan, { passive: true });
  map.addEventListener('touchstart', stopPan, { passive: true });
  function storyChanged(message) {
    save(); renderStory(); renderSelection(false);
    if (message) status.textContent = message;
  }
  keepButton.addEventListener('click', () => {
    if (kept.length >= 3 || kept.includes(active) || exporting) return;
    kept.push(active); storyChanged(kept.length === 3 ? 'Your story is ready. Name it, rearrange it, or save it.' : data[active].title + ' kept. ' + (3 - kept.length) + ' more to find.');
  });
  titleInput.addEventListener('input', () => { storyTitle = titleInput.value; save(); renderPreview(); });
  host.querySelector('[data-deal]').addEventListener('click', () => {
    if (exporting) return;
    const bag = matching().slice();
    // A small journey can borrow from the rest of the room to make three unique frames.
    initialOrder.forEach(i => { if (!bag.includes(i)) bag.push(i); });
    for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; }
    kept = bag.slice(0, 3); storyChanged('Three different views. Swap their order to change the story.');
  });
  function renderStory() {
    const focusName = picks.contains(document.activeElement) ? document.activeElement.getAttribute('aria-label') : null;
    picks.replaceChildren();
    for (let slot = 0; slot < 3; slot++) {
      const li = document.createElement('li'); const index = kept[slot];
      const number = document.createElement('span'); number.className = 'photo-pick-number mono'; number.textContent = '0' + (slot + 1);
      li.append(number);
      if (index === undefined) {
        li.className = 'is-empty'; const text = document.createElement('span'); text.textContent = ['Find a beginning', 'Leave room for a detour', 'Choose an ending'][slot]; li.append(text);
      } else {
        const item = data[index], thumb = document.createElement('img'); thumb.src = item.thumb; thumb.alt = ''; thumb.width = 80; thumb.height = 60;
        const name = button(item.title, 'Find kept frame ' + (index + 1), 'photo-pick-find');
        name.addEventListener('click', () => { if (!matching().includes(index)) filterTo('ALL'); select(index); map.scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth', block: 'center' }); map.focus({ preventScroll: true }); });
        const tools = document.createElement('div'); tools.className = 'photo-pick-tools';
        [-1, 1].forEach(direction => {
          const b = button(direction < 0 ? '←' : '→', 'Move frame ' + (index + 1) + (direction < 0 ? ' earlier' : ' later'));
          b.disabled = exporting || slot + direction < 0 || slot + direction >= kept.length;
          b.addEventListener('click', () => { [kept[slot], kept[slot + direction]] = [kept[slot + direction], kept[slot]]; storyChanged('Story order changed.'); }); tools.append(b);
        });
        const remove = button('×', 'Remove frame ' + (index + 1)); remove.disabled = exporting;
        remove.addEventListener('click', () => { kept.splice(slot, 1); storyChanged('Frame removed. Find another view.'); }); tools.append(remove);
        li.append(thumb, name, tools);
      }
      picks.append(li);
    }
    if (focusName) {
      const target = Array.from(picks.querySelectorAll('button')).find(b => b.getAttribute('aria-label') === focusName && !b.disabled);
      (target || picks.querySelector('button') || keepButton).focus({ preventScroll: true });
    }
    printButton.disabled = kept.length !== 3 || exporting;
    renderPreview();
  }
  function loadImage(src, cache = true) {
    if (cache && thumbnails.has(src)) return thumbnails.get(src);
    const request = new Promise((resolve, reject) => {
      const img = new Image();
      const timer = setTimeout(() => finish(new Error('A photograph took too long to load. Try saving again.')), 15000);
      function finish(error) { clearTimeout(timer); img.onload = null; img.onerror = null; if (error) reject(error); else resolve(img); }
      img.onload = () => finish(); img.onerror = () => finish(new Error('A photograph could not be loaded. Try again.')); img.src = src;
    });
    if (cache) {
      thumbnails.set(src, request);
      if (thumbnails.size > 12) thumbnails.delete(thumbnails.keys().next().value);
      request.catch(() => { if (thumbnails.get(src) === request) thumbnails.delete(src); });
    }
    return request;
  }
  function drawStory(canvas, snapshot, images) {
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#fdfdf9'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#344d40'; ctx.font = '22px "IBM Plex Mono", monospace'; ctx.fillText('N1GHT CHXN9 / A POCKET STORY', 80, 90);
    ctx.fillStyle = '#243a33';
    const title = snapshot.title.trim() || 'Somewhere I would stay';
    let fontSize = 84;
    do { ctx.font = '500 ' + fontSize + 'px "Space Grotesk", sans-serif'; if (ctx.measureText(title).width <= W - 160) break; fontSize -= 2; } while (fontSize > 24);
    ctx.fillText(title, 80, 206);
    const gap = 28, width = (W - 160 - gap * 2) / 3, top = 280, height = 565;
    for (let slot = 0; slot < 3; slot++) {
      const x = 80 + slot * (width + gap), item = data[snapshot.kept[slot]], img = images[slot];
      ctx.fillStyle = '#ebefe8'; ctx.fillRect(x, top, width, height);
      if (img) { const scale = Math.min((width - 36) / img.naturalWidth, (height - 36) / img.naturalHeight); const w = img.naturalWidth * scale, h = img.naturalHeight * scale; ctx.drawImage(img, x + (width - w) / 2, top + (height - h) / 2, w, h); }
      else { ctx.fillStyle = '#56665c'; ctx.font = '40px "IBM Plex Mono", monospace'; ctx.fillText('0' + (slot + 1), x + 32, top + 68); }
      ctx.fillStyle = '#56665c'; ctx.font = '20px "IBM Plex Mono", monospace'; ctx.fillText(item ? 'FRAME ' + String(item.index + 1).padStart(2, '0') : 'YOUR NEXT FIND', x, 890);
      ctx.fillStyle = '#243a33'; ctx.font = '26px "Space Grotesk", sans-serif';
      const words = (item ? item.title : ['A beginning', 'A detour', 'An ending'][slot]).split(' '); let line = '', y = 934;
      words.forEach(word => { const next = line ? line + ' ' + word : word; if (ctx.measureText(next).width > width && line) { ctx.fillText(line, x, y); line = word; y += 34; } else line = next; }); ctx.fillText(line, x, y);
    }
    ctx.strokeStyle = '#d9ddd4'; ctx.beginPath(); ctx.moveTo(80, 1012); ctx.lineTo(W - 80, 1012); ctx.stroke();
    ctx.fillStyle = '#56665c'; ctx.font = '18px "IBM Plex Mono", monospace'; ctx.fillText('THREE FRAMES. ONE WAY OF SEEING.', 80, 1048);
  }
  async function renderPreview() {
    const ticket = ++previewTicket, snapshot = { kept: kept.slice(), title: storyTitle };
    drawStory(preview, snapshot, []);
    preview.setAttribute('aria-label', (storyTitle.trim() || 'Somewhere I would stay') + '. ' + snapshot.kept.map(i => data[i].title).join('; ') + '. ' + snapshot.kept.length + ' of 3 frames kept.');
    const images = await Promise.all(snapshot.kept.map(i => loadImage(data[i].thumb).catch(() => null)));
    if (ticket === previewTicket) drawStory(preview, snapshot, images);
  }
  printButton.addEventListener('click', async () => {
    if (kept.length !== 3 || exporting) return;
    const snapshot = { kept: kept.slice(), title: storyTitle };
    exporting = true;
    const controls = host.querySelectorAll('.photo-story button, .photo-story input, [data-keep]');
    controls.forEach(b => { b.dataset.wasDisabled = String(b.disabled); b.disabled = true; });
    printButton.textContent = 'Making your story…'; status.textContent = 'Preparing the full-size photographs.';
    try {
      if (document.fonts) await document.fonts.ready;
      const images = await Promise.all(snapshot.kept.map(i => loadImage(data[i].src, false)));
      const canvas = document.createElement('canvas'); canvas.width = 1800; canvas.height = 1080; drawStory(canvas, snapshot, images);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('The story could not be saved. Please try again.');
      const url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = (snapshot.title.trim() || 'My pocket story').replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').slice(0, 48) + '.png';
      document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
      status.textContent = 'Your story is ready. The PNG download has started.';
    } catch (error) { status.textContent = error.message || 'The story could not be saved. Please try again.'; }
    finally {
      exporting = false; controls.forEach(b => { b.disabled = b.dataset.wasDisabled === 'true'; delete b.dataset.wasDisabled; });
      printButton.textContent = 'Save my story ↓'; printButton.disabled = kept.length !== 3; renderSelection(false);
    }
  });
  const resize = new ResizeObserver(() => { cancelDrag(); stopPan(); layout(); });
  resize.observe(map);
  reduced.addEventListener('change', () => { cancelDrag(); stopPan(); center(active, false); });
  document.fonts?.ready.then(() => renderPreview());
  window.AtelierPhoto = {
    select, count: () => frames.length, source: () => null,
    returnTarget(index, origin) {
      if (!matching().includes(index)) filterTo('ALL');
      select(index, false, index !== active);
      // Map prints are tilted. Use a fade in the shared viewer instead of a distorted flight.
      return { image: frames[index].querySelector('img'), button: world.contains(origin) ? frames[index].querySelector('button') : origin || map };
    }
  };
  layout(); renderSelection(false); renderStory();
  status.textContent = kept.length === 3 ? 'Your story is ready to save.' : 'Pick any three frames. Your draft stays in this browser.';
})();
