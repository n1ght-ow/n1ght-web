# N1GHT CHXN9 - 项目约定

纯静态个人收藏站：`index.html` 双击即用，无构建、无 npm 运行时依赖。改动必须先读本文件。

设计事实源是 `DESIGN.md`（token / 排版 / 玻璃配方 / 实测对比度）；本文件管操作约定与红线。

**V2（2026）已整体重构视觉层**：从「装饰过载的亮色奢华」改为**编辑式影像档案 + 液态玻璃控件**。本文件已同步退役清单，不要复活下文列出的任何东西。

## 硬性禁区

- 不增删改 `.venv/`；不修改或删除 `photo/` 原图。新增照片时 `photo/` 与 `photo/full/` 两处都要有文件。
- 不引入外部图床 / CDN，图片、字体全走项目内相对路径。运行时外链（豆瓣条目页、网易云歌页 / APP 深链）只做内容跳转，不嵌 iframe、不加载外部资源。
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
| 色彩 | 暖金沙色板（`--sand-*` / `--gold-300` / `--ink-400`）已被中性纸墨 ramp 取代；**单色强调（`--gold-400/700/100` 香槟金）已被天蓝一对（`--sky-400/700/100`）取代**。书脊 / 封面 / 海报 / 唱片封面的原色**不在退役范围内**——那是藏品。**2026-09-29 追加：分区底色**（`--color-bg-deep` / `--paper-100` / `.archive` 自己的 `background`）——2026-03 又被 V3 推翻，见「视觉基调」；**hero 影像的暖金/洋红原色**也一并退役（换成调进色板的双色调） |
| **材质** | **V3（2026-03）整体退役液态玻璃**：`backdrop-filter`、`#lg-lens` / `#lg-nav` 两条折射链、`html.has-lens` 门、`js/glass-lens.js`、轴向棱 `.glass::before`、内斜面 bevel 三件套、`--glass-control/-dark/-blur/-bead-w/-bloom`、`glass--simple/-sm/-dark`、**三条回退机制**（正常态已是实底，没有可回退的东西）。类名与 DOM 契约**保留**（见「印刷面」）。**不要把任何一层加回来**——理由与实测写在 `css/glass.css` 的文件头 |
| **装饰** | **V3：任何发光 / 任何模糊投影 / 任何 `mix-blend-mode`**。深度只有一个来源：硬边方形偏移。**这一条是有实测的**——把 `mix-blend-mode: screen` 的光晕加在 hero 上，字标对比度从 base 的 4.44:1 掉到 2.75:1；`color` 混合 1.91:1。混合与亮度滤镜都碰字标背后那层板的最亮像素，而那是 190px 白字唯一的对比度来源 |

**形状一致性锁**：全站只有 `--radius-sm/md/lg/pill` 四档。出现 `2px` / `9px` / `50%` / 24px 之类的散值即为回归。

## 技术约束

- 单页静态：`index.html` + `css/` + `js/`。脚本在 `<body>` 尾部按这一条顺序加载（**改顺序要同时改这里**）：vendor（`gsap` → `ScrollTrigger` → `lenis`）→ 数据（`film-data` → `series-data` → `book-shelf-data` → `music-data` → `music-covers`）→ 工厂（`reel-stage`）→ stage（`film-stage` → `series-stage` → `music-stage` → `book-shelf` → `photo-deck` → `games-stage`）→ `glass-pill` → `smooth-cursor` → `main`。**`glass-lens` 与 `theme-switch` 已随 V3 删除，不要加回来**（见「印刷面」与「三套皮肤」的退役说明）。**`js/vendor/SplitText.min.js` 已不再加载**：它唯一的客户是 ABOUT 的自述段落，随整块退役（文件还留在 vendor 里，没人引用）。
- **样式表顺序**：`fonts.css` → `style.css` → **`glass.css`** → `reel-stage.css` → `film-stage.css` → `series-stage.css` → `book-shelf.css` → `photo-deck.css` → `games-stage.css` → `smooth-cursor.css` → **`poster.css`（必须最后，见「印刷面」）**。`glass.css` 提供 `.glass` 基类，必须在组件样式之前；`poster.css` 重新声明了前两者设过的属性，所以必须在它们之后。
- 缓存失效：改了哪个带 `?v=N` 的 css/js 就把它的版本号 +1；改数据文件时给对应 `<script>` 补挂 `?v=`。
- **绝不用 PowerShell 重写本仓库的任何文件。**`Get-Content -Raw` 在 PS 5.1 上按 ANSI 码页解码，`[System.IO.File]::WriteAllText` 再按 UTF-8 写回——这两个一起来的净效果是把**每一个非 ASCII 字符**换成乱码，而 `index.html` 里有中文、有 `←` `→`、有 46k 的内联 SVG data URL，损坏后**肉眼看 HTML 是「有中文乱码」，只有渲染出来才知道**（V3 这一轮真的发生过：箭头变成 `闖?/button>`，球队那段中文全毁）。要批量改文件用 harness 的 edit / write 工具；非要用 PowerShell，就显式走 .NET 并自己验一遍无损：`[System.IO.File]::ReadAllText($p, (New-Object System.Text.UTF8Encoding($false)))` 配 `[System.IO.File]::WriteAllText($p, $c, (New-Object System.Text.UTF8Encoding($false)))`——这两个显式重载是无损的（已实测 byte-identical），而 `Get-Content` / `Set-Content` 不是。
- GSAP/ScrollTrigger/Lenis 走本地 `js/vendor/`（SplitText 已停用，见上）。Lenis 仅非 REDUCED 启用；锚点跳转统一走 `lenis.scrollTo`。
- 内容归属红线：`#panel-books / films / series / music / sport / games` 六个面板各放本类内容，禁止跨面板搬移或新增；标识符沿用现有 token。
- 中文内容行加 `lang="zh"`（回退系统字体）。
- **`.tab-panels` 必须保持为 `#archive` 的直接子元素**：`initArchiveTabs()` 用 `tabbar.closest("#archive").querySelector(":scope > .tab-panels")` 定位，包一层 `.shell` 会让整个 tab 系统静默失效。它的容器约束写在 `style.css` 里。

## 视觉基调（项目身份）

Design read：个人影像档案，受众是同好与自己。气质 = **编辑式画廊**：纸感中性底、克制的排版、影像优先，开场是一个巨型字标。
对应 dial：`DESIGN_VARIANCE 6 / MOTION_INTENSITY 4 / VISUAL_DENSITY 4`。

**核心判断**：照片是页面上唯一被允许彩色的事物。界面不得与图片抢注意力——这决定了下面几乎每一条规则。（**唯一的例外是 hero 那一张影像**，见下。）

- **整页是一张纸加两头**（2026-09-29 色彩层重建的第一条纪律）。此前 hero 是黑、纸面是白、归档是一整块浅蓝、再白、再黑，四道硬切让每一部分都像别人的页面。规则因此收紧成：**任何一个章节都不许有自己的 `background`**，photography / archive / poem 全部落在 `--paper-050` 上，章节之间只靠 `--section-y` 的留白分隔。**2026-03 V3 推翻这一条：每章重新有了一张 `--ground-*` 底**（token 在 `style.css` 的 `:root`，实现在 `css/poster.css`）。「一张纸」是对的，**「一张没有区别的纸」不是**——海报由多张纸拼成，每张纸有自己的色温。底是**无边的渐变**（不是分色块：硬边让每章像别人的页面，而四条硬切正是这条纪律当初要治的病），七条 `--ground-*` 的最暗档全部过了 `palette-contrast.mjs` 的 muted 地板（4.63 – 4.97:1）；**改任何一条都要重跑那个脚本**。要颜色就做成**有边界的物件**（圆角 + 描边）——`--color-surface-tint`（`#E6F2FC`，球场的托盘、书架舞台的远角）或 `--color-media-void`（`--paper-200`，空的媒体格）。**`--color-bg-deep` 与 `--paper-100` 已退役，不要复活**：前者是「归档区有一张自己的底」这个角色的唯一载体，那个角色已经删了。
- **明暗**：正文页全亮色纸面。暗色只用于三处——**hero（承载巨型字标）**、`#lightbox`、`.footer`。hero 自 2026-09 起只剩字标，字标压在**一层全幅双色调影像**上（`hero/lujiazui-duo*.jpg`，见「站点结构」与 `DESIGN.md` 第 7 节），影像在最后 `--hero-fade` 里**渐隐**进纸面；它**仍然是暗区**；不要把任何普通分区反转为暗色。
- **色彩（V3）**：暖奶油纸 ramp（`#FAF6EE` / `#FFFDF7` / `#E4D9C6`）+ 海军蓝版油墨（`#16203C`）+ **钴蓝** `#3157FF` 填 / `#1B32B8` 说，另加三块印版 `--accent-2` 荧橙 / `--accent-3` 酸绿 / `--accent-4` 品红（各有 `-ink` 说话版本）。**禁纯黑 `#000`、禁纯白 `#fff`**（用 `--ink-950 #101A33` / `--on-dark #FFF4E4`）。「禁紫」随 V3 解除：品红是第四印版，只经 `--accent-4-ink` 当文字（7.18:1）。accent hue = 可交互，静态文字只有诗区叠句一处例外。**为什么是「一对」**：一个色撑不住两种角色，`#59BFEA` 压在纸面上是 1.90:1（当文字等于没有），`#006D9E` 当实底是一块死掉的矩形——浅的负责填，深的负责说。
- **强调色配额**：全站命中元素 **≤ 25**（V1 是 182，V2 是 14）。新增一处强调色就要问自己是不是在稀释它。**也不要出现第 5 个 accent 值**：任何「看起来像强调色」的硬编码都必须写成 `var(--sky-*)` 或 `color-mix(... var(--sky-400) ...)`（球场的选中环曾经就是一个裸 `oklch(0.78 0.11 220 / …)`）。**2026 色相重置：这条从「一个色有配额」改成「每套 skin 四个，且只从 `--sky-*` 与 `--t-accent-1..4` 出去」**——组件文件里仍然一处硬编码都不许有，理由从「配额」换成「换肤必须能整体换掉」。
- **藏品保留原色**：`js/book-shelf-data.js` 里 16 组 `cloth / ink / band` 是书本身的颜色（照片、海报、唱片封面同理），**换色板时不动它们**——它们是页面上唯一被允许「不听话」的颜色。
- **留白优先于线条**：分组靠间距与留白，不靠描边、底色块、分隔线。分隔线只给密集表格数据。
- **图片优先于装饰**：任何新装饰元素都要先回答「它有没有在和照片抢注意力」。

## 液态玻璃（V2 核心，**V3 已整体退役**）

**这一节是 V2 的历史记录，不是现行配方。**玻璃的六层、折射链、`html.has-lens` 门、`js/glass-lens.js`、轴向棱与三条回退**已在 2026-03 全部删除**，理由与实测在 `css/glass.css` 的文件头与「印刷面」一节。现行的是**印刷面**：类名与 DOM 契约不变，材质全换。

下面保留的是**仍然有效**的部分——它们不是关于玻璃的，是关于 `js/glass-pill.js` 与 `.glass` 基类的用法纪律，换了材质依然成立。

**仍然成立的四条**（原为玻璃而写）：

1. **`transform` 在自身和祖先上都安全；`filter` / `opacity < 1` / `mask` / `mix-blend-mode` 不安全**（`filter` 还会创建包含块，所以绝不能加到任何含 `position: fixed` 后代的容器上——`#lightbox` 是 fixed）。`transform` 在**自身和祖先上都安全**——这是「药丸每帧被 transform 拖动、玻璃仍然成立」的前提。两条推论：**药丸绝不能用 opacity 淡入**；按压环必须是独立元素，不能靠改 `.glass__edge` 的 opacity 淡入。
2. **能力门不要写在 `@supports` 里**。当年折射链的门是 `html.has-lens`（一个 JS 设的属性）而不是 `@supports`：Safari 解析 `url()` 后 `@supports` 返回 true 却不渲染，而 Chrome 152 上它又返回 false——**等于这个增强从来没有生效过，却一直有人在读它的代码**。那条链连同 `html.has-lens` 与 `js/glass-lens.js` 已整条删除（见「导航条」），**留在这里的是那条读法**：`@supports` 查的是「解析器认不认这个值」，不是「渲染器画不画得出来」，两件事不一样。真的要做增强就把门设成一个 JS 写给 CSS 读的属性，并让 CSS 在门关着时给出仍然好看的实底。
3. **不把抬起来的层放进横向滚动容器**。绝对定位的托盘层会跟着内容一起滚，在滚动容器里它要么永远对不齐、要么直接跑出去。`≤720px` 的 tab 条与流派行都因此转实底并 `display: none` 掉那两层（**这条与 `backdrop-filter` 无关**，纯定位），药丸在该宽度下也禁用拖拽。
4. **药丸的尺寸是量出来的，不是继承来的**。当年给它写的那张位移图内部压平形状按宽扁条约 16:1 制作，放到 95×40 的药丸上会变形、中心不再是中性、整颗被放大成亮斑（已复现）。**今天药丸是钴蓝实底 + 一条 4px 硬边偏移，没有任何图像**，但那条教训还在：任何跟着指针走的形状都要按它自己的盒子写，不要拿一个通用滤镜去套所有尺寸。

