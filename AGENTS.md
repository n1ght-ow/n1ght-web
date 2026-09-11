# N1GHT CHXN9 - 项目约定

纯静态个人收藏站：`index.html` 双击即用，无构建、无 npm 运行时依赖。改动必须先读本文件。

设计事实源是 `DESIGN.md`（token / 排版 / 玻璃配方 / 实测对比度）；本文件管操作约定与红线。

**V2（2026）已整体重构视觉层**：从「装饰过载的亮色奢华」改为**编辑式影像档案 + 液态玻璃控件**。本文件已同步退役清单，不要复活下文列出的任何东西。

## 硬性禁区

- 不增删改 `.venv/`；不修改或删除 `photo/` 原图。新增照片时 `photo/` 与 `photo/full/` 两处都要有文件。
- 不引入外部图床 / CDN，图片、字体全走项目内相对路径。运行时外链（IMDb、网易云歌页 / APP 深链）只做内容跳转，不嵌 iframe、不加载外部资源。
- 不修改 `js/vendor/` 内压缩库；`js/sig-data.js` 是 fontTools 生成的签名路径数据，禁止手写 path，且不参与加载。
- **不引入新依赖**：不装动画库（anime.js 等已评估并否决）、不加 CSS 框架、不加颗粒噪点层。

## 已退役（不要复活）

V2 删掉的东西，任何一条重新出现都算回归：

| 类别 | 退役项 |
| --- | --- |
| 装饰 | 漂浮气泡场、hero 旋转贴纸、光斑 orbs、preloader（含快门与字符升起）、滚动进度条、自定义光标与磁吸 |
| 排版装饰 | `-webkit-text-stroke` 空心大字、双色大标题、**金色左边框条**、金色小方块编号 chip、表格隔行染色、首字下沉 |
| 结构 | ticker 走马灯（两条全部移除）、`.sec-mask` 幕帘、bighead 双词居中 scrub、`photo-roll-meter` 进度线 |
| 动效 | 弹性 spring（`back.out` / `elastic`）整体退役；`.poem-stamp` 盖章交互退役 |
| 色彩 | 暖金沙色板（`--sand-*` / `--gold-300` / `--ink-400`）已被中性纸墨 ramp 取代 |

**形状一致性锁**：全站只有 `--radius-sm/md/lg/pill` 四档。出现 `2px` / `9px` / `50%` / 24px 之类的散值即为回归。

## 技术约束

- 单页静态：`index.html` + `css/` + `js/`。脚本在 `<body>` 尾部按序加载：vendor（gsap → ScrollTrigger → SplitText → lenis）→ 数据（`film-data.js` → `series-data.js` → `music-data.js` → `music-covers.js`）→ 工厂（`reel-stage.js`）→ stage（`film-stage.js` → `series-stage.js` → `music-stage.js`）→ `main.js`。
- 样式表顺序：`fonts.css` → `style.css` → **`glass.css`** → `reel-stage.css` → `film-stage.css` → `series-stage.css`。`glass.css` 提供 `.glass` 基类，必须在组件样式之前。
- 缓存失效：改了哪个带 `?v=N` 的 css/js 就把它的版本号 +1；改数据文件时给对应 `<script>` 补挂 `?v=`。
- GSAP/ScrollTrigger/SplitText/Lenis 走本地 `js/vendor/`。Lenis 仅非 REDUCED 启用；锚点跳转统一走 `lenis.scrollTo`。
- 内容归属红线：`#panel-books / films / series / music / sport / games` 六个面板各放本类内容，禁止跨面板搬移或新增；标识符沿用现有 token。
- 中文内容行加 `lang="zh"`（回退系统字体）。
- **`.tab-panels` 必须保持为 `#archive` 的直接子元素**：`initArchiveTabs()` 用 `tabbar.closest("#archive").querySelector(":scope > .tab-panels")` 定位，包一层 `.shell` 会让整个 tab 系统静默失效。它的容器约束写在 `style.css` 里。

## 视觉基调（项目身份）

