
const fs = require('fs');
const D = 'C:/Users/qsr/night-web/archive/music-refresh/';
const h = fs.readFileSync(D + 'review.html', 'utf8');
const m = [...h.matchAll(/src="review-assets\/([^"]+)"/g)].map(x => x[1]);
const uniq = [...new Set(m)];
const miss = uniq.filter(f => !fs.existsSync(D + 'review-assets/' + f));
console.log('img refs', m.length, 'unique', uniq.length, 'missing', miss.length, miss.slice(0, 20).join(','));
console.log('sections', (h.match(/<h2>/g) || []).length, '| genre blocks', (h.match(/genre-block/g) || []).length);
