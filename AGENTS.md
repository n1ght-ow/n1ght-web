# N1GHT CHXN9 - 项目约定

纯静态个人收藏站：`index.html` 双击即用，无构建、无 npm 运行时依赖。改动必须先读本文件。

设计事实源是 `DESIGN.md`（token / 排版 / 玻璃配方 / 实测对比度）；本文件管操作约定与红线。

**V2（2026）已整体重构视觉层**：从「装饰过载的亮色奢华」改为**编辑式影像档案 + 液态玻璃控件**。本文件已同步退役清单，不要复活下文列出的任何东西。

## 硬性禁区

- 不增删改 `.venv/`；不修改或删除 `photo/` 原图。新增照片时 `photo/` 与 `photo/full/` 两处都要有文件。
- 不引入外部图床 / CDN，图片、字体全走项目内相对路径。运行时外链（IMDb、网易云歌页 / APP 深链）只做内容跳转，不嵌 iframe、不加载外部资源。
- 不修改 `js/vendor/` 内压缩库；`js/sig-data.js` 是 fontTools 生成的签名路径数据，禁止手写 path，且不参与加载。
- **不引入新依赖**：不装动画库（anime.js 等已评估并否决）、不加 CSS 框架、不加颗粒噪点层。书架是这条的边界案例：它用**仓库里已有的** GSAP 重写了一个 React + motion/react 的实验，所以依赖没有增加。

## 已退役（不要复活）

V2 删掉的东西，任何一条重新出现都算回归：

| 类别 | 退役项 |
| --- | --- |
| 装饰 | 漂浮气泡场、hero 旋转贴纸、光斑 orbs、preloader（含快门与字符升起）、滚动进度条、V1 的自定义光标与磁吸（**例外**：`js/smooth-cursor.js` 是按要求的 Framer Smoothcursor 移植，不是 V1 那一套，见「动效」） |
| 排版装饰 | `-webkit-text-stroke` 空心大字、双色大标题、**金色左边框条**、金色小方块编号 chip、表格隔行染色、首字下沉 |
| 结构 | ticker 走马灯（两条全部移除）、`.sec-mask` 幕帘、bighead 双词居中 scrub、`photo-roll-meter` 进度线 |
| 动效 | 弹性 spring（`back.out` / `elastic`）整体退役；`.poem-stamp` 盖章交互退役 |
| 色彩 | 暖金沙色板（`--sand-*` / `--gold-300` / `--ink-400`）已被中性纸墨 ramp 取代 |

**形状一致性锁**：全站只有 `--radius-sm/md/lg/pill` 四档。出现 `2px` / `9px` / `50%` / 24px 之类的散值即为回归。

## 技术约束

- 单页静态：`index.html` + `css/` + `js/`。脚本在 `<body>` 尾部按序加载：vendor（gsap → ScrollTrigger → SplitText → lenis）→ 数据（`film-data.js` → `series-data.js` → `music-data.js` → `music-covers.js` → `book-shelf-data.js`）→ 工厂（`reel-stage.js`）→ stage（`film-stage.js` → `series-stage.js` → `music-stage.js` → `book-shelf.js` → `photo-wall.js`）→ `glass-pill.js` → `main.js`。
- 样式表顺序：`fonts.css` → `style.css` → **`glass.css`** → `reel-stage.css` → `film-stage.css` → `series-stage.css` → `book-shelf.css` → `photo-wall.css`。`glass.css` 提供 `.glass` 基类，必须在组件样式之前。
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

玻璃**只给浮在内容之上的控件**：`header.nav`、`#archive-tabbar` + `#tab-pill`、`.music-bar`（整条工具条唯一的磨砂面，见「两条 bar」），以及未来的浮层。纸面上的按钮用实心色——纸上没有可折射的内容，玻璃只会发灰。

**唯一的例外是 `.glass--accent`**（影 / 剧详情区的 `OPEN ON IMDb`，应要求做成玻璃）。它靠**香槟色染色**成立：染色就是重点，模糊与棱有了颜色可以读。配方与三个实测数字见 `DESIGN.md` 4.7 —— 关键是**这一版的两层都不能加 `brightness()`**，因为 `.glass__edge` 是 `inset: 0` 盖满整个控件、会与 `__body` 的亮度叠加，在浅色染上只会把通道削顶。

