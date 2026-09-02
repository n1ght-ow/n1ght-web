(function () {
  "use strict";

  const SERIES = (window.SERIES_DATA || []).slice();
  const REDUCED = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
  const COARSE = window.matchMedia
    ? window.matchMedia("(pointer: coarse)").matches
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

  function refreshScrollTrigger() {
    if (window.ScrollTrigger && window.ScrollTrigger.refresh) {
      window.ScrollTrigger.refresh();
    }
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
    viewport.dataset.cursor = "DRAG";
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
    const strip = state.strip;
    const range = state.range;

    viewport.addEventListener("click", (event) => {
      const card = event.target.closest(".series-card");
      if (!card) return;
      selectCard(stage, card, true);
      const max = Math.max(0, strip.scrollWidth - viewport.clientWidth);
      if (max && !state.tween) {
        viewport.scrollTo({
          left: Math.min(card.offsetLeft - viewport.clientWidth * 0.25, max),
          behavior: REDUCED ? "auto" : "smooth"
        });
      }
    });

    viewport.addEventListener("keydown", (event) => {
      const target = event.target.closest && event.target.closest(".series-card");
      if (!target) return;
      const cards = Array.from(strip.querySelectorAll(".series-card"));
      const index = cards.indexOf(target);
      if (index < 0) return;

      let next = -1;
      if (event.key === "ArrowRight") next = (index + 1) % cards.length;
      if (event.key === "ArrowLeft") next = (index - 1 + cards.length) % cards.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = cards.length - 1;
      if (next < 0) return;

      event.preventDefault();
      cards[next].focus();
      selectCard(stage, cards[next], true);
      if (!state.tween) {
        cards[next].scrollIntoView({
          inline: "nearest",
          block: "nearest",
          behavior: REDUCED ? "auto" : "smooth"
        });
      }
    });

    range.addEventListener("input", () => {
      const ratio = parseFloat(range.value) / 100;
      if (state.tween) {
        state.tween.progress(ratio);
        range.value = String(ratio * 100);
      } else {
        const max = Math.max(0, strip.scrollWidth - viewport.clientWidth);
        viewport.scrollLeft = max ? ratio * max : 0;
      }
    });

    viewport.addEventListener(
      "scroll",
      () => {
        if (state.tween) return;
        const max = Math.max(0, strip.scrollWidth - viewport.clientWidth);
        range.value = max ? String((viewport.scrollLeft / max) * 100) : "0";
      },
      { passive: true }
    );

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

  function isInActiveTab(stage) {
    const panel = stage.closest(".tab-panel");
    return !panel || panel.classList.contains("is-active");
  }

  function setupMode(stage, state) {
    const viewport = state.viewport;
    const strip = state.strip;
    const range = state.range;
    const max = Math.max(0, strip.scrollWidth - viewport.clientWidth);
    const visible =
      document.body.contains(stage) &&
      stage.offsetParent !== null &&
      viewport.clientWidth > 0;
    const shouldPin =
      visible && max > 0 && isInActiveTab(stage) && !COARSE && canTween();

    if (shouldPin && state.tween) {
      viewport.classList.add("series-stage-viewport--driven");
      if (state.tween.scrollTrigger) state.tween.scrollTrigger.refresh();
      return;
    }

    if (shouldPin) {
      viewport.classList.add("series-stage-viewport--driven");
      viewport.scrollLeft = 0;
      state.tween = window.gsap.to(strip, {
        x: () => -Math.max(0, strip.scrollWidth - viewport.clientWidth),
        ease: "none",
        scrollTrigger: {
          trigger: stage,
          start: "top top",
          end: () =>
            "+=" + Math.max(0, strip.scrollWidth - viewport.clientWidth),
          scrub: true,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            range.value = String(self.progress * 100);
          }
        }
      });
    } else {
      if (state.tween) {
        if (state.tween.scrollTrigger) state.tween.scrollTrigger.kill(true);
        state.tween.kill();
        state.tween = null;
      }
      viewport.classList.remove("series-stage-viewport--driven");
      const pct = max ? (viewport.scrollLeft / max) * 100 : 0;
      range.value = String(pct);
      refreshScrollTrigger();
    }
  }

  function init(container) {
    if (!container || states.has(container)) return;
    render(container);

    const state = {
      viewport: q(container, ".series-stage-viewport"),
      strip: q(container, ".series-stage-strip"),
      range: q(container, ".series-stage-range"),
      tween: null
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
    if (state.tween) {
      if (state.tween.scrollTrigger) state.tween.scrollTrigger.kill(true);
      state.tween.kill();
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
