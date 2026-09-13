
const fs = require('fs'); const vm = require('vm');
const P = 'C:/Users/qsr/night-web/';
const sb = { window: {} }; vm.createContext(sb);
vm.runInContext(fs.readFileSync(P + 'js/music-data.js', 'utf8'), sb, { filename: 'm' });
const norm = (s) => String(s).replace(/[\uFF08(][^\uFF09)]*[\uFF09)]/g, '').replace(/[\uFF0C,\u3002.\u3001\u00B7!\uFF01?\uFF1F'\u2018\u2019"\u201C\u201D\u300A\u300B\-\u2014\u2013_~:\uFF1A;\uFF1B|\/\\]/g, '').replace(/\s+/g, '').toLowerCase();
const art = (a) => a.split(/[\/&\u3001]/).map(x => x.trim().toLowerCase()).sort().join('|');
const flat = []; for (const g of sb.window.MUSIC_DATA) for (const t of g.tracks) flat.push({ ...t, gid: g.id });
const byKey = new Map();
for (const t of flat) { const k = norm(t.title) + '||' + art(t.artist); (byKey.get(k) || byKey.set(k, []).get(k)).push(t); }
console.log('=== 同曲同歌手重复 ===');
let n = 0;
for (const [k, v] of byKey) if (v.length > 1) { n++; console.log(k, v.map(x => x.id + '/' + x.gid).join(', ')); }
console.log('count:', n);
const byT = new Map();
for (const t of flat) { const k = norm(t.title); (byT.get(k) || byT.set(k, []).get(k)).push(t); }
console.log('=== 同名不同歌手 ===');
for (const [k, v] of byT) if (v.length > 1) console.log(k, v.map(x => x.artist + '(' + x.id + ')').join('  vs  '));