回退**只剩一条**：`glass.css` 里 `prefers-reduced-transparency: reduce` / `prefers-contrast: more` 那个块，而且它管的不是「浏览器支不支持」而是「用户不要透明」——画框改实线、偏移被关掉时补 `outline`。另两级（`@supports` 无 backdrop-filter、`html[data-transparency="solid"]`）随 V3 删除，正常态已是实底，没有可回退的东西，**不要补回来**。

**抬起来的托盘只给浮在内容之上的控件**：`header.nav`、`#archive-tabbar` + `#tab-pill`、音乐工具条的两条 bar（`.music-search` 与 `#genre-filter`，见「三条 bar」），以及未来的浮层。纸面上的按钮用实心色——**理由从「没有东西可折射」换成了「实底托盘会盖住纸」**：托盘是 `var(--paper-000)`，压在 `--paper-050` 的纸面上只会得到一张比周围更亮、边界更硬的矩形，而没有第二个理由支撑它浮起来。

**唯一的例外是 `.glass--accent`**（影 / 剧详情区的 `OPEN ON DOUBAN`），它保留类名是因为 `.glass` 契约被全站绑着，而它现在**不是玻璃也不是染色**：`glass.css` 里它只是 `--glass-radius: var(--radius-pill)` + 一条 `5px 5px 0 0` 的硬边偏移（ink-950 @26%）+ `.glass__body { background: var(--sky-400) }`，与音乐那两枚药丸的钴蓝实底同色。**当年那条「52% 染色配比」连同它的 12.61:1 一起作废**——那是在测一个半透明染色层，今天这个角色由 `--color-on-accent` 在实底上翻面标签承担（4.90:1，见「印刷面」）。

**选中药丸 `js/glass-pill.js` 现在只服务 `#archive-tabbar` 一条**（导航条那颗已退役，见「导航条（Liquid Glass Navbar 形态）」；同 `reel-stage.js` 的纪律：一个实现，调用点只传配置）。改它之前先读 `DESIGN.md` 4.6。四个要点：位置**吸附到指针所在的那一栏**（药丸任何时刻都精确等于某一栏的矩形，所以拖动中它也是「填满」的）、宽度与位置走同一个 180ms 补间；**抓取只加深阴影、绝不缩尺寸**（`scale: 0.94` 已退役：90px 的栏只被 84.6px 盖住，看起来就是没落到位）；**没有启动阈值**（点击 = 零位移的拖拽，所以没有「点了没反应」的死区）；`Escape` / `pointercancel` 回到**已提交**的栏且不改选中态。药丸是 `aria-hidden` 装饰，真正的控件仍是 `<button role="tab">` 与 `<a href>`。

## 排版（DESIGN.md 第 2 节）

- **双寄存器系统，9 个 `--fs-*` token 封顶**：UI 档 5 个（11 / 12 / 13 / 15 / 16px）+ 展示档 4 个（`--fs-h4` 20、`--fs-h3` 20→25、`--fs-h2` 31→49、`--fs-display` 39→76，模数 1.25）。两者之间的空档是刻意的，不要插中间值，也不要新增第 10 个 token（DESIGN.md 2.2）。
- **hero 字标是 logotype，不是第 11 个角色**：`N1GHT CHXN9` 一个字符串、一个字号，字号按 `.hero-inner` 的内容列算（`--masthead: 12.5cqw`，见 `css/style.css` 第 7 节）。字号表不动。
- **红线**：`text-box-trim` **只给展示档标题**（`.display` / `.sec-title` / `.footer-name`；coda 已退役）。它移除降部空间，与 `overflow: hidden` 同用会切掉降部——曾把「Maybe」渲染成「Maube」。
- `line-height` 一律 unitless；标题 `text-wrap: balance`，描述 `pretty`；会变的数字 `tabular-nums`。
- 字重只用 400 / 500。层级由字号与留白承担，不由加粗承担。
- 英文文案禁 em dash（用句号 / 逗号 / 冒号重写）；中文破折号不受限；en dash 只用于范围；正文用弯引号。

## 颜色（DESIGN.md 第 3 节）

- 两层 token：原语按 hue（只进 token 层），组件只准用**语义层**；缺角色就新增语义 token，绝不借用近值。
- 对比度**实测不估算**，工具是 `archive/color-audit/`（`capture.mjs` 截图 + `pixel-contrast.py` 取像素比值；读法见那份 README）。已实测的关键值（2026-09-29 双色调 hero + 无分区底色）：ink-900/paper-050 15.40:1、ink-600 7.26:1、**ink-500 4.93:1（muted 的唯一合法值；地板是 `--color-surface-tint` #E6F2FC 上的 4.60:1）**、**sky-700/paper-050 5.38:1（链接 / 焦点环 / 诗区叠句）**、ink-900/sky-400 7.83:1（实底按钮上的字）、**导航玻璃压在双色调 hero 上最差 5.56:1（390 宽 5.43:1）**、**hero 字标压在影像 + 蓝纱上最差 4.25:1（1440×900；1100 4.50 / 390 5.74 / 320 6.16）**。
- **`--ink-400` 一类浅灰不得用于小字**；muted 一律 `--ink-500`，且**改 `--sky-050` 就要重测 4.60:1 那一条**——球队托盘是 muted 出现过的最深底面。**改 `--paper-050` 就要重测 4.93:1**。**`--paper-100` 与 `--color-bg-deep` 已退役**，那条 4.71:1 的地板随之作废，不要再引用。
- **强调色是「一对」不是「一个」**：`--color-accent`（`#59BFEA`）只做实底与下划线，`--color-accent-text`（`#006D9E`）做文字、焦点环、诗区叠句。**浅色压纸面是 1.90:1，不许拿它当文字**；深色当实底是一块死掉的矩形。**全站焦点环只有 `--color-accent-text` 一个色**（实测压在 `--ink-950` 上 3.14:1，刚过非文本 3:1 下限——**这就是 `--ink-950` 没有跟着这次一起加深的原因**：试过推到 `#0D1B27`，这条掉到 3.06:1，不值）。
- **导航条不再有 alpha，也不再有这条约束**：`--glass-nav` 现在等于 `var(--paper-000)` 实底，「不得低于 0.76」连同那批实测数字（暖色板 5.15:1 / 天蓝 5.39:1 / 双色调 hero 5.56:1）**已作废，不要再引用**。当年那个真实的问题（α0.60 时标签只剩 3.10:1）今天不可能发生；**留在这里的是量法**：把链接藏起来、截屏、逐像素取托盘最亮那一点算比值——工具在 `archive/color-audit/`，只要哪条 bar 重新有了 alpha 就把它捡回来。
- **藏品颜色不进这套色板**：书脊 `cloth / ink / band`、照片、海报、唱片封面一律保留原色（见「视觉基调」）。**它是全站唯一不受强调色配额约束的颜色来源**，双色调只碰了 hero 那一张。
- 每视图只一个实心填充主操作；修对比度只动 lightness，不动 hue。

## 动效（DESIGN.md 第 6 节）

- 四条命名缓动：`--ease-out` / `--ease-soft` / `--ease-in-out` / `--ease-snap`。不再新增一次性曲线。
- **光标是另一个明文例外**（`js/smooth-cursor.js`，Framer Smoothcursor 的移植）：它要的是指针的**滞后量**，所以内部是三条**不过冲**的弹簧（ζ ≥ 1，实测 1.13 / 1.73 / 1.01），与 `back.out` / `elastic` 无关。它自己管开关（指针 coarse / 窄窗 / reduced-motion 下不挂载），不要当回归删掉。见 `DESIGN.md` 6.4。
- 现有动效每一个都能一句话说出动机；新增动效说不出的就删。
- **弹性已退役**：不用 `back.out` / `elastic`；低频入场用 `power3/4.out`。这条管的是**过冲曲线**，不是「JS 里不许有缓动」——书架用 GSAP 的 `power3.out` 落位、`expo.out` 跟随指针，两者都不过冲，也是上游 spring 的等效时长。
- 性能红线：只动 `transform` / `opacity` / `filter`；scrub 必须 `invalidateOnRefresh: true`；图片加载后 refresh 用 250ms debounce（**影视条带的全量重测 `setupMode()` 也并进这 250ms**，只有「空 lap 的第一次」立即跑）；滚动监听只走 ScrollTrigger / IntersectionObserver / Lenis。
- **rAF 循环空闲即停**：`photo-deck.js` / `reel-stage.js` 都是 `frame()` 开头清 `raf`、结尾按 `busy()` 决定要不要 `kick()`，停的时候把 `state.last` 一起清零（不清就等于把整段空闲当成一帧 50ms 积分）。要唤醒就调 `kick(state)`：`selectIndex` / `endSwipe` / 拖拽起手。**拖拽是例外路径**——它直写 `paint()` 不经过 `kick()`，所以 `.photo-deck.is-live` 要在拖拽起手时手动加。`gsap.ticker`（Lenis 靠它驱动）本来就常驻，那是另一回事。
- **层提升跟着动作走，不跟着页面走**：`.photo-frame` 的 `will-change` 挂在 `.photo-deck.is-live` 上，游戏拨盘的挂在 `.hof.is-live.is-dragging` / `.is-gliding` 上（`goTo` 加、`stopGlide` 与 `onComplete` 撤）。静止时挂着 = 几十个常驻合成层。
- `transition-property` 写具体属性，禁 `transition: all`。
- **`filter` 会创建包含块**：图片滤镜只加在 `img` 上，绝不加到任何含 `position: fixed` 后代的容器（`#lightbox` 是 fixed）。
- `main.js` 的 `MOTION` 常量保留复用，现在只有 `feedback` / `enter` 两类（`spring` 已随弹性退役一起删掉，新代码不要加回来）。
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
- **全页只有两条边，浮在上面的和贴边的都必须落上去**（2026-09-28 实测后立为纪律，详见 `DESIGN.md` 5.1）：
  - **`header.nav` 与内容列逐像素共轴**：`width: min(calc(var(--shell) - 2 * var(--gutter)), calc(100% - 2 * var(--gutter)))`。它此前是 `min(1180px, 100vw - 2×gutter)`，1440 下 x=130，而内容列是 65..1375 —— 整站最持久的那条对齐线是唯一一条不跟页面对齐的线。**用 `100%` 不用 `100vw`**（`100vw` 含经典滚动条），**不要塞回字面宽度**。当年这条要「重跑 `DESIGN.md` 4.10 的折射实测」，是因为折射链会按量出来的盒子现算位移图（所以 `glass-lens.js` 里没有任何 bar 宽度）；折射链整条删除后那条联动没了。**今天改这里只需要重量对齐**：`header.nav` 的左右边缘必须与 `.shell` 的内容列逐像素相等（1440 下 65..1375，1100 下 50..1050，320 下 20..300），量法就是量两条边的 x。
  - **摄影章的牌堆贴左边距**（`margin-inline: 0`，原 `auto`），图注与编号是它的**边注栏**而不是章头的第三格，见「站点结构」里的那两条。
  - **版心是唯一的量度**：`.sec-copy` / `.lead` / `.poem-standfirst` / `.poem-sign` **没有** `max-width`——两栏时格子自己量度（1440 下 619px，导语 59ch）。原来 46ch 会在格子里量出 442px，右侧空 177px，于是同一页出现 65px 和 242px 两种右边距。**`≤1100px` 章节头变单列时量度必须回来**（`var(--measure)` 62ch，实测 596px；不恢复就是 1001px ≈ 126ch）。
  - 仍带 46ch 的只有 `.curator`：它铺在整列（1310px）上，那里是全站唯一真正需要量度上限的地方。
- 断点由内容驱动（1100 / 1000 / 900 / 720）。1000 是诗区自己挣来的：两列诗行到 971px 就放不下最长的一行（见「诗（folio）」）。
- **章节头只有一种形状**（`.sec-head`，PHOTO 与 THE ARCHIVE 两处；诗的 `.poem-head` 同规则）：`repeat(2, minmax(0, 1fr))` + `var(--chapter-gap)`（列距在 `:root` 定义一处），眉标 + 标题在左格、导语（`.lead` + 正文）在右格，**两格按基线对齐**（`align-items: baseline`）。旧版是 `align-items: end` + `0.95fr / 1.05fr`，导语的**底边**跟着标题的底边走：标题一行的章节，导语顶边落在眉标上方 11px；两行的落在下方 39px——同一件东西长出两个头（用户指出的「一个高一个低」）。基线规则下眉标与导语首行永远共线，标题的行数只影响头的高度。改列距只改 `--chapter-gap`，三章导语的左边缘因此永远在同一个 x（1440 下 756）。
- 横向滚动器下一项露 16-32px 窥视；移动端按钮内缩 + 安全区。

## 文案

