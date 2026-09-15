# N1GHT CHXN9 - DESIGN.md

> 面向实现的单一设计事实源（V2，2026）。只记录现状，不发明新风格。
> 结构与裁决见 `AGENTS.md`；研究留档见 `archive/design-research/` 与 `archive/premium-techniques/`。
> **本版按代码逐条核对过**（2026-09-14）：`css/fonts.css?v=13`、`css/style.css?v=86`、`css/glass.css?v=8`、`css/reel-stage.css?v=15`、`css/film-stage.css?v=14`、`css/series-stage.css?v=16`、`css/book-shelf.css?v=6`、`css/photo-wall.css?v=6`、`css/games-stage.css?v=2`、`css/smooth-cursor.css?v=1`、`js/reel-stage.js?v=24`、`js/glass-pill.js?v=3`、`js/glass-lens.js?v=1`、`js/photo-wall.js?v=6`、`js/main.js?v=73`。**任一 `?v=` 变了就说明文件改过，本文件对应段落要重新核对。**

## 0. 品牌与 Design read

**一句话**：一个编辑式影像档案。纸感中性底、克制的排版、影像优先，开场是一个巨型字标，液态玻璃只出现在浮在内容之上的控件上。

**Design read**：personal archive / photography，受众是同好与自己。语气是**编辑式画廊**，不是作品集官网、不是仪表盘、不是科技感暗色站。

**核心判断**：站点最贵的资产是 21 张照片、60 张海报（影 24 + 剧 36）、400 张专辑封面。界面不得与这些图片抢注意力。**照片是页面上唯一被允许彩色的事物。**

**Dial**：DESIGN_VARIANCE 6 / MOTION_INTENSITY 4 / VISUAL_DENSITY 4。

**主题锁**：正文页全亮色纸面。暗色只用于三处：**hero（承载巨型字标）**、`#lightbox` 详情层、`.footer`。它们是「开场与落幕」语汇，不是分区反转。hero 是一层全幅影像加压在它上面的巨型字标（`hero/`，几何与 scrim 见第 7 节），导航条浮在两者之上；它**仍然是三个暗区之一**。

**藏品规模**（**hero 统计条已退役**：hero 只有字标和它背后的那张全幅影像。这组数字现在只住在本节与各面板页头里，增删内容要同步这里；`#about-stats` 那 8 个计数更早已随 ABOUT 面板退役）：书 16 / 影 24 / 剧 36 / 音乐 477 首 15 组 / 球队 5 / 游戏 18。

---

## 1. Token 层

两层 token：原语只进 token 层；组件只准引用语义层。

### 1.1 原语（hue primitives）

| 原语 | 值 | 说明 |
| --- | --- | --- |
| `--paper-000` | `#FCFCFA` | 面 / 卡片 |
| `--paper-050` | `#F7F7F4` | 页面底 |
| `--paper-100` | `#EFEFEA` | 深一档底（归档区） |
| `--paper-200` | `#E3E2DC` | 分隔线 |
| `--ink-950` | `#101010` | 暗层底 / 实心墨块 |
| `--ink-900` | `#141412` | 正文 / 标题（**不是纯黑**） |
| `--ink-600` | `#4C4C48` | 次级文字 |
| `--ink-500` | `#6A6966` | muted（**唯一可用于小字的灰**） |
| `--on-dark` | `#F2F2EF` | 暗层上的文字（**不是纯白**） |
| `--gold-400` | `#C9A227` | 强调实底 |
| `--gold-700` | `#7E5F20` | 强调文字 / 描边 |
| `--gold-100` | `#F0E6CC` | 强调浅底 |

原语 ramp 保持暖中性（R>G>B），所以读起来是纸而不是冷灰。**禁纯黑 `#000`、禁纯白 `#fff`。**

### 1.2 语义层（组件只准用这层）

| 语义 token | 指向 | 用途 |
| --- | --- | --- |
| `--color-bg` | paper-050 | 页面背景 |
| `--color-bg-deep` | paper-100 | 归档区、深一档面 |
| `--color-surface` | paper-000 | 卡片、实底回退 |
| `--color-text` | ink-900 | 正文、标题 |
| `--color-text-secondary` | ink-600 | 描述、次级信息 |
| `--color-text-muted` | ink-500 | 标签、编号、meta |
| `--color-line` | paper-200 | 分隔线 |
| `--color-line-soft` | oklch(0 0 0 / .055) | 密集数据行分隔 |
| `--color-accent` | gold-400 | 强调实底 |
| `--color-accent-text` | gold-700 | 强调文字 / 焦点环 |
| `--color-accent-tint` | gold-100 | 强调浅底 |
| `--color-ink` | ink-950 | 实心墨块（激活 tab、主按钮） |
| `--color-on-dark` | on-dark | 暗层文字 |
| `--color-on-accent` | ink-900 | 强调实底上的文字。**当前没有任何组件引用它**（金色实底上的字走 `--color-text`），保留这一行是为了让语义层表与实际 `:root` 一致 |
| `--color-on-dark-muted` | oklch(1 0 0 / .62) | 暗层次级文字 |

玻璃那一族 token（`--glass-nav` / `--glass-panel` / `--glass-pill` / `--glass-elevation` 等）定义在 `css/glass.css` 与 `css/style.css` 的 `:root`，见第 4 节。

---

## 2. 排版

### 2.1 字体族（全部本地自托管，禁外链）

| 字体 | 文件 | 用途 |
| --- | --- | --- |
| Space Grotesk | `fonts/SpaceGrotesk-latin.woff2`（可变） | 展示 + 正文 + UI |
| IBM Plex Mono | `fonts/IBMPlexMono-400-latin.woff2` | 标签、元信息、导航。**只声明 400**：300 的 `@font-face` 已删（全站没有 300 的选择器），文件还留在 `fonts/` 里但没人引用 |
| Instrument Serif | `fonts/InstrumentSerif-italic-latin.woff2`（400 italic） | 编辑式引言、诗 |
| Klein Blue Night | `fonts/KeLaiYinLanDeYeWan.ttf`（12.6MB，非商业授权） | **只有书架书脊**，13px 一个字号 |
| Diplomata SC | `fonts/DiplomataSC-latin.woff2`（400，SIL OFL 1.1，Google Fonts 的 latin 子集） | **只有 hero 字标**：一个字符串、一个字号，`font-display: block` + head 里 preload |

### 2.2 双寄存器字号系统（**9 个字号 token，封顶**）

字号不是一条连续 ramp，而是**两个寄存器**——一套紧凑的 UI 档，一套模数化的展示档。两者之间的空档是刻意的。

**UI 寄存器**（紧凑）：`--fs-label` 11px（mono 眉标）/ `--fs-meta` 12px（mono 元信息、导航）/ `--fs-caption` 13px（说明）/ `--fs-small` 15px（次级正文）/ `--fs-body` 16px（正文）。

**展示寄存器**（模数 **1.25 / Major Third**）：`--fs-h4` 20px（条目标题）/ `--fs-h3` clamp(20→25)（区段小标题）/ `--fs-h2` clamp(31→49)（区标题 / 页脚字标）/ `--fs-display` clamp(39→76)（**现在只有详情层的 ♪ 占位**在用它；hero 字标走的是自己的 `--masthead`，`.display` 这个角色类还在样式表里但已无调用点）。

> 审计时统计 **`--fs-*` 的声明条数**（9 = 5 UI + 4 展示），不要统计计算值——clamp 在同一断点会产出中间值，那是同一个 token。展示档因此读作一把 Major Third 的尺子：`--fs-h4` 20、`--fs-h3` 20→25、`--fs-h2` 31→49、`--fs-display` 39→76；`--fs-display` 的 39 与 `--fs-h2` 的 31 是各自 clamp 的下界，不是额外的两格。

**hero 字标不在这个表里。** `N1GHT CHXN9` 是 logotype，不是文本角色：全站只出现一次、只有一个字号，而且那个字号是**按容器算的**，不是 ramp 上的一格——`.hero-inner` 是 `container-type: inline-size`，`--masthead: 14.5cqw` 让字标永远正好填满 `.shell` 的内容列（实测数字写在 `css/style.css` 第 7 节）。所以字号表仍然是 10 个，中间的空档也没有被填。

### 2.3 字距

- 展示字号负字距随字号增大：`--track-display` -0.045em → `--track-h2` -0.038em → `--track-h3` -0.02em。
- 小号大写标签正字距：`--track-label` 0.16em；元信息 `--track-meta` 0.08em。
- 阅读尺寸正文两者都不加。

### 2.4 光学边距

`text-box-trim: trim-both` + `text-box-edge: cap alphabetic` **只给展示档标题**（`.display` / `.sec-title` / `.footer-name`；`.coda-title` 已随 coda 退役）。

> **红线**：它会把行盒裁到 cap-height/alphabetic，**移除降部空间**。任何同时 `overflow: hidden`（省略号截断）的元素绝不能加它，否则每个降部都会被切掉——「Maybe」会渲染成「Maube」。V2 曾因此踩坑。

### 2.5 排版硬规则

