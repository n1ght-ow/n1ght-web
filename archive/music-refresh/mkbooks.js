const fs = require('fs');
const P = 'C:/Users/qsr/night-web/';
const D = P + 'archive/music-refresh/';
const h = fs.readFileSync(P + 'index.html', 'utf8');
const start = h.indexOf('<div class="tab-panel is-active" id="panel-books"');
const end = h.indexOf('<div class="tab-panel" id="panel-films"');
let panel = h.slice(start, end).trim();
panel = panel.replace(/<\/div>\s*$/, '');
panel = panel.replace(/^<div class="tab-panel[^>]*>\s*/, '');
const page = [
  '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>books preview</title>',
  '<link rel="stylesheet" href="../../css/fonts.css">',
  '<link rel="stylesheet" href="../../css/style.css">',
  '</head><body><section class="section"><div class="shell">',
  panel,
  '</div></section></body></html>'
].join('\n');
fs.writeFileSync(D + 'books-preview.html', page);
const arts = (panel.match(/<article class="idx-row">/g) || []).length;
console.log('preview built with', arts, 'rows');