Design read：个人影像档案，受众是同好与自己。气质 = **编辑式画廊**：纸感中性底、克制的排版、全屏影像。
对应 dial：`DESIGN_VARIANCE 6 / MOTION_INTENSITY 4 / VISUAL_DENSITY 4`。

**核心判断**：照片是页面上唯一被允许彩色的事物。界面不得与图片抢注意力——这决定了下面几乎每一条规则。

- **明暗**：正文页全亮色纸面。暗色只用于三处——全屏影像 hero、`#lightbox`、`.footer`。不要把任何普通分区反转为暗色。
- **色彩**：中性纸墨 ramp + 单一香槟金强调。**禁紫、禁纯黑 `#000`、禁纯白 `#fff`**（用 `--ink-950 #101010` / `--on-dark #F2F2EF`）。accent hue = 可交互，静态文字只有诗区叠句一处例外。
- **强调色配额**：全站命中元素 **≤ 25**（V1 是 182，V2 是 14）。新增一处金色就要问自己是不是在稀释它。
- **留白优先于线条**：分组靠间距与留白，不靠描边、底色块、分隔线。分隔线只给密集表格数据。
- **图片优先于装饰**：任何新装饰元素都要先回答「它有没有在和照片抢注意力」。

## 液态玻璃（V2 核心）

完整配方与原理见 `DESIGN.md` 第 4 节。三条操作红线：

1. **绝不在玻璃元素的祖先上做 opacity / transform 动画**。祖先的 `filter` / `opacity < 1` / `transform` / `mask` / `mix-blend-mode` 会建立新的 backdrop root，玻璃会退化成「无模糊」。入场动画只加在玻璃自身或其内部内容上。
2. **模糊声明永远写在 SVG 折射增强之前**。`@supports (backdrop-filter: url(...))` 在 Safari 上返回 true 但不渲染，会静默连模糊一起丢掉。
3. **不把多层玻璃放进横向滚动容器**（滚动时 backdrop 跟随、绝对定位层随内容滚）。`≤720px` 的 tab 条已因此改实底。

回退是**三重**的（`prefers-reduced-transparency` 只有 Chromium 支持，不能单独依赖）：`@supports` 无 backdrop-filter → `prefers-reduced-transparency` / `prefers-contrast` → `html[data-transparency="solid"]`。

玻璃**只给浮在内容之上的控件**（导航、tab 条、未来的浮层）。纸面上的按钮用实心色——纸上没有可折射的内容，玻璃只会发灰。

## 排版（DESIGN.md 第 2 节）

- **双寄存器系统，10 个声明角色封顶**：UI 档（11 / 12 / 13 / 15 / 16px）+ 展示档（20 / 25 / 31 / 49 / 76px，模数 1.25）。两者之间的空档是刻意的，不要插中间值。
- **红线**：`text-box-trim` **只给展示档标题**（`.display` / `.sec-title` / `.coda-title` / `.footer-name`）。它移除降部空间，与 `overflow: hidden` 同用会切掉降部——曾把「Maybe」渲染成「Maube」。
- `line-height` 一律 unitless；标题 `text-wrap: balance`，描述 `pretty`；会变的数字 `tabular-nums`。
- 字重只用 400 / 500。层级由字号与留白承担，不由加粗承担。
- 英文文案禁 em dash（用句号 / 逗号 / 冒号重写）；中文破折号不受限；en dash 只用于范围；正文用弯引号。

## 颜色（DESIGN.md 第 3 节）

- 两层 token：原语按 hue（只进 token 层），组件只准用**语义层**；缺角色就新增语义 token，绝不借用近值。
- 对比度**实测不估算**。已实测的关键值：ink-900/paper-050 17.18:1、ink-600 8.04:1、**ink-500 5.11:1（muted 的唯一合法值）**、gold-700/paper-050 5.52:1、ink-900/gold-400 7.62:1、导航玻璃最差 10.11:1。
- **`--ink-400` 一类浅灰不得用于小字**；muted 一律 `--ink-500`。
- **导航玻璃底色不透明度不得低于 0.76**：实测 α0.60 时最差照片上标签只有 3.10:1。
- 每视图只一个实心填充主操作；修对比度只动 lightness，不动 hue。

