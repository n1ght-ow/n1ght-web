/* ============================================================
   N1GHT CHXN9 - interaction layer
   GSAP + ScrollTrigger. All scrub tweens invalidateOnRefresh.
   ============================================================ */

gsap.registerPlugin(ScrollTrigger);
/* SplitText is no longer loaded: its only client was the ABOUT prose, which is
   retired. css/style.css's text-box-trim already handles the display titles. */

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const TOUCH = window.matchMedia("(pointer: coarse)").matches;
const FINE_POINTER = window.matchMedia("(pointer: fine)").matches;

/* ---------- smooth scrolling (Lenis, full-motion only) ----------
   Native scroll under reduced motion. Programmatic jumps (anchors) route
   through lenis.scrollTo so the internal value stays in sync. */
let lenis = null;
if (!REDUCED && typeof Lenis !== "undefined") {
  lenis = new Lenis({ autoRaf: false });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const target = a.getAttribute("href");
      if (target.length > 1 && document.querySelector(target)) {
        e.preventDefault();
        lenis.scrollTo(target, { duration: 1.4 });
      }
    });
  });
}

/* ---------- helpers ---------- */

// One shared scheduler for full ScrollTrigger.refresh passes: bursts of
// layout-changing events (accordion toggles, image loads, font swaps)
// collapse into a single recalc after the window quiets down.
let refreshTimer = 0;
function scheduleRefresh(delay) {
  if (!window.ScrollTrigger || !window.ScrollTrigger.refresh) return;
  window.clearTimeout(refreshTimer);
  refreshTimer = window.setTimeout(() => {
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }, delay || 200);
}

/* ---------- motion tokens ----------
   One place for the site's reusable motion values. New interactions should
   pick a category instead of inventing a one-off duration/ease:
   - feedback: high-frequency hover / press / drag-follow, <=150ms
   - enter: low-frequency entrances, 0.7-1.1s
   Every animation still needs a one-line motivation and a reduced-motion
   static alternative at the call site.
   There was a third category here, spring (back.out(1.7)), and nothing ever
   called it: overshoot is retired site-wide, so it is gone rather than left
   lying around as a curve for the next person to copy. */
const MOTION = {
  feedback: { duration: 0.15, press: 0.12, ease: "power2.out" },
  enter: { duration: 0.85, longDuration: 1.1, ease: "power3.out", heavyEase: "power4.out", stagger: 0.09 },
};

/* ---------- hero entrance ----------
   The hero is one object now, so the entrance is one gesture: the wordmark
   rises out of the mask in css/style.css and stops. The whole mark moves at
   once - per-character rises were retired with the preloader, and a stagger
   across two lines would be a two-step animation of a single word.
   Transform only, no overshoot, and skipped entirely under reduced motion
   (the mark is simply there). */

const heroMark = document.querySelector(".hero-wordmark");

if (!REDUCED && heroMark) {
  gsap.from(heroMark, {
    yPercent: 115,
    duration: MOTION.enter.longDuration,
    ease: MOTION.enter.heavyEase,
  });
}

/* ---------- photography: no scroll effects at all ----------
   The photography chapter is an infinite draggable board now, and it owns every
   transform on it. The two effects that used to live here are gone with the
   scattered grid they were written for:

   - the ScrollTrigger.batch entry fade wrote y + autoAlpha onto .photo-frame,
     which is exactly the element js/photo-wall.js positions by transform;
   - the per-plate --photo-drift scrub wrote yPercent onto .photo-frame-btn,
     which is the cell inside that frame. Both would have fought the board's own
     matrix, and the board has its own motion language (drag, throw, parallax,
     arrow keys) that no scroll trigger is allowed to join. See AGENTS.md.
   The captions that used to sit under each plate are still in the DOM, now
   sr-only, and the detail layer still reads them. */

/* ---------- glass spotlight ----------
   One rAF-throttled style write per frame. GSAP quickTo cannot tween a
   custom property, so this is hand-rolled on purpose. Fine pointers only:
   there is no hover to track on touch. */

function initGlassSpotlight() {
  if (REDUCED || !FINE_POINTER) return;
  document.querySelectorAll(".glass--spot").forEach((el) => {
    let frame = 0;
    let px = 50;
    let py = 50;
    const apply = () => {
      frame = 0;
      el.style.setProperty("--mx", px + "%");
      el.style.setProperty("--my", py + "%");
    };
    el.addEventListener(
      "pointermove",
      (e) => {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        px = ((e.clientX - r.left) / r.width) * 100;
        py = ((e.clientY - r.top) / r.height) * 100;
        if (!frame) frame = requestAnimationFrame(apply);
      },
      { passive: true }
    );
    el.addEventListener("pointerleave", () => {
      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      el.style.removeProperty("--mx");
      el.style.removeProperty("--my");
    });
  });
}

initGlassSpotlight();

/* ---------- counters ----------
   Retired with the ABOUT panel (asked for): the eight `[data-count]` figures
   were the only counters on the page, so initCounters() and its ScrollTrigger
   went with their markup. Re-add BOTH together if a counter ever returns. */



/* ---------- unified detail layer: photo / film / series / game / music ----------
   One #lightbox serves every archive type. The photo viewer keeps its frame
   rail; films/series add poster + meta + IMDb; games add cover + hours + quote;
   music adds the NetEase link. Opening, closing, inert, focus trap and swipe
   are shared. */

