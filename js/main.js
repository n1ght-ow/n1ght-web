/* ============================================================
   N1GHT CHXN9 - interaction layer
   GSAP + ScrollTrigger. All scrub tweens invalidateOnRefresh.
   ============================================================ */

gsap.registerPlugin(ScrollTrigger);
if (window.SplitText) gsap.registerPlugin(SplitText);

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
   - spring: low-frequency state changes only, never high-frequency
   Every animation still needs a one-line motivation and a reduced-motion
   static alternative at the call site. */
const MOTION = {
  feedback: { duration: 0.15, press: 0.12, ease: "power2.out" },
  enter: { duration: 0.85, longDuration: 1.1, ease: "power3.out", heavyEase: "power4.out", stagger: 0.09 },
  spring: { duration: 0.6, ease: "back.out(1.7)" },
};

/* ---------- hero entrance ----------
   The one entrance that runs without being scrolled into view: the image
   settles out of a slight overscale while the type rises. Transform and
   opacity only, and skipped entirely under reduced motion. */

const heroMedia = document.querySelector(".hero-media img");

if (!REDUCED) {
  const heroTl = gsap.timeline({ defaults: { ease: MOTION.enter.ease } });
  if (heroMedia) heroTl.from(heroMedia, { scale: 1.06, autoAlpha: 0, duration: 1.6, ease: "power2.out" });
  heroTl
    .from(".hero-eyebrow", { y: 14, autoAlpha: 0, duration: 0.7 }, 0.2)
    .from(".hero-title", { y: 30, autoAlpha: 0, duration: MOTION.enter.longDuration }, 0.3)
    .from(".hero-stats > div", { y: 14, autoAlpha: 0, duration: 0.7, stagger: 0.07 }, 0.5);
}

/* ---------- photography: short entry fade ----------
   The references reveal imagery with a short fade rather than a long
   choreography: a photo grid reads as more premium the less it performs.
   ScrollTrigger.batch gives one trigger per screenful, not one per card. */

if (!REDUCED && window.ScrollTrigger) {
  ScrollTrigger.batch(".photo-frame", {
    start: "top 90%",
    once: true,
    onEnter: (batch) =>
      gsap.from(batch, {
        y: 18,
        autoAlpha: 0,
        duration: 0.55,
        ease: MOTION.enter.ease,
        stagger: 0.06,
        overwrite: true,
      }),
  });
}

/* ---------- photography: per-plate drift ----------
   The sheet's life comes from its geometry, not from a bigger entrance, so
   this is deliberately the only scroll effect on it: a few percent of each
   plate's own height, scrubbed.

   Four details are load-bearing:
   - yPercent rather than y. It resolves against the plate's own height, so
     the drift stays proportional at every width with nothing to re-tune.
   - the target is .photo-frame-btn, NOT .photo-frame. The batch entrance
     above passes overwrite: true, which kills every other tween on its
     target; a different element keeps the two fully independent. It also
     means the caption stays put while the image moves above it.
   - the magnitude and its sign come from --photo-drift in style.css, so a
     plate's column, offset and drift stay authored in one block.
   - THE DRIFT ONLY EVER GOES DOWNWARD FROM REST. A symmetric +/-n would let a
     plate rise into the row band above it and cover the previous plate's
     caption: measured at 1440px that left exactly 1px of clearance, which is
     a font-metric change away from breaking. So a positive value runs
     0 -> +n and a negative value runs +n -> 0. Both stay at or below rest, so
     the worst case is a plate eating into its OWN caption's top padding -
     which is why that padding is sized to exceed n% of the tallest plate.
     The sign still alternates, so neighbours counter-move instead of sliding
     in lockstep.
   Never transformed: .photo-frame itself, and anything containing #lightbox
   (it is position: fixed). */
