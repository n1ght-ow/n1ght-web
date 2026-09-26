# Music 区核对 · 第 2 版（D:\fw → night-web）· 未改任何代码

一次性的前期核查产物，不参与站点加载。**结论以 `review.html` 为准**（浏览器打开，图片在旁边的 `review-assets/`）。

## 第 2 版相对第 1 版的变化（按你的反馈）

| 反馈 | 处理 |
| --- | --- |
| 补第 44–58 行 | 用新截图转录 15 首，已并入歌单（第 359 行按你说的不管了） |
| 不要 Right Here Waiting | #215 已从歌单删除 |
| Slow Down 给链接 | 采用 id=**1356658022**（Madnap / Pauline Herr《Slow Down》03:23，与截图一致） |
| 曲风重分 | 改成 **14 组**，删掉空组、修掉误分，见下 |

**歌单现为 447 首。**

## 结论

| 结果 | 数量 |
| --- | --- |
| 音源一致，原样沿用 | **262** |
| 音源不对，要换 ID | **73** |
| 截图有、项目没有，要新增 | **112** |
| 重复 | **4 组**（+2 组同曲异版） |
| 项目有、截图没有（整段替换会删掉） | 441 → 视删除清单而定 |

## 曲风（新版，14 组，无空组）

| 组 | 数量 | 口径 |
| --- | --- | --- |
| 英语 · 流行 POP | 138 | 当代英美国民热单（Taylor Swift《1989》《Lover》《Midnights》、Ed Sheeran、Dua Lipa、Bruno Mars…） |
| 英语 · 抒情 BALLAD | 39 | 慢歌情歌（Adele、Sam Smith、Lewis Capaldi、Shallow…） |
| 英语 · 摇滚 ROCK | 35 | Coldplay、Imagine Dragons、Linkin Park、Queen、Avril、P!nk、OneRepublic |
| 英语 · 电音舞曲 EDM & DANCE | 43 | Alan Walker、Avicii、Martin Garrix、Zedd、Chainsmokers… |
| 英语 · 节奏布鲁斯 R&B & SOUL | 24 | SZA、Doja Cat、Rihanna、Beyoncé、GIVĒON… |
| 英语 · 说唱 HIP-HOP | 27 | Eminem、Kendrick、Drake、2Pac、XXXTENTACION… |
| 英语 · 民谣与乡村 FOLK & COUNTRY | 25 | Jason Mraz、Fool's Garden、Noah Kahan + Taylor Swift《Fearless》《Red》时期 |
| 英语 · 黄金经典 CLASSICS | 6 | The Beatles、Elvis、Westlife |
| 华语 · 流行 | 32 | 林俊杰、邓紫棋、李荣浩、薛之谦、王心凌、张杰、张韶涵、许嵩、告五人、周深 |
| 华语 · 抒情 | 36 | 孙燕姿、王菲、陈奕迅、林俊杰、李荣浩、薛之谦的慢歌 |
| 华语 · 摇滚 | 5 | 逃跑计划、朴树、GALA、万青、陈奕迅《浮夸》 |
| 华语 · 民谣与独立 | 18 | 赵雷、宋冬野、陈粒、李健、毛不易、陈鸿宇、郭顶 |
| 华语 · 影视原声与中国风 | 11 | 那些年、大鱼、卷珠帘、小美满、隐形的翅膀、光年之外、遇见… |
| 韩语 · K-POP | 8 | JISOO、IU、尹美莱 + 韩剧 OST |

第 1 版的问题：华语摇滚 / 华语R&B 是**空的**、华语抒情只剩 1 首、英语流行 138 首独大；Taylor Swift 被拆到流行/乡村/民谣三组；逃跑计划、朴树、GALA、万青被误放进华语流行。新版已修正。

## 音源错在哪（典型）

- `夜空中最亮的星` id=1939557593 实际是「夜空中最亮的星苏添泽」00:15（盗版翻唱碎片）→ 25706282
- `当你` id=108251 是**林俊杰**的翻唱 → 王心凌《闪耀2005》297805
- `唯一`（#82）id=1807799505 是**告五人** → G.E.M.《T.I.M.E.》2083785152
- `安和桥` 在《麻油叶？不叫事儿！》而不是《安和桥北》
- `Hey Jude` 在《Solid Gold Hits, Vol. 17》(07:10) 而不是《Love》(03:58)
- `In the End` 在《00s Rock Anthems》、`Let It Be` 在《不朽的声音》杂锦碟
- Taylor Swift `I Knew You Were Trouble.` / `Shake It Off` 指向单曲，截图是《Red》/《1989 (Deluxe)》
- `Believer` 是 Lil Wayne 混音单曲 → 《Evolve》专辑版 455311479

