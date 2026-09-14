
const fs = require('fs');
const P = 'C:/Users/qsr/night-web/';
const strip = s => String(s).replace(/^\uFEFF/, '');
const src = process.argv[2] || 'archive/music-refresh/batch3-covers.json';
const index = JSON.parse(strip(fs.readFileSync(P + 'archive/music-album-covers/index.json', 'utf8')));
const add = JSON.parse(strip(fs.readFileSync(P + src, 'utf8')));
const before = index.songs.length;
const have = new Set(index.songs.map(s => String(s.songId)));
let added = 0, skipped = 0;
for (const a of add) {
  if (have.has(String(a.songId))) { skipped++; continue; }
  index.songs.push({ songId: String(a.songId), title: a.title, artist: a.artist, album: a.album, albumId: a.albumId, cover: a.cover });
  have.add(String(a.songId));
  added++;
}
index.songs.sort((a, b) => Number(a.songId) - Number(b.songId));
index.files = new Set(index.songs.map(s => s.cover)).size;
index.generated = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
fs.writeFileSync(P + 'archive/music-album-covers/index.json', JSON.stringify(index, null, 2) + '\n', 'utf8');

const esc = v => '"' + String(v).replace(/"/g, '""') + '"';
const csv = ['songId,title,artist,album,albumId,cover']
  .concat(index.songs.map(s => [s.songId, s.title, s.artist, s.album, s.albumId, s.cover].map(esc).join(',')))
  .join('\r\n');
fs.writeFileSync(P + 'archive/music-album-covers/index.csv', csv + '\r\n', 'utf8');

const head = [
  '/* Cover art index for the music panel (generated).',
  '   Source: archive/music-album-covers/index.json - NetEase Cloud Music',
  '   song/detail API, picUrl at 500px. The files themselves live in',
  '   album-covers/<file>; this map is songId -> file name. Songs absent',
  '   from the map have no artwork and fall back to the placeholder',
  '   sleeve in the detail layer. Do not hand-edit: regenerate from the',
  '   archive index instead. */',
  'window.MUSIC_COVERS = {'
];
const body = index.songs.map((s, i) => '  ' + JSON.stringify(String(s.songId)) + ': ' + JSON.stringify(s.cover) + (i === index.songs.length - 1 ? '' : ','));
fs.writeFileSync(P + 'js/music-covers.js', head.concat(body, ['};']).join('\n') + '\n', 'utf8');

// does every id in the music panel have a cover?
const data = fs.readFileSync(P + 'js/music-data.js', 'utf8');
const map = {};
for (const m of data.matchAll(/\{ id: "(\d+)", title:/g)) map[m[1]] = 1;
const ids = Object.keys(map);
const cov = new Set(index.songs.map(s => String(s.songId)));
const missing = ids.filter(id => !cov.has(id));
const onDisk = new Set(fs.readdirSync(P + 'album-covers'));
const dangling = index.songs.filter(s => !onDisk.has(s.cover));
console.log('index songs ' + before + ' -> ' + index.songs.length + '  (+' + added + ', skipped ' + skipped + ')');
console.log('distinct cover files: ' + index.files + '   files on disk: ' + onDisk.size);
console.log('panel ids: ' + ids.length + '  without a cover: ' + missing.length + (missing.length ? ' -> ' + missing.slice(0, 8).join(',') : ''));
console.log('index rows pointing at a missing file: ' + dangling.length + (dangling.length ? ' -> ' + dangling.slice(0, 5).map(s => s.songId + ':' + s.cover).join(',') : ''));
