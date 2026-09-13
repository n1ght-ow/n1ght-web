
const fs = require('fs');
const P = 'C:/Users/qsr/night-web/';
const js = fs.readFileSync(P + 'js/main.js', 'utf8');
const html = fs.readFileSync(P + 'index.html', 'utf8');
const ids = [...new Set([...js.matchAll(/getElementById\("([^"]+)"\)/g)].map(m => m[1]))];
const missing = ids.filter(id => !html.includes('id="' + id + '"'));
console.log('getElementById targets:', ids.length, '| missing from index.html:', missing.length, missing.join(','));
// every class main.js looks for
const classes = [...new Set([...js.matchAll(/querySelector(?:All)?\("\.([a-z0-9-]+)/g)].map(m => m[1]))];
const missC = classes.filter(c => !html.includes(c) && !fs.readFileSync(P + 'js/music-stage.js', 'utf8').includes(c));
console.log('class targets not in html or music-stage:', missC.join(',') || 'none');
console.log('lb-music-label anywhere in js/css/html:', /lb-music-label/.test(js + html + fs.readFileSync(P + 'css/style.css', 'utf8')));
console.log('music-data/music-covers ?v:', (html.match(/music-(data|covers)\.js\?v=\d/g) || []).join(' '));
console.log('style.css / main.js ?v:', (html.match(/(style\.css|main\.js)\?v=\d/g) || []).join(' '));