**选中药丸 `js/glass-pill.js` 现在只服务 `#archive-tabbar` 一条**（导航条那颗已退役，见「导航条（Liquid Glass Navbar 形态）」；同 `reel-stage.js` 的纪律：一个实现，调用点只传配置）。改它之前先读 `DESIGN.md` 4.6。四个要点：位置**吸附到指针所在的那一栏**（药丸任何时刻都精确等于某一栏的矩形，所以拖动中它也是「填满」的）、宽度与位置走同一个 180ms 补间；**抓取只加深阴影、绝不缩尺寸**（`scale: 0.94` 已退役：90px 的栏只被 84.6px 盖住，看起来就是没落到位）；**没有启动阈值**（点击 = 零位移的拖拽，所以没有「点了没反应」的死区）；`Escape` / `pointercancel` 回到**已提交**的栏且不改选中态。药丸是 `aria-hidden` 装饰，真正的控件仍是 `<button role="tab">` 与 `<a href>`。

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
- **光标是另一个明文例外**（`js/smooth-cursor.js`，Framer Smoothcursor 的移植）：它要的是指针的**滞后量**，所以内部是三条**不过冲**的弹簧（ζ ≥ 1，实测 1.13 / 1.73 / 1.01），与 `back.out` / `elastic` 无关。它自己管开关（指针 coarse / 窄窗 / reduced-motion 下不挂载），不要当回归删掉。见 `DESIGN.md` 6.4。
- 现有动效每一个都能一句话说出动机；新增动效说不出的就删。
- **弹性已退役**：不用 `back.out` / `elastic`；低频入场用 `power3/4.out`。这条管的是**过冲曲线**，不是「JS 里不许有缓动」——书架用 GSAP 的 `power3.out` 落位、`expo.out` 跟随指针，两者都不过冲，也是上游 spring 的等效时长。
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

- `js/main.js` 站点交互层：hero 入场、玻璃高光（`initGlassSpotlight`）、滚动揭示、计数器（`initCounters`）、统一详情层（photo / film / series / game / music 共用 `#lightbox`）、tab 切换、音乐流派过滤 + 搜索 + 随机一首、网易云外链、导航高亮、共享 `scheduleRefresh`、`window.NightScroll`（全屏层共用的滚动锁）。**摄影的例外**：它没有任何滚动动效（墙自己会动，`ScrollTrigger.batch` 的入场与 `--photo-drift` 漂移都随散页网格一起删除），点击改成在 `#photo-wall` 上委托一次，灯箱关闭时额外派发 `night:detail-closed` 让墙重新上锁。
- 已从 `main.js` 移除：`initCursor` / `initMagnetic` / `spawnBubble` / preloader 时间线 / ticker JS 驱动 / bighead parallax / `.sec-mask` / 计数条 / `#scroll-progress` / 摄影入场与逐张漂移。
- ARCHIVE 共享工具条与收藏星标已于更早版本整体撤销，不再新增回访入口。
- 签名：已整体退役；`js/sig-data.js` 保留在仓库但不参与加载。

### 导航条（Liquid Glass Navbar 形态）

应要求把 `header.nav` 换成 Framer Liquid Glass Navbar（`framer.com/m/Liquid-Glass-Navbar-6gh01a.js`）的**形态**，材质仍是本站玻璃。完整表格与实测数字见 `DESIGN.md` 4.9。

- **只借三件事**：镜片棱 3px（pill 默认 9px）、轴向棱改成**上下都亮 + 暗侧轨**、以及参考那六层「宽、软、极低 α」的投影（写进新 token `--glass-elevation`）。参考的 logo 宝石、菜单项、`Get Started` 按钮是它的**内容**不是形态，**没有抄**。
- 覆盖必须写成 **`.nav.glass …`**：`.glass` / `.glass--pill` 在 `glass.css` 里且**后加载**，bare `.nav` 的同名声明压不过它。同 `.tabbar.glass` 那个坑；新的 `background: var(--glass-nav)` 也踩了一次。
- `--glass-elevation` 定义在 `glass.css` 的 `:root`，默认值就是原来那两层投影；`.glass` 与三条回退都读它。**改高度只改这一个 token**，不要重抄 inset 斜面。
- 顺手修好：`.nav` 此前没有 `background`，吃的是 72% 的 `--glass-panel`，而 78% 的 `--glass-nav` 从没被任何选择器用过。合成到纯黑背景上，α0.72 的链接色只有 **4.20:1**（不合格），α0.78 是 **4.99:1**。
- 内容面板整块**不抄**：参考填的是不透明渐变，本站填了就等于终止 backdrop 读取，玻璃随之消失。退一步只照抄那条 bevel（`inset 0 ±1px 1.5px`）也试过，渲染出来是**棱内部多出来的一圈细线**——已撤掉。**外壳的棱是这条 bar 唯一的边**，不要再往里加第二圈。
- **导航条不再有选中指示器**（应要求）：`#nav-pill` 元素、`main.js` 的 `createGlassPill()` 调用、`.nav-links.is-dragging` / `.is-drop-target` / `cursor: grab` 全部删除。选中态改由墨色承担（active ink-900 13.9:1 / 兄弟项 ink-600 6.6:1）。代价是失去「拖药丸跳章节」这个手势——它不是无障碍通道，但确实少了一条捷径。`js/glass-pill.js` 与 tab 条不受影响。

