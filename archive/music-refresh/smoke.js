
/* Headless smoke test for music-stage.js: a tiny DOM shim, then the real
   renderer runs against the real music-data.js / music-covers.js. */
const fs = require('fs');
const vm = require('vm');
const P = 'C:/Users/qsr/night-web/';

function makeEl(tag) {
  const el = {
    tagName: tag, className: '', textContent: '', children: [], attrs: {}, hidden: false, dataset: {},
    appendChild(c) { this.children.push(c); c.parent = this; return c; },
    setAttribute(k, v) { this.attrs[k] = String(v); },
    removeAttribute(k) { delete this.attrs[k]; },
    replaceChildren() { this.children = []; },
    getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; },
    querySelectorAll() { return []; },
  };
  return el;
}
const mounts = { list: makeEl('div'), filter: makeEl('div') };
const sandbox = {
  window: {}, console,
  document: {
    createElement: makeEl,
    createTextNode: (t) => ({ nodeType: 3, textContent: t }),
    getElementById: (id) => (id === 'genre-filter' ? mounts.filter : null),
    querySelectorAll: (sel) => (sel === "[data-music-stage='auto']" ? [mounts.list] : []),
  },
};
vm.createContext(sandbox);
for (const f of ['js/music-data.js', 'js/music-covers.js', 'js/music-stage.js']) {
  vm.runInContext(fs.readFileSync(P + f, 'utf8'), sandbox, { filename: f });
}
const genres = mounts.list.children;
const chips = mounts.filter.children;
console.log('genres rendered:', genres.length, '| chips:', chips.length);
if (genres.length !== 15 || chips.length !== 15) { console.log('!! EXPECTED 15'); process.exit(1); }
let visible = 0, cards = 0, covers = 0, emptySleeves = 0, zhAttrs = 0;
for (const g of genres) {
  if (!g.hidden) visible++;
  const tracks = g.children.find(c => c.className === 'track-index');
  for (const card of tracks.children[0].children[0].children) {
    cards++;
    const img = card.children[0];
    if (img.tagName === 'img') { covers++; if (!img.src.startsWith('album-covers/')) console.log('!! bad src', img.src); }
    else emptySleeves++;
    if (card.attrs['data-song-id']) { /* ok */ } else console.log('!! card without data-song-id');
  }
}
for (const g of genres) if (g.attrs.lang === 'zh') zhAttrs++;
console.log('visible on first paint:', visible, '(expect 1)');
console.log('cards:', cards, '| with cover:', covers, '| placeholder sleeves:', emptySleeves);
console.log('groups carrying lang="zh":', zhAttrs);
console.log('first group title:', genres[0].children[0].children[0].children.map(c => c.textContent || '').join(''));
const last = genres[14];
console.log('last group title:', last.children[0].children[0].children.map(c => c.textContent || '').join(''), '| hidden:', last.hidden);
console.log('chip labels:', chips.map(c => c.textContent).join(' / '));
if (covers !== 534 || emptySleeves !== 0 || visible !== 1) { console.log('!! SMOKE FAILED'); process.exit(1); }
console.log('SMOKE OK');
