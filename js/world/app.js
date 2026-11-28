import { loadCollection } from './collection.js?v=3';
import { createCuration, NON_PHOTO_LIMIT, PHOTO_LIMIT } from './curation.js?v=4';
import { FEATURED_PHOTO, PRIMARY_CONTROLS, ROOMS, WINGS } from './gallery.js?v=2';
import { resolveSiteAsset } from './paths.js?v=1';

const $ = id => document.getElementById(id);
const shortNames = Object.fromEntries(Object.entries(ROOMS).map(([id, room]) => [id, room.name]));
let collections = [], world = null, current = null, selected = null, detailTrigger = null, toastTimer;
let catalogueLimit = 40;
const details = $('detail-dialog');
const atlas = $('atlas-dialog');
const curation = createCuration({ onChange: updateSaved });
let controlSignature = '', pinsVisible = false;
const pinNodes = new Map();

function toast(message) {
  clearTimeout(toastTimer); $('toast').textContent = message; $('toast').classList.add('is-visible');
  toastTimer = setTimeout(() => $('toast').classList.remove('is-visible'), 3400);
}
function el(tag, className, text) {
  const node = document.createElement(tag); if (className) node.className = className;
  if (text !== undefined) node.textContent = text; return node;
}
function roomOf(id) { return collections.find(room => room.id === id); }
function safeURL(value) {
  return resolveSiteAsset(value);
}
function imageNode(item, full = false) {
  const url = item && (full ? item.fullImage || item.image : item.image);
  if (!url) return null;
  const image = new Image(); image.alt = item.alt || item.title; image.decoding = 'async';
  image.loading = full ? 'eager' : 'lazy'; image.src = resolveSiteAsset(url) || url;
  image.addEventListener('error', () => {
    const fallback = el('span', full ? 'typographic-work' : 'item-initial', full ? item.title : item.title.slice(0, 1));
    image.replaceWith(fallback);
  }, { once: true });
  return image;
}
function linkedRoom(event, id) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  showRoom(id, true, true);
}
function showRoom(id, updateHash = true, moveFocus = false) {
  if (id && !roomOf(id)) return;
  if (updateHash) {
    const hash = id ? `#${id}` : '';
    if (location.hash !== hash) history.pushState(null, '', hash || location.pathname + location.search);
  }
  if (current?.id === id || (!current && !id && document.documentElement.dataset.world === 'overview')) return;
  if (world && document.documentElement.dataset.scene === 'fallback') {
    delete document.documentElement.dataset.scene;
    $('world-loading').hidden = true;
  }
  renderRoom(id);
  if (world) world.focus(id);
  if (moveFocus) {
    window.scrollTo(0, 0);
    $(id ? 'room-title' : 'start-explore').focus({ preventScroll: true });
  }
}
function roomTab(name, focus = false) {
  for (const id of ['operate', 'catalogue']) {
    const active = id === name;
    const tab = $(id + '-tab');
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    $(id + '-panel').hidden = !active;
    if (active && focus) tab.focus();
  }
}
function updatePoster(room) {
  const photos = roomOf('photo').items;
  const featured = photos.find(item => item.id === FEATURED_PHOTO);
  const items = room?.id === 'curate' ? curation.getItems() : room?.items;
  const item = !room || room.id === 'photo' ? featured : items.find(entry => entry.image) || items[0];
  const poster = $('stage-poster');
  const text = $('stage-text');
  poster.hidden = !item?.image;
  text.hidden = !poster.hidden;
  if (!poster.hidden) {
    const url = resolveSiteAsset(item.image);
    if (poster.src !== url) poster.src = url;
    poster.alt = item.alt || item.title;
  } else {
    text.querySelector('strong').textContent = item?.title || ROOMS.curate.title;
    const stanza = item?.stanzas?.[0];
    text.querySelector('p').textContent = Array.isArray(stanza) ? stanza.join('\n') : stanza || item?.meta || '打开馆藏作品，把它收入你的展览。';
  }
}
function renderRoom(id) {
  current = id ? roomOf(id) : null;
  document.documentElement.dataset.world = current ? 'room' : 'overview';
  $('room-heading').hidden = $('room-panel').hidden = !current;
  for (const link of document.querySelectorAll('[data-room]')) {
    if (link.dataset.room === id) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
  updatePoster(current);
  showControlHover(null);
  $('model-pins').replaceChildren();
  $('model-controls').replaceChildren();
  pinNodes.clear();
  controlSignature = '';
  if (!current) return;
  const profile = ROOMS[id];
  $('world-stage').style.setProperty('--stage', profile.color);
  $('room-english').textContent = current.english;
  $('room-title').textContent = profile.title;
  $('room-description').textContent = profile.intro;
  $('room-hint').textContent = profile.hint;
  $('model-status').textContent = '';
  $('collection-search').value = ''; catalogueLimit = 40;
  $('room-panel').scrollTop = 0;
  $('curation-form').hidden = id !== 'curate';
  $('random-item').hidden = id === 'curate';
  document.querySelector('.search-wrap').hidden = id === 'curate';
  roomTab(id === 'curate' || document.documentElement.dataset.scene === 'fallback' ? 'catalogue' : 'operate');
  renderActions(); renderCatalogue();
}
function buildNavigation() {
  for (const wing of [...WINGS, { name: '策展', rooms: ['curate'] }]) {
    const isCuration = wing.rooms[0] === 'curate';
    const dock = el('div', 'dock-group');
    const dockLinks = el('div', 'dock-links');
    dock.append(el('span', 'wing-name', wing.name), dockLinks);
    const group = el('section', 'atlas-wing');
    group.append(el('h3', 'wing-name', wing.name));
    for (const id of wing.rooms) {
      const profile = ROOMS[id];
      const link = el('a', 'dock-item', profile.name); link.href = '#' + id; link.dataset.room = id;
      link.addEventListener('click', event => linkedRoom(event, id));
      dockLinks.append(link);
      const atlasLink = el('a', 'atlas-item'); atlasLink.href = '#' + id; atlasLink.dataset.room = id;
      atlasLink.append(el('span', '', profile.title), el('small', '', roomOf(id).english));
      atlasLink.addEventListener('click', event => {
        if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) atlas.close();
        linkedRoom(event, id);
      });
      group.append(atlasLink);
    }
    if (!isCuration) $('dock-items').append(dock);
    $('atlas-list').append(group);
  }
}
function action(text, callback) {
  const button = el('button', 'room-action', text); button.type = 'button';
  button.addEventListener('click', () => callback(button));
  $('room-actions').append(button); return button;
}
function randomIndex() { return Math.floor(Math.random() * (current?.items.length || 1)); }
function reveal(index) {
  if (!current?.items.length) return;
  world?.interact('select', index); openDetail(current.id, index);
}
function renderActions() {
  $('room-actions').replaceChildren();
  action('复位装置', () => { world?.interact('reset'); refreshModelControls(); });
  const pins = action(pinsVisible ? '隐藏机关提示' : '显示机关提示', button => {
    pinsVisible = !pinsVisible;
    button.textContent = pinsVisible ? '隐藏机关提示' : '显示机关提示';
    button.setAttribute('aria-pressed', String(pinsVisible));
    projectControls(world?.getControls?.() || []);
  });
  pins.setAttribute('aria-pressed', String(pinsVisible));
  if (current.id === 'curate') action('随机补齐展品', fillExhibition);
}
function refreshModelControls() {
  const container = $('model-controls'); if (!container || !current) return;
  const controls = world?.getControls() || [];
  const signature = current.id + ':' + controls.map(c => c.id).join('|');
  if (signature === controlSignature) return;
  const expanded = container.querySelector('details')?.open || false;
  controlSignature = signature; container.replaceChildren(); $('model-pins').replaceChildren(); pinNodes.clear();
  const preferred = PRIMARY_CONTROLS[current.id];
  const primary = preferred ? preferred.map(key => controls.find(control => control.id === current.id + ':' + key)).filter(Boolean) : controls;
  const extra = controls.filter(control => !primary.includes(control));
  const options = el('details', 'extra-controls');
  options.open = expanded;
  options.append(el('summary', '', '更多机关'));
  [...primary, ...extra].forEach((control, index) => {
    const row = el('div', 'mechanism-row'); row.dataset.modelControl = control.id;
    const trigger = el('button', 'mechanism-trigger'); trigger.type = 'button';
    trigger.setAttribute('aria-label', control.label + '，' + control.hint);
    trigger.append(el('span', 'mechanism-number', String(index + 1).padStart(2, '0')));
    const copy = el('span', 'mechanism-copy'); copy.append(el('strong', '', control.label), el('small', '', control.hint)); trigger.append(copy);
    trigger.addEventListener('click', () => { world?.activateControl(control.id); refreshModelControls(); });
    trigger.addEventListener('keydown', event => {
      if (!event.key.startsWith('Arrow')) return;
      event.preventDefault(); event.stopPropagation(); world?.activateControl(control.id, event.key);
    });
    row.append(trigger);
    const vertical = /升降|旅行光球/.test(control.label) || (control.hint.includes('上下') && !control.hint.includes('左右'));
    if (control.draggable) for (const [key, text] of [[vertical ? 'ArrowDown' : 'ArrowLeft', '−'], [vertical ? 'ArrowUp' : 'ArrowRight', '＋']]) {
      const step = el('button', 'mechanism-step', text); step.type = 'button';
      step.setAttribute('aria-label', ((key === 'ArrowLeft' || key === 'ArrowDown') ? '反向调整' : '正向调整') + control.label);
      step.addEventListener('click', () => world?.activateControl(control.id, key)); row.append(step);
    }
    (index < primary.length ? container : options).append(row);
    const pin = el('button', 'mechanism-pin'); pin.type = 'button';
    pin.setAttribute('aria-label', '操作' + control.label);
    pin.append(el('span', '', String(index + 1).padStart(2, '0')), el('small', '', control.label));
    pin.addEventListener('click', () => world?.activateControl(control.id));
    $('model-pins').append(pin); pinNodes.set(control.id, { row, pin });
  });
  if (extra.length) container.append(options);
  if (!controls.length) container.append(el('p', 'model-controls-empty', '展品正在就位。也可以先浏览馆藏。'));
  projectControls(controls);
}
function projectControls(controls) {
  if (!$('model-pins')) return;
  const rect = $('world-stage').getBoundingClientRect();
  for (const control of controls) {
    const node = pinNodes.get(control.id); if (!node) continue;
    node.pin.style.left = (control.x - rect.left) + 'px'; node.pin.style.top = (control.y - rect.top) + 'px';
    node.pin.hidden = !pinsVisible || !current || control.visible === false || control.x < rect.left + 20 || control.x > rect.right - 20 || control.y < rect.top + 20 || control.y > rect.bottom - 20;
  }
}
function showModelStatus({ id, message }) {
  if (!current || current.id !== id || !$('model-status')) return;
  if ($('model-status').textContent !== message) $('model-status').textContent = message;
  refreshModelControls();
}
function showControlHover(control) {
  const tooltip = $('model-tooltip'); if (!tooltip) return;
  tooltip.hidden = !control;
  for (const [id, nodes] of pinNodes) { nodes.row.classList.toggle('is-hovered', id === control?.id); nodes.pin.classList.toggle('is-hovered', id === control?.id); }
  if (!control) return;
  $('model-tooltip-title').textContent = control.label;
  $('model-tooltip-hint').textContent = (control.draggable ? '按住拖动 · ' : '点击操作 · ') + control.hint;
  tooltip.style.left = Math.max(12, Math.min(innerWidth - 260, control.x + 20)) + 'px';
  tooltip.style.top = Math.max(80, Math.min(innerHeight - 110, control.y + 20)) + 'px';
}
function itemButton(item, category, index) {
  const button = el('button', 'catalogue-item'); button.type = 'button';
  const img = imageNode(item); button.append(img || el('span', 'item-initial', item.title.slice(0, 1)));
  const copy = el('span', 'item-copy'); copy.append(el('strong', '', item.title), el('small', '', item.meta || shortNames[category]));
  button.append(copy, el('span', 'item-arrow', '↗'));
  button.addEventListener('click', () => { if (current?.id === category) world?.interact('select', index); openDetail(category, index); });
  return button;
}
function renderCatalogue() {
  if (!current) return;
  const container = $('catalogue-items'); container.replaceChildren();
  if (current.id === 'curate') {
    const items = curation.getItems(); $('catalogue-count').textContent = `已收集 ${items.length} / 7 件`;
    if (!items.length) container.append(el('p', 'empty-message', '还没有作品。打开任意一件藏品的详情，就可以把它收入展览。'));
    items.forEach((item, itemIndex) => {
      const room = roomOf(item.category); const index = room?.items.findIndex(i => i.id === item.id) ?? -1;
      const row = el('div', 'saved-row'); row.append(itemButton(item, item.category, index));
      const order = el('span', 'saved-order');
      for (const [delta, text] of [[-1, '↑'], [1, '↓']]) {
        const move = el('button', '', text); move.type = 'button';
        move.setAttribute('aria-label', `${delta < 0 ? '提前' : '后移'}${item.title}`);
        move.disabled = itemIndex + delta < 0 || itemIndex + delta >= items.length;
        move.addEventListener('click', () => curation.move?.(item.id, delta)); order.append(move);
      }
      row.append(order);
      const remove = el('button', 'remove-saved', '×'); remove.type = 'button'; remove.setAttribute('aria-label', `移除${item.title}`);
      remove.addEventListener('click', () => curation.remove(item.id)); row.append(remove); container.append(row);
    });
    $('export-png').disabled = !items.length; return;
  }
  const query = $('collection-search').value.trim().toLocaleLowerCase();
  const filtered = current.items.map((item, index) => ({ item, index })).filter(({ item }) =>
    !query || [item.title, item.meta, item.description, item.artist, item.author, item.genre].filter(Boolean).join(' ').toLocaleLowerCase().includes(query));
  $('catalogue-count').textContent = query ? `找到 ${filtered.length} / ${current.items.length} 件` : `${current.items.length} 件馆藏`;
  filtered.slice(0, catalogueLimit).forEach(({ item, index }) => container.append(itemButton(item, current.id, index)));
  if (!filtered.length) container.append(el('p', 'empty-message', '这里没有匹配的作品。可以试试作品名或作者。'));
  if (filtered.length > catalogueLimit) {
    const more = el('button', 'text-button', `继续看 ${Math.min(40, filtered.length - catalogueLimit)} 件 ↓`); more.type = 'button';
    more.addEventListener('click', () => { const top = container.scrollTop; catalogueLimit += 40; renderCatalogue(); container.scrollTop = top; }); container.append(more);
  }
}
function openDetail(category, index) {
  const room = roomOf(category); if (!room?.items[index]) return;
  selected = { category, index, item: room.items[index] };
  const item = selected.item;
  $('detail-category').textContent = `${shortNames[category]} / ${room.english}`;
  $('detail-title').textContent = item.title;
  const meta = category === 'paintings' ? [item.english, item.artist, item.year, item.medium, item.museum]
    : category === 'books' ? [item.spine, item.author]
    : category === 'films' ? [item.director, item.year, item.genre]
    : category === 'series' ? [item.years, item.seasons, item.categoryLabel || item.originalFields?.category]
    : [item.meta];
  $('detail-meta').textContent = meta.filter(Boolean).join(' · ');
  $('detail-position').textContent = `${String(index + 1).padStart(2, '0')} / ${room.items.length}`;
  const visual = $('detail-visual'); visual.replaceChildren(); visual.classList.remove('is-zoomed');
  const image = imageNode(item, true);
  if (image) {
    const zoom = el('button', 'detail-image-button');
    zoom.type = 'button';
    zoom.setAttribute('aria-label', '放大作品图像');
    zoom.setAttribute('aria-pressed', 'false');
    zoom.addEventListener('click', () => {
      const zoomed = visual.classList.toggle('is-zoomed');
      zoom.setAttribute('aria-pressed', String(zoomed));
      zoom.setAttribute('aria-label', zoomed ? '还原作品图像' : '放大作品图像');
      if (!zoomed) visual.scrollTo(0, 0);
    });
    zoom.append(image);
    image.addEventListener('error', () => zoom.replaceWith(...zoom.childNodes), { once: true });
    visual.append(zoom);
  } else visual.append(el('div', 'typographic-work', item.title));
  const description = $('detail-description'); description.replaceChildren();
  if (item.description) description.append(el('p', '', item.description));
  if (item.stanzas) item.stanzas.forEach(stanza => description.append(el('p', 'stanza', Array.isArray(stanza) ? stanza.join('\n') : String(stanza))));
  if (item.note && item.note !== item.description) description.append(el('p', '', item.note));
  const url = safeURL(item.url || item.sourceUrl || item.museumUrl || item.authorUrl);
  $('detail-source').hidden = !url; if (url) $('detail-source').href = url;
  $('detail-source').textContent = category === 'sport' ? '访问球队或赛事官网 ↗' : category === 'poems' ? '阅读原始来源 ↗' : '前往作品来源 ↗';
  updateSaveButton();
  if (!details.open) {
    detailTrigger = document.activeElement === document.body ? $('world-canvas') : document.activeElement;
    details.showModal();
  }
}
function updateSaveButton() {
  if (!selected) return;
  const saved = curation.has(selected.item.id);
  $('save-item').textContent = saved ? '已收入展览 · 移除 −' : '收入我的展览 ＋';
  $('save-item').setAttribute('aria-pressed', String(saved));
}
function updateSaved() {
  if (!$('saved-count')) return;
  const items = curation.getItems(); $('saved-count').textContent = items.length;
  $('curation-toggle').setAttribute('aria-label', `查看我的展览，已收集${items.length}件`);
  updateSaveButton();
  if (current?.id === 'curate') {
    renderCatalogue();
    updatePoster(current);
  }
  if (world && current?.id === 'curate') world.interact('refresh', items);
}
function fillExhibition() {
  const saved = curation.getItems();
  const photoCount = saved.filter(item => item.category === 'photo').length;
  const otherRooms = collections.filter(room => room.id !== 'photo' && room.id !== 'curate');
  for (const [rooms, count] of [[[roomOf('photo')], PHOTO_LIMIT - photoCount], [otherRooms, NON_PHOTO_LIMIT - (saved.length - photoCount)]]) {
    const available = rooms.flatMap(room => room.items.filter(item => !curation.has(item.id, room.id)));
    for (let index = 0; index < count && available.length > 0; index++) {
      const [item] = available.splice(Math.floor(Math.random() * available.length), 1);
      curation.toggle(item, item.category);
    }
  }
  roomTab('catalogue', true);
  toast(saved.length === curation.getItems().length ? '展览已满。' : '已补齐展品。');
}
function setupEvents() {
  try {
    const draft = JSON.parse(localStorage.getItem('night-world-label') || '{}');
    if (typeof draft.title === 'string') $('exhibition-title').value = draft.title;
    if (typeof draft.subtitle === 'string') $('exhibition-subtitle').value = draft.subtitle;
  } catch { /* The exhibition stays usable when storage is unavailable. */ }
  for (const field of ['exhibition-title', 'exhibition-subtitle']) $(field).addEventListener('input', () => {
    try { localStorage.setItem('night-world-label', JSON.stringify({ title: $('exhibition-title').value, subtitle: $('exhibition-subtitle').value })); } catch { /* In-memory editing remains available. */ }
  });
  $('map-toggle').addEventListener('click', () => atlas.showModal());
  document.querySelector('.skip-link').addEventListener('click', event => {
    event.preventDefault();
    $('room-nav').focus();
  });
  $('curation-toggle').addEventListener('click', () => showRoom('curate', true, true));
  for (const id of ['start-explore', 'featured-link']) $(id).addEventListener('click', event => linkedRoom(event, 'photo'));
  for (const link of [$('room-back'), document.querySelector('.brand')]) link.addEventListener('click', event => linkedRoom(event, null));
  $('reset-view').addEventListener('click', () => world?.focus(current?.id || null));
  $('zoom-in').addEventListener('click', () => world?.zoom(0.85));
  $('zoom-out').addEventListener('click', () => world?.zoom(1.18));
  const tabs = ['operate', 'catalogue'];
  for (const name of tabs) {
    const tab = $(name + '-tab');
    tab.addEventListener('click', () => roomTab(name));
    tab.addEventListener('keydown', event => {
      if (document.documentElement.dataset.scene === 'fallback' || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      roomTab(event.key === 'Home' ? 'operate' : event.key === 'End' ? 'catalogue' : tabs.find(id => id !== name), true);
    });
  }
  $('collection-search').addEventListener('input', () => { catalogueLimit = 40; renderCatalogue(); });
  $('random-item').addEventListener('click', () => reveal(randomIndex()));
  document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => $(button.dataset.close).close()));
  [atlas, details].forEach(dialog => dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
  }));
  details.addEventListener('close', () => {
    const trigger = detailTrigger?.isConnected ? detailTrigger : $(current ? 'room-title' : 'start-explore');
    trigger.focus({ preventScroll: true });
  });
  $('detail-prev').addEventListener('click', () => paginateDetail(-1)); $('detail-next').addEventListener('click', () => paginateDetail(1));
  $('save-item').addEventListener('click', () => {
    if (!selected) return;
    const before = curation.has(selected.item.id);
    const result = curation.toggle(selected.item, selected.category);
    const after = curation.has(selected.item.id);
    if (before === after) toast(result?.message || result?.error || '展览最多七件，其中照片最多三张，其他作品最多四件。');
    else toast(after ? '已收入展览。' : '已从这场展览移除。');
    updateSaved();
  });
  $('curation-form').addEventListener('submit', async event => {
    event.preventDefault(); const button = $('export-png'); button.disabled = true; button.textContent = '正在装裱这场展览…';
    try {
      const result = await curation.exportPNG({ title: $('exhibition-title').value.trim() || '我的小展览', subtitle: $('exhibition-subtitle').value.trim() });
      toast(result?.missingImages?.length ? '海报已保存，部分图片未载入，已保留作品题名。' : '展览海报已保存。');
    }
    catch (error) { console.error('Poster export:', error); toast('海报没有保存成功，请稍后再试。'); }
    finally { button.textContent = '保存展览海报 ↓'; button.disabled = !curation.getItems().length; }
  });
  $('world-canvas').addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); world?.rotate(event.key === 'ArrowLeft' ? -0.15 : 0.15); }
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === '+' || event.key === '-') { event.preventDefault(); world?.zoom(event.key === 'ArrowUp' || event.key === '+' ? 0.9 : 1.1); }
    if (event.key === 'Enter' && !current) showRoom('photo');
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !details.open && !atlas.open && current) { showRoom(null); $('map-toggle').focus(); }
    if (details.open && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      if (event.key === 'ArrowLeft') { event.preventDefault(); paginateDetail(-1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); paginateDetail(1); }
    }
  });
  const syncRoute = () => {
    const id = location.hash.slice(1);
    if (!id || id === 'world') showRoom(null, false);
    else if (roomOf(id)) showRoom(id, false);
    else showRoom(null, false);
  };
  window.addEventListener('popstate', syncRoute);
  window.addEventListener('hashchange', syncRoute);
  window.addEventListener('pagehide', event => { if (!event.persisted) world?.dispose(); });
  document.addEventListener('world:context-lost', () => useFallback('三维画面已中断。馆藏仍可浏览。'));
  document.addEventListener('world:room-error', () => useFallback('这处展品暂时无法在三维场景中打开。馆藏仍可浏览。', true));
}
function useFallback(message, keepWorld = false) {
  if (!keepWorld) {
    world?.dispose();
    world = null;
  }
  const root = document.documentElement;
  root.classList.remove('scene-visible');
  root.dataset.scene = 'fallback';
  $('world-canvas').tabIndex = -1;
  $('world-loading').textContent = message;
  $('world-loading').hidden = false;
  if (current) roomTab('catalogue');
}
function paginateDetail(direction) {
  if (!selected) return;
  const room = roomOf(selected.category); const next = (selected.index + direction + room.items.length) % room.items.length;
  if (current?.id === room.id) world?.interact('select', next);
  openDetail(room.id, next);
}

