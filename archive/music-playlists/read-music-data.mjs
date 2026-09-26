/* 读 js/music-data.js 的分组（build-import.mjs 的唯一一份解析）。
 *
 * 数据源永远是站点自己的 js/music-data.js，不另抄一份，所以歌单内容不会和站点分叉。
 * 返回 [{ id, zh, en, groupLang, tracks: [songId, ...] }]，顺序与文件一致。
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(HERE, "..", "..");

export function readGenres() {
  const source = readFileSync(join(ROOT, "js", "music-data.js"), "utf8");

  const blocks = source.match(/^ {4}\{[\s\S]*?^ {4}\},?$/gm);
  if (!blocks || !blocks.length) {
    console.error("解析 js/music-data.js 失败：一个分组都没匹配到。");
    process.exit(1);
  }

  const field = (text, key) => {
    const m = new RegExp(key + ':\\s*"((?:[^"\\\\]|\\\\.)*)"').exec(text);
    return m ? m[1] : "";
  };

  return blocks.map((block) => ({
    id: field(block, "id"),
    zh: field(block, "zh"),
    en: field(block, "en"),
    groupLang: field(block, "groupLang"),
    tracks: Array.from(block.matchAll(/\{ id: "(\d+)"/g), (m) => m[1])
  }));
}
