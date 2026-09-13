
const fs = require('fs');
const D = 'C:/Users/qsr/night-web/archive/music-refresh/';
const rd = (f) => JSON.parse(fs.readFileSync(D + f, 'utf8').replace(/^\uFEFF/, ''));
const playlist = rd('playlist.json');
const search = rd('search-pretty.json');
const retry = rd('retry-pretty.json');
const match = rd('match-stage1.json');
const project = rd('project-full.json');
const genreMap = rd('genre-map.json');
let albumLookup = [];
try { albumLookup = rd('album-lookup-pretty.json'); } catch (e) { console.log('no album-lookup'); }
let deep = [];
try { deep = rd('deep-pretty.json'); } catch (e) { console.log('no deep'); }
let extra = [];
try { extra = rd('extra-pretty.json'); } catch (e) { console.log('no extra'); }

const cleanAlbum = (s) => (s || '')
  .replace(/\u2026/g, '').replace(/\.\.\.+/g, '')
  .replace(/[\uFF08(][^\uFF09)]*[\uFF09)]/g, '')
  .replace(/[\uFF08(].*$/, '')
  .replace(/[\s\u3000]/g, '')
  .replace(/[\u00B7\u30FB.,\uFF0C\u3002'\u2018\u2019"\u201C\u201D!\uFF01?\uFF1F:\uFF1A;\uFF1B\-_~\/\\|&+]/g, '')
  .toLowerCase() || String(s || '').trim().toLowerCase();
const normTitle = (s) => (s || '')
  .replace(/\u2026/g, '').replace(/\.\.\.+/g, '')
  .replace(/[\uFF08(][^\uFF09)]*[\uFF09)]/g, ' ')
  .replace(/[\uFF0C,\u3002.\u3001\u00B7!\uFF01?\uFF1F'\u2018\u2019"\u201C\u201D\u300A\u300B<>\[\]\u3010\u3011\-\u2014\u2013_~:\uFF1A;\uFF1B|\/\\]/g, '')
  .replace(/\s+/g, '').toLowerCase();
const artistTokens = (a) => (a || '').split(/[\/&\u3001]/).map(x => x.trim().toLowerCase()).filter(Boolean);
const toSecs = (s) => { if (!s) return null; const m = /^(\d+):(\d+)$/.exec(s); return m ? (+m[1]) * 60 + (+m[2]) : null; };
const badWord = /cover|翻唱|tribute|karaoke|伴奏|铃声|instrumental|纯音乐|钢琴|type beat|remix|slowed|sped up|lofi/i;

const projById = new Map(project.map(p => [p.id, p]));
const projMatchByIdx = new Map();
for (const r of match.exact) projMatchByIdx.set(r.idx, { kind: 'exact', proj: r.proj });
for (const r of match.loose) if (!projMatchByIdx.has(r.idx)) projMatchByIdx.set(r.idx, { kind: 'title-only', proj: r.proj });

// build candidate pool per idx
const pool = new Map();
for (const s of search) pool.set(s.idx, s.songs.slice());
for (const r of retry) { const a = pool.get(r.idx) || []; pool.set(r.idx, a.concat(r.songs)); }
for (const al of albumLookup) {
  const add = [];
  for (const a of (al.albums || [])) for (const s of (a.songs || [])) add.push({ id: s.id, name: s.name, artist: s.artist, album: a.album, cover: null, duration: s.duration });
  pool.set(al.idx, (pool.get(al.idx) || []).concat(add));
}
for (const d of deep) {
  const add = (d.songs || []).map(s => ({ id: s.id, name: s.name, artist: s.artist, album: s.album, cover: s.cover, duration: s.duration }));
  pool.set(d.idx, (pool.get(d.idx) || []).concat(add));
}
const MANUAL = { 161: '531777461', 126: '1313303916', 138: '24197361', 140: '545350938', 143: '545350935', 184: '506092035', 213: '5054926', 241: '2057234990', 426: '29561033', 449: '455311479', 319: '1356658022' };
// 用户直接给定的音源（review 反馈）
const INJECT = {
  319: { id: '1356658022', name: 'Slow Down', artist: 'Madnap / Pauline Herr', album: 'Slow Down', cover: null, duration: 203265 }
};
const extraById = new Map();
for (const s of extra) extraById.set(String(s.id), { id: String(s.id), name: s.name, artist: s.artist, album: s.album, cover: s.cover, duration: s.duration });
const scorpion = extra.filter(s => s.kind === 'scorpion').map(s => ({ id: String(s.id), name: s.name, artist: s.artist, album: 'Scorpion', cover: null, duration: s.duration }));
pool.set(161, (pool.get(161) || []).concat(scorpion));
for (const [idx, obj] of Object.entries(INJECT)) {
  pool.set(Number(idx), [obj].concat(pool.get(Number(idx)) || []));
}
for (const [idx, id] of Object.entries(MANUAL)) {
  const s = extraById.get(id) || (INJECT[Number(idx)] && INJECT[Number(idx)].id === id ? INJECT[Number(idx)] : null);
  if (s) pool.set(Number(idx), (pool.get(Number(idx)) || []).concat([s]));
}

const out = [];
for (const row of playlist) {
  const secs = toSecs(row.dur);
  const cands = pool.get(row.idx) || [];
  const seen = new Set();
  const scored = [];
  for (const c of cands) {
    if (!c || !c.id || seen.has(c.id)) continue; seen.add(c.id);
    const ca = cleanAlbum(c.album), ra = cleanAlbum(row.album);
    const rawA = String(c.album || '').replace(/\u2026/g, '').replace(/\.\.\.+/g, '').replace(/[\s\u3000]/g, '').toLowerCase();
    const rawB = String(row.album || '').replace(/\u2026/g, '').replace(/\.\.\.+/g, '').replace(/[\s\u3000]/g, '').toLowerCase();
    let albumRank = 0;
    if (ca && ra) {
      if (ca === ra) albumRank = (rawA === rawB) ? 4 : 3;
      else if (ca.length >= 6 && ra.length >= 6 && (ca.startsWith(ra) || ra.startsWith(ca))) albumRank = 2;
    }
    const asciiNorm = (s) => String(s || '').replace(/[\uFF08][^\uFF09]*[\uFF09]/g, '').replace(/[\u3000\s]/g, '').replace(/[\uFF0C,\u3002.\u3001\u00B7!\uFF01?\uFF1F'\u2018\u2019"\u201C\u201D\u300A\u300B<>\[\]\u3010\u3011\-\u2014\u2013_~:\uFF1A;\uFF1B|\/\\]/g, '').toLowerCase();
    const asciiTitleEq = asciiNorm(c.name) === asciiNorm(row.title);
    const titleOk = normTitle(c.name) === normTitle(row.title);
    const titleLoose = !titleOk && (normTitle(c.name).includes(normTitle(row.title)) || normTitle(row.title).includes(normTitle(c.name)));
    const artOk = artistTokens(c.artist).filter(t => artistTokens(row.artist).includes(t)).length > 0;
    const dd = (secs != null && typeof c.duration === 'number') ? Math.abs(c.duration / 1000 - secs) : null;
    const suspicious = badWord.test(c.album || '') && !badWord.test(row.album || '');
    const why = [];
    if (albumRank === 3 || albumRank === 4) why.push('专辑'); else if (albumRank === 2) why.push('专辑~');
    if (titleOk || asciiTitleEq) why.push('歌名'); else if (titleLoose) why.push('歌名~');
    if (artOk) why.push('歌手');
    if (dd !== null) { if (dd <= 2) why.push('时长'); else if (dd <= 5) why.push('时长~'); else why.push('时长+' + Math.round(dd) + 's'); }
    if (suspicious) why.push('可疑专辑');
    let score = albumRank * 100 + (titleOk ? 45 : titleLoose ? 10 : 0) + (artOk ? 30 : 0) + (dd === null ? 0 : dd <= 2 ? 35 : dd <= 5 ? 14 : -Math.min(40, Math.round(dd))) - (suspicious ? 120 : 0);
    scored.push({ ...c, albumRank, titleOk, asciiTitleEq, artOk, dd, suspicious, score, why });
  }
  scored.sort((a, b) =>
    (b.albumRank - a.albumRank) ||
    ((b.asciiTitleEq ? 1 : 0) - (a.asciiTitleEq ? 1 : 0)) ||
    ((b.titleOk ? 1 : 0) - (a.titleOk ? 1 : 0)) ||
    ((b.artOk ? 1 : 0) - (a.artOk ? 1 : 0)) ||
    (Math.round((a.dd ?? 999) / 3) - Math.round((b.dd ?? 999) / 3)) ||
    ((a.album || '').length - (b.album || '').length) ||
    (b.score - a.score));

  const best = scored[0] || null;
  const pm = projMatchByIdx.get(row.idx);
  const proj = pm && pm.proj.length === 1 ? projById.get(pm.proj[0].id) : null;
  const projOk = proj ? (cleanAlbum(proj.album) === cleanAlbum(row.album) || (cleanAlbum(proj.album).length >= 6 && cleanAlbum(row.album).length >= 6 && (cleanAlbum(proj.album).startsWith(cleanAlbum(row.album)) || cleanAlbum(row.album).startsWith(cleanAlbum(proj.album))))) : false;
  const projDurOk = proj && secs != null && proj.duration ? Math.abs(proj.duration / 1000 - secs) <= 5 : null;
  let verdict;
  const projDd = (proj && secs != null && proj.duration) ? Math.abs(proj.duration / 1000 - secs) : null;
  const bestDd = best && best.dd != null ? best.dd : null;
  const durGuard = proj && projDd !== null && projDd <= 5 && bestDd !== null && bestDd > 8;
  if (!proj) verdict = 'new';
  else if (projOk && projDurOk !== false) verdict = 'keep';
  else if (best && best.id === proj.id) verdict = 'keep';
  else if (durGuard) verdict = 'keep-dur-guard';
  else verdict = 'replace';

  out.push({
    idx: row.idx, title: row.title, artist: row.artist, shotAlbum: row.album, shotDur: row.dur,
    genre: genreMap[String(row.idx)] || null, verdict,
    chosen: best ? { id: best.id, name: best.name, artist: best.artist, album: best.album, cover: best.cover, duration: best.duration, albumRank: best.albumRank, dd: best.dd, why: best.why } : null,
    alts: scored.slice(1, 6).map(c => ({ id: c.id, name: c.name, artist: c.artist, album: c.album, duration: c.duration, albumRank: c.albumRank, dd: c.dd })),
    projDd, durGuard: !!durGuard,
    proj: proj ? { id: proj.id, album: proj.album, duration: proj.duration, group: proj.groupZh, artist: proj.artist, cover: proj.cover } : null,
    matchKind: pm ? pm.kind : 'none'
  });
}
fs.writeFileSync(D + 'scored.json', JSON.stringify(out, null, 1));
const t = {}; for (const o of out) t[o.verdict] = (t[o.verdict] || 0) + 1;
console.log('verdicts:', JSON.stringify(t));
const weak = out.filter(o => (o.verdict === 'replace' || o.verdict === 'new') && (!o.chosen || o.chosen.albumRank === 0));
console.log('replace/new 且建议项专辑名不匹配:', weak.length);
for (const o of weak) console.log('  #' + o.idx + ' ' + o.title + '/' + o.artist + ' | 截图「' + o.shotAlbum + '」' + o.shotDur + ' | 建议「' + (o.chosen ? o.chosen.album : '-') + '」' + (o.chosen ? o.chosen.duration : '') + ' why=' + (o.chosen ? o.chosen.why.join(',') : ''));
