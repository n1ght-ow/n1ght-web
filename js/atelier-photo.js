/* The wandering room shares its three photograph selections with the exhibition desk. */
(function () {
  'use strict';
  const host = document.getElementById('photo-deck');
  if (!host) return;
  const frames = Array.from(host.querySelectorAll('.photo-frame'));
  if (!frames.length) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const groups = { CITY: 'City', LAND: 'Nature', NIGHT: 'Night', WINTER: 'Winter' };
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
  let active = Math.max(0, data.findIndex(item => item.title === 'The last red light'));
  let filter = 'ALL', mode = 'wander', drag = null, suppressUntil = 0;
  let panMotion = null, dragPaintFrame = 0;
  const kept = () => window.CuratorDesk?.photoIds() || [];
  let positions = new Map(), worldWidth = 0, worldHeight = 0;
  // Mix near and far, day and night: neighbouring prints suggest unexpected connections.
  const opening = [38, 35, 37, 2, 4, 26, 45, 43, 21, 10, 39, 24, 22, 36].filter(i => data[i]);
  const initialOrder = [...opening, ...frames.map((_, i) => i).filter(i => !opening.includes(i))];
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
        <p id="photo-map-help" class="sr-only">Drag to explore. Click a photograph to open it.</p>
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
    <p class="sr-only photo-live" role="status" aria-live="polite"></p>`;
  const world = host.querySelector('.photo-world'), map = host.querySelector('.photo-map');
  const routes = host.querySelector('.photo-routes'), live = host.querySelector('.photo-live');
  const keepButton = host.querySelector('[data-keep]');
  const visit = document.createElement('a');
  visit.className = 'curator-collect-link'; visit.href = '#curate'; visit.textContent = 'Visit the desk →';
  keepButton.after(visit);
  const roomMap = host.querySelector('.photo-room-map'), mini = roomMap.querySelector('canvas');
  const detailInfo = document.getElementById('lb-photo-info');
  const detailKeep = detailInfo ? document.createElement('button') : null;
  const detailStoryStatus = document.createElement('p');
  detailStoryStatus.className = 'photo-detail-story-status';
  detailStoryStatus.setAttribute('role', 'status');
  if (detailKeep) {
    detailKeep.type = 'button';
    detailKeep.className = 'photo-keep photo-detail-keep';
    detailInfo.append(detailKeep, detailStoryStatus);
  }
  let mapPaintFrame = 0;
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
      ctx.fillStyle = index === active ? '#1c3154' : '#aebbd6';
      ctx.fillRect(pos.x * sx, pos.y * sy, pos.w * sx, pos.h * sy);
    });
    ctx.strokeStyle = '#1c3154'; ctx.lineWidth = 2;
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
      frame.classList.toggle('is-kept', kept().includes(String(index)));
      const b = frame.querySelector('button');
      if (index === active) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
    });
    host.querySelector('.photo-location').textContent = 'Frame ' + String(active + 1).padStart(2, '0');
    host.querySelector('.photo-current-title').textContent = data[active].title;
    host.querySelector('.photo-position').textContent = String(position + 1).padStart(2, '0') + ' / ' + String(indices.length).padStart(2, '0');
    renderKeepButton(keepButton, active);
    syncDetailKeep();
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
  [['ALL', 'All'], ...Object.entries(groups), ['NEW', 'New']].forEach(([key, label]) => {
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
    if (dragPaintFrame) {
      cancelAnimationFrame(dragPaintFrame); dragPaintFrame = 0;
      // Commit the last queued position on release; cancellation keeps the painted view.
      if (event?.type === 'pointerup') paintDrag();
    }
    const previous = drag; drag = null; map.classList.remove('is-dragging');
    if (previous.moved) suppressUntil = performance.now() + 160;
    if (map.hasPointerCapture(previous.id)) map.releasePointerCapture(previous.id);
    window.removeEventListener('pointermove', moveDrag);
    window.removeEventListener('pointerup', cancelDrag);
    window.removeEventListener('pointercancel', cancelDrag);
  }
  function paintDrag() {
    dragPaintFrame = 0;
    if (!drag?.moved) return;
    map.scrollLeft = drag.targetLeft;
    map.scrollTop = drag.targetTop;
  }
  function moveDrag(event) {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 6) return;
    if (!drag.moved) { drag.moved = true; map.setPointerCapture(event.pointerId); map.classList.add('is-dragging'); }
    event.preventDefault();
    drag.targetLeft = drag.left - dx; drag.targetTop = drag.top - dy;
    if (!dragPaintFrame) dragPaintFrame = requestAnimationFrame(paintDrag);
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
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    cancelDrag(); stopPan();
    if (mapPaintFrame) { cancelAnimationFrame(mapPaintFrame); mapPaintFrame = 0; }
  });
  map.addEventListener('wheel', stopPan, { passive: true });
  map.addEventListener('touchstart', stopPan, { passive: true });
  function renderKeepButton(control, index) {
    if (!control) return;
    const added = kept().includes(String(index));
    const label = added ? 'Added' : kept().length === 3 ? 'Photos full' : 'Add photo';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('class', 'gallery-icon');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(svg.namespaceURI, 'path');
    path.setAttribute('d', added ? 'm5 12 4 4L19 6' : 'M6 4h12v17l-6-4-6 4Z');
    path.setAttribute('fill', 'none'); path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '1.6'); path.setAttribute('stroke-linecap', 'round'); path.setAttribute('stroke-linejoin', 'round');
    svg.append(path);
    const text = document.createElement('span'); text.textContent = label;
    const count = document.createElement('small'); count.textContent = kept().length + '/3';
    control.replaceChildren(svg, text, count);
    control.disabled = !window.CuratorDesk || window.CuratorDesk.busy() || added || kept().length === 3;
    control.setAttribute('aria-label', label + ' (' + kept().length + ' of 3 photographs)');
    control.title = added ? 'This photograph is in your exhibition' : kept().length === 3 ? 'Change a photograph at the desk' : 'Add this photograph to your exhibition';
  }
  function syncDetailKeep() {
    if (!detailKeep) return;
    renderKeepButton(detailKeep, typeof detailType !== 'undefined' && detailType === 'photo' ? lbIndex : active);
  }
  function addToExhibition(index) {
    if (!data[index] || !window.CuratorDesk?.addPhoto(index)) return;
    const message = 'Photograph added to your exhibition. ' + kept().length + '/3 photographs.';
    announce(message);
    if (detailKeep && typeof detailType !== 'undefined' && detailType === 'photo') detailStoryStatus.textContent = message;
  }
  visit.addEventListener('click', event => { event.preventDefault(); window.CuratorDesk?.visit(); });
  window.addEventListener('night:creation-change', () => renderSelection(false));
  keepButton.addEventListener('click', () => addToExhibition(active));
  if (detailKeep) {
    detailKeep.addEventListener('click', () => { if (detailType === 'photo') addToExhibition(lbIndex); });
    const detailCount = document.getElementById('lb-count');
    if (detailCount) new MutationObserver(() => { syncDetailKeep(); detailStoryStatus.textContent = ''; }).observe(detailCount, { childList: true, characterData: true, subtree: true });
  }
  const resize = new ResizeObserver(() => { cancelDrag(); stopPan(); layout(); });
  resize.observe(map);
  // Caption wrapping changes the room height without changing the map itself.
  // Refresh only after an actual size change, through the shared scheduler.
  let roomHeight = null;
  const roomResize = new ResizeObserver(([entry]) => {
    const height = entry.contentRect.height;
    if (roomHeight !== null && Math.abs(height - roomHeight) > .5) scheduleRefresh(120);
    roomHeight = height;
  });
  roomResize.observe(host);
  reduced.addEventListener('change', () => { cancelDrag(); stopPan(); center(active, false); });
  window.AtelierPhoto = {
    select, count: () => frames.length,
    returnTarget(index, origin) {
      if (!matching().includes(index)) filterTo('ALL');
      select(index, false, index !== active);
      // Map prints are tilted. Use a fade in the shared viewer instead of a distorted flight.
      return { image: frames[index].querySelector('img'), button: world.contains(origin) ? frames[index].querySelector('button') : origin || map };
    }
  };
  layout(); renderSelection(false);
})();
