/* Colour audit: screenshot a page over CDP and report a selector's rect.
 *
 * Dev-only. The site never loads this, and it needs nothing beyond Node 21+
 * (global WebSocket) and a Chromium binary - no npm install, which is the same
 * rule the rest of the repo runs on.
 *
 *   node archive/color-audit/capture.mjs \
 *     --url file:///C:/Users/qsr/night-web/index.html \
 *     --w 1440 --h 900 --sel ".hero-mask" \
 *     --hide ".hero-wordmark,.hero-kicker,.hero-foot" \
 *     --out %TEMP%/hero.png
 *
 * --hide exists for the one measurement that cannot be done any other way:
 * the wordmark's own white glyphs are the brightest pixels in its own box, so
 * contrast behind the type has to be read with the type taken out of the
 * picture. That is the method in DESIGN.md 3.2 inference 3.
 *
 * Prints the rect as JSON on the last line so a caller can feed it straight
 * into pixel-contrast.py. Anything --eval returned comes back in the same line
 * under `eval`.
 */
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME_CANDIDATES = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
];

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const has = (name) => process.argv.includes(`--${name}`);

const url = arg("url", "file:///C:/Users/qsr/night-web/index.html");
const width = Number(arg("w", 1440));
const height = Number(arg("h", 900));
const sel = arg("sel", "");
const hide = arg("hide", "");
const out = arg("out", "shot.png");
const scrollTo = arg("scroll", "");
const run = arg("eval", "");
let evalResult = null;
const settle = Number(arg("settle", 4500));
const port = Number(arg("port", 9333));

const chrome = CHROME_CANDIDATES.find((p) => existsSync(p)) ?? CHROME_CANDIDATES[0];

const profile = mkdtempSync(join(tmpdir(), "color-audit-"));
const child = spawn(
  chrome,
  [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    `--window-size=${width},${height}`,
    "about:blank",
  ],
  { stdio: "ignore" }
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function endpoint() {
  for (let i = 0; i < 80; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = list.find((t) => t.type === "page");
      if (page) return page.webSocketDebuggerUrl;
    } catch {
      /* not up yet */
    }
    await sleep(250);
  }
  throw new Error(`no devtools endpoint on :${port} - is ${chrome} installed?`);
}

const ws = new WebSocket(await endpoint());
await new Promise((r) => ws.addEventListener("open", r, { once: true }));

let seq = 0;
const pending = new Map();
ws.addEventListener("message", (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
  }
});
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
const evaluate = async (expression) =>
  (await send("Runtime.evaluate", { expression, returnByValue: true })).result.value;

try {
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 600,
  });
  if (has("reduced-motion")) {
    /* The site has a whole reduced-motion contract and no way to look at
       it from a headless shot, because the media query is not a URL. */
    await send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-motion", value: "reduce" }],
    });
  }
  await send("Page.navigate", { url });
  await sleep(settle);
  if (run) {
    /* anything the page needs done before it can be photographed - opening a
       tab, for instance. It is the page's own code doing the work, not a
       screenshot-specific state, so what renders here is what renders for a
       reader. */
    /* The body is a function body, so a `return` in it comes back out
       with the shot. That is how a computed style gets checked without a
       second script: --eval "return getComputedStyle(document.querySelector('.nav')).backgroundColor".
       The documented no-return form still works and still reports null. */
    evalResult = await evaluate(`(() => { ${run} })()`);
    await sleep(1200);
  }
  if (scrollTo) {
    await evaluate(`scrollTo(0, ${Number(scrollTo)}); 1`);
    await sleep(900);
  }
  if (hide) {
    /* querySelectorAll, not querySelector: `--hide ".nav-links a"` is meant to
       take every link, and querySelector returns one. */
    await evaluate(
      `${JSON.stringify(hide)}.split(",").forEach(function (s) {
         document.querySelectorAll(s.trim()).forEach(function (el) {
           el.style.visibility = "hidden";
         });
       }); 1`
    );
    await sleep(300);
  }

  let rect = null;
  if (sel) {
    const raw = await evaluate(
      `(() => { const el = document.querySelector(${JSON.stringify(sel)});
         if (!el) return null;
         const r = el.getBoundingClientRect();
         return JSON.stringify({ x: Math.round(r.x), y: Math.round(r.y),
                                 w: Math.round(r.width), h: Math.round(r.height) });
       })()`
    );
    rect = raw ? JSON.parse(raw) : null;
  }

  const { data } = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(out, Buffer.from(data, "base64"));
  console.log(JSON.stringify({ out, viewport: `${width}x${height}`, rect, ...(evalResult === undefined ? {} : { eval: evalResult }) }));
} finally {
  ws.close();
  child.kill();
}
