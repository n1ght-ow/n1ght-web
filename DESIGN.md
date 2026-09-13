# N1GHT CHXN9 - DESIGN.md

> 面向实现的单一设计事实源（V2，2026）。只记录现状，不发明新风格。
> 结构与裁决见 `AGENTS.md`；研究留档见 `archive/design-research/` 与 `archive/premium-techniques/`。
> 最近核对：`css/style.css?v=60`、`css/glass.css?v=2`、`css/reel-stage.css?v=7`、`js/main.js?v=51`。

## 0. 品牌与 Design read

**一句话**：一个编辑式影像档案。纸感中性底、克制的排版、全屏影像，液态玻璃只出现在浮在内容之上的控件上。

**Design read**：personal archive / photography，受众是同好与自己。语气是**编辑式画廊**，不是作品集官网、不是仪表盘、不是科技感暗色站。

**核心判断**：站点最贵的资产是 11 张照片、16 张海报、689 张专辑封面。界面不得与这些图片抢注意力。**照片是页面上唯一被允许彩色的事物。**

**Dial**：DESIGN_VARIANCE 6 / MOTION_INTENSITY 4 / VISUAL_DENSITY 4。

**主题锁**：正文页全亮色纸面。暗色只用于三处：全屏影像 hero、`#lightbox` 详情层、`.footer`。它们都是「影像与落幕」语汇，不是分区反转。

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
| `--color-surface` | paper-000 | 卡片、输入框、实底回退 |
| `--color-text` | ink-900 | 正文、标题 |
| `--color-text-secondary` | ink-600 | 描述、次级信息 |
| `--color-text-muted` | ink-500 | 标签、编号、meta |
| `--color-line` | paper-200 | 分隔线 |
| `--color-line-soft` | `oklch(0 0 0 / .055)` | 密集数据行分隔 |
| `--color-accent` | gold-400 | 强调实底 |
| `--color-accent-text` | gold-700 | 强调文字 / 焦点环 |
| `--color-accent-tint` | gold-100 | 强调浅底 |
| `--color-ink` | ink-950 | 实心墨块（激活 tab、主按钮） |
| `--color-on-dark` | on-dark | 暗层文字 |
| `--color-on-dark-muted` | `oklch(1 0 0 / .62)` | 暗层次级文字 |

---

## 2. 排版

### 2.1 字体族（全部本地自托管，禁外链）

| 字体 | 文件 | 用途 |
| --- | --- | --- |
| Space Grotesk | `fonts/SpaceGrotesk-latin.woff2`（300-700 可变） | 展示 + 正文 + UI |
| IBM Plex Mono | `fonts/IBMPlexMono-{300,400}-latin.woff2` | 标签、元信息、导航 |
| Instrument Serif | `fonts/InstrumentSerif-italic-latin.woff2`（400 italic） | 编辑式引言、诗 |

### 2.2 双寄存器字号系统（**10 个声明角色，封顶**）

这是 V2 最重要的结构决定：字号不是一条连续 ramp，而是**两个寄存器**——一套紧凑的 UI 档，一套模数化的展示档。两者之间的空档是刻意的。

**UI 寄存器**（紧凑，步进小）：

| token | 值 | 用途 |
| --- | --- | --- |
| `--fs-label` | 0.6875rem / 11px | mono 眉标 |
| `--fs-meta` | 0.75rem / 12px | mono 元信息、导航 |
| `--fs-caption` | 0.8125rem / 13px | 图片说明 |
| `--fs-small` | 0.9375rem / 15px | 次级正文、账本行标题 |
| `--fs-body` | 1rem / 16px | 正文 |

**展示寄存器**（模数 **1.25 / Major Third**）：

| token | 值 | 用途 |
| --- | --- | --- |
| `--fs-h4` | 1.25rem / 20px | 条目标题、卡片标题 |
| `--fs-h3` | `clamp(1.25rem, 1.15rem + .45vw, 1.5625rem)` / 20→25 | 区段小标题 |
| `--fs-h2` | `clamp(1.9375rem, 1.5rem + 1.9vw, 3.0625rem)` / 31→49 | 区标题 |
| `--fs-display` | `clamp(2.4375rem, 1.5rem + 4.2vw, 4.75rem)` / 39→76 | hero、coda |

> 审计时统计**声明角色数**（10），不要统计计算值——clamp 在同一断点会产出中间值（例如 `--fs-h3` 在 1440px 计算为 24.88px），那是同一个角色。

### 2.3 字距

- 展示字号负字距随字号增大：`--track-display -0.045em` → `--track-h2 -0.038em` → `--track-h3 -0.02em`。
- 小号大写标签正字距：`--track-label 0.16em`；元信息 `--track-meta 0.08em`。
- 阅读尺寸正文两者都不加。

### 2.4 光学边距

`text-box-trim: trim-both` + `text-box-edge: cap alphabetic` **只给展示档标题**（`.display` / `.sec-title` / `.coda-title` / `.footer-name`）。

> **红线**：`text-box-trim` 会把行盒裁到 cap-height/alphabetic，**移除降部空间**。任何同时 `overflow: hidden`（省略号截断）的元素绝不能加它，否则每个降部都会被切掉——「Maybe」会渲染成「Maube」。V2 曾因此踩坑。

### 2.5 排版硬规则