## 动效（DESIGN.md 第 6 节）

- 四条命名缓动：`--ease-out` / `--ease-soft` / `--ease-in-out` / `--ease-snap`。不再新增一次性曲线。
- 现有动效每一个都能一句话说出动机；新增动效说不出的就删。
- **弹性已退役**：不用 `back.out` / `elastic`；低频入场用 `power3/4.out`。
- 性能红线：只动 `transform` / `opacity` / `filter`；scrub 必须 `invalidateOnRefresh: true`；图片加载后 refresh 用 250ms debounce；滚动监听只走 ScrollTrigger / IntersectionObserver / Lenis。
- `transition-property` 写具体属性，禁 `transition: all`。
- **`filter` 会创建包含块**：图片滤镜只加在 `img` 上，绝不加到任何含 `position: fixed` 后代的容器（`#lightbox` 是 fixed）。
- `main.js` 的 `MOTION` 常量保留复用；`spring` 已无人使用，新代码不要引入。
- reduced-motion：视差、入场、hover 位移全静态化，信息不丢失。

## 无障碍

- `:focus-visible` + 2px 实线 `--color-accent-text` 环，`outline-offset: 3px`；禁无替代的 `outline: none`。
- 键盘走 ARIA APG：Esc 关浮层、方向键在组合件内、roving tabindex、Enter/Space 激活；`tabindex` 只用 0 和 -1。
- 不做 `<div onClick>`：动作 `<button>`、导航 `<a href>`。图标按钮带 `aria-label`。
- 目标尺寸：桌面 40×40，触摸 44×44。
- 一个 `<h1>` 不跳级、一个 `<main>`、320px 无横向滚动、200% 缩放可用。
- **`[hidden]` 必须能压过组件自带 `display`**：`style.css` 已用 `[hidden] { display: none !important; }` 兜底，新增组件不要移除这条。
- 验收两次走查：纯键盘 + 读屏。

## 布局

- 留白分组：组间距 ≥ 组内 2×；分隔线是密集数据的最后手段。
- 对齐共享边缘；物理 left/right 换逻辑属性（`margin-inline-start` 等）。
- 断点由内容驱动（1100 / 900 / 720 / 480）。
- 横向滚动器下一项露 16-32px 窥视；移动端按钮内缩 + 安全区。

## 文案

- 先侦察既有语气：本站「中英混排、短句、大写 mono 标签」是**刻意品牌声音**——只修不一致、歧义、轻重失配。
- V2 已把 mono 覆盖率下调并删除大量装饰性大写标签；新增标签前先问是否必要。
- 按钮动词先行；错误说明怎么修；空状态给出下一步；占位符是示例不是标签。

## 代码结构

- `js/main.js` 站点交互层：hero 入场、玻璃高光（`initGlassSpotlight`）、滚动揭示（`ScrollTrigger.batch`）、计数器（`initCounters`）、统一详情层（photo / film / series / game / music 共用 `#lightbox`）、tab 切换、音乐流派过滤 + 搜索 + 随机一首、网易云外链、导航高亮、共享 `scheduleRefresh`。
- 已从 `main.js` 移除：`initCursor` / `initMagnetic` / `spawnBubble` / preloader 时间线 / ticker JS 驱动 / bighead parallax / `.sec-mask` / 计数条 / `#scroll-progress`。
- ARCHIVE 共享工具条与收藏星标已于更早版本整体撤销，不再新增回访入口。
- 签名：已整体退役；`js/sig-data.js` 保留在仓库但不参与加载。

### 影 / 剧

数据（`film-data.js` 16 部 / `series-data.js` 19 部）→ 配置适配器经 `js/reel-stage.js` 的 `createReelStage()` 工厂渲染进 `#panel-films` / `#panel-series`。

**改动纪律**：`reel-stage.js` 是**两个面板共用的唯一实现**，适配器只传配置。视觉改动优先加在 `css/reel-stage.css` 末尾的 `V2` 区块，**不要改工厂契约**（否则影和剧要改两遍）。
class 前缀（`film-*` / `series-*`）不许改——CSS 和 main.js 按它绑定。

