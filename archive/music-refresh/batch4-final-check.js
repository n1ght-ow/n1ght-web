
const fs = require('fs');
const load = (p) => { const w = {}; new Function('window', fs.readFileSync(p, 'utf8'))(w); return w; };
const data = load('js/music-data.js').MUSIC_DATA;
const covers = load('js/music-covers.js').MUSIC_COVERS;
const verified = JSON.parse(fs.readFileSync('archive/music-refresh/batch4-verified.json', 'utf8')).songs;
const newIds = new Set(verified.map(s => s.id));

let total = 0; const all = new Set(); const dup = [];
for (const g of data) for (const t of g.tracks) { total++; if (all.has(t.id)) dup.push(t.id); all.add(t.id); }
const thumbs = new Set(fs.readdirSync('album-covers/thumbs'));
const files = new Set(fs.readdirSync('album-covers').filter(f => fs.statSync('album-covers/' + f).isFile()));
const bad = [];
for (const g of data) for (const t of g.tracks) {
  const c = covers[t.id];
  if (!c) { bad.push('no cover key ' + t.id); continue; }
  if (!files.has(c)) bad.push('missing jpg ' + t.id);
  if (!thumbs.has(c.replace(/\.[^.]+$/, '.webp'))) bad.push('missing thumb ' + t.id);
}
console.log('groups ' + data.length + '  tracks ' + total + '  distinct ' + all.size + '  dup ' + dup.length);
console.log('asset problems: ' + bad.length + (bad.length ? ' -> ' + bad.slice(0, 8).join(', ') : ''));
console.log('cover keys ' + Object.keys(covers).length + '  jpgs ' + files.size + '  thumbs ' + thumbs.size);
console.log('');
console.log('the 38 new songs, by group:');
for (const g of data) {
  const fresh = g.tracks.filter(t => newIds.has(t.id));
  if (!fresh.length) continue;
  console.log('  ' + g.id.padEnd(17) + String(g.tracks.length).padStart(4) + ' 首  (+' + fresh.length + ')');
  for (const t of fresh) console.log('       ' + t.id.padEnd(11) + t.title + '  |  ' + t.artist);
}
// the paste file must carry the same 38 ids
const paste = fs.readFileSync('archive/music-playlists/netease-import.js', 'utf8');
const lang = fs.readFileSync('archive/music-playlists/netease-import.js', 'utf8'); // 语言歌单已并入这一份
const countIn = (src) => [...newIds].filter(id => src.includes('"' + id + '"')).length;
console.log('');
console.log('new ids present in netease-import.js: ' + countIn(paste) + ' / 38');
console.log('new ids present in netease-import.js (language half): ' + countIn(lang) + ' / 38');