- 先侦察既有语气：本站「中英混排、短句、大写 mono 标签」是**刻意品牌声音**——只修不一致、歧义、轻重失配。
- **藏品短评（书 / 球队 / 影 / 剧）的规矩**：中文**一句**、尽量 ≤34 字、**不写片名**、**不概括剧情**、只抓一个具体的画面 / 动作 / 物件、**不写会过时的年数**（旧文案里的「三十七年过去」就是反例）、少用破折号、不写「这是关于……」的解说腔。同一栏里**不许混两种写法**（series 曾出现前 10 条是诗句、后 9 条是「片名 — 说明」）。
- V2 已把 mono 覆盖率下调并删除大量装饰性大写标签；新增标签前先问是否必要。
- 按钮动词先行；错误说明怎么修；空状态给出下一步；占位符是示例不是标签。

## 代码结构

- `js/main.js` 站点交互层：hero 字标升起（整块出遮罩，不逐字）、滚动揭示、统一详情层（photo / game / music 共用 `#lightbox`；影 / 剧不开浮层）、tab 切换、音乐流派过滤 + 搜索 + SHUFFLE、网易云外链、导航高亮、共享 `scheduleRefresh`。**摄影的例外**：它没有任何滚动动效（牌堆自己会动，`ScrollTrigger.batch` 的入场与 `--photo-drift` 漂移都随散页网格一起删除），点击在 `#photo-deck` 上委托一次。
- 已从 `main.js` 移除：`initCursor` / `initMagnetic` / `spawnBubble` / preloader 时间线 / ticker JS 驱动 / bighead parallax / `.sec-mask` / 计数条 / `#scroll-progress` / 摄影入场与逐张漂移 / **`initCounters` 与 about-stats、about-body、coda 三条时间线（随 ABOUT 面板一起退役）**。
- ARCHIVE 共享工具条与收藏星标已于更早版本整体撤销，不再新增回访入口。
- 签名：已整体退役；`js/sig-data.js` 保留在仓库但不参与加载。

### 印刷面（V3 核心）与海报词汇

2026-03 色相重置的第二阶段，也是第一阶段的收尾。三套皮肤并排比过之后，**`surreal-poster` 胜出并被搬进默认**，另外两套连同切换机制一起删除。删除清单在上面的「已退役」表里，**不要加回来**。

**两件事现在各有一个文件，不要再开第三个**：

| 文件 | 它是什么 | 它的边界 |
| --- | --- | --- |
| [css/glass.css](css/glass.css) | **印刷面**：一个抬起来的物件长什么样 | 类名与 DOM 契约不变，材质全换 |
| [css/poster.css](css/poster.css) | **海报词汇**：五件印刷品的做法 | **组件的布局归组件自己的文件，印刷归这里** |

- **印刷面 = 纸 + 一个硬边方形偏移 + 一条钴蓝画框**。类名全部保留（`.glass` / `.glass__body` / `.glass__edge` / `.glass--pill` / `.glass--accent` / `.glass--spot` / `.glass__press` / `.glass-pill`），因为 index.html、style.css、reel-stage.js、glass-pill.js、main.js 全都绑着它们。**变的是每层的工作**：`.glass__edge` 从镜面棱变成画框（`inset 0 0 0 var(--glass-edge-w) solid color-mix(in oklab, var(--sky-400) 58%, transparent)`），这是唯一真正活着的转换。`.glass--spot` 曾经走过两步——先是跟着指针的十字套准标记，再整体退役（下一条），**所以它的四个属性在 `index.html` 的四行上仍然留着却什么都不画**。
- **`js/glass-pill.js` 不是玻璃**，是一个**跟着指针走的形状 + 拖拽到另一栏**的指示器，这是它在这个站上最好的一个交互。**2026-09 清理时它改过三行**：`SETTLE_MS` / `CLASS_SETTLING`（`is-settling` 全仓无 CSS 规则）/ `settleTimer` 与它们的 classList 对，一起删除——因为 `glass.css` 里一条裸 `.glass-pill { transition: none }` 把 420ms 的 `--glass-pill-travel` 和 180ms 的 `--glass-pill-morph` 全部盖掉了，「落位后单独走一段 morph」这条设计从来没能渲染出来，留着那三个符号只是让 `pill.style.transition = ""` 看起来像在恢复什么。**除此之外别在换材质的时候顺手改它**。
- **套准偏移有一条硬线：40px。** 40px 及以上才给（章节标题、footer 名、190px 的字标），**以下一律不给**，强调色改由颜色承担。**曾经有过一档 1px、三分之一强度的小号版，理由是「半个缺陷不算缺陷」——它算。** 11-15px 上 1px 硬偏移不是套准，是紧挨着正字多出来的另一个错字，而且字面越清晰读起来越糟，正好和「更含蓄」的原意相反。它当时在眉标、页签编号、`.label`、`.meta`、计数和流派数上，全部删除。3px 那档也不是 20px 以上就安全：它在流派标题（25px）和游戏当前标题（25px）上各试过一轮，两处都读成损坏而不是印刷。**眉标的橙影不算这个效果**——那是**偏移整块版**，字不动，11px 也读得清。
- **指针十字套准标记已退役**，`initGlassSpotlight()` 一起删。它是「把高光翻译成印刷语汇」的结果，错了：光标周围四条细线读起来是故障不是印迹，而 96px 的流派行上四条能同时看见三条。**手势是删掉而不是调小的**，喂它的脚本也一起删——一个只写两个没人读的自定义属性的函数，正是本仓库自己那条「不留死代码」禁止的东西。`.glass--spot` 类名暂时留着（四个属性，等有人整体改名玻璃契约时再一起处理），**它现在什么都不画**。
- **胶带只在一个地方：每个货架的左上角。** 它本来还在**照片牌堆的上沿**（两条），那是错的——牌堆是这一页唯一一个边缘「应该只有照片」的东西，而且那里的记号会先于照片被读到，读成故障而不是胶带。已删。
- **海报词汇一共五件，第六件不许有**：`底`（无边的章节渐变）、`版`（硬偏移 + 画框）、`套准`（3px 双色硬偏移，只给展示档字号）、`胶带`（30×13px 旋转小条，**只上角**）、`票根`（打孔边，只给影 / 剧详情块）。每件都写在一处，全站复用同一组数值——**这才是它们成系统而不是十一个各自的好点子的原因**。
- **全站不发光、不用模糊投影、不用 `mix-blend-mode`**。这不是审美，是实测：`screen` 光晕把 hero 字标压到 2.75:1，`color` 混合压到 1.91:1，base 是 4.44:1。**字标背后那层板的最亮像素就是 190px 白字唯一的对比度来源**，动它之前先量。2.75 / 1.91 是 V2 加光晕时量到的历史值（光晕已退役，今天量不到）；**base 是可复测的，2026-09-29 用 `.hero-mask` 的 rect 扫最亮像素重测**：4.44:1 @1440×900、5.90:1 @390×844、6.24:1 @320×780，foreground `--on-dark`。**190px 的字标，AA 线是 3:1，它超出一点五倍**；窄屏更宽裕，所以不要拿窄屏的数字去论证桌面也能过——桌面才是紧的那一档。
- **彩度是深色填充，标签必须翻面**：`ink-900` 压 `--sky-400` 只有 **3.02:1**。所以 V3 声明 `--color-on-accent: #FFF4E4`（**4.90:1**），影 / 剧的 `OPEN ON DOUBAN` 与流派 chip / SHUFFLE 全部读它。**这是 `--color-on-accent` 存在的唯一理由，不要在组件里写死墨色，也不要为了"修好那个 3.02"去调暗填充——填充就是品牌**。
- **三个速度**：`--poster-turn`（章节底 1→0，main.js 写）、`--fs-h2` 的 `.sec-title`（±22px scrub）、`.sec-eyebrow`（±9px）。**正文不参与**（读者用眼睛跟着一行字走，26px 的位移不是氛围是 bug），**照片不参与**（牌堆与条带各自已经是一个 transform 的唯一写入者，第二个写入者就是回归）。六个面板**不挂 ScrollTrigger**（五个在触发时是 `display: none`，量到的是塌掉的盒子；它们的翻页就是 `select()` 里那条 tab 擦除）。
- **胶带只上两个地方**：照片牌堆的两个上角，和每个货架的一个上左角。**角是唯一结构性安全的位置**——横跨标题或图注的胶带是可用性问题，而这个页面有 534 行歌和 24 张海报，一个需要逐个核对位置的装饰早晚会贴错地方。
- **裁切与票根分工**：海报自己**不做票根**（打孔口贴在海报上不像海报），票根给详情块；海报拿的是 1px 墨框 + 选中态的橙色第二印。**静止态不旋转**——十六条海报都歪着读起来像出错，都对齐才读成书架；歪的是 hover。
- **深色区域只剩两处**：hero、`#lightbox`、`.footer` 里的 hero 算一处。**Lightbox 保持暗墙**（V2 的十二个 `.lb-*` 文字对全是对着 `--ink-950` 量的，翻成纸面要重量十二个角色），变的是那张**印品**：10px 卡纸 + 1px 墨线 + 硬偏移的装裱，图注变成票根，缩略图条变成一排票根。**墙还是墙。**
- **书架没有被拍平成排版墙**。它是一个 3D `preserve-3d` 场景，拍平它是重写 `book-shelf.js` 而不是换设计。做的是那部分真正关于字的事：短评变成带橙线的引文，封面标签吃套准偏移，两端各一条胶带。**书本身一根线都没改**——16 组布色是藏品。
- **改任何 token 都要跑** `node archive/color-audit/palette-contrast.mjs`（**它解析 `css/style.css` 本身**，所以数字不会和 CSS 脱节），并把新数字写回 `:root` 上方。合成类（字标压在影像上、画框压在纸上）仍然用 `capture.mjs` + `pixel-contrast.py`；capture.mjs 多两个开关：`--eval` 里的 `return` 随截图回传，`--reduced-motion` 直接看 reduced 下的样子。

### 三套皮肤（THEMES，已删除）

2026-03 的第一阶段：`neon-lab` / `surreal-poster` / `future-archive` 三套浅色皮肤并排比较。**`surreal-poster` 胜出**并被搬进默认（见「印刷面」），另外两套与切换机制已删除，完整清单在上面的「已退役」表。**当时记下的教训保留在这里，因为它们是 V3 的设计依据**：三套皮肤之间只经 token 相通，组件文件一处硬编码都不许有；**hero 影像不许被改亮度**（`screen` 光晕 2.75:1、`color` 混合 1.91:1、base 4.44:1）；深色填充上的标签必须翻面（钴蓝上的墨字 3.02:1，浅字 4.90:1）。
### 导航条（Liquid Glass Navbar 形态）

应要求把 `header.nav` 换成 Framer Liquid Glass Navbar（`framer.com/m/Liquid-Glass-Navbar-6gh01a.js`）的**形态**——参考实现本身是液态玻璃，本站不是；**借的是那条形（居中托盘 + 上下两条发丝线 + 一条硬边偏移），不是它的材质**。当年抄进来的镜片棱、轴向棱与六层投影都已随 V3 退役，材料今天全在 `css/glass.css`。当年那张对照表见 `DESIGN.md` 4.9。

- **当年借过三件事，今天三条都已经改掉**：镜片棱（pill 当时 9px）、轴向棱（上下都亮 + 暗侧轨）、以及参考那六层「宽、软、极低 α」的投影（写进 `--glass-elevation`）。印刷语汇下它们各自的新归宿是：棱 → `.glass__edge` 那条钴蓝画框（裁切线，2px）；轴向棱 → 上下同一条发丝线（bead），暗侧轨不留；六层投影 → 一条硬边方形偏移（见下面 `--glass-elevation` 那条）。**留在这里的是取法**：从参考里只取形状语言，把「深度」交给本站唯一那一个来源，不让它长出第二个。参考的 logo 宝石、菜单项、`Get Started` 按钮是它的**内容**不是形态，**没有抄**。
- **折射已整条退役，V3 不再有任何 backdrop 读取**：`#lg-nav` / `#lg-lens` 两个 SVG 滤镜、`index.html` 里的 `html.has-lens` 闸门与两处 `has-lens` 块、`js/glass-lens.js` 全部删除，`glass.css` 顶部「WHAT WAS DELETED」逐项记了它们在哪。**理由不是玻璃过时**：本站现在的隐喻是印刷，而印刷品不需要折射任何东西，也就不必为它付费。`DESIGN.md` 4.2 那张「什么会杀死 backdrop 读取」的整表随之作废——**没有 backdrop 可读**。
- 覆盖必须写成 **`.nav.glass …`**：`.glass` / `.glass--pill` 在 `glass.css` 里且**后加载**，bare `.nav` 的同名声明压不过它。同 `.tabbar.glass` 那个坑；新的 `background: var(--glass-nav)` 也踩了一次。
- `--glass-elevation` 定义在 `glass.css` 的 `:root`，**V3 起是一条硬边方形偏移**（`6px 6px 0 0`，ink-950 @16%），`.glass` / `.glass--accent` / `.glass-pill` 读的是各自那一份。**改高度只改这三个 token**，不要在任何组件里手抄第二个投影——「深度只有一个来源」就是这条的意思。
- 这条 alpha 的账**已经结清了**：`--glass-nav` 与 `--glass-panel` 现在都等于 `var(--paper-000)`——**实底**。V3 的托盘不再有「底下压着什么」这个问题，所以「导航玻璃底色不得低于 α0.76」这条约束连同它的实测数字（暖色板 5.15:1 / 天蓝 5.39:1 / 双色调 hero 5.56:1）一起作废，**不要再引用它们，也不要再给 `--glass-nav` 加回 alpha**。**留在这里的是方法**：这批数是把链接藏起来、截屏、逐像素取托盘最亮那一点算出来的（工具 `archive/color-audit/`），**别拿合成值当实测值**——今天托盘是实底，所以数字好算了，但只要哪条 bar 重新有了 alpha，就要把这套量法捡回来。
- **六层投影连同它那轮 alpha 抬升一起退役**，理由在 `css/glass.css` 的文件头：V3 的判断是「深度只有一个来源，而且那个来源必须是硬边方形偏移」，六层软投影无论多淡都是第二个来源。导航条因此改读 `--glass-elevation` 的 6px 硬边。**当年那条教训仍然成立、只是换了载体**：`header.nav` 是 `fixed`，纸面上也整天停着，所以「让它在纸上可见」这件事今天由硬偏移 + `.glass__edge` 画框承担，不由光晕承担。
- 内容面板整块**不抄**，这条现在更简单：参考靠 backdrop 读出颜色，本站没有 backdrop 可读。退一步照抄的那条 bevel（`inset 0 ±1px 1.5px`）也早已撤掉——它渲染出来是**画框内部多出来的一圈细线**，而印刷品只有一条裁切线。**不要往 `.glass__edge` 里加第二圈。**
- **导航条不再有选中指示器**（应要求）：`#nav-pill` 元素、`main.js` 的 `createGlassPill()` 调用、`.nav-links.is-dragging` / `.is-drop-target` / `cursor: grab` 全部删除。选中态改由墨色承担（active `--color-text` / 兄弟项 `--color-text-secondary`）。代价是失去「拖药丸跳章节」这个手势——它不是无障碍通道，但确实少了一条捷径。`js/glass-pill.js` 与 tab 条不受影响。

