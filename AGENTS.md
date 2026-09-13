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

完整配方与原理见 `DESIGN.md` 第 4 节。**四条**操作红线：

1. **会杀掉玻璃的是 `filter` / `opacity < 1` / `mask` / `mix-blend-mode`，而且 `opacity < 1` 与 `filter` 在元素自身也成立**（本机 Chrome 152 实测对照表见 `DESIGN.md` 4.2）。`transform` 在**自身和祖先上都安全**——这是「药丸每帧被 transform 拖动、玻璃仍然成立」的前提。两条推论：**药丸绝不能用 opacity 淡入**；按压环必须是独立元素，不能靠改 `.glass__edge` 的 opacity 淡入。
2. **折射的门是 `html.has-lens`，不是 `@supports`**。Safari 解析 `url()` 后 `@supports` 返回 true 却不渲染；而 Chrome 已移除 `-webkit-backdrop-filter`，旧门在 Chrome 152 返回 **false**，等于这个增强从来没有生效过。门设在 `index.html` 的 head。**模糊声明永远写在增强之前**，挂不上只丢折射、不丢模糊。位移图**必须内联为 data URL**（`feImage` 外链会静默失败），`color-interpolation-filters="sRGB"` 是强制的。
3. **不把多层玻璃放进横向滚动容器**（滚动时 backdrop 跟随、绝对定位层随内容滚）。`≤720px` 的 tab 条已因此改实底，药丸在该宽度下也禁用拖拽。
4. **药丸不吃折射**：位移图的内部压平形状是按宽扁条（约 16:1）写的，放到 95×40 上会变形、中心不再是中性、整颗被放大成亮斑（已复现）。它的玻璃感来自模糊 + 轴向棱。

回退是**三重**的（`prefers-reduced-transparency` 只有 Chromium 支持，不能单独依赖）：`@supports` 无 backdrop-filter → `prefers-reduced-transparency` / `prefers-contrast` → `html[data-transparency="solid"]`。新增玻璃层时**三条都要补**。

玻璃**只给浮在内容之上的控件**：`header.nav` + `#nav-pill`、`#archive-tabbar` + `#tab-pill`，以及未来的浮层。纸面上的按钮用实心色——纸上没有可折射的内容，玻璃只会发灰。

**唯一的例外是 `.glass--accent`**（影 / 剧详情区的 `OPEN ON IMDb`，应要求做成玻璃）。它靠**香槟色染色**成立：染色就是重点，模糊与棱有了颜色可以读。配方与三个实测数字见 `DESIGN.md` 4.7 —— 关键是**这一版的两层都不能加 `brightness()`**，因为 `.glass__edge` 是 `inset: 0` 盖满整个控件、会与 `__body` 的亮度叠加，在浅色染上只会把通道削顶。

**选中药丸 `js/glass-pill.js` 是导航条与 tab 条共用的唯一实现**（同 `reel-stage.js` 的纪律：一个实现，调用点只传配置）。改它之前先读 `DESIGN.md` 4.6。三个要点：位置**每帧直写**、宽度走补间；**没有启动阈值**（点击就是零位移的拖拽，所以没有「点了没反应」的死区）；`Escape` / `pointercancel` 回到**已提交**的栏且不改选中态。药丸是 `aria-hidden` 装饰，真正的控件仍是 `<button role="tab">` 与 `<a href>`。

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
- **藏品短评（书 / 球队 / 影 / 剧）的规矩**：中文**一句**、尽量 ≤34 字、**不写片名**、**不概括剧情**、只抓一个具体的画面 / 动作 / 物件、**不写会过时的年数**（旧文案里的「三十七年过去」就是反例）、少用破折号、不写「这是关于……」的解说腔。同一栏里**不许混两种写法**（series 曾出现前 10 条是诗句、后 9 条是「片名 — 说明」）。
- V2 已把 mono 覆盖率下调并删除大量装饰性大写标签；新增标签前先问是否必要。
- 按钮动词先行；错误说明怎么修；空状态给出下一步；占位符是示例不是标签。

## 代码结构

