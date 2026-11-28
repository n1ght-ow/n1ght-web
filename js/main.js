/* ============================================================
   N1GHT CHXN9 - interaction layer
   GSAP + ScrollTrigger. All scrub tweens invalidateOnRefresh.
   ============================================================ */

gsap.registerPlugin(ScrollTrigger);

const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
let REDUCED = motionPreference.matches;

/* ---------- smooth scrolling (Lenis, full-motion only) ----------
   Native scroll under reduced motion. Programmatic jumps (anchors) route
   through lenis.scrollTo so the internal value stays in sync. */
let lenis = null;
const tickScroll = (time) => { if (lenis) lenis.raf(time * 1000); };
function syncSmoothScroll() {
  gsap.ticker.remove(tickScroll);
  if (lenis) lenis.destroy();
  lenis = null;
  if (REDUCED || typeof Lenis === "undefined") return;
  lenis = new Lenis({ autoRaf: false });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(tickScroll);
  gsap.ticker.lagSmoothing(0);
  if (isLbOpen || document.querySelector("dialog[open]")) lenis.stop();
}
// isLbOpen is initialized below before the initial scrolling setup.
motionPreference.addEventListener("change", () => {
  REDUCED = motionPreference.matches;
  syncSmoothScroll();
  scheduleRefresh();
});
document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      if (!lenis || e.defaultPrevented) return;
      const target = a.getAttribute("href");
      if (target.length > 1 && document.querySelector(target)) {
        e.preventDefault();
        lenis.scrollTo(target, { duration: 1.4 });
      }
    });
});

/* ---------- helpers ---------- */

// One shared scheduler for full ScrollTrigger.refresh passes: bursts of
// layout-changing events (accordion toggles, image loads, font swaps)
// collapse into a single recalc after the window quiets down.
let refreshTimer = 0;
function scheduleRefresh(delay) {
  if (!window.ScrollTrigger || !window.ScrollTrigger.refresh) return;
  window.clearTimeout(refreshTimer);
  refreshTimer = window.setTimeout(() => {
    // A room exchange temporarily fixes and animates the panel height.
    // Measure only its settled layout, including requests from image loads.
    if (document.querySelector('.is-changing-room')) { scheduleRefresh(100); return; }
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }, delay || 200);
}

/* Gallery entrances and scroll gestures live in atelier modules. */

/* ---------- unified detail layer: photo / film / series / game ----------
   One #lightbox serves every archive type. The photo viewer keeps its frame
   rail; films/series add poster + meta + a Douban link; games add cover + hours
   + quote. Opening, closing, inert, focus trap and swipe are shared. */

const lightbox = document.getElementById("lightbox");
const lbStage = document.getElementById("lb-stage");
const lbImg = document.getElementById("lb-img");
const lbPhotoInfo = document.getElementById("lb-photo-info");
const lbPhotoTitle = document.getElementById("lb-photo-title");
const lbPhotoDescription = document.getElementById("lb-photo-description");
const lbMeta = document.getElementById("lb-meta");
const lbKicker = document.getElementById("lb-kicker");
const lbTitle = document.getElementById("lb-title");
const lbLines = document.getElementById("lb-lines");
const lbQuote = document.getElementById("lb-quote");
const lbLink = document.getElementById("lb-link");
const lbCount = document.getElementById("lb-count");
const lbAct = document.getElementById("lb-act");
const lbCloseBtn = document.getElementById("lb-close");
const lbPrevBtn = document.getElementById("lb-prev");
const lbNextBtn = document.getElementById("lb-next");
const lbRail = document.getElementById("lb-rail");
const lbLive = document.getElementById("lb-live");
const photoFrames = Array.from(document.querySelectorAll(".photo-frame"));

let lbIndex = 0;
let isLbOpen = false;
syncSmoothScroll();
let lbTrigger = null;
let lbThumbs = [];
let detailType = "photo";
let detailItems = [];
let detailMotion = null;
let detailFlight = null;
let detailArrival = null;
let detailSource = null;
let detailFlightState = null;
let detailClosing = false;
let detailAfterClose = null;
let detailPhotoRequest = 0;
let detailPhotoReady = Promise.resolve();
const detailBackdrop = document.createElement('div');
detailBackdrop.className = 'lb-backdrop';
detailBackdrop.setAttribute('aria-hidden', 'true');
lightbox?.prepend(detailBackdrop);

// Bitmap preparation must never hold the viewer controls or Escape hostage.
function detailDecodeWithin(decoded, timeout) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), timeout);
    Promise.resolve(decoded).then(() => {
      clearTimeout(timer); resolve(true);
    }, () => {
      clearTimeout(timer); resolve(false);
    });
  });
}

function stopDetailMotion() {
  if (detailMotion) detailMotion.kill();
  detailMotion = null;
  detailArrival = null;
  if (detailFlight) detailFlight.remove();
  detailFlight = null;
  detailFlightState = null;
  detailSource?.classList.remove('is-viewer-source');
  detailSource = null;
  lbImg?.classList.remove('is-shared-hidden');
  if (lightbox) {
    const layers = [lightbox, detailBackdrop, lightbox.querySelector('.lb-dialog'), lightbox.querySelector('.lb-info')];
    gsap.killTweensOf(layers);
    gsap.set(layers, { clearProps: 'transform,opacity,visibility' });
  }
}

