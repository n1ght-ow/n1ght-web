
const fs = require('fs');
const D = 'C:/Users/qsr/night-web/archive/music-refresh/';
const rd = (f) => JSON.parse(fs.readFileSync(D + f, 'utf8').replace(/^\uFEFF/, ''));
const scored = rd('scored.json');
const playlist = rd('playlist.json');
const dupes = rd('duplicates.json');
const removed = rd('removed-from-project.json');

const GENRE_ORDER = ['pop','ballad','rock','edm-and-dance','randb-and-soul','hip-hop','folk-and-country','golden-classics',
  'mandarin-pop','mandarin-ballad','mandarin-rock','mandarin-folk','mandarin-ost','k-pop'];
const GENRE_LABEL = {
  'pop': '英语 · 流行 POP', 'ballad': '英语 · 抒情 BALLAD', 'rock': '英语 · 摇滚 ROCK',
  'edm-and-dance': '英语 · 电音舞曲 EDM & DANCE', 'randb-and-soul': '英语 · 节奏布鲁斯 R&B & SOUL',
  'hip-hop': '英语 · 说唱 HIP-HOP', 'folk-and-country': '英语 · 民谣与乡村 FOLK & COUNTRY',
  'golden-classics': '英语 · 黄金经典 CLASSICS',
  'mandarin-pop': '华语 · 流行', 'mandarin-ballad': '华语 · 抒情', 'mandarin-rock': '华语 · 摇滚',
  'mandarin-folk': '华语 · 民谣与独立', 'mandarin-ost': '华语 · 影视原声与中国风', 'k-pop': '韩语 · K-POP'
};
const GENRE_NOTE = {
  'pop': '当代英美国民热单：Taylor Swift《1989》《Lover》《Midnights》、Ed Sheeran、Dua Lipa、Bruno Mars、Katy Perry、Justin Bieber、Charlie Puth、Maroon 5、Harry Styles、Olivia Rodrigo、Sabrina Carpenter、The Weeknd、Sia 等',
  'ballad': '慢歌与情歌：Adele、Sam Smith、Lewis Capaldi、James Arthur、Christina Perri、Westlife、The Fray、Kodaline、Shallow、A Thousand Years 等',
  'rock': '摇滚 / 流行摇滚 / 另类：Coldplay、Imagine Dragons、Linkin Park、Queen、Avril Lavigne、P!nk、Kelly Clarkson、OneRepublic、Olivia Rodrigo 的摇滚向单曲',
  'edm-and-dance': '电子舞曲：Alan Walker、Avicii、Martin Garrix、Zedd、The Chainsmokers、Calvin Harris、Marshmello、Kygo、David Guetta',
  'randb-and-soul': 'R&B 与灵魂：SZA、Doja Cat、Rihanna、Beyoncé、GIVĒON、Daniel Caesar、Lizzo、Silk Sonic、Tyla',
  'hip-hop': '说唱：Eminem、Kendrick Lamar、Drake、2Pac、XXXTENTACION、Lil Nas X、Post Malone、JAY-Z、Dr. Dre、Flo Rida',
  'folk-and-country': '民谣、乡村与唱作：Jason Mraz、Fool\u2019s Garden、Noah Kahan、Five Hundred Miles、Heat Waves，以及 Taylor Swift 的《Fearless》《Red》时期与 The Band Perry',
  'golden-classics': '黄金经典：The Beatles、Elvis Presley、Westlife 这类老歌',
  'mandarin-pop': '华语流行：林俊杰、G.E.M.邓紫棋、李荣浩、薛之谦、王心凌、张杰、张韶涵、许嵩、告五人、周深、王菲的流行向',
  'mandarin-ballad': '华语抒情：孙燕姿、王菲、陈奕迅、林俊杰、李荣浩、薛之谦、毛不易之外的慢歌与情歌',
  'mandarin-rock': '华语摇滚：逃跑计划、朴树、GALA、万能青年旅店、陈奕迅《浮夸》',
  'mandarin-folk': '华语民谣与独立：赵雷、宋冬野、陈粒、李健、毛不易、陈鸿宇、郭顶、柏松',
  'mandarin-ost': '影视原声与中国风：那些年、大鱼、卷珠帘、小美满、隐形的翅膀、光年之外、遇见、岁月如歌 等',
  'k-pop': '韩语：JISOO、IU、尹美莱，以及《太阳的后裔》《鬼怪》《浪漫满屋》OST'
};
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = (ms) => (typeof ms === 'number' && ms) ? (String(Math.floor(ms / 60000)).padStart(2, '0') + ':' + String(Math.round(ms % 60000 / 1000)).padStart(2, '0')) : '—';
const has = (p) => fs.existsSync(D + 'review-assets/' + p);
const thumb = (p) => has(p) ? '<img class="cov" src="review-assets/' + p + '" loading="lazy">' : '<span class="nocov">?</span>';

