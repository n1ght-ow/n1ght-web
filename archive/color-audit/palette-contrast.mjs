/* ============================================================
   Colour audit, third file: the palette itself.

   capture.mjs measures what COMPOSITES (a plate over a photograph, a
   scrim behind a 190px wordmark). This one measures what is
   ARITHMETIC: the token pairs inside the site's own :root. Those are
   the pairs a palette change breaks silently, because nothing about
   them is visible until someone squints at a 12px mono label.

   IT PARSES css/style.css, IT DOES NOT CARRY A COPY. That is the whole
   point: a contrast table written next to the tokens is a table that
   starts lying the first time somebody edits a hex, and nobody notices
   because the numbers still look plausible. Here they are computed
   from the file that ships. Change a token, re-run this, paste the new
   numbers into the comment above :root.

     node archive/color-audit/palette-contrast.mjs
     node archive/color-audit/palette-contrast.mjs --file css/style.css

   It was written for the three-skin comparison and renamed when the
   winner was promoted: it used to read css/themes.css and loop over
   three :root[data-theme=...] blocks. There is one :root now, and the
   loop is one iteration, which is the same code with a smaller job.

   Method: WCAG 2.1 relative luminance, sRGB, the same one
   pixel-contrast.py uses. A sheet over a page is composited in sRGB at
   the layer's own alpha, which is what the browser does for a
   background-color and is the conservative direction for the pairs it
   is applied to here.
   ============================================================ */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const file = (() => {
  const i = process.argv.indexOf("--file");
  return i > -1 ? process.argv[i + 1] : "css/style.css";
})();

/* ---------- colour maths ---------- */
const srgb = (c) => {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};
function luminance(hex) {
  let h = hex.trim().replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length !== 6) return null;
  const parts = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  if (parts.some(Number.isNaN)) return null;
  return 0.2126 * srgb(parts[0]) + 0.7152 * srgb(parts[1]) + 0.0722 * srgb(parts[2]);
}
function ratio(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  if (la === null || lb === null) return null;
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
/* sRGB composite of fg at alpha p over an opaque bg */
function over(fg, bg, p) {
  const bytes = (x) => {
    const s = x.replace("#", "");
    return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
  };
  const f = bytes(fg);
  const b = bytes(bg);
  return (
    "#" +
    f
      .map((c, i) => Math.round(c * p + b[i] * (1 - p)))
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
  );
}

/* ---------- read the skins out of the CSS ---------- */
const css = readFileSync(resolve(file), "utf8");

const skins = [];
{
  /* Each skin is one :root[data-theme="x"] { ... } block. The body
     fallback in the same rule is a second selector on the same
     declaration, so cutting the block at its matching brace is enough
     - and counting braces is the only thing here that cannot be
     fooled by a hex colour inside a comment. */
  const re = /(?:^|\n):root\s*\{/g;
  let m;
  while ((m = re.exec(css))) {
    let depth = 1;
    let i = re.lastIndex;
    while (i < css.length && depth > 0) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}") depth--;
      i++;
    }
    const body = css.slice(re.lastIndex, i - 1);
    const tokens = {};
    const tre = /(--[a-z0-9-]+):\s*([^;]+);/gi;
    let t;
    while ((t = tre.exec(body))) tokens[t[1]] = t[2].trim();
    if (Object.keys(tokens).length) {
      /* Named after --paper-050 so the header still prints something
         identifiable if a second bare :root ever lands in the file. */
      skins.push({ name: tokens["--paper-050"] ? "the palette" : "unnamed :root", tokens });
    }
    re.lastIndex = i;
  }
}

/* color-mix(in oklab, #AABBCC 78%, transparent) -> the hex and the
   alpha. oklab interpolation against transparent is not sRGB, so this
   is the one place the file is approximate: it reads the hex and the
   percentage and composites in sRGB. For a tint this light the
   difference is far under a hundredth of a ratio, and the number it
   produces is the conservative one - the browser's oklab mix comes
   out slightly more saturated, and so slightly darker, than the sRGB
   mix of the same pair. */
