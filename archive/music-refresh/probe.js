
const fs = require('fs');
const D = 'C:/Users/qsr/night-web/archive/music-refresh/';
let html = fs.readFileSync(D + 'mock.html', 'utf8');
html = html.replace('</body>', `<pre id="probe"></pre>
<script>
window.addEventListener('load', () => {
  const el = document.querySelector('.lb-music');
  const head = document.querySelector('.lb-music-head');
  const link = document.querySelector('.lb-music-link');
  const top = document.querySelector('.lb-top');
  const r = el.getBoundingClientRect();
  const hr = head.getBoundingClientRect();
  const lr = link.getBoundingClientRect();
  const tr = top.getBoundingClientRect();
  document.getElementById('probe').textContent = 'PROBE|' + [
    innerWidth, innerHeight,
    Math.round(r.width), Math.round(hr.top), Math.round(hr.bottom),
    Math.round(r.top), Math.round(r.bottom),
    Math.round(lr.top), Math.round(lr.bottom), Math.round(tr.bottom),
    Math.round(r.top - hr.bottom), Math.round(lr.top - r.bottom)
  ].join('|') + '|END';
});
</script></body>`);
fs.writeFileSync(D + 'probe.html', html);
console.log('probe rebuilt');