### 两条 bar（Compact Navbar 形态）

应要求把 `#archive-tabbar` 与音乐工具条（`.music-search` + `.genre-filter`）换成 Framer Compact Navbar（`framer.com/m/Compact-Navbar-cE1IzB.js`）的**形态**：一行一个容器、条目直接住在容器里（自己没有盒子）、容器内距紧凑、一行唯一的动作药丸停在右端。参考实现是**深色玻璃**胶囊；**本站只借形态、保留纸白材质**（用户选定，材质不反转）。完整表格见 `DESIGN.md` 4.8。

- 三个容器内距都是 6px、条目间距 4px。`.tab-btn` 目标仍是 **40px**：参考实现的条目只有 29px，**没有照抄**（桌面 40×40 是硬线，紧凑只能落在横轴——条目内距 1.25em → 1.05em）。
- `#archive-tabbar` 仍然是玻璃（浮在内容之上），选中药丸仍然是 `js/glass-pill.js` 那一颗。**拖拽语义是在这一轮改的**：从「跟着指针 1:1 悬浮」改成「吸附到指针所在的那一栏」，并退役了 0.94 的抓取缩放——两者都是「拖到最右边小胶囊填不满」的原因（见「液态玻璃」里的药丸四条）。选中 / `moveTo` / `Escape` 的契约没动。
- **只有流派行 sticky，搜索行随列表滚走**（用户更正过方向，第一版两行反着来）：`#genre-filter` 与 `.music-bar` 是**兄弟节点**——sticky 会被父盒子裁掉，谁钉住谁就不能住在对方盒子里。搜索行不画任何东西（无背景、无模糊、无阴影），只留布局 + 条目状态语言（hover 药丸底、active 实心墨）。
- **材质是 Framer Blur Navigation 的配方逐字照抄**（`framer.com/m/Blur-Navigation-iGYrtY.js`）：`backdrop-filter: blur(26px)`（无 saturate / brightness）+ `--paper-100` @**16%** + 四边 1px `oklch(0 0 0 / 0.12)` 发丝环（板浮起来后只剩底边会断在圆角上）。**形状是本站的、不是参考的**（用户第二轮要求）：`--radius-pill` 胶囊、**与顶部 `header.nav` 等宽**——用同一条 `min(1180px, calc(100vw - 2 * var(--gutter)))`，居中必须是 `calc((100% - var(--rail-w)) / 2)` 而不是 `margin-inline: auto`（宽度超过列时 auto 会把起始 margin 丢掉、整块右移半个滚动条）。实测 1440→320 九个宽度左右边缘差 **0.0px**。**不要再叠第二层**：两行曾各是 @0.55 / @0.48 的玻璃，叠上去合成到 75-78% 纸，霜感被乘没、读起来是两块实心白板。**代价**：16% 面上压在深色封面时 muted 占位符远低于 4.5:1，这是这个材质的定义（用户明确要求压过这条红线），不要再加厚。
- **三条回退写在这层旁边**：`.music-bar` 是手写玻璃、不是 `.glass` 元素，`glass.css` 的回退块够不到它。
- 音乐条目**不再各自带发丝线**：整行读成一条 bar + 一枚点亮的条目。hover 是药丸底、active 是实心墨，与 tab 条同一套状态语言；`.music-random` 仍是这个视图**唯一**的实心主操作，只是从「输入框旁边的按钮」变成「停在 bar 右端的 CTA」（DOM 里也排最后，Tab 顺序与视觉顺序一致）。
- **焦点提示在输入框底边**（1px `--color-text-muted` + 光标），不再给整行画环：满宽色带套 2px 金环就是相框（用户原话「那个金色框删掉吧」）；输入框自身的 `outline: none` 由这条底线替代，行内的清除 / 随机一首保留全局焦点环。
- **tab 条的镜面棱不吃 `brightness()`**（`#archive-tabbar .glass__edge`）：纸上 1.14× 只会把 ~249 的主体削顶成纯白，实测上下 9px 是 `255,255,255`，而药丸四边各距棱 6px —— 那圈白就是「药丸周围的白色光晕」。改成只留 `blur(3px) saturate(1.4)` 后同点实测 `248,248,240`。`header.nav` 压在照片上，**保留** brightening。
- `≤720px`：三条都还是各自的横向滚动器。`.tabbar` 的实底规则必须写成 **`.tabbar.glass`**——`.glass` 在 glass.css 里且**后加载**，bare `.tabbar` 的同名声明一直压不过它（顺带修好了这条自 V2 起就没生效过的死规则）。