const lightbox = document.getElementById("lightbox");
const lbStage = document.getElementById("lb-stage");
const lbImg = document.getElementById("lb-img");
const lbCap = document.getElementById("lb-cap");
const lbMusic = document.getElementById("lb-music");
const lbMusicCover = document.getElementById("lb-music-cover");
const lbMusicGlyph = lbMusic ? lbMusic.querySelector(".lb-music-glyph") : null;
/* music carries its own identity and its one action inside .lb-stage (a centred
   column: title / artist, sleeve, OPEN). The genre lives only in the top bar,
   which is where the layer already reads it. Film, series and game keep theirs
   in the right-hand .lb-meta column, so both sets of nodes coexist and each
   render branch fills only the pair it owns. */
const lbMusicHead = document.getElementById("lb-music-head");
const lbMusicTitle = document.getElementById("lb-music-title");
const lbMusicLines = document.getElementById("lb-music-lines");
const lbMusicLink = document.getElementById("lb-music-link");
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
let lbTrigger = null;
let lbThumbs = [];
let detailType = "photo";
let detailItems = [];
let openNetEaseSong = null;

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
    src: img ? img.getAttribute("src") : "",
    alt: img ? img.alt : "",
    caption: cap ? cap.textContent.trim() : "",
    number: no ? no.textContent.trim() : "",
    // read off the figure, not off the section it sits in: the wall has no
    // movement headings left to be a child of, and the data-act attribute is
    // the only thing keeping the kicker from reporting BLOOM for all eleven
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
    hours: detailText(item, ".hof-hours"),
    quote: detailText(item, ".hof-quote"),
    src: img ? img.getAttribute("src") : "",
    alt: img ? img.alt : name,
    rank: Array.from(document.querySelectorAll("#panel-games .hof-item")).indexOf(item) + 1,
  };
}

function musicItemData(card) {
  const genre = card.closest(".genre");
  const id = card.getAttribute("data-song-id");
  return {
    type: "music",
    id: id,
    title: detailText(card, ".idx-title"),
    artist: detailText(card, ".idx-artist"),
    genre: genre ? detailText(genre, ".genre-title") : "",
    cover: window.MUSIC_COVERS && window.MUSIC_COVERS[id] ? "album-covers/" + window.MUSIC_COVERS[id] : "",
  };
}

function detailItemsFor(type) {
  if (type === "photo") return photoFrames.map(photoFrameData);
  if (type === "film") {
    return (window.FilmStage && window.FilmStage.data ? window.FilmStage.data : (window.FILM_DATA || [])).slice();
  }
  if (type === "series") {
    return (window.SeriesStage && window.SeriesStage.data ? window.SeriesStage.data : (window.SERIES_DATA || [])).slice();
  }
  if (type === "game") {
    return Array.from(document.querySelectorAll("#panel-games .hof-item")).map(gameItemData);
  }
  if (type === "music") {
    const panel = document.getElementById("panel-music");
    if (!panel) return [];
    return Array.from(panel.querySelectorAll(".idx-card[data-song-id]"))
      .filter((card) => card.offsetParent !== null)
      .map(musicItemData);
  }
  return [];
}

function detailLabel(type) {
  if (type === "film") return "FILM";
  if (type === "series") return "SERIES";
  if (type === "game") return "GAME";
  if (type === "music") return "TRACK";
  return "FRAME";
}

function detailAct(type, item) {
  if (type === "photo") return item.act;
  if (type === "film") return item.genre;
  if (type === "series") return item.category;
  if (type === "game") return "GAME";
  if (type === "music") return item.genre || "TRACK";
  return "";
}

function setPageInert(on) {
  Array.from(document.body.children).forEach((el) => {
    if (el === lightbox || el.tagName === "SCRIPT") return;
    if (on) el.setAttribute("inert", "");
    else el.removeAttribute("inert");
  });
}

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
  if (lbCap) lbCap.hidden = !show.caption;
  if (lbMusic) lbMusic.hidden = !show.music;
  if (lbMusicHead) lbMusicHead.hidden = !show.music;
  if (lbMusicLink) lbMusicLink.hidden = !show.music;
  if (lbMeta) lbMeta.hidden = !show.meta;
  if (lbRail) lbRail.hidden = !show.rail;
}