function makeDetailFlight(image, box, preparedCopy) {
  const flight = document.createElement('div');
  flight.className = 'lb-flight';
  flight.setAttribute('aria-hidden', 'true');
  const copy = preparedCopy || document.createElement('img');
  if (!preparedCopy) copy.src = image.currentSrc || image.src;
  copy.alt = '';
  flight.append(copy);
  Object.assign(flight.style, { left: box.left + 'px', top: box.top + 'px', width: box.width + 'px', height: box.height + 'px' });
  lightbox.append(flight);
  detailFlight = flight;
  detailFlightState = { x: 0, y: 0, sx: 1, sy: 1, zoom: 1, width: box.width, height: box.height, left: box.left, top: box.top };
  return flight;
}

// The frame can change aspect ratio; the photograph always scales uniformly.
// Compensate inside the clipping frame so neither the flight nor its handoff
// stretches the image or changes from cover to contain in a single frame.
function paintDetailFlight() {
  if (!detailFlight || !detailFlightState) return;
  const s = detailFlightState;
  // These two layers belong exclusively to this transition. Paint transforms
  // directly instead of allocating CSS tweens or measuring layout per frame.
  detailFlight.style.transform = `translate3d(${s.x}px,${s.y}px,0) scale(${s.sx},${s.sy})`;
  const x = s.width * (s.sx - s.zoom) / (2 * s.sx);
  const y = s.height * (s.sy - s.zoom) / (2 * s.sy);
  detailFlight.firstElementChild.style.transform = `translate3d(${x}px,${y}px,0) scale(${s.zoom / s.sx},${s.zoom / s.sy})`;
}

function photoPrintBox(image) {
  // Spatial prints are rotated; a rectangular shared-element flight would warp them.
  if (image?.closest('.atelier-photo[data-view="wander"]')) return null;
  if (image?.closest('.photo-feature__button') && image.naturalWidth) {
    const box = image.getBoundingClientRect();
    const scale = Math.min(box.width / image.naturalWidth, box.height / image.naturalHeight);
    const width = image.naturalWidth * scale, height = image.naturalHeight * scale;
    const left = box.left + (box.width - width) / 2, top = box.top + (box.height - height) / 2;
    return { left, top, width, height, bottom: top + height };
  }
  const button = image?.closest('.photo-frame-btn');
  if (!button) return image?.getBoundingClientRect();
  const box = button.getBoundingClientRect();
  const style = getComputedStyle(button);
  const px = parseFloat(style.paddingLeft) || 0, py = parseFloat(style.paddingTop) || 0;
  return { left: box.left + px, top: box.top + py, width: box.width - 2 * px, height: box.height - 2 * py, bottom: box.bottom - py };
}

function hideDetailSource(image) {
  detailSource?.classList.remove('is-viewer-source');
  detailSource = image;
  image?.classList.add('is-viewer-source');
}

function detailMedia() {
  return lbImg;
}

async function arriveDetailMedia() {
  const arrival = detailArrival;
  if (!arrival || arrival.preparing || detailClosing || !isLbOpen || REDUCED || !arrival.image.naturalWidth) return;
  arrival.preparing = true;
  const copy = new Image();
  copy.src = arrival.image.currentSrc || arrival.image.src;
  // A new img can be complete before its pixels are decoded. Keep the source
  // visible until the exact bitmap used by the flight is ready to paint.
  if (!await detailDecodeWithin(copy.decode(), 1500)) {
    if (detailArrival === arrival) {
      detailArrival = null;
      fadeDetailPhoto();
    }
    return;
  }
  if (detailArrival !== arrival || detailClosing || !isLbOpen || REDUCED) return;
  detailArrival = null;
  const media = detailMedia();
  const dialog = lightbox.querySelector('.lb-dialog');
  const info = lightbox.querySelector('.lb-info');
  const box = media.getBoundingClientRect();
  if (!box.width || !box.height) { fadeDetailPhoto(); return; }
  const flight = makeDetailFlight(arrival.image, box, copy);
  media.classList.add('is-shared-hidden');
  hideDetailSource(arrival.image);
  Object.assign(detailFlightState, { x: arrival.box.left - box.left, y: arrival.box.top - box.top, sx: arrival.box.width / box.width, sy: arrival.box.height / box.height, zoom: Math.max(arrival.box.width / box.width, arrival.box.height / box.height) });
  paintDetailFlight();
  detailMotion = gsap.timeline({ onComplete: () => {
    detailMotion = null;
    gsap.set([detailBackdrop, dialog, info], { clearProps: 'opacity,transform' });
    const handoff = () => {
      if (detailFlight !== flight || detailClosing) return;
      flight.remove(); detailFlight = null; detailFlightState = null;
      media.classList.add('is-loaded');
      media.classList.remove('is-shared-hidden');
    };
    // Keep the already visible print until its full-size replacement is ready.
    const reveal = () => {
      const src = media.src;
      media.decode().then(handoff).catch(() => {
        if (detailFlight !== flight || detailClosing) return;
        // Upgrading the thumbnail can abort its pending decode. Decode the
        // new source rather than replacing a healthy original with the print.
        if (media.src !== src) { reveal(); return; }
        media.src = flight.firstElementChild.src;
        media.decode().then(handoff).catch(() => { /* The visible flight remains usable. */ });
      });
    };
    reveal();
  } })
    .to(detailFlightState, { x: 0, y: 0, sx: 1, sy: 1, zoom: 1, duration: .42, ease: 'power2.inOut', onUpdate: paintDetailFlight }, 0)
    .fromTo(detailBackdrop, { opacity: 0 }, { opacity: 1, duration: .3, ease: 'power1.out' }, 0)
    .fromTo(dialog, { opacity: 0, y: 0, scale: 1 }, { opacity: 1, y: 0, scale: 1, duration: .3, ease: 'power2.out' }, .06);
}

