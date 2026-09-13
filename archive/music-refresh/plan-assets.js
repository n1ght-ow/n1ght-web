
const fs = require('fs');
const D = 'C:/Users/qsr/night-web/archive/music-refresh/';
const rd = (f) => JSON.parse(fs.readFileSync(D + f, 'utf8').replace(/^\uFEFF/, ''));
const scored = rd('scored.json');
const chosen = rd('chosen-details.json');
const cmap = new Map(chosen.map(c => [String(c.id), c]));
const lines = [];
for (const r of scored) {
  lines.push('c' + r.idx + '.jpg\t' + D + 'covers/' + r.idx + '.png');
  if (r.proj) lines.push('p' + r.proj.id + '.jpg\t' + D + 'imgcache/proj-' + r.proj.id + '.img');
  if ((r.verdict === 'replace' || r.verdict === 'new')) {
    const c = cmap.get(String(r.chosen.id));
    const url = (c && c.cover) || r.chosen.cover;
    if (url) lines.push('n' + r.idx + '.jpg\t' + url);
  }
}
fs.writeFileSync(D + 'assets-plan.tsv', lines.join('\n'));
console.log('plan lines:', lines.length);
// also fold the fresh covers/details back into scored for the report
for (const r of scored) {
  const c = cmap.get(String(r.chosen ? r.chosen.id : ''));
  if (c) { r.chosen.cover = c.cover; r.chosen.album = c.album || r.chosen.album; r.chosen.duration = c.duration; r.chosen.artist = c.artist || r.chosen.artist; }
}
fs.writeFileSync(D + 'scored.json', JSON.stringify(scored, null, 1));
console.log('scored.json updated with fresh album covers');