function renderDetail() {
  const item = detailItems[lbIndex];
  if (!item) return;
  // CSS hook: the music column owns its own vertical rhythm, which the shared
  // .lb-stage gap cannot express (see .lightbox[data-detail="music"] in style.css)
  if (lightbox) lightbox.dataset.detail = detailType;
  const label = detailLabel(detailType);
  const total = detailItems.length;
  lbCount.textContent = label + " " + String(lbIndex + 1).padStart(2, "0") + " / " + String(total).padStart(2, "0");
  if (lbAct) lbAct.textContent = detailAct(detailType, item);
  if (lbPrevBtn) lbPrevBtn.setAttribute("aria-label", "Previous " + label.toLowerCase());
  if (lbNextBtn) lbNextBtn.setAttribute("aria-label", "Next " + label.toLowerCase());

  if (detailType === "photo") {
    setDetailVisibility({ image: true, caption: true, music: false, meta: false, rail: true });
    lbImg.classList.remove("is-loaded");
    lbImg.alt = item.alt;
    lbImg.src = item.src;
    lbCap.textContent = item.caption;
    lbThumbs.forEach((btn, i) => {
      if (i === lbIndex) btn.setAttribute("aria-current", "true");
      else btn.removeAttribute("aria-current");
    });
    if (lbLive) {
      lbLive.textContent = "Frame " + String(lbIndex + 1).padStart(2, "0") + " of " + total + ", " + item.act + ". " + item.caption;
    }
    return;
  }

  if (detailType === "music") {
    // no right-hand column for music: identity sits above the sleeve and the
    // single action below it, both inside .lb-stage
    setDetailVisibility({ image: false, caption: false, music: true, meta: false, rail: false });
    // real sleeve when the archive has artwork for this song, otherwise the
    // placeholder sleeve keeps the layer honest instead of showing a broken img
    if (lbMusicCover) {
      if (item.cover) {
        lbMusicCover.src = item.cover;
        lbMusicCover.alt = item.title + " album cover";
        lbMusicCover.hidden = false;
      } else {
        lbMusicCover.hidden = true;
        lbMusicCover.removeAttribute("src");
        lbMusicCover.removeAttribute("alt");
      }
    }
    if (lbMusicGlyph) lbMusicGlyph.hidden = Boolean(item.cover);
    if (lbMusicTitle) lbMusicTitle.textContent = item.title;
    if (lbMusicLines) lbMusicLines.textContent = item.artist;
    if (lbMusicLink) {
      lbMusicLink.textContent = "OPEN IN NETEASE";
      lbMusicLink.href = "https://music.163.com/#/song?id=" + item.id;
      lbMusicLink.dataset.songId = item.id;
    }
    if (lbLive) {
      lbLive.textContent = "Track " + String(lbIndex + 1).padStart(2, "0") + " of " + total + ", " + item.title + " by " + item.artist + ". " + item.genre;
    }
    return;
  }

  setDetailVisibility({ image: true, caption: false, music: false, meta: true, rail: false });
  lbImg.classList.remove("is-loaded");
  lbLink.dataset.songId = "";
  if (detailType === "film") {
    lbImg.alt = item.title + " poster";
    lbImg.src = item.poster;
    lbKicker.textContent = item.genre + " · " + item.year;
    lbTitle.textContent = item.title;
    lbLines.textContent = item.director;
    lbQuote.textContent = item.quote;
    lbLink.hidden = false;
    lbLink.textContent = "OPEN ON IMDb";
    lbLink.href = "https://www.imdb.com/title/" + item.imdb + "/";
    if (lbLive) {
      lbLive.textContent = "Film " + String(lbIndex + 1).padStart(2, "0") + " of " + total + ", " + item.title + ". " + item.director + ", " + item.year + ". " + item.quote;
    }
  } else if (detailType === "series") {
    lbImg.alt = item.title + " poster";
    lbImg.src = item.poster;
    lbKicker.textContent = item.category + " · " + item.years;
    lbTitle.textContent = item.title;
    lbLines.textContent = item.seasons;
    lbQuote.textContent = item.quote;
    lbLink.hidden = false;
    lbLink.textContent = "OPEN ON IMDb";
    lbLink.href = "https://www.imdb.com/title/" + item.imdb + "/";
    if (lbLive) {
      lbLive.textContent = "Series " + String(lbIndex + 1).padStart(2, "0") + " of " + total + ", " + item.title + ". " + item.years + ", " + item.seasons + ". " + item.quote;
    }
  } else if (detailType === "game") {
    lbImg.alt = item.alt;
    lbImg.src = item.src;
    lbKicker.textContent = "RANK " + String(item.rank).padStart(2, "0");
    lbTitle.textContent = item.name;
    lbLines.textContent = item.hours;
    lbQuote.textContent = item.quote;
    lbLink.hidden = true;
    if (lbLive) {
      lbLive.textContent = "Game " + String(lbIndex + 1).padStart(2, "0") + " of " + total + ", " + item.name + ". " + item.hours + ". " + item.quote;
    }
  }
}

function lbLoad(i) {
  if (!detailItems.length) return;
  lbIndex = ((i % detailItems.length) + detailItems.length) % detailItems.length;
  renderDetail();
}

function lbFocusables() {
  if (!lightbox) return [];
  return Array.from(lightbox.querySelectorAll("button:not([disabled]), [href], [tabindex]:not([tabindex='-1'])"))
    .filter((el) => el.offsetParent !== null || el === document.activeElement);
}

function openDetail(type, index) {
  if (!lightbox) return;
  const items = detailItemsFor(type);
  if (!items.length) return;
  detailType = type;
  detailItems = items;
  lbIndex = Math.max(0, Math.min(Number(index) || 0, items.length - 1));
  lbTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  if (type === "photo" && !lbThumbs.length) lbBuildRail();
  renderDetail();
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  setPageInert(true);
  if (lenis) lenis.stop();
  isLbOpen = true;
  lbCloseBtn.focus();
}

function closeDetail() {
  if (!lightbox) return;
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  setPageInert(false);
  if (lenis) lenis.start();
  // empty src would re-request the page URL itself; drop the attribute
  lbImg.removeAttribute("src");
  isLbOpen = false;
  // hand focus back to the card that opened the detail layer
  if (lbTrigger && document.contains(lbTrigger)) lbTrigger.focus();
  lbTrigger = null;
  /* Nothing else to hand back. The event dispatched here used to re-lock the
     full-screen photography layer, which was retired when the board moved into
     the chapter; the layer that closes is now the only one open. */
}