- `js/main.js` 站点交互层：hero 入场、玻璃高光（`initGlassSpotlight`）、滚动揭示（`ScrollTrigger.batch`）、计数器（`initCounters`）、统一详情层（photo / film / series / game / music 共用 `#lightbox`）、tab 切换、音乐流派过滤 + 搜索 + 随机一首、网易云外链、导航高亮、共享 `scheduleRefresh`。
- 已从 `main.js` 移除：`initCursor` / `initMagnetic` / `spawnBubble` / preloader 时间线 / ticker JS 驱动 / bighead parallax / `.sec-mask` / 计数条 / `#scroll-progress`。
- ARCHIVE 共享工具条与收藏星标已于更早版本整体撤销，不再新增回访入口。
- 签名：已整体退役；`js/sig-data.js` 保留在仓库但不参与加载。

### 影 / 剧

数据（`film-data.js` 16 部 / `series-data.js` 19 部）→ 配置适配器经 `js/reel-stage.js` 的 `createReelStage()` 工厂渲染进 `#panel-films` / `#panel-series`。

**改动纪律**：`reel-stage.js` 是**两个面板共用的唯一实现**，适配器只传配置，**不要改工厂契约**（否则影和剧要改两遍）。
class 前缀（`film-*` / `series-*`）不许改——CSS 和 main.js 按它绑定。

`css/reel-stage.css` 曾经是**三层叠加覆盖**（主体 + `V2 VISUAL LAYER` + `V2 CORRECTIONS`），读它要先在脑子里做 diff。已压成一层：**新规则写进主体，不要再开覆盖区块**。同一次收敛里删掉了 7 个从未定义的 token 与 4 处硬编码 V1 暖金——它们让选中卡的 `box-shadow` 与普通卡**完全相同**，也就是选中态一直是隐形的。

选中态的语言：**发丝环（静止 0.1 / hover 0.2 / 选中 0.34）+ meta 的 accent 上边框**。**OPEN chip 已退役**（`.film-card-sleeve` → `display: none`：它会飘、是条带里唯一的实心深色形状，而整张卡本来就是按钮）。不要恢复「整个 meta 面板反转为实心墨 + 38% 高度色块盖住海报」，也不要恢复编号药丸（`.film-card-no` 同样已隐藏）。

**条带**：卡片必须显式写 `grid-template-columns: minmax(0, 1fr)`（漏了它海报会按 JPG 固有尺寸渲染，实测 158/54/90/59/54/24px）；`grid-template-rows: auto auto 1fr`；条带 `align-items: start`；字幕**只有两个字段**、各限一行省略；hover 只让海报 `translateY(-4px)`，字幕不动。

**详情区是纯排版、零图片**：海报只允许在条带上出现一次。同屏重复在结构上必须是**不可能**，而不是「被缓解」。栅格 `minmax(0, 26ch) minmax(0, 46ch)`；kicker 带位置号（把面板绑到选中的卡）。**`OPEN ON IMDb` 在第二栏第 3 行**（诗句下方，**香槟色液态玻璃** `glass glass--pill glass--accent`）—— 动作属于阅读栏，不属于身份栏；让它骑在 kicker 行右端等于把唯一能点的东西放到离作用对象最远处。

