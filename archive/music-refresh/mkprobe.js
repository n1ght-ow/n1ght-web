const fs = require('fs');
const vm = require('vm');
const P = 'C:/Users/qsr/night-web/';
const D = P + 'archive/music-refresh/';
const sb = { window: {} }; vm.createContext(sb);
vm.runInContext(fs.readFileSync(P + 'js/music-data.js', 'utf8'), sb, { filename: 'm' });
vm.runInContext(fs.readFileSync(P + 'js/music-covers.js', 'utf8'), sb, { filename: 'c' });
const data = sb.window.MUSIC_DATA, covers = sb.window.MUSIC_COVERS;
const all = data.flatMap(g => g.tracks.map(t => ({ ...t, zh: g.zh })));
const short = all.find(t => t.title === 'Dear my crazy soulmate');
const long = all.filter(t => t.title.length > 18).sort((a, b) => b.title.length - a.title.length)[0];
function page(t) {
  const cover = covers[t.id];
  return [
    '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>probe</title>',
    '<link rel="stylesheet" href="../../css/fonts.css">',
    '<link rel="stylesheet" href="../../css/style.css">',
    '<style>body{background:#111}</style></head><body>',
    '<div class="lightbox is-open" id="lightbox" role="dialog" aria-modal="true" aria-label="detail" aria-hidden="false" data-detail="music">',
    '  <div class="lb-top" id="lb-top">',
    '    <span id="lb-count" class="lb-count">TRACK 02 / 08</span>',
    '    <span id="lb-act" class="lb-act">' + t.zh + '</span>',
    '    <button class="lb-close" id="lb-close" type="button" aria-label="Close">Close</button>',
    '  </div>',
    '  <figure class="lb-stage" id="lb-stage">',
    '    <img id="lb-img" alt="" hidden>',
    '    <div class="lb-music-head" id="lb-music-head">',
    '      <h3 class="lb-meta-title" id="lb-music-title">' + t.title + '</h3>',
    '      <p class="lb-meta-lines" id="lb-music-lines">' + t.artist + '</p>',
    '    </div>',
    '    <div class="lb-music" id="lb-music">',
    '      <img class="lb-music-cover" id="lb-music-cover" alt="" src="../../album-covers/' + cover + '">',
    '      <span class="lb-music-glyph" aria-hidden="true" hidden>~</span>',
    '    </div>',
    '    <a class="lb-meta-link lb-music-link" id="lb-music-link" href="#">OPEN IN NETEASE</a>',
    '    <figcaption id="lb-cap" class="lb-cap" hidden></figcaption>',
    '  </figure>',
    '  <div class="lb-meta" id="lb-meta" hidden></div>',
    '  <button class="lb-nav lb-prev" id="lb-prev" type="button" aria-label="Previous">&larr;</button>',
    '  <button class="lb-nav lb-next" id="lb-next" type="button" aria-label="Next">&rarr;</button>',
    '  <div class="lb-rail" id="lb-rail" hidden></div>',
    '</div>',
    '<pre id="probe"></pre>',
    '<script>',
    'window.addEventListener("load", function () {',
    '  var g = function (s) { return document.querySelector(s).getBoundingClientRect(); };',
    '  var cv = g(".lb-music"), hd = g(".lb-music-head"), lk = g(".lb-music-link");',
    '  var tp = g(".lb-top"), ti = g(".lb-meta-title"), ln = g(".lb-meta-lines");',
    '  var cnt = g("#lb-count"), act = g(".lb-act"), cls = g(".lb-close");',
    '  var pv = g(".lb-prev"), nx = g(".lb-next");',
    '  var r = function (v) { return Math.round(v * 10) / 10; };',
    '  var out = [',
    '    "vw=" + innerWidth, "vh=" + innerHeight,',
    '    "cvL=" + r(cv.left), "cvR=" + r(cv.right), "cvC=" + r((cv.left + cv.right) / 2), "cvW=" + r(cv.width),',
    '    "hdT=" + r(hd.top), "hdB=" + r(hd.bottom), "lkB=" + r(lk.bottom), "barB=" + r(tp.bottom),',
    '    "actC=" + r((act.left + act.right) / 2),',
    '    "cntL=" + r(cnt.left), "clsR=" + r(cls.right),',
    '    "pvL=" + r(pv.left), "pvR=" + r(pv.right), "nxL=" + r(nx.left), "nxR=" + r(nx.right),',
    '    "tiB=" + r(ti.bottom), "lnT=" + r(ln.top)',
    '  ];',
    '  document.getElementById("probe").textContent = "PROBE|" + out.join("|") + "|END";',
    '});',
    '</' + 'script></body></html>'
  ].join('\n');
}
fs.writeFileSync(D + 'probe.html', page(short));
fs.writeFileSync(D + 'probe-long.html', page(long));
console.log('probes rebuilt (no kicker) | long:', long.title.slice(0, 36));