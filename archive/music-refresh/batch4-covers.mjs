/* batch4-covers.mjs — 第 4 批 38 首的封面：取 song/detail 的 picUrl（500px），落进
 * album-covers/<picId>.jpg，然后把新行并进 archive/music-album-covers/index.json 并重新生成
 * js/music-covers.js（与 batch3-index.js 同一套写法）。
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const H = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/152.0 Safari/537.36", Referer: "https://music.163.com/" };
const strip = (s) => String(s).replace(/^\uFEFF/, "");
const OUT = join(ROOT, "album-covers");
mkdirSync(OUT, { recursive: true });

const { songs } = JSON.parse(strip(readFileSync(join(HERE, "batch4-verified.json"), "utf8")));
const ids = songs.map((s) => s.id);
const res = await fetch("https://music.163.com/api/song/detail?ids=" + encodeURIComponent(JSON.stringify(ids)), { headers: H });
const detail = (await res.json()).songs || [];
if (detail.length !== ids.length) throw new Error("song/detail returned " + detail.length + " of " + ids.length);

function jpegSize(buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i < buf.length - 9) {
    if (buf[i] !== 0xff) { i++; continue; }
    const m = buf[i + 1];
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
      return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
    }
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return null;
}

let added = 0, have = 0, fail = 0, bad = [];
const rows = [];
for (const s of detail) {
  const pic = s.album.picUrl || "";
  const file = pic.split("/").pop();
  const dest = join(OUT, file);
  if (existsSync(dest)) have++;
  else {
    let ok = false;
    for (let t = 0; t < 4 && !ok; t++) {
      try {
        const r = await fetch(pic + "?param=500y500", { headers: H });
        if (!r.ok) throw new Error("http " + r.status);
        const buf = Buffer.from(await r.arrayBuffer());
        if (!jpegSize(buf)) throw new Error("not jpeg");
        writeFileSync(dest, buf);
        ok = true;
      } catch (e) { await new Promise((r) => setTimeout(r, 800 * (t + 1))); }
    }
    if (ok) added++; else { fail++; bad.push(s.id + " " + pic); }
    await new Promise((r) => setTimeout(r, 150));
  }
  const size = existsSync(dest) ? jpegSize(readFileSync(dest)) : null;
  if (!size || size.w !== 500) bad.push(s.id + " odd size " + JSON.stringify(size));
  rows.push({ songId: String(s.id), title: s.name, artist: s.artists.map((a) => a.name).join(" / "), album: s.album.name, albumId: s.album.id, cover: file });
}
writeFileSync(join(HERE, "batch4-covers.json"), JSON.stringify(rows, null, 2) + "\n", "utf8");
console.log("covers: existing=" + have + " new=" + added + " fail=" + fail);
if (bad.length) console.log("odd: " + bad.join(" | "));

// --- merge into the archive index (same shape as batch3-index.js) ---
const index = JSON.parse(strip(readFileSync(join(ROOT, "archive/music-album-covers/index.json"), "utf8")));
const before = index.songs.length;
const haveSet = new Set(index.songs.map((s) => String(s.songId)));
let pushed = 0, skipped = 0;
for (const a of rows) {
  if (haveSet.has(a.songId)) { skipped++; continue; }
  index.songs.push(a); haveSet.add(a.songId); pushed++;
}
index.songs.sort((a, b) => Number(a.songId) - Number(b.songId));
index.files = new Set(index.songs.map((s) => s.cover)).size;
index.generated = new Date().toISOString().replace(/\.\d+Z$/, "Z");
writeFileSync(join(ROOT, "archive/music-album-covers/index.json"), JSON.stringify(index, null, 2) + "\n", "utf8");
const esc = (v) => '"' + String(v).replace(/"/g, '""') + '"';
writeFileSync(join(ROOT, "archive/music-album-covers/index.csv"),
  ["songId,title,artist,album,albumId,cover"].concat(index.songs.map((s) => [s.songId, s.title, s.artist, s.album, s.albumId, s.cover].map(esc).join(","))).join("\r\n") + "\r\n", "utf8");

const head = [
  "/* Cover art index for the music panel (generated).",
  "   Source: archive/music-album-covers/index.json - NetEase Cloud Music",
  "   song/detail API, picUrl at 500px. The files themselves live in",
  "   album-covers/<file>; this map is songId -> file name. Songs absent",
  "   from the map have no artwork and fall back to the placeholder",
  "   sleeve in the detail layer. Do not hand-edit: regenerate from the",
  "   archive index instead. */",
  "window.MUSIC_COVERS = {"
];
const body = index.songs.map((s, i) => "  " + JSON.stringify(String(s.songId)) + ": " + JSON.stringify(s.cover) + (i === index.songs.length - 1 ? "" : ","));
writeFileSync(join(ROOT, "js/music-covers.js"), head.concat(body, ["};"]).join("\n") + "\n", "utf8");

// --- audit ---
const data = readFileSync(join(ROOT, "js/music-data.js"), "utf8");
const panel = new Set(Array.from(data.matchAll(/\{ id: "(\d+)", title:/g), (m) => m[1]));
const cov = new Set(index.songs.map((s) => String(s.songId)));
const missing = [...panel].filter((id) => !cov.has(id));
const onDisk = new Set(readdirSync(OUT));
const dangling = index.songs.filter((s) => !onDisk.has(s.cover));
const stale = index.songs.filter((s) => !panel.has(String(s.songId)));
console.log("index songs " + before + " -> " + index.songs.length + " (+" + pushed + ", skipped " + skipped + ")");
console.log("distinct cover files " + index.files + "   files on disk " + onDisk.size);
console.log("panel ids " + panel.size + "  without a cover: " + missing.length + (missing.length ? " -> " + missing.slice(0, 10).join(",") : ""));
console.log("index rows pointing at a missing file: " + dangling.length + (dangling.length ? " -> " + dangling.slice(0, 5).map((s) => s.songId + ":" + s.cover).join(",") : ""));
console.log("index rows not in the panel (stale): " + stale.length + (stale.length ? " -> " + stale.slice(0, 8).map((s) => s.songId).join(",") : ""));
console.log("cover keys in js/music-covers.js: " + index.songs.length);