const keep = scored.filter(s => s.verdict === 'keep');
const replace = scored.filter(s => s.verdict === 'replace');
const isNew = scored.filter(s => s.verdict === 'new');

let h = [];
const P = (s) => h.push(s);
P('<!doctype html><html lang="zh"><head><meta charset="utf-8"><title>Music 歌单核对 · D:\\fw → night-web（第 2 版）</title>');
P('<style>');
P('*{box-sizing:border-box}body{margin:0;padding:28px 24px 140px;font:14px/1.65 -apple-system,"Segoe UI","Microsoft YaHei",sans-serif;background:#faf9f7;color:#1a1a1a}');
P('h1{font-size:25px;margin:0 0 6px}h2{font-size:19px;margin:46px 0 12px;padding-bottom:6px;border-bottom:2px solid #1a1a1a}');
P('h3{font-size:15px;margin:24px 0 8px;color:#333}.sub{color:#666;margin:0 0 18px}');
P('.cards{display:flex;flex-wrap:wrap;gap:10px;margin:16px 0 6px}');
P('.card{background:#fff;border:1px solid #e4e1dc;border-radius:10px;padding:11px 15px;min-width:126px}');
P('.card b{display:block;font-size:23px;line-height:1.25}.card span{color:#666;font-size:12px}');
P('table{border-collapse:collapse;width:100%;background:#fff;font-size:13px}');
P('th,td{border:1px solid #e8e5e0;padding:7px 9px;vertical-align:top;text-align:left}');
P('th{background:#f3f1ed;font-weight:600;font-size:12px}');
P('tr:nth-child(even) td{background:#fcfbfa}');
P('img.cov{width:56px;height:56px;object-fit:cover;border-radius:4px;display:block}');
P('.pile{display:flex;gap:5px;align-items:flex-start}');
P('.nocov{display:inline-block;width:56px;height:56px;background:#eee;border-radius:4px;text-align:center;line-height:56px;color:#bbb}');
P('.tag{display:inline-block;font-size:11px;padding:1px 6px;border-radius:99px;background:#eceae5;color:#555;margin:1px 3px 1px 0;white-space:nowrap}');
P('.tag.ok{background:#e2f0e4;color:#256029}.tag.bad{background:#fbe3e3;color:#8f2222}.tag.warn{background:#fdf0d8;color:#8a5a00}.tag.new{background:#e3ecfa;color:#1f4b8f}');
P('.mono{font-family:ui-monospace,Consolas,monospace;font-size:12px;color:#555}');
P('.muted{color:#777}.del{color:#8f2222}.tiny{font-size:11px;color:#888}');
P('details{margin:8px 0}summary{cursor:pointer;font-weight:600;padding:3px 0}');
P('.genre-block{background:#fff;border:1px solid #e4e1dc;border-radius:10px;padding:10px 16px;margin:10px 0}');
P('.genre-block ol{margin:6px 0 0;padding-inline-start:24px;columns:2;column-gap:32px}');
P('.genre-block li{padding:1px 0;break-inside:avoid}');
P('.note{background:#fff8e6;border-inline-start:3px solid #d9a300;padding:10px 14px;border-radius:0 8px 8px 0;margin:12px 0}');
P('.note.ok{background:#eef7ef;border-inline-start-color:#3f8f4a}');
P('.sticky{position:sticky;top:0;background:#faf9f7;padding:8px 0;z-index:5;border-bottom:1px solid #e4e1dc}');
P('</style></head><body>');
P('<h1>Music 区歌单核对（第 2 版）</h1>');
P('<p class="sub">数据来源：<span class="mono">D:\\fw</span> 的 32 张截图 + 你补的第 44–58 行截图 → 逐行转录 → 按<b>专辑名 + 时长</b>反查音源 → 与 <span class="mono">js/music-data.js</span> 逐条对照。<b>仍然没有改任何代码。</b></p>');

P('<div class="cards">');
P('<div class="card"><b>' + playlist.length + '</b><span>歌单曲目（已删 Right Here Waiting）</span></div>');
P('<div class="card"><b>' + keep.length + '</b><span>音源一致，照旧</span></div>');
P('<div class="card"><b>' + replace.length + '</b><span>音源不对，换 ID</span></div>');
P('<div class="card"><b>' + isNew.length + '</b><span>截图有、项目没有</span></div>');
P('<div class="card"><b>14</b><span>曲风分组（重做）</span></div>');
P('<div class="card"><b>4 + 2</b><span>重复 / 同曲异版</span></div>');
P('<div class="card"><b>' + removed.length + '</b><span>项目有、截图没有</span></div>');
P('</div>');

