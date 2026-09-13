
const fs = require('fs');
const P = 'C:/Users/qsr/night-web/';
const vm = require('vm');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(P + 'js/music-covers.js', 'utf8'), sandbox, { filename: 'music-covers.js' });
const keep = new Set(Object.values(sandbox.window.MUSIC_COVERS));
const onDisk = fs.readdirSync(P + 'album-covers');
let removed = 0;
for (const f of onDisk) {
  if (keep.has(f)) continue;
  fs.unlinkSync(P + 'album-covers/' + f);
  removed++;
}
console.log('kept:', keep.size, '| removed:', removed, '| left on disk:', fs.readdirSync(P + 'album-covers').length);
