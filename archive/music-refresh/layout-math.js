
const clamp = (lo, v, hi) => Math.min(Math.max(v, lo), hi);
const sizes = [
  [2560,1440],[1920,1080],[1680,1050],[1512,982],[1440,900],[1366,768],[1280,800],[1180,820],
  [1024,768],[900,1200],[834,1112],[768,1024],[720,1280],[640,900],[430,932],[414,896],
  [390,844],[375,667],[360,640],[812,375],[844,390],[1024,600],[1024,500],[667,375]
];
let fails = 0, worst = null;
for (const [W, H] of sizes) {
  const padTop = clamp(16, 0.03 * H, 32);
  let cover = Math.min(0.68 * W, 420, 0.50 * H);
  let tight = false, pin = false, h4 = false, kA = 8, lA = 12, gA = 24, gB = 32;
  if (W <= 720) { cover = Math.min(0.76 * W, 360, 0.46 * H); tight = true; }
  if (H <= 720) { cover = Math.min(0.68 * W, 420, 0.42 * H); tight = true; }
  if (H <= 560) {
    pin = true; h4 = true;
    cover = Math.min(0.48 * W, 240, 0.30 * H);
    kA = 4; lA = 8; gA = 8; gB = 12;
  }
  if (tight && !pin) { gA = 16; gB = 24; }
  const titlePx = h4 ? 20 : clamp(20, 18.4 + 0.0045 * W * 16, 25);
  for (const lines of [1, 2]) {
    const head = 15 + kA + lines * titlePx * 1.1 + lA + 15;
    const col = head + gA + cover + gB + 42;
    const top = pin ? (padTop + 56) : (H - col) / 2;
    const barBottom = padTop + 42;
    const avail = pin ? (H - (padTop + 56) - padTop) : (H - 2 * padTop);
    const ok = col <= avail && top >= barBottom - 0.5;
    if (!ok) { fails++; console.log('FAIL', W + 'x' + H, lines + 'L', 'cover=' + Math.round(cover), 'col=' + Math.round(col), 'top=' + Math.round(top), 'bar=' + Math.round(barBottom), 'avail=' + Math.round(avail)); }
    const slack = Math.min(top - barBottom, avail - col);
    if (!worst || slack < worst.slack) worst = { size: W + 'x' + H, lines, slack: Math.round(slack), cover: Math.round(cover) };
  }
}
console.log(fails === 0 ? 'ALL ' + sizes.length + ' SIZES CLEAR' : fails + ' FAILURES');
console.log('tightest:', JSON.stringify(worst));