function fadeDetailPhoto() {
  const request = detailPhotoRequest;
  detailPhotoReady.then(() => {
    if (request !== detailPhotoRequest || detailClosing || !isLbOpen || REDUCED) return;
    // Let the room dim first, then bring the viewing table gently into focus.
    detailMotion = gsap.timeline({ onComplete: () => { detailMotion = null; } })
      .to(detailBackdrop, { opacity: 1, duration: .42, ease: 'power2.out', clearProps: 'opacity' }, 0)
      .fromTo(lightbox.querySelector('.lb-dialog'), { opacity: 0, y: 12, scale: .992 },
        { opacity: 1, y: 0, scale: 1, duration: .46, ease: 'power2.out', clearProps: 'transform,opacity' }, .05);
  });
}

function renderDetailPhoto(item, sourceImage) {
  const request = ++detailPhotoRequest;
  const preview = sourceImage?.currentSrc || sourceImage?.src || item.src;
  const full = item.full || item.src;
  lbImg.classList.remove('is-loaded');
  lbImg.src = preview;
  // Decode both renditions before revealing or swapping them. A request token
  // prevents a slow previous photograph from replacing a newer selection.
  const decoded = lbImg.decode().catch(() => {}).then(() => {
    if (request === detailPhotoRequest && lbImg.naturalWidth) lbImg.classList.add('is-loaded');
  });
  const ready = detailPhotoReady = detailDecodeWithin(decoded, 1500);
  if (preview === full) return;
  const original = new Image();
  original.src = full;
  original.decode().then(() => ready).then(() => {
    if (request !== detailPhotoRequest || detailClosing || !isLbOpen) return;
    lbImg.src = full;
    lbImg.classList.add('is-loaded');
  }).catch(() => { /* Keep the decoded print if the larger rendition fails. */ });
}

function detailText(root, selector) {
  const node = root.querySelector(selector);
  return node ? node.textContent.trim() : "";
}

function photoFrameData(frame) {
  const img = frame.querySelector("img");
  const cap = frame.querySelector(".photo-frame-text");
  const no = frame.querySelector(".photo-frame-no");
  return {
    type: "photo",
    // The rail keeps the small print; the viewer loads the larger rendition.
    src: img ? (img.getAttribute("data-rail") || img.getAttribute("src")) : "",
    full: img ? img.dataset.full || img.getAttribute("data-rail") || "" : "",
    width: Number(img?.getAttribute('width')) || img?.naturalWidth || 1600,
    height: Number(img?.getAttribute('height')) || img?.naturalHeight || 1067,
    alt: img ? img.alt : "",
    caption: cap ? cap.textContent.trim() : "",
    number: no ? no.textContent.trim() : "",
    // Subject metadata belongs to each original frame.
    act: frame.getAttribute("data-act") || "BLOOM",
  };
}

function gameItemData(item) {
  const img = item.querySelector("img");
  const name = detailText(item, ".hof-name");
  return {
    type: "game",
    id: item.getAttribute("data-game"),
    name: name,
    release: detailText(item, ".hof-release"),
    releaseLabel: item.dataset.releaseKind === "series" ? "Series debut" : "Released",
    src: img ? img.getAttribute("src") : "",
    alt: img ? img.alt : name,
    rank: Array.from(document.querySelectorAll("#panel-games .hof-item")).indexOf(item) + 1,
  };
}

/* photo / game only. Film and series had branches here that returned
   a copy of FILM_DATA / SERIES_DATA; they were unreachable, because the only
   two openDetail() calls in this file pass those two strings. See the
   comment in renderDetail and AGENTS.md:144. */
function detailItemsFor(type) {
  if (type === "photo") return photoFrames.map(photoFrameData);
  if (type === "game") {
    return Array.from(document.querySelectorAll("#panel-games .hof-item")).map(gameItemData);
  }
  return [];
}

function detailLabel(type) {
  if (type === "game") return "GAME";
  return "FRAME";
}

function detailAct(type, item) {
  if (type === "photo") return item.act;
  if (type === "game") return "GAME";
  return "";
}