- `line-height` 一律 unitless；展示档 0.95-1.1，正文 1.6-1.7。
- 长文行长 60-75ch；标题 `text-wrap: balance`，描述 `pretty`。
- 会变化的数字一律 `tabular-nums`。
- UI 文本 ≥14px；caption 13px；mono 小标签 11px（仅限大写、正字距的标签场景）。
- 移动端输入框 16px（防 iOS 聚焦缩放）。
- 英文文案禁 em dash（用句号 / 逗号 / 冒号重写）；**中文破折号不受限**；en dash 只用于范围；正文用弯引号。
- 字重只用 400 / 500；700 不出现。层级由字号与留白承担，不由加粗承担。

---

## 3. 颜色

### 3.1 一色一义

- **accent = 可交互**。静态文字**只有一处**例外：诗区叠句 `.refrain` 用 `--color-accent-text`（品牌特例，用户拍板）。
- **每视图只一个实心填充主操作**。
- 全站强调色命中元素数**上限 25**（V1 是 182）。新增强调色用法即为回归。
- 修对比度只动 lightness，不动 hue；颜色改动需用户拍板。

### 3.2 实测对比度（WCAG，本次测算，2026）

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
| on-dark@0.62 / ink-950 | 8.18:1 | AAA |
| 导航玻璃 α0.78，最差照片（#101010）叠加后 ink-900 | 10.11:1 | AAA |
| hero 白字 / scrim α0.80，最差（纯白照片） | 11.55:1 | AAA |
| 卡片说明白字 / scrim α0.62，最差（纯白照片） | 5.66:1 | AA |
| **选中药丸玻璃 α0.84 / on-dark 标签（渲染实测）** | **9.25:1** | AAA |
| 同上，纯白照片叠加的最差理论值 | 10.77:1 | AAA |
| 导航条玻璃（渲染实测）/ ink-900 标签 | 17.95:1 | AAA |
| 导航条玻璃（渲染实测）/ ink-500 标签 | 5.34:1 | AA |
| tab 条玻璃（渲染实测）/ ink-500 标签 | 5.29:1 | AA |

> **四条必须照做的推论**：
> 1. 导航玻璃底色不透明度**必须 ≥ 0.76**。实测 α0.60 时最差照片上 ink-600 只有 3.10:1。
> 2. `--ink-400` 这一类浅灰**不能用于小字**；muted 一律 `--ink-500`。
> 3. hero 白字依赖 scrim α0.80，任何削弱 scrim 的改动都要重新实测。
> 4. **选中药丸（`--glass-pill` α0.84）是深色玻璃上的浅字，不是浅色玻璃上的深字**，所以它和导航条不是一回事：α 越低，`#F2F2EF` 标签越差。α0.84 在实测中最差仍有 9.25:1；把它调到 0.6 会让标签掉到约 6:1 并让药丸退化成灰色。玻璃感由**边缘**（发丝边 + 轴向棱）承担，不由降低底色不透明度承担。

---

## 4. 液态玻璃（`css/glass.css`，唯一配方来源）

### 4.1 六层

| 层 | 选择器 | 作用 | 可靠性 |
| --- | --- | --- | --- |
| 1 磨砂主体 | `.glass__body` | `blur(20px) saturate(1.7) brightness(1.05)` | 全浏览器 |
| 2 镜片边 | `.glass__edge` | 13px 环，`blur(3px) brightness(1.14)` + `mask-composite: exclude` | 全浏览器 |
| 3 镜面高光 | `.glass` 的 inset 阴影 | 顶部亮斜面 + 底部暗边 + 内晕染 | 全浏览器 |
| 4 轴向发丝边 | `.glass::before` | 1px 环，**竖直轴**：亮上 + 暗侧轨 + 暗下（亮玻璃）；亮上 + 亮下 + 暗侧轨（深色玻璃） | Chrome 120+ / Safari 15.4+ / Firefox 53+ |
| 5 按压环 | `.glass__press` | 只画 1px 环的 **conic** 渐变，`:active` 时 `opacity 1` | Chrome 120+ / Safari 15.4+ / Firefox 53+ |
| 6 增强：SVG 折射 | `.glass--refract .glass__body` | `feImage` 位移图 → `feDisplacementMap` | **仅 Blink**，见 4.2 第 4 条 |

**第 2 层的原理**：每个元素的 backdrop 包含**先前绘制的兄弟节点**，所以边缘环采样到的已经是模糊过的主体，渲染出来必然更锐更亮。这个不连续就是镜片边的读感，且只用 Baseline 特性。

**第 4 层为什么是竖直轴而不是 conic**：对 Apple 自己的表面逐像素量过，休息态的高光是**固定竖直轴**——顶边亮 1px、底边同样亮 1px、左右是**暗**发丝。conic 会把一束高光绕着四条边扫，扫过侧面时侧面反而变亮，与测量相反。**conic 只在按下态成立**，那才是高光真的会移动的时候，所以它单独占了第 5 层。

**第 5 层为什么必须是独立元素**：按压环要做淡入，而**元素自身的 `opacity < 1` 会让它自己的 `backdrop-filter` 完全失效**（实测）。所以既不能改 `.glass__edge` 的 opacity，也不能复用它；`.glass--spot::after` 已经被指针高光占用。

### 4.2 四个必须遵守的约束

