
const fs = require('fs');
// PowerShell 5.1's Set-Content -Encoding UTF8 writes a BOM; JSON.parse rejects it
const rows = JSON.parse(fs.readFileSync('C:/Users/qsr/night-web/archive/music-refresh/search-new2.json', 'utf8').replace(/^\uFEFF/, ''));
const norm = s => String(s || '').toLowerCase().replace(/[\s\u3000\-_\(\)\[\]\u3010\u3011\u300a\u300b\u2018\u2019\u201c\u201d'\.,!\?\/\u00b7\uff0c\u3002\uff01\uff1f\u3001:;]/g, '');
function sim(a, b) {
  a = norm(a); b = norm(b);
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.85;
  let best = 0;
  for (let i = 0; i < a.length; i++) for (let len = best + 1; i + len <= a.length; len++) { if (b.includes(a.substr(i, len))) best = len; else break; }
  return best / Math.max(a.length, b.length);
}
const mmss = ms => { const t = Math.round(ms / 1000); return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); };
const lines = [];
let hard = 0;
const picks = [];
for (const row of rows) {
  const scored = (row.songs || []).map(s => {
    const dur = mmss(s.duration);
    let score = 0;
    if (dur === row.dur) score += 100;
    score += 45 * sim(s.album, row.album);
    score += 22 * sim(s.name, row.title);
    score += 14 * sim(s.artist, row.artist);
    return { s, dur, score, okDur: dur === row.dur, okAlb: sim(s.album, row.album) > 0.75, okT: sim(s.name, row.title) > 0.6 };
  }).sort((a, b) => b.score - a.score);
  const top = scored[0];
  if (!top) { lines.push(row.idx + '  NO RESULTS'); hard++; picks.push({ idx: row.idx, pick: null }); continue; }
  const good = top.okDur && top.okAlb && top.okT;
  if (!good) hard++;
  picks.push({ idx: row.idx, title: row.title, artist: row.artist, album: row.album, dur: row.dur, good, pick: top.s });
  lines.push((good ? 'OK ' : '!! ') + String(row.idx).padStart(2) + '  id=' + top.s.id);
  lines.push('     图: ' + row.title + ' | ' + row.artist + ' | ' + row.album + ' | ' + row.dur);
  lines.push('     网: ' + top.s.name + ' | ' + top.s.artist + ' | ' + top.s.album + ' | ' + top.dur);
  if (!good && scored[1]) { const a = scored[1]; lines.push('     备: ' + a.s.id + ' | ' + a.s.name + ' | ' + a.s.artist + ' | ' + a.s.album + ' | ' + a.dur); }
}
lines.push('');
lines.push('需要确认: ' + hard + ' / ' + picks.length);
fs.writeFileSync('C:/Users/qsr/night-web/archive/music-refresh/new2-report.txt', lines.join('\n'), 'utf8');
fs.writeFileSync('C:/Users/qsr/night-web/archive/music-refresh/new2-picks.json', JSON.stringify(picks, null, 2));
console.log('report written, need-look=' + hard);
