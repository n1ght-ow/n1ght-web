(function () {
  "use strict";

  /* Series panel = the shared reel-stage factory (js/reel-stage.js) + series
     config. Emitted DOM class names are unchanged, so css and main.js keep
     binding; the count badge derives from SERIES_DATA.length. */
  window.SeriesStage = window.createReelStage({
    data: window.SERIES_DATA,
    prefix: "series",
    mountSelector: "[data-series-stage='auto']",
    tabToken: "series",
    title: "THIRTY-SIX SERIES",
    sub: "BOX / TAPE",
    detailAria: "Selected series",
    cardAria: (s) => s.title + ", " + s.years,
    cardMetaLine: (s) => s.years + " / " + s.seasons,
    cardTag: { cls: "series-card-category", get: (s) => s.category },
    detailKicker: (s) => [
      { cls: "series-detail-category", text: s.category },
      { cls: "series-detail-years", text: s.years },
    ],
    detailLine: { cls: "series-detail-seasons", get: (s) => s.seasons },
    /* a timeline by the FIRST season: parseInt reads the leading year out of
       both "1987" and "1995-2013" */
    sortKey: (s) => parseInt(s.years, 10) || 0,
  });
})();