- `line-height` 一律 unitless；展示档 0.95-1.1，正文 1.6-1.7。
- 长文行长 60-75ch；标题 `text-wrap: balance`，描述 `pretty`。
- 会变化的数字一律 `tabular-nums`；**索引列表的 rank 不用** tabular（那是表格 register）。例外：游戏拨盘的 `.hof-rank` 带 `.mono`，吃的是 mono 的 `tabular-nums`，那一行是 `01 / 18` 的计数不是排名。
- 中文行加 `lang="zh"`；中文封面标签字号不能沿用拉丁（10px 汉字读不出来，11px 起）。
- 移动端输入框 16px（防 iOS 聚焦缩放）。
- 英文文案禁 em dash（用句号 / 逗号 / 冒号重写）；**中文破折号不受限**；en dash 只用于范围；正文用弯引号。
- 字重只用 400 / 500；700 不出现。层级由字号与留白承担，不由加粗承担。

---

## 3. 颜色

### 3.1 一色一义

- **accent = 可交互**。静态文字**只有一处**例外：诗区叠句 `.refrain` 用 `--color-accent-text`（品牌特例，用户拍板）。
- **每视图只一个实心填充主操作**（音乐是 `随机一首`，影 / 剧是 `OPEN ON DOUBAN`）。
- 全站强调色命中元素数**上限 25**（V1 是 182）。新增强调色用法即为回归。
- 修对比度只动 lightness，不动 hue；颜色改动需用户拍板。

### 3.2 实测对比度（WCAG，实测不估算）

