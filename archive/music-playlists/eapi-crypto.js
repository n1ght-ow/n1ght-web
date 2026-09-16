/* N1GHT CHXN9 · 网易云 eapi 加密（浏览器版，零依赖）
 *
 * 为什么是 eapi 而不是 /api/ 或 /weapi/（2026-02 实测，无凭证探测）：
 *   POST /api/playlist/create   → 403 {"message":"illegal request!"}（带登录态时）
 *   POST /weapi/playlist/create → http 200，空响应体（这条路已经不通了）
 *   POST /eapi/playlist/create  → {"code":301,"message":"系统错误"}（= 请求被正常处理，只是没登录）
 * 官方客户端用的就是 eapi：AES-128-ECB 加密一个带 MD5 摘要的载荷，放进 params 表单字段。
 *
 * 浏览器里既没有 MD5 也没有 AES-ECB，所以：
 *   · MD5 自己实现（WebCrypto 不提供）
 *   · ECB 用 WebCrypto 的 AES-CBC 逐块做：单块 + 全零 IV 的 CBC 输出前 16 字节
 *     就等于 E(block)，外面再补一个 PKCS#7 就是标准 ECB。已逐字节比对过 node:crypto。
 */
(function (root) {
  "use strict";

  var EAPI_KEY = "e82ckenh8dichen8";
  var SEP = "-36cd479b6b5-";
  var enc = new TextEncoder();

  var K = new Uint32Array(64);
  for (var i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296);
  var S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
  ];

  function md5Hex(input) {
    var msg = typeof input === "string" ? enc.encode(input) : input;
    var len = msg.length;
    var padded = new Uint8Array((((len + 8) >> 6) + 1) << 6);
    padded.set(msg);
    padded[len] = 0x80;
    var dv = new DataView(padded.buffer);
    var bits = len * 8;
    dv.setUint32(padded.length - 8, bits >>> 0, true);
    dv.setUint32(padded.length - 4, Math.floor(bits / 4294967296), true);

    var a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
    var M = new Uint32Array(16);
    for (var off = 0; off < padded.length; off += 64) {
      for (var j = 0; j < 16; j++) M[j] = dv.getUint32(off + j * 4, true);
      var A = a0, B = b0, C = c0, D = d0, F, g;
      for (var k = 0; k < 64; k++) {
        if (k < 16) { F = (B & C) | (~B & D); g = k; }
        else if (k < 32) { F = (D & B) | (~D & C); g = (5 * k + 1) % 16; }
        else if (k < 48) { F = B ^ C ^ D; g = (3 * k + 5) % 16; }
        else { F = C ^ (B | ~D); g = (7 * k) % 16; }
        F = (F + A + K[k] + M[g]) >>> 0;
        A = D; D = C; C = B;
        B = (B + ((F << S[k]) | (F >>> (32 - S[k])))) >>> 0;
      }
      a0 = (a0 + A) >>> 0; b0 = (b0 + B) >>> 0; c0 = (c0 + C) >>> 0; d0 = (d0 + D) >>> 0;
    }
    var out = new Uint8Array(16), ov = new DataView(out.buffer);
    ov.setUint32(0, a0, true); ov.setUint32(4, b0, true);
    ov.setUint32(8, c0, true); ov.setUint32(12, d0, true);
    var hex = "";
    for (var n = 0; n < 16; n++) hex += out[n].toString(16).padStart(2, "0");
    return hex;
  }

  function pkcs7(bytes) {
    var pad = 16 - (bytes.length % 16);
    var out = new Uint8Array(bytes.length + pad);
    out.set(bytes);
    out.fill(pad, bytes.length);
    return out;
  }

  async function ecbHex(bytes) {
    var key = await crypto.subtle.importKey("raw", enc.encode(EAPI_KEY), "AES-CBC", false, ["encrypt"]);
    var iv = new Uint8Array(16);
    var hex = "";
    for (var off = 0; off < bytes.length; off += 16) {
      var res = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-CBC", iv: iv }, key, bytes.subarray(off, off + 16)));
      for (var i = 0; i < 16; i++) hex += res[i].toString(16).padStart(2, "0");
    }
    return hex.toUpperCase();
  }

  async function params(apiPath, data) {
    var text = JSON.stringify(data);
    var digest = md5Hex("nobody" + apiPath + "use" + text + "md5forencrypt");
    return ecbHex(pkcs7(enc.encode(apiPath + SEP + text + SEP + digest)));
  }

  root.__nightEapi = { md5Hex: md5Hex, pkcs7: pkcs7, ecbHex: ecbHex, params: params, KEY: EAPI_KEY };
})(typeof window !== "undefined" ? window : globalThis);