function syncOverlays() {
  const active = isLbOpen ? lightbox : document.querySelector("dialog[open]");
  Array.from(document.body.children).forEach((el) => {
    if (el.tagName === "SCRIPT") return;
    if (active && el !== active) el.setAttribute("inert", "");
    else el.removeAttribute("inert");
  });
  document.body.style.overflow = active ? "hidden" : "";
  document.documentElement.style.overflow = active ? "hidden" : "";
  if (lenis) {
    if (active) lenis.stop();
    else lenis.start();
  }
}

/* The full-screen photo layer is retired (asked for). The deck deals in the
   page and the shared #lightbox is what a photograph opens into, so that layer
   was a second copy of the detail mechanism - plus a second scroll lock, a
   second Escape path and a second focus trap to keep honest. Its retirement is
   also what lets syncOverlays() know about exactly one overlay. */

function lbBuildRail() {
  if (!lbRail) return;
  lbRail.innerHTML = "";
  lbThumbs = photoFrames.map((frame, i) => {
    const data = photoFrameData(frame);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "lb-thumb";
    btn.setAttribute("aria-label", "Frame " + String(i + 1).padStart(2, "0") + ": " + data.caption);
    const thumbImg = document.createElement("img");
    thumbImg.src = data.src;
    thumbImg.alt = "";
    thumbImg.loading = "lazy";
    thumbImg.decoding = "async";
    btn.appendChild(thumbImg);
    btn.addEventListener("click", () => lbLoad(i));
    lbRail.appendChild(btn);
    return btn;
  });
}

function setDetailVisibility(show) {
  if (lbImg) lbImg.hidden = !show.image;
  if (lbPhotoInfo) lbPhotoInfo.hidden = !show.photo;
  if (lbMeta) lbMeta.hidden = !show.meta;
  if (lbRail) lbRail.hidden = !show.rail;
}

function renderDetail(sourceImage) {
  const item = detailItems[lbIndex];
  if (!item) return;
  // The shared viewer adapts its media proportions to each collection type.
  if (lightbox) lightbox.dataset.detail = detailType;
  const label = detailLabel(detailType);
  const total = detailItems.length;
  if (lbCount) lbCount.textContent = label + " " + String(lbIndex + 1).padStart(2, "0") + " / " + String(total).padStart(2, "0");
  if (lbAct) lbAct.textContent = detailType === "photo" ? "Photography" : detailAct(detailType, item);
  if (lightbox) lightbox.setAttribute("aria-label", detailType === "photo" ? item.caption || item.alt : item.title || item.name || "Collection detail viewer");
  if (lbPrevBtn) lbPrevBtn.setAttribute("aria-label", "Previous " + label.toLowerCase());
  if (lbNextBtn) lbNextBtn.setAttribute("aria-label", "Next " + label.toLowerCase());

  if (detailType === "photo") {
    setDetailVisibility({ image: true, photo: true, meta: false, rail: true });
    if (lbImg) {
      lbImg.alt = item.alt;
      lbImg.width = item.width;
      lbImg.height = item.height;
      lightbox.style.setProperty('--detail-ratio', item.width / item.height);
      /* the lightbox reads the original, not the 560px board cell: it is the one
         place a photograph is asked for at full size, and it is a click away */
      renderDetailPhoto(item, sourceImage);
    }
    if (lbPhotoTitle) lbPhotoTitle.textContent = item.caption || "Photograph " + String(lbIndex + 1).padStart(2, "0");
    if (lbPhotoDescription) lbPhotoDescription.textContent = item.alt;
    lbThumbs.forEach((btn, i) => {
      if (i === lbIndex) btn.setAttribute("aria-current", "true");
      else btn.removeAttribute("aria-current");
    });
    // Keep the selected print visible without moving the page or focus.
    const activeThumb = lbThumbs[lbIndex];
    if (lbRail && activeThumb) {
      const railBox = lbRail.getBoundingClientRect();
      const thumbBox = activeThumb.getBoundingClientRect();
      if (thumbBox.left < railBox.left + 5) lbRail.scrollLeft -= railBox.left + 5 - thumbBox.left;
      else if (thumbBox.right > railBox.right - 5) lbRail.scrollLeft += thumbBox.right - railBox.right + 5;
    }
    if (lbLive) {
      lbLive.textContent = "Frame " + String(lbIndex + 1).padStart(2, "0") + " of " + total + ". " + item.caption;
    }
    return;
  }

  setDetailVisibility({ image: true, photo: false, meta: true, rail: false });
  if (lbImg) {
    lbImg.classList.remove("is-loaded");
    lbImg.removeAttribute('width');
    lbImg.removeAttribute('height');
    lbImg.alt = item.alt;
    lbImg.src = item.src;
  }
  // Film and series use their own inline details. Games show the original release date.
  if (detailType === "game") {
    if (lbKicker) lbKicker.textContent = "GAME " + String(item.rank).padStart(2, "0") + " / " + String(total).padStart(2, "0");
    if (lbTitle) lbTitle.textContent = item.name;
    if (lbLines) lbLines.textContent = item.releaseLabel + " " + item.release;
    if (lbQuote) lbQuote.hidden = true;
    if (lbLink) lbLink.hidden = true;
    if (lbLive) {
      lbLive.textContent = "Game " + String(lbIndex + 1).padStart(2, "0") + " of " + total + ", " + item.name + ". " + item.releaseLabel + " " + item.release;
    }
  }
}