## 方法（可复核）

1. 32 + 1 张截图逐行转录 → `playlist.json`
2. 按几何裁出每行 54×54 封面 → `covers/<行号>.png`（行距 84px、封面 54px）
3. 网易云 `api/search/get`（POST）取候选，专辑名对不上时再走专辑检索 / 专辑曲目接口补齐
4. 排序键：**专辑名精确 > 专辑名前缀 > 歌名 > 歌手 > 时长（3 秒分桶）> 专辑名长度**
5. 项目专辑名 == 截图专辑名 且时长差 ≤5s → 判定「音源一致」

## 文件

| 文件 | 内容 |
| --- | --- |
| `review.html` | **主产物**，6 节对照表，三图并列（截图封面 / 现状封面 / 建议封面） |
| `music-data.draft.json` | 按曲风分好组的 447 首（跑 `make-draft.js` 生成） |
| `playlist.json` | 截图转录结果 |
| `scored.json` | 每行的候选、评分依据、与项目的对照 |
| `genre-map.json` | 行号 → 曲风组 |
| `covers/` `review-assets/` | 截图裁下的封面 / 页面用图 |
| `duplicates.json` | 重复清单 |
| `*.ps1` `*.js` | 采集与生成脚本，可重跑 |

## 下一步（等你点头再做）

改 `js/music-data.js`（447 首 + 修正 73 条 ID + 新增 112 首）、补 `album-covers/` 新封面、跑 `archive/music-album-covers/index.json` → `js/music-covers.js` 重新生成、同步 `#about-stats` 计数与 `?v=`。
---

# 已落地（第 3 版 · 已改代码）

用户确认后已按此执行：

| 确认项 | 处理 |
| --- | --- |
| 同曲同歌手重复 4 组 | 各留推荐的那一版，删掉 #115 / #119 / #174 / #302 |
| 同曲不同版本 | 留 Nine Track Mind 原曲（#406），删 #403 Remix；留 Evolve 专辑版（#449），删 #131 Lil Wayne 版 |
| Slow Down | 采用用户给的 id=1356658022（同时删掉 Right Here Waiting） |

**最终 441 首 / 14 组。**「同曲同歌手重复」复查为 **0**；另有 4 组同名不同歌（Stay ×2、Stay With Me ×2、Numb ×2、唯一 ×2），都是两首不同的曲子，正常保留。

## 实际改动的文件

| 文件 | 改动 |
| --- | --- |
| `js/music-data.js` | 763 首 / 16 组 → **441 首 / 14 组**，全部 ID 经 song/detail 核实 |
| `js/music-covers.js` | 重新生成，441 首 → 367 个封面文件 |
| `album-covers/` | 新增 134 张；删掉 456 张不再被引用的旧封面（689 → 367） |
| `archive/music-album-covers/index.json` `index.csv` | 重新生成 |
| `index.html` | hero 与 about 的 Songs 计数 763 → 441；`music-data.js`/`music-covers.js` → `?v=2`，`music-stage.js` → `?v=6`，`main.js` → `?v=54` |
| `js/main.js` `js/music-stage.js` | 只改了注释里写死的卡片数（763 → 441、封面文件数） |

未动：CSS、`music-stage.js` 的渲染契约、`main.js` 的搜索/过滤逻辑、其它面板。

## 自检结果

- `music-data.js` / `music-covers.js` 可正常解析；14 组、441 首、ID 无重复、歌名+歌手无重复
- 441 首全部有封面映射，367 个文件全部存在；`album-covers/` 无孤儿文件
- index.html 本地资源 0 个 404（另有两处 `%20` 编码的旧游戏封面，文件名本身带空格，实际存在）
- `photo/` 11 + `photo/full/` 11 配对完整
- 未引入任何外部 CDN；未新增依赖
---

# 第 4 版 · 音乐详情层改版（已落地）

按标注改了四件事：**封面放大**、**身份信息搬到封面正上方**、**按钮搬到封面正下方**、**删掉两个红框里的内容**（封面底部 `NETEASE CLOUD MUSIC` 黑条 + 右侧那句斜体说明）。

