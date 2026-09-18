# N1GHT CHXN9 → 网易云歌单导入

把站点 **THE ARCHIVE → 音乐** 里的 15 个流派分组，一次性变成你自己网易云账号里的 15 个歌单：
POP 136 首、华语流行 40 首、BALLAD 39 首……合计 496 首，与 `js/music-data.js` 逐首一致。

另外还有一份**语言歌单**脚本（`netease-import-language.js`）：把同样这 496 首横向切成
`N1GHT · 中文`（157 首）与 `N1GHT · ENGLISH`（331 首）。它是账号侧的第二视图，不参与站点渲染。

## 为什么不是「网页里点一下就建好」

建歌单必须带登录态。站点是纯静态页（`file://` 双击打开也能用，没有后端、没有代理），
从页面里直接调 `music.163.com` 会被 CORS 拦掉，而且 `MUSIC_U` 是 HttpOnly，页面也读不到。
所以这一步只能**在网易云自己的页面里跑一次**。跑完之后歌单就永久住在你的账号里，
跟这个站点再没关系。

凭证不经过任何第三方，包括本仓库：脚本一个认证 cookie 都不读，登录态由浏览器自己对同源
请求自动附带。我扒过官方 web bundle，JS 里 `MUSIC_U` 出现 0 次，官方页面自己也不读它。

## 走的是哪条接口（2026-02 实测）

同一个请求在三条路上的返回（`node probe-routes.mjs` 可复现，不需要登录）：

| 路由 | 结果 | 结论 |
| --- | --- | --- |
| `POST /api/…` | 带登录态时 `403 {"message":"illegal request!"}` | 老网页版那条路已经被拒 |
| `POST /weapi/…` | `http 200` + 空响应体 | 这条路由已下线 |
| `POST /eapi/…` | `{"code":301,"message":"系统错误"}` | 正常处理，只差登录 → **走这条** |

`/eapi/` 是官方新版客户端用的加密：把 `nobody<路径>use<JSON>md5forencrypt` 的 MD5 摘要拼进
载荷，再用 AES-128-ECB（key `e82ckenh8dichen8`）加密成 `params` 表单字段。第一版脚本用的是
`/api/` 明文表单，所以撞上了 403。

浏览器里既没有 MD5 也没有 AES-ECB，所以 `eapi-crypto.js` 里两个都自己实现了：
MD5 手写，ECB 用 WebCrypto 的 AES-CBC 逐块做（单块 + 全零 IV 的 CBC 输出前 16 字节就等于
E(block)，外面再补一个 PKCS#7 就是标准 ECB）。`test-eapi-crypto.mjs` 用 node:crypto
逐字节比对过，包括 100 首那批 3264 字符的载荷。

如果哪天 `/eapi/` 也失效了：脚本会自动退回 `/api/` POST 再试一次，并在控制台说明，
不会静默失败。

## 操作（三步）

1. 浏览器打开并登录 <https://music.163.com/>（手机 App 扫码即可，不用输密码）。
2. `F12` 打开 DevTools → **Console** 面板。新版本 Chrome / Edge 会要求先手打一次
   `allow pasting` 回车（防止陌生代码粘贴执行），然后：
3. 打开 `netease-import.js`，**全选、复制、粘贴进 Console、回车**。想建语言歌单就改粘
   `netease-import-language.js`，粘贴方法一模一样（两份脚本都是自足的，粘哪个跑哪个）。

大约 25 秒跑完（建单之间刻意留了间隔，网易云对连续操作会回 405/406「操作太快了」）。
结束时控制台会 `console.table` 列一份结果，并把一段 JSON 用 `copy()` 放进剪贴板：

```json
{ "pop": { "name": "N1GHT · POP", "id": "123456789", "url": "https://music.163.com/#/playlist?id=123456789",
           "want": 136, "added": 136 }, ... }
```

把这段 JSON 发回给助手，就能把「每个流派 → 对应歌单」的直达入口接回站点（**已经接好了**，
见下）。

## 已经接回站点（2026-02）

15 个歌单 id 写在 `js/music-data.js` 每个分组对象的 `playlist` 字段里，`js/music-stage.js` 把它渲染成
组头右端的 `OPEN PLAYLIST`（普通外链，`target="_blank" rel="noopener"`，站点不发任何请求）。
对应关系：

| 分组 | 歌单 | id |
| --- | --- | --- |
| pop | N1GHT · POP | 18388069648 |
| ballad | N1GHT · BALLAD | 18388009980 |
| rock | N1GHT · ROCK | 18388019942 |
| edm-and-dance | N1GHT · EDM & DANCE | 18388056763 |
| randb-and-soul | N1GHT · R&B & SOUL | 18388103475 |
| hip-hop | N1GHT · HIP-HOP | 18388048788 |
| folk-and-country | N1GHT · FOLK & COUNTRY | 18388036786 |
| golden-classics | N1GHT · CLASSICS | 18388086557 |
| mandarin-pop | N1GHT · 华语流行 | 18388058708 |
| mandarin-ballad | N1GHT · 华语抒情 | 18387966149 |
| mandarin-rock | N1GHT · 华语摇滚 | 18388026892 |
| mandarin-hip-hop | N1GHT · 华语说唱 | 18387999065 |
| mandarin-folk | N1GHT · 华语民谣独立 | 18388009986 |
| mandarin-ost | N1GHT · 华语影视原声 | 18388047825 |
| k-pop | N1GHT · K-POP | 18387934353 |