function lbLoad(i) {
  if (!detailItems.length) return;
  if (detailClosing) return;
  stopDetailMotion();
  lbIndex = ((i % detailItems.length) + detailItems.length) % detailItems.length;
  renderDetail();
}

function lbFocusables() {
  if (!lightbox) return [];
  return Array.from(lightbox.querySelectorAll("button:not([disabled]), [href], [tabindex]:not([tabindex='-1'])"))
    .filter((el) => el.offsetParent !== null || el === document.activeElement);
}

function openDetail(type, index, origin) {
  if (!lightbox) return;
  const items = detailItemsFor(type);
  if (!items.length) return;
  stopDetailMotion();
  ++detailPhotoRequest;
  detailClosing = false;
  detailAfterClose = null;
  detailType = type;
  detailItems = items;
  lbIndex = Math.max(0, Math.min(Number(index) || 0, items.length - 1));
  lbTrigger = origin || (document.activeElement instanceof HTMLElement ? document.activeElement : null);
  const sourceImage = type === 'photo' ? photoFrames[lbIndex]?.querySelector('img') : null;
  const sourceBox = photoPrintBox(sourceImage);
  if (type === "photo" && !lbThumbs.length) lbBuildRail();
  renderDetail(sourceImage);
  const viewerDialog = lightbox.querySelector(".lb-dialog");
  if (viewerDialog) viewerDialog.scrollTop = 0;
  // Establish the first frame before exposing the overlay, including the
  // asynchronous decode path. Otherwise the opaque table flashes first.
  if (!REDUCED) gsap.set([detailBackdrop, viewerDialog], { opacity: 0 });
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  isLbOpen = true;
  syncOverlays();
  /* lbCloseBtn is nullable for the same reason the writes in renderDetail are:
     if a future markup pass drops #lb-close, this throws inside openDetail and
     the lightbox opens with focus still on the page behind it. The backdrop
     click below and Escape both still close it, so a missing button degrades
     to "one fewer way out" rather than a trap. */
  if (lbCloseBtn) lbCloseBtn.focus({ preventScroll: true });
  if (!REDUCED) {
    if (sourceImage?.naturalWidth && sourceBox?.width && sourceBox?.height && sourceBox.bottom > 0 && sourceBox.top < innerHeight) {
      detailArrival = { image: sourceImage, box: sourceBox };
      arriveDetailMedia();
    } else if (type === 'photo') {
      fadeDetailPhoto();
    } else gsap.fromTo([detailBackdrop, viewerDialog], { opacity: 0 }, { opacity: 1, duration: .24, ease: 'power1.out', clearProps: 'opacity' });
  }
}

async function closeDetail(afterClose) {
  if (typeof afterClose === 'function') detailAfterClose = afterClose;
  if (!lightbox || !isLbOpen || detailClosing) return;
  // Reverse from the currently painted flight, including an early Escape.
  // Clearing its transforms here would snap back to the full-size image.
  const awaitingArrival = !!detailArrival;
  if (detailMotion) detailMotion.kill();
  detailMotion = null;
  detailArrival = null;
  gsap.killTweensOf([detailBackdrop, lightbox.querySelector('.lb-dialog'), lightbox.querySelector('.lb-info')]);
  detailClosing = true;
  const request = ++detailPhotoRequest;
  let destination = null;
  if (detailType === 'photo') {
    const frame = photoFrames[lbIndex];
    const target = window.AtelierPhoto?.returnTarget(lbIndex, lbTrigger);
    destination = target?.image || frame?.querySelector('img');
    if (target?.button) lbTrigger = target.button;
    else if (frame) lbTrigger = frame.querySelector('button');
  }
  const finish = () => {
    stopDetailMotion();
    detailClosing = false;
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    isLbOpen = false;
    syncOverlays();
    // empty src would re-request the page URL itself; drop the attribute
    lbImg.removeAttribute("src");
    if (lbTrigger && document.contains(lbTrigger)) lbTrigger.focus({ preventScroll: true });
    lbTrigger = null;
    const callback = detailAfterClose;
    detailAfterClose = null;
    if (callback) callback();
  };
  const media = detailMedia();
  let from = media?.getBoundingClientRect();
  let to = photoPrintBox(destination);
  // Escape before the opening bitmap is ready must never conjure a full-size
  // return flight from a table that has not appeared yet.
  if (!detailFlight && (awaitingArrival || parseFloat(getComputedStyle(lightbox.querySelector('.lb-dialog')).opacity) < 1)) to = null;
  let copy;
  if (!REDUCED && !detailFlight && from?.width && to?.width && media?.naturalWidth) {
    copy = new Image();
    copy.src = media.currentSrc || media.src;
    if (!await detailDecodeWithin(copy.decode(), 200)) to = null;
    if (request !== detailPhotoRequest || !isLbOpen || !detailClosing) return;
    from = media.getBoundingClientRect();
    if (to) to = photoPrintBox(destination);
  }
  if (REDUCED) { finish(); return; }
  if (!from?.width || !to?.width || to.bottom <= 0 || to.top >= innerHeight || (!media.naturalWidth && !detailFlight)) {
    detailMotion = gsap.timeline({ onComplete: finish })
      .to(detailBackdrop, { opacity: 0, duration: .28, ease: 'power1.inOut' }, 0)
      .to(lightbox.querySelector('.lb-dialog'), { opacity: 0, y: detailType === 'photo' ? 8 : 0, duration: .28, ease: 'power2.in' }, 0);
    return;
  }
  if (!detailFlight) makeDetailFlight(media, from, copy);
  hideDetailSource(destination);
  media.classList.add('is-shared-hidden');
  const base = detailFlightState;
  const sx = to.width / base.width, sy = to.height / base.height;
  detailMotion = gsap.timeline({ onComplete: finish })
    .to(lightbox.querySelector('.lb-dialog'), { opacity: 0, duration: .22, ease: 'power1.out' }, 0)
    .to(detailBackdrop, { opacity: 0, duration: .36, ease: 'power1.inOut' }, 0)
    .to(base, { x: to.left - base.left, y: to.top - base.top, sx, sy, zoom: Math.max(sx, sy), duration: .38, ease: 'power2.inOut', onUpdate: paintDetailFlight }, 0);
}