### 影 / 剧

数据（`film-data.js` 16 部 / `series-data.js` 19 部）→ 配置适配器经 `js/reel-stage.js` 的 `createReelStage()` 工厂渲染进 `#panel-films` / `#panel-series`。

**改动纪律**：`reel-stage.js` 是**两个面板共用的唯一实现**，适配器只传配置，**不要改工厂契约**（否则影和剧要改两遍）。
class 前缀（`film-*` / `series-*`）不许改——CSS 和 main.js 按它绑定。

`css/reel-stage.css` 曾经是**三层叠加覆盖**（主体 + `V2 VISUAL LAYER` + `V2 CORRECTIONS`），读它要先在脑子里做 diff。已压成一层：**新规则写进主体，不要再开覆盖区块**。同一次收敛里删掉了 7 个从未定义的 token 与 4 处硬编码 V1 暖金——它们让选中卡的 `box-shadow` 与普通卡**完全相同**，也就是选中态一直是隐形的。

选中态的语言：**发丝环（静止 0.1 / hover 0.2 / 选中 0.34）+ meta 的 accent 上边框**。**OPEN chip 已退役**（`.film-card-sleeve` → `display: none`：它会飘、是条带里唯一的实心深色形状，而整张卡本来就是按钮）。不要恢复「整个 meta 面板反转为实心墨 + 38% 高度色块盖住海报」，也不要恢复编号药丸（`.film-card-no` 同样已隐藏）。

**条带**：卡片必须显式写 `grid-template-columns: minmax(0, 1fr)`（漏了它海报会按 JPG 固有尺寸渲染，实测 158/54/90/59/54/24px）；`grid-template-rows: auto auto 1fr`；条带 `align-items: start`；字幕**只有两个字段**、各限一行省略；hover 只让海报 `translateY(-4px)`，字幕不动。

**详情区是纯排版、零图片**：海报只允许在条带上出现一次，同屏重复在结构上必须是**不可能**而不是「被缓解」。现在是**一条左对齐的竖列**，不是两栏栅格（旧版 26ch/46ch 的 `minmax()` 栅格与它带来的空栏已退役）：

1. 一行 mono 事实：位置号（唯一的墨色锚点，把面板绑到选中的卡）+ 类型 + 年份 + 导演（剧是 类别 + 年份 + 集数）。写法是 `.film-detail-copy` 为 block、`.film-detail-kicker` 为 **inline-flex**、导演/集数 **inline** —— 于是它们共享一行、放不下时自然换行。**不要改回 `display: contents` 或 flex 行**：flex 行会让唯一的动作和注释挤在同一行并压在文字上（实测按钮与诗句重叠）。
2. **注释（诗句）占一行**：列宽 `max-width: 72ch`（≈739px），注释自身**不设 max-width**。实测在 `--fs-h4` 20px Instrument Serif 斜体下，`film-data.js` 最长注释 580px、`series-data.js` 620px，所以 72ch 两者都放得下且留有余量。窄于约 700px 时注释换行——那是正确的，手机栏里没有诚实的单行方案。
3. `OPEN ON IMDb` **收在同一条左边缘上**（注释下方 `--sp-5`，**香槟色液态玻璃** `glass glass--pill glass--accent`）：动作属于阅读栏，不属于身份栏；让它骑在事实行右端等于把唯一能点的东西放到离作用对象最远处。
4. **片名不在详情区**：它写在抬起的那张海报下面（见下一条），同一个屏上印两遍是重复。

- **选中态 = 抬起一行 + 片名**：`.is-active` 让卡片 `translateY(calc(-1rem - 1.2 * var(--fs-small)))`（= 片名自己占的高度：16px 间距 + 一行 18px = 34px），片名（`.film-card-meta`）**绝对定位在海报下方**、只给选中那张、底边与整排底线**严格齐平**（实测 `labelBottomVsRow: 0`）。meta 的展示行（导演/年份）与 accent 上边框都已退役；选中语言是**发丝环 0.1 / hover 0.2 / 选中 0.34 + 抬起 + 片名 + 海报复原饱和**。
- **没有自动播放**：`reel-stage.js` 里没有 drift，也就没有 PAUSE 控件；`paintArc` / `CURVE_R` / `VIS_CULL` / 透视那套 3D 圆筒已整体删除。**滑块（`-stage-range`）也已退役**——方向键就是键盘路径。**拖拽会改选中**（焦点卡 = 顶点卡），这是与旧版「拖拽只浏览不选中」相反的明文决策。
- **排序**：适配器传 `sortKey`，工厂排序。影按年份、剧按**第一季**年份（`parseInt("1995-2013")` 取 1995），数据文件保持原本的编排顺序。

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