选中态的语言：**发丝环 + accent 下边框 + 一个居中的 OPEN chip**。不要恢复「整个 meta 面板反转为实心墨 + 38% 高度色块盖住海报」——那会挡掉面板本来要展示的画面。

### 音乐

`js/music-data.js`（`window.MUSIC_DATA`，763 首 16 组）→ `js/music-stage.js` 渲染进 `.playlist[data-music-stage="auto"]` 并生成 `#genre-filter` 过滤 chips。`.genre-count` 由渲染器自动生成。

专辑封面走 `js/music-covers.js`（`window.MUSIC_COVERS`，songId → 文件名，图在 `album-covers/`，生成文件勿手改），详情层 `.lb-music` 显示真实封面，缺图回落 ♪ 占位 sleeve。

- 歌单默认**全展开、无手风琴**；浏览靠流派 chips 过滤 + 搜索叠加 + 随机一首。
- 默认**单流派显示**：一次只显示一组，首屏索引 0 的 POP；chips 行没有「全部」，一次只有一枚 `aria-pressed="true"`。切换流派统一走 `selectGenre()`。
- 搜索只作用于当前流派；零命中而别处有结果时给 `#music-search-jump`，点击切组并保留关键词。

### 书 / 球队

硬编码在 `index.html`；历史调研产物放 `archive/<topic>/`，不参与站点加载。

## 站点结构

hero（全屏影像）→ PHOTOGRAPHY（编辑式 12 栏网格 11 帧 → Dylan Thomas 诗区）→ THE ARCHIVE（六 tab：书 6 / 影 16 / 剧 19 / 音乐 763 首 16 组 / 球队 5 / 游戏 18 卡）→ ABOUT（统计 + coda）→ footer。

- **照片网格只放横构图 plate**：11 张全部是 1600×1067（3:2）。不要竖裁成 4:5 或 1:1——会切掉主体。可用比例：`21:9` 全幅 / `3:2`。
- 游戏名册是平铺网格 `repeat(auto-fill, minmax(min(100%, 250px), 1fr))`，封面 16:9，`.hof-foot` 用显式 `grid-area` 排两行（序号 + 时长 / 名称）。排名由 CSS counter 画出。
- 图片默认低饱和、hover / focus 复原：这是「颜色是奖励不是壁纸」的落点。滤镜只加在 `img` 上。
- 说明文字是 hover / focus-within 浮层，键盘可达。

## 内容更新

- 摄影：`.photo-frame`，`photo/` 与 `photo/full/` 都放；网格比例只用 21:9 或 3:2。
- 游戏：`.hof-item`（直接进 `#hof-grid`），封面 `covers/`，时长写 `.hof-hours`，引文写 `.hof-quote`。
- 影视：海报 `posters/<ttID>.jpg`，条目进 `film-data.js` / `series-data.js`。
- 音乐：`data-song-id` 必须经网易云接口核实，禁止凭记忆填造；加进 `music-data.js` 对应组 `tracks`，计数自动。新歌封面从网易云 `song/detail` 的 picUrl 取 500px 存进 `album-covers/`，再跑 `archive/music-album-covers/index.json` → `js/music-covers.js` 的重新生成。
- 球队：logo `logos/`；队名是官网直达真链接（`target="_blank" rel="noopener"`）。
- 增删内容同步 `#about-stats` 的计数（`data-count`）与 hero 统计条。

## 改完自检

1. 双击 `index.html` 可用；无外部 CDN；控制台无 404。
2. 无新增长帧；reduced-motion 不破布局；引用资源无 404；`?v=` 已递增。
3. 纯键盘走查；320px 与 200% 缩放不裁剪；对比度实测（玻璃按叠加底色）。
4. 视觉回归自检：强调色命中元素仍 ≤ 25；圆角仍只有四档；没有复活退役清单里的任何一项。
5. 玻璃自检：模糊声明仍在增强之前；没有把玻璃放进横向滚动容器；没有在玻璃祖先上做 opacity / transform 动画。
6. 提交并推送 `origin/main`。

## 回滚

重构前的状态标记在 git tag `pre-redesign`，工作分支 `redesign/v2`。