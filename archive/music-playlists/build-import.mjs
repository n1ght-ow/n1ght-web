/* 生成 archive/music-playlists/netease-import.js
 *
 * 数据源是站点自己的 js/music-data.js，不另抄一份，所以歌单内容永远和站点一致。
 * 用法：  node archive/music-playlists/build-import.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");

const source = readFileSync(join(root, "js", "music-data.js"), "utf8");

const blocks = source.match(/^ {4}\{[\s\S]*?^ {4}\},?$/gm);
if (!blocks || !blocks.length) {
  console.error("解析 js/music-data.js 失败：一个分组都没匹配到。");
  process.exit(1);
}

const field = (text, key) => {
  const m = new RegExp(key + ':\\s*"((?:[^"\\\\]|\\\\.)*)"').exec(text);
  return m ? m[1] : "";
};

const genres = blocks.map((block) => {
  const id = field(block, "id");
  const zh = field(block, "zh");
  const en = field(block, "en");
  const groupLang = field(block, "groupLang");
  const tracks = Array.from(block.matchAll(/\{ id: "(\d+)"/g), (m) => m[1]);
  // 中文分组用中文名，其余用大写英文名；都挂 N1GHT 前缀，在网易云侧边栏里连成一组。
  const label = groupLang === "zh" ? zh : en;
  return { id, name: "N1GHT · " + label, lang: groupLang || "en", tracks };
});

const seen = new Set();
for (const g of genres) {
  if (!g.id || g.name === "N1GHT · " || seen.has(g.name)) {
    console.error("分组解析异常：" + JSON.stringify({ id: g.id, name: g.name }));
    process.exit(1);
  }
  if (!g.tracks.length) {
    console.error("分组 " + g.id + " 一首歌都没解析出来。");
    process.exit(1);
  }
  seen.add(g.name);
}

const total = genres.reduce((a, g) => a + g.tracks.length, 0);
const crypto = readFileSync(join(here, "eapi-crypto.js"), "utf8");
const runner = readFileSync(join(here, "console-runner.js"), "utf8");

const header = [
  "/* 自动生成，别手改：改 js/music-data.js 后重跑 build-import.mjs。 */",
  "/* " + genres.length + " 个分组 / " + total + " 首。粘贴方法见同目录 README.md。 */",
  ""
].join("\n");

const call = [
  "",
  "/* ---- 数据 + 启动 ---- */",
  "window.__nightNeteaseImport(" + JSON.stringify(genres, null, 2) + ", {",
  '  privacy: "10"   // "10" 私密 / "0" 公开；改名就只改上面每个 name 的 N1GHT 前缀',
  "});",
  ""
].join("\n");

writeFileSync(join(here, "netease-import.js"), header + crypto + "\n" + runner + call, "utf8");

console.log("生成 archive/music-playlists/netease-import.js");
for (const g of genres) {
  console.log("  " + g.name.padEnd(28) + String(g.tracks.length).padStart(4) + " 首   " + g.id);
}
console.log("  " + "合计".padEnd(26) + String(total).padStart(4) + " 首");