1. **背景根陷阱（本机实测更正）**：在 Chrome 152.0.7977.83 上逐项跑过对照实验（同一条纹背景，量模糊后的亮度极差；无玻璃对照组 range=255 证明探针灵敏）：

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

   **会杀掉玻璃的是 `filter` / `opacity < 1`（在元素自身也成立）/ `mask` / `mix-blend-mode`；`transform` 在自身和祖先上都安全。** 这条更正很重要：它是「药丸每帧被 transform 拖动、玻璃仍然成立」的前提，也意味着**药丸绝不能用 opacity 淡入**。第三方仓库声称 `isolation: isolate` / `contain: paint` 会静默失效，在本机**不可复现**，不要据此去改 `.glass { isolation: isolate }`。

2. **折射的门必须是「正向 Blink 信号」，不能是 `@supports`**：Safari 能解析 `backdrop-filter: url()` 并让 `@supports` 返回 true，但不渲染，会静默连模糊一起丢掉。而 `@supports (-webkit-backdrop-filter: ...)` 也不行了——**Chrome 已经移除了 `-webkit-backdrop-filter` 别名，该查询在 Chrome 152 返回 false**，等于增强在所有浏览器上都没生效过。所以门是 `index.html` head 里设的 `html.has-lens`（`CSS.supports('background','paint(lg)') && CSS.supports('backdrop-filter','url(#lg-lens)')`）。**模糊声明永远写在增强之前**，增强挂不上时只丢折射，不丢模糊。

3. **不要在横向滚动容器里放多层玻璃**：滚动时 backdrop 跟随移动，且绝对定位的玻璃层会随按钮一起滚。`≤720px` 的 tab 条因此改实底，药丸也随之禁用拖拽。

4. **药丸不吃折射**：位移图的内部「压平」形状是按宽扁条（约 16:1）写的；放到 95×40 的药丸上会被拉伸变形，中心不再是中性，整颗药丸会被放大成一团亮斑（渲染中已复现）。药丸另有两个理由不吃：它是唯一会动的元素，移动的 `backdrop-filter` 每帧重采样 backdrop，而位移是其中最贵的一步。药丸的玻璃感由**模糊 + 轴向棱 + 镜面边缘**承担。

### 4.3 三重回退（研究发现的规范漏洞）

`prefers-reduced-transparency` **只有 Chromium 支持**（Safari 明确拒绝，Firefox 未实现），所以它不能是唯一回退。三条独立机制：

1. `@supports not (backdrop-filter: blur(1px))` → 实底
2. `@media (prefers-reduced-transparency: reduce), (prefers-contrast: more)` → 实底
3. `html[data-transparency="solid"]` → 实底（JS 显式开关，覆盖前两条都不生效的浏览器）

### 4.4 使用范围

玻璃**只给浮在内容之上的控件**：`.nav`、`.tabbar`（>720px）、`.glass-pill`、以及未来的浮层控件。纸面上的按钮（`.music-random`、`.genre-chip`、`.lb-meta-link`）用实心色，不用玻璃——纸上的玻璃没有可折射的内容，只会发灰。

**当前全站只有两个玻璃容器 + 两颗药丸 + 一颗染色按钮**：`header.nav`（内含 `#nav-pill`）、`#archive-tabbar`（内含 `#tab-pill`），以及 `.glass--accent`（影 / 剧详情区的 `OPEN ON IMDb`，**4.7 是它的例外条款**）。再加玻璃元素前先问：它浮在什么上面？

### 4.7 accent glass —— 纸面上唯一允许的玻璃

`.glass--accent` 是**上文「纸面上的按钮用实心色」的唯一例外**，应要求做成玻璃。它靠**香槟色染色**成立：纸上普通玻璃只会发灰（没有东西可折射），而染色给了模糊与棱可以读的东西。

| 层 | 值 | 实测渲染 |
| --- | --- | --- |
| 染色 | `color-mix(in oklab, var(--gold-400) 52%, transparent)` | 主体 `226,209,152` |
| `__body` | `blur(16px) saturate(1.08)` —— **无 brightness** | 上棱 `225,203,134` |
| `__edge` | `blur(4px) saturate(1.04)` —— **无 brightness** | 下棱 `221,197,124` |

墨字对比度 **12.51:1**（最暗的下棱 11.19:1）；降级回落 `var(--gold-400)` 实底，7.62:1。

**为什么这一版两层都不能加 `brightness()`**：`.glass__edge` 是 `position: absolute; inset: 0`，它盖住**整个**控件 —— 它不是一圈边框，而 `.glass--pill .glass__edge { padding: 9px }` 对空盒子毫无作用。所以它声明的 brightness 施加在整个表面并**与 `__body` 的叠加**。在导航玻璃上（深色、压在照片上）这个叠加就是效果本身；在浅色金染上只会削顶：**实测 `255,247,188`，红绿通道钉死在 255** —— 是奶油色，不是香槟。

导航那套 `saturate(1.9)` 同理不能照搬：`#C9A227` 本身已约 68% 饱和，1.9× 直接破 100%。染色 58% + `saturate(1.9)` 时实测**主体 `255,255,69`、下棱 `255,255,0`** —— 荧光笔。

**不吃折射**：位移图按宽扁条约 16:1 写的，放到 132×40 会把中心放大成亮斑（与选中药丸同一个已复现的问题）。它的玻璃感来自模糊、染色与镜面棱。

### 4.6 选中药丸（`js/glass-pill.js` + `.glass-pill`）