function initUnifiedDetail() {
  if (!lightbox) return;
  // Build the thumbnail rail only when the viewer first opens.
  // Frame IDs match the sequence captured before the gallery visually reorders it.
  const photoDeck = document.getElementById("photo-deck");
  if (photoDeck) {
    photoDeck.addEventListener("click", (e) => {
      const frame = e.target.closest(".photo-frame");
      if (!frame || !photoDeck.contains(frame)) return;
      const i = Number(frame.getAttribute("data-photo-index"));
      if (!(i >= 0)) return;
      openDetail("photo", i, frame.querySelector('.photo-frame-btn'));
    });
  }

  /* films and series deliberately have NO click handler here.
     Their detail block sits directly under the rail, so opening a full-screen
     layer repeated information the page was already showing - and it did it
     worse: a 250px poster floating in a dark field with the copy stranded off
     to one side. Clicking a poster now just selects it, which is the same
     thing hovering and tabbing already do. The layer is still the detail
     mechanism for photo and game, which have no inline detail block of their
     own. */

  const gamePanel = document.getElementById("panel-games");
  if (gamePanel) {
    Array.from(gamePanel.querySelectorAll(".hof-item")).forEach((item) => {
      item.setAttribute("role", "button");
      item.setAttribute("tabindex", "0");
      item.setAttribute("aria-label", "Open details for " + detailText(item, ".hof-name") + ", " + "Released " + detailText(item, ".hof-release"));
    });
    const openGame = (item) => {
      const items = Array.from(gamePanel.querySelectorAll(".hof-item"));
      const index = items.indexOf(item);
      if (index >= 0) openDetail("game", index);
    };
    gamePanel.addEventListener("click", (e) => {
      const item = e.target.closest(".hof-item");
      if (item) openGame(item);
    });
    gamePanel.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const item = e.target.closest(".hof-item");
      if (!item) return;
      e.preventDefault();
      openGame(item);
    });
  }

  /* Every listener below is guarded. initUnifiedDetail() is called from the
     middle of this file, so a single missing id used to throw a TypeError that
     aborted everything after it: the whole GSAP block and the nav ScrollTrigger
     never ran. That is a lot of damage for a renamed id. */
  if (lbCloseBtn) lbCloseBtn.addEventListener("click", closeDetail);
  if (lbPrevBtn) lbPrevBtn.addEventListener("click", () => lbLoad(lbIndex - 1));
  if (lbNextBtn) lbNextBtn.addEventListener("click", () => lbLoad(lbIndex + 1));
  if (lbImg) lbImg.addEventListener("load", () => {
    if (detailType !== 'photo') lbImg.classList.add("is-loaded");
    arriveDetailMedia();
  });
  const settleDetailMotion = () => {
    if (detailClosing && detailMotion) detailMotion.progress(1);
    stopDetailMotion();
  };
  motionPreference.addEventListener('change', settleDetailMotion);
  window.addEventListener('resize', settleDetailMotion);
  // clicking the dark backdrop closes
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeDetail();
  });

  // Escape / arrows / Tab while the viewer is open.
  //
  // Capture phase on window, not bubble phase on document: js/book-shelf.js also
  // listens for Escape on document and was loaded first, so a bubble-phase
  // listener here could not take the key back - one Escape closed the viewer AND
  // deselected the book shelf hidden behind it.
  // Claiming only the keys this viewer owns keeps the two paths separate.
  window.addEventListener("keydown", (e) => {
    if (!isLbOpen) return;
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closeDetail(); return; }
    if (e.key === "ArrowLeft") { e.preventDefault(); e.stopPropagation(); lbLoad(lbIndex - 1); return; }
    if (e.key === "ArrowRight") { e.preventDefault(); e.stopPropagation(); lbLoad(lbIndex + 1); return; }
    if (e.key !== "Tab") return;
    // focus trap: cycle through every control inside the viewer
    const focusables = lbFocusables();
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, true);

  // touch: horizontal swipe on the stage changes items
  if (lbStage) {
    let swipeX = 0, swipeY = 0, trackingSwipe = false;
    lbStage.addEventListener("touchstart", (e) => {
      swipeX = e.changedTouches[0].clientX;
      swipeY = e.changedTouches[0].clientY;
      trackingSwipe = true;
    }, { passive: true });
    lbStage.addEventListener("touchend", (e) => {
      if (!trackingSwipe) return;
      trackingSwipe = false;
      const dx = e.changedTouches[0].clientX - swipeX;
      const dy = e.changedTouches[0].clientY - swipeY;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        lbLoad(lbIndex + (dx < 0 ? 1 : -1));
      }
    }, { passive: true });
  }
}

