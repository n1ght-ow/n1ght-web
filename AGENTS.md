# N1GHT CHXN9 — 项目约定

纯静态个人收藏站：`index.html` 双击即用，无构建、无 npm 运行时依赖。改动必须先读本文件。

## 硬性禁区

- 不增删改 `.venv/`；不修改或删除 `photo/` 原图。新增照片时 `photo/` 与 `photo/full/` 两处都要有文件。
- 不引入外部图床 / CDN，图片、字体全走项目内相对路径（`photo/`、`covers/`、`posters/`、`fonts/`、`logos/`）。运行时外链（IMDb 条目页、网易云歌页 / APP 深链）只做内容跳转，不嵌 iframe、不加载外部资源。
- 不修改 `js/vendor/` 内压缩库；`js/sig-data.js` 是 fontTools 从 GreatVibes 抽取的签名路径数据，机器生成，禁止手写 path。

## 技术约束

- 单页静态：`index.html` + `css/` + `js/`。脚本在 `<body>` 尾部按序加载：vendor（gsap → ScrollTrigger → SplitText → lenis）→ 数据（`sig-data.js` → `film-data.js` → `series-data.js`）→ stage（`film-stage.js` → `series-stage.js`）→ `main.js`。
- 缓存失效：改了哪个带 `?v=N` 的 css/js 就把它的版本号 +1；改数据文件时给对应 `<script>` 补挂 `?v=`。
- GSAP/ScrollTrigger/SplitText/Lenis 走本地 `js/vendor/`，`main.js` 已 `registerPlugin`。Lenis 仅非 REDUCED 启用（`autoRaf:false` + `gsap.ticker` 驱动）；锚点跳转统一走 `lenis.scrollTo`，REDUCED 下回退原生。
- 动效只操作 `transform` / `opacity`（`clip-path: inset()` 幕帘等价允许）；所有 scrub 动画必须 `invalidateOnRefresh: true`，图片加载后调 `ScrollTrigger.refresh()`，加载风暴用 250ms debounce 合并。
- 尊重 `prefers-reduced-motion`：JS `REDUCED` 分支与 CSS 媒体查询都要给静态降级。
- 字体走 `css/fonts.css` 的本地 woff2（latin 子集）；中文内容行加 `lang="zh"`（回退系统字体）。

## 代码结构（新功能照此归属）

- `js/main.js` 站点交互层：preloader（图片计数 + 签名描边进度）、hero 签名、光标徽章、磁吸、`makeHorizontalScroller`（照片 / 游戏共用的横向滚动 + 拖把双向同步）、泡泡场、lightbox、tab 切换、音乐手风琴 + 搜索、网易云 / IMDb 外链、导航高亮 + 滚动进度。
- 签名：`js/sig-data.js` 的 `SIG_DATA` 由 `buildSignature()` 渲染进 `#sig-hero` / `#sig-about`，描边绘制后填充淡入，REDUCED 下直接静态展示。
- 影：`js/film-data.js`（`window.FILM_DATA`，16 部）→ `js/film-stage.js` 渲染进 `#panel-films[data-film-stage="auto"]`；样式在 `css/film-stage.css`。
- 剧：`js/series-data.js`（`window.SERIES_DATA`，19 部）→ `js/series-stage.js` 渲染进 `#panel-series[data-series-stage="auto"]`；样式在 `css/series-stage.css`。
- 影 / 剧条目字段：`{ id, imdb（ttID）, poster: "posters/<ttID>.jpg", title, director / years, year / seasons, genre / category, quote }`；reel 由 range 滑杆经单一 `quickTo` 驱动，海报卡 `data-cursor="OPEN"`、滑杆 `DRAG`、IMDb 按钮 `VIEW`。
- 书、音乐、球队硬编码在 `index.html`；历史调研产物放 `archive/<topic>/`，不参与站点加载。

## 动效准则

