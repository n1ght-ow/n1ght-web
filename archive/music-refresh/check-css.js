
const fs = require('fs');
const P = 'C:/Users/qsr/night-web/';
const css = fs.readFileSync(P + 'css/style.css', 'utf8');
let depth = 0, line = 1, bad = null;
for (let i = 0; i < css.length; i++) {
  const c = css[i];
  if (c === '\n') line++;
  if (c === '{') depth++;
  if (c === '}') { depth--; if (depth < 0 && !bad) bad = line; }
}
console.log('brace depth at EOF:', depth, '| first negative at line:', bad);
console.log('lb-music-label refs left:', (css.match(/lb-music-label/g) || []).length);
for (const sel of ['.lightbox[data-detail="music"] .lb-stage', '.lb-music-head', '.lightbox[data-detail="music"] .lb-music-link', '.lightbox[data-detail="music"] .lb-music-head']) {
  console.log(sel, '->', css.includes(sel) ? 'present' : 'MISSING');
}
