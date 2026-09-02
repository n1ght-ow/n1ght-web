(function () {
  "use strict";

  const FILMS = (window.FILM_DATA || []).slice();
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
    stage.classList.add("film-stage");
    stage.classList.toggle("film-stage-reduced", REDUCED);

    const head = el("div", "film-stage-head");
    const headLeft = el("div", "film-stage-head-left");
    headLeft.appendChild(el("span", "film-stage-title", "SIXTEEN FILMS"));
    headLeft.appendChild(el("span", "film-stage-sub", "MOTION / REEL"));
    const headRight = el("div", "film-stage-head-right");
    headRight.appendChild(el("span", "film-stage-count", "01-16"));
    head.appendChild(headLeft);
    head.appendChild(headRight);
    stage.appendChild(head);

    const viewport = el("div", "film-stage-viewport");
    viewport.dataset.cursor = "DRAG";
    const strip = el("div", "film-stage-strip");
    viewport.appendChild(strip);

    FILMS.forEach((film, index) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "film-card";
      card.dataset.filmId = film.id;
      card.dataset.cursor = "OPEN";
      card.setAttribute("role", "button");
      card.setAttribute("aria-pressed", index === 0 ? "true" : "false");
      card.setAttribute("aria-label", film.title + ", " + film.year);

      const img = document.createElement("img");
      img.className = "film-card-img";
      img.src = film.poster;
      img.alt = "";
      img.loading = index === 0 ? "eager" : "lazy";
      img.decoding = "async";
      img.referrerPolicy = "no-referrer";

      const meta = el("span", "film-card-meta");
      meta.appendChild(el("span", "film-card-title", film.title));
      meta.appendChild(
        el("span", "film-card-meta-line", film.director + " / " + film.year)
      );
      meta.appendChild(el("span", "film-card-genre", film.genre));

      const sleeve = el("span", "film-card-sleeve");
      sleeve.setAttribute("aria-hidden", "true");
      sleeve.textContent = "OPEN";

      card.appendChild(el("span", "film-card-no", pad(index + 1)));
      card.appendChild(img);
      card.appendChild(meta);
      card.appendChild(sleeve);
      strip.appendChild(card);
    });

    stage.appendChild(viewport);

    const dragWrap = el("div", "film-stage-dragwrap");
    const range = document.createElement("input");
    range.type = "range";
    range.className = "film-stage-range";
    range.min = "0";
    range.max = "100";
    range.step = "0.1";
    range.value = "0";
    range.dataset.cursor = "DRAG";
    range.setAttribute("aria-label", "Film track position");
    dragWrap.appendChild(range);
    stage.appendChild(dragWrap);

    const detail = el("section", "film-stage-detail");
    detail.setAttribute("aria-label", "Selected film");

    const posterShell = el("div", "film-detail-poster");
    const poster = document.createElement("img");
    poster.className = "film-detail-img";
    poster.alt = "";
    poster.decoding = "async";
    poster.referrerPolicy = "no-referrer";
    posterShell.appendChild(poster);

    const copy = el("div", "film-detail-copy");
    const kicker = el("div", "film-detail-kicker");
    kicker.dataset.filmReveal = "";
    kicker.appendChild(el("span", "film-detail-genre", ""));
    kicker.appendChild(el("span", "film-detail-year", ""));

    const title = el("h3", "film-detail-title", "");
    title.dataset.filmReveal = "";

    const director = el("div", "film-detail-director", "");
    director.dataset.filmReveal = "";

    const quote = el("p", "film-detail-quote", "");
    quote.dataset.filmReveal = "";

    const imdbButton = document.createElement("a");
    imdbButton.className = "film-detail-imdb";
    imdbButton.href = "#";
    imdbButton.target = "_blank";
    imdbButton.rel = "noopener";
    imdbButton.dataset.cursor = "VIEW";
    imdbButton.dataset.filmReveal = "";
    imdbButton.textContent = "OPEN ON IMDb ↗";

    copy.appendChild(kicker);
    copy.appendChild(title);
    copy.appendChild(director);
    copy.appendChild(quote);
    copy.appendChild(imdbButton);
    detail.appendChild(posterShell);
    detail.appendChild(copy);
    stage.appendChild(detail);
  }

  function renderDetail(stage, film, animate) {
    const poster = q(stage, ".film-detail-img");
    const genre = q(stage, ".film-detail-genre");
    const year = q(stage, ".film-detail-year");
    const title = q(stage, ".film-detail-title");
    const director = q(stage, ".film-detail-director");
    const quote = q(stage, ".film-detail-quote");
    const imdbButton = q(stage, ".film-detail-imdb");
    if (!film) return;

    poster.src = film.poster;
    genre.textContent = film.genre;
    year.textContent = film.year;
    title.textContent = film.title;
    director.textContent = film.director;
    quote.textContent = film.quote;
    imdbButton.href = "https://www.imdb.com/title/" + film.imdb + "/";

    const revealParts = Array.from(
      stage.querySelectorAll("[data-film-reveal]")
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
    const cards = Array.from(stage.querySelectorAll(".film-card"));
    const index = cards.indexOf(card);
    if (index < 0) return;

    cards.forEach((item, i) => {
      const on = i === index;
      item.classList.toggle("is-active", on);
      item.setAttribute("aria-pressed", on ? "true" : "false");
    });

    renderDetail(stage, FILMS[index], animate !== false);
  }

  function bindInteractions(stage, state) {
    const viewport = state.viewport;
    const strip = state.strip;
    const range = state.range;

    viewport.addEventListener("click", (event) => {
      const card = event.target.closest(".film-card");
      if (card) {
        selectCard(stage, card, true);
        const max = Math.max(0, strip.scrollWidth - viewport.clientWidth);
        if (max && !state.tween) {
          viewport.scrollTo({
            left: Math.min(card.offsetLeft - viewport.clientWidth * 0.25, max),
            behavior: REDUCED ? "auto" : "smooth"
          });
        }
      }
    });

    viewport.addEventListener("keydown", (event) => {
      const target = event.target.closest && event.target.closest(".film-card");
      if (!target) return;
      const cards = Array.from(strip.querySelectorAll(".film-card"));
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
      const card = event.target.closest && event.target.closest(".film-card");
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
      viewport.classList.add("film-stage-viewport--driven");
      if (state.tween.scrollTrigger) state.tween.scrollTrigger.refresh();
      return;
    }

    if (shouldPin) {
      viewport.classList.add("film-stage-viewport--driven");
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
      viewport.classList.remove("film-stage-viewport--driven");
      const pct = max ? (viewport.scrollLeft / max) * 100 : 0;
      range.value = String(pct);
      refreshScrollTrigger();
    }
  }

  function init(container) {
    if (!container || states.has(container)) return;
    render(container);

    const state = {
      viewport: q(container, ".film-stage-viewport"),
      strip: q(container, ".film-stage-strip"),
      range: q(container, ".film-stage-range"),
      tween: null
    };
    states.set(container, state);

    bindInteractions(container, state);
    selectCard(container, state.strip.querySelector(".film-card"), false);

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
        const tab = event.target.closest && event.target.closest(".tab-btn[data-tab='films']");
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

  window.FilmStage = {
    init,
    destroy,
    data: FILMS
  };

  function autoInit() {
    document
      .querySelectorAll("[data-film-stage='auto']")
      .forEach((container) => init(container));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoInit);
  } else {
    autoInit();
  }
})();