`js/music-data.js`（`window.MUSIC_DATA`，468 首 15 组）→ `js/music-stage.js` 渲染进 `.playlist[data-music-stage="auto"]` 并生成 `#genre-filter` 过滤 chips。`.genre-count` 由渲染器自动生成。

专辑封面走 `js/music-covers.js`（`window.MUSIC_COVERS`，songId → 文件名，图在 `album-covers/`，生成文件勿手改），详情层 `.lb-music` 显示真实封面，缺图回落 ♪ 占位 sleeve。

- **两行的方向**：流派 chips 行是**唯一 sticky 的那一行**，也是整条工具条唯一的磨砂面；它是一个**与顶部导航条等宽居中的胶囊板**（见「两条 bar」）。搜索行随列表滚走、不画任何东西。
- 歌单默认**全展开、无手风琴**；浏览靠流派 chips 过滤 + 搜索叠加 + 随机一首。
- 默认**单流派显示**：一次只显示一组，首屏索引 0 的 POP；chips 行没有「全部」，一次只有一枚 `aria-pressed="true"`。切换流派统一走 `selectGenre()`。
- **搜索跨全部 15 组**（应要求改的）：有命中时每个命中的组都展开，组头从「136 首」变成「4 / 136」，工具条读出「18 / 468」，零命中才显示 NO MATCH。`#music-search-jump` 随之退役——查询已经覆盖全部流派，没有「别处」可跳。**搜索中点击 chip = 跳到那一组的结果**，走原生 `scrollIntoView` + `scroll-margin-top`；**不要自己算 delta**：`.genre` 是 `content-visibility: auto`，实测手算落点差 359px、加一次「修正」反而差 834px（每次重测都会让另一个块实体化）。清空关键词后回到单选流派。
- **切换流派把新手流派带回条带顶部**（`alignGenreTop()`，只向上、不向下）：长流派滑到深处再切短流派时，文档变矮会被浏览器夹到底部，不处理就会"直接到最底"。三个坑都在注释里：目标位置要用 **CSS 读出的 pinned 几何**（`getComputedStyle(bar).top` + `bar.offsetHeight`），不能用 sticky bar 的实时 rect（换组瞬间它可能已被容器顶出视口）；落位是**瞬时跳**不是补间（补间只能从被夹住的近底部开始，会闪一路无关内容）；`lenis.scrollTo` 在目标等于上次目标时**直接 return**，而这里每组的目标都是同一个文档位置，所以要再核对 `window.scrollY` 并回落原生 `scrollTo`。

### 书（书架）

`js/book-shelf-data.js`（`window.BOOK_SHELF`，16 本）→ `js/book-shelf.js` 渲染进 `#panel-books` 里的 `[data-book-shelf="auto"]` 挂载点。**`#panel-books` 里已经没有 `.idx-row` 标记**，书不再是硬编码列表。

移植自 sanyam.sh/lab/book-shelf（上游是 React + motion/react）。这一版用仓库里**已有的** GSAP 重写，所以仍然没有新增依赖、没有构建步骤；场景、数字与推理属于原作者。点书脊 → 书旋出到舞台中央、封面正对读者、scrim 压在书架前；再点一次 / 点 scrim / Escape 放回去。

- **几何是契约**：`--bs-stage` / `--bs-base` / `--bs-centre` 写在 `book-shelf.css`，JS 用 `getComputedStyle` 读，任何一边都不要写死第二份。
- **封面落点 = 舞台的垂直中心**（`--bs-centre` = stage/2）。这是唯一让缩放免费的选择：场景绕中心缩放，那个点就永远不动，开书时上下两行字不必追它。
- **每本书是盒子不是贴图**：书脊是一面、封面是另一面（`rotateY(90deg) translateZ(thickness/2)`），翻 −90° 就把封面转给读者，全程没有淡入淡出。
- **scrim 是同一个 3D 场景里的一个平面**，不是上层遮罩：`preserve-3d` 按深度绘制并忽略 `z-index`，用 `translateZ(100px)` 挡在书架前、书后。
- **书脊英文、翻开全中文** —— 这是数据本身的形状：每条 entry 有 `spine`（印在书背上的短名）与 `title`（封面与详情里的正名）。书脊是整本书唯一一条 21px 的窄面，只放得下短名；封面有地方，就写这本书真正的名字。
- `writing-mode: vertical-rl` + `text-orientation: mixed` 同时是两种书脊的排法：中文正立、拉丁与数字倒 90° 躺着。所以「1984」的英文书脊形态是免费得到的，不用开特例。书脊挂 `lang="en"`；封面标签、作者行、短评挂 `lang="zh"`。按钮的可访问名也是中文（`aria-label="打开《三体》"`）。
- **书脊字体**：`Klein Blue Night`（`fonts/KeLaiYinLanDeYeWan.ttf`，12.6 MB，非商业授权）。整排**一个字号**（13px，像出版社给一套书定的那样），只有两条长书名会被自动缩到放得下；`thickness < 18` 的书脊不排字，只留布色。
- **中文的字号不能沿用拉丁**：封面标签作者行 10px→11px（10px 的汉字读不出来），标签标题 `line-height` 1.25→1.35（114px 标签宽只放得下 7 个 15px 汉字，长名必换两行，1.25 会让两行粘住）。
- **布色 / 印色**：16 组全部**实测**过 4.5:1（5.05 到 12.59）。换布色必须重新量，不许估。
- **作者在书上方、短评在书下方**，两行挂在场景的两个地标上（书顶 −46px / 底板下 +20px）并跟着 `--bs-fit` 缩放，所以短评永远落在书脊之外。
- 窄窗口是**整体缩排**（`--bs-fit`，按列宽算），不重排、不换行；短评是唯一允许换行的一行。