initUnifiedDetail();

/* ---------- The Archive: leave one room, arrive in the next ---------- */

function initArchiveTabs() {
  const tabbar = document.getElementById("archive-tabbar");
  if (!tabbar) return;
  const tabs = Array.from(tabbar.querySelectorAll(".tab-btn"));
  const tabPanels = tabbar.closest("#archive") && tabbar.closest("#archive").querySelector(":scope > .tab-panels");
  if (!tabs.length || !tabPanels) return;

  const panels = tabs.map((tab) =>
    document.getElementById(tab.getAttribute("aria-controls"))
  );
  if (panels.some((panel) => !panel)) return;

  // A panel must stay a direct child of .tab-panels. If a later edit nests it
  // inside another panel or drawer, put it back before wiring tab clicks.
  panels.forEach((panel) => {
    if (panel.parentElement !== tabPanels) tabPanels.appendChild(panel);
  });

  let current = tabs.findIndex((t) => t.classList.contains("is-active"));
  if (current < 0) current = 0;
  let roomMotion = null;
  const settleRoom = () => {
    if (roomMotion) roomMotion.kill();
    roomMotion = null;
    panels.forEach((panel, i) => {
      panel.classList.remove('is-leaving');
      panel.inert = i !== current;
      panel.setAttribute('aria-hidden', String(i !== current));
      gsap.set(panel, { clearProps: 'position,top,left,width,clipPath,opacity,visibility,transform,willChange' });
    });
    tabPanels.classList.remove('is-changing-room');
    tabPanels.style.removeProperty('height');
    scheduleRefresh(100);
  };
  motionPreference.addEventListener('change', settleRoom);
  window.addEventListener('resize', settleRoom);
  panels.forEach((panel, i) => {
    panel.inert = i !== current;
    panel.setAttribute('aria-hidden', String(i !== current));
  });

  // roving tabindex: only the active tab participates in the Tab order
  tabs.forEach((t, i) => { t.tabIndex = i === current ? 0 : -1; });

  // The selected indicator is its own draggable element, so every path that
  // changes the selection has to move it - click, arrow key, Home/End and the
  // drag all funnel through showMeta below.
  const pillEl = document.getElementById("tab-pill");
  const pill = pillEl && window.createGlassPill
    ? window.createGlassPill({
        root: tabbar,
        items: tabs,
        pill: pillEl,
        index: current,
        // a drag commit is a normal selection; select() is idempotent
        onChange: (index) => select(index),
      })
    : null;

  const showMeta = (idx) => {
    tabs.forEach((t, i) => {
      const on = i === idx;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
    });
    panels.forEach((p, i) => {
      p.classList.toggle("is-active", i === idx);
      p.inert = i !== idx;
      p.setAttribute('aria-hidden', String(i !== idx));
    });
    if (pill) pill.moveTo(idx);
    tabbar.dispatchEvent(new CustomEvent("night:archive-tab", {
      detail: { token: tabs[idx].getAttribute("data-tab"), index: idx },
    }));
  };

  const select = (idx, instant) => {
    if (idx === current && !instant) return;
    settleRoom();
    const old = panels[current];
    const direction = idx > current ? 1 : -1;
    const groupBox = tabPanels.getBoundingClientRect();
    const oldBox = old.getBoundingClientRect();
    const moving = !instant && !REDUCED;
    if (moving) {
      old.classList.add('is-leaving');
      Object.assign(old.style, { position: 'absolute', top: (oldBox.top - groupBox.top) + 'px', left: (oldBox.left - groupBox.left) + 'px', width: oldBox.width + 'px' });
    }
    current = idx;
    showMeta(idx);
    scheduleRefresh(250);
    if (pill) pill.refresh();
    if (moving) {
      // Height must follow actual content; animate only during a tab exchange.
      const targetHeight = tabPanels.getBoundingClientRect().height;
      tabPanels.style.height = groupBox.height + 'px';
      tabPanels.classList.add('is-changing-room');
      const token = tabs[idx].dataset.tab;
      const horizontal = ['films', 'series', 'games'].includes(token);
      gsap.set([old, panels[idx]], { willChange: 'transform,opacity' });
      roomMotion = gsap.timeline({ onComplete: settleRoom })
        .to(old, { x: -direction * 26, y: -8, opacity: 0, duration: .24, ease: 'power2.in' }, 0)
        .fromTo(panels[idx], { x: horizontal ? direction * 38 : 0, y: horizontal ? 8 : 24, opacity: 0, scale: token === 'games' ? .985 : 1 },
          { x: 0, y: 0, opacity: 1, scale: 1, duration: .52, ease: 'power3.out' }, .09)
        .to(tabPanels, { height: targetHeight, duration: .5, ease: 'power3.inOut' }, 0);
    }
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(i));
    tab.addEventListener("keydown", (e) => {
      const isFirst = i === 0;
      const isLast = i === tabs.length - 1;
      if (e.key === "ArrowRight" || (e.key === "ArrowDown" && i < tabs.length - 1)) {
        e.preventDefault();
        const next = isLast ? 0 : i + 1;
        tabs[next].focus();
        select(next);
      } else if (e.key === "ArrowLeft" || (e.key === "ArrowUp" && i > 0)) {
        e.preventDefault();
        const prev = isFirst ? tabs.length - 1 : i - 1;
        tabs[prev].focus();
        select(prev);
      } else if (e.key === "Home") {
        e.preventDefault();
        tabs[0].focus();
        select(0);
      } else if (e.key === "End") {
        e.preventDefault();
        tabs[tabs.length - 1].focus();
        select(tabs.length - 1);
      }
    });
  });


}

