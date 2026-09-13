
const fs = require('fs');
const P = 'C:/Users/qsr/night-web/';
const html = fs.readFileSync(P + 'index.html', 'utf8');
const refs = new Set();
for (const m of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  const u = m[1];
  if (/^(https?:|mailto:|tel:|#|data:)/.test(u)) continue;
  refs.add(u.split('?')[0]);
}
const missing = [...refs].filter(r => !fs.existsSync(P + r));
console.log('index.html local refs:', refs.size, '| missing:', missing.length);
for (const m of missing) console.log('  MISSING', m);

// data-driven assets
const vm = require('vm');
const sb = { window: {} };
vm.createContext(sb);
for (const f of ['js/film-data.js','js/series-data.js','js/music-data.js','js/music-covers.js']) {
  vm.runInContext(fs.readFileSync(P + f, 'utf8'), sb, { filename: f });
}
let miss = 0;
for (const f of (sb.window.FILM_DATA || [])) if (f.poster && !fs.existsSync(P + f.poster)) { miss++; console.log('  film poster missing', f.poster); }
for (const s of (sb.window.SERIES_DATA || [])) if (s.poster && !fs.existsSync(P + s.poster)) { miss++; console.log('  series poster missing', s.poster); }
for (const f of Object.values(sb.window.MUSIC_COVERS || {})) if (!fs.existsSync(P + 'album-covers/' + f)) { miss++; console.log('  cover missing', f); }
console.log('data-driven assets missing:', miss);

// photo/ pairs
const photo = fs.readdirSync(P + 'photo').filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
const full = new Set(fs.readdirSync(P + 'photo/full'));
const noFull = photo.filter(f => !full.has(f));
console.log('photo/:', photo.length, '| full/:', full.size, '| without full copy:', noFull.length, noFull.slice(0,5).join(','));
