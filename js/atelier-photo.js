/* A private photographic contact sheet. Original frame nodes stay intact for
   the shared lightbox and the curator desk. */
(function () {
  'use strict';

  const host = document.getElementById('photo-deck');
  if (!host) return;

  const frames = Array.from(host.querySelectorAll('.photo-frame'));
  if (!frames.length) return;

  const groups = {
    CITY: 'City',
    LAND: 'Nature',
    NIGHT: 'Night',
    WINTER: 'Winter',
  };
  const categoryOf = frame => groups[frame.dataset.act] ? frame.dataset.act : 'LAND';
  const data = frames.map((frame, index) => {
    const image = frame.querySelector('img');
    const caption = frame.querySelector('.photo-frame-text');
    const cap = frame.querySelector('.photo-frame-cap');
    if (!image || !caption || !cap) return null;

    const category = categoryOf(frame);
    image.dataset.rail = image.getAttribute('src') || '';
    image.draggable = false;
    cap.classList.remove('sr-only');
    frame.dataset.folioCategory = groups[category];

    return {
      index,
      id: frame.dataset.photoIndex,
      title: caption.textContent.trim(),
      alt: image.alt,
      thumb: image.getAttribute('src'),
      src: image.dataset.full || image.getAttribute('src'),
      width: Number(image.getAttribute('width')) || image.naturalWidth || 1600,
      height: Number(image.getAttribute('height')) || image.naturalHeight || 1067,
      category,
      categoryLabel: groups[category],
      fresh: Boolean(frame.dataset.new),
    };
  });

  if (data.some(item => !item)) return;

  let active = data.findIndex(item => item.title === 'The last red light');
  if (active < 0) active = 0;
  let filter = 'ALL';
  let mode = 'contact';
  let refreshFrame = 0;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const kept = () => (window.CuratorDesk?.photoIds() || []).map(String);

  host.classList.add('atelier-photo', 'folio-photo');
  host.dataset.view = mode;
  host.setAttribute('aria-label', 'Photography, ' + frames.length + ' photographs');
  host.innerHTML = `
    <div class="photo-room-bar">
      <div class="photo-room-tabs" role="group" aria-label="Photo viewing mode">
        <button type="button" data-view="contact" aria-pressed="true">Contact sheet</button>
        <button type="button" data-view="all" aria-pressed="false">All frames <span data-total>${frames.length}</span></button>
      </div>
      <button type="button" class="photo-surprise" data-surprise>Random frame <span aria-hidden="true">↗</span></button>
    </div>
    <div class="photo-routes" role="group" aria-label="Filter photographs"></div>
    <div class="photo-contact" data-photo-contact>
      <div class="photo-feature">
        <div class="photo-feature__stage" data-photo-feature></div>
        <div class="photo-feature__panel">
          <div class="photo-feature__identity">
            <p class="photo-current-category"></p>
            <h3 class="photo-current-title" id="photo-current-title"></h3>
          </div>
          <div class="photo-feature__controls">
            <div class="photo-turns">
              <button type="button" data-step="-1" aria-label="Previous photograph">←</button>
              <span class="photo-position" aria-hidden="true"></span>
              <button type="button" data-step="1" aria-label="Next photograph">→</button>
            </div>
            <div class="photo-feature__actions">
              <button type="button" class="photo-look" data-open>View full frame</button>
              <button type="button" class="photo-keep" data-keep>Add photo</button>
              <a class="curator-collect-link" href="#curate">Visit desk →</a>
            </div>
          </div>
        </div>
      </div>
      <section class="photo-contact-directory" aria-labelledby="photo-directory-title">
        <div class="photo-directory-head">
          <p id="photo-directory-title">Contact sheet <span data-directory-count></span></p>
          <div class="photo-directory-scroll" role="group" aria-label="Scroll contact sheet">
            <button type="button" data-scroll="-1" aria-label="Previous contact prints">←</button>
            <button type="button" data-scroll="1" aria-label="Next contact prints">→</button>
          </div>
        </div>
        <div class="photo-contact-rail" data-contact-rail aria-label="Photograph contact prints"></div>
      </section>
    </div>
    <div class="photo-index" data-photo-index-view hidden>
      <div class="photo-index-heading">
        <p>All frames</p>
        <p data-index-summary></p>
      </div>
      <div class="photo-index-grid" data-photo-grid aria-label="Complete photograph index"></div>
    </div>
    <p class="sr-only photo-live" role="status" aria-live="polite"></p>`;

  const contact = host.querySelector('[data-photo-contact]');
  const indexView = host.querySelector('[data-photo-index-view]');
  const featureStage = host.querySelector('[data-photo-feature]');
  const frameGrid = host.querySelector('[data-photo-grid]');
  const contactRail = host.querySelector('[data-contact-rail]');
  const routeBar = host.querySelector('.photo-routes');
  const live = host.querySelector('.photo-live');
  const keepButton = host.querySelector('[data-keep]');
  const currentCategory = host.querySelector('.photo-current-category');
  const currentTitle = host.querySelector('.photo-current-title');
  const position = host.querySelector('.photo-position');
  const directoryCount = host.querySelector('[data-directory-count]');
  const indexSummary = host.querySelector('[data-index-summary]');
  const scrollBack = host.querySelector('[data-scroll="-1"]');
  const scrollForward = host.querySelector('[data-scroll="1"]');
  const visit = host.querySelector('.curator-collect-link');

  const detailInfo = document.getElementById('lb-photo-info');
  detailInfo?.querySelectorAll(':scope > .photo-detail-keep, :scope > .photo-detail-story-status')
    .forEach(node => node.remove());
  const detailKeep = detailInfo ? document.createElement('button') : null;
  const detailStatus = document.createElement('p');
  detailStatus.className = 'photo-detail-story-status';
  detailStatus.setAttribute('role', 'status');
  if (detailKeep) {
    detailKeep.type = 'button';
    detailKeep.className = 'photo-keep photo-detail-keep';
    detailInfo.append(detailKeep, detailStatus);
  }

  const contactButtons = new Map();
  const filterButtons = new Map();
  frameGrid.setAttribute('role', 'list');
  frames.forEach(frame => frame.setAttribute('role', 'listitem'));
  const announce = value => { live.textContent = value; };
  const behavior = () => reduced.matches ? 'auto' : 'smooth';
  const schedule = delay => window.scheduleRefresh?.(delay);
  const matching = () => data
    .filter(item => filter === 'ALL' || (filter === 'NEW' ? item.fresh : item.category === filter))
    .map(item => item.index);

  function makeButton(label, className) {
    const node = document.createElement('button');
    node.type = 'button';
    node.textContent = label;
    if (className) node.className = className;
    return node;
  }

  [['ALL', 'All'], ...Object.entries(groups), ['NEW', 'New']].forEach(([key, label]) => {
    const count = data.filter(item => key === 'ALL' || (key === 'NEW' ? item.fresh : item.category === key)).length;
    if (!count) return;

    const node = makeButton('', 'photo-route');
    node.dataset.route = key;
    node.setAttribute('aria-pressed', String(key === filter));
    const name = document.createElement('span');
    name.textContent = label;
    const total = document.createElement('small');
    total.textContent = String(count);
    node.append(name, total);
    node.addEventListener('click', () => setFilter(key));
    routeBar.append(node);
    filterButtons.set(key, node);
  });

  data.forEach(item => {
    const card = document.createElement('div');
    card.className = 'photo-contact-item';
    card.setAttribute('role', 'listitem');
    const node = makeButton('', 'photo-contact-thumb');
    node.dataset.photoSelect = String(item.index);
    node.setAttribute('aria-label', item.title);
    node.title = item.alt;

    const image = document.createElement('img');
    image.src = item.thumb;
    image.alt = '';
    image.width = item.width;
    image.height = item.height;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.draggable = false;

    const caption = document.createElement('span');
    caption.className = 'photo-contact-thumb__title';
    caption.textContent = item.title;
    node.append(image, caption);
    if (item.fresh) {
      const mark = document.createElement('small');
      mark.textContent = 'New';
      node.append(mark);
    }

    card.append(node);
    contactRail.append(card);
    contactButtons.set(item.index, { card, node });
  });
  contactRail.setAttribute('role', 'list');

  function mountActiveFrame() {
    const frame = frames[active];
    if (!frame) return;
    const previous = featureStage.firstElementChild;
    if (previous && previous !== frame) {
      frameGrid.append(previous);
      previous.hidden = !matching().includes(Number(previous.dataset.photoIndex));
    }
    if (frame.parentElement !== featureStage) featureStage.append(frame);
    frame.hidden = false;
    frame.querySelector('img').loading = 'eager';
  }

  function restoreFrameGrid() {
    frameGrid.append(...data.map(item => frames[item.index]));
  }

  function updateRailButtons() {
    const max = contactRail.scrollWidth - contactRail.clientWidth;
    scrollBack.disabled = max <= 1 || contactRail.scrollLeft <= 1;
    scrollForward.disabled = max <= 1 || contactRail.scrollLeft >= max - 1;
  }

  function revealContact(index, focus) {
    const entry = contactButtons.get(index);
    if (!entry) return;
    requestAnimationFrame(() => {
      const railBox = contactRail.getBoundingClientRect();
      const itemBox = entry.card.getBoundingClientRect();
      if (itemBox.left < railBox.left || itemBox.right > railBox.right) {
        const left = itemBox.left - railBox.left - (railBox.width - itemBox.width) / 2;
        contactRail.scrollBy({ left, behavior: behavior() });
      }
      if (focus === 'contact') entry.node.focus({ preventScroll: true });
      updateRailButtons();
    });
  }

  function renderKeepButton(control, index) {
    if (!control) return;
    const selected = kept();
    const added = selected.includes(String(index));
    const full = selected.length === 3;
    const ready = Boolean(window.CuratorDesk);
    const label = added ? 'Added' : full ? 'Photos full' : 'Add photo';

    const text = document.createElement('span');
    text.textContent = label;
    const count = document.createElement('small');
    count.textContent = selected.length + '/3';
    control.replaceChildren(text, count);
    control.disabled = !ready || window.CuratorDesk.busy() || added || full;
    control.setAttribute('aria-label', label + ' (' + selected.length + ' of 3 photographs)');
    control.title = added
      ? 'This photograph is in your exhibition'
      : full
        ? 'Change a photograph at the desk'
        : 'Add this photograph to your exhibition';
  }

  function syncDetailKeep() {
    if (!detailKeep) return;
    const index = typeof detailType !== 'undefined' && detailType === 'photo' ? lbIndex : active;
    renderKeepButton(detailKeep, index);
  }

  function renderSelection(announceChange) {
    const indices = matching();
    if (!indices.length) return;
    if (!indices.includes(active)) active = indices[0];

    if (mode === 'contact') mountActiveFrame();
    const selected = new Set(kept());
    data.forEach(item => {
      const frame = frames[item.index];
      const button = frame.querySelector('.photo-frame-btn');
      const isActive = item.index === active;
      frame.classList.toggle('is-featured', isActive);
      frame.classList.toggle('is-kept', selected.has(String(item.index)));
      button.classList.toggle('photo-feature__button', mode === 'contact' && isActive);
      if (isActive) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');

      const entry = contactButtons.get(item.index);
      if (isActive) entry.node.setAttribute('aria-current', 'true');
      else entry.node.removeAttribute('aria-current');
    });

    const item = data[active];
    currentCategory.textContent = item.categoryLabel;
    currentTitle.textContent = item.title;
    position.textContent = String(indices.indexOf(active) + 1) + ' / ' + String(indices.length);
    directoryCount.textContent = String(indices.length);
    indexSummary.textContent = String(indices.length) + (indices.length === 1 ? ' photograph' : ' photographs');
    renderKeepButton(keepButton, active);
    syncDetailKeep();
    updateRailButtons();
    if (announceChange) announce(item.title + '. Photograph ' + (indices.indexOf(active) + 1) + ' of ' + indices.length + '.');
  }

  function layout() {
    const indices = matching();
    const matched = new Set(indices);
    if (!indices.includes(active)) active = indices[0];

    contact.hidden = mode !== 'contact';
    indexView.hidden = mode !== 'all';
    host.dataset.view = mode;
    host.querySelectorAll('[data-view]').forEach(node => {
      node.setAttribute('aria-pressed', String(node.dataset.view === mode));
    });
    data.forEach(item => {
      frames[item.index].hidden = !matched.has(item.index);
      contactButtons.get(item.index).card.hidden = !matched.has(item.index);
    });

    restoreFrameGrid();
    if (mode === 'contact') mountActiveFrame();

    Object.entries({ ALL: 'All', ...groups, NEW: 'New' }).forEach(([key, label]) => {
      filterButtons.get(key)?.setAttribute('aria-pressed', String(filter === key));
    });
    renderSelection(false);
    requestAnimationFrame(updateRailButtons);
    schedule(140);
  }

  function select(index, options) {
    const next = Number(index);
    if (!data[next]) return;
    const indices = matching();
    if (!indices.includes(next)) return;

    const settings = options || {};
    active = next;
    if (mode === 'contact') mountActiveFrame();
    renderSelection(settings.announce !== false);
    if (mode === 'contact' && settings.reveal !== false) revealContact(active, settings.focus);
    if (settings.focus === 'feature') {
      requestAnimationFrame(() => featureStage.querySelector('.photo-frame-btn')?.focus({ preventScroll: true }));
    }
    schedule(120);
  }

  function step(direction, focus) {
    const indices = matching();
    if (!indices.length) return;
    const current = Math.max(0, indices.indexOf(active));
    const next = indices[(current + direction + indices.length) % indices.length];
    select(next, { focus });
  }

  function setFilter(key) {
    if (!filterButtons.has(key)) return;
    filter = key;
    const indices = matching();
    if (!indices.includes(active)) active = indices[0];
    filterButtons.forEach((node, value) => node.setAttribute('aria-pressed', String(value === filter)));
    layout();
    announce((filter === 'ALL' ? 'All photographs' : filterButtons.get(filter).querySelector('span').textContent) + '. ' + indices.length + ' visible.');
  }

  function setMode(next) {
    if (next !== 'contact' && next !== 'all') return;
    mode = next;
    layout();
    announce(mode === 'contact' ? 'Contact sheet view.' : 'All frames view. ' + matching().length + ' photographs visible.');
  }

  host.querySelectorAll('[data-view]').forEach(node => {
    node.addEventListener('click', () => setMode(node.dataset.view));
  });
  host.querySelector('[data-surprise]').addEventListener('click', () => {
    const indices = matching().filter(index => index !== active);
    const next = indices[Math.floor(Math.random() * indices.length)];
    select(next == null ? active : next);
  });
  host.querySelectorAll('[data-step]').forEach(node => {
    node.addEventListener('click', () => step(Number(node.dataset.step)));
  });
  host.querySelector('[data-open]').addEventListener('click', event => {
    if (typeof openDetail === 'function') openDetail('photo', active, event.currentTarget);
  });
  [scrollBack, scrollForward].forEach(node => {
    node.addEventListener('click', () => {
      const width = Math.max(180, contactRail.clientWidth * .72);
      contactRail.scrollBy({ left: Number(node.dataset.scroll) * width, behavior: behavior() });
    });
  });
  contactRail.addEventListener('scroll', updateRailButtons, { passive: true });

  contactRail.addEventListener('click', event => {
    const node = event.target.closest('[data-photo-select]');
    if (!node) return;
    const index = Number(node.dataset.photoSelect);
    if (event.detail === 0 || index === active) {
      if (typeof openDetail === 'function') openDetail('photo', index, node);
      return;
    }
    select(index);
  });

  contactRail.addEventListener('keydown', event => {
    const node = event.target.closest('[data-photo-select]');
    if (!node) return;
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const indices = matching();
    const current = indices.indexOf(Number(node.dataset.photoSelect));
    const next = event.key === 'Home'
      ? indices[0]
      : event.key === 'End'
        ? indices[indices.length - 1]
        : indices[(current + (event.key === 'ArrowLeft' ? -1 : 1) + indices.length) % indices.length];
    select(next, { focus: 'contact' });
  });

  featureStage.addEventListener('keydown', event => {
    if (!event.target.closest('.photo-frame-btn')) return;
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const indices = matching();
    const next = event.key === 'Home'
      ? indices[0]
      : event.key === 'End'
        ? indices[indices.length - 1]
        : indices[(indices.indexOf(active) + (event.key === 'ArrowLeft' ? -1 : 1) + indices.length) % indices.length];
    select(next, { focus: 'feature' });
  });

  host.addEventListener('click', event => {
    const frame = event.target.closest('.photo-frame');
    if (!frame || !host.contains(frame)) return;
    const index = Number(frame.dataset.photoIndex);
    if (!data[index] || index === active) return;
    active = index;
    renderSelection(false);
  }, true);

  function addToExhibition(index) {
    if (!data[index] || !window.CuratorDesk?.addPhoto(index)) return;
    const message = 'Photograph added to your exhibition. ' + kept().length + '/3 photographs.';
    announce(message);
    if (detailKeep && typeof detailType !== 'undefined' && detailType === 'photo') {
      detailStatus.textContent = message;
    }
    renderSelection(false);
  }

  visit.addEventListener('click', event => {
    event.preventDefault();
    if (window.CuratorDesk?.visit) window.CuratorDesk.visit();
    else document.getElementById('curate')?.scrollIntoView({ block: 'start', behavior: behavior() });
  });
  keepButton.addEventListener('click', () => addToExhibition(active));
  if (detailKeep) {
    detailKeep.addEventListener('click', () => {
      if (typeof detailType !== 'undefined' && detailType === 'photo') addToExhibition(lbIndex);
    });
    const detailCount = document.getElementById('lb-count');
    if (detailCount) {
      new MutationObserver(() => {
        syncDetailKeep();
        detailStatus.textContent = '';
      }).observe(detailCount, { childList: true, characterData: true, subtree: true });
    }
  }

  ['night:creation-change', 'night:curator-change'].forEach(name => {
    window.addEventListener(name, () => renderSelection(false));
  });

  host.addEventListener('load', event => {
    if (event.target instanceof HTMLImageElement) schedule(180);
  }, true);

  if ('ResizeObserver' in window) {
    const resize = new ResizeObserver(() => {
      cancelAnimationFrame(refreshFrame);
      refreshFrame = requestAnimationFrame(() => {
        updateRailButtons();
        schedule(180);
      });
    });
    resize.observe(host);
    resize.observe(contactRail);
  }

  window.AtelierPhoto = {
    select,
    count: () => frames.length,
    filter: key => setFilter(key),
    view: next => setMode(next),
    returnTarget(index, origin) {
      const next = Number(index);
      if (!matching().includes(next) && data[next]) {
        filter = 'ALL';
        filterButtons.forEach((node, value) => node.setAttribute('aria-pressed', String(value === filter)));
        layout();
      }
      select(next, { announce: false, reveal: false });
      const frame = data[next] ? frames[next] : null;
      const returnedOrigin = origin instanceof Element
        && document.contains(origin)
        && origin.getClientRects().length
        && getComputedStyle(origin).visibility !== 'hidden'
        ? origin
        : null;
      const originImage = returnedOrigin
        ? returnedOrigin.matches('img') ? returnedOrigin : returnedOrigin.querySelector('img')
        : null;
      return {
        image: originImage || frame?.querySelector('img') || null,
        button: returnedOrigin || frame?.querySelector('.photo-frame-btn') || null,
      };
    },
  };

  layout();
})();
