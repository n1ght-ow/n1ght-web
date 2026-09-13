
const fs = require('fs');
const vm = require('vm');
const P = 'C:/Users/qsr/night-web/';
const D = P + 'archive/music-refresh/';
const sb = { window: {} }; vm.createContext(sb);
vm.runInContext(fs.readFileSync(P + 'js/music-data.js', 'utf8'), sb, { filename: 'm' });
vm.runInContext(fs.readFileSync(P + 'js/music-covers.js', 'utf8'), sb, { filename: 'c' });
const data = sb.window.MUSIC_DATA, covers = sb.window.MUSIC_COVERS;
const pick = (title) => { for (const g of data) for (const t of g.tracks) if (t.title === title) return { ...t, gid: g.id }; };
const track = pick('Dear my crazy soulmate') || data[13].tracks[0];
const cover = covers[track.id];
const kicker = data.find(g => g.tracks.includes(data.flatMap(x => x.tracks).find(t => t.id === track.id))).zh;

const cases = [
  { name: 'default', cover: 'min(68vw, 420px, 50vh)', headEnd: 'var(--sp-5)', linkStart: 'var(--sp-6)', title: track.title, artist: track.artist, kick: '韩语 / K-POP' },
  { name: 'long-title', cover: 'min(68vw, 420px, 50vh)', headEnd: 'var(--sp-5)', linkStart: 'var(--sp-6)', title: pick('时间都去哪儿了（电影《私人定制》插曲\\电视剧《老牛家的战争》主题曲\\电视剧《空巢姥爷》主题曲）') ? '时间都去哪儿了（电影《私人定制》插曲）' : track.title, artist: '王铮亮', kick: '华语抒情' },
];
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>music detail mock</title>
<link rel="stylesheet" href="../../css/fonts.css">
<link rel="stylesheet" href="../../css/style.css">
<style>body { background: #111; }</style>
</head>
<body>
  <div class="lightbox is-open" id="lightbox" role="dialog" aria-modal="true" aria-label="Archive detail viewer" aria-hidden="false" data-detail="music">
    <div class="lb-top">
      <span id="lb-count">TRACK 02 / 08</span>
      <span id="lb-act" class="lb-act">${cases[0].kick}</span>
      <button class="lb-close" id="lb-close" type="button" aria-label="Close detail viewer">Close</button>
    </div>
    <figure class="lb-stage" id="lb-stage">
      <img id="lb-img" alt="" hidden>
      <div class="lb-music-head" id="lb-music-head">
        <p class="lb-meta-kicker" id="lb-music-kicker">${cases[0].kick}</p>
        <h3 class="lb-meta-title" id="lb-music-title">${cases[0].title}</h3>
        <p class="lb-meta-lines" id="lb-music-lines">${cases[0].artist}</p>
      </div>
      <div class="lb-music" id="lb-music">
        <img class="lb-music-cover" id="lb-music-cover" alt="" src="../../album-covers/${cover}">
        <span class="lb-music-glyph" aria-hidden="true" hidden>♪</span>
      </div>
      <a class="lb-meta-link lb-music-link" id="lb-music-link" href="#">OPEN IN NETEASE</a>
      <figcaption id="lb-cap" class="lb-cap" hidden></figcaption>
    </figure>
    <div class="lb-meta" id="lb-meta" hidden></div>
    <button class="lb-nav lb-prev" id="lb-prev" type="button" aria-label="Previous item">←</button>
    <button class="lb-nav lb-next" id="lb-next" type="button" aria-label="Next item">→</button>
    <div class="lb-rail" id="lb-rail" hidden></div>
  </div>
</body>
</html>`;
fs.writeFileSync(D + 'mock.html', html);
console.log('mock written | track', track.title, '| cover', cover);