| 文件 | 改动 |
| --- | --- |
| `index.html` | `.lb-stage` 内新增 `#lb-music-head`（kicker / title / artist）与 `#lb-music-link`；删掉 `.lb-music-label` |
| `js/main.js` | 音乐分支改写新节点；音乐的 meta 设为 false（不再用右栏）；新增 `lightbox.dataset.detail` 作 CSS 钩子；两个链接共用同一个 deep-link 处理器 |
| `css/style.css` | 封面尺寸改为 min(68vw, 420px, calc(94vh - 310px))；新增音乐列节奏；两个短视口档位 |

## 间距（音乐列自己一套，不再吃 .lb-stage 的统一 gap）

| 关系 | 间距 | 理由 |
| --- | --- | --- |
| eyebrow → 歌名 | 8px（并把 line-height 收到 1.2） | eyebrow 是歌名的标签，贴着读 |
| 歌名 → 歌手 | 12px（同上收 line-height） | 署名是另一件事 |
| 头部 → 封面 | 24px | 同一件作品，靠近 |
| 封面 → 按钮 | 32px | 动作自成一段，也避开金色光晕 |

行高那条很关键：两个 12px mono 行继承 body 的 1.65，上下各多出约 4px；不收的话 8/12 的层次会被行盒抹平。

## 封面尺寸不是拍脑袋

列在 `.lightbox` 里垂直居中，要压过固定的 `.lb-top` 条，只有：

    sleeve ≤ 94vh − 84px（栏 + 上下留白） − 182px（头部 + 间距 + 按钮）

再留约 28px 呼吸，于是写成 `calc(94vh - 310px)`。**窗口高 ≥ 约 780px 时封面就是 420px**，更矮的窗口按这条公式递减，而不是撞上关闭按钮。

无头 Chrome 实测 **26 组视口 × 2 种标题长度（1 行 / 2–3 行）**，全部不重叠，最小「栏 → 说明」文字间距 23px。
短视口两档：`≤720px` 高时头部收紧、标题降一档；`≤560px` 高（横屏手机）整列改为贴着栏下方排布。

`?v=`：style.css 61→62，main.js 54→55。

复现视觉核对：`mkprobe.js` 生成 `probe.html` / `probe-long.html`，`measure.ps1` 量尺寸。

## 2026-09-14：又补 27 首 → 468 首 / 15 组

owner 新加的一批，截图前 27 行几乎全是华语说唱，另有两首影视片尾曲、一首抒情、一首方大同。做法与上一批一致：`new2-rows.tsv`（歌名 / 歌手 / 截图里的专辑 / 截图里的时长）→ `search-new2.ps1` 搜 → `pick-new2.js` 按**专辑名 + 时长 + 歌名**三元组打分 → 逐条与截图对齐 → `new2-details.ps1` 取 `song/detail` 定案（`new2-details.json`）。

- 27 条全部核实：专辑、时长、封面与截图一致。时长的 1 秒差是 API 取整（截图 02:41 / API 02:42 这类）。
- **新增第 15 个流派 `mandarin-hip-hop`（华语说唱，23 首）**。这一批 23 首是说唱，塞进任何现有组都是错的；位置照英语那边的次序放在 `mandarin-rock` 之后。另外 1 首进华语流行（Love Song）、1 首进华语抒情（忘记时间）、2 首进华语影视原声（雨爱、一个人想着一个人）。
- 名称按截图对齐：网易云 `song/detail` 的 `alias` 拼回标题 —— `经济舱 (Vol.Flightin')`、`雨爱（电视剧《海派甜心》片尾曲）`、`一个人想着一个人（电视剧《终极一班2》片尾曲）`；两条 alias 为空但截图带后缀的（`红 (4U)`、`忘记时间（我会好好珍惜没有你的明天）`）按截图写。
- 封面 27 张：26 张新下载 + 1 张复用。其中 **7 张网易云返回的是 PNG**（122–516KB，扩展名却给 `.jpg`），已按库内标准转成 JPEG q82 → 15–54KB。全库 **393 个文件 / 13.5MB**，0 孤儿、0 缺图（`verify-covers2.js`）。
- 计数：441 → **468**，同时改 hero 统计条与 `#about-stats` 的 `data-count`。
- `smoke.js` 的期望值同步到 15 组 / 468 张封面。

`?v=`：`music-data.js` 2→3，`music-covers.js` 2→3。

---

# 2026-09-23：又补 38 首 → 534 首 / 15 组

owner 从「我喜欢的音乐」又截了三张图（38 行）。这一批全程在 node 里跑，四个脚本各自只做一件事：