| 项 | 值 |
| --- | --- |
| 材质 | `--glass-pill` = ink-950 @ α0.84；1px 轴向棱（亮上 / 亮下 / 暗侧轨）；z-index 3 |
| 尺寸 | 由 JS 每帧写 `width` / `height` / `translate3d`，**从不写 left/top** |
| 抓取 | `pointerdown` 落在药丸矩形内 → `.is-grabbed`，`scale: 0.94`（独立 `scale` 属性，不与 `transform` 打架） |
| 拖拽 | 位置**每帧直写、零延迟**（该状态下 transition 里没有 `transform`）；宽度仍走 180ms 补间 → 跨栏时**连续形变**而非瞬移 |
| 落点 | 松开时取指针所在栏；松开点即提交点，**没有启动阈值**（点击 = 零位移的拖拽） |
| 取消 | `Escape` 或 `pointercancel` → 回到**已提交**的栏，不改选中态 |
| 标签配色 | 拖拽中只有**指针下方**那一栏保持浅色（`.is-drop-target`），其余回到墨色——否则原选中栏会一直白底白字 |
| 禁用 | `≤720px`（横向滚动容器）；`prefers-reduced-motion` 下**保留可拖**，只是瞬时到位 |
| 无障碍 | 药丸 `aria-hidden="true"`，真正的控件仍是 `<button role="tab">` / `<a href>`；拖拽只是指针增强 |

### 4.5 指针跟随高光

`.glass--spot` 的 `--mx` / `--my` 由 JS 每帧一次 `setProperty` 写入（rAF 节流）。**不能用 GSAP `quickTo`**——它只补间 transform 数值属性，不补间自定义属性。仅精指针且非 REDUCED 启用。

---

## 5. 形状 / 阴影 / 间距

| 类别 | 值 |
| --- | --- |
| 圆角 | `--radius-sm 8px` / `--radius-md 14px` / `--radius-lg 22px` / `--radius-pill` |
| 阴影 | **只有一条**：`--shadow-lift` |
| 间距 | `--sp-1`..`--sp-11`（0.25 / 0.5 / 0.75 / 1 / 1.5 / 2 / 3 / 4 / 5 / 6 / 7.5rem） |
| 区间距 | `--section-y: clamp(5rem, 9vw, 7.5rem)` |
| 边距 | `--gutter: clamp(1.25rem, 4.5vw, 4.5rem)` |
| 容器 | `--shell 1440px`；正文 `--measure 62ch` |

- **一个阴影 token**。深度由边框、玻璃与留白承担，不由堆叠阴影承担。
- 圆角只有三档 + pill，嵌套遵守 concentric（外圆角 = 内圆角 + padding）。
- 分隔线是密集数据的最后手段：账本行用 `--color-line-soft`，其余分组靠间距（组间距 ≥ 组内 2×）。

---

## 6. 动效

### 6.1 四条命名缓动，无一次性曲线

`--ease-out` `cubic-bezier(.16,1,.3,1)` · `--ease-soft` `cubic-bezier(.22,1,.36,1)` · `--ease-in-out` `cubic-bezier(.65,0,.35,1)` · `--ease-snap` `cubic-bezier(.2,.9,.3,1)`

### 6.2 动效清单（每个都有动机）

| 动效 | 动机 | 触发 | 参数 | reduced-motion |
| --- | --- | --- | --- | --- |
| hero 影像入场 | 层级 | 首屏 | scale 1.06 → 1，1.6s `power2.out` | 静态 |
| hero 文字升起 | 层级 | 首屏 | y + autoAlpha，0.7-1.1s | 静态 |
| hero 影像视差 | 叙事 | 滚动 scrub | `yPercent 8` + scale，`invalidateOnRefresh` | 静态 |
| 照片批入场 | 层级 | 滚动进入 | `ScrollTrigger.batch`，y 18 + autoAlpha，0.55s，stagger 0.06 | 静态 |
| 图片 hover 去饱和 | 反馈 | hover / focus | `filter 0.6s` + `scale 1.035` | 无位移 |
| 游戏卡入场 | 层级 | 滚动进入 | y 28 + autoAlpha，1.1s `power4.out`，stagger 0.09 | 静态 |
| 表格行 hover | 反馈 | hover | 背景 0.2s，无位移 | 仅颜色 |
| 计数上升 | 叙事 | 滚动进入一次 | 补间纯对象 + `snap`，1.2s | 直接写终值 |
| tab 幕帘 | 状态过渡 | 点击 | `clipPath` 0.8s `power4.inOut`，**必须 `clearProps`** | 静态 |
| 详情层 | 状态过渡 | 打开 / 关闭 | opacity 0.28s；visibility 延迟 | `transition: none` |
| 玻璃高光 | 反馈 | 指针移动 | 每帧一次自定义属性写入 | 禁用 |
| 药丸抓取 | 反馈 | `pointerdown` 落在药丸上 | `scale 0.94`，420ms `--glass-pill-ease` | 静态（不缩放） |
| 药丸拖拽 | 反馈 | pointermove | transform **每帧直写**；width 180ms 补间 | 瞬时到位 |
| 药丸归位 | 状态过渡 | 松手 / 取消 | transform + width 420ms `cubic-bezier(.32,.72,0,1)` | 瞬时到位 |
| 照片漂移 | 叙事 | 滚动 scrub | 每张 0→3% 或 3%→0 自身高度（**只向下，永不越过静止位**），`power1.out`，`invalidateOnRefresh` | 不创建 |