function initUnifiedDetail() {
  if (!lightbox) return;
  lbBuildRail();

  /* One delegated listener, because the board shows more frames than the
     eleven authored ones: js/photo-wall.js tiles clones across the plane, and a
     clone is as clickable as the original. The eleven real figures carry
     data-photo-index in DOM order, which is the index openDetail wants, and the
     clones carry the index of the photo they duplicate. A drag is already
     swallowed in the capture phase by the board itself, so nothing here has to
     know about drag state. */
  const photoWall = document.getElementById("photo-wall");
  if (photoWall) {
    photoWall.addEventListener("click", (e) => {
      const frame = e.target.closest("[data-photo-index]");
      if (!frame || !photoWall.contains(frame)) return;
      const i = Number(frame.getAttribute("data-photo-index"));
      if (i >= 0) openDetail("photo", i);
    });
  }

  /* films and series deliberately have NO click handler here.
     Their detail block sits directly under the rail, so opening a full-screen
     layer repeated information the page was already showing - and it did it
     worse: a 250px poster floating in a dark field with the copy stranded off
     to one side. Clicking a poster now just selects it, which is the same
     thing hovering and tabbing already do. The layer is still the detail
     mechanism for photo, game and music, which have no inline detail block of
     their own. */

  const gamePanel = document.getElementById("panel-games");
  if (gamePanel) {
    Array.from(gamePanel.querySelectorAll(".hof-item")).forEach((item) => {
      item.setAttribute("role", "button");
      item.setAttribute("tabindex", "0");
      item.setAttribute("aria-label", "Open details for " + detailText(item, ".hof-name") + ", " + detailText(item, ".hof-hours"));
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

  const musicPanel = document.getElementById("panel-music");
  if (musicPanel) {
    Array.from(musicPanel.querySelectorAll(".idx-card[data-song-id]")).forEach((card) => {
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-label", "Open details for " + detailText(card, ".idx-title") + " by " + detailText(card, ".idx-artist"));
    });
    const openMusic = (card) => {
      const visible = Array.from(musicPanel.querySelectorAll(".idx-card[data-song-id]")).filter((c) => c.offsetParent !== null);
      const index = visible.indexOf(card);
      if (index >= 0) openDetail("music", index);
    };
    musicPanel.addEventListener("click", (e) => {
      const card = e.target.closest(".idx-card[data-song-id]");
      if (card) openMusic(card);
    });
    musicPanel.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const card = e.target.closest(".idx-card[data-song-id]");
      if (!card) return;
      e.preventDefault();
      openMusic(card);
    });
  }

  lbCloseBtn.addEventListener("click", closeDetail);
  lbPrevBtn.addEventListener("click", () => lbLoad(lbIndex - 1));
  lbNextBtn.addEventListener("click", () => lbLoad(lbIndex + 1));
  lbImg.addEventListener("load", () => lbImg.classList.add("is-loaded"));
  /* Both links funnel into the same opener: #lb-link carries the film / series
     IMDb href, #lb-music-link the song deep link. Only the latter ever has a
     songId, so the guard keeps the two from cross-firing. */
  [lbLink, lbMusicLink].forEach((link) => {
    if (!link) return;
    link.addEventListener("click", (e) => {
      const songId = link.dataset.songId;
      if (!songId) return;
      e.preventDefault();
      if (typeof openNetEaseSong === "function") openNetEaseSong(songId);
    });
  });

  // clicking the dark backdrop closes
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeDetail();
  });

  document.addEventListener("keydown", (e) => {
    if (!isLbOpen) return;
    if (e.key === "Escape") { e.preventDefault(); closeDetail(); return; }
    if (e.key === "ArrowLeft") { e.preventDefault(); lbLoad(lbIndex - 1); return; }
    if (e.key === "ArrowRight") { e.preventDefault(); lbLoad(lbIndex + 1); return; }
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
  });

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

