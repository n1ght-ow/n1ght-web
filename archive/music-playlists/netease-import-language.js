/* 自动生成，别手改：改 js/music-data.js 后重跑 build-language-import.mjs。 */
/* 2 个语言歌单 / 488 首（中文 157 + 英文 331）。粘贴方法见同目录 README.md。 */
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

/* N1GHT CHXN9 · 网易云歌单导入 · 控制台运行器
 *
 * 这个文件本身不执行任何东西。它在 window 上挂一个 __nightNeteaseImport()，
 * 由同目录的 netease-import.js（build-import.mjs 拼出来）带上歌单数据调用它。
 *
 * 为什么必须在 music.163.com 的控制台里跑：
 *   1. 建歌单要登录态，MUSIC_U 是 HttpOnly，脚本读不到也不需要读；
 *      同源 fetch 会自动带上它，凭证从不离开浏览器。
 *   2. 站点是纯静态页，从 file:// 或任意域名调 music.163.com 会被 CORS 拦掉。
 *
 * 走哪条路（2026-02 实测）：
 *   写操作走 /eapi/（AES-ECB + MD5 摘要，见 eapi-crypto.js）。
 *   读操作（账号、我的歌单、歌单详情）走 /api/ GET 即可。
 *   2026-02 之前那一版走 /api/ POST，现在会回 403 {"message":"illegal request!"}，
 *   所以保留它只作为 eapi 不被接受时的自动退路。
 */