### 6.3 性能红线

- 只动 `transform` / `opacity` / `filter`；`clip-path: inset()` 幕帘等价允许。
- scrub 动画必须 `invalidateOnRefresh: true`。
- 图片加载后的 refresh 用 250ms debounce 合并（`scheduleRefresh`）。
- 滚动监听只走 ScrollTrigger / IntersectionObserver / Lenis；禁裸 `window` scroll handler。
- `transition-property` 写具体属性；禁 `transition: all`。
- `filter` 会创建**包含块**：图片滤镜只能加在图片本身，绝不能加在任何含 `position: fixed` 后代的容器上（`#lightbox` 是 fixed）。

### 6.4 频率分治

- 高频（hover / press / 指针跟随）即时反馈或 ≤0.2s 颜色过渡；按压 `scale(.96)`。
- 低频入场 0.55-1.1s；退场比入场柔和。
- **弹性（spring）已退役**。V2 用 `power3/4.out` 与 `expo` 系曲线；不再出现 `back.out` / `elastic`。
- 每个动画状态变化必须有**静态反馈通道**（颜色 / 文字 / 图标）。

---

## 7. 站点结构

hero（全屏影像）→ PHOTOGRAPHY（16 栏编辑式散页 11 帧 + 诗区）→ THE ARCHIVE（六 tab：书 6 / 影 16 / 剧 19 / 音乐 763 首 16 组 / 球队 5 / 游戏 18）→ ABOUT（统计）→ footer。

- 照片 / 影 / 剧 / 游戏 / 音乐共用唯一的 `#lightbox`。
- 照片网格**只放横构图 plate**（11 张全部是 1600×1067 = 3:2）：两张 21:9 全幅开场，其余 3:2。**只裁成这两种比例，绝不竖裁**。
- **照片区是「散页」不是表格**，三条装置各自承重：`row-gap: 0`（负偏移才能真正咬进上一行的行带）、**每张显式写 `grid-column` 起始列**（左边缘从此不落在同一列）、`align-items: start`（底边保持参差）。只给 5 张写偏移——**每张都偏就等于没偏**。
- 说明文字**常驻在 plate 下方**，不再悬停才出现（旧做法每张图都是一个黑盒，且违反 WCAG 2.2 SC 1.4.13 的可关闭要求）。
- 漂移：每张 0→3% 或 3%→0 自身高度，正负交替（相邻图反向移动）。**只向下，永不越过静止位**——对称的 ±n 会让图升进行带上方的说明文字里；实测 1440px 下只剩 1px 余量，一次字体度量变化就会破。向下则由 `.photo-frame-cap` 的上内距吸收，该值必须始终大于 `3% × 最宽 plate 高度`。两张 21:9 开场**保持静止**（它们负责锚定，全都动就没有东西是锚）。`<901px` 与 reduced-motion 下整条不创建。
- 音乐默认单流派显示，首屏 POP；chips 无「全部」，一次只亮一枚。
- 游戏名册是 `repeat(auto-fill, minmax(min(100%, 250px), 1fr))` 平铺网格，16:9 封面。
- `.tab-panels` **必须是 `#archive` 的直接子元素**（`initArchiveTabs()` 用 `:scope > .tab-panels` 定位，找不到就整体不工作）；它的容器约束写在 CSS 里。

---

## 8. 无障碍基线

- 焦点：`:focus-visible` + 2px 实线 `--color-accent-text` 环，`outline-offset: 3px`；禁无替代的 `outline: none`。
- 键盘走 ARIA APG：Esc 关层、方向键在 tab / reel / 详情层、roving tabindex、Enter/Space 激活；`tabindex` 只用 0 和 -1。
- 不做 `<div onClick>`：动作 `<button>`、导航 `<a href>`。
- 目标尺寸：桌面 40×40，触摸 44×44。
- 一个 `<h1>` 不跳级；一个 `<main>`；skip link 是第一个可聚焦元素。
- reduced-motion：视差与入场全静态化，hover 位移取消，信息不丢失。
- `[hidden]` 用 `display: none !important` 兜底——组件自带 `display` 会静默压过 UA 规则。

---

## 9. 改界面的最小检查清单

1. 主题锁：正文亮色；暗色只在 hero / lightbox / footer 三处。
2. 单 accent 锁：强调色命中元素 ≤ 25；静态文字只有诗区叠句例外。
3. 形状锁：只用三档 radius + pill；嵌套 concentric。
4. 排版锁：只从 10 个角色里选；`text-box-trim` 不与 `overflow: hidden` 同用。
5. 动效有动机；只动 transform / opacity / filter；scrub 带 `invalidateOnRefresh`。
6. 玻璃：模糊声明在增强之前；不在玻璃祖先上做 opacity / transform 动画；不放进横向滚动容器。
7. 对比度实测不估算；玻璃按叠加后底色测。
8. 键盘 + 读屏两次走查；320px / 200% 不裁剪。
9. 文案自审；英文禁 em dash。
10. 改完递增所有改动过的 `?v=N`。
---

## 11. 动效：什么让它读起来「贵」

### 11.1 先修坏的那一件：拖拽必须 1:1

