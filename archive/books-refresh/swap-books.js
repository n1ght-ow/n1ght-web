const fs = require('fs');
const p = 'C:/Users/qsr/night-web/index.html';
let h = fs.readFileSync(p, 'utf8');
const panelAt = h.indexOf('id="panel-books"');
if (panelAt < 0) throw new Error('panel-books not found');
const start = h.indexOf('<div class="idx-list">', panelAt);
if (start < 0) throw new Error('idx-list not found');
// walk to the matching close tag
let depth = 0, i = start, end = -1;
while (i < h.length) {
  const open = h.indexOf('<div', i);
  const close = h.indexOf('</div>', i);
  if (close < 0) throw new Error('unbalanced');
  if (open >= 0 && open < close) { depth++; i = open + 4; }
  else { depth--; i = close + 6; if (depth === 0) { end = i; break; } }
}
const block = h.slice(start, end);
const articles = (block.match(/<article class="idx-row">/g) || []).length;
const mount = [
  '<div class="book-shelf" data-book-shelf="auto" role="group" aria-label="Books on the shelf"></div>'
].join('');
h = h.slice(0, start) + mount + h.slice(end);
fs.writeFileSync(p, h);
console.log('replaced a', block.length, 'char block with', articles, 'articles by the', mount.length, 'char mount');