**动效纪律（`DESIGN.md` 第 11 节）**：
- **拖拽必须 1:1**：拖拽期间**直写 `transform`**，`quickTo` / tween 只用于松手、reveal、range 提交。曾经因为每一次 `pointermove` 都走 `quickTo`，实测滞后 **131px @1000px/s**。
- `maxX()` 缓存；range 被拖动时**不回写 `range.value`**。
- 落位用 `power3.out` + 距离成比例的时长（**证明不过冲**），不用 spring。
- **不做**：滚动速度 skew、逐卡反向视差、逐卡入场 stagger（35 张 × 30ms 已经 1.62s）、containerAnimation（与直写 `x` 失步）。
- **单位陷阱**：Lenis `velocity` 是 px/帧，ScrollTrigger `getVelocity()` 是 px/秒，差 60 倍。
- **影 / 剧点击不开浮层**。详情块就在条带正下方，浮层是重复 —— 而且更差（250px 海报浮在暗场里）。**点击只是选中**，与 hover / Tab 同义。浮层仍是 photo / game / music 的详情机制。曾经写过一版 FLIP 飞入，**已随浮层删除，不要加回来**。点击也**不触发 `revealCard`**。
- **条带入场只在视口做一次**，永不做逐卡 stagger（35 张 × 30ms = 1.62s，UI 上限 300ms）。
- **滚动横移已删除**（曾动 `-stage-drift` wrapper，4% 行程）。它让「居中」变成**滚动位置的函数**：实测同一张卡在不同滚动位置偏离中心 4px，而居中是选中的反馈，一个会漂的反馈等于没有反馈。
- **选中即居中**：`selectCard` → `settle(centeredX())`。实测第 3–14 张偏移 **0px**；第 1/2/15/16 张被 clamp 在两端（条带有界，不加 spacer 就没法居中，所有 center-mode 轮播都如此）。
- **拖拽是自由浏览**：**不吸附卡片位置、不改选中**。落点 = 当前 `x` + 惯性，仅按 `maxX` 夹紧。吸附到卡片位置会宣告「这张是当前的」，而拖拽按定义不改选中 —— 条带停在正中第 7 张、带着环的却是第 3 张，是坏状态。
- **`:focus-visible` 是选中与浏览的分界**：`pointerdown` 会 focus 卡片（`<button>`），所以 `focusin` **只对键盘焦点选中**。漏掉这条等于「手指一碰海报就已经选中了」，整个浏览手势是假的。
- **`swiped` 必须在 `pointerdown` 清掉**，不能只靠随后的 click 清：拖拽在**另一张卡**上松手时根本不产生 click，标志会留着吃掉下一次真实点击。
- **条带位置有两个写入口，滑块必须两边都听得到**：`setStrip`（瞬时）与 `settle`（补间）。写 range 的逻辑抽成 `syncRange(state, x)`，两边都调。**曾经的 bug**：写入语句长在 `setStrip` 里，而 `settle` 走 `gsap.to` 不走 `setStrip` —— 于是居中移动了条带、滑块一个字节都没收到。它**靠运气偶尔是对的**（有海报恰好加载完 → `setupMode` → `setStrip`），图片全部缓存后掩护消失，滑块就永久冻结。用 setter tap 抓调用栈才定位到：选中期间**每一次** range 写入都来自 img load 事件，没有一次来自选中本身。
- `settle` 的 `onUpdate` 要读**实时** x（`gsap.getProperty`）写 range，写目标值会让滑块第一帧就瞬移到终点再等条带追上来。
- **`state.settling` 必须在 `resetMover` 里清掉**：`resetMover` 既在落位完成时跑、也在 `pointerdown` 打断落位时跑，而被打断的补间**永远不会触发 onComplete** —— 漏掉这句标志会永久为真，之后 `setupMode`（resize 与每次海报加载时的重测/重夹紧）静默失效。
- `setupMode` 在 `settling` 期间**不得写 transform**：它写的是 `state.x`，而 `settle` 早已把 `state.x` 提交成目标值，所以居中动画途中只要有海报加载完，条带会直接闪到终点。

### 音乐

`js/music-data.js`（`window.MUSIC_DATA`，763 首 16 组）→ `js/music-stage.js` 渲染进 `.playlist[data-music-stage="auto"]` 并生成 `#genre-filter` 过滤 chips。`.genre-count` 由渲染器自动生成。

专辑封面走 `js/music-covers.js`（`window.MUSIC_COVERS`，songId → 文件名，图在 `album-covers/`，生成文件勿手改），详情层 `.lb-music` 显示真实封面，缺图回落 ♪ 占位 sleeve。

- 歌单默认**全展开、无手风琴**；浏览靠流派 chips 过滤 + 搜索叠加 + 随机一首。
- 默认**单流派显示**：一次只显示一组，首屏索引 0 的 POP；chips 行没有「全部」，一次只有一枚 `aria-pressed="true"`。切换流派统一走 `selectGenre()`。
- 搜索只作用于当前流派；零命中而别处有结果时给 `#music-search-jump`，点击切组并保留关键词。

### 书 / 球队

硬编码在 `index.html`；历史调研产物放 `archive/<topic>/`，不参与站点加载。

## 站点结构

