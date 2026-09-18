/* 生成 archive/music-playlists/netease-import-language.js（两个语言歌单）
 *
 * 站点按曲风分 15 组，这两个歌单是账号侧的横向总集：
 *   N1GHT · 中文      —— music-data.js 里 groupLang: "zh" 的六个华语分组
 *   N1GHT · ENGLISH   —— 其余八个英文分组（k-pop 是韩语，两边都不进，只报数）
 * 同一首歌因此会同时躺在「曲风歌单」和「语言歌单」里：这是两份视图，不是两份数据。
 *
 * 用法：  node archive/music-playlists/build-language-import.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { HERE, readGenres } from "./read-music-data.mjs";

const genres = readGenres();

// k-pop 的 groupLang 缺省（与英文组同形），语言上却是韩语，所以按 id 排除而不是按 groupLang 猜。
const KOREAN = "k-pop";

const chinese = { id: "chinese", name: "N1GHT · 中文", lang: "zh", tracks: [] };
const english = { id: "english", name: "N1GHT · ENGLISH", lang: "en", tracks: [] };
const rest = [];

for (const g of genres) {
  if (!g.tracks.length) {
    console.error("分组 " + g.id + " 一首歌都没解析出来。");
    process.exit(1);
  }
  if (g.groupLang === "zh") chinese.tracks.push(...g.tracks);
  else if (g.id === KOREAN) rest.push({ id: g.id, tracks: g.tracks });
  else english.tracks.push(...g.tracks);
}

const all = genres.reduce((a, g) => a + g.tracks.length, 0);
const sorted = chinese.tracks.length + english.tracks.length + rest.reduce((a, r) => a + r.tracks.length, 0);
if (sorted !== all) {
  console.error("分桶不完整：源 " + all + " 首，分出来 " + sorted + " 首。");
  process.exit(1);
}

const groups = [chinese, english];
const total = groups.reduce((a, g) => a + g.tracks.length, 0);
const crypto = readFileSync(join(HERE, "eapi-crypto.js"), "utf8");
const runner = readFileSync(join(HERE, "console-runner.js"), "utf8");

const header = [
  "/* 自动生成，别手改：改 js/music-data.js 后重跑 build-language-import.mjs。 */",
  "/* 2 个语言歌单 / " + total + " 首（中文 " + chinese.tracks.length + " + 英文 " + english.tracks.length + "）。粘贴方法见同目录 README.md。 */",
  ""
].join("\n");

const call = [
  "",
  "/* ---- 数据 + 启动 ---- */",
  "window.__nightNeteaseImport(" + JSON.stringify(groups, null, 2) + ", {",
  '  privacy: "10"   // "10" 私密 / "0" 公开；改名就只改上面每个 name 的 N1GHT 前缀',
  "});",
  ""
].join("\n");

writeFileSync(join(HERE, "netease-import-language.js"), header + crypto + "\n" + runner + call, "utf8");

console.log("生成 archive/music-playlists/netease-import-language.js");
for (const g of groups) {
  console.log("  " + g.name.padEnd(20) + String(g.tracks.length).padStart(4) + " 首   " + g.id);
}
console.log("  " + "不含（韩语）".padEnd(17) + String(rest.reduce((a, r) => a + r.tracks.length, 0)).padStart(4) + " 首   " + rest.map((r) => r.id).join(", "));
console.log("  " + "源合计".padEnd(19) + String(all).padStart(4) + " 首");
