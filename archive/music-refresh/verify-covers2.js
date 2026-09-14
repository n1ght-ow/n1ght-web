
const fs = require('fs');
const P = 'C:/Users/qsr/night-web/';
const map = {};
const src = fs.readFileSync(P + 'js/music-covers.js', 'utf8');
for (const m of src.matchAll(/"?(\d+)"?:\s*"([^"]+)"/g)) map[m[1]] = m[2];
const files = new Set(fs.readdirSync(P + 'album-covers'));
let missing = 0, ok = 0;
for (const [id, f] of Object.entries(map)) { if (files.has(f)) ok++; else { missing++; if (missing < 6) console.log('MISSING ' + id + ' -> ' + f); } }
console.log('map entries ' + Object.keys(map).length + ' | files present ' + ok + ' | missing ' + missing);
const used = new Set(Object.values(map));
const orphans = [...files].filter(f => !used.has(f));
console.log('files on disk ' + files.size + ' | orphaned ' + orphans.length + (orphans.length ? ' -> ' + orphans.slice(0, 5).join(', ') : ''));