/* ---------- The Archive: tab switching (clip-path wipe + row stagger) ---------- */

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
    panels.forEach((p, i) => p.classList.toggle("is-active", i === idx));
    if (pill) pill.moveTo(idx);
    tabbar.dispatchEvent(new CustomEvent("night:archive-tab", {
      detail: { token: tabs[idx].getAttribute("data-tab"), index: idx },
    }));
  };

  const animateIn = (idx, rows) => {
    const panel = panels[idx];
    if (!panel) return;
    if (!rows || !rows.length) return;
    if (REDUCED) {
      gsap.set(rows, { y: 0 });
      return;
    }
    // one-off state transition: tab wipe uses power4.inOut, deliberately
    // different from MOTION.enter (it is a state change, not an entrance).
    gsap.fromTo(panel,
      { clipPath: "inset(0 0 0 100%)" },
      {
        clipPath: "inset(0 0 0 0%)",
        duration: 0.8,
        ease: "power4.inOut",
        // the wipe is the reveal, not a permanent mask: any clip-path left on
        // the panel also slices every focus ring / glow that reaches past the
        // panel box (the search field sits flush with the panel's left edge)
        clearProps: "clipPath",
      });
    gsap.from(rows, {
      clipPath: "inset(0 0 100% 0)",
      y: 14,
      duration: 0.75,
      stagger: { each: 0.06, from: "start" },
      ease: "power3.out",
      delay: 0.08,
      clearProps: "clipPath",
    });
  };

  const select = (idx, instant) => {
    if (idx === current && !instant) return;
    current = idx;
    showMeta(idx);
    // the games panel measures lazily (it mounts display:none); refresh so
    // the in-panel ScrollTrigger and the drag scroller re-measure
    scheduleRefresh();
    // the tab strip is sized by its labels, so a selection change can move
    // every segment the pill has to snap to
    if (pill) pill.refresh();
    /* games contributes its TRACK, not its eighteen cards: the dial writes a
       transform on every .hof-item itself, and a per-card wipe would fight it. */
    const rows = panels[idx] ? Array.from(panels[idx].querySelectorAll(".idx-row, .genre, .hof")) : [];
    /* MUSIC IS SHOWN, NOT WIPED (asked for). The playlist is 468 cards in 15
       groups, so the panel wipe plus the group unroll inside it reads as a
       loading cascade rather than an entrance - the shelf is simply there the
       moment its tab is picked. Every other panel keeps the wipe. */
    const plain = panels[idx] && panels[idx].id === "panel-music";
    if (instant || plain) {
      gsap.set(rows, { y: 0, clearProps: "clipPath" });
      gsap.set(panels[idx], { clearProps: "clipPath" });
    } else {
      animateIn(idx, rows);
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

  // first panel: baseline entrance on scroll into view. Skipped under
  // reduced motion — the rows simply render in their final position.
  // enter: dense rows use a tighter 0.06 stagger; duration/ease stay shared.
  if (!REDUCED) {
    const firstPanel = panels[0];
    const firstRows = Array.from(firstPanel.querySelectorAll(".idx-row, .genre"));
    if (firstRows.length) {
      gsap.from(firstRows, {
        clipPath: "inset(0 0 100% 0)",
        y: 14,
        duration: MOTION.enter.duration,
        stagger: { each: 0.06, from: "start" },
        ease: MOTION.enter.ease,
        clearProps: "clipPath",
        scrollTrigger: {
          trigger: firstPanel,
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
      });
    }
  }
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
    const item = e.target.closest(".sport-item");
    if (!item || item === open) return;
    open = item;
    items.forEach((b) => b.setAttribute("aria-pressed", String(b === item)));
  });
}

initSportStage();

/* ---------- music panel: genre filter + search + random pick ----------
   The playlist renders fully expanded (no accordion); the chip row filters
   by genre, the search filters within the visible genres, and the random
   button plays one card from whatever is currently browsable. */