| 步骤 | 文件 |
| --- | --- |
| 截图逐行转录（歌名 / 歌手 / 截图里的专辑 / 时长） | `batch4-source.json` |
| `cloudsearch/pc` 取 30 条候选，按 **专辑名精确 > 专辑名前缀 > 歌名 > 歌手 > 时长（≤2s 优先）** 打分 | `batch4-resolve.mjs` → `batch4-search-results.json` |
| top-1 经 `song/detail` 复核四项（歌名 / 专辑 / 时长 / 歌手），不一致的标出来 | `batch4-verify.mjs` → `batch4-verified.json` |
| 封面 500px 落盘 + 并进 `archive/music-album-covers/index.json` + 重生成 `js/music-covers.js` | `batch4-covers.mjs` |
| 渲染器自检（15 组 / 534 张 / 0 空 sleeve） | `smoke.js` |

- 38 条 top-1 里 **3 条被 flags 拦下**（row 24 的 ALBUM+TITLE、row 18/21 的 ARTIST），逐条裁图放大复核后全部确认是**转录错、接口对**：row 24 的歌名是 `人上人` 不是「上人上」，row 18/21 的歌手是 `ljz329`（小写 L）不是 `Jjz329`。**截图是唯一真值、接口是唯一裁判**，两边不一致时把那一行裁出来看（`batch4-crops/`，System.Drawing 2–3× 放大）。
- **曲风由助手分**（owner 原话「曲风你自己分」）。英语 10 首：pop 3 / rock 1 / ballad 1 / edm-and-dance 2 / randb-and-soul 1 / hip-hop 2。华语 28 首：华语流行 5 / 华语抒情 8 / 华语说唱 10 / 华语民谣独立 2 / 华语影视原声 2 / 华语摇滚 1。依据是**每组已有的口径**，不是歌手的流派标签：`Whataya Want from Me` 跟着 P!nk 那一版进 rock（同一首歌不拆到两个组）、方大同跟着他自己的 `Love Song` 进华语流行、陈雪凝跟着任然进华语抒情、五月天进只有 5 首的华语摇滚。OST 两条按库内写法用**全角括号**（`偏爱（电视剧《仙剑奇侠传三》插曲）`），短 alias 用半角（`123 (Doremi)`）。
- **12 张封面网易云返回的是 PNG**：扩展名给 `.jpg`，字节头却是 `89504e47`，4 次重试都一样。按库内标准用 System.Drawing 转成 JPEG q85（25–71KB），与 batch3 同一条路。
- **`album-covers/thumbs/` 必须跟着补**：`js/music-stage.js` 画的是 `album-covers/thumbs/<stem>.webp`（160px），不是 500px 那张。新建封面只落 `album-covers/` 而不重跑 `build-images.py --only=albums`，列表里就是 38 个破图。已重跑：417 → **455** 张，4.90 MB → 2.46 MB。
- `smoke.js` 的 shim 补了 `dataset: {}`：`music-stage.js` 学会写 `link.dataset.playlistId` 之后这个 shim 就一直是坏的（与这批无关，顺手修好）；期望值 468 → 534。
- 计数：496 → **534**。`album-covers/` 417 → 455 张；封面映射 534 个键，0 缺失、0 孤儿、0 非 JPEG。

`?v=`：`music-data.js` 6→7，`music-covers.js` 5→6，`music-stage.js` 10→11（只改了注释里的卡片数），`main.js` 79→80（同上）。

歌单：`archive/music-playlists/` 两个生成文件都重跑了（曲风歌单 15 组 / 534 首；语言歌单 185 + 341，韩语 8 首两边都不进）。**站点侧一个字都没改**——粘贴方法与重复运行规则见那份 README；脚本按**名字**复用旧歌单，跑一遍只补缺的那几首。

**2026-09-23 曲风歌单实测（owner 在控制台跑完）**：15 个歌单全部按名字复用，**id 一个都没变**；合计加入 **38 首**，正好等于本批新增的全部（pop 3 / ballad 1 / rock 1 / edm 2 / r&b 1 / hip-hop 2 / 华语流行 5 / 华语抒情 8 / 华语摇滚 1 / 华语说唱 10 / 华语民谣独立 2 / 华语影视原声 2，其余三组 0）。每组回读的 `want` 与 `music-data.js` 的 `tracks.length` 逐组一致（`batch4-run-check.js`）。
**2026-09-23 语言歌单实测**：两个歌单同样按名字复用、id 未变，`added` 分别 **28 / 10**（合计 38 = 本批全部），与跑之前的预期逐位一致。至此「曲风歌单 + 语言歌单 + 站点」三份视图都是 534 首、逐首一致。

