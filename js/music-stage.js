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
      card.setAttribute("data-cursor", "PLAY");
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
        GROUPS.forEach((group) => mount.appendChild(renderGenre(group)));
      });
    renderFilterChips(document.getElementById("genre-filter"));
  }

  /* Filter chips ("全部 · N" + one per genre). main.js binds the click
     filtering against [data-genre]; chips carry their own counts so the
     row doubles as a table of contents for the whole collection. */
  function renderFilterChips(mount) {
    if (!mount) return;
    const total = GROUPS.reduce((sum, group) => sum + group.tracks.length, 0);

    const all = el("button", "genre-chip mono is-active");
    all.type = "button";
    all.setAttribute("data-genre", "-1");
    all.setAttribute("aria-pressed", "true");
    all.setAttribute("lang", "zh");
    all.textContent = "全部 · " + total;
    mount.appendChild(all);

    GROUPS.forEach((group, i) => {
      const chip = el("button", "genre-chip mono");
      chip.type = "button";
      chip.setAttribute("data-genre", String(i));
      chip.setAttribute("aria-pressed", "false");
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