### 球队

硬编码在 `index.html`（`#panel-sport` → `#sport-stage`）；历史调研产物放 `archive/<topic>/`，不参与站点加载。

移植自 Framer 的 image animation（`framer.com/m/image-animation-HJJB.js`）：**一行五张图，永远只有一张被撑开，其余是窄缝，点窄缝就换它当主画面**。上游那 15 个 variant 只是同一个手风琴在 15 个尺寸上，所以这里就是五个 `<button>` 加一段 CSS。

- **所有状态都挂在 `[aria-pressed]` 上，JS 只搬这一个属性**（`main.js` 的 `initSportStage()`），并在启动时把第一张打开；布局、入场、颜色全在 CSS 里，脚本挂了就是「第一张永远展开」的静态带子，信息不丢。按钮天然吃 Enter / Space，没有键盘处理。
- **宽度动的是 `flex-grow`，绝不用 `flex-basis`**：百分比 basis 会插值成 `calc(0% + 104px)`，0.3s 内点两次会让两张同时跳、整行塌掉（实验室页实测 1412px 的行只剩 885px）。grow 是纯数字，被中断也还是单调的，行的总和恒定。
- **窄缝宽度是设计值** `min(104px, 7vw)`：上游按 1%（1200 设计稿的 12px）写，在 1440 的行宽上就是 14px 死条。展开项走 `flex-grow: 40`，实测 1440 下 812 / 119 ×4。
- **平板 / 手机是竖排**，行高必须写成确定值（展开 + 4 × 条高 + 4 × 缝）：容器 `height: auto` 时没有剩余空间，grow 无从分配，五个面板会一起停在 basis 上（实测五个 78px 正好等于行高，pressed 规则命中却什么都没做）。
- **只有文案自己那一条带被压暗**；上游覆盖整张图的 0 → 1 alpha ramp 不抄（它会把每张照片上暗下亮）。文字入场是 opacity + 14px 上浮，**不用 `blur(10px)`**；出场 0.16s，比面板收拢先结束。
- **颜色用站内的**：上游是白底 + 纯黑窄缝，两条都在禁区。窄缝是 `paper-100`，文案压在 `oklch(0.1 0 0)` 的墨色渐变上；队徽只出现在窄缝里（48px、居中、展开后淡出）。
- **文案只有三行**：眉标（队名 + 联盟）、荣誉、官网域名。**没有中文短评** —— 荣誉那一行就是这条带子上唯一的中文，走 `--fs-h3`。
- 图片在 `sport/`（文件名即 slug），五张都转过 webp（2.5MB → 1.3MB）；`loading="lazy"` 保留，隐藏的 tab 面板里图片不会取。

## 站点结构

hero（全屏影像）→ PHOTOGRAPHY（章节导语 + 全屏照片墙视图，11 帧 → Dylan Thomas 诗区）→ THE ARCHIVE（六 tab：书 16 本书架 / 影 16 / 剧 19 / 音乐 468 首 15 组 / 球队 5 / 游戏 18 卡）→ ABOUT（统计 + coda）→ footer。