条带的每一次位移都走 `setStrip()`，而它曾经把**每一次**写入（包括每一个 `pointermove`）都送去 `gsap.quickTo(strip, "x", { duration: .35, ease: "power2.out" })` —— 函数签名里的 `animate` 参数**声明了但从未被读过**。拿项目自己 vendored 的 GSAP 3.15 量：

| 手指速度 | 海报落后 |
| --- | --- |
| 400 px/s | 52 px |
| **1000 px/s** | **131 px** |
| 2000 px/s | 262 px |

手指和海报全程差约 8 帧。**这不是动效不够，是动效在跟手指抢方向盘。** 现在拖拽期间**直写 `transform`**（同 `glass-pill.js`、同 AGENTS 的「位置每帧直写」），实测误差 **0 px**。

`animate` 现在真的生效，且**只**用于三个没有人在持握的时刻：松手落位、卡片 reveal、range 提交。`maxX()` 缓存（原本每次 `setStrip` 都读 `scrollWidth`/`clientWidth`，即每个 pointermove 一次强制布局）。range 被拖动时**不回写 `range.value`**。

### 11.2 松手惯性（手写，不引依赖）

| 部件 | 常数 | 出处 |
| --- | --- | --- |
| 速度窗口 | **170ms**；窗口过期或最后一次样本超 170ms → 速度 = 0 | Embla `DragTracker`。**stale-flick guard**：甩一下→停住→松手**不得**弹射 |
| 速度→距离 | boost **鼠标 400 / 触摸 600** | Embla `snapForceBoost` |
| 吸附目标 | 小甩 → 最近点；大甩 → 前进一格 | 阈值 `clamp(50, 225, 视口宽 × 0.20)` |
| 落位补间 | `clamp(0.30, 0.90, 0.22 + \|delta\|/2600)`，`power3.out` | `power2/3/4.out` 与 `expo.out` 实测最大值**恰为 1.000000**，数学上不可能过冲 |
| 端点 | 橡皮筋，常数 **0.15** | use-gesture（iOS 是 0.55，对鼠标太软） |

实测：快甩滑行 211px 并**精确落在吸附点**、轨迹单调；慢拖 0px 滑行；甩后停 300ms 再松手 0px 滑行。

### 11.3 明确**不做**的动效

| 不做 | 理由 |
| --- | --- |
| **滚动速度 skew** | ① 它是 2019–21 GSAP 作品集时代的模板级标志；② 它切的正是**唯一不能被切的东西**（海报）；③ 按项目自己的判据它是纯装饰。若一定要：≤1.5–2°，由**条带自身的拖拽速度**驱动，不是滚动 |
| **逐卡反向视差** | 要给已合成条带里的 35 张卡各升一层 |
| **逐卡入场 stagger** | 算术上不可能：35 张 × 30ms 已经是 1.62s。**入场只动条带整体，永不动单张卡** |
| **containerAnimation** | 它确实支持 transform 驱动的横向栏（我原先的判断是错的），但它的进度读 tween，而拖拽直写 `x`，两者立刻失步 |
| **任何回弹 / spring** | 已退役；且上面的落位曲线可证明不过冲 |
| 任何在用户没滚动也没拖拽时移动的东西 | Apple HIG |

**单位陷阱**：Lenis 的 `velocity` 是 **px/帧**，ScrollTrigger 的 `self.getVelocity()` 是 **px/秒**。混用差 60 倍。

### 11.4 两个高阶动效

**影 / 剧点击不开浮层。** 它们的详情块就在条带正下方，浮层是把页面已经在讲的东西再讲一遍 —— 而且讲得更差：一张 250px 海报浮在暗场里，文案被挤到一边。**点击现在只是选中**，和 hover / Tab 完全同义。浮层仍然是 photo / game / music 的详情机制，那三个面板没有自己的内联详情块。

（曾经为此写过一版 FLIP：clone 挂 `body`、`decode()` 后再测 Last、源卡用 `opacity` 隐藏不塌陷、First 必须在 `openDetail()` 锁 `body` 滚动之前测。代码已随浮层一起删除，**不要再加回来** —— 逻辑上就不该有这个浮层。）

配套：**点击不触发 `revealCard`**（条带不位移 —— 你点的海报本来就在眼前，把它挪走是没有理由的运动）。键盘导航仍然 reveal，那里条带必须跟着焦点走。

**条带入场**：一次性 `clip-path` 擦除，加在**视口**上而不是卡片上。逐卡 stagger 在这里算术上不成立：35 张 × 30ms 就已经 1.62s，而 UI 过渡的上限是 300ms（600ms 以上属于「不涉及用户输入的 ambient」）。复用组件已有的擦除语言。

**滚动横移已删除**（曾把 4% 行程挂在 `.{prefix}-stage-drift` wrapper 上）。删掉的原因是它和居中**直接冲突**：横移让「居中」变成滚动位置的函数。实测同一张卡在不同滚动位置偏离视口中心 **4px** —— 数字不大，但居中是选中的反馈，一个会随页面滚动的反馈等于没有反馈。加它的时候条带的位置还没有含义；现在有了，它就从「让条带像空间里的一个物件」变成了「让选中指示器说谎」。

---

## 12. 影 / 剧的选中模型

### 12.1 一句话

**选中即居中；拖拽只浏览，不改选中。**

### 12.2 三个实测出来的坑

