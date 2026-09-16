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
