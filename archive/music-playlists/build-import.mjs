/* 生成 archive/music-playlists/netease-import.js —— 账号侧的**全部**歌单，一次粘贴跑完。
 *
 * 17 个歌单 = 15 个曲风歌单（站点 THE ARCHIVE → 音乐 的每个分组各一个）
 *           +  2 个语言歌单（横向总集：N1GHT · 中文 / N1GHT · ENGLISH）。
 *
 * 为什么合成一份：曲风与语言是**同一批歌的两份视图**，同一首歌必须同时躺在两处。
 * 分成两个文件就会漏跑 —— 2026-09-23 那次就只跑了曲风歌单，owner 因此要粘两次。
 * 运行器 __nightNeteaseImport(分组, 选项) 本来就只吃一个数组，所以合并不需要改它。
 *
 * 数据源永远是站点自己的 js/music-data.js，不另抄一份，所以歌单内容不会和站点分叉。
 * 用法：  node archive/music-playlists/build-import.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { HERE, readGenres } from "./read-music-data.mjs";

const genres = readGenres();

// k-pop 的 groupLang 缺省（与英文组同形），语言上却是韩语，所以按 id 排除而不是按 groupLang 猜。
const KOREAN = "k-pop";

// --- 15 个曲风歌单：中文分组用中文名，其余用大写英文名；都挂 N1GHT 前缀，在侧边栏里连成一组 ---
const byGenre = genres.map((g) => ({
  id: g.id,
  name: "N1GHT · " + (g.groupLang === "zh" ? g.zh : g.en),
  lang: g.groupLang || "en",
  tracks: g.tracks
}));

// --- 2 个语言歌单：同样这批歌横向切一刀 ---
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

const groups = byGenre.concat([chinese, english]);

// 断言一：曲风歌单的名字唯一且非空（名字就是运行器认歌单的唯一凭据）。
const seen = new Set();
for (const g of groups) {
  if (!g.id || g.name === "N1GHT · " || seen.has(g.name)) {
    console.error("分组解析异常：" + JSON.stringify({ id: g.id, name: g.name }));
    process.exit(1);
  }
  seen.add(g.name);
}

// 断言二：语言歌单对源不重不漏。k-pop 是韩语，两边都不进，只报数。
// 这一条是「加歌必须两处都进」的机械保证：分桶对不上就拒绝出文件。
const total = genres.reduce((a, g) => a + g.tracks.length, 0);
const sorted = chinese.tracks.length + english.tracks.length + rest.reduce((a, r) => a + r.tracks.length, 0);
if (sorted !== total) {
  console.error("分桶不完整：源 " + total + " 首，分出来 " + sorted + " 首。");
  process.exit(1);
}

const all = groups.reduce((a, g) => a + g.tracks.length, 0);
const korean = rest.reduce((a, r) => a + r.tracks.length, 0);
const crypto = readFileSync(join(HERE, "eapi-crypto.js"), "utf8");
const runner = readFileSync(join(HERE, "console-runner.js"), "utf8");

const header = [
  "/* 自动生成，别手改：改 js/music-data.js 后重跑 build-import.mjs。 */",
  "/* " + groups.length + " 个歌单 / " + all + " 首 = 15 曲风 + 中文 " + chinese.tracks.length +
    " + 英文 " + english.tracks.length + "（韩语 " + korean + " 首只进曲风歌单）。 */",
  "/* 粘这一份就够：曲风与语言一起跑。粘贴方法见同目录 README.md。 */",
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

writeFileSync(join(HERE, "netease-import.js"), header + crypto + "\n" + runner + call, "utf8");

console.log("生成 archive/music-playlists/netease-import.js");
for (const g of byGenre) console.log("  [曲风] " + g.name.padEnd(22) + String(g.tracks.length).padStart(4) + " 首   " + g.id);
for (const g of [chinese, english]) console.log("  [语言] " + g.name.padEnd(22) + String(g.tracks.length).padStart(4) + " 首   " + g.id);
console.log("  " + "不含（韩语）".padEnd(24) + String(korean).padStart(4) + " 首   只进 " + rest.map((r) => r.id).join(", ") + " 的曲风歌单");
console.log("  " + "源合计".padEnd(26) + String(total).padStart(4) + " 首 / " + groups.length + " 个歌单");