### 三条 bar（同一张纸托盘）

三条 bar —— `#archive-tabbar`、`.music-search`（搜索行）、`#genre-filter`（流派行）—— 现在是**同一张抬起来的纸**（`.glass`），内距 6px、条目间距 4px、条目 40px，选中 / 主操作是**同一颗钴蓝印版**。形状**只有一个例外**：流派行是 **`--radius-lg`（22px）的大圆角矩形**，不是胶囊（用户第四轮要求：宽度跟搜索行一样、角是手机上那种四分之一圆）。形态最初借自 Framer Compact Navbar（`framer.com/m/Compact-Navbar-cE1IzB.js`）与 Blur Navigation（`framer.com/m/Blur-Navigation-iGYrtY.js`），**材质是本站的**（用户第三轮明确：三条都做成标签条那样）。完整表格见 `DESIGN.md` 4.8。

- 三个容器内距都是 6px、条目间距 4px。`.tab-btn` 目标仍是 **40px**：参考实现的条目只有 29px，**没有照抄**（桌面 40×40 是硬线，紧凑只能落在横轴——条目内距 1.25em → 1.05em）。
- `#archive-tabbar` 仍然是那张抬起来的纸（浮在内容之上，托盘本体），选中药丸仍然是 `js/glass-pill.js` 那一颗。**拖拽语义是在这一轮改的**：从「跟着指针 1:1 悬浮」改成「吸附到指针所在的那一栏」，并退役了 0.94 的抓取缩放——两者都是「拖到最右边小胶囊填不满」的原因（见「液态玻璃」里的药丸四条）。选中 / `moveTo` / `Escape` 的契约没动。
- **没有任何一行是 sticky**（用户第三轮的明文要求，覆盖第二轮「流派常驻」）：标签条、搜索行、流派行**都随列表滚走**。`#genre-filter` 与 `.music-bar` 仍是**兄弟节点**，但理由只剩布局。因此 `alignGenreTop()` 的落点基准从「sticky 板读出的 pinned 几何」改成**固定导航条的底边**（`header.nav` 是 `fixed`，任何滚动位置都诚实）——不要把 sticky 读法加回来。
- **材质就是 `.glass` 本体，不要再手写第二套**：三条都读 `glass.css` 的 `--glass-panel`（**`var(--paper-000)`，实底**）+ `.glass__edge` 画框 + `--glass-elevation`（一条硬边方形偏移）。**没有 `blur()`、没有 `saturate()`、没有 `brightness()`**——V3 禁 `backdrop-filter`，所以下面两条曾经靠「去掉 brightness 防止削顶」解决的坑都随它一起不存在了。**流派行原来那套手写 Blur Navigation 板（`blur(26px)` + 纸 @16% + 墨 12% 环）已随吸顶一起退役**；随之消失的还有它那条「压在深色封面上 muted 标签远低于 4.5:1」的豁免——没有东西从板下穿过了，最差底色就是纸面。**2026-09-29 复测**（归档区底色删除后，三条都直接压 `--paper-050`）：chip 标签 ink-600 压在标签条托盘上 **7.53:1**、搜索行 **7.45:1**、流派行 **7.54:1**、占位符 ink-500 同面 **4.94:1**、选中 chip 压在墨色药丸上 **10.07:1**。**注意这条玻璃托盘比页面纸面更亮，所以 muted 的地板仍然是 `--color-surface-tint` 的 4.60:1，不是这条托盘**——**改 `--paper-050` / `--sky-050` 或改 `--glass-panel` 的 α 都要重测这几个数**。
- **玻璃层必须是 .glass 的静态子元素**，而且必须在内容**之前**：两层都是绝对定位，静态的 chips / 输入框会被画在它们下面。流派行的渲染器（`js/music-stage.js`）只 `appendChild`、从不清空容器，所以 index.html 里写死的两层安全；`#genre-filter` 的 chips 必须抬到 `position: relative; z-index: 4`（`.tab-btn` 同一个理由、同一个值）；搜索行的 `.music-search > .glass__content` 吃玻璃基类的 `z-index: 3` 就够。
- **宽度**（用户第四轮的最终形态：实测 577 / 1275 / **1275**）：标签条仍是 `max-content`；搜索行与流派行**逐像素同宽**（都等于 `.music-drawer` 的内容列，流派行就是普通块级，不需要任何宽度算式）。第三轮那条「流派行 = 导航条 1180、居中靠 `calc((100% - var(--rail-w)) / 2)`」**已退役**——不要再抄回来。
- **只有流派行不是胶囊**：`--glass-radius: var(--radius-lg)`（22px）。形状一致性锁只有四档，所以 22px 是唯一合法的「大圆角但非胶囊」值；要更圆就得新增一档 token，那是破锁的决定。**`--glass-edge-w` 三条共用 `2px`**，没有 9px 也没有 13px 那两档了——画框是裁切线，一像素级的重量由「它是一条线」本身承担，不需要按面的大小分档。
- **「三条同色」这个坑随染色一起没了**：它当年是「`--glass-blur` 带 `brightness(1.05)` 会把已经到 ~248 的浅色主体削顶成纯白」，而根因是 72% 的半透明染色。今天 `--glass-panel` 是实底纸，**整条通道不存在**，`glass--refract` 一并删除。**留在这里的是那条结论**：实心浅色表面上不做任何会提亮它的运算——这不是省事，这是「禁纯白」在数值上的实现。
- **回退不用自己写，而且现在只有一条**：`glass.css` 里 `prefers-reduced-transparency: reduce` / `prefers-contrast: more` 那个块。正常态就是实底，所以「无 `backdrop-filter` → 转实底」那一级没有可回退的东西，而 `html[data-transparency="solid"]` 全仓从来没有任何 JS 设置过——**这两级都随 V3 删除，不要补回来**。留着的这一级也不是回退，它管的是**印刷面自己的问题**：偏移是投影，投影被关掉就需要第二个不依赖投影的信号，所以它把画框换成 `var(--ink-950)` 实线、给药丸补 `outline`。
- 音乐条目**不再各自带发丝线**：整行读成一条 bar + 一枚点亮的条目。hover 是药丸底、active 是**墨色液态玻璃**（用户第四轮要求，与标签条那颗指示器同材质）。`.music-random` 仍是这个视图**唯一**的主操作，停在 bar 右端（DOM 里也排最后，Tab 顺序与视觉顺序一致），材质与选中 chip 相同。
- **两枚药丸是「同一个配方写在两个选择器上」**（`.music-random` 与 `.genre-chip.is-active`）：`--glass-pill` 钴蓝实底 + `--color-on-accent` 翻面标签 + **一条 4px 硬边方形偏移**（ink-950 @34%）。V3 之前那版配方（84% 染色 + `inset` 斜面 + 两级投影 + `::before` 轴向棱 + `::after` 背板 `blur(6px)` + `z-index: -1` + `isolation: isolate`）**整条退役**：它描述的是一颗液态玻璃，而本站现在是印刷品；留下 `::after` 的负层只会让一个不需要分层的控件凭空多一层堆叠上下文。**没有 `::before` / `::after` 了**。**没写成可复用类**是因为 chips 由 `js/music-stage.js` 生成、状态是 `is-active` 切换，加标记类要动 JS 而没有收益。hover **不换实心色**：加深偏移，与药丸被抓取时是同一个动作。
- **焦点提示在输入框底边**（1px `--color-text-muted` + 光标），不再给整行画环：满宽色带套 2px 金环就是相框（用户原话「那个金色框删掉吧」）；输入框自身的 `outline: none` 由这条底线替代，行内的清除 / SHUFFLE 保留全局焦点环。
- **画框不吃任何提亮运算，理由留着**：当年这条规则是为 `brightness()` 写的（棱带、主体不带），而 `brightness` 已随 `backdrop-filter` 一起退役。**结论本身今天仍然成立，而且更干净**：`--paper-000` 已经是纸本身的最亮值，任何「把抬起来的东西再提亮一点」的操作都只会削顶成 `#fff`（本站明令禁止）。所以 `.glass__edge` 上只准出现 `color-mix(... var(--sky-400) ...)` 往暗里走或往中间走的方向，**不准出现把亮度往 100% 推的运算**。
- `≤720px`：`.tabbar` 与 `#genre-filter` 都是横向滚动器，都转实底（`var(--color-surface)` + `inset 0 0 0 1px var(--color-line)`）并 `display: none` 掉那两层绝对定位的托盘层——**滚动容器里绝对定位的层会随内容滚**，这个理由与 `backdrop-filter` 无关，今天照样成立。实底规则必须写成 **`.tabbar.glass` / `.genre-filter.glass`**：`.glass` 在 glass.css 里且**后加载**，bare 类的同名声明压不过它（`.tabbar` 那条自 V2 起就没生效过，修好了）。搜索行不滚动，**保留玻璃**。
- **`≤720px` 的导航条只有一件事要记住**：`.nav-links` 在这一档是横向滚动器，而 320px 上第三个链接根本放不下（玻璃只有 280px，品牌 95px，三条链接 254px）——原来它被裁成一个断词（"ARCHIVE" 停在 "A"），看着像坏了。现在滚动器右端挂一条 28px 的 `.nav-links::after` 淡出（自带 `mask-image` 从透明到实底，`background: var(--glass-nav)`），最后一个词是**化开**而不是被切断。它是 flex 子元素，所以用 `margin-inline-start: -28px` 把占走的宽度还回去——链接的位置和以前逐像素相同。**不要改成给滚动器本身加 `mask-image`**：量过，容器宽正好等于被裁的宽度，那个遮罩什么也遮不到。
- **搜索框的占位符在 320px 会省略号收尾**：字段内容区只有 148px，而 "SEARCH TITLE OR ARTIST" 量到 239px，原来被切在 "SEARCH TITLE OR ART"。加了 `text-overflow: ellipsis`。**占位符是示例不是标签**（见「文案」），所以这里不需要更短的文案，需要的是不要切得难看。

### 六栏的开场白（`.panel-note` / `.curator`）

六个面板各有一句**第一人称的英文策展文字**，说清「留下了什么、按什么挑的」。这是「档案」这一章原本缺的那一层：之前只能看到留下了什么，看不到为什么，六栏因此读成一堆没有差别的收藏。**一句话、具体、不喊口号**；不带 accent（accent hue = 可点击，而这句话点不了）。

- **一个元素，六处摆放，一套排版**：`.panel-note`（外层，只管与下面的间距）+ `.curator`（正文，`--fs-small` / 46ch / `--color-text-secondary`，与 `.sec-copy`、`.lead` 同一个叙述者，但**量度故意不同**：它铺在整列上，实测 1310px，那里是全站唯一真正需要量度上限的地方，所以 46ch 留着——见「布局」）。六个面板的内部头各长各样，**不要把这句塞进任何一个面板自己的头里**——那就是同一句话的六种排法，正是要修的东西。`.curator--*` 六个修饰类留在元素上当钩子，但**没有任何规则用它们**（量过，六处落点一致，所以不需要分开调）。间距统一 `--bar-gap`，与标签条那条栈用同一个 token。
- **`.panel-note` 这层包装不是装饰，是必需的**：`js/reel-stage.js` 的 `render()` 第一句就是 `stage.innerHTML = ""`，而影 / 剧的 stage 元素**原来就是那个 tab 面板本身**，所以裸写一个 `<p>` 进去会被首帧清掉（实测：DOM 里有，两个面板画出来没有）。现在影 / 剧面板里多了一个 `<div data-film-stage="auto">` / `<div data-series-stage="auto">`，stage 渲染进它，说明与 stage 成为兄弟——六个面板因此是同一个 DOM 形状。**不要把挂载点改回面板本身**，也不要把 `.panel-note` 摊平。