window.__nightNeteaseImport = async function (GENRES, OPTIONS) {
  "use strict";

  var OPTS = Object.assign({
    privacy: "10",     // "10" = 私密（默认），"0" = 公开
    batch: 100,        // 每次提交的歌曲数
    createGap: 900,    // 两次建单间隔，网易云会以 405/406「操作太快」拒绝
    batchGap: 500,
    dryRun: false
  }, OPTIONS || {});

  var E = window.__nightEapi;
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var say = function () {
    console.log.apply(console, ["%c[N1GHT]", "color:#9a7b2e;font-weight:500"].concat(Array.prototype.slice.call(arguments)));
  };

  if (location.hostname !== "music.163.com") {
    console.error("[N1GHT] 请先打开并登录 https://music.163.com/ ，再在这个页面的控制台里粘贴脚本。");
    return null;
  }
  if (!E || !E.params) {
    console.error("[N1GHT] 缺 eapi-crypto.js。请粘贴完整的 netease-import.js（它是 加密 + 运行器 + 数据 拼起来的）。");
    return null;
  }

  var cookie = function (name) {
    var m = new RegExp("(?:^|;\\s*)" + name + "=([^;]*)").exec(document.cookie || "");
    if (!m) return "";
    try { return decodeURIComponent(m[1]); } catch (e) { return m[1]; }
  };
  var csrf = cookie("__csrf");
  var withCsrf = function (data) { return csrf ? Object.assign({}, data, { csrf_token: csrf }) : data; };

  var postForm = async function (path, body) {
    var res = await fetch(path, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(body).toString()
    });
    var text = await res.text();
    try { return JSON.parse(text); } catch (e) { return { code: -1, message: "空响应或非 JSON（http " + res.status + "）" }; }
  };
  var readJson = async function (path) {
    var res = await fetch(path, { credentials: "include" });
    var text = await res.text();
    try { return JSON.parse(text); } catch (e) { return { code: -1, message: "空响应（http " + res.status + "）" }; }
  };

  var transport = null;   // 记住哪条路能走通，后面 14 组不再试错
  var write = async function (path, data) {
    var r;
    if (transport !== "api") {
      r = await postForm("/eapi/" + path, { params: await E.params("/api/" + path, withCsrf(data)) });
      if (r.code !== -1 && r.code !== 403) { transport = "eapi"; return r; }
      console.warn("[N1GHT] /eapi/" + path + " 没被接受（" + (r.message || r.code) + "），退回 /api/ POST 试一次。");
    }
    r = await postForm("/api/" + path, withCsrf(data));
    if (r.code !== -1 && r.code !== 403) transport = "api";
    return r;
  };

  var CODE = {
    301: "登录状态失效，刷新页面重新登录",
    400: "请求参数错误",
    403: "illegal request：接口拒绝了这条请求",
    404: "歌单不存在",
    405: "操作太快了",
    406: "操作太快了",
    502: "这些歌已经在歌单里了",
    505: "歌单已满（1000 首）",
    507: "创建的歌单数量超过上限",
    521: "该功能需要先绑定手机号"
  };
  var why = function (r) {
    var c = r && r.code;
    return (c != null ? c + " " : "") + (CODE[c] || (r && r.message) || JSON.stringify(r));
  };

  var me = await readJson("/api/nuser/account/get");
  var profile = me && me.profile;
  if (!profile) {
    console.error("[N1GHT] 没读到登录状态。确认这个标签页是已登录的 music.163.com，然后重跑一次。");
    return null;
  }
  say("登录账号：" + profile.nickname + "（uid " + profile.userId + "）");
  say("环境：" + location.href.slice(0, 48) + " · __csrf " + (csrf ? "可读" : "读不到（不影响 eapi）"));

  var mine = await readJson("/api/user/playlist?uid=" + profile.userId + "&offset=0&limit=1000");
  var byName = {};
  ((mine && mine.playlist) || []).forEach(function (p) { byName[p.name] = p; });
  say("账号里已有 " + Object.keys(byName).length + " 个歌单，本次处理 " + GENRES.length + " 组，共 " +
      GENRES.reduce(function (a, g) { return a + g.tracks.length; }, 0) + " 首。");

  var result = {};
  for (var gi = 0; gi < GENRES.length; gi++) {
    var g = GENRES[gi], tag = "(" + (gi + 1) + "/" + GENRES.length + ")";
    var pl = byName[g.name];
    var created = false;

    if (pl) {
      say(tag + " 已存在「" + g.name + "」id " + pl.id + "，只补缺歌");
    } else if (OPTS.dryRun) {
      say(tag + " [dry-run] 会新建「" + g.name + "」并加入 " + g.tracks.length + " 首");
      result[g.id] = { name: g.name, id: null, want: g.tracks.length, added: 0, dryRun: true };
      continue;
    } else {
      var c = await write("playlist/create", { name: g.name, privacy: String(OPTS.privacy), type: "NORMAL" });
      if (!c || !c.playlist || !c.playlist.id) {
        console.error("[N1GHT] " + tag + " 建单失败：" + why(c) + "（走的是 " + transport + "）");
        result[g.id] = { name: g.name, id: null, error: c && c.code };
        if (c && (c.code === 521 || c.code === 507 || c.code === 301)) {
          console.error("[N1GHT] 这类错误重试也没用，已停止。修好之后再跑一次，已建好的会自动跳过。");
          break;
        }
        await sleep(OPTS.createGap);
        continue;
      }
      pl = c.playlist;
      byName[g.name] = pl;
      created = true;
      say(tag + " 新建「" + g.name + "」id " + pl.id);
      await sleep(OPTS.createGap);
    }

    var have = {};
    if (!created) {
      var d = await readJson("/api/v6/playlist/detail?id=" + pl.id + "&n=1000");
      var raw = (d && d.playlist && (d.playlist.trackIds || d.playlist.tracks)) || [];
      raw.forEach(function (t) { have[String(t && t.id != null ? t.id : t)] = true; });
    }
    var todo = g.tracks.filter(function (id) { return !have[String(id)]; });

    if (!todo.length) say("    没有缺歌，跳过");
    var added = 0;
    for (var i = 0; i < todo.length; i += OPTS.batch) {
      var chunk = todo.slice(i, i + OPTS.batch);
      if (OPTS.dryRun) { added += chunk.length; continue; }
      var r = await write("playlist/manipulate/tracks", {
        pid: String(pl.id), op: "add", trackIds: JSON.stringify(chunk), imme: "true"
      });
      if (r && r.code === 200) added += chunk.length;
      else console.warn("[N1GHT] " + tag + " 这批 " + chunk.length + " 首有异常：" + why(r));
      say("    已提交 " + Math.min(i + OPTS.batch, todo.length) + " / " + todo.length);
      await sleep(OPTS.batchGap);
    }
    result[g.id] = {
      name: g.name,
      id: String(pl.id),
      url: "https://music.163.com/#/playlist?id=" + pl.id,
      want: g.tracks.length,
      added: added
    };
  }

  console.table(Object.keys(result).map(function (k) {
    var r = result[k];
    return { 分组: k, 歌单: r.name, id: r.id, 应有: r.want, 本次加入: r.added, 错误: r.error || "" };
  }));
  var payload = JSON.stringify(result, null, 2);
  console.log(payload);
  try {
    copy(payload);
    say("上面的 JSON 已经复制到剪贴板，把它发回给助手就能接上站点入口。");
  } catch (e) {
    say("（copy() 只在 DevTools 控制台里可用；手动把上面的 JSON 复制下来即可。）");
  }
  return result;
};