P('<h2>0 · 这一版改了什么</h2>');
P('<div class="note ok"><b>① 补上了第 44–58 行。</b>用你新给的截图转录了 15 首（他不懂 / 隐形的翅膀 / 快乐崇拜 / 亲爱的，那不是爱情 / 淋雨一直走 / 带我去找夜生活 / 爱人错过 / 唯一(告五人) / 给你一瓶魔法药水 / 素颜 / 雅俗共赏 / 你还要我怎样 / 怪咖 / 认真的雪 / 天外来物）。歌单现在是 <b>' + playlist.length + '</b> 首。<br><b>② 删掉了 Right Here Waiting（#215）。</b><br><b>③ Slow Down 用了你给的链接</b> → id=1356658022（Madnap / Pauline Herr《Slow Down》03:23，与截图完全一致）。<br><b>④ 第 359 行按你说的不管了</b>，缺口清零（第 359 行本来也读不出内容）。<br><b>⑤ 曲风重做，改成 14 组</b>，见第 6 节。</div>');

P('<h2>1 · 重复曲目</h2>');
P('<h3>同曲同歌手，出现了两次（4 组，建议各留一条）</h3>');
P('<table><tr><th>歌名</th><th>歌手</th><th>行号 / 截图里的专辑</th><th>我的建议</th></tr>');
const keepAdvice = { 'Lemon Tree（柠檬树）': '#327《Dish of the Day》是原专辑，留它', "Here's to Never Growing Up": '#330《Avril Lavigne (Expanded Edition)》是专辑版，留它', 'Halo': '#329《I AM...SASHA FIERCE》是专辑版，留它', 'Another Day Of Sun': '#340《La La Land (Original Motion Picture Soundtrack)》是原声专辑，留它' };
for (const d of dupes.同曲同歌手完全重复) {
  P('<tr><td><b>' + esc(d.title) + '</b></td><td>' + esc(d.artist) + '</td><td>' + d.rows.map((r, i) => '#' + r + ' <span class="muted">' + esc(d.albums[i]) + '</span>').join('<br>') + '</td><td>' + esc(keepAdvice[d.title] || '') + '</td></tr>');
}
P('</table>');
P('<h3>同曲不同版本（2 组，可能你是有意都留着）</h3>');
P('<table><tr><th>歌名</th><th>行号</th><th>说明</th></tr>');
for (const d of dupes.同曲不同版本_可能有意保留) P('<tr><td>' + esc(d.title) + '</td><td>#' + d.rows.join(' / #') + '</td><td>' + esc(d.note) + '</td></tr>');
P('</table>');
P('<h3>同名但确实是两首不同的歌（3 组，不算重复）</h3>');
P('<table><tr><th>歌名</th><th>行号</th><th>说明</th></tr>');
for (const d of dupes.同名不同歌) P('<tr><td>' + esc(d.title) + '</td><td>#' + d.rows.join(' / #') + '</td><td>' + esc(d.note) + '</td></tr>');
P('</table>');

P('<h2>2 · 音源不对，需要换 ID（' + replace.length + ' 首）</h2>');
P('<p class="sub">三张小图依次是：<b>左</b>＝你截图里的封面（从截图裁的）·<b>中</b>＝项目现在这个 ID 的真实封面 ·<b>右</b>＝我按专辑反查到的候选封面。</p>');
P('<table><tr><th style="width:36px">行</th><th style="width:182px">封面 截图 / 现状 / 建议</th><th style="width:15%">歌名 · 歌手</th><th>你截图里的音源</th><th>项目现状（要换掉的）</th><th>建议改成</th></tr>');
for (const r of replace) {
  P('<tr>');
  P('<td>#' + r.idx + '</td>');
  P('<td><div class="pile">' + thumb('c' + r.idx + '.jpg') + (r.proj ? thumb('p' + r.proj.id + '.jpg') : '<span class="nocov">—</span>') + thumb('n' + r.idx + '.jpg') + '</div></td>');
  P('<td><b>' + esc(r.title) + '</b><br><span class="muted">' + esc(r.artist) + '</span></td>');
  P('<td>' + esc(r.shotAlbum) + '<br><span class="mono">' + esc(r.shotDur) + '</span></td>');
  P('<td class="del">' + esc(r.proj ? r.proj.album : '—') + '<br><span class="mono">' + fmt(r.proj && r.proj.duration) + ' · id=' + esc(r.proj ? r.proj.id : '') + '</span></td>');
  P('<td>' + (r.chosen ? '<b>' + esc(r.chosen.album) + '</b><br><span class="mono">' + fmt(r.chosen.duration) + ' · id=' + esc(r.chosen.id) + '</span><br>' + r.chosen.why.map(w => '<span class="tag ' + (/^专辑$|^歌名$|^歌手$|^时长$/.test(w) ? 'ok' : 'warn') + '">' + esc(w) + '</span>').join('') : '<span class="tag bad">没搜到</span>') + '</td>');
  P('</tr>');
}
P('</table>');