### 影 / 剧

数据（`film-data.js` 24 部 / `series-data.js` 36 部）→ 配置适配器经 `js/reel-stage.js` 的 `createReelStage()` 工厂渲染进 `#panel-films` / `#panel-series` 里的 `[data-film-stage="auto"]` / `[data-series-stage="auto"]` 挂载点（不是面板本身，见上一节）。

**改动纪律**：`reel-stage.js` 是**两个面板共用的唯一实现**，适配器只传配置，**不要改工厂契约**（否则影和剧要改两遍）。
class 前缀（`film-*` / `series-*`）不许改——CSS 和 main.js 按它绑定。

`css/reel-stage.css` 曾经是**三层叠加覆盖**（主体 + `V2 VISUAL LAYER` + `V2 CORRECTIONS`），读它要先在脑子里做 diff。已压成一层：**新规则写进主体，不要再开覆盖区块**。同一次收敛里删掉了 7 个从未定义的 token 与 4 处硬编码 V1 暖金——它们让选中卡的 `box-shadow` 与普通卡**完全相同**，也就是选中态一直是隐形的。

选中态的语言：**发丝环（静止 0.1 / hover 0.2 / 选中 0.34）+ 卡片抬起一行 + 片名**（meta 的 accent 上边框与展示行都已退役）。**OPEN chip 已退役**（`.film-card-sleeve` → `display: none`：它会飘、是条带里唯一的实心深色形状，而整张卡本来就是按钮）。不要恢复「整个 meta 面板反转为实心墨 + 38% 高度色块盖住海报」，也不要恢复编号药丸（`.film-card-no` 同样已隐藏）。

**条带**：卡片必须显式写 `grid-template-columns: minmax(0, 1fr)`（漏了它海报会按 JPG 固有尺寸渲染，实测 158/54/90/59/54/24px）；`grid-template-rows: auto auto 1fr`；条带 `align-items: start`；字幕**只有片名一个字段**（`-card-meta-line` 那行是 `display: none`，数据仍留在 DOM 里喂详情区）；hover 只让海报 `translateY(-4px)`，字幕不动。

**详情区是纯排版、零图片**：海报只允许在条带上出现一次，同屏重复在结构上必须是**不可能**而不是「被缓解」。现在是**一条左对齐的竖列**，不是两栏栅格（旧版 26ch/46ch 的 `minmax()` 栅格与它带来的空栏已退役）：

1. 一行 mono 事实：位置号（唯一的墨色锚点，把面板绑到选中的卡）+ 类型 + 年份 + 导演（剧是 类别 + 年份 + 集数）。写法是 `.film-detail-copy` 为 block、`.film-detail-kicker` 为 **inline-flex**、导演/集数 **inline** —— 于是它们共享一行、放不下时自然换行。**不要改回 `display: contents` 或 flex 行**：flex 行会让唯一的动作和注释挤在同一行并压在文字上（实测按钮与诗句重叠）。
2. **注释（诗句）占一行**：列宽 `max-width: 72ch`（≈739px），注释自身**不设 max-width**。实测在 `--fs-h4` 20px Instrument Serif 斜体下，`film-data.js` 最长注释 580px、`series-data.js` 620px，所以 72ch 两者都放得下且留有余量。窄于约 700px 时注释换行——那是正确的，手机栏里没有诚实的单行方案。
3. `OPEN ON DOUBAN` **收在同一条左边缘上**（注释下方 `--sp-5`，**钴蓝实底药丸** `glass glass--pill glass--accent` —— 类名是印刷面的契约，材质是实底 + 硬边偏移，不再有染色层）：动作属于阅读栏，不属于身份栏；让它骑在事实行右端等于把唯一能点的东西放到离作用对象最远处。
4. **片名不在详情区**：它写在抬起的那张海报下面（见下一条），同一个屏上印两遍是重复。

- **选中态 = 抬起一行 + 片名**：`.is-active` 让卡片 `translateY(calc(-1rem - 1.2 * var(--fs-small)))`（= 片名自己占的高度：16px 间距 + 一行 18px = 34px），片名（`.film-card-meta`）**绝对定位在海报下方**、只给选中那张、底边与整排底线**严格齐平**（实测 `labelBottomVsRow: 0`）。meta 的展示行（导演/年份）与 accent 上边框都已退役；选中语言是**发丝环 0.1 / hover 0.2 / 选中 0.34 + 抬起 + 片名 + 海报复原饱和**。
- **没有自动播放**：`reel-stage.js` 里没有 drift，也就没有 PAUSE 控件；`paintArc` / `CURVE_R` / `VIS_CULL` / 透视那套 3D 圆筒已整体删除。**滑块（`-stage-range`）也已退役**——方向键就是键盘路径。**拖拽会改选中**（焦点卡 = 顶点卡），这是与旧版「拖拽只浏览不选中」相反的明文决策。
- **排序**：适配器传 `sortKey`，工厂排序。影按年份、剧按**第一季**年份（`parseInt("1995-2013")` 取 1995），数据文件保持原本的编排顺序。

**动效纪律（`DESIGN.md` 第 11 节）**：
- **拖拽必须 1:1**：手指按住期间**直写 `place()`**，没有任何补间参与。旧版每一次 `pointermove` 都走 `gsap.quickTo()`，拿项目自己 vendored 的 GSAP 实测滞后 **131px @1000px/s**（400 / 2000 px/s 分别是 52 / 262px）。
- **条带是一条 LAP，不是两端 clamp 的条带**：卡片集渲染两遍（`CLONE_SETS: 2`），位置经 `wrapPos()` 取模回绕，`state.setW`（一圈的长度）是从 DOM 量的第 n 张卡相对第 1 张的 `offsetLeft`——**没有端点、没有 spacer、没有橡皮筋**。第一张与最后一张因此也能到顶点：旧版靠 clamp，把它们居中需要负位移，等于两端各留半屏白纸。
- **`state.pos` 是唯一真值，而且刻意不取模**：它是逻辑位置、一直增长，像素 / 弧 / 选中都从它经 `wrapPos()` 推出来；把状态本身绕回来会让跨接缝的 seek 走远路。
- **`place()` 是条带唯一的写出点**（`frame()` 循环、手指，别的都不许）：一次写 `transform` 再 `syncApex()`。**条带上已经没有 GSAP 补间**——补间会是第二个写入者，每帧跟循环打架。
- **顶点卡 = 选中卡**（`syncApex()` 每帧按位置算）：**位置本身就是选中的函数**，所以**拖拽会改选中**（与旧版「拖拽只浏览」相反的明文决策）；反向也成立：点击 / 方向键选中的动作就是「把那张 seek 到顶点」。
- **落位是 `frame()` 里的指数趋近**（`k = 1 - e^(-dt/SEEK_TAU)`，`SEEK_TAU = 0.16s`），`REDUCED` 下瞬时到位；**没有 spring**（`power3.out` + 距离成比例的曲线现在只活在游戏拨盘与书架里）。
- **松手交出去的是速度，不是补间目标**：`state.vel` 按 `e^(-dt/0.5)` 衰减到 1px/s 以下归零；速度来自 **170ms 滑动窗口**（`VEL_WINDOW`），窗口过期即读 0——甩一下停住再松手，没有这道 guard 条带会自己飞出去。
- **指针捕获在越过 `SWIPE_THRESHOLD`(6px) 之后才要**，绝不在 `pointerdown` 捕获：一接触就捕获会把随后的 click 重定向到视口，「点海报」就永远打不开。
- **`setupMode()` 是唯一重新测量的地方**（boot / 每张海报 load / resize）：它作废 `maxX` / `setW` / 卡片偏移缓存并重新落位。面板还在 `display: none` 里时它量到「每张卡 offsetLeft = 0」（没有 lap），所以要记住这一点，等第一次真的有宽度时再把选中的那张放回顶点。
- **不做**：滚动速度 skew、逐卡反向视差、逐卡入场 stagger（60 张 × 30ms 已经 1.8s）、containerAnimation（与直写 `x` 失步）。
- **单位陷阱**：Lenis `velocity` 是 px/帧，ScrollTrigger `getVelocity()` 是 px/秒，差 60 倍。
- **影 / 剧点击不开浮层**。详情块就在条带正下方，浮层是重复 —— 而且更差（250px 海报浮在暗场里）。**点击只是选中**（`selectCard` 顺手把那张 seek 到顶点，所以点击会动条带）；**hover 不选中**，只把环抬到 0.2，键盘焦点与方向键才选中。浮层仍是 photo / game / music 的详情机制。曾经写过一版 FLIP 飞入，**已随浮层删除，不要加回来**。
- **条带入场只在视口做一次**，永不做逐卡 stagger（60 张 × 30ms = 1.8s，UI 上限 300ms）。
- **滚动横移已删除**（曾动 `-stage-drift` wrapper，4% 行程）。它让「居中」变成**滚动位置的函数**：实测同一张卡在不同滚动位置偏离中心 4px，而居中是选中的反馈，一个会漂的反馈等于没有反馈。
- **选中即居中，而「居中」现在只是一次 seek**：`selectCard()` 把那张卡的目标位移写进 `state.seekTarget`，由 `frame()` 的指数趋近走完（`REDUCED` 瞬时）。**没有 `settle()` / `centeredX()` / `state.settling` / `resetMover()` 这些名字了**——它们是「GSAP 补间 + 条带两套写入」时代的产物，翻到它们说明看的是旧代码。
- **拖拽会改选中，这不是 bug**：顶点卡由 `syncApex()` 每帧按位置算，**位置就是选中的函数**，所以手指把哪张挪到顶点、选中的就是哪张；点击 / 方向键做的也是同一件事（把目标 seek 到顶点）。旧版「拖拽只浏览、选中另有一套状态」会产生条带停在正中第 7 张、环却在第 3 张的坏状态——**不要再引入第二套选中状态**。
- **`:focus-visible` 是「手指」与「键盘」的分界**：`pointerdown` 也会 focus 卡片（`<button>`），所以 `focusin` 只用 `card.matches(":focus-visible")` 判键盘焦点。漏掉这条等于「手指一碰海报就已经选中了」。
- **`swiped` 必须在 `pointerdown` 清掉**，不能只靠随后的 click 清：拖拽在**另一张卡**上松手时根本不产生 click，标志会留着吃掉下一次真实点击。
- **滑块（`-stage-range`）已退役**，方向键就是键盘路径。当年那条教训仍然成立：**任何时刻只能有一个写入者**（现在是 `place()`）；一旦出现第二个写入者，所有「由位置派生」的东西都必须跟着更新——当年的症状是滑块永久冻结：写 range 的语句长在 `setStrip` 里，而居中走 `gsap.to` 不经过它，图片全部缓存后连唯一的掩护（海报 load → `setupMode` → `setStrip`）也没了。
- **详情区的 settle 只淡文字，绝不淡那一列**：`.film-detail-copy` / `.series-detail-copy` 是 `OPEN ON DOUBAN` 的**祖先**。当年整块淡入的后果是**每换一张海报都在按钮标签周围闪一下**——按钮的 `backdrop-filter` 采样随祖先 opacity 塌回纸面，补间中途只要祖先是 0.x 就在那条斜坡上走一遍，最后一帧再跳回真表面（暖色板当时实测 opacity 0 时按钮内部是 `239,239,234`）。**今天按钮是实底钴蓝，这条闪动在机制上已经不存在**，但规则保留、理由换掉：祖先 `opacity < 1` 仍然会让**已排好的那一列在淡入期间与未排好的邻居同层**，读者会看见整列的基线在动；而淡入只挂在四个文字节点上、抬起（`y: 6`）留在整块（transform 在祖先上安全），按钮照旧跟着文字走 6px 却不参与淡入。**不要因为「按钮已经实底了」就改成整块淡入。**

### 音乐

`js/music-data.js`（`window.MUSIC_DATA`，534 首 15 组）→ `js/music-stage.js` 渲染进 `.playlist[data-music-stage="auto"]` 并生成 `#genre-filter` 过滤 chips。`.genre-count` 由渲染器自动生成。

专辑封面走 `js/music-covers.js`（`window.MUSIC_COVERS`，songId → 文件名，图在 `album-covers/`，生成文件勿手改），详情层 `.lb-music` 显示真实封面，缺图回落 ♪ 占位 sleeve。