function mixToken(v) {
  const m = /^color-mix\(in oklab,\s*(#[0-9a-f]{3,6})\s+(\d+(?:\.\d+)?)%\s*,\s*transparent\)$/i.exec(v);
  return m ? { hex: m[1], alpha: Number(m[2]) / 100 } : null;
}
/* One level of var() resolution inside the same block. A skin is
   allowed to say --glass-nav: var(--paper-000) - that is the honest way
   to write "this bar is solid paper" and it is what theme B does - and
   a checker that only understood literals would report it as missing
   rather than measuring the thing that actually paints. */
const plain = (v, tokens) => {
  let s = String(v || "").trim();
  const ref = /^var\(\s*(--[a-z0-9-]+)\s*\)$/i.exec(s);
  if (ref && tokens) s = String(tokens[ref[1]] || "").trim();
  return /^#[0-9a-f]{3,6}$/i.test(s) ? s : null;
};

/* ---------- the pairs that matter, and their floors ---------- */
const CHECKS = [
  { fg: "--ink-900", bg: "--paper-050", floor: 7, label: "body text on the page" },
  { fg: "--ink-600", bg: "--paper-050", floor: 4.5, label: "secondary text" },
  { fg: "--ink-500", bg: "--paper-050", floor: 4.5, label: "MUTED FLOOR" },
  { fg: "--ink-500", bg: "--sky-050", floor: 4.5, label: "muted on the tinted tray" },
  { fg: "--sky-700", bg: "--paper-050", floor: 4.5, label: "links and the focus ring" },
  { fg: "--sky-700", bg: "--sky-050", floor: 4.5, label: "accent text on the tray" },
  { fg: "--ink-900", bg: "--sky-400", floor: 4.5, label: "ink label on a filled accent" },
  { fg: "--color-on-accent", bg: "--sky-400", floor: 4.5, label: "skin's own label on the filled accent" },
  { fg: "--on-dark", bg: "--ink-950", floor: 4.5, label: "type on the dark areas" },
  { fg: "--accent-2-ink", bg: "--paper-050", floor: 4.5, label: "secondary hue as text" },
  { fg: "--accent-3-ink", bg: "--paper-050", floor: 4.5, label: "interactive hue as text" },
  { fg: "--accent-4-ink", bg: "--paper-050", floor: 4.5, label: "alert hue as text" },
];

const BARS = [
  { token: "--color-surface", alphaFloor: 0, label: "a bar: the sheet every control is cut from" },
  { token: "--color-bg", alphaFloor: 0, label: "the page, for reference" },
];

/* The chapter grounds are the other thing a skin introduces that the
   base palette never had to answer for: a muted 12px label sitting on a
   gradient is only as legible as its DARKEST stop, so that is the stop
   that gets measured - and the ground is parsed out of the token rather
   than restated here, so the check cannot fall behind the CSS. */
function darkestStop(value) {
  const stops = String(value || "").match(/#[0-9a-f]{3,6}/gi);
  if (!stops) return null;
  let worst = null;
  let worstL = Infinity;
  for (const s of stops) {
    const l = luminance(s);
    if (l !== null && l < worstL) {
      worstL = l;
      worst = s;
    }
  }
  return worst;
}

let failures = 0;
const lines = ["palette-contrast - " + file, ""];

for (const skin of skins) {
  const T = skin.tokens;
  lines.push("=== " + skin.name + " ===");

  /* A skin that names its own label for the filled accent has answered
     the "ink on the fill" question its own way, and the base check does
     not apply to it: theme B's cobalt is a DARK fill, so its label is
     light, and judging it by the ink rule would report a deliberate,
     measured decision as a failure. Skipped, not waived - the
     substituted pair is checked on the very next line. */
  const ownLabel = Boolean(plain(T["--color-on-accent"], T));
  for (const c of CHECKS) {
    if (ownLabel && c.fg === "--ink-900" && c.bg === "--sky-400") continue;
    const fg = plain(T[c.fg], T);
    const bg = plain(T[c.bg], T);
    if (!fg || !bg) {
      lines.push("  n/a   " + c.fg + " on " + c.bg + "   (" + c.label + ")");
      continue;
    }
    const r = ratio(fg, bg);
    const ok = r >= c.floor;
    if (!ok) failures++;
    lines.push(
      "  " + (ok ? "ok  " : "LOW ") + r.toFixed(2).padStart(6) + ":1  (>= " + c.floor + ")  " + c.label
    );
  }

  for (const bar of BARS) {
    const m = mixToken(T[bar.token]);
    const solid = plain(T[bar.token], T);
    if (!m && !solid) {
      lines.push("  n/a   " + bar.label + " (" + bar.token + ")");
      continue;
    }
    if (m && bar.alphaFloor && m.alpha < bar.alphaFloor) {
      failures++;
      lines.push("  LOW  alpha " + m.alpha.toFixed(2) + " on " + bar.token + " is under the " + bar.alphaFloor + " floor");
    }
    /* A skin with no glass declares the bar as a solid paper, which is
       a legitimate answer; then the floor is that paper's own. */
    const comp = m ? over(m.hex, T["--paper-050"], m.alpha) : solid;
    for (const [name, tok] of [
      ["--ink-950", "ink label"],
      ["--ink-600", "secondary label"],
      ["--ink-500", "muted label"],
    ]) {
      const fg = plain(T[name], T);
      if (!fg) continue;
      const r = ratio(fg, comp);
      const ok = r >= 4.5;
      if (!ok) failures++;
      lines.push(
        "  " + (ok ? "ok  " : "LOW ") + r.toFixed(2).padStart(6) + ":1  (>= 4.5)  " +
          tok + " on the " + bar.label + " " + comp + (m ? "" : " (solid)")
      );
    }
  }
  /* every chapter ground, against the two text roles that sit on it */
  for (const name of Object.keys(T).filter((k) => k.indexOf("--ground-") === 0)) {
    const bg = darkestStop(T[name]);
    if (!bg) continue;
    for (const pair of [
      ["--ink-900", "body", 7],
      ["--ink-500", "muted", 4.5],
    ]) {
      const fg = plain(T[pair[0]], T);
      if (!fg) continue;
      const rr = ratio(fg, bg);
      const ok = rr >= pair[2];
      if (!ok) failures++;
      lines.push(
        "  " + (ok ? "ok  " : "LOW ") + rr.toFixed(2).padStart(6) + ":1  (>= " + pair[2] + ")  " +
          pair[1] + " on " + name + " darkest stop " + bg
      );
    }
  }

  lines.push("");
}

if (!skins.length) {
  lines.push("no :root block found - has style.css been renamed?");
  failures++;
}

lines.push(failures ? failures + " PAIR(S) UNDER FLOOR" : "all pairs clear");
console.log(lines.join("\n"));
process.exit(failures ? 1 : 0);
