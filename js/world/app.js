import { loadCollection } from './collection.js?v=2';
import { createCuration } from './curation.js?v=3';
import { EXPERIENCE_GUIDE } from './experience-guide.js?v=2';
import { resolveSiteAsset } from './paths.js?v=1';

const $ = id => document.getElementById(id);
const shortNames = { photo: '摄影', books: '书籍', poems: '诗歌', paintings: '绘画', music: '音乐', sport: '体育', series: '剧集', films: '电影', games: '游戏', curate: '策展' };
let collections = [], world = null, current = null, selected = null, detailTrigger = null, toastTimer;
let catalogueLimit = 40, night = false;
const visited = new Set();
const actionState = new Map();
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
function showRoom(id, updateHash = true) {
  if (id && !roomOf(id)) return;
  if (updateHash) {
    const hash = id ? `#${id}` : '#';
    if (location.hash !== hash) history.pushState(null, '', hash);
  }
  if (world) world.focus(id);
  else renderRoom(id);
}
function renderRoom(id) {
  current = id ? roomOf(id) : null;
  document.documentElement.dataset.world = current ? 'room' : 'overview';
  $('room-panel').hidden = !current;
  document.querySelectorAll('.dock-item').forEach(button => {
    if (button.dataset.room === id) button.setAttribute('aria-current', 'location');
    else button.removeAttribute('aria-current');
  });
  if (!current) { $('view-coordinates').textContent = '十件装置 · 由你亲手改变'; showControlHover(null); return; }
  visited.add(id);
  document.querySelector(`[data-room="${id}"]`)?.classList.add('is-visited');
  $('room-english').textContent = `${String(collections.indexOf(current) + 1).padStart(2, '0')} / ${current.subtitle || current.english}`;
  $('room-title').textContent = current.title;
  $('room-description').textContent = current.description;
  $('room-hint').textContent = current.interaction;
  $('view-coordinates').textContent = `${current.title} · ${visited.size} / 10 件已探索`;
  $('collection-search').value = ''; catalogueLimit = 40;
  $('room-panel').scrollTop = 0;
  $('curation-form').hidden = id !== 'curate';
  $('random-item').hidden = id === 'curate';
  document.querySelector('.search-wrap').hidden = id === 'curate';
  renderActions(); renderCatalogue();
  controlSignature = ''; refreshModelControls();
  if (id === 'curate') world?.interact('refresh', curation.getItems());
}
function buildNavigation() {
  collections.forEach((room, index) => {
    const number = String(index + 1).padStart(2, '0');
    const dock = el('button', 'dock-item'); dock.type = 'button'; dock.dataset.room = room.id;
    dock.setAttribute('aria-label', `${shortNames[room.id]} · ${room.title}`);
    dock.append(el('span', 'dock-number', number), el('span', '', shortNames[room.id]));
    dock.addEventListener('click', () => showRoom(room.id)); $('dock-items').append(dock);
    const button = el('button', 'atlas-item'); button.type = 'button';
    const copy = el('span'); copy.append(el('strong', '', room.title), el('small', '', room.english));
    button.append(el('span', '', number), copy, el('span', '', '↗'));
    button.addEventListener('click', () => { atlas.close(); showRoom(room.id); });
    $('atlas-list').append(button);
  });
}
function action(text, callback, toggle = false) {
  const button = el('button', 'room-action', text); button.type = 'button';
  const key = `${current.id}:${text}`;
  if (toggle) {
    const pressed = actionState.get(key) === true;
    button.setAttribute('aria-pressed', String(pressed));
    if (pressed && text === '落下唱针') button.textContent = '抬起唱针';
    if (pressed && text === '启动放映机') button.textContent = '暂停放映机';
  }
  button.addEventListener('click', () => {
    callback(button);
    if (toggle) actionState.set(key, button.getAttribute('aria-pressed') === 'true');
  });
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
  if (current.id === 'curate') action('填入七件作品', surpriseExhibition);
}
function refreshModelControls() {
  const container = $('model-controls'); if (!container || !current) return;
  const controls = (world?.getControls?.() || []).sort((a, b) => Number(b.draggable) - Number(a.draggable));
  const signature = current.id + ':' + controls.map(c => c.id).join('|');
  if (signature === controlSignature) return;
  controlSignature = signature; container.replaceChildren(); $('model-pins').replaceChildren(); pinNodes.clear();
  controls.forEach((control, index) => {
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
    container.append(row);
    const pin = el('button', 'mechanism-pin'); pin.type = 'button';
    pin.setAttribute('aria-label', '操作' + control.label);
    pin.append(el('span', '', String(index + 1).padStart(2, '0')), el('small', '', control.label));
    pin.addEventListener('click', () => world?.activateControl(control.id));
    $('model-pins').append(pin); pinNodes.set(control.id, { row, pin });
  });
  if (!controls.length) container.append(el('p', 'model-controls-empty', '先把指针移到模型上，寻找可以拖动的部件。'));
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
  $('model-status').textContent = message; $('model-scene-status').textContent = message;
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
  button.addEventListener('click', () => { world?.interact('select', index); openDetail(category, index); });
  return button;
}
function renderCatalogue() {
  if (!current) return;
  const container = $('catalogue-items'); container.replaceChildren();
  if (current.id === 'curate') {
    const items = curation.getItems(); $('catalogue-count').textContent = `已收集 ${items.length} / 7 件`;
    if (!items.length) container.append(el('p', 'empty-message', '展亭正等着你的第一件作品。走进任意一座岛，把喜欢的照片、文字或声音收入展览。'));
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
  $('catalogue-count').textContent = query ? `找到 ${filtered.length} / ${current.items.length} 件` : `${current.items.length} 件真实馆藏`;
  filtered.slice(0, catalogueLimit).forEach(({ item, index }) => container.append(itemButton(item, current.id, index)));
  if (!filtered.length) container.append(el('p', 'empty-message', '这座岛上暂时没有找到这件作品，试试作品名或作者。'));
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
    image.tabIndex = 0; image.setAttribute('role', 'button'); image.setAttribute('aria-label', '放大或还原作品图像');
    const toggle = () => { const zoomed = visual.classList.toggle('is-zoomed'); image.setAttribute('aria-pressed', String(zoomed)); };
    image.addEventListener('click', toggle); image.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle(); } });
    visual.append(image);
  } else visual.append(el('div', 'typographic-work', item.title));
  const description = $('detail-description'); description.replaceChildren();
  if (item.description) description.append(el('p', '', item.description));
  if (item.stanzas) item.stanzas.forEach(stanza => description.append(el('p', 'stanza', Array.isArray(stanza) ? stanza.join('\n') : String(stanza))));
  if (item.note && item.note !== item.description) description.append(el('p', '', item.note));
  const url = safeURL(item.url || item.sourceUrl || item.museumUrl || item.authorUrl);
  $('detail-source').hidden = !url; if (url) $('detail-source').href = url;
  $('detail-source').textContent = category === 'music' ? '在网易云音乐聆听 ↗' : category === 'sport' ? '访问球队或赛事官网 ↗' : category === 'poems' ? '阅读原始来源 ↗' : '前往作品来源 ↗';
  updateSaveButton();
  if (!details.open) { detailTrigger = document.activeElement; details.showModal(); }
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
  updateSaveButton(); if (current?.id === 'curate') renderCatalogue();
  if (world && current?.id === 'curate') world.interact('refresh', items);
}
function surpriseExhibition() {
  curation.clear();
  const photo = roomOf('photo'); const shuffled = [...photo.items].sort(() => Math.random() - 0.5).slice(0, 3);
  shuffled.forEach(item => curation.toggle(item, 'photo'));
  for (const id of ['books', 'paintings', 'films', 'music']) {
    const room = roomOf(id); if (room.items.length) curation.toggle(room.items[Math.floor(Math.random() * room.items.length)], id);
  }
  world?.interact('refresh', curation.getItems()); toast('七件作品已经就位。这场展览属于你。');
}
function setupEvents() {
  const touchLayout = matchMedia('(max-width: 760px)');
  const updateGesture = () => { $('gesture-zoom').textContent = touchLayout.matches ? '点按 ＋/− 缩放' : '滚轮靠近'; };
  touchLayout.addEventListener('change', updateGesture); updateGesture();
  try {
    const draft = JSON.parse(localStorage.getItem('night-world-label') || '{}');
    if (typeof draft.title === 'string') $('exhibition-title').value = draft.title;
    if (typeof draft.subtitle === 'string') $('exhibition-subtitle').value = draft.subtitle;
  } catch { /* The exhibition stays usable when storage is unavailable. */ }
  for (const field of ['exhibition-title', 'exhibition-subtitle']) $(field).addEventListener('input', () => {
    try { localStorage.setItem('night-world-label', JSON.stringify({ title: $('exhibition-title').value, subtitle: $('exhibition-subtitle').value })); } catch { /* In-memory editing remains available. */ }
  });
  $('map-toggle').addEventListener('click', () => atlas.showModal());
  $('start-explore').addEventListener('click', () => showRoom('photo'));
  $('room-back').addEventListener('click', () => showRoom(null));
  $('reset-view').addEventListener('click', () => showRoom(null));
  document.querySelector('.brand').addEventListener('click', event => { event.preventDefault(); showRoom(null); });
  $('curation-toggle').addEventListener('click', () => showRoom('curate'));
  $('zoom-in').addEventListener('click', () => world?.zoom(0.85)); $('zoom-out').addEventListener('click', () => world?.zoom(1.18));
  $('collection-search').addEventListener('input', () => { catalogueLimit = 40; renderCatalogue(); });
  $('random-item').addEventListener('click', () => reveal(randomIndex()));
  $('day-toggle').addEventListener('click', () => {
    night = !night; document.documentElement.dataset.light = night ? 'moon' : 'day'; world?.setNight(night);
    $('day-toggle').setAttribute('aria-pressed', String(night)); $('day-toggle').setAttribute('aria-label', night ? '切换为日光' : '切换为月光');
    $('day-toggle').querySelector('span').textContent = night ? '月光' : '日光';
  });
  document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => $(button.dataset.close).close()));
  [atlas, details].forEach(dialog => dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
  }));
  details.addEventListener('close', () => { if (detailTrigger?.isConnected) detailTrigger.focus({ preventScroll: true }); });
  $('detail-prev').addEventListener('click', () => paginateDetail(-1)); $('detail-next').addEventListener('click', () => paginateDetail(1));
  $('save-item').addEventListener('click', () => {
    if (!selected) return;
    const before = curation.has(selected.item.id);
    const result = curation.toggle(selected.item, selected.category);
    const after = curation.has(selected.item.id);
    if (before === after) toast(result?.message || result?.error || '展览最多七件，其中照片最多三张，其他作品最多四件。');
    else toast(after ? '已收入展览，继续在群岛寻找下一件。' : '已从这场展览移除。');
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
  window.addEventListener('popstate', () => showRoom(roomOf(location.hash.slice(1))?.id || null, false));
  window.addEventListener('pagehide', event => { if (!event.persisted) world?.dispose(); });
  document.addEventListener('world:context-lost', () => {
    $('world-loading').hidden = false; $('world-loading').querySelector('span:last-of-type').textContent = '三维画面暂时休息了，请刷新页面或返回普通版。';
  });
}
function paginateDetail(direction) {
  if (!selected) return;
  const room = roomOf(selected.category); const next = (selected.index + direction + room.items.length) % room.items.length;
  world?.interact('select', next); openDetail(room.id, next);
}

async function start() {
  collections = await loadCollection();
  collections.forEach(room => Object.assign(room, EXPERIENCE_GUIDE[room.id] || {}));
  buildNavigation(); setupEvents(); updateSaved();
  try {
    const { createWorld } = await import('./engine.js?v=16');
    world = createWorld({ canvas: $('world-canvas'), labelRoot: $('island-labels'), collections,
      onRoom: id => {
        renderRoom(id);
        const target = id ? `#${id}` : '#';
        if (location.hash !== target) history.replaceState(null, '', target);
      },
      onSelect: (id, index) => openDetail(id, index),
      onStatus: showModelStatus,
      onControlHover: showControlHover,
      onControlPositions: projectControls,
      getCuratedItems: () => curation.getItems(),
      onMoveCurated: (id, target) => {
        const index = curation.getItems().findIndex(item => item.id === id);
        return index >= 0 && curation.move(id, target - index);
      },
      onCurationRequest: () => { if (!atlas.open) atlas.showModal(); },
      onReady: () => { $('world-loading').hidden = true; document.documentElement.classList.add('world-ready'); },
    });
    // Read-only diagnostics are useful when verifying rendering budgets in the browser.
    window.worldDiagnostics = () => ({ ...world.getStats(), controls: world.getControls(), categories: collections.map(r => ({ id: r.id, count: r.items.length })), visited: [...visited] });
  } catch (error) {
    console.error('The 3D collection could not start:', error);
    $('world-loading').querySelector('span:last-of-type').textContent = '当前设备未能展开三维画面。仍可从下方目录浏览全部收藏。';
    $('world-loading').classList.add('has-error');
  }
  const id = location.hash.slice(1); if (roomOf(id)) showRoom(id, false);
}
start().catch(error => {
  console.error('Collection startup:', error);
  $('world-loading').querySelector('span:last-of-type').textContent = '馆藏暂时没有展开，可以先返回普通版。';
});
