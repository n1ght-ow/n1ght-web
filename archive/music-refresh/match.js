
const fs = require('fs');
const D = 'C:/Users/qsr/night-web/archive/music-refresh/';
const rd = (f) => JSON.parse(fs.readFileSync(D + f, 'utf8').replace(/^\uFEFF/, ''));
const playlist = rd('playlist.json');
const project = rd('project-full.json');
const stripParen = (s) => s.replace(/[\uFF08(][^\uFF09)]*[\uFF09)]/g, ' ');
const normTitle = (s) => stripParen(s)
  .replace(/[\uFF0C,\u3002.\u3001\u00B7!\uFF01?\uFF1F'\u2018\u2019"\u201C\u201D\u300A\u300B<>\[\]\u3010\u3011\-\u2014\u2013_~:\uFF1A;\uFF1B|\/\\]/g, '')
  .replace(/\s+/g, '').toLowerCase();
const normArtist = (a) => a.split(/[\/&\u3001]/).map(x => x.trim().toLowerCase()).filter(Boolean).sort().join('|');
const pIdx = new Map(), pTitle = new Map();
for (const t of project) {
  const k = normTitle(t.title) + '||' + normArtist(t.artist);
  if (!pIdx.has(k)) pIdx.set(k, []);
  pIdx.get(k).push(t);
  const kt = normTitle(t.title);
  if (!pTitle.has(kt)) pTitle.set(kt, []);
  pTitle.get(kt).push(t);
}
const exact = [], loose = [], none = [];
for (const r of playlist) {
  const k = normTitle(r.title) + '||' + normArtist(r.artist);
  if (pIdx.has(k)) { exact.push({ ...r, proj: pIdx.get(k) }); continue; }
  const byT = pTitle.get(normTitle(r.title));
  if (byT) { loose.push({ ...r, proj: byT }); continue; }
  none.push(r);
}
fs.writeFileSync(D + 'match-stage1.json', JSON.stringify({ exact, loose, none }, null, 1));
console.log('exact', exact.length, 'loose', loose.length, 'none', none.length);
console.log('loose:', loose.map(r => '#' + r.idx + ' ' + r.title + '/' + r.artist).join(' | '));
