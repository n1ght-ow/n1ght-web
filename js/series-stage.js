(function () {
  "use strict";

  const SERIES = (window.SERIES_DATA || []).slice();
  const REDUCED = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  const states = new WeakMap();
  const pad = (n) => String(n).padStart(2, "0");
  const canTween = () =>
    !REDUCED &&
    typeof window.gsap !== "undefined" &&
    typeof window.ScrollTrigger !== "undefined";

  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function q(stage, selector) {
    return stage.querySelector(selector);
  }

  /* Debounced global refresh: lazy poster loads settle in bursts, so many
     load events inside 250ms collapse into one refresh pass. setupMode()
     still runs per image; only the global recalc is batched. */
  let refreshTimer = 0;
  function refreshScrollTrigger() {
    if (!window.ScrollTrigger || !window.ScrollTrigger.refresh) return;
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(() => {
      if (window.ScrollTrigger && window.ScrollTrigger.refresh) {
        window.ScrollTrigger.refresh();
      }
    }, 250);
  }

  /* ---------- tape position ----------
     The viewport is never a scroll container (overflow: hidden), so the
     page wheel always moves the page — the tape only moves when the
     range slider is dragged, or a card is clicked / keyboard-focused.
     The strip is shifted with a transform; every write goes through the
     single quickTo (never killTweensOf — that would kill quickTo itself).
     state.x is the single source of truth. */

  function maxX(state) {
    return Math.max(0, state.strip.scrollWidth - state.viewport.clientWidth);
  }

  function setStrip(stage, state, x, animate) {
    const max = maxX(state);
    const target = Math.max(0, Math.min(x, max));
    state.x = target;
    state.viewport.scrollLeft = 0;
    if (state.moveTo) {
      state.moveTo(-target);
    } else {
      state.strip.style.transform = target
        ? "translate3d(" + -target + "px, 0, 0)"
        : "";
    }
    state.range.value = max ? String((target / max) * 100) : "0";
    return target;
  }

  function revealCard(stage, state, card, animate) {
    const max = maxX(state);
    if (!max) return;
    const contentX =
      card.getBoundingClientRect().left -
      state.strip.getBoundingClientRect().left;
    const target = Math.max(
      0,
      Math.min(contentX - state.viewport.clientWidth * 0.25, max)
    );
    setStrip(stage, state, target, animate);
  }

  function render(stage) {
    stage.innerHTML = "";
    stage.classList.add("series-stage");
    stage.classList.toggle("series-stage-reduced", REDUCED);

    const head = el("div", "series-stage-head");
    const headLeft = el("div", "series-stage-head-left");
    headLeft.appendChild(el("span", "series-stage-title", "NINETEEN SERIES"));
    headLeft.appendChild(el("span", "series-stage-sub", "BOX / TAPE"));
    const headRight = el("div", "series-stage-head-right");
    headRight.appendChild(el("span", "series-stage-count", "01-19"));
    head.appendChild(headLeft);
    head.appendChild(headRight);
    stage.appendChild(head);

    const viewport = el("div", "series-stage-viewport");
    const strip = el("div", "series-stage-strip");
    viewport.appendChild(strip);

    SERIES.forEach((item, index) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "series-card";
      card.dataset.seriesId = item.id;
      card.dataset.cursor = "OPEN";
      card.setAttribute("role", "button");
      card.setAttribute("aria-pressed", index === 0 ? "true" : "false");
      card.setAttribute("aria-label", item.title + ", " + item.years);

      const img = document.createElement("img");
      img.className = "series-card-img";
      img.src = item.poster;
      img.alt = "";
      img.loading = index === 0 ? "eager" : "lazy";
      img.decoding = "async";
      img.referrerPolicy = "no-referrer";

      const meta = el("span", "series-card-meta");
      meta.appendChild(el("span", "series-card-title", item.title));
      meta.appendChild(
        el("span", "series-card-meta-line", item.years + " / " + item.seasons)
      );
      meta.appendChild(el("span", "series-card-category", item.category));

      const sleeve = el("span", "series-card-sleeve");
      sleeve.setAttribute("aria-hidden", "true");
      sleeve.textContent = "OPEN";

      card.appendChild(el("span", "series-card-no", pad(index + 1)));
      card.appendChild(img);
      card.appendChild(meta);
      card.appendChild(sleeve);
      strip.appendChild(card);
    });

    stage.appendChild(viewport);

    const dragWrap = el("div", "series-stage-dragwrap");
    const range = document.createElement("input");
    range.type = "range";
    range.className = "series-stage-range";
    range.min = "0";
    range.max = "100";
    range.step = "0.1";
    range.value = "0";
    range.dataset.cursor = "DRAG";
    range.setAttribute("aria-label", "Series track position");
    dragWrap.appendChild(range);
    stage.appendChild(dragWrap);

    const detail = el("section", "series-stage-detail");
    detail.setAttribute("aria-label", "Selected series");

    const posterShell = el("div", "series-detail-poster");
    const poster = document.createElement("img");
    poster.className = "series-detail-img";
    poster.alt = "";
    poster.decoding = "async";
    poster.referrerPolicy = "no-referrer";
    posterShell.appendChild(poster);

    const copy = el("div", "series-detail-copy");
    const kicker = el("div", "series-detail-kicker");
    kicker.dataset.seriesReveal = "";
    kicker.appendChild(el("span", "series-detail-category", ""));
    kicker.appendChild(el("span", "series-detail-years", ""));

    const title = el("h3", "series-detail-title", "");
    title.dataset.seriesReveal = "";

    const seasons = el("div", "series-detail-seasons", "");
    seasons.dataset.seriesReveal = "";

    const quote = el("p", "series-detail-quote", "");
    quote.dataset.seriesReveal = "";

    const imdbButton = document.createElement("a");
    imdbButton.className = "series-detail-imdb";
    imdbButton.href = "#";
    imdbButton.target = "_blank";
    imdbButton.rel = "noopener";
    imdbButton.dataset.cursor = "VIEW";
    imdbButton.dataset.seriesReveal = "";
    imdbButton.textContent = "OPEN ON IMDb ↗";

    copy.appendChild(kicker);
    copy.appendChild(title);
    copy.appendChild(seasons);
    copy.appendChild(quote);
    copy.appendChild(imdbButton);
    detail.appendChild(posterShell);
    detail.appendChild(copy);
    stage.appendChild(detail);
  }

  function renderDetail(stage, item, animate) {
    const poster = q(stage, ".series-detail-img");
    const category = q(stage, ".series-detail-category");
    const years = q(stage, ".series-detail-years");
    const title = q(stage, ".series-detail-title");
    const seasons = q(stage, ".series-detail-seasons");
    const quote = q(stage, ".series-detail-quote");
    const imdbButton = q(stage, ".series-detail-imdb");
    if (!item) return;

    poster.src = item.poster;
    category.textContent = item.category;
    years.textContent = item.years;
    title.textContent = item.title;
    seasons.textContent = item.seasons;
    quote.textContent = item.quote;
    imdbButton.href = "https://www.imdb.com/title/" + item.imdb + "/";

    const revealParts = Array.from(
      stage.querySelectorAll("[data-series-reveal]")
    );
    if (canTween() && animate) {
      revealParts.forEach((part, i) => {
        window.gsap.fromTo(
          part,
          {
            clipPath: "inset(0 0 100% 0)",
            y: 16
          },
          {
            clipPath: "inset(0 0 0% 0)",
            y: 0,
            duration: 0.7,
            delay: 0.05 + i * 0.07,
            ease: "power3.out",
            clearProps: "clipPath,transform"
          }
        );
      });
    } else if (canTween()) {
      window.gsap.set(revealParts, {
        clipPath: "inset(0 0 0% 0)",
        y: 0,
        clearProps: "clipPath,transform"
      });
    } else {
      revealParts.forEach((part) => {
        part.style.clipPath = "";
        part.style.transform = "";
      });
    }

    if (poster.complete && poster.naturalWidth) {
      refreshScrollTrigger();
    } else {
      poster.addEventListener(
        "load",
        () => refreshScrollTrigger(),
        { once: true }
      );
      poster.addEventListener(
        "error",
        () => refreshScrollTrigger(),
        { once: true }
      );
    }
  }

  function selectCard(stage, card, animate) {
    if (!card) return;
    const cards = Array.from(stage.querySelectorAll(".series-card"));
    const index = cards.indexOf(card);
    if (index < 0) return;

    cards.forEach((item, i) => {
      const on = i === index;
      item.classList.toggle("is-active", on);
      item.setAttribute("aria-pressed", on ? "true" : "false");
    });

    renderDetail(stage, SERIES[index], animate !== false);
  }

  function bindInteractions(stage, state) {
    const viewport = state.viewport;
    const range = state.range;

    viewport.addEventListener("click", (event) => {
      const card = event.target.closest(".series-card");
      if (card) {
        selectCard(stage, card, true);
        revealCard(stage, state, card, !REDUCED);
      }
    });

    viewport.addEventListener("keydown", (event) => {
      const target = event.target.closest && event.target.closest(".series-card");
      if (!target) return;
      const cards = Array.from(state.strip.querySelectorAll(".series-card"));
      const index = cards.indexOf(target);
      if (index < 0) return;

      let next = -1;
      if (event.key === "ArrowRight") next = (index + 1) % cards.length;
      if (event.key === "ArrowLeft") next = (index - 1 + cards.length) % cards.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = cards.length - 1;
      if (next < 0) return;

      event.preventDefault();
      cards[next].focus({ preventScroll: true });
      selectCard(stage, cards[next], true);
      revealCard(stage, state, cards[next], !REDUCED);
    });

    range.addEventListener("input", () => {
      const ratio = parseFloat(range.value) / 100;
      setStrip(stage, state, ratio * maxX(state), !REDUCED);
    });

    stage.addEventListener("focusin", (event) => {
      const card = event.target.closest && event.target.closest(".series-card");
      if (card) selectCard(stage, card, true);
    });

    stage.querySelectorAll("img").forEach((img) => {
      if (img.complete && img.naturalWidth) return;
      img.addEventListener(
        "load",
        () => {
          setupMode(stage, state);
          refreshScrollTrigger();
        },
        { once: true }
      );
      img.addEventListener(
        "error",
        () => refreshScrollTrigger(),
        { once: true }
      );
    });
  }

  function setupMode(stage, state) {
    setStrip(stage, state, state.x || 0, false);
    refreshScrollTrigger();
  }

  function init(container) {
    if (!container || states.has(container)) return;
    render(container);

    const strip = q(container, ".series-stage-strip");
    const state = {
      viewport: q(container, ".series-stage-viewport"),
      strip: strip,
      range: q(container, ".series-stage-range"),
      x: 0,
      moveTo: canTween()
        ? window.gsap.quickTo(strip, "x", {
            duration: 0.35,
            ease: "power2.out"
          })
        : null
    };
    states.set(container, state);

    bindInteractions(container, state);
    selectCard(container, state.strip.querySelector(".series-card"), false);

    const boot = () => {
      setupMode(container, state);
      refreshScrollTrigger();
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", boot);
    } else {
      requestAnimationFrame(boot);
    }

    document.addEventListener(
      "click",
      (event) => {
        const tab = event.target.closest && event.target.closest(".tab-btn[data-tab='series']");
        if (!tab) return;
        window.setTimeout(() => setupMode(container, state), 420);
      }
    );

    let resizeTimer = null;
    window.addEventListener("resize", () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        setupMode(container, state);
        refreshScrollTrigger();
      }, 160);
    });
  }

  function destroy(container) {
    const state = states.get(container);
    if (!state) return;
    if (state.moveTo && window.gsap) {
      window.gsap.killTweensOf(state.strip, "x");
    }
    states.delete(container);
    container.innerHTML = "";
  }

  window.SeriesStage = {
    init,
    destroy,
    data: SERIES
  };

  function autoInit() {
    document
      .querySelectorAll("[data-series-stage='auto']")
      .forEach((container) => init(container));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoInit);
  } else {
    autoInit();
  }
})();