- **照片不在正文流里**：正文只留章节导语 + 一个「Open the wall」按钮，整面墙在 `#photo-view` 这个全屏层里（nav `Photography`、页脚链接、导语按钮三处都能打开）。`z-index 60`：nav（70）仍在它之上可点，`#lightbox`（200）仍能压在它上面。**它不是模态**——只有 `main` / `footer` 被置 `inert`，nav 故意保持可用；滚动锁走 `main.js` 暴露的 `window.NightScroll`，并且监听 `night:detail-closed` 在灯箱关掉之后**重新上锁**（灯箱关闭会清掉所有 inert 并还回滚动）。
- **无 JS 兜底**：11 个 `.photo-frame` 放在正文的 `.photo-fallback` 网格里，`html.js` 把它 `display: none`；`js/photo-wall.js` 在**第一次打开视图时**把这 11 个元素搬进 `#photo-wall`。所以关闭 JS 时照片仍在页面上，只是没有墙。
- 墙的排布是**justified 行**，复刻 cmscurvegallery.framer.website：一行里瓦片**等高**、每张保留自己的比例、整行被拉到正好填满该纬圈。几何、交互与四个坑都在 `js/photo-wall.js` 与 `css/photo-wall.css`，三条必须记住的：
  - **`translateZ(R)` 不能漏**。CSS 的观看者在 `z = +perspective`，所以球心要落到观看者身上就得把 sphere 推前 R；漏掉它观看者就站在球**面**上，整面墙按 50% 渲染、后半圈镜像到屏幕中央（已复现）。
  - **sphere 必须是零尺寸盒子**。它那面正好压在观看者平面上的大盒子会投影到无穷大，Chrome 会丢掉整列不画（390px 实测左侧一条黑带，DOM 里瓦片齐全且可命中）。零尺寸的盒子平移后仍是零尺寸。
  - **行高是目标值，宽度吸收余量**（`slack = circ / (Σa·h + n·gutter)`）。反过来「解」行高（`h = (circ - n·g)/Σa`）永远解偏低——行是画到溢出为止、最后一格不会退回去，实测矮 10%，每行下面就多一条 40px 黑带。定死 h、把宽度整体缩几个百分点，环仍然闭合得**精确**，而行间距恰好是一条发丝缝。
- **两个旋钮不许互换**：`R_RATIO`（0.66 × 舞台宽）决定**弯曲程度**；行的缩放由 `rowsVisible = clamp(2.0, 3.46 × H/W, 4.6)` 推导——一行的高度就是缩放，而竖向视口必须让瓦片更小才能保持**横跨数量**，所以它不是常数。`R` 与所有行距都是推导值，**永不手写**。
- **瓦片比例是每张抽的**（三角分布，`[0.60, 1.06]`、峰值 0.75，即宽/高）：参考站的参差感来自「每张照片比例不同」，而本站 11 张全是 3:2，不抽比例就必然是一排排横条——这正是第一版做丑的原因。代价是 `object-fit: cover` **会裁**（原站同样在裁，它的素材从 0.50 到 1.00）。要回到零裁切就把 `A_MIN/A_MAX/A_PEAK` 一起收到 1.5 附近，但那样就不像原站了。
- **后半圈靠 `cull()` 剔除**：经度超过 90° 的瓦片在观看者身后，投影的 w 变负，Chrome 会把它们镜像到屏幕中央、并且在奇点附近放大到离谱。只留 |经度| ≤ 60°（可见范围约 ±37°）。这不是优化，是正确性。
- **拖拽 1:1 且逐帧直写**：`a = a0 ∓ dx / R`，拖拽期间**不经过任何补间**（`reel-stage.js` 实测 131px 滞后的教训）；落位用 `power3.out` + 距离成比例时长，reduced-motion 下瞬时。滚轮**只吃 `deltaX`**（+ Shift+纵滚）：墙只是长文档里的一屏，吞掉 deltaY 就是滚动陷阱。
- **`data-act` 取代了 `.photo-act-horizon`**：`photoFrameData()` 现在读 `frame.dataset.act`。乐章标题已随参考站样式整体删除，属性是 `BLOOM / HORIZON` 的唯一来源。
- **点瓦片开灯箱，拖拽不开**：`swiped` 在 `pointerdown` 清零、位移 > 6px 置位，`click` 在捕获阶段消费（`e.detail === 0` 的键盘回车放行）。克隆体也是真 `<button>`，所以 `main.js` 在 `#photo-wall` 上**委托一次**，不再逐帧绑定。
- **方向键挂在 `#photo-view` 上，不是墙上**：视图刚打开时焦点在 Close 药丸上，挂在墙上等于「先进某一帧才有反应」。
- **墙是全彩的**（`--wall-saturate` 默认 `saturate(1)`），这是「颜色是奖励不是壁纸」的**明文例外**：那条规则保护的是纸面页，而在墙上照片就是页面本身，没有界面要保护，压饱和在这个尺度上只会读成渲染故障。一个变量可以调回去。
- 游戏名册是**显式三列**（≥900px；720–900 两列，≤720 单列），封面 16:9。**不要改回 `auto-fill`**：18 只能被 1/2/3/6/9/18 整除，`auto-fill minmax(250px,1fr)` 在 1440 下出 4 栏 = 4 行零 2 个孤儿。序号与时长并成一行（`counter` 仍在 `.hof-foot::before`，但不再独占一行），名称在下一行，评语一行截断。
- **影 / 剧的卡片是「2:3 媒介盒 + 盒外的 meta」**，靠 `.film-card` 的栅格实现（`grid-template-columns: minmax(0,1fr)` + `grid-template-rows: auto auto 1fr`），**不要改回绝对定位的整盒 + meta 覆盖**，也**不要漏掉列定义**（漏了海报会按 JPG 固有尺寸渲染，实测 158/54/90/59/54/24px）。索引药丸（`.film-card-no`）与 OPEN chip（`.film-card-sleeve`）均已 `display: none`；选中态靠**可区分的环**（静止 0.1 / hover 0.2 / 选中 0.34）与 meta 的 accent 上边框两层。**详情区不放图**。
- **索引列表（音乐）没有逐行发丝线**，靠 `padding-block` 与间距分组，用 64px 封面取代序号。**书（书架）与球队（手风琴）都已不在 `.idx-*` 里**：球队换成手风琴后，`.idx-no` / `.idx-logo` / `.idx-line` 三条孤儿规则连同 720px 下的两条响应式覆盖一起删掉了。
- **音乐每行必须渲染 64px 真封面**（`window.MUSIC_COVERS`）；缺图回落同尺寸空 sleeve。不要恢复 `counter(track)` 编号，也不要给 `.idx-artist` 加回大写 + 字距。
- 图片默认低饱和、hover / focus 复原：这是「颜色是奖励不是壁纸」的落点。滤镜只加在 `img` 上。
- **照片图注仍在 DOM 里，但视觉上是 `sr-only`**：墙不显示任何文字（参考站也没有），灯箱与读屏照读。键盘可达性不变——按钮仍在、`aria-label` 未改、11 张仍各是一个 tab stop。

