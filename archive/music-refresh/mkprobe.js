
const fs = require('fs');
const vm = require('vm');
const P = 'C:/Users/qsr/night-web/';
const D = P + 'archive/music-refresh/';
const sb = { window: {} }; vm.createContext(sb);
vm.runInContext(fs.readFileSync(P + 'js/music-data.js', 'utf8'), sb, { filename: 'm' });
vm.runInContext(fs.readFileSync(P + 'js/music-covers.js', 'utf8'), sb, { filename: 'c' });
const data = sb.window.MUSIC_DATA, covers = sb.window.MUSIC_COVERS;
const all = data.flatMap(g => g.tracks.map(t => ({ ...t, gid: g.id, zh: g.zh })));
const short = all.find(t => t.title === 'Dear my crazy soulmate');
const long = all.find(t => t.id === '1114831945') || all.filter(t => t.title.length > 18).sort((a, b) => b.title.length - a.title.length)[0];

const page = (t, file) => {
  const cover = covers[t.id];
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>probe</title>
<link rel="stylesheet" href="../../css/fonts.css">
<link rel="stylesheet" href="../../css/style.css">
<style>body{background:#111}</style></head><body>
<div class="lightbox is-open" id="lightbox" role="dialog" aria-modal="true" aria-label="detail" aria-hidden="false" data-detail="music">
  <div class="lb-top"><span id="lb-count">TRACK 02 / 08</span><span id="lb-act" class="lb-act">${t.zh}</span>
    <button class="lb-close" id="lb-close" type="button" aria-label="Close">Close</button></div>
  <figure class="lb-stage" id="lb-stage">
    <img id="lb-img" alt="" hidden>
    <div class="lb-music-head" id="lb-music-head">
      <p class="lb-meta-kicker" id="lb-music-kicker">${t.zh}</p>
      <h3 class="lb-meta-title" id="lb-music-title">${t.title}</h3>
      <p class="lb-meta-lines" id="lb-music-lines">${t.artist}</p>
    </div>
    <div class="lb-music" id="lb-music">
      <img class="lb-music-cover" id="lb-music-cover" alt="" src="../../album-covers/${cover}">
      <span class="lb-music-glyph" aria-hidden="true" hidden>♪</span>
    </div>
    <a class="lb-meta-link lb-music-link" id="lb-music-link" href="#">OPEN IN NETEASE</a>
    <figcaption id="lb-cap" class="lb-cap" hidden></figcaption>
  </figure>
  <div class="lb-meta" id="lb-meta" hidden></div>
  <button class="lb-nav lb-prev" id="lb-prev" type="button" aria-label="Previous">←</button>
  <button class="lb-nav lb-next" id="lb-next" type="button" aria-label="Next">→</button>
  <div class="lb-rail" id="lb-rail" hidden></div>
</div>
<pre id="probe"></pre>
<script>
window.addEventListener('load', () => {
  const q = (s) => document.querySelector(s).getBoundingClientRect();
  const r = q('.lb-music'), hr = q('.lb-music-head'), lr = q('.lb-music-link'), tr = q('.lb-top');
  const lines = Math.round(hr.height / (parseFloat(getComputedStyle(document.querySelector('.lb-meta-title')).fontSize) * 1.1) - 1.5) + 1;
  document.getElementById('probe').textContent = 'PROBE|' + [innerWidth, innerHeight,
    Math.round(r.width), Math.round(hr.top), Math.round(hr.bottom), Math.round(r.top), Math.round(r.bottom),
    Math.round(lr.top), Math.round(lr.bottom), Math.round(tr.bottom),
    Math.round(r.top - hr.bottom), Math.round(lr.top - r.bottom), Math.round(hr.height)].join('|') + '|END';
});
</script></body></html>`;
};
fs.writeFileSync(D + 'probe.html', page(short, 'probe'));
fs.writeFileSync(D + 'probe-long.html', page(long, 'probe-long'));
console.log('short:', short.title, '| long:', long.title, '(' + long.title.length + ' chars)');