async function start() {
  collections = await loadCollection();
  buildNavigation(); setupEvents(); updateSaved();
  $('world-canvas').tabIndex = -1;
  const id = location.hash.slice(1);
  if (roomOf(id)) showRoom(id, false);
  try {
    const { createWorld } = await import('./engine.js?v=18');
    world = createWorld({ canvas: $('world-canvas'), collections,
      onRoom: id => showRoom(id, true, true),
      onSelect: (id, index) => openDetail(id, index),
      onStatus: showModelStatus,
      onControlHover: showControlHover,
      onControlPositions: projectControls,
      shouldProjectControls: () => pinsVisible,
      getCuratedItems: () => curation.getItems(),
      onMoveCurated: (id, target) => {
        const index = curation.getItems().findIndex(item => item.id === id);
        return index >= 0 && curation.move(id, target - index);
      },
      onCurationRequest: () => { if (!atlas.open) atlas.showModal(); },
      onPending: () => {
        $('world-canvas').tabIndex = -1;
        document.documentElement.classList.remove('scene-visible');
      },
      onReady: () => {
        $('world-loading').hidden = true;
        $('world-canvas').tabIndex = 0;
        document.documentElement.classList.add('scene-visible');
        refreshModelControls();
      },
    });
    if (current) {
      world.focus(current.id, true);
      if (details.open && selected?.category === current.id) world.interact('select', selected.index);
    }
    window.worldDiagnostics = () => world && ({ ...world.getStats(), controls: world.getControls(), categories: collections.map(room => ({ id: room.id, count: room.items.length })) });
  } catch (error) {
    console.warn('The gallery is using its catalogue view:', error.message);
    useFallback('当前设备无法展开三维画面。请选择展区浏览馆藏。');
  }
}
start().catch(error => {
  console.error('Collection startup:', error);
  useFallback('馆藏暂时无法读取。可以先返回普通版。');
});