- **回应优先于播放**：每区至少一个可感的回应件（hover / click / drag / 滚动速度），纯 fade 或纯 scrub 视差不算。
- **一区一个 signature moment**：只有一个主角动效，其余退为配角。
- 微反馈带物理性格：`back.out` / `elastic.out` / `gsap.quickTo`，不用 linear 硬切。
- 可点元素必有反馈（cursor 变形或磁吸二选一）；文字进场走 mask/transform 遮罩，禁大面积裸 fade。
- 可复用已验收模式：横向 pinned 滚动 + 拖把双向同步（`makeHorizontalScroller`）、泡泡点爆重生（hero 泡泡场）、手风琴互斥展开后 `ScrollTrigger.refresh()`（`initGroupAccordion`）、影 / 剧 reel 舞台（quickTo 驱动）。新动效优先复制这几种。
- 禁止：无输入响应的装饰视差、大面积裸 fade、与内容无关的纯装饰循环。

### 光标徽章（已实现）

由 `main.js` 的 `initCursor()` + `.custom-cursor`（CSS）驱动，按 `data-cursor` 属性取值出徽章，不再手动写死。

- 视觉：`html.has-cursor` 下全局 `cursor: none`；ink 圆点随悬停放大成近黑圆形徽章，`cc-label` 白字大写、`letter-spacing: 0.22em`；进出用 `back.out` 缩放。仅在 FINE_POINTER 且非 REDUCED、非触摸时启用（`TOUCH || !FINE_POINTER || REDUCED` 直接跳过）。
- 现有挂点：`VIEW`（`.hs-card`、影/剧 IMDb 按钮）、`DRAG`（`#hs-wrap`、两条 dragbar-track、`#hof-scroll`、影/剧 range）、`PLAY`（音乐 `.idx-card`）、`OPEN`（影/剧海报卡）、`STAMP`（`.poem-stamp`）。
- 新交互卡片只需挂对应 `data-cursor` 值（`VIEW`/`DRAG`/`OPEN`/`PLAY`/`STAMP`…），无需改 JS/CSS。

## 视觉基调

新粗野主义。`--bg #F4F6F9` / `--bg-deep #E7ECF2` / `--ink #1B2430`，辅助 `--slate` / `--slate-2` / `--ice`。
强调色 `--volt #2B4CFF` / `--punch #FF5C1F` / `--acid #C6F439` 只小面积点缀。硬边 2-3px 描边 + 硬偏移阴影；无圆角滥用、无软阴影、无渐变；禁紫、禁 glow。
文案冷峻克制、中英混排、短句为主。

## 站点结构（改动前核对实际现状）

preloader → hero（`#hero`：签名描边 + 泡泡场，含 TICKER 01）→ PHOTOGRAPHY（`#photo`：横向 pinned 画廊 11 帧 + 拖把双向同步，lightbox 读 `photo/full/`，含 TICKER 02）→ GAME ARCHIVE（`#games`：HOF 7 卡 + 拖把，含 TICKER 03）→ THE ARCHIVE（`#archive`：书 6 / 影 16 / 剧 19 / 音乐 763 首 16 组 / 球队 5，五 tab，含 TICKER 04）→ POEM（`#poem`：STAMP 盖章）→ ABOUT（`#about`：签名 + 统计）→ footer；页面级另有滚动进度条、导航高亮与 lightbox。

## 内容更新

- 摄影：横向区加 `.hs-card`，`photo/<name>.jpg` 与 `photo/full/<name>.jpg` 都放。
- 游戏：GAME/ARCHIVE 区 `hof-item`，封面在 `covers/`。
- 影视：海报放 `posters/<ttID>.jpg`，条目加进 `js/film-data.js` / `js/series-data.js`（`imdb` 字段即 ttID）。
- 音乐：`data-song-id` 必须经网易云接口核实后再挂，**禁止凭记忆填造**；卡片结构 `.genre > .genre-head > .track-index > .artist-row > .artist-tracks > .idx-card[data-song-id][data-cursor="PLAY"]`，增删歌后同步该组 `.genre-count` 的「N 首」。
- 球队：logo 放 `logos/`（svg）。
- 增删任何内容后同步 `#about-stats` 计数（FRAMES / BOOKS / FILMS / SONGS / TEAMS…）。

改完自检：双击可用、无外部 CDN、无新增长帧、reduced-motion 不破布局、引用资源无 404、`?v=` 已递增，提交并推送 `origin/main`。

## 当前欠账（修完即删）

- `.hof-item` 未挂 `data-cursor`（GAME ARCHIVE 卡片悬停暂无光标徽章；`#hof-scroll` 与 `#hof-dragbar-track` 已有 `DRAG`）。