- **两行都是同一张抬起来的纸、都不吸顶**（见「三条 bar」）：搜索行与流派行与标签条同一件东西；换流派的落点按**固定导航条的底边**算（`alignGenreTop()`），历史搜索跳转仍走 `scrollMarginTop`。
- **三条 bar 的间距统一走 `--bar-gap`（`--sp-5` = 24px）**：实测标签条→搜索行→流派行→列表 = 24 / 24 / 24。标签条的下边距就是六个面板与它的距离，所以这一条同时把面板起点从 48 收到 24——这是用户选 24 时已披露的副作用。
- **音乐面板没有入场动效**（应要求）：`js/main.js` 的 `animateIn()` 只在面板里能找到 `.idx-row / .genre / .hof` 行时才跑，所以影 / 剧 / 书 / 球队本来就是静止的，**原来只有音乐和游戏吃这套**。实测切到音乐那一帧 `#panel-music` 是 `clipPath: inset(0 0 0 100%)`、可见的 `.genre` 是 `inset(0 0 100%) + translateY(14px)`，0.85s 后才落定 —— 477 张卡 15 组读起来就是加载级联。现在 `select()` 里 `panel-music` 直接走 instant 分支，切过去第一帧就是 `clipPath: none` / `transform: none`。**游戏拨盘仍保留擦入**（改完只剩它一个），要去掉就在同一分支里加 `panel-games`。
- 歌单默认**全展开、无手风琴**；浏览靠流派 chips 过滤 + 搜索叠加 + SHUFFLE。
- 默认**单流派显示**：一次只显示一组，首屏索引 0 的 POP；chips 行没有「全部」，一次只有一枚 `aria-pressed="true"`。切换流派统一走 `selectGenre()`。
- **搜索跨全部 15 组**（应要求改的）：有命中时每个命中的组都展开，组头从「139 首」变成「4 / 139」，工具条读出「18 / 534」，零命中才显示 NO MATCH。`#music-search-jump` 随之退役——查询已经覆盖全部流派，没有「别处」可跳。**搜索中点击 chip = 跳到那一组的结果**，走原生 `scrollIntoView` + `scroll-margin-top`；**不要自己算 delta**：`.genre` 是 `content-visibility: auto`，实测手算落点差 359px、加一次「修正」反而差 834px（每次重测都会让另一个块实体化）。清空关键词后回到单选流派。
- **每个流派都有自己的网易云歌单**：`music-data.js` 每组一个 `playlist: "<id>"`，`js/music-stage.js` 把它渲染成组头右端的 `OPEN PLAYLIST`（`.genre-meta` = 计数 + 链接，两条都在 DOM 里排在标题之后）。歌单是 `archive/music-playlists/` 在账号里一次性建好的（路由实测、eapi 加密、命名与重复运行规则都在那份 README），**站点只做内容跳转、不发任何请求**，也没有代理。那条链接**是这一行唯一的强调色**：`--color-accent-text` 下划线（accent hue = 可交互），旁边的计数保持 muted；一次只有一个流派在屏上，所以同时只命中一处。它是 19px 高的文字链，`::after` 把命中区撑到 41px，**只往上 / 下 / 左扩，不往右**（右边缘与组头齐平，多出来的部分本来就会被裁掉）；实测命中区下沿距第一张卡还有 3px，**不要加大这个 inset** —— 再往下就会把歌曲卡的点击抢走（`main.js` 的委托是 `closest(".idx-card")`，命中的是链接就没有卡）。`≤720px` 时组头 `flex-wrap: wrap`，计数 + 链接整块落到第二行、仍贴右（320px 实测无横向溢出）。
- **加歌要同时进两个歌单，而这件事是一次粘贴**：站点按曲风分 15 组，账号侧另有**两个语言总集歌单**（`N1GHT · 中文` / `N1GHT · ENGLISH`），它们是同一批歌横向切的一刀——所以**一首歌必须同时躺进它的曲风歌单和它的语言歌单**。两份视图都在同一份 `netease-import.js` 里（`build-import.mjs` 生成 15 曲风 + 2 语言 = 17 组），**跑一次全都到位**。`build-import.mjs` 的两道断言（语言分桶不重不漏 + 歌单名唯一）会让「只加了一半」在生成阶段就拒绝出文件。`netease-import-language.js` 与 `build-language-import.mjs` **已因此退役（2026-09-23）**：拆成两个文件就等于允许只跑一半，那次就是这么漏的，owner 被迫粘了两次。
- **详情层只有一步直达**（应要求改的）：`OPEN IN NETEASE` 下面那条 `OPEN <流派> PLAYLIST` 已删除 —— 它和组头右端那条 `OPEN PLAYLIST` 指向**同一个歌单 id**，是重复入口；跳歌单这件事留给组头（一次只有一个流派在屏上，那一条就够）。随之退役的还有 `#lb-music-playlist` / `.lb-playlist-link`（css）、`#lb-music-playlist` 的可见性开关，以及 `musicItemData()` 的 `playlist` / `playlistLabel` 字段与详情层那个已无主的 playlist 点击分支；`js/music-stage.js` 也不再写 `data-playlist-label`（`data-playlist-id` **保留**：`main.js` 委托在 `#panel-music` 上的点击处理读它）。`.lb-stage` 的 `title / artist / sleeve / OPEN` 只剩一行链接，焦点顺序（`#lb-music-link` → `#lb-prev`）与 `lbFocusables()` 不受影响。**不要再加回来**：组头那条就是同一个 href。
- **歌单链接先打客户端，不是网页**（详情层那条删掉后，歌单只剩组头生成的 15 条）：`main.js` 的 `openInApp(type, id)` 是 `openSong` 泛化来的（手机 `intent://` / `orpheus://<type>/<id>`，桌面建隐藏 `<a>` 点 `orpheus://` + `btoa(JSON)`，1200ms 内页面没被切走才回落网页）。payload 抄官方网页端自己的写法（`core_*.js`：`{type,id,cmd:"play",channel:"webset"}`，`TYPE_MAP` case 13 = playlist）：**歌单**用它，**歌曲**仍发本站一直在发的 `{type:"song",id,cmd:"play"}`（那条已知能落，不要顺手统一）。`<a href>` 保持网页地址，中键 / Ctrl+点击 / 无 JS 时仍走网页，四个修饰键的点击**不拦截**。流派那 15 条由 `music-stage.js` 生成，所以是**委托在 `#panel-music` 上**的，逐条绑定会随重渲染失效。实测：那条 `orpheus://eyJ0eXBlIjoicGxheWxpc3Qi…` 让客户端**冷启动**并直接开始放 POP（窗口标题 `Cheap Thrills - Sia`，该曲就在 `music-data.js` POP 组内）。
- **切换流派把新手流派带回条带顶部**（`alignGenreTop()`，只向上、不向下）：长流派滑到深处再切短流派时，文档变矮会被浏览器夹到底部，不处理就会"直接到最底"。落点基准是**固定导航条的底边 + 16**（`header.nav` 是 `fixed`，rect 在任何滚动位置都诚实；旧版读的是 sticky 板的 pinned 几何，随吸顶一起退役）。另外两条仍然成立：落位是**瞬时跳**不是补间（补间只能从被夹住的近底部开始，会闪一路无关内容）；`lenis.scrollTo` 在目标等于上次目标时**直接 return**，而这里每组的目标都是同一个文档位置，所以要再核对 `window.scrollY` 并回落原生 `scrollTo`。实测：搜索中点 chip 落点 16 / 15px，深处切流派落点 16px。

### 书（书架）

`js/book-shelf-data.js`（`window.BOOK_SHELF`，16 本）→ `js/book-shelf.js` 渲染进 `#panel-books` 里的 `[data-book-shelf="auto"]` 挂载点。**`#panel-books` 里已经没有 `.idx-row` 标记**，书不再是硬编码列表。

移植自 sanyam.sh/lab/book-shelf（上游是 React + motion/react）。这一版用仓库里**已有的** GSAP 重写，所以仍然没有新增依赖、没有构建步骤；场景、数字与推理属于原作者。点书脊 → 书旋出到舞台中央、封面正对读者、scrim 压在书架前；再点一次 / 点 scrim / Escape 放回去。

- **几何是契约**：`--bs-stage` / `--bs-base` / `--bs-centre` / `--bs-out` 写在 `book-shelf.css`。**JS 只读 `--bs-base` 与 `--bs-out`**（`metrics()`），舞台中心是它自己量的 `mount.clientHeight / 2`，`--bs-stage` 与 `--bs-centre` 只在 CSS 里用（`perspective-origin`）；JS 反向**写** `--bs-fit`。任何一边都不要写死第二份。
- **封面落点 = 舞台的垂直中心**（`--bs-centre` = stage/2）。这是唯一让缩放免费的选择：场景绕中心缩放，那个点就永远不动，开书时上下两行字不必追它。
- **每本书是盒子不是贴图**：书脊是一面、封面是另一面（`rotateY(90deg) translateZ(thickness/2)`），翻 −90° 就把封面转给读者，全程没有淡入淡出。
- **scrim 是同一个 3D 场景里的一个平面**，不是上层遮罩：`preserve-3d` 按深度绘制并忽略 `z-index`，用 `translateZ(100px)` 挡在书架前、书后。
- **书脊英文、翻开全中文** —— 这是数据本身的形状：每条 entry 有 `spine`（印在书背上的短名）与 `title`（封面与详情里的正名）。书脊是整本书唯一一条 21px 的窄面，只放得下短名；封面有地方，就写这本书真正的名字。
- `writing-mode: vertical-rl` + `text-orientation: mixed` 同时是两种书脊的排法：中文正立、拉丁与数字倒 90° 躺着。所以「1984」的英文书脊形态是免费得到的，不用开特例。书脊挂 `lang="en"`；封面标签、作者行、短评挂 `lang="zh"`。按钮的可访问名也是中文（`aria-label="打开《三体》"`）。
- **书脊字体**：`Klein Blue Night`（站点加载的是子集版 `fonts/KleinBlueNight-shelf.woff2`，46 KB，来历见 `archive/fonts-subset/`；12.6 MB 的原字体留在 `fonts/` 里不动，非商业授权）。整排**一个字号**：`TITLE_MAX = 17`，只有两条最长书名（Dawn Blossoms Plucked at Dusk / The Legend of the Condor Heroes）被自动缩到 15.5px；`thickness < 18` 的书脊不排字，只留布色。**13px 是给回退字体定的**：真正的 Klein 是宽体手写，13px 时横竖都富余得厉害（最长的一条只用掉可用长度的 61%），读起来偏小。
- **书名要同时过两道闸，而这两道闸量纲不同**（`fitTitles()`）：`runLimit` 是**长度**（书脊高度减去头尾装饰带的 44px，按场景缩放折算），`wideLimit` 是**字号**（这行字的 line box 1.23em 必须落在书脊面宽度里）。**绝不能把 `TITLE_MAX` 塞进同一个 `min()`**——混过一次，结果是拿「跑多长」去比「17px」这个数，整排书脊掉到 8px 地板。
- **`.bs-title` 的盒子必须是整条书脊**（`inset-block: 0` + flex 居中），不能用 `top: 50%` + `translateY(-50%)`：后者给绝对定位盒子留下的包含块只到书脊**一半**，超过一半的长书名会折出第二列，再被 `.bs-spine` 的 `overflow: hidden` 裁掉半截（实测「How the Steel Was Tempered」印成「How the Steel Was」）。文字另起一层 `.bs-title-text`，因为 `fitTitles` 必须量**这行字**的盒子——flex 容器上的 Range 报的是容器本身，不是这行字。
- **中文的字号不能沿用拉丁**：封面标签作者行 10px→11px（10px 的汉字读不出来），标签标题 `line-height` 1.25→1.35（114px 标签宽只放得下 7 个 15px 汉字，长名必换两行，1.25 会让两行粘住）。
- **布色 / 印色**：16 组全部**实测**过 4.5:1（5.05 到 12.59）。换布色必须重新量，不许估。
- **字挂在地标上，而且只有一行**：打开的书上方那条短评（`.bs-blurb`）挂在场景地标上——`top: calc(50% - var(--bs-reach) * var(--bs-fit) - 54px)`，即**书上缘之上 54px**，跟着 `--bs-fit` 缩放，所以永远落在书脊之外。作者行**不在外面**：它和书名一起印在封面标签里（`.bs-label-author`）。旧文档里的「书顶 −46px / 底板下 +20px」两个地标已经不存在（`bottom: 20px` 那处是书脊底部的印章 `.bs-stamp`）。
- 窄窗口是**整体缩排**（`--bs-fit`，按列宽算），不重排、不换行；短评是唯一允许换行的一行。

### 球队

硬编码在 `index.html`（`#panel-sport` → `#sport-stage`）；历史调研产物放 `archive/<topic>/`，不参与站点加载。

移植自 Framer 的 image animation（`framer.com/m/image-animation-HJJB.js`）：**一行五张图，永远只有一张被撑开，其余是窄缝，点窄缝就换它当主画面**。上游那 15 个 variant 只是同一个手风琴在 15 个尺寸上，所以这里就是五个 `<button>` 加一段 CSS。