function initMusicSearch() {
  const panel = document.getElementById("panel-music");
  const input = document.getElementById("music-search-input");
  const clear = document.getElementById("music-search-clear");
  const count = document.getElementById("music-search-count");
  const empty = document.getElementById("music-search-empty");
  const emptyText = document.getElementById("music-search-empty-text");
  const filterMount = document.getElementById("genre-filter");
  const randomBtn = document.getElementById("music-random");
  if (!panel || !input || !clear || !count || !empty || !emptyText) return;

  const cards = Array.from(panel.querySelectorAll(".idx-card[data-song-id]"));
  const genres = Array.from(panel.querySelectorAll(".genre"));
  const cardGenres = cards.map((card) => card.closest(".genre"));
  const genreIndexOf = cardGenres.map((genre) => genres.indexOf(genre));
  // the chips are rendered by music-stage.js before this file runs and carry
  // their own totals ("HIP-HOP · 100")
  const chips = filterMount ? Array.from(filterMount.querySelectorAll(".genre-chip")) : [];
  // Each group head and its size, captured once: a search repaints the head as
  // "matches / total", and clearing the field puts the original wording back.
  const genreCounts = genres.map((genre) => genre.querySelector(".genre-count"));
  const genreTotals = genres.map((genre) => genre.querySelectorAll(".idx-card[data-song-id]").length);
  // Active genre index. While BROWSING exactly one group is on screen
  // (music-stage.js hides every group except index 0 on first render); while
  // SEARCHING the query owns visibility instead.
  let activeGenre = 0;

  function normalize(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, " ").trim();
  }

  // Normalized per-card haystack, built once at init: matchCard then only
  // compares precomputed strings instead of re-querying and re-normalizing
  // all 441 cards on every keystroke.
  const cardHaystacks = cards.map((card) => {
    const title = card.querySelector(".idx-title");
    const artist = card.querySelector(".idx-artist");
    const hay = normalize((title ? title.textContent : "") + " " + (artist ? artist.textContent : ""));
    return { hay, compact: hay.replace(/\s+/g, ""), tokens: hay.split(" ").filter(Boolean) };
  });

  function levenshtein(a, b) {
    const m = a.length;
    const n = b.length;
    if (!m) return n;
    if (!n) return m;
    const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
    for (let j = 1; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
        );
      }
    }
    return dp[m][n];
  }

  function matchCard(haystack, qNorm) {
    if (!qNorm) return true;

    const { hay, compact, tokens } = haystack;
    const qCompact = qNorm.replace(/\s+/g, "");

    // Partial substring match: "lose" -> Lose Yourself, "kend" -> Kendrick Lamar.
    if (compact.includes(qCompact)) return true;

    // Multi-token fuzzy match: "god plan" can find "God's Plan".
    const qTokens = qNorm.split(" ").filter(Boolean);
    if (qTokens.every((token) => hay.includes(token))) return true;

    // Single-word typo/suffix tolerance for short inputs like "emine" -> Eminem.
    if (qTokens.length === 1 && qTokens[0].length >= 5) {
      const target = qTokens[0];
      return tokens.some((token) => {
        if (token.length < 4 || Math.abs(token.length - target.length) > 2) return false;
        const limit = target.length >= 6 ? 2 : 1;
        return levenshtein(token.slice(0, target.length), target) <= limit;
      });
    }

    return false;
  }

  // Global ScrollTrigger.refresh() walks the page's triggers — routed
  // through the shared debounced scheduler so keystroke bursts settle
  // into a single refresh.
  function refreshScroll() {
    scheduleRefresh();
  }

  // One visibility pass. BROWSING: the chip filter owns which group is on
  // screen and every card is visible. SEARCHING: the query owns visibility
  // ACROSS THE WHOLE COLLECTION - each group with a hit is revealed, each head
  // reads "matches / total", and the readout counts every song. That is why the
  // old "no match in this genre, try that one instead" jump button is gone: a
  // query now covers every genre, so there is no elsewhere to send anyone to.
  function applySearch() {
    const trimmed = input.value.trim();
    const searching = Boolean(trimmed);
    const qNorm = searching ? normalize(trimmed) : "";
    const hitsByGenre = new Array(genres.length).fill(0);
    let total = 0;

    cards.forEach((card, i) => {
      const hit = searching ? matchCard(cardHaystacks[i], qNorm) : true;
      const gi = genreIndexOf[i];
      if (hit) {
        total++;
        if (gi >= 0) hitsByGenre[gi]++;
      }
      card.classList.toggle("is-search-hidden", searching && !hit);
    });

    genres.forEach((genre, gi) => {
      const hits = hitsByGenre[gi];
      genre.hidden = searching ? hits === 0 : gi !== activeGenre;
      genre.classList.toggle("is-search-empty", searching && hits === 0);
      if (genreCounts[gi]) {
        genreCounts[gi].textContent = searching
          ? hits + " / " + genreTotals[gi]
          : genreTotals[gi] + " 首";
      }
    });

    // the counter is a search readout: hidden while browsing, and a cross-genre
    // total while searching
    count.hidden = !searching;
    count.textContent = total + " / " + cards.length;
    clear.hidden = !searching;
    empty.hidden = !searching || total > 0;
    refreshScroll();
  }

  function clearSearch() {
    input.value = "";
    applySearch();
  }

  // Switching genre used to inherit the previous group's scroll depth, so a
  // position deep in a long group landed at (or past) the end of a shorter
  // one. Bring the new group's head back under the sticky bar instead. Only
  // ever scrolls up: near the top of the panel the group is already in view
  // and moving the page there would just be noise.
  function alignGenreTop(genre, always) {
    // Nothing in this toolbar is pinned any more (asked for): the tab strip, the
    // search row and the genre rail all scroll away with the list, so what the
    // swapped-in group has to clear is the FIXED nav bar - the only thing still
    // on screen at the top of the viewport.
    if (!genre) return;
    // Off the nav's own rect, which is honest at every scroll position because
    // the nav is position: fixed. The old read was the rail's pinned geometry
    // out of CSS (computed top + offsetHeight): a sticky bar that is momentarily
    // un-pinned - the document shrank under the scroll position - reports a rect
    // above the viewport and lands the group hundreds of pixels short. That trap
    // left with the pinning; do not reintroduce a sticky read.
    const nav = document.querySelector("header.nav");
    const clear = (nav ? nav.getBoundingClientRect().bottom : 0) + 16;

    if (always) {
      // A search jump can travel thousands of pixels, and .genre blocks are
      // content-visibility: auto - so any delta computed from live rects is
      // measured against 60rem ESTIMATES for every block in between. Measured:
      // a POP -> HIP-HOP jump landed 359px off, and a "correct it once" pass
      // made it 834px off, because each re-measure materialises another block
      // and moves the target again. Hand it to the engine: scroll-margin-top
      // parks the group head under the fixed nav bar, and the browser's scroll
      // anchoring is exactly the mechanism that absorbs blocks materialising
      // mid-flight.
      genre.style.scrollMarginTop = Math.round(clear) + "px";
      genre.scrollIntoView({ block: "start", behavior: "instant" });
      if (lenis) lenis.scrollTo(window.scrollY, { immediate: true, force: true });
      return;
    }

    // Browsing only ever nudges UP: the swapped-in group is normally already in
    // view and moving the page would be noise. It travels a few pixels inside
    // blocks that are already materialised, so live rects are honest here.
    const delta = genre.getBoundingClientRect().top - clear;
    if (delta > -2) return;
    const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const target = Math.min(Math.max(window.scrollY + delta, 0), max);
    // Jump instead of tweening: the swap has already re-laid out the page, so
    // an animation would have to start from the clamped near-bottom position
    // and would flash unrelated content on its way back up. An instant cut
    // also matches the "replaced the list" reading of a chip click.
    //
    // Lenis first, so an in-flight momentum scroll is cancelled. Then verify,
    // because scrollTo() early-returns when the target equals the target it
    // last committed - and this target is the SAME document position for every
    // group (the playlist start), so a switch after one that already landed
    // there would silently do nothing. Its cached limit can also be a resize
    // behind, clamping the jump short. The native fallback covers both, and
    // Lenis re-syncs itself from the resulting scroll event.
    if (lenis) lenis.scrollTo(target, { immediate: true, force: true });
    if (Math.abs(window.scrollY - target) > 1) window.scrollTo(0, target);
  }

  // ---- genre filter chips (rendered by music-stage.js) ----
  function selectGenre(index) {
    if (!Number.isFinite(index) || index < 0 || index >= genres.length) return;
    activeGenre = index;
    chips.forEach((chip, i) => {
      const on = i === index;
      chip.classList.toggle("is-active", on);
      chip.setAttribute("aria-pressed", on ? "true" : "false");
    });
    applySearch();
    // While searching, a chip is "take me to that group's results" - and a group
    // with no hits has nothing to travel to.
    const searching = Boolean(input.value.trim());
    if (!searching || !genres[index].hidden) alignGenreTop(genres[index], searching);
  }

  if (filterMount) {
    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        selectGenre(parseInt(chip.getAttribute("data-genre"), 10));
      });
    });
    // the chip row scrolls horizontally on phones; Chromium does not always
    // bring a keyboard-focused chip fully into view, so do it explicitly
    filterMount.addEventListener("focusin", (e) => {
      const chip = e.target.closest(".genre-chip");
      if (chip) chip.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
  }

  // ---- random pick: play one card from whatever is currently browsable ----
  if (randomBtn) {
    randomBtn.addEventListener("click", () => {
      const pool = cards.filter((card, i) => {
        return !(cardGenres[i] && cardGenres[i].hidden) &&
          !card.classList.contains("is-search-hidden");
      });
      if (!pool.length) return;
      pool[Math.floor(Math.random() * pool.length)].click();
    });
  }

  // Coalesce keystroke bursts: each frame applies at most one search pass
  // over the 441 cards instead of one per input event.
  let searchFrame = 0;
  function requestApply() {
    if (searchFrame) return;
    searchFrame = requestAnimationFrame(() => {
      searchFrame = 0;
      applySearch();
    });
  }

  // IME safety: skip filtering during pinyin/IME composition — every
  // intermediate keystroke would otherwise run a full panel filter.
  let composing = false;
  input.addEventListener("compositionstart", () => { composing = true; });
  input.addEventListener("compositionend", () => {
    composing = false;
    requestApply();
  });
  input.addEventListener("input", () => {
    if (!composing) requestApply();
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") clearSearch();
  });
  clear.addEventListener("click", () => {
    clearSearch();
    input.focus();
  });
}

