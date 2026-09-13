
const fs = require('fs');
const D = 'C:/Users/qsr/night-web/archive/music-refresh/';
const P = 'C:/Users/qsr/night-web/';
const rd = (f) => JSON.parse(fs.readFileSync(D + f, 'utf8').replace(/^\uFEFF/, ''));
const tracks = rd('final-tracks.json');
const details = rd('final-details-pretty.json');
const dMap = new Map(details.map(d => [String(d.id), d]));

const GROUPS = [
  { id: 'pop', zh: '英语 · 流行', en: 'POP' },
  { id: 'ballad', zh: '英语 · 抒情', en: 'BALLAD' },
  { id: 'rock', zh: '英语 · 摇滚', en: 'ROCK' },
  { id: 'edm-and-dance', zh: '英语 · 电音舞曲', en: 'EDM & DANCE' },
  { id: 'randb-and-soul', zh: '英语 · 节奏布鲁斯', en: 'R&B & SOUL' },
  { id: 'hip-hop', zh: '英语 · 说唱', en: 'HIP-HOP' },
  { id: 'folk-and-country', zh: '英语 · 民谣与乡村', en: 'FOLK & COUNTRY' },
  { id: 'golden-classics', zh: '英语 · 黄金经典', en: 'CLASSICS' },
  { id: 'mandarin-pop', zh: '华语流行', en: 'MANDARIN POP', groupLang: 'zh' },
  { id: 'mandarin-ballad', zh: '华语抒情', en: 'MANDARIN BALLAD', groupLang: 'zh' },
  { id: 'mandarin-rock', zh: '华语摇滚', en: 'MANDARIN ROCK', groupLang: 'zh' },
  { id: 'mandarin-folk', zh: '华语民谣独立', en: 'MANDARIN FOLK & INDIE', groupLang: 'zh' },
  { id: 'mandarin-ost', zh: '华语影视原声', en: 'MANDARIN OST & CHINESE STYLE', groupLang: 'zh' },
  { id: 'k-pop', zh: '韩语', en: 'K-POP' }
];

// --- music-data.js -------------------------------------------------------
const lines = [];
lines.push('(function () {');
lines.push('  "use strict";');
lines.push('');
lines.push('  /* ' + tracks.length + ' tracks in ' + GROUPS.length + ' genre groups, curated from the owner\u2019s own');
lines.push('     NetEase \u201cliked songs\u201d list. Every id was resolved through the');
lines.push('     NetEase song/detail API against the album printed in that list, so');
lines.push('     each entry points at the exact release the owner saved \u2014 do NOT');
lines.push('     invent or guess ids (see AGENTS.md). groupLang: "zh" marks the');
lines.push('     Chinese groups that carry lang="zh" on the .genre div; it is');
lines.push('     omitted for the English and Korean groups, whose zh title segment');
lines.push('     gets a <span lang="zh"> wrapper from the renderer instead. */');
lines.push('  window.MUSIC_DATA = [');
GROUPS.forEach((g, gi) => {
  const rows = tracks.filter(t => t.genre === g.id)
    .map(t => ({ id: t.id, d: dMap.get(String(t.id)) }))
    .filter(x => x.d)
    .sort((a, b) => (b.d.duration || 0) - (a.d.duration || 0) === 0 ? 0 : 0);
  // keep the owner's own ordering (by list position)
  rows.sort((a, b) => tracks.findIndex(t => t.id === a.id) - tracks.findIndex(t => t.id === b.id));
  lines.push('    {');
  lines.push('      id: ' + JSON.stringify(g.id) + ',');
  lines.push('      zh: ' + JSON.stringify(g.zh) + ',');
  lines.push('      en: ' + JSON.stringify(g.en) + ',');
  if (g.groupLang) lines.push('      groupLang: ' + JSON.stringify(g.groupLang) + ',');
  lines.push('      tracks: [');
  rows.forEach((r, i) => {
    lines.push('        { id: ' + JSON.stringify(String(r.id)) + ', title: ' + JSON.stringify(r.d.title) + ', artist: ' + JSON.stringify(r.d.artist) + ' }' + (i === rows.length - 1 ? '' : ','));
  });
  lines.push('      ]');
  lines.push('    }' + (gi === GROUPS.length - 1 ? '' : ','));
});
lines.push('  ];');
lines.push('})();');
fs.writeFileSync(P + 'js/music-data.js', lines.join('\n') + '\n');

// --- music-covers.js -----------------------------------------------------
const cov = [];
const seen = new Set();
for (const t of tracks) {
  const d = dMap.get(String(t.id));
  if (!d || !d.cover) continue;
  if (seen.has(String(t.id))) continue;
  seen.add(String(t.id));
  cov.push([String(t.id), String(d.cover).split('?')[0].split('/').pop()]);
}
cov.sort((a, b) => Number(a[0]) - Number(b[0]));
const cl = [];
cl.push('/* Cover art index for the music panel (generated).');
cl.push('   Source: archive/music-album-covers/index.json - NetEase Cloud Music');
cl.push('   song/detail API, picUrl at 500px. The files themselves live in');
cl.push('   album-covers/<file>; this map is songId -> file name. Songs absent');
cl.push('   from the map have no artwork and fall back to the placeholder');
cl.push('   sleeve in the detail layer. Do not hand-edit: regenerate from the');
cl.push('   archive index instead. */');
cl.push('window.MUSIC_COVERS = {');
cov.forEach((c, i) => cl.push('  ' + JSON.stringify(c[0]) + ': ' + JSON.stringify(c[1]) + (i === cov.length - 1 ? '' : ',')));
cl.push('};');
fs.writeFileSync(P + 'js/music-covers.js', cl.join('\n') + '\n');

// --- archive index.json / index.csv --------------------------------------
const songs = [];
for (const t of tracks) {
  const d = dMap.get(String(t.id));
  if (!d) continue;
  songs.push({ songId: String(t.id), title: d.title, artist: d.artist, album: d.album, albumId: Number(d.albumId) || 0, cover: String(d.cover).split('?')[0].split('/').pop() });
}
songs.sort((a, b) => Number(a.songId) - Number(b.songId));
const files = new Set(songs.map(s => s.cover));
const index = {
  generated: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
  source: 'NetEase Cloud Music song/detail API (picUrl), 500px',
  files: files.size,
  songs
};
fs.writeFileSync(D + 'index.json', JSON.stringify(index, null, 2) + '\n');
const q = (s) => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
const csv = ['songId,title,artist,album,albumId,cover'];
for (const s of songs) csv.push([s.songId, s.title, s.artist, s.album, s.albumId, s.cover].map(q).join(','));
fs.writeFileSync(D + 'index.csv', csv.join('\n') + '\n');

console.log('music-data groups:');
let tot = 0;
for (const g of GROUPS) { const n = tracks.filter(t => t.genre === g.id).length; tot += n; console.log('  ' + g.id.padEnd(18) + n); }
console.log('total', tot, '| covers', cov.length, '| distinct files', files.size);
const noDetail = tracks.filter(t => !dMap.get(String(t.id)));
console.log('missing detail:', noDetail.length);