hero（全屏影像）→ PHOTOGRAPHY（16 栏编辑式散页 11 帧，分 Bloom 01-07 / Horizon 08-11 两个乐章 → Dylan Thomas 诗区）→ THE ARCHIVE（六 tab：书 6 / 影 16 / 剧 19 / 音乐 763 首 16 组 / 球队 5 / 游戏 18 卡）→ ABOUT（统计 + coda）→ footer。

- **照片网格只放横构图 plate**：11 张全部是 1600×1067（3:2）。不要竖裁成 4:5 或 1:1——会切掉主体。可用比例：`21:9` 全幅 / `3:2`。
- **照片区是「散页」不是表格**：16 栏 + `row-gap: 0` + `align-items: start`，每张在 CSS 里**显式写自己的 `grid-column` 起始列**、跨度与垂直偏移（见 `style.css` 第 9 节按 `[data-photo-index]` 的区块）。**不要给每张都加偏移**——都偏等于没偏；也**不要**把 placement 改回 `nth-child(3n)` 之类的生成式规则，11 张的节奏是逐张写出来的。
- **`.photo-act-horizon` 是 JS 契约**：`photoFrameData()` 用它给详情层打 `BLOOM / HORIZON`，类名删掉会让每张都报 BLOOM。
- 漂移挂在 **`.photo-frame-btn`** 上（不是 `.photo-frame`）：入场用的 `ScrollTrigger.batch` 带 `overwrite: true`，会杀掉同目标上的其他补间。量由 CSS 的 `--photo-drift` 提供，正负交替。
- 游戏名册是**显式三列**（≥900px；720–900 两列，≤720 单列），封面 16:9。**不要改回 `auto-fill`**：18 只能被 1/2/3/6/9/18 整除，`auto-fill minmax(250px,1fr)` 在 1440 下出 4 栏 = 4 行零 2 个孤儿。序号与时长并成一行（`counter` 仍在 `.hof-foot::before`，但不再独占一行），名称在下一行，评语一行截断。
- **影 / 剧的卡片是「2:3 媒介盒 + 盒外的 meta」**，靠 `.film-card` 的栅格实现（`grid-template-columns: minmax(0,1fr)` + `grid-template-rows: auto auto 1fr`），**不要改回绝对定位的整盒 + meta 覆盖**，也**不要漏掉列定义**（漏了海报会按 JPG 固有尺寸渲染，实测 158/54/90/59/54/24px）。索引药丸（`.film-card-no`）与 OPEN chip（`.film-card-sleeve`）均已 `display: none`；选中态靠**可区分的环**（静止 0.1 / hover 0.2 / 选中 0.34）与 meta 的 accent 上边框两层。**详情区不放图**。
- **索引列表（书 / 球队 / 音乐）没有逐行发丝线**，靠 `padding-block` 与间距分组。序号只用于书，`--fs-label` + muted 且**不用 tabular-nums**；球队用队徽（统一 2.75rem 等比盒）取代序号。
- **音乐每行必须渲染 64px 真封面**（`window.MUSIC_COVERS`）；缺图回落同尺寸空 sleeve。不要恢复 `counter(track)` 编号，也不要给 `.idx-artist` 加回大写 + 字距。
- 图片默认低饱和、hover / focus 复原：这是「颜色是奖励不是壁纸」的落点。滤镜只加在 `img` 上。
- **照片说明文字常驻在 plate 下方**，不再是 hover 浮层（旧做法让每张图都是黑盒，且违反 WCAG 2.2 SC 1.4.13 的可关闭要求）。键盘可达性不受影响：按钮仍在，caption 只是不再依赖 `:focus-within`。

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
5. 玻璃自检：模糊声明仍在增强之前；增强门仍是 `html.has-lens`（不是 `@supports`）；没有把玻璃放进横向滚动容器；没有给任何玻璃元素或其祖先加 `opacity < 1` / `filter`（`transform` 是允许的）；新玻璃层补齐了三条回退。
6. 药丸自检：`moveTo` 在**所有**选中路径上都调用了（点击 / 方向键 / Home / End / 拖拽提交）；`Escape` 与 `pointercancel` 不改选中态；`≤720px` 拖拽已禁用但 tab 仍可点。
7. 提交并推送 `origin/main`。

## 回滚

重构前的状态标记在 git tag `pre-redesign`，工作分支 `redesign/v2`。