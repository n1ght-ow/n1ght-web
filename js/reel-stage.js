(function () {
  "use strict";

  /* Shared reel-stage factory: ONE implementation behind the film and series
     panels. The adapters (film-stage.js / series-stage.js) only pass config;
     every emitted class name stays prefixed per panel, so css and main.js
     bindings are untouched. See AGENTS.md for the config contract.

     options = {
       data:            [...]                      // already-defined data array
       prefix:          "film" | "series"          // class/attr/dataset prefix
       mountSelector:   "[data-film-stage='auto']" // containers to render into
       tabToken:        "films"                    // .tab-btn[data-tab=...] that
                                                   // re-measures after the wipe
       title, sub:      head texts ("SIXTEEN FILMS", "MOTION / REEL")
       rangeAria:       aria-label for the range slider
       detailAria:      aria-label for the detail section
       cardAria:        item => accessible name for a card button
       cardMetaLine:    item => "director / year" style meta line
       cardTag:         { cls, get }               // third meta line
       detailKicker:    item => [{ cls, text }, { cls, text }]
       detailLine:      { cls, get }               // middle line under title
     } */

  const states = new WeakMap();
  const pad = (n) => String(n).padStart(2, "0");

  /* CJK-bearing lines get lang="zh" so the browser picks proper system
     CJK fallback fonts (site fonts are latin-subset only). */
  const CJK = /[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]/;
  function tagLang(node, text) {
    if (CJK.test(String(text))) node.setAttribute("lang", "zh");
    else node.removeAttribute("lang");
  }

  window.createReelStage = function (options) {
    let items = (options.data || []).slice();
    const REDUCED = window.matchMedia
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;
    const prefix = options.prefix;

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

    /* ---------- reel position ----------
       The viewport is never a scroll container (overflow: hidden), so the
       page wheel always moves the page — the reel only moves when the
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
      stage.classList.add(prefix + "-stage");
      stage.classList.toggle(prefix + "-stage-reduced", REDUCED);

      const head = el("div", prefix + "-stage-head");
      const headLeft = el("div", prefix + "-stage-head-left");
      headLeft.appendChild(el("span", prefix + "-stage-title", options.title));
      headLeft.appendChild(el("span", prefix + "-stage-sub", options.sub));
      const headRight = el("div", prefix + "-stage-head-right");
      headRight.appendChild(el("span", prefix + "-stage-count", "01-" + pad(items.length)));
      head.appendChild(headLeft);
      head.appendChild(headRight);
      stage.appendChild(head);

      const viewport = el("div", prefix + "-stage-viewport");
      const strip = el("div", prefix + "-stage-strip");
      viewport.appendChild(strip);

      items.forEach((item, index) => {
        const card = document.createElement("button");
        card.type = "button";
        card.className = prefix + "-card";
        card.dataset[prefix + "Id"] = item.id;
        card.dataset.cursor = "OPEN";
        card.setAttribute("role", "button");
        card.setAttribute("aria-pressed", index === 0 ? "true" : "false");
        card.setAttribute("aria-label", options.cardAria(item));

        const img = document.createElement("img");
        img.className = prefix + "-card-img";
        img.src = item.poster;
        img.alt = "";
        img.loading = index === 0 ? "eager" : "lazy";
        img.decoding = "async";
        img.referrerPolicy = "no-referrer";

        const meta = el("span", prefix + "-card-meta");
        const titleEl = el("span", prefix + "-card-title", item.title);
        tagLang(titleEl, item.title);
        meta.appendChild(titleEl);
        const metaLine = el("span", prefix + "-card-meta-line", options.cardMetaLine(item));
        tagLang(metaLine, metaLine.textContent);
        meta.appendChild(metaLine);
        const tag = options.cardTag;
        meta.appendChild(el("span", tag.cls, tag.get(item)));

        const sleeve = el("span", prefix + "-card-sleeve");
        sleeve.setAttribute("aria-hidden", "true");
        sleeve.textContent = "OPEN";

        card.appendChild(el("span", prefix + "-card-no", pad(index + 1)));
        card.appendChild(img);
        card.appendChild(meta);
        card.appendChild(sleeve);
        strip.appendChild(card);
      });

      stage.appendChild(viewport);

      const dragWrap = el("div", prefix + "-stage-dragwrap");
      const range = document.createElement("input");
      range.type = "range";
      range.className = prefix + "-stage-range";
      range.min = "0";
      range.max = "100";
      range.step = "0.1";
      range.value = "0";
      range.dataset.cursor = "DRAG";
      range.setAttribute("aria-label", options.rangeAria);
      dragWrap.appendChild(range);
      stage.appendChild(dragWrap);

      const detail = el("section", prefix + "-stage-detail");
      detail.setAttribute("aria-label", options.detailAria);

      const posterShell = el("div", prefix + "-detail-poster");
      const poster = document.createElement("img");
      poster.className = prefix + "-detail-img";
      poster.alt = "";
      poster.decoding = "async";
      poster.referrerPolicy = "no-referrer";
      posterShell.appendChild(poster);

      const copy = el("div", prefix + "-detail-copy");
      const kicker = el("div", prefix + "-detail-kicker");
      kicker.dataset[prefix + "Reveal"] = "";
      options.detailKicker(items[0] || {}).forEach((part) => {
        kicker.appendChild(el("span", part.cls, ""));
      });

      const title = el("h3", prefix + "-detail-title", "");
      title.dataset[prefix + "Reveal"] = "";

      const line = el("div", options.detailLine.cls, "");
      line.dataset[prefix + "Reveal"] = "";

      const quote = el("p", prefix + "-detail-quote", "");
      quote.dataset[prefix + "Reveal"] = "";

      const imdbButton = document.createElement("a");
      imdbButton.className = prefix + "-detail-imdb";
      imdbButton.href = "#";
      imdbButton.target = "_blank";
      imdbButton.rel = "noopener";
      imdbButton.dataset.cursor = "VIEW";
      imdbButton.dataset[prefix + "Reveal"] = "";
      imdbButton.textContent = "OPEN ON IMDb ↗";

      copy.appendChild(kicker);
      copy.appendChild(title);
      copy.appendChild(line);
      copy.appendChild(quote);
      copy.appendChild(imdbButton);
      detail.appendChild(posterShell);
      detail.appendChild(copy);
      stage.appendChild(detail);
    }

    function renderDetail(stage, item, animate) {
      const poster = q(stage, "." + prefix + "-detail-img");
      const title = q(stage, "." + prefix + "-detail-title");
      const line = q(stage, "." + options.detailLine.cls);
      const quote = q(stage, "." + prefix + "-detail-quote");
      const imdbButton = q(stage, "." + prefix + "-detail-imdb");
      if (!item) return;

      poster.src = item.poster;
      const kickerSpans = stage.querySelectorAll("." + prefix + "-detail-kicker > span");
      options.detailKicker(item).forEach((part, i) => {
        if (kickerSpans[i]) kickerSpans[i].textContent = part.text;
      });
      title.textContent = item.title;
      tagLang(title, item.title);
      line.textContent = options.detailLine.get(item);
      tagLang(line, options.detailLine.get(item));
      quote.textContent = item.quote;
      tagLang(quote, item.quote);
      imdbButton.href = "https://www.imdb.com/title/" + item.imdb + "/";

      const revealParts = Array.from(
        stage.querySelectorAll("[data-" + prefix + "-reveal]")
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
      const cards = Array.from(stage.querySelectorAll("." + prefix + "-card"));
      const index = cards.indexOf(card);
      if (index < 0) return;

      cards.forEach((item, i) => {
        const on = i === index;
        item.classList.toggle("is-active", on);
        item.setAttribute("aria-pressed", on ? "true" : "false");
      });

      renderDetail(stage, items[index], animate !== false);
    }

    function bindInteractions(stage, state) {
      const viewport = state.viewport;
      const range = state.range;

      viewport.addEventListener("click", (event) => {
        const card = event.target.closest("." + prefix + "-card");
        if (card) {
          selectCard(stage, card, true);
          revealCard(stage, state, card, !REDUCED);
        }
      });

      viewport.addEventListener("keydown", (event) => {
        const target = event.target.closest && event.target.closest("." + prefix + "-card");
        if (!target) return;
        const cards = Array.from(state.strip.querySelectorAll("." + prefix + "-card"));
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
        const card = event.target.closest && event.target.closest("." + prefix + "-card");
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

      const strip = q(container, "." + prefix + "-stage-strip");
      const state = {
        viewport: q(container, "." + prefix + "-stage-viewport"),
        strip: strip,
        range: q(container, "." + prefix + "-stage-range"),
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
      selectCard(container, state.strip.querySelector("." + prefix + "-card"), false);

      const boot = () => {
        setupMode(container, state);
        refreshScrollTrigger();
      };

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
      } else {
        requestAnimationFrame(boot);
      }

      const onTabClick = (event) => {
        const tab = event.target.closest && event.target.closest(".tab-btn[data-tab='" + options.tabToken + "']");
        if (!tab) return;
        window.setTimeout(() => setupMode(container, state), 420);
      };
      document.addEventListener("click", onTabClick);

      let resizeTimer = null;
      const onResize = () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => {
          setupMode(container, state);
          refreshScrollTrigger();
        }, 160);
      };
      window.addEventListener("resize", onResize);

      state.cleanup = () => {
        document.removeEventListener("click", onTabClick);
        window.removeEventListener("resize", onResize);
        window.clearTimeout(resizeTimer);
      };
    }

    function destroy(container) {
      const state = states.get(container);
      if (!state) return;
      if (state.cleanup) state.cleanup();
      if (state.moveTo && window.gsap) {
        window.gsap.killTweensOf(state.strip, "x");
      }
      states.delete(container);
      container.innerHTML = "";
    }

    /* Re-render every mounted stage with a new data order. The archive
       toolbar uses this for film/series filter + sort without rewriting
       the data layer. */
    function setData(nextItems) {
      items = Array.isArray(nextItems) ? nextItems.slice() : [];
      document
        .querySelectorAll(options.mountSelector)
        .forEach((container) => {
          destroy(container);
          init(container);
        });
    }

    function autoInit() {
      document
        .querySelectorAll(options.mountSelector)
        .forEach((container) => init(container));
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", autoInit);
    } else {
      autoInit();
    }

    return {
      init,
      destroy,
      setData,
      get data() {
        return items.slice();
      }
    };
  };
})();
