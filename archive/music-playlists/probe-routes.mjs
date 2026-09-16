/* 无凭证探测：同一件事在三条路由上的返回，用来判定该走哪条（2026-02 实测结论见 README）。
   用法： node archive/music-playlists/probe-routes.mjs */
import crypto from "node:crypto";

const EAPI_KEY = "e82ckenh8dichen8";
const AES_KEY = "0CoJUm6Qyw8W8jud";
const IV = Buffer.from("0102030405060708", "utf8");
const MOD = "e0b509f6259df8642dbc35662901477df22677ec152b5ff68ace615bb7b7251523ab17a876aea8a5aa76d2e417629ec4ee341f56135fccf695280104e0312ecbda92557c93870114af6c9d05c4f7f0c3685b7a46bee255932575cce10b424d813cfe4875d3e82047b97ddef52741d546b8e289dc6935b3ece0462db0a22b8e7";
const CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

const aes = (text, key) => {
  const c = crypto.createCipheriv("aes-128-cbc", Buffer.from(key, "utf8"), IV);
  return Buffer.concat([c.update(text, "utf8"), c.final()]).toString("base64");
};
const rsaHex = (text) => {
  let m = 0n;
  for (const b of Buffer.from(text, "utf8")) m = (m << 8n) | BigInt(b);
  const n = BigInt("0x" + MOD);
  let c = 1n, base = m % n, exp = 65537n;
  while (exp > 0n) { if (exp & 1n) c = (c * base) % n; base = (base * base) % n; exp >>= 1n; }
  return c.toString(16).padStart(256, "0");
};
const weapi = (data) => {
  let secret = "";
  for (let i = 0; i < 16; i++) secret += CHARS[Math.floor(Math.random() * CHARS.length)];
  return { params: aes(aes(JSON.stringify(data), AES_KEY), secret), encSecKey: rsaHex(secret.split("").reverse().join("")) };
};
const eapi = (path, data) => {
  const text = JSON.stringify(data);
  const digest = crypto.createHash("md5").update("nobody" + path + "use" + text + "md5forencrypt").digest("hex");
  const c = crypto.createCipheriv("aes-128-ecb", Buffer.from(EAPI_KEY), null);
  return { params: Buffer.concat([c.update(path + "-36cd479b6b5-" + text + "-36cd479b6b5-" + digest, "utf8"), c.final()]).toString("hex").toUpperCase() };
};

const H = { "User-Agent": "Mozilla/5.0", Referer: "https://music.163.com/", "Content-Type": "application/x-www-form-urlencoded" };
const hit = async (url, body) => {
  const r = await fetch(url, { method: "POST", headers: H, body: new URLSearchParams(body).toString() });
  const t = await r.text();
  return "http " + r.status + "  " + (t ? t.slice(0, 78) : "<<EMPTY>>");
};

const jobs = [
  ["search/get   /api", "/api/search/get", { s: "APT.", type: 1, limit: 2, offset: 0 }, "api"],
  ["search/get   /weapi", "/weapi/search/get", { s: "APT.", type: 1, limit: 2, offset: 0 }, "weapi"],
  ["search/get   /eapi", "/eapi/search/get", { s: "APT.", type: 1, limit: 2, offset: 0 }, "eapi"],
  ["create       /api", "/api/playlist/create", { name: "probe", privacy: "10", type: "NORMAL" }, "api"],
  ["create       /weapi", "/weapi/playlist/create", { name: "probe", privacy: "10", type: "NORMAL" }, "weapi"],
  ["create       /eapi", "/eapi/playlist/create", { name: "probe", privacy: "10", type: "NORMAL" }, "eapi"],
];
for (const [label, path, data, kind] of jobs) {
  const body = kind === "weapi" ? weapi(data) : kind === "eapi" ? eapi(path.replace("/eapi", "/api"), data) : data;
  console.log(label.padEnd(24) + await hit("https://music.163.com" + path, body));
}
console.log("\n301 = 路由正常、只差登录（带 cookie 就能建单）；403 illegal request = 这条路被拒；<<EMPTY>> = 这条路由已下线。");
