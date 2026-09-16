/* 把浏览器版 eapi-crypto.js 放进 Node，与 node:crypto 参考实现逐字节比对。 */
import crypto from "node:crypto";
import { readFileSync } from "node:fs";

globalThis.window = globalThis;
eval(readFileSync("archive/music-playlists/eapi-crypto.js", "utf8"));
const mine = globalThis.__nightEapi;

const KEY = "e82ckenh8dichen8";
const ref = (url, data) => {
  const text = JSON.stringify(data);
  const digest = crypto.createHash("md5").update("nobody" + url + "use" + text + "md5forencrypt").digest("hex");
  const payload = url + "-36cd479b6b5-" + text + "-36cd479b6b5-" + digest;
  const c = crypto.createCipheriv("aes-128-ecb", Buffer.from(KEY), null);
  return Buffer.concat([c.update(payload, "utf8"), c.final()]).toString("hex").toUpperCase();
};

let ok = true;
for (const s of ["", "a", "abc", "The quick brown fox jumps over the lazy dog",
                 "x".repeat(55), "x".repeat(56), "x".repeat(57), "x".repeat(64), "x".repeat(119), "x".repeat(120),
                 "\u4e2d\u6587\u6d4b\u8bd5\u00b7\ud83c\udfb5"]) {
  const a = mine.md5Hex(s), b = crypto.createHash("md5").update(s, "utf8").digest("hex");
  if (a !== b) { ok = false; console.log("MD5 MISMATCH " + JSON.stringify(s.slice(0, 30)) + "\n  mine " + a + "\n  ref  " + b); }
}
console.log("md5 vectors: " + (ok ? "all match" : "FAILED"));

const cases = [
  ["/api/playlist/create", { name: "N1GHT \u00b7 POP", privacy: "10", type: "NORMAL" }],
  ["/api/playlist/create", { name: "EDM & DANCE", privacy: "0", type: "NORMAL" }],
  ["/api/playlist/manipulate/tracks", { pid: "123", op: "add", trackIds: JSON.stringify(Array.from({ length: 100 }, (_, i) => String(2000000000 + i))) }],
  ["/api/nuser/account/get", {}],
];
let encOk = true;
for (const [url, data] of cases) {
  const a = await mine.params(url, data), b = ref(url, data);
  const same = a === b;
  if (!same) encOk = false;
  console.log((same ? "match  " : "DIFFER ") + url.padEnd(34) + " len " + a.length + (same ? "" : "\n  mine " + a.slice(0, 64) + "\n  ref  " + b.slice(0, 64)));
}
console.log("eapi params: " + (encOk ? "byte-identical to the node:crypto reference" : "FAILED"));