/* ---- 数据 + 启动 ---- */
window.__nightNeteaseImport([
  {
    "id": "chinese",
    "name": "N1GHT · 中文",
    "lang": "zh",
    "tracks": [
      "1966162185",
      "297839",
      "297805",
      "1465225532",
      "108795",
      "191254",
      "139808",
      "25640392",
      "1410647903",
      "1368754688",
      "1807799505",
      "1959667345",
      "167827",
      "411214279",
      "574921549",
      "518686034",
      "407450223",
      "27678655",
      "1407551413",
      "27731176",
      "31654343",
      "1409382131",
      "1484967131",
      "1412264550",
      "1970560265",
      "29848657",
      "36270426",
      "36024806",
      "1405283464",
      "2083785152",
      "1901371647",
      "108914",
      "82360",
      "354750",
      "150563",
      "150422",
      "22200079",
      "174944",
      "174963",
      "174956",
      "165026",
      "254574",
      "28059417",
      "326990",
      "27955653",
      "169185",
      "1463165983",
      "32507038",
      "2600493765",
      "1293886117",
      "1330348068",
      "28949444",
      "233931",
      "1299550532",
      "30612793",
      "287719",
      "287083",
      "287063",
      "287398",
      "298838",
      "29713754",
      "299936",
      "64317",
      "66842",
      "409931770",
      "65528",
      "65536",
      "64093",
      "65766",
      "65800",
      "108242",
      "26305547",
      "25727803",
      "29814898",
      "2041026502",
      "108485",
      "2124115505",
      "1984475097",
      "3387477661",
      "493735012",
      "41656275",
      "25706282",
      "139357",
      "355992",
      "386844",
      "66282",
      "1918576268",
      "1396141677",
      "2054300084",
      "2045943936",
      "1965928052",
      "1336856498",
      "444323757",
      "1969908030",
      "2071177415",
      "1456890009",
      "2054298885",
      "1383954630",
      "1492049185",
      "454966913",
      "1325896303",
      "31260611",
      "534542490",
      "1488796175",
      "490595927",
      "528326686",
      "1355896807",
      "1459232593",
      "518725853",
      "1962349055",
      "2677400220",
      "2080196564",
      "2677396501",
      "2075593054",
      "2633757005",
      "3432123420",
      "2023954033",
      "3404950706",
      "441491828",
      "436346833",
      "30431366",
      "1363948882",
      "31445772",
      "421423806",
      "202373",
      "447926067",
      "436514312",
      "1974443814",
      "27646198",
      "27646199",
      "27646205",
      "110215",
      "109998",
      "569214250",
      "569200213",
      "569213220",
      "97357",
      "482999696",
      "28754846",
      "516823132",
      "2124381474",
      "327115",
      "449818741",
      "454828887",
      "548556869",
      "26207292",
      "66823",
      "316100",
      "25714102",
      "209936",
      "28387594",
      "95843",
      "176999",
      "165340",
      "344418",
      "108478",
      "208902"
    ]
  },
  {
    "id": "english",
    "name": "N1GHT · ENGLISH",
    "lang": "en",
    "tracks": [
      "24197361",
      "1975505546",
      "2065100111",
      "1355147933",
      "2080331573",
      "2637558926",
      "2057234990",
      "2117911937",
      "494865824",
      "25657282",
      "29803675",
      "3406580",
      "3406393",
      "458697629",
      "1373168742",
      "1364343491",
      "405599119",
      "16593589",
      "26243686",
      "504265014",
      "2188283",
      "16434100",
      "21373645",
      "21038711",
      "1386002735",
      "18981962",
      "29719175",
      "27896574",
      "415904452",
      "36921365",
      "1830422741",
      "27514868",
      "433681259",
      "441120471",
      "1876212794",
      "1855475139",
      "28692519",
      "2126654120",
      "2097627772",
      "2031003572",
      "400876320",
      "564000295",
      "479223413",
      "1374329431",
      "36990266",
      "1338098071",
      "39224884",
      "28306668",
      "27698223",
      "1958557540",
      "1846473650",
      "2080218767",
      "2144901835",
      "1948618489",
      "1407951508",
      "1404228064",
      "1432456852",
      "1406633327",
      "2014200813",
      "1418953604",
      "1433934518",
      "1400110511",
      "1990192689",
      "516818336",
      "1990192725",
      "1990192694",
      "17753288",
      "30841076",
      "509728806",
      "2050561748",
      "21157332",
      "1981056341",
      "2065100107",
      "17112299",
      "410846246",
      "21038723",
      "1964236604",
      "2689018742",
      "445867332",
      "2154851107",
      "1948620191",
      "2154850334",
      "2617944302",
      "21253806",
      "28661564",
      "21253966",
      "36496695",
      "1859245776",
      "35847559",
      "4172700",
      "29019227",
      "33728982",
      "27566922",
      "2871217",
      "18637990",
      "18638057",
      "451703096",
      "22441762",
      "29747526",
      "28756834",
      "34072434",
      "5093684",
      "473817398",
      "473602620",
      "401249910",
      "29572512",
      "29572511",
      "29572510",
      "29572509",
      "29572507",
      "29572506",
      "29572505",
      "29572504",
      "29561033",
      "29572503",
      "29498911",
      "29572502",
      "29572501",
      "29561031",
      "1382781566",
      "1382790037",
      "1382781549",
      "1382781546",
      "1382778973",
      "1382781502",
      "1382781478",
      "1382781444",
      "1382778878",
      "1382781417",
      "1382781399",
      "1382781397",
      "1382778829",
      "1382781100",
      "1382778514",
      "1382576173",
      "1382572453",
      "19558690",
      "21730832",
      "26505362",
      "17177277",
      "1409093519",
      "16435050",
      "5159010",
      "563586080",
      "5054926",
      "1313096578",
      "1374446646",
      "26608879",
      "28531849",
      "28208046",
      "16435064",
      "1350601781",
      "504492140",
      "28586064",
      "18161816",
      "25706371",
      "429528027",
      "1404805139",
      "36841428",
      "2117009",
      "1887190390",
      "25657241",
      "25657236",
      "1323911406",
      "28680438",
      "2411634",
      "35847388",
      "36841427",
      "460043703",
      "27556211",
      "25657274",
      "16232697",
      "402073823",
      "16435049",
      "29966565",
      "27697195",
      "3225999",
      "2103580032",
      "16431842",
      "16432052",
      "16431880",
      "25657526",
      "20200923",
      "3427383631",
      "1313303916",
      "16686599",
      "460043748",
      "460043753",
      "1927389937",
      "17177367",
      "17177380",
      "28528999",
      "3986017",
      "1869271",
      "31789010",
      "27896565",
      "27896566",
      "3370511577",
      "3392742809",
      "1349964388",
      "26060065",
      "4224657",
      "17177324",
      "21373918",
      "415126537",
      "27515086",
      "26569168",
      "455311479",
      "21407207",
      "29534449",
      "1480204501",
      "3406918",
      "29771432",
      "2011072415",
      "419594258",
      "29947420",
      "436487129",
      "506092035",
      "515453363",
      "444269135",
      "531051690",
      "461518855",
      "19902364",
      "453185808",
      "402070862",
      "497218032",
      "26496942",
      "456175020",
      "423227295",
      "549800783",
      "443242",
      "16963280",
      "27713921",
      "29771146",
      "27713920",
      "439076364",
      "2150087691",
      "447925342",
      "500410102",
      "1952112969",
      "1842927464",
      "1356658022",
      "480426313",
      "423228325",
      "17706562",
      "515269424",
      "411314681",
      "3313334",
      "461347998",
      "34228719",
      "21562994",
      "2066953372",
      "426194883",
      "2752219406",
      "1424400870",
      "2052348113",
      "2058139099",
      "1938344407",
      "514172235",
      "1824927085",
      "1401302504",
      "1964208608",
      "2004563422",
      "1806905006",
      "2004563430",
      "27158959",
      "28718313",
      "19550042",
      "2004562490",
      "21563094",
      "1830419924",
      "21563184",
      "16435051",
      "29722263",
      "5103312",
      "17405587",
      "545350938",
      "501133798",
      "501133800",
      "545350935",
      "1312062100",
      "469104548",
      "2152805690",
      "16648232",
      "1862710350",
      "1373172794",
      "409031076",
      "555974038",
      "1318733599",
      "27853227",
      "1299818",
      "17572422",
      "5052317",
      "531777461",
      "1444959590",
      "426026646",
      "5100769",
      "1297841",
      "27902187",
      "17793698",
      "30953009",
      "1989318036",
      "1874585362",
      "27646851",
      "18611643",
      "27759600",
      "28859948",
      "4433364",
      "17858810",
      "460043708",
      "1496764168",
      "460043704",
      "28157586",
      "19292984",
      "19292982",
      "19292813",
      "19292812",
      "19292807",
      "25787222",
      "19292805",
      "19292804",
      "25787219",
      "19292802",
      "19292800",
      "19292799",
      "4336098",
      "4337372",
      "4331344",
      "20707713",
      "2080607",
      "1470274244"
    ]
  }
], {
  privacy: "10"   // "10" 私密 / "0" 公开；改名就只改上面每个 name 的 N1GHT 前缀
});