**删掉歌单重新建过之后**：歌单 id 会变，要么把上面那张表的 id 换成新的（同时改 `js/music-data.js`，
并给那个 `<script>` 的 `?v=` +1），要么让 `console-runner.js` 复用同名歌单——脚本按**名字**认歌单，
所以只要歌单名还叫 `N1GHT · POP`，重跑就不会新建第二份。

## 两个语言歌单（账号侧总集，2026-09）

站点按**曲风**分 15 组，语言歌单是横向切的一刀，两者是**同一批歌的两份视图**，同一首会同时躺在
「曲风歌单」和「语言歌单」里——这不是重复数据，`js/music-data.js` 仍然只有一份。

| 歌单 | 内容 | 首数 |
| --- | --- | --- |
| N1GHT · 中文 | `groupLang: "zh"` 的六个华语分组 | 157 |
| N1GHT · ENGLISH | 其余八个英文分组 | 331 |

- **k-pop 的 8 首两边都不进**：它是韩语，既不是中文也不是英文。生成器按 **id** 排除它，不靠
  `groupLang` 猜——`k-pop` 在数据里与英文组同形（都不写 `groupLang`），猜一定会把它算成英文。
- 生成器会把「中文 + 英文 + 韩语」的和与源逐首对账，对不上就拒绝出文件。
- 这两个歌单**不接回站点**：站点那 15 条 `OPEN PLAYLIST` 仍指向曲风歌单，语言歌单只在网易云里用。

## 命名与重复运行

- 歌单名 = `N1GHT · <分组名>`，中文分组用中文名（`N1GHT · 华语流行`），其余用大写英文名
  （`N1GHT · POP`、`N1GHT · K-POP`）。都带 `N1GHT` 前缀，在网易云侧边栏里连成一组。
- **重复运行是安全的**：脚本先按名字找你已有的歌单，同名就直接复用，并且只补进单里缺的歌。
  跑第二遍不会产生第二份歌单，也不会重复加歌。
- **默认建私密歌单**（`privacy: "10"`）。想公开就把 `netease-import.js` 末尾那行的
  `"10"` 改成 `"0"`（只影响新建的那次，已建好的要改得去网易云里改）。
- 想换前缀，就改 `build-import.mjs` 里的 `"N1GHT · "` 后重跑生成脚本；换了前缀等于换了名字，
  旧的歌单不会被复用。

## 失败码对照

| code | 含义 | 怎么办 |
| --- | --- | --- |
| 301 | 登录态失效 | 刷新页面重新登录，重跑（已建好的会跳过） |
| 403 | illegal request，接口拒绝这条请求 | 说明 eapi 也没走通，把控制台输出发回来 |
| 405 / 406 | 操作太快 | 脚本已内置间隔；还出现就多等几分钟再跑 |
| 507 | 创建的歌单数超过上限 | 删掉一些旧歌单再跑 |
| 521 | 该功能需要先绑定手机号 | 网易云账号绑手机号后再跑 |
| 502 | 这些歌已经在歌单里了 | 正常，说明那批不用加 |

## 文件

| 文件 | 作用 |
| --- | --- |
| `read-music-data.mjs` | 解析 `js/music-data.js` 的唯一一份实现，两个 build 脚本共用 |
| `build-import.mjs` | 读分组，把下面三个拼成 `netease-import.js`（15 个曲风歌单） |
| `build-language-import.mjs` | 同样读分组，横向切成中文 / 英文两组，拼成 `netease-import-language.js` |
| `eapi-crypto.js` | eapi 加密：手写 MD5 + 用 AES-CBC 拼出的 AES-ECB |
| `console-runner.js` | 运行器（`window.__nightNeteaseImport`），登录检查、建单、去重、分批加歌 |
| `netease-import.js` | **自动生成，就是你要粘贴的那一份**（曲风歌单），别手改 |
| `netease-import-language.js` | **自动生成**（语言歌单），同样是整份粘贴，别手改 |
| `test-eapi-crypto.mjs` | 把浏览器版加密与 node:crypto 参考实现逐字节比对 |
| `probe-routes.mjs` | 无凭证探测三条路由的返回，用来复核上面那张表 |

```sh
node archive/music-playlists/build-import.mjs             # 重新生成曲风歌单的粘贴文件
node archive/music-playlists/build-language-import.mjs    # 重新生成语言歌单的粘贴文件
node archive/music-playlists/test-eapi-crypto.mjs   # 验证加密实现
node archive/music-playlists/probe-routes.mjs       # 复核接口路由
```

`archive/` 下的东西不参与站点加载，站点里没有任何一行代码引用这里。
