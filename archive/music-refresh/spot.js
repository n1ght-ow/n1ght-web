
const fs = require('fs');
const vm = require('vm');
const P = 'C:/Users/qsr/night-web/';
const sb = { window: {} };
vm.createContext(sb);
vm.runInContext(fs.readFileSync(P + 'js/music-data.js', 'utf8'), sb, { filename: 'music-data.js' });
vm.runInContext(fs.readFileSync(P + 'js/music-covers.js', 'utf8'), sb, { filename: 'music-covers.js' });
const data = sb.window.MUSIC_DATA;
const want = ['夜空中最亮的星','当你','唯一','安和桥','Hey Jude','Believer','Halo','Lemon Tree','Another Day Of Sun',"Here's to Never Talking",'We Don\u2019t Talk Anymore','Slow Down','成都','生如夏花','他不懂','认真的雪','天外来物','带我去找夜生活'];
const flat = [];
for (const g of data) for (const t of g.tracks) flat.push({ ...t, gid: g.id });
for (const w of want) {
  const hits = flat.filter(t => t.title.includes(w) || t.title.toLowerCase().includes(w.toLowerCase()));
  for (const h of hits) console.log(h.gid.padEnd(18), h.id.padEnd(12), h.title, '\u2014', h.artist);
}
console.log('--- first 3 of each group ---');
for (const g of data) console.log(g.id.padEnd(18), g.tracks.slice(0,3).map(t => t.title).join(' | '));
console.log('total', flat.length);