P('<h2>3 · 截图里有、项目里没有的歌（' + isNew.length + ' 首，需要新增）</h2>');
P('<table><tr><th style="width:36px">行</th><th style="width:66px">截图封面</th><th style="width:16%">歌名 · 歌手</th><th>你截图里的专辑 / 时长</th><th>建议音源</th><th style="width:13%">曲风</th></tr>');
for (const r of isNew) {
  P('<tr><td>#' + r.idx + '</td><td>' + thumb('c' + r.idx + '.jpg') + '</td>');
  P('<td><b>' + esc(r.title) + '</b><br><span class="muted">' + esc(r.artist) + '</span></td>');
  P('<td>' + esc(r.shotAlbum) + '<br><span class="mono">' + esc(r.shotDur) + '</span></td>');
  P('<td>' + (r.chosen ? '<b>' + esc(r.chosen.album) + '</b><br><span class="mono">' + fmt(r.chosen.duration) + ' · id=' + esc(r.chosen.id) + '</span><br>' + r.chosen.why.map(w => '<span class="tag ' + (/^专辑$|^歌名$|^歌手$|^时长$/.test(w) ? 'ok' : 'warn') + '">' + esc(w) + '</span>').join('') : '<span class="tag bad">没搜到</span>') + '</td>');
  P('<td>' + esc(GENRE_LABEL[r.genre] || r.genre || '') + '</td></tr>');
}
P('</table>');

P('<h2>4 · 音源一致、可以原样沿用的（' + keep.length + ' 首）</h2>');
P('<table><tr><th style="width:36px">行</th><th style="width:66px">封面</th><th style="width:20%">歌名 · 歌手</th><th>专辑</th><th style="width:14%">ID</th><th style="width:10%">时长</th><th style="width:12%">曲风</th></tr>');
for (const r of keep) {
  P('<tr><td>#' + r.idx + '</td><td>' + thumb('c' + r.idx + '.jpg') + '</td>');
  P('<td><b>' + esc(r.title) + '</b><br><span class="muted">' + esc(r.artist) + '</span></td>');
  P('<td>' + esc(r.proj.album) + '</td><td class="mono">' + esc(r.proj.id) + '</td><td class="mono">' + fmt(r.proj.duration) + '</td>');
  P('<td>' + esc(GENRE_LABEL[r.genre] || '') + '</td></tr>');
}
P('</table>');

P('<h2>5 · 项目里有、截图里没有的（' + removed.length + ' 首）</h2>');
P('<p class="sub">按「整段替换」的口径，这 ' + removed.length + ' 首会被删掉。只想补齐 + 修音源的话可以忽略本节。</p>');
const rg = {};
for (const p of removed) (rg[p.groupZh] = rg[p.groupZh] || []).push(p);
for (const g of Object.keys(rg)) {
  P('<details><summary>' + esc(g) + '（' + rg[g].length + '）</summary><div class="muted" style="padding:6px 0;font-size:12px">' + rg[g].map(p => esc(p.title) + '–' + esc(p.artist)).join('　·　') + '</div></details>');
}

P('<h2>6 · 曲风分类（重做，14 组 / ' + playlist.length + ' 首）</h2>');
P('<p class="sub">上一版的问题：<b>华语摇滚、华语R&amp;B 是空的</b>，华语抒情只剩 1 首，而英语流行 138 首、华语流行 65 首过大；另外 Taylor Swift 被拆到流行/乡村/民谣三个组、逃跑计划和朴树被误放进华语流行。这一版重排：<b>按「语种 + 风格」分 14 组，没有空组</b>；Taylor Swift 按专辑划（《Fearless》《Red》→ 民谣与乡村，《1989》《Lover》《Midnights》→ 流行）；民谣和乡村并成一组；华语去掉没有内容的 R&amp;B 组。</p>');
const gg = {};
for (const r of scored) (gg[r.genre] = gg[r.genre] || []).push(r);
for (const g of GENRE_ORDER) {
  const arr = gg[g] || [];
  if (!arr.length) continue;
  P('<div class="genre-block"><b>' + esc(GENRE_LABEL[g]) + '</b> <span class="muted">(' + arr.length + ')</span><div class="tiny">' + esc(GENRE_NOTE[g] || '') + '</div><ol>');
  for (const r of arr) P('<li>#' + r.idx + ' ' + esc(r.title) + ' <span class="muted">– ' + esc(r.artist) + '</span></li>');
  P('</ol></div>');
}
P('</body></html>');
fs.writeFileSync(D + 'review.html', h.join('\n'));
console.log('review.html bytes =', h.join('\n').length);
console.log('keep', keep.length, 'replace', replace.length, 'new', isNew.length);
