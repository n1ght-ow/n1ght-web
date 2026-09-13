
const fs = require('fs');
const path = require('path');
const P = 'C:/Users/qsr/night-web/';
const vm = require('vm');

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(P + 'js/music-data.js', 'utf8'), sandbox, { filename: 'music-data.js' });
vm.runInContext(fs.readFileSync(P + 'js/music-covers.js', 'utf8'), sandbox, { filename: 'music-covers.js' });
const data = sandbox.window.MUSIC_DATA;
const covers = sandbox.window.MUSIC_COVERS;

let total = 0, noCover = 0, missingFile = 0, dupIds = 0, dupTitles = 0;
const ids = new Set(), tk = new Set();
const files = new Set();
const groups = [];
for (const g of data) {
  groups.push(g.id + '=' + g.tracks.length);
  for (const t of g.tracks) {
    total++;
    if (ids.has(t.id)) dupIds++; ids.add(t.id);
    const k = t.title + '|' + t.artist;
    if (tk.has(k)) { dupTitles++; console.log('DUP TITLE:', g.id, t.title, t.artist); } tk.add(k);
    const f = covers[t.id];
    if (!f) { noCover++; console.log('NO COVER MAP:', t.id, t.title); continue; }
    files.add(f);
    if (!fs.existsSync(P + 'album-covers/' + f)) { missingFile++; console.log('MISSING FILE:', t.id, f); }
  }
}
console.log('groups:', data.length, '|', groups.join(' '));
console.log('tracks:', total, '| dup ids:', dupIds, '| dup title+artist:', dupTitles);
console.log('no cover mapping:', noCover, '| missing cover file:', missingFile, '| distinct files used:', files.size);
// unused cover files on disk
const onDisk = fs.readdirSync(P + 'album-covers').filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
const unused = onDisk.filter(f => !files.has(f));
console.log('files on disk:', onDisk.length, '| referenced:', files.size, '| orphaned:', unused.length);
// genre label sanity
for (const g of data) if (!g.id || !g.zh || !g.en || !Array.isArray(g.tracks)) console.log('BAD GROUP', g.id);
