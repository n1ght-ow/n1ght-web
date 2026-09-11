(function () {
  "use strict";

  /* Renders window.MUSIC_DATA into .playlist[data-music-stage="auto"].
     The search box and the #music-drawer shell stay in index.html; this
     file owns everything inside .playlist. main.js binds initGroupAccordion
     (genre-head + nextElementSibling), initMusicSearch and initNetEaseLinks
     against the same classes emitted here, so the markup must stay
     equivalent to the formerly hardcoded panel. */

  const GROUPS = (window.MUSIC_DATA || []).slice();

  /* CJK-bearing lines get lang="zh" so the browser picks proper system
     CJK fallback fonts (site fonts are latin-subset only). */
  const CJK = /[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]/;

  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function tagLang(node, text) {
    if (CJK.test(String(text))) node.setAttribute("lang", "zh");
    else node.removeAttribute("lang");
  }

  function renderGenre(group) {
    const genre = el("div", "genre");
    if (group.groupLang === "zh") genre.setAttribute("lang", "zh");

    const head = el("div", "genre-head");
    const title = el("h3", "genre-title");
    if (group.groupLang === "zh") {
      // the whole group is zh: plain "华语流行 / MANDARIN POP"
      title.textContent = group.zh + " / " + group.en;
    } else {
      // english group: wrap only the zh segment for font fallback
      const zhSpan = document.createElement("span");
      zhSpan.setAttribute("lang", "zh");
      zhSpan.textContent = group.zh;
      title.appendChild(zhSpan);
      title.appendChild(document.createTextNode(" / " + group.en));
    }
    head.appendChild(title);
    head.appendChild(el("span", "genre-count mono", String(group.tracks.length) + " 首"));
    genre.appendChild(head);

    const index = el("div", "track-index");
    const row = el("div", "artist-row");
    const list = el("div", "artist-tracks");
    group.tracks.forEach((t) => {
      const card = el("article", "idx-card track-own");
      card.setAttribute("data-song-id", t.id);

      const titleEl = el("h3", "idx-title", t.title);
      tagLang(titleEl, t.title);
      const artistEl = el("span", "idx-artist mono", t.artist);
      tagLang(artistEl, t.artist);

      card.appendChild(titleEl);
      card.appendChild(artistEl);
      list.appendChild(card);
    });
    row.appendChild(list);
    index.appendChild(row);
    genre.appendChild(index);
    return genre;
  }

  function init() {
    document
      .querySelectorAll("[data-music-stage='auto']")
      .forEach((mount) => {
        mount.replaceChildren();
        const genres = GROUPS.map((group) => {
          const genre = renderGenre(group);
          mount.appendChild(genre);
          return genre;
        });
        // one genre is visible at a time; POP (index 0) opens by default and
        // every other group stays off until its chip is picked
        genres.forEach((genre, i) => { genre.hidden = i !== 0; });
      });
    renderFilterChips(document.getElementById("genre-filter"));
  }

  /* Filter chips (one per genre, no "all" option). main.js binds the click
     filtering against [data-genre]; chips carry their own counts so the
     row doubles as a table of contents for the whole collection. The first
     chip is the default active genre and drives the initial panel state. */
  function renderFilterChips(mount) {
    if (!mount) return;

    GROUPS.forEach((group, i) => {
      const chip = el("button", i === 0 ? "genre-chip mono is-active" : "genre-chip mono");
      chip.type = "button";
      chip.setAttribute("data-genre", String(i));
      chip.setAttribute("aria-pressed", i === 0 ? "true" : "false");
      const label = (group.groupLang === "zh" ? group.zh : group.en) + " · " + group.tracks.length;
      chip.textContent = label;
      tagLang(chip, label);
      mount.appendChild(chip);
    });
  }

  /* Render synchronously: this script sits after the #panel-music mount in
     <body>, and main.js (loaded right after) binds the accordion, search and
     NetEase links inline — it expects the cards to already exist, exactly as
     they did when the panel was hardcoded HTML. */
  init();
})();
