# N1GHT CHXN9 — 项目约定

纯静态个人收藏站：`index.html` 双击即用，无构建、无 npm 运行时依赖。改动必须先读本文件。

## 硬性禁区

- 不增删改 `.venv/`；不修改或删除 `photo/` 原图。新增照片时 `photo/` 与 `photo/full/` 两处都要有文件。
- 不引入外部图床 / CDN，图片、字体全走项目内相对路径（`photo/`、`covers/`、`posters/`、`fonts/`、`logos/`）。

## 技术约束

- 单页静态：`index.html` + `css/` + `js/`，脚本在 `<body>` 尾部按顺序 `<script>` 加载。
- GSAP/ScrollTrigger/SplitText/Lenis 用本地 `js/vendor/`，`main.js` 已 `registerPlugin` 并配 Lenis。
- 动效只操作 `transform` / `opacity`（`clip-path: inset()` 幕帘等价允许）；所有 scrub 动画必须 `invalidateOnRefresh: true`，图片加载后调 `ScrollTrigger.refresh()`。
- 尊重 `prefers-reduced-motion`：JS `REDUCED` 分支与 CSS 媒体查询都要给静态降级。
- 字体走 `css/fonts.css` 的本地 woff2。

## 动效准则

- **回应优先于播放**：每区至少一个可感的回应件（hover / click / drag / 滚动速度），纯 fade 或纯 scrub 视差不算。
- **一区一个 signature moment**：只有一个主角动效，其余退为配角。
- 微反馈带物理性格：`back.out` / `elastic.out` / `gsap.quickTo`，不用 linear 硬切。
- 可点元素必有反馈（cursor 变形或磁吸二选一）；文字进场走 mask/transform 遮罩，禁大面积裸 fade。
- 可复用已验收模式：抽屉互斥展开后 `ScrollTrigger.refresh()`、横向 pinned 滚动 + 拖把双向同步、泡泡点爆重生。新动效优先复制这几种。
- 禁止：无输入响应的装饰视差、大面积裸 fade、与内容无关的纯装饰循环。

### 光标徽章（已实现）

由 `main.js` 的 `initCursor()` + `.custom-cursor`（CSS）驱动，按 `data-cursor` 属性取值出徽章，不再手动写死。

- 视觉：`html.has-cursor` 下全局 `cursor: none`；ink 圆点随悬停放大成近黑圆形徽章，`cc-label` 白字大写、`letter-spacing: 0.22em`；进出用 `back.out` 缩放。仅在 FINE_POINTER 且非 REDUCED、非触摸时启用（`TOUCH || !FINE_POINTER || REDUCED` 直接跳过）。
- PHOTOGRAPHY：悬停 `.hs-card`（可点开 lightbox）显示 `VIEW`；横向区容器 `#hs-wrap` 与 `.hs-dragbar-track` 显示 `DRAG`。
- GAME ARCHIVE：`#hof-scroll` 与 `#hof-dragbar-track` 显示 `DRAG`（当前 `.hof-item` 未挂 `data-cursor`）。
- 新交互卡片只需挂对应 `data-cursor` 值（`VIEW`/`DRAG`/`OPEN`/`PLAY`…），无需改 JS/CSS。

## 视觉基调

新粗野主义。`--bg #F4F6F9` / `--bg-deep #E7ECF2` / `--ink #1B2430`，辅助 `--slate` / `--slate-2` / `--ice`。
强调色 `--volt #2B4CFF` / `--punch #FF5C1F` / `--acid #C6F439` 只小面积点缀。硬边 2-3px 描边 + 硬偏移阴影；无圆角滥用、无软阴影、无渐变；禁紫、禁 glow。
文案冷峻克制、中英混排、短句为主。

## 站点结构（改动前核对实际现状）

hero → ticker → PHOTOGRAPHY（横向 pinned 画廊 11 帧 + lightbox 换 `photo/full/`）→ GAME ARCHIVE（HOF 7 卡）→ THE ARCHIVE（书/影/剧/音乐/球队五 tab，数据硬编码）→ POEM → ABOUT。

## 内容更新

- 摄影：横向区加 `.hs-card`，`photo/<name>.jpg` 与 `photo/full/<name>.jpg` 都放。
- 游戏：GAME/ARCHIVE 区 `hof-item`，封面在 `covers/`。
- 影视：海报 `posters/<ttID>.jpg` 本地化，行内 `data-imdb`。
- 音乐：`data-song-id` 必须经网易云接口核实后再挂，**禁止凭记忆填造**。

改完自检：双击可用、无外部 CDN、无新增长帧、reduced-motion 不破布局、引用资源无 404，提交并推送 `origin/main`。

## 当前欠账（修完即删）

- 音乐正主 7 首缺 `data-song-id`（网易云反复核实不到，需人工确认）：《We Don't Talk Anymore (Remix)》《Slow Down》Madnap、《S&M》Rihanna、《Come Back To Me》Utada Hikaru、《Turnin'》Young Rising Sons、《Try》P!nk、《Galway Girl》Ed Sheeran。
- 文案 "232 SONGS" 与音乐区实际卡片数（332）不一致，属文案口径，改前确认。