function initNetEaseLinks() {
  const drawer = document.getElementById("music-drawer");
  if (!drawer) return;

  // desktop platform check: only try the orpheus:// app scheme on Win/Mac/Linux
  // (belt-and-braces: check platform AND user agent so mobile browsers never
  // get the desktop scheme even when the platform string is unreliable)
  const ua = navigator.userAgent || "";
  const looksMobile = /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(ua);
  const isDesktop = /Win|Mac|Linux/.test(navigator.platform || "") && !looksMobile;

  // Launch the desktop app via the OFFICIAL orpheus:// deep-link format.
  // NetEase's own web player uses:
  //   location.href = "orpheus://" + base64(JSON.stringify({type,id,cmd:"play"}))
  function buildAppUrl(id) {
    const payload = JSON.stringify({ type: "song", id: id, cmd: "play" });
    const b64 = btoa(unescape(encodeURIComponent(payload)));
    return "orpheus://" + b64;
  }

  function tryAppLaunch(id) {
    const url = buildAppUrl(id);
    try {
      const a = document.createElement("a");
      a.href = url;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      a.remove();
      return true;
    } catch (err) {
      return false;
    }
  }

  // Dual strategy: prefer the desktop app; fall back to the web player.
  function openSong(id) {
    const webUrl = "https://music.163.com/#/song?id=" + id;

    // ---- mobile: launch the phone app directly ----
    if (looksMobile) {
      if (/Android/i.test(ua)) {
        // Android: intent:// lets Chrome launch the app and auto-fall back to
        // the web player when the app isn't installed (no timer needed).
        const fallback = encodeURIComponent(webUrl);
        location.href =
          "intent://song/" + id + "/#Intent;scheme=orpheus;package=com.netease.cloudmusic;S.browser_fallback_url=" + fallback + ";end";
        return;
      }
      // iOS / other mobile: orpheus:// scheme pulls the app and plays;
      // if nothing handles it, fall back to the web player after a beat.
      location.href = "orpheus://song/" + id;
      setTimeout(() => {
        if (!document.hidden) window.open(webUrl, "_blank", "noopener");
      }, 1500);
      return;
    }

    // ---- desktop: unchanged dual strategy ----
    if (!isDesktop) {
      window.open(webUrl, "_blank", "noopener");
      return;
    }
    const launched = tryAppLaunch(id);
    if (!launched) {
      window.open(webUrl, "_blank", "noopener");
      return;
    }
    let stillVisible = true;
    const onHide = () => { stillVisible = false; };
    document.addEventListener("visibilitychange", onHide, { once: true });
    window.addEventListener("blur", onHide, { once: true });
    setTimeout(() => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("blur", onHide);
      if (stillVisible) {
        window.open(webUrl, "_blank", "noopener");
      }
    }, 1200);
  }

  // The music cards now open the unified detail layer; this function keeps
  // the NetEase deep-link strategy for the detail layer's external link.
  openNetEaseSong = openSong;
}

initNetEaseLinks();

initMusicSearch();

/* ---------- game cards on touch: tap toggles the hover state ---------- */

if (TOUCH) {
  document.querySelectorAll(".hof-item").forEach((item) => {
    item.addEventListener("click", () => {
      const wasOpen = item.classList.contains("is-active");
      document.querySelectorAll(".hof-item.is-active").forEach((other) => other.classList.remove("is-active"));
      if (!wasOpen) item.classList.add("is-active");
    });
  });
}