if (!REDUCED && window.ScrollTrigger && gsap.matchMedia) {
  const photoDrift = gsap.matchMedia();
  photoDrift.add("(min-width: 901px)", () => {
    gsap.utils.toArray(".photo-frame").forEach((frame) => {
      const amount = parseFloat(window.getComputedStyle(frame).getPropertyValue("--photo-drift"));
      if (!amount) return;
      const plate = frame.querySelector(".photo-frame-btn");
      if (!plate) return;
      // positive sinks from rest, negative rises back to rest; neither ever
      // crosses above the plate's own resting position
      gsap.fromTo(
        plate,
        { yPercent: Math.max(0, -amount) },
        {
          yPercent: Math.max(0, amount),
          ease: "power1.out",
          scrollTrigger: {
            trigger: frame,
            start: "clamp(top bottom)",
            end: "clamp(bottom top)",
            scrub: true,
            invalidateOnRefresh: true,
          },
        }
      );
    });
  });
}

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
   textContent is not a tweenable property, so a plain object is tweened
   with snap and written back on update. The values are tabular-nums, so
   the digits do not reflow while they climb. */

function initCounters() {
  const nodes = Array.from(document.querySelectorAll("#about-stats b[data-count]"));
  if (!nodes.length) return;

  const write = (el, value) => {
    const n = Math.round(value);
    el.textContent = el.dataset.sep === "1" ? n.toLocaleString("en-US") : String(n);
  };

  if (REDUCED || !window.ScrollTrigger) {
    nodes.forEach((el) => write(el, Number(el.dataset.count)));
    return;
  }

  ScrollTrigger.create({
    trigger: "#about-stats",
    start: "top 88%",
    once: true,
    onEnter: () => {
      nodes.forEach((el) => {
        const box = { v: 0 };
        gsap.to(box, {
          v: Number(el.dataset.count) || 0,
          duration: 1.2,
          ease: "power2.out",
          snap: { v: 1 },
          onUpdate: () => write(el, box.v),
        });
      });
    },
  });
}

initCounters();



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
const lbMusicLabel = lbMusic ? lbMusic.querySelector(".lb-music-label") : null;
const lbMusicCover = document.getElementById("lb-music-cover");
const lbMusicGlyph = lbMusic ? lbMusic.querySelector(".lb-music-glyph") : null;
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
    act: frame.closest(".photo-act-horizon") ? "HORIZON" : "BLOOM",
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
  if (lbMeta) lbMeta.hidden = !show.meta;
  if (lbRail) lbRail.hidden = !show.rail;
}

function renderDetail() {
  const item = detailItems[lbIndex];
  if (!item) return;
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
    setDetailVisibility({ image: false, caption: false, music: true, meta: true, rail: false });
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
    if (lbMusicLabel) lbMusicLabel.textContent = "NETEASE CLOUD MUSIC";
    lbKicker.textContent = item.genre;
    lbTitle.textContent = item.title;
    lbLines.textContent = item.artist;
    lbQuote.textContent = "Open in NetEase Cloud Music to play this track.";
    lbLink.hidden = false;
    lbLink.textContent = "OPEN IN NETEASE";
    lbLink.href = "https://music.163.com/#/song?id=" + item.id;
    lbLink.dataset.songId = item.id;
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
}

