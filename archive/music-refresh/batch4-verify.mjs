/* batch4-verify.mjs — 用 song/detail 复核 batch4 的每一条 top-1：歌名 / 专辑 / 时长 /
 * 歌手是否与截图那一行一致。不一致的列出来，人工（助手）看截图裁决。
 * 同时把 picId 取回来，供封面下载使用。
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const H = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/152.0 Safari/537.36", Referer: "https://music.163.com/" };
const norm = (s) => String(s || "").replace(/[\uFF08\uFF09()\[\]\u3010\u3011\u300A\u300B|/\\,，、.。·:：;；'’"“”!！?？\-_+&~*\s]/g, "").toLowerCase();
const secs = (d) => { const m = /^(\d+):(\d+)$/.exec(d); return m ? (+m[1]) * 60 + (+m[2]) : null; };

const { rows } = JSON.parse(readFileSync(join(HERE, "batch4-search-results.json"), "utf8"));
const picks = rows.map((r) => ({ n: r.n, row: r, id: r.top[0].c.id, score: r.top[0].s.v, why: r.top[0].s.why }));
const ids = picks.map((p) => p.id);
const res = await fetch("https://music.163.com/api/song/detail?ids=" + encodeURIComponent(JSON.stringify(ids)), { headers: H });
const json = await res.json();
const byId = new Map((json.songs || []).map((s) => [String(s.id), s]));

const out = [];
let flagged = 0;
for (const p of picks) {
  const s = byId.get(p.id);
  if (!s) { console.log("MISSING detail for " + p.id + " (" + p.row.title + ")"); continue; }
  const dur = Math.round(s.duration / 1000);
  const want = secs(p.row.dur);
  const dDur = Math.abs(dur - want);
  const albumOk = norm(p.row.album) === norm(s.album.name) || norm(s.album.name).startsWith(norm(p.row.album)) || norm(p.row.album).startsWith(norm(s.album.name));
  const titleOk = norm(p.row.title).startsWith(norm(s.name)) || norm(s.name).startsWith(norm(String(p.row.title).replace(/[（(].*$/, "")));
  const artistOk = s.artists.some((a) => norm(a.name) === norm(p.row.artist.split("/")[0].trim()));
  const bad = [];
  if (!albumOk) bad.push("ALBUM");
  if (dDur > 3) bad.push("DUR" + dDur);
  if (!titleOk) bad.push("TITLE");
  if (!artistOk) bad.push("ARTIST");
  if (bad.length) flagged++;
  out.push({
    n: p.n, id: p.id, score: p.score,
    api: { name: s.name, alia: s.alia, album: s.album.name, albumId: s.album.id, picId: String(s.album.picId), duration: dur, artists: s.artists.map((a) => a.name) },
    shot: { title: p.row.title, artist: p.row.artist, album: p.row.album, dur: p.row.dur },
    flags: bad
  });
  console.log(String(p.n).padStart(2) + (bad.length ? "  !! " + bad.join(",").padEnd(14) : "  ok " + " ".repeat(14)) +
    p.id.padEnd(12) + s.name + " | " + s.artists.map((a) => a.name).join("/") + " | " + s.album.name + " | " + dur + "s");
}
writeFileSync(join(HERE, "batch4-verified.json"), JSON.stringify({ generated: new Date().toISOString(), songs: out }, null, 2) + "\n", "utf8");
console.log("\n" + out.length + " verified, " + flagged + " flagged");