- **所有状态都挂在 `[aria-pressed]` 上，JS 只搬这一个属性**（`main.js` 的 `initSportStage()`），并在启动时把第一张打开；布局、入场、颜色全在 CSS 里，脚本挂了就是「第一张永远展开」的静态带子，信息不丢。按钮天然吃 Enter / Space，没有键盘处理。
- **宽度动的是 `flex-grow`，绝不用 `flex-basis`**：百分比 basis 会插值成 `calc(0% + 104px)`，0.3s 内点两次会让两张同时跳、整行塌掉（实验室页实测 1412px 的行只剩 885px）。grow 是纯数字，被中断也还是单调的，行的总和恒定。
- **窄缝宽度是设计值** `min(104px, 7vw)`：上游按 1%（1200 设计稿的 12px）写，在 1440 的行宽上就是 14px 死条。展开项走 `flex-grow: 40`，实测 1440 下 812 / 119 ×4。
- **平板 / 手机是竖排**，行高必须写成确定值（展开 + 4 × 条高 + 4 × 缝）：容器 `height: auto` 时没有剩余空间，grow 无从分配，五个面板会一起停在 basis 上（实测五个 78px 正好等于行高，pressed 规则命中却什么都没做）。
- **只有文案自己那一条带被压暗**；上游覆盖整张图的 0 → 1 alpha ramp 不抄（它会把每张照片上暗下亮）。文字入场是 opacity + 14px 上浮，**不用 `blur(10px)`**；出场 0.16s，比面板收拢先结束。
- **颜色用站内的**：上游是白底 + 纯黑窄缝，两条都在禁区。窄缝是 `--color-media-void`（原 `paper-100`，随分区底色一起退役），文案压在 `oklch(0.1 0 0)` 的墨色渐变上；队徽只出现在窄缝里（48px、居中、展开后淡出）。托盘本身是 `--color-surface-tint`（见「视觉基调」），**它是全站仅剩的两个有边界的着色面之一**。
- **文案只有三行**：眉标（队名 + 联盟）、荣誉、官网域名。**没有中文短评** —— 荣誉那一行就是这条带子上唯一的中文，走 `--fs-h3`。
- 图片在 `sport/`（文件名即 slug），五张都是 **1600px webp**（2.5 MB → 1.25 MB → 0.78 MB）。`loading="lazy"` **必须留着**：这五张与队徽都在 `display:none` 的面板里，没有 lazy 就会在首屏 eager 取走 1.28 MB（实测 10/10 → 0/10）。
- **未降采样的原图归档在 `archive/sport-sources/`**（站点不加载）：`build-images.py` 对 `sport/` 是**就地替换**，所以 `sport/` 里的 1600px webp 是产物不是源。要重出更大的一档、或换编码格式，从那里取文件（文件名已是 slug，直接放回 `sport/` 再跑 `--only=sport`）。

### 诗（folio）

Dylan Thomas《Do not go gentle into that good night》。**这一段只有诗**：自述、8 个统计数字、section 头与 coda 都已退役。应要求重做成**印刷对开页（folio）**，**诗本身的两列没有动**——同样 3 + 3 节、同样的 `.poem-col` 外壳、同样的列宽与列距。

- **整章的栅格就是诗自己的两列**：`.poem-head` 与 `.poem-foot` 都是 `repeat(2, minmax(0, 1fr))` + `var(--chapter-gap)`（列距在 `:root` 定义一处，见「布局」），于是诗题压在第 i 节上、导语压在第 iv 节上，落款两格各自对齐同一列。**这就是重做的全部**：章节不再是「一个头 + 下面一首诗」，而是一张从诗题贯到落款的 folio。三条章节头（`.sec-head` ×2 + `.poem-head`）的列距与基线规则完全一致，**不要**给其中任何一条单开比例——错开的不只是列，还有导语的左边缘。
- **两列诗行的天花板是最长的那一行，不是口味**：每行都是 `<br>` 硬断，换行不是重排、是诗体断掉。最长行 18.33em（"Their frail deeds might have danced in a green bay,"，1440 下 456px），两列在 shell 里到 **971px** 就放不下——实测 960 / 940 / 920 三个宽度都在换行。所以诗在 **1000px** 竖排，比断点表里的 900 早一档。
- **竖排时接缝的间距必须等于节间距**：一竖排，每个 `.poem-col` 就变成一格 grid ROW，第 iii 节与第 iv 节之间的缝由 grid 的 `row-gap` 给，`p + p` 那条 1.9em 够不到它。写成 `gap: var(--sp-6)` 会让接缝比节间距还窄，分节节奏在正中间断一次。
- **节距 1.9em、行距 1.62**：跨节基线距 3.5em、节内 1.62em，三行一节才是看得见的单位。旧值 1.35em 只比行距大一点，六节读成一片。
- **落款两格**：左边是诗的**全名**（`.label` mono），右边是收尾那句（与导语同一套字号，**没有 `max-width`**——右格自己量度 619px；`≤1100px` 单列时回到 `--measure`，同 `.sec-copy`）。h2 只是叠句的第一句，**全站唯一写出诗名的地方就是这个落款**。旧落款是「Dylan Thomas, 1947. Kept here because…」压在一条通栏发丝线下：作者与年份眉标里已经写过一遍，所以重做时删掉了重复的题署（**句子本身没改**），发丝线也撤了（「留白优先于线条」）。
- **`.refrain` 的天蓝不动**：仍是全站静态文字唯一的 accent 例外（DESIGN.md 3.1），走 `--color-accent-text`（`#006D9E`，对纸面 5.44:1）。
- **动效**：框架（头两格 + 落款）挂在 `.poem-head` 的同一个触发器上，一次 `power3.out` stagger 0.08 入场；六节仍是原来的 stagger 0.07。**落款不要单独挂自己的 ScrollTrigger**：它是本章最后一行、后面就是 footer，拿自身落点当触发等于让这句话在进入 92% 视口之前一直 `visibility: hidden`。

## 站点结构

hero（**两层**：全幅影像层 + 压在它上面的**巨型字标**，导航条浮在两者之上）→ PHOTOGRAPHY（章节导语 + **一副可以逐张发掉的牌**，21 帧）→ THE ARCHIVE（六 tab：书 16 本书架 / 影 24 / 剧 36 / 音乐 534 首 15 组 / 球队 5 / 游戏 18 卡）→ POEM（Dylan Thomas《Do not go gentle into that good night》，**这一段只有诗**：自述、8 个统计数字、section 头与 coda 都已退役；已是**印刷 folio**——眉标 + 诗题 + 导语是头，中间是 3 + 3 两列的诗，落款收尾，三块共用诗自己的两列）→ footer。导航与页脚的 `About` 标签改成 `Poem`，但**段的 id 仍是 `#about`**（锚点与 ScrollTrigger 都按它绑定，不要改）。

- **摄影章节就是一副牌，没有别的**：21 帧叠成一摞，`.photo-deck__stack` 只由 CSS 画盒子，几何与交互全在 `js/photo-deck.js`（旋钮常量 `VISIBLE / STEP_Y / STEP_S / FAN / TILT / SLOP / COMMIT_PX / COMMIT_V / SETTLE_T / SETTLE_DONE / FLY` 都在文件头上；逐条事实见 `DESIGN.md` 第 7 节）。最上面一张完全可见，往后三张按深度依次缩小、下沉、交替微转（`fan(d) = ±(0.35 + 0.28d)°`）。**没有开场大图，也没有全屏层**（应要求，两者随棋盘一起退役）。
- **牌堆有顶也有底**：`deal()` 在两端拒绝，并让离位的牌按指数趋近回原位。方向**永远由位移符号决定**（`held < 0 → dir +1`，向左甩牌露出下面那张），速度只决定「算不算一次 deal」——让衰减中的速度去挑方向，就是「向右一甩反而往后翻」的来源。
- **拖拽必须 1:1**：`paint()` 直接读 `drag.x`，手指与照片之间没有任何补间。松手交出去的是**速度不是补间目标**。
- **一帧一次 transform 写入**（`paint()` 把位移、旋转、缩放一次写进 `translate3d + rotate + scale`）：改成写 `left/top` 会让拖拽的每一帧 flush 一次 layout。
- **只有 `paint()` 一个写入者**（`top` / `fly` / `back` / `drag` 四个状态都归它）——别在别处直接改 transform。第一版有过一个 `top_off(x)` 帮手直接写顶卡的 transform，那就是第二个写入者，已删。
- **`syncTop()` 挪焦点前必须先把 `paint()` 跑完，而挪不挪的判断要在函数最开头读**：paint 会把读者正站着的那张变成 `visibility: hidden`，隐藏元素保不住焦点，浏览器当场把它丢回 `<body>`。等到函数末尾再测 `activeElement.closest('.photo-frame')`，结果**永远**是 false，于是「按一次方向键 → 焦点掉回文档开头」。实测踩过：`End` 之后焦点停在第 1 张而不是第 21 张。
- **手按上去会把牌堆按停**：`pointerdown` 里清掉还在飞的 `fly` / `back`。否则飞出去那张的位移会盖住 1:1 的位移，手里的牌和手指要去两个地方。
- **不抢滚轮**：这一章没有任何滚动驱动的动效，牌堆也只吃横轴。`touch-action: pan-y`（**不是 `none`**），`pointercancel`（浏览器把纵轴判给滚动）直接丢弃手势。
- **牌堆不裁剪**：最深的卡比 `.photo-deck__stack` 低 38px，wrapper 的 `margin-block-end: 2rem` 加上 foot 的 `margin-block-start` 正好让出 56px。给 `.photo-deck__stack` 加 `overflow: hidden` 就是把最底下那张切掉。
- **图注是牌堆的边注栏，既不在牌上、也不在牌堆下面**（2026-09-28 改）：`.photo-deck-caption`（衬线斜体 `--fs-h3`）与 `FRAME NN / 21 · BLOOM`（mono muted）**都**钉在 `.photo-deck-foot` 的第 2 轨，第 1 轨是 `--deck-w` 的空轨；牌堆同时从居中改成**贴左边距**（`margin-inline: 0`）。改之前这一章里有**三条轴**：牌堆居中在 x=320、图注在左格 x=65、编号在右格 x=756 —— 一条离它所描述的照片 255px 的标签，而栅格用的还是 `.sec-head` 那一条，牌堆从来就不在那条栅格上。现在的边注栏从**牌堆右缘 + `--chapter-gap`** 起算（1440 下 865 + 72 = x=937，栏宽 438，末端 1375），图注字面意义上贴在它标注的那张照片旁边。**不要把它改回章头的第二列（x=756）**：量过了，牌堆止于 865，会被牌堆右下角压住 109px。
- **`<1340px` 图注落回牌堆下面**（`css/photo-deck.css` 里**唯一**的断点）：栏宽 = 内容列 − 800 − 栏距，门槛是**最长的一条图注 340px**（"Before the leaves, the shape is the story."；最窄 169px，编号行 132px）。实测 1340 栏宽 341、1366 是 375、1280 只剩 292 就该折行。落回时量度 34ch、`grid-column` 回到 1。**这是内容挣来的断点，不是项目的 720，也不是牌堆的 800。**
- 牌上的 `.photo-frame-cap` 是 `display: none`——留的是 sr-only 原文，两份图注叠在发牌的那一帧会重影（与书架「字挂在地标上」同一条纪律）。foot 初始 `hidden`，脚本填完再放开：无脚本时根本没有「顶上那张」，一条空行比没有更糟。
- **点侧牌是把它挪到顶上，点顶牌才是开灯箱**：`main.js` 在 `#photo-deck` 上委托一次（侧牌 → `PhotoDeck.select(i)`，顶牌 → `openDetail`）。拖拽的 click 由牌堆在**捕获阶段**消费，键盘回车（`detail === 0`）放行。
- **方向键挂在 `#photo-deck` 上**（左右各走一张，`Home` / `End` 跳首尾），焦点只在**焦点本来就在牌堆里**时跟进：拖拽发牌不该把人传送过去，键盘发牌必须跟进，否则下一次按键落在已经不是顶牌的那张上，而灯箱要把焦点交还给一个活的控件。
- **`data-act` 是 `BLOOM / HORIZON` 的唯一来源**（`photoFrameData()` 读 `frame.dataset.act`）；乐章标题与 `.photo-act-horizon` 已删。判定口径是**距离**不是物种：**BLOOM = 镜头近处活着的绿色世界**（花 / 枝 / 叶 / 树干 / 近前的动物与水面），**HORIZON = 远景，地面与天相接**（田野 / 河 / 云 / 山坡 / 村镇）。**只有这两个值，不要为了新照片新增第三个标签。**
- **牌堆是全彩的**（无 `filter`），这是「颜色是奖励不是壁纸」的**明文例外**：照片就是这一屏的图画，界面没有东西要保护。**hero 不再与它共享这条理由**——hero 那张 2026-09-29 起被调成双色调（见「视觉基调」），所以「影像一律全彩」这条红线现在**只剩牌堆这一处明文例外**。但**这次例外比棋盘那次窄**：牌堆没有网格、没有计数器、没有页码，堆上**只剩照片**——没有对手要压。`--wall-saturate`、hover 复原滤镜和那个「墙是全彩」的开关一起退役了，**跟着它们一起退役的还有它们当初防的那个东西**。
- **游戏名册是一个定位盘**（`js/games-stage.js`，Framer Detent 的纯 DOM 移植）：舞台挂载时给 `.hof` 加 **`.is-live`**，十八张封面排在一个环上、只有中心那张是彩色，`.hof-name` / `.hof-hours` / `.hof-quote` 留在条目里当数据源并**只画一次**（画进中心下方的 `.hof-now`）。舞台没起来（无 JS / 脚本失败）时 `.is-live` 不在，`css/games-stage.css` 回落到一份**显式三列的静态名册**：`repeat(3, minmax(0,1fr))`，900px 以下两列、720px 以下单列。**不要改回 `auto-fill`**——18 只能被 1/2/3/6/9/18 整除，`auto-fill minmax(250px,1fr)` 在 1440 下出 4 栏 = 4 行零 2 个孤儿。
- **影 / 剧的卡片是「2:3 媒介盒 + 盒外的 meta」**，靠 `.film-card` 的栅格实现（`grid-template-columns: minmax(0,1fr)` + `grid-template-rows: auto auto 1fr`），**不要改回绝对定位的整盒 + meta 覆盖**，也**不要漏掉列定义**（漏了海报会按 JPG 固有尺寸渲染，实测 158/54/90/59/54/24px）。索引药丸（`.film-card-no`）与 OPEN chip（`.film-card-sleeve`）均已 `display: none`；选中态是**三层**：可区分的环（静止 0.1 / hover 0.2 / 选中 0.34）+ 卡片抬起一行 + 片名。**详情区不放图**。
- **索引列表（音乐）没有逐行发丝线**，靠 `padding-block` 与间距分组，用 64px 封面取代序号。**书（书架）与球队（手风琴）都已不在 `.idx-*` 里**：球队换成手风琴后，`.idx-no` / `.idx-logo` / `.idx-line` 三条孤儿规则连同 720px 下的两条响应式覆盖一起删掉了。
- **`≤720px` 的曲目行第一栏必须等于封面宽度（64px）**：原来写的是 `2.2rem`（35.2px），而 `.idx-cover` 是 64px —— 封面**溢出自己的轨道 29px**，标题因此从封面里 16px 处开始。一行两列、534 行，整张列表就是这么挤起来的。现在标题与署名都从 64 + 12 = 76px 起，与上面的流派标题同一条左边缘。**改这个值时它必须等于 `.idx-cover` 的宽度**。
- **音乐每行必须渲染 64px 真封面**（`window.MUSIC_COVERS`）；缺图回落同尺寸空 sleeve。不要恢复 `counter(track)` 编号，也不要给 `.idx-artist` 加回大写 + 字距。
- 图片默认低饱和、hover / focus 复原：这是「颜色是奖励不是壁纸」的落点。滤镜只加在 `img` 上。
- **照片图注仍在 DOM 里**：顶牌那张由牌堆下面的 foot 印出来（其余二十张的仍是 `sr-only`，灯箱与读屏照读全部 21 条）。键盘可达性不变——按钮仍在、`aria-label` 未改，但 **tab stop 从 21 个降到 1 个**（roving tabindex：牌堆是组合件，只有顶牌可 tab，其余 `tabIndex -1` + `aria-hidden`）。到任意一张的路是两条：拖 / 方向键翻，或开灯箱后用缩略条直接跳。