initArchiveTabs();

/* ---------- sport panel: five-slide accordion ----------
   Ported from Framer's "image animation" (see the markup comment in
   index.html). Everything visual hangs off [aria-pressed], so the whole script
   is "move that one attribute" - layout, reveal and colour are CSS. Buttons
   already answer Enter and Space, so there is no key handler here.

   The pressed panel stays pressed: this register is a choice between five, not a
   toggle, and upstream does the same (tapping the open child re-enters its own
   variant). Initial state is read from the markup rather than assumed, so a
   hand-edited "which one starts open" cannot drift from what CSS paints. */

function initSportStage() {
  const stage = document.getElementById("sport-stage");
  const items = stage
    ? Array.from(stage.querySelectorAll(".sport-item"))
    : [];
  if (items.length < 2) return;

  // The markup ships every panel closed so that no-JS readers get one open slide
  // and no captions floating on undimmed photos (see the html:not(.js) rules).
  // Everything downstream hangs off this attribute, so commit it once here
  // rather than hard-coding aria-pressed="true" in index.html - same shape as
  // the tab bar's roving tabindex.
  let open = items.find((b) => b.getAttribute("aria-pressed") === "true");
  if (!open) {
    open = items[0];
    open.setAttribute("aria-pressed", "true");
  }

  stage.addEventListener("click", (e) => {
    // The card, not the button. .sport-cap - and the official-site link inside
    // it - now sit OUTSIDE the <button>: a <button> may not contain
    // interactive content, and nesting the link there left five official sites
    // off the tab order (pointer-only). The caption is absolutely positioned
    // over the photo, so it has to resolve the same card by itself.
    // A click ON the link must open the link, not flip the panel.
    if (e.target.closest("a")) return;
    const card = e.target.closest(".sport-card");
    const item = card && card.querySelector(".sport-item");
    if (!item || item === open) return;
    open = item;
    items.forEach((b) => b.setAttribute("aria-pressed", String(b === item)));
  });
}

initSportStage();

/* ---------- nav active section ---------- */

const navAnchors = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
// Pair each anchor with its section up front so a missing href target can
// never shift the active-highlight index (anchor[i] vs section[i] drift).
const navPairs = navAnchors
  .map((a) => ({ anchor: a, section: document.querySelector(a.getAttribute("href")) }))
  .filter((pair) => pair.section);

// Section offsets are cached on ScrollTrigger refresh (and once at boot);
// the per-scroll onUpdate only reads these. Reading offsetTop/scrollHeight
// on every scroll event forces a synchronous layout each time.
let navOffsets = navPairs.map((p) => p.section.offsetTop);
let navActiveIndex = null;

function cacheNavMetrics() {
  navOffsets = navPairs.map((p) => p.section.offsetTop);
}

// Navigation uses the active link colour; the archive has its own pill.
function updateNavActive(self) {
  const y = self.scroll() + window.innerHeight * 0.45;
  let current = -1;
  for (let i = 0; i < navOffsets.length; i++) {
    if (navOffsets[i] <= y) current = i;
  }
  if (self.progress >= 1) current = navPairs.length - 1;
  // This runs on every scroll frame, so only touch the DOM on a real change.
  // Above the first section nothing is active, which now simply means every
  // label sits at its resting ink.
  if (current === navActiveIndex) return;
  navActiveIndex = current;
  navPairs.forEach((pair, i) => pair.anchor.classList.toggle("is-active", i === current));
}

ScrollTrigger.create({
  start: 0,
  end: "max",
  onUpdate: updateNavActive,
  onRefresh: (self) => {
    cacheNavMetrics();
    updateNavActive(self);
  },
});