/* ---------- books/sport rows: hover feedback is CSS-only (immediate
   background + chip swap, no transform) — high-frequency interactions
   get instant feedback per the motion rules in AGENTS.md ---------- */

/* ---------- reduced motion: decorative animations only ---------- */
if (!REDUCED) {
  /* ---------- game cards: no scroll entrance ----------
     The roster used to arrive as eighteen staggered cards. It is a dial now:
     js/games-stage.js writes a transform on every .hof-item every time the band
     moves, so a gsap y/autoAlpha entrance on the same elements would be
     clobbered on the first drag (and eighteen cards at stagger was 1.6s, over
     the 300ms ceiling anyway). The panel's own tab wipe in animateIn is the
     entrance, once. */

  /* ---------- poem: folio develop ----------
     The about-body, about-stats and coda timelines that used to sit above this
     one went with their markup (asked for). GSAP only WARNS about a missing
     target, so leaving them would have been a silent pile of dead
     ScrollTriggers firing on nothing.

     Motivation for both pieces: the poem is the last chapter and the only
     thing between the reader and the footer, so the chapter sets itself the
     way it is read - the head and the colophon (the frame) arrive first as one
     movement, then the six stanzas develop in DOM order, which is the visual
     reading order of the two columns. Reduced motion skips the whole block. */

  /* The frame - the masthead's two cells and the colophon - arrives as ONE
     movement on the section's own trigger, in DOM order (title, foreword,
     closing line). It hangs off the masthead rather than off the colophon on
     purpose: a tween keyed to the colophon would leave the section's last line
     pre-hidden until it reached 92% of the viewport, and this chapter is the
     last one before the footer, so that is a short and fragile run of scroll. */
  const poemFrame = [...document.querySelectorAll(".poem-head > *, .poem-foot")];
  if (poemFrame.length) {
    gsap.from(poemFrame, {
      y: 14,
      autoAlpha: 0,
      duration: MOTION.enter.duration,
      stagger: 0.08,
      ease: MOTION.enter.ease,
      scrollTrigger: {
        trigger: ".poem-head",
        start: "top 88%",
        toggleActions: "play none none reverse",
      },
    });
  }

  const poemLines = gsap.utils.toArray(".poem-verse p");
  if (poemLines.length) {
    gsap.from(poemLines, {
      y: 18,
      autoAlpha: 0,
      duration: MOTION.enter.duration,
      stagger: 0.07,
      ease: MOTION.enter.ease,
      scrollTrigger: {
        trigger: ".poem-verse",
        start: "top 84%",
        toggleActions: "play none none reverse",
      },
    });
  }

  /* ---------- footer entrance ---------- */

  gsap.from(".footer-name", {
    clipPath: "inset(0 0 100% 0)",
    yPercent: 60,
    duration: 1,
    ease: "power4.out",
    clearProps: "clipPath",
    // never pre-hide the wordmark before the trigger fires: if the trigger
    // is missed (short page, restored scroll position) the name would stay
    // clipped out of existence instead of simply not animating.
    immediateRender: false,
    scrollTrigger: {
      trigger: ".footer",
      start: "top 85%",
      toggleActions: "play none none reverse",
    },
  });

  /* ---------- refresh after everything settles ---------- */
  window.addEventListener("load", () => scheduleRefresh(100));
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => scheduleRefresh(100));
  }
}

/* ---------- nav active section + scroll progress (always active) ---------- */

const navAnchors = Array.from(document.querySelectorAll(".nav-links a"));
// Pair each anchor with its section up front so a missing href target can
// never shift the active-highlight index (anchor[i] vs section[i] drift).
const navPairs = navAnchors
  .map((a) => ({ anchor: a, section: document.querySelector(a.getAttribute("href")) }))
  .filter((pair) => pair.section);

// Section offsets are cached on ScrollTrigger refresh (and once at boot);
// the per-scroll onUpdate only reads these. Reading offsetTop/scrollHeight
// on every scroll event forces a synchronous layout each time.
let navOffsets = navPairs.map((p) => p.section.offsetTop);

function cacheNavMetrics() {
  navOffsets = navPairs.map((p) => p.section.offsetTop);
}

// The nav carries NO selected indicator. It used to mount the same draggable
// dark lozenge as the archive tab strip, but on a bar that floats over a
// photograph that lozenge read as a black blob riding the glass, and the
// reference navbar this bar follows has no selected state at all. The active
// link is carried by ink colour instead - see .nav-links a.is-active in
// css/style.css. js/glass-pill.js is still the tab strip's only pill.
function updateNavAndProgress(self) {
  const y = self.scroll() + window.innerHeight * 0.45;
  let current = -1;
  for (let i = 0; i < navOffsets.length; i++) {
    if (navOffsets[i] <= y) current = i;
  }
  if (self.progress >= 1) current = navPairs.length - 1;
  // This runs on every scroll frame, so only touch the DOM on a real change.
  // Above the first section nothing is active, which now simply means every
  // label sits at its resting ink.
  navPairs.forEach((pair, i) => pair.anchor.classList.toggle("is-active", i === current));
}

ScrollTrigger.create({
  start: 0,
  end: "max",
  onUpdate: updateNavAndProgress,
  onRefresh: (self) => {
    cacheNavMetrics();
    updateNavAndProgress(self);
  },
});