| 坑 | 症状 | 原因 |
| --- | --- | --- |
| 点击根本不动条带 | 选中一张，条带纹丝不动，只有下面的字换了 | `revealCard` 的落位公式是「距左 **25%**」（不是居中），而它在做 FLIP 那一轮被从点击路径上摘掉了，删 FLIP 时没加回来 |
| 手指一碰就选中 | 想拖条带，结果手按到哪张就选了哪张 —— 「拖拽只浏览」是假的 | 卡片是 `<button>`}，`pointerdown` 会 focus 它，而 `focusin` 处理器无条件选中。**修法：`focusin` 只对 `:focus-visible`（键盘焦点）选中** —— 这正是该伪类存在的意义 |
| 下一次点击被吃掉 | 拖拽后在**另一张卡**上松手，之后那次真实点击没反应 | `swiped` 只由随后的 click 清除，而跨卡松手**根本不产生 click**。**修法：在 `pointerdown` 清掉**，把抑制限定在产生它的那一次手势内 |

### 12.3 位置模型

| 项 | 规则 |
| --- | --- |
| 居中位 | `cardContentX + cardW/2 - viewportW/2`，按 `[0, maxX]` 夹紧 |
| 实测 | 第 **3–14** 张偏移 **0px**；第 **1/2/15/16** 张被夹在两端（条带有界，不加 spacer 就无法居中，所有 center-mode 轮播都如此） |
| 谁触发 | 点击、`Enter`/`Space`、方向键、`Home`/`End`、Tab 焦点。**不含拖拽，也不含 range** |
| 谁不触发 | 拖拽（自由浏览）、range 滑块、boot（`animate === false`） |
| 动画 | 复用 `settle()`：距离成比例的 `power3.out`（已证明不过冲），约 300–900ms |
| 拖拽落点 | 当前 `x` + 惯性，**只按 `maxX` 夹紧，不吸附卡片** —— 吸附会宣告「这张是当前的」，与「拖拽不改选中」矛盾 |
| reduced motion | 瞬时到位 |

---

## 12. films / series 的最终形状

### 12.1 条带

| 项 | 规则 |
| --- | --- |
| 卡片栅格 | **`grid-template-columns: minmax(0, 1fr)` 必须显式声明**。漏了它，单列是隐式 `auto`，而海报是 `width:100% + aspect-ratio:2/3` —— 列宽依赖图、图宽依赖列，浏览器退回按 JPG 固有尺寸排版，实测六张海报渲染成 **158 / 54 / 90 / 59 / 54 / 24 px** |
| 行 | `grid-template-rows: auto auto 1fr`；条带 `align-items: start`（默认 `stretch` 会让最长的字幕把整排撑高、海报错位） |
| 字幕 | **只有两个字段**（标题 / 导演·年份），各限一行省略，块高固定 57px。genre 标签从卡片上**隐藏** —— 它已经是下方 kicker 的第一个词 |
| OPEN 胶囊 | **退役**（`display: none`）。它会飘、是条带里唯一的实心深色形状，而整张卡本来就是按钮 |
| hover | 海报 `translateY(-4px)` + 环变深，**字幕不动** |

### 12.2 详情区：纯排版，零图片

**同屏不重复海报**是硬规则。实测高度 **404px → 199px（影）/ 150px（剧）**，右侧 1000px 空白消失（诗句拿到 46ch 量度）。

````
01 / 16   CRIME & NOIR  1972                      ON IMDb
The Godfather
Francis Ford Coppola
                     门在他身后关上。光从缝里进来，照着一张没有他的全家福。
````

栅格 `minmax(0, 26ch) minmax(0, 46ch)` + `column-gap: clamp(2rem, 6vw, 6rem)`；kicker 跨两栏（位置号把这块绑到选中的那张卡）。

**动作属于「阅读栏」而不是「身份栏」**：`OPEN ON IMDb` 在**第二栏第 3 行**（诗句正下方），实心墨胶囊 —— 它是这个面板唯一的实心主操作。曾经让它骑在 kicker 行右端，那等于把唯一能点的东西放到离它作用对象最远的位置。

---

## 10. ARCHIVE 六栏的呈现系统

V2 把纸墨系统铺满全站时，影 / 剧那一族**没有跟上**：它保留了自己的字号阶梯、自己的 token、自己的颜色。实测出来是 7 个**从未定义**的 token 被引用 12 次（`--shadow-soft-sm` / `--shadow-soft-md` / `--color-accent-solid` / `--color-glow` / `--glow-accent` / `--glass-bg` / `--glass-edge`），后果是**选中卡与普通卡算出完全相同的 `box-shadow`** —— 选中态是隐形的。已全部收敛：三个 reel 样式表各自从多层覆盖压成一层。

### 10.1 索引行（书 / 球队）

5–6 行的书架**不是表格**。旧结构是三栏 baseline 网格：标题列宽 659px 而最长标题约 232px，评语因此离它评述的文字约 **460px**；每行一条发丝线；行高恒为 95px。

| 项 | 规则 |
| --- | --- |
| 结构 | 首列 2.75rem + 单栏；评语落在第 2 行第 2 列（与标题左对齐的悬挂缩进） |
| 分隔 | **零发丝线**。12 个编辑式索引站里 7 个不用任何分隔线，逐行发丝线是表格 idiom |
| 行节奏 | `padding-block: clamp(1.5rem, 3vw, 2.75rem)` |
| 序号 | `--fs-label` (11px) mono、muted、**不用 tabular-nums**（那是表格 / 日期 / 表单的 register） |
| 副信息 | 与标题**同一行**，靠 weight (500 / 400) 与颜色分层，**不靠字号台阶** |
| 球队队徽 | 统一 2.75rem x 2.75rem 等比盒（`object-fit: contain`），取代序号 —— 一枚徽记比一个名次更有信息量 |
| Hover | 兄弟行 `:has()` 压到 `opacity .5`，被 hover 行 `transition-duration: 0s` 瞬间归位 |

