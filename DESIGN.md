# N1GHT CHXN9 - DESIGN.md

> 面向实现的单一设计事实源（V2，2026）。只记录现状，不发明新风格。
> 结构与裁决见 `AGENTS.md`；研究留档见 `archive/design-research/` 与 `archive/premium-techniques/`。
> 最近核对：`css/style.css?v=58`、`css/glass.css?v=1`、`js/main.js?v=49`。

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

> **三条必须照做的推论**：
> 1. 导航玻璃底色不透明度**必须 ≥ 0.76**。实测 α0.60 时最差照片上 ink-600 只有 3.10:1。
> 2. `--ink-400` 这一类浅灰**不能用于小字**；muted 一律 `--ink-500`。
> 3. hero 白字依赖 scrim α0.80，任何削弱 scrim 的改动都要重新实测。

---

## 4. 液态玻璃（`css/glass.css`，唯一配方来源）

### 4.1 四层 + 一层增强

| 层 | 选择器 | 作用 | 可靠性 |
| --- | --- | --- | --- |
| 1 磨砂主体 | `.glass__body` | `blur(20px) saturate(1.7) brightness(1.05)` | 全浏览器 |
| 2 镜片边 | `.glass__edge` | 13px 环，`blur(3px) brightness(1.14)` + `mask-composite: exclude` | 全浏览器 |
| 3 镜面高光 | `.glass` 的 inset 阴影 | 顶部亮斜面 + 底部暗边 + 内晕染 | 全浏览器 |
| 4 渐变发丝边 | `.glass::before` | 1px 渐变描边，亮侧近白、暗侧转中性深 | Chrome 120+ / Safari 15.4+ / Firefox 53+ |
| 5 增强：SVG 折射 | `.glass--refract` | `feTurbulence` → `feDisplacementMap` | **仅 Chromium** |

**第 2 层的原理**：每个元素的 backdrop 包含**先前绘制的兄弟节点**，所以边缘环采样到的已经是模糊过的主体，渲染出来必然更锐更亮。这个不连续就是镜片边的读感，且只用 Baseline 特性。

### 4.2 三个必须遵守的约束

1. **祖先背景根陷阱**：祖先元素上的 `filter` / `opacity < 1` / `transform` / `mask` / `mix-blend-mode` 会建立新的 backdrop root，玻璃会退化成「无模糊」。**绝不在玻璃元素的祖先上做 opacity / transform 动画**——只动玻璃自身或其内部内容。
2. **`@supports` 对折射不可靠**：Safari 能解析 `backdrop-filter: url()` 并让 `@supports` 返回 true，但不渲染，会静默连模糊一起丢掉。所以**模糊声明永远写在增强之前**，增强用 `-webkit-backdrop-filter` 存在性做门。
3. **不要在横向滚动容器里放多层玻璃**：滚动时 backdrop 跟随移动，且绝对定位的玻璃层会随按钮一起滚。`≤720px` 的 tab 条因此改实底。

### 4.3 三重回退（研究发现的规范漏洞）

`prefers-reduced-transparency` **只有 Chromium 支持**（Safari 明确拒绝，Firefox 未实现），所以它不能是唯一回退。三条独立机制：

1. `@supports not (backdrop-filter: blur(1px))` → 实底
2. `@media (prefers-reduced-transparency: reduce), (prefers-contrast: more)` → 实底
3. `html[data-transparency="solid"]` → 实底（JS 显式开关，覆盖前两条都不生效的浏览器）

### 4.4 使用范围

玻璃**只给浮在内容之上的控件**：`.nav`、`.tabbar`（>720px）、以及未来的浮层控件。纸面上的按钮（`.music-random`、`.genre-chip`、`.lb-meta-link`）用实心色，不用玻璃——纸上的玻璃没有可折射的内容，只会发灰。

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

hero（全屏影像）→ PHOTOGRAPHY（编辑式 12 栏网格 11 帧 + 诗区）→ THE ARCHIVE（六 tab：书 6 / 影 16 / 剧 19 / 音乐 763 首 16 组 / 球队 5 / 游戏 18）→ ABOUT（统计）→ footer。

- 照片 / 影 / 剧 / 游戏 / 音乐共用唯一的 `#lightbox`。
- 照片网格**只放横构图 plate**（11 张全部是 1600×1067 = 3:2）：21:9 全幅 + 3:2 七五分栏 + 3:2 三分栏。
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