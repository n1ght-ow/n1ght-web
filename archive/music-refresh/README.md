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
