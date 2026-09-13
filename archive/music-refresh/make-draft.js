
const fs = require('fs');
const D = 'C:/Users/qsr/night-web/archive/music-refresh/';
const rd = (f) => JSON.parse(fs.readFileSync(D + f, 'utf8').replace(/^\uFEFF/, ''));
const scored = rd('scored.json');
const GROUPS = [
  ['pop', '英语 · 流行', 'POP'],
  ['ballad', '英语 · 抒情', 'BALLAD'],
  ['rock', '英语 · 摇滚', 'ROCK'],
  ['edm-and-dance', '英语 · 电音舞曲', 'EDM & DANCE'],
  ['randb-and-soul', '英语 · 节奏布鲁斯', 'R&B & SOUL'],
  ['hip-hop', '英语 · 说唱', 'HIP-HOP'],
  ['folk-and-country', '英语 · 民谣与乡村', 'FOLK & COUNTRY'],
  ['golden-classics', '英语 · 黄金经典', 'CLASSICS'],
  ['mandarin-pop', '华语 · 流行', 'MANDARIN POP'],
  ['mandarin-ballad', '华语 · 抒情', 'MANDARIN BALLAD'],
  ['mandarin-rock', '华语 · 摇滚', 'MANDARIN ROCK'],
  ['mandarin-folk', '华语 · 民谣与独立', 'MANDARIN FOLK'],
  ['mandarin-ost', '华语 · 影视原声与中国风', 'MANDARIN OST'],
  ['k-pop', '韩语 · K-POP', 'K-POP']
];
const out = GROUPS.map(([id, zh, en]) => ({ id, zh, en, tracks: [] }));
const byId = new Map(out.map(g => [g.id, g]));
for (const r of scored) {
  const changed = (r.verdict === 'replace' || r.verdict === 'new');
  const useId = changed ? r.chosen.id : (r.proj ? r.proj.id : r.chosen.id);
  const useArtist = changed ? r.chosen.artist : (r.proj ? r.proj.artist : r.chosen.artist);
  const g = byId.get(r.genre);
  if (!g) { console.log('!! unknown genre', r.genre, r.idx); continue; }
  g.tracks.push({ idx: r.idx, id: String(useId), title: r.title, artist: useArtist, src: r.verdict, wasId: r.proj ? r.proj.id : null });
}
const summary = { total: scored.length, groups: out.map(g => ({ id: g.id, zh: g.zh, n: g.tracks.length })) };
fs.writeFileSync(D + 'music-data.draft.json', JSON.stringify({ summary, groups: out }, null, 1));
console.log(JSON.stringify(summary, null, 0));
