/* batch4-resolve.mjs — 把 batch4-source.json 的 38 行（第 4 批新增）解析成网易云 song id。
 *
 * 口径与 archive/music-refresh/README.md 第 1 版一致：专辑名精确 > 专辑名前缀 > 歌名 > 歌手 >
 * 时长。每一行先取候选（cloudsearch/pc），再按分数排序，人（助手）复核 top-3 后才落库。
 * 只读接口，不需要登录。
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const H = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/152.0 Safari/537.36",
  Referer: "https://music.163.com/",
  "Content-Type": "application/x-www-form-urlencoded"
};

const norm = (s) => String(s || "")
  .replace(/[\uFF08\uFF09()\[\]\u3010\u3011\u300A\u300B\u3008\u3009]/g, " ")
  .replace(/[|/\\,，、.。·:：;；'’"“”!！?？\-_+&~*]/g, " ")
  .replace(/\s+/g, " ")
  .trim()
  .toLowerCase();
const tight = (s) => norm(s).replace(/\s+/g, "");
const stripParen = (s) => String(s).replace(/[（(][^（()）]*[)）]/g, " ").replace(/\s+/g, " ").trim();
const secs = (d) => { const m = /^(\d+):(\d+)$/.exec(d); return m ? (+m[1]) * 60 + (+m[2]) : null; };

async function search(q, limit = 30) {
  const res = await fetch("https://music.163.com/api/cloudsearch/pc", {
    method: "POST", headers: H,
    body: new URLSearchParams({ s: q, type: "1", offset: "0", limit: String(limit), total: "true" }).toString()
  });
  const j = await res.json();
  return ((j.result && j.result.songs) || []).map((s) => ({
    id: String(s.id),
    name: s.name,
    alia: s.alia || [],
    album: s.al ? s.al.name : "",
    albumId: s.al ? s.al.id : 0,
    picId: s.al ? s.al.picId : 0,
    artists: (s.ar || []).map((a) => a.name),
    dur: s.dt
  }));
}

function score(row, c) {
  const st = [];
  let v = 0;
  const target = secs(row.dur);
  const candDur = c.dur ? Math.round(c.dur / 1000) : null;
  const names = [c.name, ...c.alia].map(tight);
  const t = tight(row.title);
  if (names.includes(t)) { v += 40; st.push("title="); }
  else if (names.some((n) => n.startsWith(t) || t.startsWith(n))) { v += 26; st.push("title~"); }
  else if (names.some((n) => n.includes(t))) { v += 14; st.push("title⊃"); }
  else st.push("title!");
  const a = tight(row.album);
  const ca = tight(c.album);
  if (a && a === ca) { v += 50; st.push("album="); }
  else if (a && ca && (ca.startsWith(a) || a.startsWith(ca))) { v += 30; st.push("album~"); }
  else if (a && ca && (ca.includes(a) || a.includes(ca))) { v += 16; st.push("album⊃"); }
  const primary = tight(stripParen(row.artist.split("/")[0]));
  const ars = c.artists.map(tight);
  if (ars.some((x) => x === primary)) { v += 20; st.push("artist="); }
  else if (ars.some((x) => x.includes(primary) || primary.includes(x))) { v += 12; st.push("artist~"); }
  else st.push("artist!");
  if (target != null && candDur != null) {
    const d = Math.abs(target - candDur);
    if (d <= 2) { v += 25; st.push("dur" + d); }
    else if (d <= 5) { v += 15; st.push("dur" + d); }
    else if (d <= 12) { v += 5; st.push("dur" + d); }
    else st.push("dur!" + d);
  }
  return { v, why: st.join(" ") };
}

const src = JSON.parse(readFileSync(join(HERE, "batch4-source.json"), "utf8")).songs;
const out = [];
for (const row of src) {
  const primary = stripParen(row.artist.split("/")[0]);
  const queries = [stripParen(row.title) + " " + primary, row.title + " " + primary, stripParen(row.title)];
  let cands = [];
  for (const q of queries) {
    cands = await search(q);
    if (cands.length) { out.push; break; }
  }
  const ranked = cands.map((c) => ({ c, s: score(row, c) })).sort((x, y) => y.s.v - x.s.v).slice(0, 3);
  out.push({ ...row, query: queries[0], top: ranked });
  const best = ranked[0];
  console.log(String(row.n).padStart(2) + "  " + (best ? String(best.s.v).padStart(3) + "  " + best.s.why.padEnd(38) : "NO MATCH") +
    "  " + row.title + " | " + row.artist);
  for (const r of ranked) {
    console.log("      " + String(r.s.v).padStart(3) + " " + r.s.why.padEnd(38) + "  " + r.c.id + "  " + r.c.name + " | " +
      r.c.artists.join("/") + " | " + r.c.album + " | " + Math.round(r.c.dur / 1000) + "s");
  }
  await new Promise((r) => setTimeout(r, 350));
}
writeFileSync(join(HERE, "batch4-search-results.json"), JSON.stringify({ generated: new Date().toISOString(), rows: out }, null, 2) + "\n", "utf8");
console.log("\nwrote batch4-search-results.json (" + out.length + " rows)");