| 前景 / 背景 | 实测 | 阈值 |
| --- | --- | --- |
| ink-900 / paper-050 | 17.18:1 | AAA |
| ink-900 / paper-000 | 17.96:1 | AAA |
| ink-600 / paper-050 | 8.04:1 | AAA |
| **ink-500 / paper-050** | **5.11:1** | AA |
| **ink-500 / paper-100** | **4.76:1** | AA |
| gold-700 / paper-050 | 5.52:1 | AA |
| gold-700 / paper-100 | 5.14:1 | AA |
| gold-700 / gold-100 | 4.77:1 | AA |
| ink-900 / gold-400 | 7.62:1 | AAA |
| on-dark / ink-950 | 16.96:1 | AAA |
| on-dark@0.62 / ink-950（白 62% 叠 #101010 = 164,164,164） | 7.63:1 | AAA |
| 导航玻璃 α0.78，最差照片（#101010）叠加后 ink-900 | 10.11:1 | AAA |
| 导航玻璃 α0.72（改前）/ ink-600 链接 | **4.20:1** | 不合格（已修） |
| 导航玻璃 α0.78（现）/ ink-600 链接（合成 200,200,199，同 4.10） | 5.15:1 | AA |
| 导航条玻璃（真实 hero 上渲染实测）/ 链接 | 6.58:1 | AAA |
| 导航条玻璃（真实 hero 上渲染实测）/ 品牌 | 13.94:1 | AAA |
| hero 字标 (#F2F2EF) / 影像层+scrim，1440×900 最差像素 | **5.40:1** | AA（大字下限 3:1） |
| hero 字标 / 影像层+scrim，390×844 最差像素 | 6.43:1 | AA |
| 卡片说明白字 / scrim α0.62，最差（纯白照片） | 5.66:1 | AA |
| 选中药丸玻璃 α0.84 / on-dark 标签（渲染实测） | 9.25:1 | AAA |
| 导航条墨色选中态 / ink-900 | 13.9:1 | AAA |
| 导航条兄弟项 / ink-600 | 6.6:1 | AAA |
| tab 条玻璃主体（渲染实测 249,249,243）/ ink-600 标签 | 8.0:1 | AAA |
| tab 条玻璃主体 / ink-500 编号 | 5.29:1 | AA |
| 音乐工具条磨砂面（72% paper-000 合成到 `--paper-100` = 248,248,246，见 4.8） | 与页面底同值 | —— |

> **五条必须照做的推论**：
> 1. 导航玻璃底色不透明度**必须 ≥ 0.76**。实测 α0.60 时最差照片上 ink-600 只有 3.10:1；α0.72 是 4.20:1（不合格），α0.78 是 5.15:1。
> 2. `--ink-400` 这一类浅灰**不能用于小字**；muted 一律 `--ink-500`。
> 3. hero 字标压在影像层上，靠 `css/style.css` 第 7 节那条 scrim 立住：改图、改 scrim 的任一段 alpha、或改 `object-position`，**都要重新实测**（量法：把 `.hero-wordmark` 设成 `visibility: hidden` 截屏，再逐像素算它那个矩形里最亮的一点）。
> 4. **选中药丸（`--glass-pill` α0.84）是深色玻璃上的浅字**，和导航条不是一回事：α 越低，`#F2F2EF` 标签越差。α0.84 实测最差仍有 9.25:1。玻璃感由**边缘**（发丝边 + 轴向棱）承担，不由降低底色不透明度承担。
> 5. **第三条 bar 就是第三条 bar**（用户第三轮要求）：音乐面板的搜索行与流派行现在和 `#archive-tabbar` 是**同一件玻璃托盘**（`.glass .glass--pill`），见 4.8。第二轮那套手写 Blur Navigation 配方（`blur(26px)` + `--paper-100` @16% + 墨 12% 环 + 自备三条回退）**已整体退役**，它的对比度豁免一并作废：没有东西从板下穿过，最差底色就是纸面（chip 标签 8.13:1、占位符 5.18:1）。**三条 bar 都不吸顶。**

---

## 4. 液态玻璃（`css/glass.css`，唯一配方来源）

### 4.1 六层

| 层 | 选择器 | 作用 | 可靠性 |
| --- | --- | --- | --- |
| 1 磨砂主体 | `.glass__body` | `blur(20px) saturate(1.7) brightness(1.05)`（`.glass--simple` 时直接写在元素自身：`blur(16px) saturate(1.6) brightness(1.04)`） | 全浏览器 |
| 2 镜片边 | `.glass__edge` | 环，`blur(3px) brightness(1.14) saturate(1.4)` + `mask-composite: exclude`；宽度 = `--glass-edge-w`（默认 13px，`.glass--pill` 9px，`.nav` 3px，见 4.9） | 全浏览器 |
| 3 镜面高光 | `.glass` 的 inset 阴影 | 顶部亮斜面 + 底部暗边 + 内晕染 | 全浏览器 |
| 4 轴向发丝边 | `.glass::before` | 1px 环，**竖直轴**：亮上 + 暗侧轨 + 暗下（亮玻璃）；亮上 + 亮下 + 暗侧轨（深色玻璃 / 导航） | Chrome 120+ / Safari 15.4+ / Firefox 53+ |
| 5 按压环 | `.glass__press` | 只画 1px 环的 **conic** 渐变，`:active` 时 `opacity 1` | Chrome 120+ / Safari 15.4+ / Firefox 53+ |
| 6 增强：SVG 折射 | `.glass--refract .glass__body` | `feImage` 位移图 → `feDisplacementMap` | **仅 Blink**，见 4.2 第 2 条 |

**第 2 层的原理**：每个元素的 backdrop 包含**先前绘制的兄弟节点**，所以边缘环采样到的已经是模糊过的主体，渲染出来必然更锐更亮。这个不连续就是镜片边的读感，且只用 Baseline 特性。

**第 4 层为什么是竖直轴而不是 conic**：对 Apple 自己的表面逐像素量过，休息态的高光是**固定竖直轴**——顶边亮 1px、底边同样亮 1px、左右是**暗**发丝。conic 会把一束高光绕着四条边扫，扫过侧面时侧面反而变亮，与测量相反。**conic 只在按下态成立**，那才是高光真的会移动的时候，所以它单独占了第 5 层。

**第 5 层为什么必须是独立元素**：按压环要做淡入，而**元素自身的 `opacity < 1` 会让它自己的 `backdrop-filter` 完全失效**（实测）。所以既不能改 `.glass__edge` 的 opacity，也不能复用它。

### 4.2 四条必须遵守的约束

1. **背景根陷阱（本机实测更正）**：在 Chrome 152.0.7977.83 上逐项跑过对照实验（同一条纹背景，量模糊后的亮度极差）：

   | 场景 | 结果 |
   | --- | --- |
   | 元素**自身**有 `transform` | 模糊正常 |
   | **祖先**有 `transform` | 模糊正常 |
   | 元素自身 `will-change: transform` | 模糊正常 |
   | 祖先 `isolation: isolate` | 模糊正常 |
   | `contain: paint` / `content-visibility: auto` | 模糊正常 |
   | 元素**自身** `opacity: 0.99` | **模糊全丢** |
   | 元素**自身** `filter: blur(0px)` | **模糊全丢** |
   | 祖先 `opacity: 0.99` | **模糊全丢** |

   **会杀掉玻璃的是 `filter` / `opacity < 1`（在元素自身也成立）/ `mask` / `mix-blend-mode`；`transform` 在自身和祖先上都安全。** 这条是「药丸每帧被 transform 移动、玻璃仍然成立」的前提，也意味着**药丸绝不能用 opacity 淡入**。第三方仓库声称 `isolation: isolate` / `contain: paint` 会静默失效，在本机**不可复现**。

   这条陷阱**已经踩过一次**（用户报的「换海报时 OPEN ON DOUBAN 文字周围闪一下」）：影 / 剧详情区的 settle 原来把整个 `.film-detail-copy` 从 `opacity 0` 补到 `1`，而那块正是 `.glass--accent` 的祖先。实测按钮内部均值随祖先 opacity 走：`1 → 212,192,132`、`0.6 → 217,198,140`、`0.3 → 227,218,187`、`0 → 239,239,234`（纸面）——按钮等于从纸里淡出来，最后一帧再跳回真表面。现在淡入只加在四个文字节点上，抬起（`y: 6`）仍留在整块：CDP 逐帧实测祖先 `opacity` 恒为 `1`，按钮内部 `224,207,150` / `212,192,132` 逐帧不变，`kick`/`quote` 仍走完 0 → 1 的 180ms。

2. **折射的门必须是「正向 Blink 信号」，不能是 `@supports`**：Safari 能解析 `backdrop-filter: url()` 并让 `@supports` 返回 true，但不渲染，会静默连模糊一起丢掉。而 `@supports (-webkit-backdrop-filter: ...)` 也不行了——**Chrome 已经移除了 `-webkit-backdrop-filter` 别名，该查询在 Chrome 152 返回 false**。所以门是 `index.html` head 里设的 `html.has-lens`。**模糊声明永远写在增强之前**，增强挂不上时只丢折射，不丢模糊。

3. **多层玻璃不进横向滚动容器**：滚动时 backdrop 跟随移动，且绝对定位的玻璃层会随按钮一起滚。`≤720px` 的 **tab 条**因此改实底（`.tabbar.glass` 覆盖），药丸也随之禁用拖拽。**这条没有例外**：`≤720px` 时 tab 条与流派行都转实底（4.8）；搜索行不是滚动容器，所以它永远留玻璃，chips 行的滚动发生在板子内部、板子自己不动。

4. **药丸不吃折射**：位移图的内部「压平」形状是按宽扁条（约 16:1）写的；放到 95×40 的药丸上会被拉伸变形，中心不再是中性，整颗被放大成一团亮斑（渲染中已复现）。药丸另有两个理由不吃：它是唯一会动的元素，移动的 `backdrop-filter` 每帧重采样 backdrop，而位移是其中最贵的一步。

### 4.3 三重回退（规范漏洞）

`prefers-reduced-transparency` **只有 Chromium 支持**（Safari 明确拒绝，Firefox 未实现），所以它不能是唯一回退。三条独立机制：

1. `@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))` → 实底（两个前缀都要测：老引擎只认 `-webkit-` 那个）
2. `@media (prefers-reduced-transparency: reduce), (prefers-contrast: more)` → 实底
3. `html[data-transparency="solid"]` → 实底（JS 显式开关）

**新增玻璃层时三条都要补**。

### 4.4 使用范围

玻璃**只给浮在内容之上的控件**，因为纸上的玻璃没有可折射的内容、只会发灰：

| 位置 | 控件 | 材质 |
| --- | --- | --- |
| 浮在 hero 照片上 | `header.nav` | 纸白玻璃 α0.78（`--glass-nav`） |
| 浮在归档区内容上 | `#archive-tabbar`（含 `#tab-pill`） | 纸白玻璃 + 墨色药丸 |
| 与歌单同层（**没有一行 sticky**） | `.music-search`（搜索行）+ `.genre-filter`（流派行），两条都是玻璃托盘 | **玻璃，与 `#archive-tabbar` 同一件东西，见 4.8** |
| 影 / 剧详情区 | `OPEN ON DOUBAN`（`.glass--accent`） | 香槟染色玻璃，见 4.7 |
| 纸面上 | `.lb-meta-link`、所有普通 chip / 按钮 | 实心色 |
| 纸面上（**例外**） | `.music-random` 与 `.genre-chip.is-active` | 墨色**液态玻璃**胶囊（84% ink-950 + 棱 + `::after` 背板），配方见 4.8 |

再加玻璃元素前先问：**它浮在什么上面？** 答案若是「纸」，那就用实心色。

### 4.5 指针跟随高光

`.glass--spot` 的 `--mx` / `--my` 由 JS 每帧一次 `setProperty` 写入（rAF 节流）。**不能用 GSAP `quickTo`**——它只补间 transform 数值属性，不补间自定义属性。仅精指针且非 REDUCED 启用。

### 4.6 选中药丸（`js/glass-pill.js` + `.glass-pill`）

`js/glass-pill.js` 现在**只服务 `#archive-tabbar` 一条**（导航那颗已退役，见 4.9）。

| 项 | 值 |
| --- | --- |
| 材质 | `--glass-pill` = ink-950 @ α0.84；1px 轴向棱（亮上 / 亮下 / 暗侧轨）；z-index 3 |
| 尺寸 | 由 JS 每帧写 `width` / `height` / `translate3d`，**从不写 left/top** |
| 抓取 | `pointerdown` 落在药丸矩形内 → `.is-grabbed`：**阴影加深，绝不缩尺寸**。曾经是 `scale: 0.94`，实测那会让 90px 的栏只被 84.6px 的药丸盖住 —— 选中指示器唯一不能做的事就是「看起来没落到位」 |
| 拖拽 | 位置**吸附到指针所在的那一栏**：`geometryFor(index)` 只有「栏的矩形」这一种几何；跨栏时 `transform` 与 `width` 同走 180ms 补间，药丸滑进下一格。指针跑到栏外时 `segmentAt()` 回落到最近的栏，首尾两格是停靠位 |
| 落点 | 松开时取指针所在栏；松开点即提交点，**没有启动阈值**（点击 = 零位移的拖拽） |
| 取消 | `Escape` 或 `pointercancel` → 回到**已提交**的栏，不改选中态 |
| 标签配色 | 拖拽中只有**指针下方**那一栏保持浅色（`.is-drop-target`），其余回到墨色 |
| 禁用 | `≤720px`（横向滚动容器）；`prefers-reduced-motion` 下**保留可拖**，只是瞬时到位 |
| 实测（CDP，1440，真鼠标事件） | 指针压 FILMS 栏左缘内 6px → 药丸 = FILMS 栏矩形；继续拖到栏外 x=722（bar 右缘 641）→ 药丸 = GAMES 栏矩形 `546,193,636,233`；松手后仍是同一矩形。**任何时刻药丸都精确等于某一栏的矩形** |
| 无障碍 | 药丸 `aria-hidden="true"`，真正的控件仍是 `<button role="tab">`；拖拽只是指针增强 |

### 4.7 accent glass —— 纸面上唯一允许的玻璃

`.glass--accent` 应要求做成玻璃，靠**香槟色染色**成立：纸上普通玻璃只会发灰，而染色给了模糊与棱可以读的东西。

| 层 | 值 | 实测渲染 |
| --- | --- | --- |
| 染色 | `color-mix(in oklab, var(--gold-400) 52%, transparent)` | 主体 226,209,152 |
| `__body` | `blur(16px) saturate(1.08)` —— **无 brightness** | 上棱 225,203,134 |
| `__edge` | `blur(4px) saturate(1.04)` —— **无 brightness** | 下棱 221,197,124 |

墨字对比度 **12.51:1**（最暗的下棱 11.19:1）；降级回落 `var(--gold-400)` 实底，字是 `--ink-950`，**7.87:1**（7.62 是 ink-900 / gold-400 的值，见 3.2）。

**为什么两层都不能加 `brightness()`**：`.glass__edge` 是 `position: absolute; inset: 0`，它盖住**整个**控件——它不是一圈边框，而 `.glass--pill .glass__edge { padding: 9px }` 对空盒子毫无作用。所以 brightness 施加在整个表面并**与 `__body` 的叠加**。在导航玻璃上（深色、压在照片上）这个叠加就是效果本身；在浅色金染上只会削顶：**实测 255,247,188，红绿通道钉死在 255**——是奶油色，不是香槟。

导航那套 `saturate(1.9)` 同理不能照搬：`#C9A227` 本身已约 68% 饱和，1.9× 直接破 100%。

**不吃折射**：位移图按宽扁条约 16:1 写的，放到 132×40 会把中心放大成亮斑。

### 4.8 三条 bar：同一件玻璃托盘

三条 bar —— `#archive-tabbar`、`.music-search`（搜索行）、`#genre-filter`（流派行）—— 是**同一件东西**：本站的液态玻璃托盘（`.glass`；只有标签条额外带 `.glass--pill`，另两条用 `--glass-radius` / `--glass-edge-w` 覆写形状），托盘内距 6px、条目间距 4px、条目 40px、圆角 `--radius-pill`。形态最初借自 Framer Compact Navbar（`framer.com/m/Compact-Navbar-cE1IzB.js`）与 Blur Navigation（`framer.com/m/Blur-Navigation-iGYrtY.js`），**材质是本站的**（用户第三轮：三条都按标签条那样做）。**没有任何一行 sticky。**

| bar | 尺寸（1418 视口实测） | 材质 |
| --- | --- | --- |
| `#archive-tabbar` | 577 × 52，`width: max-content`，左贴正文边 | `.glass--pill`：72% paper-000 + 棱环 + `--glass-elevation`；body 走折射分支（`blur(5px) saturate(1.6) url(#lg-lens)`，**无** brightness，见下）；选中态是 `js/glass-pill.js` 那颗墨色玻璃药丸（`--glass-pill` 84% ink-950） |
| `.music-search` | 1275 × 52，铺满正文列 | 同上，但 body 去掉 `brightness()`（见下）；内容层 `.glass__content` 抬到 z-index 3 |
| `#genre-filter` | **1275 × 96**（两行 chips），与搜索行**逐像素同宽**；圆角 **22px**（`--radius-lg`，不是胶囊）、棱宽 9px | 同上（`.glass__body` 去掉 brightness，见下）；chips 抬到 `z-index: 4` |

- **托盘几何来自标签条，不是参考实现**：6px 内距 + 4px 间距 + 40px 条目（参考实现的条目只有 29px，**没有照抄**——桌面 40×40 是硬线，紧凑只落在横轴：条目内距 1.25em → 1.05em）。三条因此同一套高度公式：一行 52px，流派行两行 96px。
- **宽度**（用户第四轮的最终形态，实测 577 / 1275 / 1275）：标签条 `max-content`；搜索行与流派行都是 `.music-drawer` 的整列，**逐像素同宽**。第三轮的「流派行 = 导航条 1180 / 居中 `calc((100% - var(--rail-w)) / 2)`」已退役。
- **流派行是唯一的圆角矩形**：`--glass-radius: var(--radius-lg)`（22px）+ `--glass-edge-w: 9px`。形状锁只有四档，22px 是唯一合法的「大圆角但非胶囊」；96px 高的板在 22px 下仍读成长方形（胶囊是 48px 的 stadium 端）。
- **三条同色的坑（已修）**：标签条 `glass--refract` 的透镜规则替换了 `--glass-blur`（无 brightness），渲染 249,249,243；另两条走默认 `--glass-blur`，`brightness(1.05)` 把 248 的合成削顶成 **255,255,252 纯白**（违反禁纯白）。现在这两条的 `.glass__body` 显式去掉 brightness（保留 blur 20 / saturate 1.7），同一张 PNG 实测三条落在 247-249。
- **间距只有一个 token `--bar-gap`（`--sp-5` = 24px）**：实测标签条→搜索行→流派行→列表 = **24 / 24 / 24**。标签条的下边距同时就是它与六个面板的距离，所以这一条把面板起点从 48 收到 24（用户选择 24 时已披露的副作用）。
- **没有一行 sticky**（用户第三轮，明文覆盖第二轮的「流派常驻」）：三条都随列表滚走。`alignGenreTop()` 的落点基准因此改成**固定导航条的底边 + 16**——`header.nav` 是 `fixed`，rect 在任何滚动位置都诚实；旧的「读 sticky 板的 `computed top` + `offsetHeight`」随吸顶一起退役（那条规则本来是为绕开「换组时文档变矮、sticky 板被压出视口」）。实测：搜索中点 chip 落点 16 / 15px，深处切流派 16px。
- **材质就是 `.glass` 本体，手写那套整体退役**：流派行原来是手写的 Blur Navigation 板（`blur(26px)` + `--paper-100` @16% + 墨 12% 环）**外加自己那三条回退**——现在它就是 `.glass`，`glass.css` 一次覆盖三条。随之消失的还有它的对比度豁免：没有东西从板下穿过，最差底色就是纸面。实测（72% paper-000 合成到 `--paper-100` = `248,248,246`）：chip 标签 ink-600 **8.13:1**、占位符 / 序号 ink-500 **5.18:1**、选中 chip 与 CTA 16.96:1。
- **玻璃层必须是 `.glass` 的静态子元素，而且写在内容之前**：两层都是绝对定位，静态的 chips / 输入框会被画在它们下面。`js/music-stage.js` 只 `appendChild`、从不清空 `#genre-filter`，所以 index.html 里写死的两层安全；chips 要 `position: relative; z-index: 4`（`.tab-btn` 同一个理由、同一个值）；`.music-search > .glass__content` 只用基类的 `z-index: 3`（搜索行没有滚动、版面更简单，4.8 表层也写的 3）。`.glass__press` 只给 tab 条与流派行——文本域不是按钮，点进去打字不该让整块板的棱闪一下。
- **三条共用去 brightness 的棱**：`#archive-tabbar .glass__edge, .music-search .glass__edge, .genre-filter .glass__edge { backdrop-filter: blur(3px) saturate(1.4) }`。纸上 1.14× 只是把已经约 249 的主体削顶成纯白——实测这条 bar 的上下 9px 是 `255,255,255` 而主体是 `249,249,243`；药丸四边各距棱 6px，于是那圈白就读成了药丸的白色光晕。改后同点实测 `248,248,240` / `244,244,237`。`header.nav` 压在照片上，**保留** brightening。
- 音乐条目**不再各自带发丝线**：整行读成一条 bar + 一枚点亮的条目（hover 药丸底、active 墨色玻璃）。`.music-random` 仍是这个视图**唯一**的主操作，停在 bar 右端，DOM 里也排最后。
- **两枚墨色胶囊 = 标签条那颗指示器的材质**（用户第四轮要求）：`.music-random` 与 `.genre-chip.is-active` 共用 `background: var(--glass-pill)`（84% ink-950）+ `.glass-pill` 的斜面与两级投影 + `::before` 轴向棱 + `::after` 背板 `blur(6px) saturate(1.4)`；`::after` 走 `z-index: -1` 才落在染色与文字之间（伪元素默认压在文字上），按钮自带 `isolation: isolate` 把负层关在里面，`z-index: 4` 与 `.tab-btn` 同值地骑在托盘两层之上。hover 只加深阴影，不换实心色。三条回退写在同处。
- **焦点提示在输入框底边**：1px `--color-text-muted` 底线 + 光标。输入框自身的 `outline: none` 由这条底线替代，行内的清除 / 随机一首保留全局焦点环。
- `≤720px`：`.tabbar` 与 `#genre-filter` 都是横向滚动器，都转实底（`var(--color-surface)` + `inset 0 0 0 1px var(--color-line)`）并把两层 `display: none`——滚动容器里不放 backdrop-filter，绝对定位层也会随内容滚。实底规则必须写成 **`.tabbar.glass` / `.genre-filter.glass`**：`.glass` 在 glass.css 里且**后加载**，bare 类的同名声明压不过它（`.tabbar` 那条自 V2 起就没生效过，这次修好了）。搜索行不滚动，**保留玻璃**。


### 4.9 导航条：Liquid Glass Navbar 的形态

应要求把 `header.nav` 换成 Framer Liquid Glass Navbar（`framer.com/m/Liquid-Glass-Navbar-6gh01a.js`）的**形态**，材质仍是本站玻璃。参考实现（桌面变体 780×58）的外壳是 3px 内距 + 竖直渐变 + 六层投影，内容面板是不透明渐变。**只借三件事**：

| 项 | 参考 | 本站 |
| --- | --- | --- |
| 镜片棱宽度 | 3px（= 外壳内距） | `--glass-edge-w: 3px` + `.nav.glass .glass__edge { padding: 3px }` 与 `.nav.glass::before { padding: 3px }`。pill 默认 9px |
| 轴向棱剖面 | 白上 / 灰中 / 白下，即**上下都亮、暗侧轨** | `--glass-bead-bottom` 亮下（取代亮玻璃默认的暗下）、`--glass-bead-side` 加深 |
| 高度阴影 | 六层、无负 spread，最宽 4px 60px 30px α0.06 | **逐字照抄**，写进 `--glass-elevation` |
| 内容面板 | 不透明渐变 + inset bevel | **不抄**：参考靠不透明渐变成立，本站填色会终止 backdrop 读取，玻璃随之消失。退一步只照抄那条 bevel 也试过，渲染出来是**棱内部多出来的一圈细线**——已撤掉。外壳的棱是这条 bar 唯一的边 |

**`--glass-elevation` 是新 token**：定义成原来的 `0 1px 2px α0.05, 0 18px 44px -18px α0.22`，`.glass` 与三条回退都读它。换整套高度因此不必重抄 inset 斜面；**实测 tab 条未受影响**。

**顺手修好的一条**：`.nav` 从来没写过 `background`，吃的是 `.glass` 的 `--glass-panel`（72%），而 `--glass-nav`（78%）没有被任何选择器用过。修法是 `.nav.glass { background: var(--glass-nav) }`——必须带 `.glass`，加载顺序的原因同 4.8。实测数字见 3.2。

**实测渲染**（headless Chrome 152，1198×800，DPR 1.5）：主体 225,225,222（改前 217,217,215）；棱的亮带从上下各 9px 收到 3px。

**导航条没有选中指示器**：它曾经和 tab 条共用那颗深色药丸，但药丸压在照片上的玻璃里就是**一块浮着的黑斑**，而参考导航条本身没有选中态。所以 `#nav-pill` 元素、`main.js` 里那次 `createGlassPill()` 调用、以及 `.nav-links.is-dragging` / `.is-drop-target` / `cursor: grab` 规则**全部删除**；选中态改由**墨色**承担（active ink-900 / 兄弟项 ink-600，数字见 3.2）。代价是失去「拖药丸跳章节」这个手势——它不是无障碍通道（真正的控件一直是 `<a href>`），但确实少了一条捷径。

### 4.10 导航条的折射：改用 LiquidGlass 的成形方式

应要求把 `header.nav` 的折射换成 Framer **LiquidGlass**（`framer.com/m/Liquid-Glass-Nav-Pro-bjAIfL.js` → `.../qTWwt82O7SiWRgChNZRM/e3GI43LMP.js` → `.../LiquidGlass.js`）的成形逻辑。**只换成形方式，不换材质**：外壳、棱、投影、`--glass-nav` 染色、玻璃高光、按压环全部照旧。`#archive-tabbar` 仍走 4.7 / 4.8 那套 `#lg-lens`（它压在纸面上，采样出界取回来的也是纸，没有这个问题）。

| | 原 `#lg-lens`（tab 条仍在用） | 参考 LiquidGlass（导航条 `#lg-nav`） |
| --- | --- | --- |
| 位移图 | 一张固定的 1600×100 SVG 图，`preserveAspectRatio="none"` **拉满整个滤镜区域**（比元素大 124%×160%） | **按元素自身尺寸现算**：圆角矩形的 SDF，中段中性 (128,128)，只在 `bezel` 带内沿**向外径向**渐变、二次衰减；长边封顶 320px、DPR 封顶 1.25 |
| 位移量 | `scale=110` → 最大 **±55px** | `scale=40`，通道偏移封顶 118/255 → 最大 **18.5px** |
| 滤镜链 | 模糊 / 饱和写在 CSS 里，`url()` 只做位移 | **一条链全在 SVG 里**：`feImage → feGaussianBlur → feDisplacementMap → feColorMatrix → feComponentTransfer`；CSS 只写一个 `url(#lg-nav)` |
| 滤镜区域 | `-12% -30% 124% 160%` | `-20% -20% 140% 140%` |
| 染色层位置 | 在 `.nav` 自己身上，**于是被滤镜采样** | 在**滤镜之上**（`.glass__body` 自己的 background） |

**为什么要动染色层：这就是那块黑影的根。** 原结构里 bar 的浅色来自 `.nav` 自己的 background，而 `.glass__body` 是它的子元素，`backdrop-filter` 采样的正是「父背景 + 页面」。位移一旦把采样点推到 bar 之外，那里**没有那层 78% 纸**，只有 hero 的墨，取回来就是黑的；`.glass__body` 又画在父背景之上，于是黑直接吃掉浅色。bar 高 58px 而位移 ±55px，靠近两端必然出界 —— 这就是 POEM 旁那朵蝴蝶结。参考把 tint 放到滤镜上方之后，**bar 的颜色不再取决于采样到了什么**：采样出界与否，印的都是同一层纸。

**实测**（headless Chrome 152，1440×900，DPR 1；取 bar 两端避开字形的横带，记 平均 / 最低 亮度）：

| 横带 | 原 `#lg-lens` | 现 `#lg-nav` |
| --- | --- | --- |
| 左端·上 | 0.782 / 0.780 | 0.834 / **0.799** |
| 右端·上 | 0.665 / **0.086** | 0.834 / **0.799** |
| 左端·下 | 0.803 / 0.728 | 0.788 / 0.693 |
| 右端·下 | 0.734 / **0.165** | 0.788 / 0.693 |

两端**逐位相同**，左右不对称消失；剩下的 0.693 是设计内、两端一致的底缘暗边。同时验过：纸面章节 0 个暗像素；`data-transparency="solid"`、`prefers-reduced-transparency`、去掉 `has-lens` 三条回退都把染色交还给了 bar 本身；320px 下地图按 280×52 重算；控制台零错误；导航链接 ink-600 在合成后的 bar（200,200,199）上 **5.15:1**（合成基准 hero 的 `--ink-950`）。

**代价与纪律**：
- `js/glass-lens.js` 是**新增的一个文件**（零依赖，约 60 行），只在 `html.has-lens` 下跑。**没有 worker**：参考用 worker 是因为它的组件可以任意尺寸、要防抖重算，而这里只有一条 bar，320×16 的位图是五千个像素。
- 初始 `feImage` 是 1×1 中性灰 data URL，不是空值：**位移图缺失时读到的是 0 而不是 128**，缺省成中性只会退化成纯模糊，缺省成 0 会让整块按半个 scale 同向偏移。
- 染色上移意味着 `.nav.glass--refract` 的 background 变透明，**三条回退必须把它交还**（`html.has-lens .nav.glass--refract { background: var(--glass-nav) }` 写在每一条里）。漏一条，掉了增强的浏览器上就是一条隐形 bar。
- `-webkit-backdrop-filter` 依旧**不带 url()**：不支持 url() 的引擎会把整条声明丢掉，模糊也一起没。
- 地图随宽度重算走 `ResizeObserver`（bar 宽度 = `min(1180px, 100vw - 2 × gutter)`，随视口变）。
- 新增或修改玻璃层时，4.3 那三条回退照旧一条都不能少。

---
## 5. 形状 / 阴影 / 间距

| 类别 | 值 |
| --- | --- |
| 圆角 | `--radius-sm 8px` / `--radius-md 14px` / `--radius-lg 22px` / `--radius-pill` —— **只有四档**，出现 2px / 9px / 50% / 24px 之类散值即为回归 |
| 阴影 | 两个 token：`--shadow-lift`（纸面控件）与 `--glass-elevation`（玻璃；导航条那六层） |
| 间距 | `--sp-1`..`--sp-11`（0.25 / 0.5 / 0.75 / 1 / 1.5 / 2 / 3 / 4 / 5 / 6 / 7.5rem） |
| 区间距 | `--section-y: clamp(5rem, 9vw, 7.5rem)` |
| 章节头列距 | `--chapter-gap: clamp(2rem, 5vw, 5rem)` —— 三个章节头的两格**与诗区那两列**共用这一条 |
| 边距 | `--gutter: clamp(1.25rem, 4.5vw, 4.5rem)` |
| 容器 | `--shell 1440px`；正文 `--measure 62ch` |
| 玻璃几何 | `--glass-blur`、`--glass-edge-w`、`--glass-pill-ease / travel / morph` 全在 `glass.css` 的 `:root` |

- 深度由边框、玻璃与留白承担，不由堆叠阴影承担。
- 圆角嵌套遵守 concentric（外圆角 = 内圆角 + padding）。
- 分隔线是密集数据的最后手段：账本行用 `--color-line-soft`，其余分组靠间距（组间距 ≥ 组内 2×）。

---

## 6. 动效

### 6.1 四条命名缓动，无一次性曲线

`--ease-out` `cubic-bezier(.16,1,.3,1)` · `--ease-soft` `cubic-bezier(.22,1,.36,1)` · `--ease-in-out` `cubic-bezier(.65,0,.35,1)` · `--ease-snap` `cubic-bezier(.2,.9,.3,1)`

### 6.2 动效清单（每个都有动机）

| 动效 | 动机 | 触发 | 参数 | reduced-motion |
| --- | --- | --- | --- | --- |
| hero 字标升起 | 层级 | 首屏 | **整块**从 `.hero-mask` 里升起（`yPercent` 115 → 0，1.1s `power4.out`），不是逐字 | 静态 |
| 章节揭示 | 层级 | 滚动进入 | IntersectionObserver / ScrollTrigger 的低频入场 | 静态 |
| 诗区 folio 展开 | 层级 | 滚动进入 | 框架（头两格 + 落款）0.85s `power3.out` stagger 0.08，随后六节 stagger 0.07 | 静态（整块不挂载） |
| 图片 hover 去饱和 | 反馈 | hover / focus | `filter: saturate(0.72)` → `1`，`0.45s`；海报同时 `translateY(-4px)`（**没有缩放**）。滤镜只加在 `img` 上 | 无位移（`:focus-visible` 下 `transform: none`） |
| tab 幕帘 | 状态过渡 | 点击 | `clipPath` 0.8s `power4.inOut`，**必须 `clearProps`** | 静态 |
| 详情层 | 状态过渡 | 打开 / 关闭 | opacity 0.28s；visibility 延迟 | `transition: none` |
| 玻璃高光 | 反馈 | 指针移动 | 每帧一次自定义属性写入 | 禁用 |
| 药丸抓取 | 反馈 | `pointerdown` 落在药丸上 | 阴影加深（**不缩尺寸**），180ms | 静态 |
| 药丸拖拽 | 反馈 | pointermove | 吸附到指针所在栏；transform 与 width 同走 180ms 补间 | 瞬时到位 |
| 药丸落位 | 状态过渡 | 点击 / 方向键 / Home / End | transform + width 420ms `--glass-pill-ease` | 瞬时到位 |
| 影 / 剧选中 | 状态过渡 | 点击 / 键盘焦点 / 方向键（**hover 不选中**，只把环从 0.1 抬到 0.2） | 发丝环 0.1 → 0.2 → 0.34 + 卡片抬起 + 片名浮现 | 瞬时 |
| 影 / 剧落位 | 状态过渡 | 选中 / 拖拽松手 | `frame()` 里的指数趋近（`SEEK_TAU = 0.16s`），**条带上没有 GSAP 补间**；松手交出去的是速度，按 `e^(-dt/0.5)` 衰减到 1px/s 归零 | 瞬时 |
| 书架开书 | 状态过渡 | 点书脊 | 书旋出到舞台中央（GSAP，`power3.out` 落位、`expo.out` 跟随指针） | 瞬时 |
| 球队手风琴 | 状态过渡 | 点击 / Enter | `flex-grow` 0.3s（**不用 flex-basis**） | 瞬时 |
| 游戏盘落位 | 状态过渡 | 拖拽松手 / 甩动 | `power3.out` + 距离成比例时长，`FLICK_MAX` 夹住甩动 | 瞬时 |
| 照片棋盘 | 反馈 | 拖拽 / 抛掷 / 视差 | 拖拽期间逐帧直写 transform；抛掷 `REST = 1px/s` 归零 | 关掉视差、抛掷与按住缩放 |
| 光标跟随 | 反馈 | 指针移动 | 弹簧 k400 c45（ζ1.13），transform 每帧直写，到静差即停 rAF | 不启用（原生光标） |
| 光标转向 / 移动压缩 | 反馈 | 移动 > 100px/s | 旋转 k300 c60、缩放 k500 c45；移动期压到 0.95，150ms 后回 1 | 不启用 |
| 光标按压 | 反馈 | `pointerdown` | 缩放到 0.7（同一条缩放弹簧） | 不启用 |

**已删除的动效**（不要再加回来）：照片批入场 stagger、照片漂移（`--photo-drift`）、游戏卡逐卡入场 stagger、条带滚动横移（`-stage-drift`）、条带滑块（`-stage-range`）、**计数上升**（`initCounters()` 与 8 个 `[data-count]` 随 ABOUT 面板一起退役，`js/main.js` 只留一条注释）、bighead parallax、ticker、preloader、hero 影像的 overscale 入场与滚动漂移（随旧照片 hero 一起删除，现在只剩字标升起一个手势）。

### 6.3 性能红线

- 只动 `transform` / `opacity` / `filter`；`clip-path: inset()` 幕帘等价允许。
- 拖拽期间**直写 `transform`**，绝不走 `quickTo` / tween（见 11.1）。
- scrub 动画必须 `invalidateOnRefresh: true`。
- 图片加载后的 refresh 用 250ms debounce 合并（`scheduleRefresh`）。
- 滚动监听只走 ScrollTrigger / IntersectionObserver / Lenis；禁裸 `window` scroll handler。
- `transition-property` 写具体属性；禁 `transition: all`。
- `filter` 会创建**包含块**：图片滤镜只能加在图片本身，绝不能加在任何含 `position: fixed` 后代的容器上（`#lightbox` 是 fixed）。
- **`backdrop-filter` 是每帧重采样**：它能出现在浮层上，但放进横向滚动容器要付每帧的代价——`≤720px` 的 tab 条与流派行因此都转实底（见 4.8 最后一条）。音乐那两条 bar 压在纸面上：**搜索行**永远不滚动，所以永远留玻璃；**流派行**只在 `>720px` 留玻璃，`≤720px` 跟 tab 条一样转实底。

### 6.4 频率分治

- 高频（hover / press / 指针跟随）即时反馈或 ≤0.2s 颜色过渡；按压 `scale(.96)`。
- 低频入场 0.55-1.1s；退场比入场柔和。
- **弹性（spring）已退役**。V2 用 `power3/4.out` 与 `expo` 系曲线；不再出现 `back.out` / `elastic`。
- **唯一的例外是光标**（`js/smooth-cursor.js`，Framer Smoothcursor 的移植）：它要的是「指针的滞后量」，GSAP 的过冲曲线在这个尺度上只会读成抖动。允许的是**不过冲的弹簧**：三条弹簧的 ζ 必须 ≥ 1（实测 1.13 / 1.73 / 1.01，峰值都不越过目标值）。**这不是给 `back.out` / `elastic` 开口子。** 旧 `initCursor`（环 + 点 + 文字标签）与磁吸**仍然退役**。
- 每个动画状态变化必须有**静态反馈通道**（颜色 / 文字 / 图标）。

---

## 7. 站点结构

hero（**两层**：一层全幅影像 + 压在它上面的**巨型字标**，`N1GHT CHXN9` 两行居中、字号跟着 `.shell` 的内容列走；导航条是第三个浮在上面的东西。影像层 `position: absolute; inset: 0`，完全脱离文档流，所以字标仍然精确居中在视口里。眉标、标题、统计条与滚动提示全部已退役）→ PHOTOGRAPHY（章节导语 + 内联的无限照片棋盘，21 帧）→ THE ARCHIVE（六 tab）→ POEM（Dylan Thomas：**印刷 folio**——眉标 + 诗题在左格、导语在右格，中间是 3 + 3 两列的六节诗，落款左格是诗的全名、右格是收尾那句；三块共用诗自己的两列，列距只有 `:root` 的 `--chapter-gap` 一处，与两个 `.sec-head` 同一条。自述 / 统计 / coda 已退役）→ footer。

- **摄影是正文里的一屏**（`#photo` 段落内的 `.photo-wall`，高度 `clamp(400px, 62vh, 720px)`，`≤720px` 是 `clamp(320px, 56vh, 520px)`；格子宽度由 `js/photo-wall.js` 的 `CELL_VW 0.20 / CELL_MAX 280 / GAP 18` 算，实测 1440×900 下是 **262×175 的格子 + 558px 的条带**，旧的 0.14 / 208 / 14 是 183×122 + 504），不是全屏层：`#photo-view`、「Open the wall」按钮、滚动锁与 inert 那一套都已退役，nav 与页脚链接只是普通锚点。
- **棋盘是 PhantomInfiniteGallery 的 vanilla 移植**：**一张无限平面上的一窗格子**，两轴拖拽 + 抛掷 + 鼠标视差 + 按住 320ms 拉远（0.7×，钉住板心）。三条必须记住的：
  - **内容是世界坐标的纯函数**（`|(x + 3y) mod n|`）：铺到哪都铺得满，同一个世界格永远是同一张照片；图案每 n 列、每 n / gcd(3, n) 行重复一次（n = 21 时是 21 列 / 7 行，而棋盘不到四行高，短的行周期读不出来）。
  - **格子按世界槽位分配**：板子挪一列只换一格的内容，离开窗口的节点回收进 `free` 池。
  - **一次 transform 写入承载位置**（`translate3d(left, top, z) rotateY(yaw) scale(s)`）：写 `left/top` 会让拖拽的每一帧 flush 一次 layout。
- **弧是凹的**：`z = R(1 - cosθ)` 把两侧推向读者、中间留在后面，`rotateY(-θ)` 让格子与圆柱相切（`.photo-wall` 自带 `perspective: 1000px`）。
- **`touch-action: pan-y`，不是 `none`**：横划拖板、纵划滚页（鼠标仍可两轴拖）。
- **点格子开灯箱，拖拽不开**：`swiped` 在 `pointerdown` 清零、位移 > 6px 置位，`click` 在捕获阶段消费（键盘回车放行）。21 张正典是唯一的 tab stop，克隆体 `aria-hidden` + `tabIndex -1`。
- **21 帧的 `data-act` 判定口径是距离不是物种**：**BLOOM = 镜头近处活着的绿色世界**（花 / 枝 / 叶 / 树干 / 近前的动物与水面），**HORIZON = 远景，地面与天相接**（田野 / 河 / 云 / 山坡 / 村镇）。灯箱的 mono kicker 直接印这个值，全站只有这两枚，**不要为新照片新增第三个标签**。
- **无 JS 兜底**：21 个 `.photo-frame` 留在正文的 `.photo-fallback` 网格里（`html.js` 把它 `display: none`），脚本一执行就把它们搬进 `#photo-wall`。
- **棋盘是全彩的**（`--wall-saturate: 1`）：这里是「颜色是奖励不是壁纸」的**第一个明文例外**——墙上照片就是页面本身。
- **hero 的影像层也是全彩的**（无 `filter`）：**第二个明文例外**，理由同棋盘——它是这一屏的图画，压饱和只会读成渲染故障。它是 `position: absolute; inset: 0` 的一层，`object-fit: cover`，无圆角（形状锁不动）。
- **压在字标和影像之间的是 scrim，而且它是实测过的**：`linear-gradient(180deg, ink α0.46 → 0.66（20%）→ 0.66（56%）→ 0.46（78%）→ 0.70)`——中段最重，因为字标（1440×900 下 y 283–617）正好压在整张图最亮的那条带（受光云 + 燃烧环 + 尖刺星）上。实测最差像素：1440×900 **5.40:1**、390×844 6.43:1（前景 #F2F2EF；量法见 3.2 推论 3）。顶端留 0.46 是给导航玻璃留可折射的东西，底端 0.70 是让它交接到纸面那一刀干净。
- **一张图三个切法**：`<picture>` 在 `max-aspect-ratio: 3/4` 时换 `hero/nebula-tall.jpg`（708×1532，从原图正中裁的原生像素切片——横图铺 390×844 本来也只露一条 1:2.2 的窗，与其把宽图拉高不如直接给它那块像素），否则走 `srcset` 的 1200w / 2400w。桌面 1440×900 实测取 2400w，竖屏 390×844 取 tall，横屏 844×390 取 1200w。换图要同步 `alt` 与 `width` / `height`，**原图不要预裁**：露哪一块由 `object-position` 选（桌面横图纵向没有余量，只有横向能动）。
- **三个章节头是一种形状**（`.sec-head` ×2 + 诗的 `.poem-head`）：两格 `repeat(2, minmax(0, 1fr))`、共用 `--chapter-gap`、`align-items: baseline`——眉标与导语首行共线，**标题的行数不再改变导语的位置**（旧版 `align-items: end` 让导语底边跟着标题底边走，一行标题的章节导语顶边在眉标上方 11px、两行标题的在下方 39px）。
- **音乐默认单流派显示**，首屏索引 0 的 POP；chips 行没有「全部」，一次只有一枚 `aria-pressed="true"`。chips 住在 `.genre-filter` 这条布局行里、自己没有盒子（4.8）；它是**与标签条同一件玻璃托盘**，**不吸顶**——搜索行在它上面，两行都跟着列表滚走。
- **搜索跨全部 15 组**：有命中时每个命中的组都展开，组头从「136 首」改成「4 / 136」，工具条读出「18 / 477」，零命中才是 NO MATCH。搜索中点击 chip = 跳到那一组的结果；清空关键词回到单选流派。
- **游戏名册是一个定位盘**（Detent）：中心一张封面、其余按几何递减排在两侧，一次只讲一个。旧的**显式三列网格只剩兜底**：`css/games-stage.css` 用 `:not(.is-live)` 门住它。
- **球队是五格手风琴**（Framer image animation 的移植）：一行五张图，永远只有一张被撑开。
- **书是 3D 书架**：16 本书脊两面盒子，点书脊旋出封面。
- `.tab-panels` **必须是 `#archive` 的直接子元素**（`initArchiveTabs()` 用 `:scope > .tab-panels` 定位，找不到就整体不工作）；它的容器约束写在 CSS 里。

---

## 8. 无障碍基线

- 焦点：`:focus-visible` + 2px 实线 `--color-accent-text` 环（gold-700），`outline-offset: 3px`；禁无替代的 `outline: none`。**全站只有一个环色**，暗面三处（hero / lightbox / footer）与棋盘也一样用 `--color-accent-text`——代码里从来没有哪个焦点环用 `--color-accent`（gold-400）。代价是量出来的：gold-700 叠在 `--ink-950` 上是 **3.21:1**，刚过非文本 3:1 的下限；换 gold-400 会到 7.87:1，但那是**改动**（提高暗面可见度），不是现状。
- 键盘走 ARIA APG：Esc 关层、方向键在 tab / 条带 / 详情层、roving tabindex、Enter/Space 激活；`tabindex` 只用 0 和 -1。
- 不做 `<div onClick>`：动作 `<button>`、导航 `<a href>`。图标按钮带 `aria-label`。
- 目标尺寸：桌面 40×40，触摸 44×44。
- 一个 `<h1>` 不跳级；一个 `<main>`；skip link 是第一个可聚焦元素；320px 无横向滚动，200% 缩放可用。
- reduced-motion：视差与入场全静态化，hover 位移取消，信息不丢失。
- `[hidden]` 用 `display: none !important` 兜底——组件自带 `display` 会静默压过 UA 规则。

---

## 9. 改界面的最小检查清单

1. 主题锁：正文亮色；暗色只在 hero / lightbox / footer 三处。
2. 单 accent 锁：强调色命中元素 ≤ 25；静态文字只有诗区叠句例外。
3. 形状锁：只用四档 radius；嵌套 concentric。
4. 排版锁：只从 9 个字号 token 里选（5 UI + 4 展示，见 2.2）；`text-box-trim` 不与 `overflow` 截断同用。
5. 动效有动机；只动 transform / opacity / filter；拖拽直写 transform；scrub 带 `invalidateOnRefresh`。
6. 玻璃：模糊声明在增强之前；增强门是 `html.has-lens`；不给玻璃元素或其祖先加 `opacity < 1` / `filter`；**多层玻璃不进横向滚动容器**；**同一条 bar 上不要叠两层染色玻璃**（会合成到接近实心，见 4.8）；**手写玻璃也要补三条回退**（`.music-random` 与 `.genre-chip.is-active` 就是手写的，三条写在它们的配方旁边）。
7. 对比度实测不估算；玻璃按叠加后底色测。**没有已知不合格项**：早先那条「音乐工具条磨砂面上的 muted 占位符」的豁免随流派行改版一起作废（72% 板面上的 ink-500 = 5.18:1，合格，见 3.2 推论 5）。
8. 键盘 + 读屏两次走查；320px / 200% 不裁剪。
9. 文案自审；英文禁 em dash。
10. 改完递增所有改动过的 `?v=N`。

---

## 10. ARCHIVE 六栏的呈现系统

V2 把纸墨系统铺满全站时，影 / 剧那一族**没有跟上**：它保留了自己的字号阶梯、自己的 token、自己的颜色。实测出来是 7 个**从未定义**的 token 被引用 12 次，后果是**选中卡与普通卡算出完全相同的 `box-shadow`** —— 选中态是隐形的。已全部收敛：三个 reel 样式表各自从多层覆盖压成一层。**新规则写进主体，不要再开覆盖区块。**

### 10.1 索引列表（现在只有音乐在用）

书（书架）与球队（手风琴）都已不在 `.idx-*` 里；`.idx-no` / `.idx-logo` / `.idx-line` 三条孤儿规则连同 720px 下的响应式覆盖一起删掉了。

| 项 | 规则 |
| --- | --- |
| 结构 | **三栏**：64px 真封面 + `minmax(0, 1.15fr)` 标题 + `minmax(0, 1fr)` 署名（`.idx-card` 的 `grid-template-columns`，≤720px 收成两栏）；**零逐行发丝线**，靠 `padding-block` 与间距分组 |
| 分隔 | 分组靠留白（组间距 ≥ 组内 2×）；分隔线只给密集表格数据 |
| 副信息 | 与标题**同一行**，靠**字号台阶**（标题 `--fs-small` 15px、署名 `--fs-caption` 13px）与颜色分层；两者都是 400，**不用 weight 分层**，也不要加回大写 + 字距 |
| Hover | 兄弟行 `:has()` 压到 `opacity .5`，被 hover 行 `transition-duration: 0s` 瞬间归位 |

### 10.2 音乐

| 项 | 规则 |
| --- | --- |
| 封面 | 每行 **64px** 真封面（`MUSIC_COVERS` 的 477 个键**全部**指向磁盘上存在的文件，`album-covers/` 里共 400 张——多首歌共用一张；只有键缺失时才回落到同尺寸空 sleeve）。40-46px 的方块是项目符号不是图片 |
| 编号 | **删除** `counter(track)`。个人收藏不是榜单 |
| 分隔 | 零发丝线，靠行距 |
| 署名 | 句首大写、`--color-text-secondary`。大写 + 哑色 + 字距 x 477 次会把署名变成纹理 |
| Hover | 点亮**文字**（标题转 accent），不是 2.5% 的行底染色——后者低于感知阈值 |
| Chip | 激活态**不加对勾字形**（它会撑宽 chip，导致整条轨每次切流派都重排）；state 由填充与 `aria-pressed` 承担 |
| 性能 | `content-visibility: auto` + `contain-intrinsic-size` 加在 **`.genre`（15 个块）**上，不加在每张卡上 |
| 工具条 | 搜索行与流派行都是**与 `#archive-tabbar` 同一件玻璃托盘**（`.glass`，见 4.8）；**两行都不吸顶**、都随列表滚走；间距统一 `--bar-gap`（24px） |
| 搜索 | **跨全部 15 组**：命中的组全部展开，组头读「命中 / 总数」，工具条读全站命中数；`#music-search-jump` 已随「别处还有结果」这个状态一起退役 |

### 10.3 游戏

| 项 | 规则 |
| --- | --- |
| 名册 | **定位盘（Detent）**：中心一张封面、其余按几何递减排在两侧，一次只讲一个。旧的显式三列网格（≥900 三列 / 720-900 两列 / ≤720 单列）**只剩无 JS 兜底**（`:not(.is-live)` 门住） |
| 数据 | 18 个 `.hof-item` 就是牌堆，顺序即排名；成环的是**布局**（`wrapDelta`），第 18 张在第 1 张左边一格 |
| meta | **只画一次**：`.hof-name` / `.hof-hours` / `.hof-quote` 留在条目里当数据源（视觉隐藏），画进中心下方的 `.hof-now` |
| 落位 | `power3.out` + 距离成比例时长；拖拽期间逐帧直写 transform；`1:1` 量过（拖一个 `DRAG_SPAN` 正好一档，落位后中心偏移 0px） |
| 滚轮 | **只吃 `deltaX`**（+ Shift）：这是长文档里的一屏，吞掉 `deltaY` 就是滚动陷阱 |
| 尺寸 | 想整体放大就动形状（reach / NEAR / FALLOFF / GAP），**不要动 `CARD`** |

### 10.4 影 / 剧（共用 `js/reel-stage.js` 工厂）

| 项 | 规则 |
| --- | --- |
| 卡片 | **两行栅格**：`aspect-ratio: 2 / 3` 媒介盒 + 盒**外**的 meta。`grid-template-columns: minmax(0, 1fr)` **必须显式声明**（漏了它海报会按 JPG 固有尺寸渲染，实测 158 / 54 / 90 / 59 / 54 / 24px）；`grid-template-rows: auto auto 1fr`；条带 `align-items: start` |
| 字幕 | **只有片名一个字段**（限一行省略；`-card-meta-line` 那行「导演 · 年份」是 `display: none`，数据还在 DOM 里喂详情区）。genre 标签从卡片上隐藏——它已经是下方 kicker 的第一个词 |
| 编号药丸 | **退役**（`display: none`）：60 张卡各一颗不透明深色药丸，不携带条带顺序之外的信息 |
| OPEN 胶囊 | **退役**（`display: none`）：它会飘、是条带里唯一的实心深色形状，而整张卡本来就是按钮 |
| 卡片底色 | `transparent`。浅色页上的卡片没有盒子 |
| 环 | 画在 `img` 的 `outline` 上（`outline-offset: -1px`），因为它必须压在图片之上；**静止 0.1 / hover 0.2 / 选中 0.34** —— 三者必须可区分 |
| 选中态 | **两层**：可区分的发丝环 + 卡片抬起一行 + 片名（绝对定位在海报下方，只有选中那张有，底边与整排底线齐平）。meta 的展示行与 accent 上边框都已退役 |
| 详情区 | **一条左对齐的竖列**，不是两栏栅格：① 一行 mono 事实（位置号 + 类型 + 年份 + 导演）；② 注释（诗句）占一行，列宽 `max-width: 72ch`；③ `OPEN ON DOUBAN` 收在同一条左边缘上。**片名不在详情区**（它写在抬起的那张海报下面，同屏印两遍是重复） |
| 详情原则 | **纯排版、零图片**：海报只允许在条带上出现一次，同屏重复在结构上必须是**不可能** |
| 触摸 | 视口 `touch-action: pan-y`；指针滑动复用条带拖拽。**指针捕获只在越过 6px 阈值后才要**（一接触就捕获会把随后的 click 重定向，「点海报打不开」） |
| hover:none | `@media (hover: none)` 下海报直接满饱和，否则触摸设备上 60 张永久发灰 |

### 10.5 索引列表里**退役**的做法

以下任何一条重新出现都算回归：

| 退役项 | 原因 |
| --- | --- |
| 逐行发丝线（书 / 球队 / 音乐） | 12 站里 7 站不用；是表格 idiom |
| 索引列表 rank 上的 `tabular-nums` | 约 40 站普查里没有一处这样用；那是表格 register。游戏拨盘的 `.hof-rank`（`01 / 18`，带 `.mono`）不算 rank，是计数 |
| 序号大于标题 | 全场最大 rank:title = 1.0x |
| 音乐列表无封面 | 400 张封面在磁盘上而列表里 0 张 |
| 白色卡片底 + 图下白格（游戏 / 影剧） | 流媒体瓦片感 |
| 用 `counter()` 画排名 | 已并入首行微标签 |
| chip 激活态的对勾字形 | 撑宽 chip 导致整轨重排 |
| 一张卡同时四个 hover 信号 | 只留一个 |
| 静止态出现金色 | 金只在 hover / 可交互 |

---

## 11. 动效：什么让它读起来「贵」

### 11.1 拖拽必须 1:1（V2 修的第一件事）

条带的每一次位移现在都走 `place()`；在这条路径定型之前它经过 `setStrip()`，而那一版把**每一次**写入（包括每一个 `pointermove`）都送去 `gsap.quickTo()`。拿项目自己 vendored 的 GSAP 量：

| 手指速度 | 海报落后 |
| --- | --- |
| 400 px/s | 52 px |
| **1000 px/s** | **131 px** |
| 2000 px/s | 262 px |

手指和海报全程差约 8 帧。**这不是动效不够，是动效在跟手指抢方向盘。** 现在**所有**拖拽（条带、照片棋盘、游戏盘、药丸）都是拖拽期间**直写 `transform`**，实测误差 0px。补间只用于没有人在持握的时刻：松手落位（游戏盘）、reveal、选中（药丸 / tab 条），以及在条带上的等价物——`frame()` 循环里的指数趋近。

**单位陷阱**：Lenis 的 `velocity` 是 **px/帧**，ScrollTrigger 的 `self.getVelocity()` 是 **px/秒**。混用差 60 倍。

### 11.2 影 / 剧的当前位置模型（现行）

| 项 | 规则 |
| --- | --- |
| 条带 | **无限循环**（`wrapPos` / `CLONE_SETS` / `cardOffsets`）：位移用取模回绕，所以没有端点、不需要 spacer |
| 选中 | **顶点卡 = 选中卡**（`syncApex` 每帧按位置算，不靠两套状态同步）。**位置本身就是选中的函数**，没有第二个真值 |
| 拖拽 | **拖拽会改选中**（与旧版「拖拽只浏览」相反的明文决策）：滑块（`-stage-range`）已退役，方向键就是键盘路径 |
| 落位 | `frame()` 里的趋近（`SEEK_TAU`）+ `REDUCED` 时瞬时到位；**没有 spring** |
| 惯性 | 速度窗口 `VEL_WINDOW = 170ms`，过期即归零（stale-flick guard：甩一下、停住、再松手不得弹射） |
| 点击 | **点击只是选中**（`selectCard` 顺手把那张 seek 到顶点，所以点击确实会动条带）；**不开浮层**。hover 不选中，键盘焦点（`:focus-visible`）与方向键才选中 |
| 焦点 | `focusin` **只对键盘焦点（`:focus-visible`）选中**：`pointerdown` 会 focus 卡片，漏掉这条等于「手指一碰海报就已经选中了」 |
| 手势 | `swiped` 在 `pointerdown` 清零（跨卡松手根本不产生 click，只靠 click 清会吃掉下一次真实点击） |

### 11.3 明确**不做**的动效

| 不做 | 理由 |
| --- | --- |
| **滚动速度 skew** | 它是 2019-21 模板级标志；它切的正是唯一不能被切的东西（海报） |
| **逐卡反向视差** | 要给已合成的条带里 60 张卡各升一层 |
| **逐卡入场 stagger** | 算术上不可能：60 张 × 30ms 已经是 1.8s。**入场只动整体，永不动单张卡** |
| **containerAnimation** | 它的进度读 tween，而拖拽直写 `x`，两者立刻失步 |
| **任何回弹 / spring** | 已退役。现存的落位曲线都可证明不过冲：游戏拨盘与书架是 `power3.out` + 距离成比例，影 / 剧条带是 `frame()` 里的指数趋近（`SEEK_TAU`） |
| **滚动横移** | 它让「居中」变成滚动位置的函数：实测同一张卡在不同滚动位置偏离中心 4px，而居中是选中的反馈，一个会漂的反馈等于没有反馈 |
| 任何在用户没滚动也没拖拽时移动的东西 | Apple HIG |

### 11.4 两个高阶决定

**影 / 剧点击不开浮层。** 它们的详情块就在条带正下方，浮层是把页面已经在讲的东西再讲一遍——而且讲得更差：一张 250px 海报浮在暗场里，文案被挤到一边。浮层仍然是 photo / game / music 的详情机制，那三个面板没有自己的内联详情块。（曾经写过一版 FLIP，已随浮层一起删除，**不要再加回来**。）

**条带入场是一次性擦除**，加在**视口**上而不是卡片上。逐卡 stagger 在这里算术上不成立（见 11.3）。

---

## 12. 收尾：这一版的状态

- **六个 tab 各有自己的物理**：书是 3D 书架、影 / 剧是循环条带、音乐是索引长列表 + 磨砂工具条、球队是手风琴、游戏是定位盘、照片是无限棋盘。共享的只有 token、玻璃、缓动与无障碍基线。
- **玻璃只有四个落点**（4.4）；音乐工具条是唯一真的有东西可磨的一处，而它的磨砂面只有一层（4.8）。
- **一条药丸**（tab 条），**一条染色玻璃**（OPEN ON DOUBAN）。
- **每一处「为什么」都写在代码注释里**，本文件只记结论与实测数字；两者的冲突以本文件 + 代码为准，改完请同步三处（代码注释 / 本文件 / `AGENTS.md`）。
