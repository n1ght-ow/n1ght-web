
const fs = require('fs');
const win = {}; new Function('window', fs.readFileSync('js/music-data.js','utf8'))(win);
const data = win.MUSIC_DATA;
const res = "{\"pop\":{\"name\":\"N1GHT · POP\",\"id\":\"18388069648\",\"want\":139,\"added\":3},\"ballad\":{\"name\":\"N1GHT · BALLAD\",\"id\":\"18388009980\",\"want\":40,\"added\":1},\"rock\":{\"name\":\"N1GHT · ROCK\",\"id\":\"18388019942\",\"want\":34,\"added\":1},\"edm-and-dance\":{\"name\":\"N1GHT · EDM & DANCE\",\"id\":\"18388056763\",\"want\":45,\"added\":2},\"randb-and-soul\":{\"name\":\"N1GHT · R&B & SOUL\",\"id\":\"18388103475\",\"want\":24,\"added\":1},\"hip-hop\":{\"name\":\"N1GHT · HIP-HOP\",\"id\":\"18388048788\",\"want\":29,\"added\":2},\"folk-and-country\":{\"name\":\"N1GHT · FOLK & COUNTRY\",\"id\":\"18388036786\",\"want\":24,\"added\":0},\"golden-classics\":{\"name\":\"N1GHT · CLASSICS\",\"id\":\"18388086557\",\"want\":6,\"added\":0},\"mandarin-pop\":{\"name\":\"N1GHT · 华语流行\",\"id\":\"18388058708\",\"want\":45,\"added\":5},\"mandarin-ballad\":{\"name\":\"N1GHT · 华语抒情\",\"id\":\"18387966149\",\"want\":49,\"added\":8},\"mandarin-rock\":{\"name\":\"N1GHT · 华语摇滚\",\"id\":\"18388026892\",\"want\":6,\"added\":1},\"mandarin-hip-hop\":{\"name\":\"N1GHT · 华语说唱\",\"id\":\"18387999065\",\"want\":42,\"added\":10},\"mandarin-folk\":{\"name\":\"N1GHT · 华语民谣独立\",\"id\":\"18388009986\",\"want\":20,\"added\":2},\"mandarin-ost\":{\"name\":\"N1GHT · 华语影视原声\",\"id\":\"18388047825\",\"want\":23,\"added\":2},\"k-pop\":{\"name\":\"N1GHT · K-POP\",\"id\":\"18387934353\",\"want\":8,\"added\":0}}";
const r = JSON.parse(res);
const verified = JSON.parse(fs.readFileSync('archive/music-refresh/batch4-verified.json','utf8')).songs;
const newIds = new Set(verified.map(s => s.id));
let bad = [], added = 0, expected = 0;
for (const g of data) {
  const rr = r[g.id];
  if (!rr) { bad.push('no result for ' + g.id); continue; }
  if (rr.id !== g.playlist) bad.push(g.id + ' playlist id ' + rr.id + ' != data ' + g.playlist);
  if (rr.want !== g.tracks.length) bad.push(g.id + ' want ' + rr.want + ' != data ' + g.tracks.length);
  const fresh = g.tracks.filter(t => newIds.has(t.id)).length;
  added += rr.added; expected += fresh;
  if (rr.added !== fresh) bad.push(g.id + ' added ' + rr.added + ' != new tracks ' + fresh);
}
const missing = Object.keys(r).filter(k => !data.some(g => g.id === k));
if (missing.length) bad.push('unknown groups: ' + missing.join(','));
console.log('groups compared: ' + data.length);
console.log('total added: ' + added + '   new tracks in data: ' + expected);
console.log('problems: ' + bad.length + (bad.length ? '\n  - ' + bad.join('\n  - ') : ''));
const zh = data.filter(g => g.groupLang === 'zh').reduce((a,g)=>a+g.tracks.length,0);
const ko = data.filter(g => g.id === 'k-pop').reduce((a,g)=>a+g.tracks.length,0);
console.log('language split now: zh ' + zh + ' / english ' + (534 - zh - ko) + ' / k-pop ' + ko);