## 内容更新

- 摄影：`.photo-frame`（**正典 21 帧必须留在 HTML 里**，放在 `.photo-fallback` 网格里；`js/photo-deck.js` 一执行就把它们搬进 `.photo-deck__stack`）。**DOM 顺序就是牌序**，没有映射也没有克隆，所以重新编排要连 `data-photo-index`、`.photo-frame-no`、`aria-label` 三处一起改，不要只搬 `<figure>`。
- **照片三份，各司其职**：`photo/full/` 是原图（2048px，只归档、站点从不加载）、`photo/` 是 1600px 的灯箱档、`photo/wall/` 是灯箱缩略条用的 560px webp 派生档（`archive/image-refresh/build-images.py` 生成）。所以 `.photo-frame` 的 `<img>` 写 **`src="photo/wall/<名>.webp"` + `data-full="photo/<名>.jpg"`**：`src` 是缩略条画的（48px 缩略图），`js/photo-deck.js` 在启动时把它快照进 `data-rail` 再开始换 `src`，`data-full` 是灯箱打开的（`main.js` 的 `photoFrameData()` 读它、`renderDetail` 用它）。牌堆的牌面走 `data-full`（1600px 线性档）而不是 `src`：**牌面封顶 800 CSS px，正好是 1600 的一半，所以 dpr2 下也不放大**。所以新增照片**只放 `photo/` 与 `photo/full/` 而不跑生成脚本，缩略条会 404**；反过来把 `src` 指回 `photo/`，`main.js` 的 `photoFrameData()` 会优先读 `data-rail`，缩略条仍拿 560px 那一档——**这层优先级不能反**，反了就是给 21 张 48px 缩略图各下 153 KB。
- 游戏：`.hof-item`（直接进 `#hof-grid`），封面 `covers/`，时长写 `.hof-hours`，引文写 `.hof-quote`。封面统一是 **1280px webp**（原生 16:9；拨盘中心在 dpr2 下约 1040 设备像素，`archive/image-refresh/build-images.py` 重压过 5.76 MB → 1.64 MB）。换封面按这个尺寸与格式放，`RATIO = 16/9` 那条注释依赖它；带空格的文件名在 HTML 里写 `%20`。
- **影视（以后加片子就照这条）**：海报存成 `posters/<豆瓣条目ID>.jpg`（文件名就是豆瓣 subject id），条目 push 进 `js/film-data.js`（`window.FILM_DATA`）或 `js/series-data.js`（`window.SERIES_DATA`）。字段形状是固定的，适配器（`js/film-stage.js` / `js/series-stage.js`）按名字取：
  - 影：`{ id: "film-NN", douban: "1291841", poster: "posters/1291841.jpg", title, director, year, genre, quote }`
  - 剧：`{ id: "series-NN", douban: "2373195", poster, title, years, seasons, category, quote }`（`years` 可以写 `"1995-2013"`，排序取首个年份）
  - `douban` 是豆瓣条目 id，详情区的 `OPEN ON DOUBAN` 指向 `movie.douban.com/subject/<id>/`；多季剧集豆瓣按季建条目，所以链接落在第一季。
  - `quote` 是中文短评，规矩见「文案」；面板页头的计数（`TWENTY-FOUR FILMS` / `THIRTY-SIX SERIES`）**是写死在适配器里的**，加片要同时改那一行；排序与年份都从数据算，不用管。改完给对应 `<script>` 的 `?v=` +1。
- 音乐：`data-song-id` 必须经网易云接口核实，禁止凭记忆填造；加进 `music-data.js` 对应组 `tracks`，计数自动。**每组还有 `playlist`（该流派的网易云歌单 id）**，组头的 `OPEN PLAYLIST` 就指向它；歌单内容与 `tracks` 是两份、不会自动同步——加了歌要重跑 `node archive/music-playlists/build-import.mjs`，再把那一份 `netease-import.js` 粘进网易云。**那一份里是全部 17 个歌单（15 曲风 + 2 语言），一次跑完，不要拆成两趟**：曲风与语言是同一批歌的两份视图，同一首歌必须同时进两处，分开跑必然漏掉一半。同名歌单会被复用，只补缺歌。新建一个流派分组时要同时给它建歌单，否则那个组头没有链接（渲染器对缺 `playlist` 是静默跳过的）。新歌封面从网易云 `song/detail` 的 picUrl 取 500px 存进 `album-covers/`，再跑 `archive/music-album-covers/index.json` → `js/music-covers.js` 的重新生成，**然后跑 `archive/image-refresh/build-images.py`**。封面是两份、同一个文件名派生：列表行的 `.idx-cover` 是 64 CSS px，读 `album-covers/thumbs/<同名>.webp`（160px 派生档，约 5 KB，**由脚本生成、不要手放**）；详情层的 `.lb-music` 才读 `album-covers/<原名>.jpg` 那张 500px sleeve（`music-stage.js` 只替换一次扩展名，所以两边的 stem 必须一一对应）。缺 thumbs 那一份 = 列表里一行破图。
- 书：条目进 `js/book-shelf-data.js`，每本除了 title / author / blurb 还要给 binding（`thickness` 21–48、`height` 240–288、`lean`、`cloth`、`ink`、`band`）；**新增或换布色必须重量 ink/cloth 的 4.5:1**。行宽、缩放和书脊字号都会自己算。
- 球队：logo `logos/`；队名是官网直达真链接（`target="_blank" rel="noopener"`）。
- hero 影像层：`index.html` 里一个 `<picture class="hero-plate">`，用的是**本人拍的陆家嘴仰拍**，但**加载的是它的双色调档**（`hero/lujiazui-duo*.jpg`，三档：`lujiazui-duo-tall.jpg`（462×999，竖屏原生切片，`max-aspect-ratio: 3/4` 时用）、`lujiazui-duo-1200.jpg`（1200w）、`lujiazui-duo.jpg`（1440w））。**三档都由 `archive/hero-refresh/build-hero.py` 从 `hero/lujiazui-source.jpg` 生成**（1440×999，就是交付的那张，没有放大、没有发明像素）；重出图跑那支脚本，**不要手裁、不要手改生成文件**。脚本同时再写一遍三张**全彩档**（`hero/lujiazui*.jpg`）留档，**现在没人引用它们**，与 `hero/nebula*.jpg` 同样处理——要清就单独清，别以为"还有两个 hero"。分级规则（灰度 → 1.18 对比 → 0.98 lift → 五档 sRGB 插值 `#081626→#0E2E46→#18587E→#308AB6→#6EC4E6`，**高光封顶在 sky-400，不到白**）写在脚本的 `DUO_RAMP` 旁边，**它同时定义了两件事**：影像的高光天花板，和 `--sky-900` 这个 token 的值——改 ramp 就要同步改 `:root` 里的 `--sky-900`（那是 `.hero` 的信箱色）。它上面那层 scrim 与底部的渐隐（字标对比度就靠 scrim）写在 `css/style.css` 第 7 节，**改动必须重量对比度**（量法在 `DESIGN.md` 3.2 推论 3；现成工具是 `archive/color-audit/`，旧文档里提到的 `output/hero-*.mjs` 已由它取代）。
- **hero 不再是一整屏**：`height: calc(100dvh - clamp(120px, 18vh, 170px))`，比视口矮一档，**底部那一条露出的是 PHOTOGRAPHY 自己的眉标与导语**——这就是"交接到下一章"，没有新增任何滚动提示元素。改动这个高度要同时重量：1440×900 hero 738 / peek 162，390×844 hero 692 / peek 152，320×720 hero 590 / peek 130。`min-height: 440px` 是唯一的兜底。
- **hero 统计条已退役**（2026-09，hero 只剩字标与它背后那张影像）：藏品数字现在只住在 `DESIGN.md` 第 0 节与各面板页头里，增删内容要同步那里。`#about-stats` 的 8 个计数更早已随 ABOUT 面板退役（要恢复计数就得同时把 `initCounters()` 与 `data-count` 标记一起加回来）。

## 改完自检

1. 双击 `index.html` 可用；无外部 CDN；控制台无 404。
2. 无新增长帧；reduced-motion 不破布局；引用资源无 404；`?v=` 已递增。
3. 纯键盘走查；320px 与 200% 缩放不裁剪；对比度实测（玻璃按叠加底色）。
4. 视觉回归自检：强调色命中元素仍 ≤ 25；圆角仍只有四档（印刷品自己的 `--bs-edge-radius` 之类是组件常量，不在这条之内，但改它们时要看一眼邻居）；没有复活退役清单里的任何一项；**组件样式表里没有 `:root` 之外的硬编码色值**（带书面理由的组件局部 token 除外）。
5. 印刷面自检：**全仓没有一条活的 `backdrop-filter` / `mix-blend-mode`，没有一条 `box-shadow` 的 blur 位大于 0**（硬偏移 `Npx Npx 0 0` 与 inset 发丝线是允许的）；没有把抬起来的托盘放进横向滚动容器（`≤720px` 的 tab 条与流派行都已转实底）；没有给任何托盘元素或其祖先加 `opacity < 1` / `filter`（`transform` 是允许的）；**深度只有硬边方形偏移一个来源**，改动高度只改 `--glass-elevation` 那三份，不要在任何组件里手抄第二个投影。
6. tab 条药丸自检（导航条已无药丸，不要去那里找）：`moveTo` 在**所有**选中路径上都调用了（点击 / 方向键 / Home / End / 拖拽提交）；**拖动中与落位后药丸都精确等于某一栏的矩形**（CDP 量，别靠眼看）；`Escape` 与 `pointercancel` 不改选中态；`≤720px` 拖拽已禁用但 tab 仍可点。
7. 提交并推送 `origin/main`。

## 回滚

重构前的状态标记在 git tag `pre-redesign`。**当前检出与工作分支都是 `main`**（`redesign/v2`、`backup/pre-sport` 是历史分支，只作参考，不要再往上提交）。