### 10.2 音乐

| 项 | 规则 |
| --- | --- |
| 封面 | 每行 **64px** 真封面（`MUSIC_COVERS`，689 / 761 有图；缺图回落同尺寸空 sleeve）。40–46px 的方块是项目符号不是图片；要么 ≥64px，要么不要图 |
| 编号 | **删除** `counter(track, decimal-leading-zero)`。个人收藏不是榜单 |
| 分隔 | 零发丝线，靠行距 |
| 署名 | 句首大写、`--color-text-secondary`。大写 + 哑色 + 字距 x 108 次会把署名变成纹理 |
| Hover | 点亮**文字**（标题转 accent），不是 2.5% 的行底染色 —— 后者低于感知阈值 |
| Chip | 激活态**不再加对勾字形**（它会撑宽 chip，导致整条 16-chip 轨每次切流派都重排） |
| 性能 | `content-visibility: auto` 加 `contain-intrinsic-size` 加在 **`.genre`（16 个块）**上，不加在每张卡上 —— 763 个可聚焦行不适合做 containment 单元 |

### 10.3 游戏

| 项 | 规则 |
| --- | --- |
| 栅格 | **显式列数**：≥900px 三列 / 720–900 两列 / ≤720 单列。18 只能被 1 / 2 / 3 / 6 / 9 / 18 整除；`auto-fill minmax(250px,1fr)` 在 1440 下出 **4 栏 = 4 行零 2 个孤儿**，末行残缺是最像「事故」的一处 |
| 卡片 | **无底色、无阴影、无抬升**。封面直接落在纸面上，元信息是图下的排版 —— 白盒才是「流媒体瓦片」的来源 |
| 排名 | 序号与时长**并成一行**，不再各占一行；`min-height: 2.6em` 删除 |
| 评语 | **一行截断**（`-webkit-line-clamp: 1`）加 `--fs-label` 加 muted。18 句同时可见 = 18 句互相竞争；全文仍在 `#lightbox` |
| Hover | **单一信号**：3px 边框从封面外 3px 收敛到 `inset: 0`（Letterboxd）。旧版同时有 translateY 加图片 scale 加 shadow-lift 加 inset 环共 4 个信号，那正是「模板感」的定义 |
| 间隙 | 行距 > 列距（itch `20px 10px` / loadmo `20px 18px`）—— 最便宜的「不像栅格」动作 |

### 10.4 影 / 剧

| 项 | 规则 |
| --- | --- |
| 卡片 | **两行栅格**：`aspect-ratio: 2 / 3` 媒介盒加盒**外**的 meta。旧版是 `3 / 4.15`（0.7229）的盒子加 `object-fit: cover`，把 2:3 的海报裁掉约 7.7%，meta 又压在底部色带上 |
| 编号药丸 | **删除**。35 张卡各一颗不透明深色药丸，不携带条带顺序之外的信息 |
| 卡片底色 | `transparent`。浅色页上的卡片没有盒子（Criterion 在浅色页正是背景透明） |
| 环 | 画在 `img` 的 `outline` 上（`outline-offset: -1px`），因为它必须**压在图片之上**；静止 0.1 / hover 0.2 / **选中 0.34** —— 三者必须可区分，否则选中态丢失 |
| 选中态 | 三层：发丝环加 meta 的 accent 上边框加居中的 OPEN chip（条带里唯一的实心深色形状）。**加第四条就会互相稀释** |
| 触摸 | 视口 `touch-action: pan-y` 加指针滑动复用 `setStrip()`。此前 `pan-x` 在 `overflow: hidden` 上什么都不做，**手指滑动完全无效**，手机上唯一路径是拖 range 滑块 |
| 指针捕获 | **只在越过 6px 阈值后才捕获**。一接触就捕获会把随后的 click 重定向到视口，等于「点海报打不开」 |
| hover:none | `@media (hover: none)` 下海报直接满饱和，否则 35 张海报在触摸设备上永久发灰 |

### 10.5 索引列表里**退役**的做法

以下任何一条重新出现都算回归：

| 退役项 | 原因 |
| --- | --- |
| 逐行发丝线（书 / 球队 / 音乐） | 12 站里 7 站不用；是表格 idiom |
| rank 上的 `tabular-nums` | 约 40 站普查里**没有一处**这样用；那是表格 register |
| 序号大于标题 | 全场最大 rank:title = **1.0x**，没有站把 rank 做得比标题大 |
| 音乐列表无封面 | 689 张封面在磁盘上而列表里 0 张 |
| 白色卡片底加图下白格（游戏 / 影剧） | 流媒体瓦片感 |
| 用 `counter()` 画排名 | 已并入首行微标签 |
| chip 激活态的对勾字形 | 撑宽 chip 导致整轨重排 |
| 一张卡同时四个 hover 信号 | 只留一个 |
| 静止态出现金色 | Criterion 的金在 807KB 里出现 92 次，**只在 hover** |
