(function () {
  "use strict";

  /* Film panel = the shared reel-stage factory (js/reel-stage.js) + film
     config. Emitted DOM class names are unchanged, so css and main.js keep
     binding; the count badge derives from FILM_DATA.length. */
  window.FilmStage = window.createReelStage({
    data: window.FILM_DATA,
    prefix: "film",
    mountSelector: "[data-film-stage='auto']",
    tabToken: "films",
    title: "SIXTEEN FILMS",
    sub: "MOTION / REEL",
    rangeAria: "Film track position",
    detailAria: "Selected film",
    cardAria: (f) => f.title + ", " + f.year,
    cardMetaLine: (f) => f.director + " / " + f.year,
    cardTag: { cls: "film-card-genre", get: (f) => f.genre },
    detailKicker: (f) => [
      { cls: "film-detail-genre", text: f.genre },
      { cls: "film-detail-year", text: f.year },
    ],
    detailLine: { cls: "film-detail-director", get: (f) => f.director },
  });
})();
