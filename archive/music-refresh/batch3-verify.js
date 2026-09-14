
const fs = require('fs');
const P = 'C:/Users/qsr/night-web/';
const load = p => { const win = {}; new Function('window', fs.readFileSync(P + p, 'utf8'))(win); return win; };
const data = load('js/music-data.js').MUSIC_DATA;
const covers = load('js/music-covers.js').MUSIC_COVERS;
let total = 0; const ids = new Map();
for (const g of data) for (const t of g.tracks) { total++; if (ids.has(t.id)) console.log('DUP ' + t.id + ' in ' + g.id + ' and ' + ids.get(t.id)); ids.set(t.id, g.id); }
console.log('groups: ' + data.length + '   tracks: ' + total + '   distinct ids: ' + ids.size);
const noCover = [...ids.keys()].filter(id => !covers[id]);
console.log('tracks without a cover key: ' + noCover.length + (noCover.length ? ' -> ' + noCover.join(',') : ''));
const onDisk = new Set(fs.readdirSync(P + 'album-covers'));
const missingFile = Object.entries(covers).filter(([, f]) => !onDisk.has(f));
console.log('cover keys: ' + Object.keys(covers).length + '   pointing at a missing file: ' + missingFile.length);
const stale = Object.keys(covers).filter(id => !ids.has(id));
console.log('cover keys not in the panel: ' + stale.length + (stale.length ? ' -> ' + stale.join(',') : ''));
const mh = data.find(g => g.id === 'mandarin-hip-hop');
console.log('mandarin-hip-hop: ' + mh.tracks.length + ' tracks, last nine:');
for (const t of mh.tracks.slice(-9)) console.log('   ' + t.id + '  ' + t.title + '  |  ' + t.artist + '  ->  ' + covers[t.id]);
console.log('group sizes: ' + data.map(g => g.id + '=' + g.tracks.length).join(', '));