function initUnifiedDetail() {
  if (!lightbox) return;
  lbBuildRail();

  photoFrames.forEach((frame, i) => {
    const btn = frame.querySelector(".photo-frame-btn");
    if (btn) btn.addEventListener("click", () => openDetail("photo", i));
  });

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
  if (lbLink) {
    lbLink.addEventListener("click", (e) => {
      const songId = lbLink.dataset.songId;
      if (!songId) return;
      e.preventDefault();
      if (typeof openNetEaseSong === "function") openNetEaseSong(songId);
    });
  }

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
    const rows = panels[idx] ? Array.from(panels[idx].querySelectorAll(".idx-row, .genre, .hof-item")) : [];
    if (instant) {
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
  const jump = document.getElementById("music-search-jump");
  const filterMount = document.getElementById("genre-filter");
  const randomBtn = document.getElementById("music-random");
  if (!panel || !input || !clear || !count || !empty || !emptyText || !jump) return;

  const cards = Array.from(panel.querySelectorAll(".idx-card[data-song-id]"));
  const genres = Array.from(panel.querySelectorAll(".genre"));
  const cardGenres = cards.map((card) => card.closest(".genre"));
  const genreIndexOf = cardGenres.map((genre) => genres.indexOf(genre));
  // the chips are rendered by music-stage.js before this file runs and carry
  // their own totals ("HIP-HOP · 100"); keep the bare genre names too, for
  // the empty-state jump button
  const chips = filterMount ? Array.from(filterMount.querySelectorAll(".genre-chip")) : [];
  const chipLabels = chips.map((chip) => chip.textContent.replace(/\s*·\s*\d+\s*$/, "").trim());
  // active genre index into `genres`; one genre is visible at a time and
  // music-stage.js hides every group except index 0 on first render.
  let activeGenre = 0;

  function normalize(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, " ").trim();
  }

  // Normalized per-card haystack, built once at init: matchCard then only
  // compares precomputed strings instead of re-querying and re-normalizing
  // all 763 cards on every keystroke.
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

  // One visibility pass: the genre filter owns panel-level `hidden`, the
  // search owns per-card `is-search-hidden`; the counter only credits cards
  // inside genres the filter still shows.
  function applySearch() {
    const trimmed = input.value.trim();
    const searching = Boolean(trimmed);
    const qNorm = searching ? normalize(trimmed) : "";

    // one pass over all 763 cards: `hit` is genre-independent, so the same
    // pass can credit genres other than the visible one and feed the
    // "no match here, results elsewhere" jump button
    const hitsByGenre = new Array(genres.length).fill(0);
    let visible = 0;
    cards.forEach((card, i) => {
      const hit = matchCard(cardHaystacks[i], qNorm);
      const genreHidden = cardGenres[i] ? cardGenres[i].hidden : false;
      card.classList.toggle("is-search-hidden", !hit || genreHidden);
      if (!hit) return;
      const gi = genreIndexOf[i];
      if (gi >= 0) hitsByGenre[gi]++;
      if (!genreHidden) visible++;
    });

    genres.forEach((genre) => {
      if (genre.hidden) return;
      const visibleInGenre = genre.querySelectorAll(".idx-card:not(.is-search-hidden)").length;
      genre.classList.toggle("is-search-empty", visibleInGenre === 0);
    });

    // the counter is a search readout: hidden while browsing a genre, and
    // scoped to "matches / songs in the visible genre" while searching
    const genreTotal = genres[activeGenre] ? genres[activeGenre].querySelectorAll(".idx-card[data-song-id]").length : 0;
    count.hidden = !searching;
    count.textContent = visible + " / " + genreTotal;
    clear.hidden = !searching;
    updateEmpty(searching ? hitsByGenre : null);
    refreshScroll();
  }

  // A miss inside the active genre is not a dead end while another genre
  // holds the results: name it, count it, and jump there on click.
  function updateEmpty(hitsByGenre) {
    const activeHits = hitsByGenre ? (hitsByGenre[activeGenre] || 0) : 0;
    empty.hidden = !hitsByGenre || activeHits > 0;
    if (!hitsByGenre || activeHits > 0) {
      jump.hidden = true;
      return;
    }

    let best = -1;
    let bestCount = 0;
    hitsByGenre.forEach((hits, gi) => {
      if (gi !== activeGenre && hits > bestCount) {
        best = gi;
        bestCount = hits;
      }
    });

    emptyText.textContent = best < 0 ? "NO MATCH" : "NO MATCH IN THIS GENRE";
    jump.hidden = best < 0;
    if (best < 0) return;
    jump.setAttribute("data-genre", String(best));
    jump.textContent = "查看 " + (chipLabels[best] || "其它流派") + " · " + bestCount;
  }

  function clearSearch() {
    input.value = "";
    applySearch();
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
    genres.forEach((genre, i) => {
      genre.hidden = i !== index;
    });
    applySearch();
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

  jump.addEventListener("click", () => {
    selectGenre(parseInt(jump.getAttribute("data-genre"), 10));
    input.focus();
  });

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
  // over the 763 cards instead of one per input event.
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
  /* hero: the image drifts up as the section leaves, so the first scroll
     has a reason to move. Scrub-locked, transform only. */
  if (heroMedia) {
    gsap.to(heroMedia, {
      yPercent: 8,
      scale: 1.05,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: true,
        invalidateOnRefresh: true,
      },
    });
  }

  /* ---------- game cards: staggered entrance ----------
     enter: the roster is the longest low-frequency entrance on the page. */

  gsap.from(".hof-item", {
    y: 28,
    autoAlpha: 0,
    duration: MOTION.enter.longDuration,
    stagger: MOTION.enter.stagger,
    ease: MOTION.enter.heavyEase,
    immediateRender: false,
    scrollTrigger: {
      trigger: ".hof",
      start: "top 78%",
      toggleActions: "play none none reverse",
    },
  });

  /* ---------- about body: SplitText line masks (curtain fallback) ---------- */

  if (window.SplitText) {
    const aboutSplit = SplitText.create(".about-body p", { type: "lines", mask: "lines", autoSplit: true });
    gsap.from(aboutSplit.lines, {
      yPercent: 110,
      duration: MOTION.enter.duration,
      stagger: 0.05,
      ease: MOTION.enter.ease,
      scrollTrigger: {
        trigger: ".about-body",
        start: "top 82%",
        toggleActions: "play none none reverse",
      },
    });
  } else {
    gsap.from(".about-body p", {
      y: 16,
      clipPath: "inset(0 0 100% 0)",
      duration: MOTION.enter.duration,
      stagger: 0.14,
      ease: MOTION.enter.ease,
      clearProps: "clipPath",
      scrollTrigger: {
        trigger: ".about-body",
        start: "top 82%",
        toggleActions: "play none none reverse",
      },
    });
  }

  /* ---------- about stats entrance ----------
     enter: low-frequency reveal; MOTION.enter.duration replaces the old 0.7s */

  /* ---------- about stats: low-frequency reveal ---------- */

  gsap.from("#about-stats div", {
    y: 16,
    autoAlpha: 0,
    duration: MOTION.enter.duration,
    stagger: 0.06,
    ease: MOTION.enter.ease,
    scrollTrigger: {
      trigger: "#about-stats",
      start: "top 88%",
      toggleActions: "play none none reverse",
    },
  });

  /* ---------- coda entrance ----------
     enter: closing title is the longest low-frequency entrance (1.1s) */

  gsap.from(".coda-title", {
    yPercent: 110,
    duration: MOTION.enter.longDuration,
    stagger: 0.14,
    ease: MOTION.enter.heavyEase,
    scrollTrigger: {
      trigger: ".coda",
      start: "top 85%",
      toggleActions: "play none none reverse",
    },
  });

  /* ---------- poem: stanza develop ---------- */

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

// The nav gets the same draggable indicator as the archive tab strip. It is
// only meaningful when every anchor resolved to a section: if one href has no
// target, navPairs is shorter than navAnchors and every index past the gap
// would point at the wrong label.
const navPillMount = document.querySelector(".nav-links");
const navPillEl = document.getElementById("nav-pill");
const navPill = navPillMount && navPillEl && window.createGlassPill && navPairs.length === navAnchors.length
  ? window.createGlassPill({
      root: navPillMount,
      items: navAnchors,
      pill: navPillEl,
      index: 0,
      // Dragging the indicator onto another section is a navigation, and the
      // links already know how to do that: routing through their own handler
      // keeps Lenis, reduced-motion and the native hash jump on one path.
      onChange: (index) => {
        const pair = navPairs[index];
        if (pair) pair.anchor.click();
      },
    })
  : null;

function updateNavAndProgress(self) {
  const y = self.scroll() + window.innerHeight * 0.45;
  let current = -1;
  for (let i = 0; i < navOffsets.length; i++) {
    if (navOffsets[i] <= y) current = i;
  }
  if (self.progress >= 1) current = navPairs.length - 1;
  navPairs.forEach((pair, i) => pair.anchor.classList.toggle("is-active", i === current));

  // This runs on every scroll frame, so only touch the DOM on a real change.
  // Above the first section nothing is active, and the indicator withdraws
  // rather than sitting under a label that is not selected.
  if (navPill) {
    if (current < 0) navPill.hide();
    else if (current !== navPill.index() || !navPill.visible()) navPill.moveTo(current);
  }
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