## 内容更新

- 摄影：`.photo-frame`（**正典 11 帧必须留在 HTML 里**，放在 `.photo-fallback` 网格里；墙在第一次打开时把它们搬进 `#photo-wall` 并克隆出装饰性重复），`photo/` 与 `photo/full/` 都放。新增照片数会被几何自动吸收，其它地方不用改。
- 游戏：`.hof-item`（直接进 `#hof-grid`），封面 `covers/`，时长写 `.hof-hours`，引文写 `.hof-quote`。
- 影视：海报 `posters/<ttID>.jpg`，条目进 `film-data.js` / `series-data.js`。
- 音乐：`data-song-id` 必须经网易云接口核实，禁止凭记忆填造；加进 `music-data.js` 对应组 `tracks`，计数自动。新歌封面从网易云 `song/detail` 的 picUrl 取 500px 存进 `album-covers/`，再跑 `archive/music-album-covers/index.json` → `js/music-covers.js` 的重新生成。
- 书：条目进 `js/book-shelf-data.js`，每本除了 title / author / blurb 还要给 binding（`thickness` 21–48、`height` 240–288、`lean`、`cloth`、`ink`、`band`）；**新增或换布色必须重量 ink/cloth 的 4.5:1**。行宽、缩放和书脊字号都会自己算。
- 球队：logo `logos/`；队名是官网直达真链接（`target="_blank" rel="noopener"`）。
- 增删内容同步 `#about-stats` 的计数（`data-count`）与 hero 统计条。

## 改完自检

1. 双击 `index.html` 可用；无外部 CDN；控制台无 404。
2. 无新增长帧；reduced-motion 不破布局；引用资源无 404；`?v=` 已递增。
3. 纯键盘走查；320px 与 200% 缩放不裁剪；对比度实测（玻璃按叠加底色）。
4. 视觉回归自检：强调色命中元素仍 ≤ 25；圆角仍只有四档；没有复活退役清单里的任何一项。
5. 玻璃自检：模糊声明仍在增强之前；增强门仍是 `html.has-lens`（不是 `@supports`）；没有把玻璃放进横向滚动容器；没有给任何玻璃元素或其祖先加 `opacity < 1` / `filter`（`transform` 是允许的）；新玻璃层补齐了三条回退。
6. tab 条药丸自检（导航条已无药丸，不要去那里找）：`moveTo` 在**所有**选中路径上都调用了（点击 / 方向键 / Home / End / 拖拽提交）；**拖动中与落位后药丸都精确等于某一栏的矩形**（CDP 量，别靠眼看）；`Escape` 与 `pointercancel` 不改选中态；`≤720px` 拖拽已禁用但 tab 仍可点。
7. 提交并推送 `origin/main`。

## 回滚

重构前的状态标记在 git tag `pre-redesign`，工作分支 `redesign/v2`。