const fs = require('fs');
const h = fs.readFileSync('C:/Users/qsr/night-web/index.html', 'utf8');
for (const tag of ['article', 'div', 'figure', 'section', 'span', 'h3', 'p']) {
  const open = (h.match(new RegExp('<' + tag + '[\\s>]', 'g')) || []).length;
  const close = (h.match(new RegExp('</' + tag + '>', 'g')) || []).length;
  if (open !== close) console.log('UNBALANCED', tag, open, close);
}
const panel = h.slice(h.indexOf('id="panel-books"'), h.indexOf('id="panel-films"'));
const arts = (panel.match(/<article class="idx-row">/g) || []).length;
const nos = [...panel.matchAll(/<span class="idx-no">(\d+)<\/span>/g)].map(m => m[1]);
const lines = [...panel.matchAll(/<p class="idx-line" lang="zh">([^<]+)<\/p>/g)].map(m => m[1]);
console.log('books articles:', arts, '| numbers:', nos.join(','));
console.log('blurbs:', lines.length, '| longest:', Math.max(...lines.map(l => l.length)), 'chars');
const hasNoZh = [...panel.matchAll(/<p class="idx-line"(?! lang="zh")/g)].length;
console.log('blurbs missing lang="zh":', hasNoZh);
console.log('Books counter:', (h.match(/data-count="(\d+)">\d+<\/b><span>Books/g) || [])[0]);