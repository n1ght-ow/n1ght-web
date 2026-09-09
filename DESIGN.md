# N1GHT CHXN9 — DESIGN.md

> 面向实现的单一设计事实源。只记录现状，不发明新风格。
> 约束、裁决顺序与验收纪律见 `AGENTS.md`；本文件回答“这个值 / 组件该怎么用”。
> 最近核对：2026-09，对应 `css/style.css?v=49`、`css/reel-stage.css?v=4`、`main.js?v=39`。

## 0. 品牌与 Design read

**一句话**：一个明亮、克制、带 iOS 质感的个人收藏档案站；照片是主角，归档是索引，光效只给交互和每区唯一的 signature moment。

**Design read**：personal collection / archive site，受众是同好与自己；语气是 bright-luxury editorial archive，不是作品集官网、不是仪表盘、不是深色科技站。

**Dial**

| 范围 | DESIGN_VARIANCE | MOTION_INTENSITY | VISUAL_DENSITY |
| --- | --- | --- | --- |
| 全站基线 | 7 | 7 | 4 |
| PHOTOGRAPHY 章节 override | 8 | 6 | 3 |

**主题锁**：全站亮色单主题，任何分区不得反转为暗色。`#lightbox` 的深色遮罩是模态 scrim，不是分区主题。

## 1. Token 层

两层 token：原语只进 token 层；组件只准引用语义层。

### 1.1 原语（hue primitives）

| 原语 | 值 | 说明 |
| --- | --- | --- |
| `--sand-050` | `#F6F5F1` | 页面底色 |
| `--sand-100` | `#EDEBE4` | 深一档底色 / ticker / 归档区 |
| `--sand-200` | `#DFDACE` | 分隔线 |
| `--gold-100` | `#F3E9D2` | accent tint |
| `--gold-300` | `#DDB76B` | glow / 光效 |
| `--gold-500` | `#C9A227` | accent solid |
| `--gold-700` | `#7E5F20` | accent text / 描边 |
| `--ink-900` | `#1D1B16` | 主文字 |
| `--ink-600` | `#4A463D` | 次级文字 |
| `--ink-400` | `#6B675A` | muted 文字 |
| `--paper` | `#FCFBF8` | 卡片面 |

### 1.2 语义层（组件只准用这层）

| 语义 token | 指向 | 使用场景 |
| --- | --- | --- |
| `--color-bg` | `--sand-050` | 页面背景 |
| `--color-bg-deep` | `--sand-100` | ticker、归档区、深一档面 |
| `--color-surface` | `--paper` | 卡片、输入框、实底回退 |
| `--color-text` | `--ink-900` | 正文、标题 |
| `--color-text-secondary` | `--ink-600` | 描述、caption、次级信息 |
| `--color-text-muted` | `--ink-400` | 标签、编号、辅助信息 |
| `--color-line` | `--sand-200` | 分隔线、输入框边 |
| `--color-accent-solid` | `--gold-500` | 唯一实心主操作 / 激活态 |
| `--color-accent-text` | `--gold-700` | accent 文字、描边、焦点环 |
| `--color-accent-tint` | `--gold-100` | accent 浅底 |
| `--color-glow` | `--gold-300` | 光效、hover 环 |
| `--color-on-accent` | `--ink-900` | 压在 accent 实底上的文字 |

**硬规则**：组件里出现 `--sand-*` / `--gold-*` / `--ink-*` 就是违规；缺角色就新增语义 token，绝不借近值。

### 1.3 形状 / 阴影 / 玻璃 / 光效

| token | 值 | 规则 |
| --- | --- | --- |
| `--radius-sm` | `10px` | 小控件、缩略图、内层 |
| `--radius-md` | `16px` | 图片、面板、工具条 |
| `--radius-lg` | `24px` | 大卡片、详情容器 |
| `--radius-pill` | `999px` | 按钮、chip、tab |
| `--shadow-soft-sm` | `0 1px 2px rgba(29,27,22,.06), 0 3px 10px rgba(29,27,22,.08)` | 轻浮层 |
| `--shadow-soft-md` | `0 2px 4px rgba(29,27,22,.05), 0 10px 26px rgba(29,27,22,.11)` | 卡片 hover |
| `--shadow-soft-lg` | `0 4px 10px rgba(29,27,22,.06), 0 24px 52px rgba(29,27,22,.15)` | 详情层 / 大浮层 |
| `--glow-accent` | `0 6px 24px rgba(221,183,107,.5), 0 2px 8px rgba(201,162,39,.22)` | accent 光效；必须配 1px accent 描边 |
| `--ring-accent` | `0 0 0 1px var(--color-accent-text)` | 实心块的非文本 3:1 描边环 |
| `--glass-bg` | `linear-gradient(135deg, rgba(255,255,255,.82), rgba(255,255,255,.58))` | 玻璃面板底 |
| `--glass-edge` | `inset 0 1px 0 rgba(255,255,255,.9), inset 0 0 0 1px rgba(255,255,255,.55)` | 玻璃内高光边 |
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | 全站主 ease |

### 1.4 组件级 token：reel stage

| token | `.film-stage` | `.series-stage` | 说明 |
| --- | --- | --- | --- |
| `--reel-card-w` | `clamp(192px, 26vw, 268px)` | `clamp(176px, 24vw, 248px)` | 卡片宽 |
| `--reel-card-w`（compact） | `clamp(150px, 20vw, 210px)` | `clamp(140px, 19vw, 200px)` | `.is-compact` 覆盖 |
| `--reel-hover-ring` | `0 0 0 1px rgba(126,95,32,.3)` | 同 | hover 环 |
| `--reel-active-ring` | `0 0 0 1px var(--color-accent-solid)` | 同 | 激活环 |
| `--reel-sleeve-bg` | `var(--color-accent-tint)` | 同 | OPEN 袖套底 |
| `--reel-thumb-bg` | `var(--color-accent-solid)` | 同 | range thumb |
| `--reel-focus-offset` | `4px` | `3px` | focus outline 偏移 |

## 2. 字体与排版

### 2.1 字体族

| 字体 | 文件 | 字重 / 样式 | 用途 |
| --- | --- | --- | --- |
| Space Grotesk | `fonts/SpaceGrotesk-latin.woff2` | 300–700 variable | 展示 + 正文 + UI |
| IBM Plex Mono | `fonts/IBMPlexMono-300-latin.woff2`、`IBMPlexMono-400-latin.woff2` | 300 / 400 | 标签、编号、meta、按钮 |
| Instrument Serif | `fonts/InstrumentSerif-italic-latin.woff2` | 400 italic | 编辑式引言、诗、quote |

只经 `css/fonts.css` 本地加载；禁外链字体。Vast Shadow / Bungee / Calistoga / Notable 已退役，文件留在 `fonts/` 但不再声明、不再预载。

### 2.2 角色 scale

| 角色 | 代表选择器 | 字号 | 行高 | 字距 |
| --- | --- | --- | --- | --- |
| 超大标题 | `.bh-word` | `clamp(3.4rem, 12vw, 11.5rem)` | `0.98` | `-0.04em` |
| Hero 标题 | `.ht-word` | `clamp(3.2rem, 12.5vw, 11rem)` | `1.05` | `-0.04em` |
| 诗标题 | `.poem-title` | `clamp(2.4rem, 8vw, 7.5rem)` | `1.08` | `-0.03em` |
| 详情标题 | `.film-detail-title` / `.series-detail-title` | `clamp(2rem, 5vw, 4rem)` / `clamp(2rem, 5vw, 3.9rem)` | `1` | `-0.03em` |
| 章节标题 | `.photo-act-title` | `clamp(1.6rem, 3.2vw, 2.6rem)` | `1.1` | `-0.02em` |
| 归档行标题 | `.idx-title` | `clamp(1.05rem, 1.3vw, 1.35rem)` | `1.2` | `-0.01em` |
| 正文 / 描述 | `.photo-act-note` | `0.9375rem` | `1.55` | `0` |
| 卡片说明 | `.photo-frame-text` | `0.875rem` | `1.5` | `0` |
| mono 标签 | `.mono` | `0.875rem` | — | `0.14em` |
| mono 小标签 | `.photo-frame-no`、`.archive-toolbar-count` 等 | `0.8125rem` | — | `0.16em` 左右 |
| 搜索输入框 | `.music-search-input` | `0.875rem` | — | `0.08em` |

> 已知偏差：`AGENTS.md` 要求移动端输入框 16px；当前 `.music-search-input` 未单独覆盖 16px，改动音乐搜索时按 `AGENTS.md` 处理。

### 2.3 排版硬规则

- `line-height` 一律 unitless；标题约 `1.1`，正文 `1.5–1.6`，任何 ≥3 行换行文本 ≥ `1.4`。
- 长文行长 60–75ch；标题 `text-wrap: balance`，描述 `pretty`，长词 `overflow-wrap: break-word`，标签 / 徽章 `nowrap`。
- 会变化的数字一律 `font-variant-numeric: tabular-nums`（`.mono` 已内置）。
- UI 文本 ≥14px；caption 13px；很少低于 12px；mono 小标签同样受此下限约束。
- 大号标题轻微负字距；小号大写标签轻微正字距；阅读尺寸正文两者都不加。
- 英文文案禁 em dash；范围用 en dash；正文用弯引号；省略号用单字符。
- 字重 <400 只给 ≥28px 展示场景；加载实际使用的字重，避免浏览器合成。

## 3. 颜色与对比度

### 3.1 一色一义

- accent hue = 可交互。静态文字不用 accent；唯一品牌特例是 poem 区叠句 `.refrain` 用 `--color-accent-text`（gold-700）。
- 每视图只一个实心填充主操作；`--color-accent-solid` 实心块必须配 `--ring-accent` 或 1px `--color-accent-text` 描边环。
- 同 hue 15° 内视为同色；禁紫、禁纯黑 `#000`、禁纯白 `#fff`。
- 修对比度只动 lightness，不动 hue；颜色改动需用户拍板。

### 3.2 实测对比度（WCAG）

| 前景 / 背景 | 实测 | 阈值 | 用途 |
| --- | --- | --- | --- |
| ink-900 / sand-050 | 15.8:1 | AA / AAA | 主文字 |
| ink-400 / sand-050 | 4.95:1 | AA | muted 标签 |
| gold-700 / sand-050 | 5.4:1 | AA | accent 文字 / 描边 |
| ink-900 / gold-500 | 7.1:1 | AAA | accent 实底上的文字 |
| ink-600 / sand-050 | 8.61:1 | AAA | caption / 描述（2026-09 复测） |
| `rgba(252,251,248,.82)` / lightbox scrim | 10.56:1 | AAA | 详情层 caption（2026-09 复测） |
| `--color-surface` / lightbox scrim | 15.09:1 | AAA | 详情层标题（2026-09 复测） |

玻璃面板按叠加后的实际底色测；不估算。

### 3.3 渐变与纹理

- 允许克制的光泽渐变；插值空间优先 `in oklab`，双 hue 中间发灰时改 `in oklch`；禁 AI 紫渐变。
- grain 噪点层退役；质感交给材质与光效。
- 图片描边用中性低透明度（`oklch(0 0 0 / .1)` 类），不用带色调灰。

## 4. 圆角 / 阴影 / 玻璃 / 光效

### 4.1 圆角

- 全站一套 radius token：`--radius-sm / -md / -lg / -pill`；同站禁混用方角与圆角两套体系。
- 嵌套容器遵守 concentric radius：外圆角 = 内圆角 + padding。
- 按钮允许全圆 pill；图片用 `--radius-md`；缩略图用 `--radius-sm`，内图用 `calc(var(--radius-sm) - 1px)`。

### 4.2 阴影

- 只用分层透明软阴影 `--shadow-soft-*`；色相贴基底 hue；禁纯黑投影、禁硬偏移阴影。
- 边框负责结构（分隔线、选中、焦点），阴影负责深度。

### 4.3 玻璃

- 配方：`backdrop-filter: blur(16px) saturate(150%)` + `--glass-edge` 内高光边 + `--shadow-soft-sm`。
- 已用玻璃的元素：`.nav`、`.sticker`、`.bh-meta span`、`.tab-btn`、`.genre`、`.about-stats span`、`.genre-filter`、`.archive-toolbar`、`.series-stage-detail`。
- 必须带 `@media (prefers-reduced-transparency: reduce)` 实底回退（`--color-surface`，去掉 backdrop-filter）。

### 4.4 光效（品牌特例）

- 覆盖 taste-skill “NO neon / outer glows”默认值；accent 柔光辉光、radial 光斑、光泽渐变只给交互件与每区唯一 signature moment。
- 不上正文文字；辉光必须有静态可见形态，动画不能是唯一信号。
- 当前 signature moments：photo roll line、详情层 radial glow、accent 实心按钮的 `--glow-accent`、reel 卡片激活环。

## 5. 动效清单

### 5.1 动机分类

| 动效 | 动机 | 触发 | 时长 / 曲线 | reduced-motion 替代 |
| --- | --- | --- | --- | --- |
| preloader 字符升起 | 层级 | 首屏 | GSAP timeline | 静态显示 |
| bighead 双词居中 | 层级 / 叙事 | 滚动 scrub | `xPercent` / `yPercent` / clipPath，`invalidateOnRefresh` | 静态居中 |
| section mask 幕帘 | 叙事 | 滚动进入 | `clip-path` 1.25s `power4.inOut` | 静态 |
| photo roll 入场 | 层级 | 章节进入 | clipPath + y 0.85s `power3.out`，stagger 0.09s | 静态 |
| photo roll line | 叙事 | 滚动 scrub | `scaleX`，scrub | 静态分段线 |
| reel 卡片 hover | 反馈 | hover / focus | transform 0.35s `cubic-bezier(.22,1,.36,1)` | 无位移 |
| reel 详情揭示 | 层级 | 选中卡片 | clipPath + y 0.7s `power3.out`，stagger 0.07s | 静态 |
| tab 切换 | 状态过渡 | tab 点击 | clipPath 0.8s `power4.inOut` + row stagger 0.06s | 静态 |
| HOF 卡片入场 | 层级 | 滚动进入 | y / rotationX / clipPath 1.1s `power4.out`，stagger 0.09s | 静态 |
| 统一详情层 | 状态过渡 | 打开 / 关闭 | opacity 0.25s `--ease-out`；visibility 0s（关闭延迟 0.25s） | `transition: none` |
| toolbar / 收藏控件 | 反馈 | hover / press / 切换 | 0.15s 具体属性；press `scale(.96)` | `transition-duration: 0s` |
| 光标徽章 | 反馈 | 指针移动 | GSAP quickTo 0.18s `power2.out` | 禁用光标 |
| 磁吸 | 反馈 | 指针移动 | GSAP quickTo 0.18s `power2.out` | 禁用 |
| 泡泡 | 反馈 | 点击 | 0.28s `power2.in` | 静态 |
| ticker | 叙事 | 常驻 | 26s linear infinite | `animation: none` |
| drag 惯性 | 反馈 | 拖拽释放 | 0.9s `power3.out` | 直接拖拽不受 reduced 影响 |

> 代码侧统一常量：`js/main.js` 的 `MOTION.feedback`（0.15s / `power2.out`，press 0.12s）、`MOTION.enter`（0.85s / `power3.out`，`longDuration` 1.1s，`heavyEase` `power4.out`，stagger 0.09）、`MOTION.spring`（0.6s / `back.out(1.7)`，仅低频状态切换）。新增动效优先复用，不再堆一次性时间线。

### 5.2 性能红线

- 只动 `transform` / `opacity` / `filter`；`clip-path: inset()` 幕帘等价允许。
- scrub 动画必须 `invalidateOnRefresh: true`。
- 图片加载后的 refresh 用 250ms debounce 合并（`scheduleRefresh`）。
- 滚动监听只走 ScrollTrigger / IntersectionObserver / Lenis；禁裸 `window` scroll handler。
- `transition-property` 写具体属性；禁 `transition: all`。
- `will-change` 仅限 transform / opacity / filter，且只在实测首帧卡顿时加。

### 5.3 频率分治

- 高频交互（hover / press / 拖拽跟随）即时反馈，或只对 opacity / color 做 ≤150ms 过渡。
- 按压反馈 `scale(.96)`，严格 0.96。
- 低频入场 / 编排 / 状态切换可用 spring（GSAP `back.out` / `elastic` 或 CSS 近似曲线）；弹性只许低频。
- 入场 stagger 只给不常见的分层进场，约 100ms；退场比入场更柔和。
- 每个动画状态变化必须有静态反馈通道（颜色 / 图标 / 文字）；动画不能是唯一信号。

## 6. 组件边界

### 6.1 卡片

| 组件 | 选择器 | 规则 |
| --- | --- | --- |
| 照片框 | `.photo-frame` + `.photo-frame-btn` | 原生 button；图片用 `--radius-md`；hover / focus 只 `scale(1.02)`；`position: relative` 供收藏星标定位 |
| 影 / 剧卡 | `.film-card` / `.series-card` | reel-stage 工厂生成；外面套 `.film-card-wrap` / `.series-card-wrap`，收藏星标是兄弟节点，禁止 button 套 button |
| 游戏卡 | `.hof-item` + `.hof-card` | `.hof-item` 是 `role="button"` + `tabindex="0"` + Enter/Space；外面套 `.hof-item-wrap` 放收藏星标 |
| 音乐卡 | `.idx-card` | `role="button"` + `tabindex="0"`；外面套 `.idx-card-wrap` 放收藏星标；卡片右侧预留 `padding-inline-end` |
| 书 / 球队行 | `.idx-row` | 非交互行；收藏星标绝对定位在右上；`padding-inline-end: 3.4rem` 避免压字 |

### 6.2 按钮

- 动作一律原生 `<button>`；导航一律 `<a href>`；禁 `<div onClick>`。
- 图标按钮必须 `aria-label`；收藏按钮必须 `aria-pressed`。
- 主要按钮：`--color-accent-solid` 实底 + `--color-accent-text` 1px 描边 + `--glow-accent` + `--color-on-accent` 文字。
- 次级按钮：`--color-surface` 底 + `--color-line` 边 + `--color-text-secondary` 文字。
- 按压反馈 `scale(.96)`；hover / press 用具体属性的 0.15s 过渡。
- 当前按钮族：`.photo-frame-btn`、`.lb-close`、`.lb-nav`、`.lb-thumb`、`.lb-meta-link`、`.archive-density-btn`、`.archive-favorites-toggle`、`.archive-empty-clear`、`.fav-btn`、`.music-random`、`.music-search-clear`、`.tab-btn`、`.genre-chip`。

### 6.3 Chips

- `.genre-chip`：音乐流派过滤 + 归档工具条筛选共用；`aria-pressed` + `.is-active`；激活态有 `✓` 前缀，不只靠颜色。
- `.bh-meta span`：章节 eyebrow / meta 胶囊；玻璃底。
- `.tab-btn`：归档 tab；roving tabindex，活动项 0 其余 -1；方向键 / Home / End 走 ARIA APG。

### 6.4 工具条

- 结构：`#archive-toolbar` > `#archive-toolbar-filters` + `#archive-toolbar-count` + `#archive-toolbar-empty` + `#archive-sort` + `.archive-density` + `#archive-favorites-toggle`。
- `#archive-toolbar-count`：`role="status"` + `aria-live="polite"`；筛选后显示 `n / total`，如 `1 / 16 FILMS`。
- `#archive-sort`：原生 `<select>`，可见 `<label for>` 是 SORT；选项按 tab 动态生成。
- `.archive-density-btn` / `#archive-favorites-toggle`：`aria-pressed` + `✓` / `☆` / `★` 静态反馈。
- 状态由 `night:view` 持久化：每个 tab 的 `filter / sort / density / favoritesOnly`。

### 6.5 详情层

- 底座：唯一的 `#lightbox`（`role="dialog"`、`aria-modal="true"`）；五种类型共用，禁止新建第二个模态。
- 打开：`openDetail(type, index)`；关闭：`closeDetail()`；`Esc`、背景点击、`inert`、焦点回触发源。
- 类型布局：photo 显示图 + caption + 11 格 rail；film / series 显示海报 + meta + IMDb 外链；game 显示封面 + RANK + 时长 + quote；music 显示 NetEase 卡片 + 流派 / 歌名 / 艺人 + 网易云外链。
- 导航：左右方向键 + 前后按钮 + 移动端横滑；`#lb-count`、`#lb-act`、`#lb-live` 提供静态与读屏反馈。
- 图片只加载 `photo/` 低分辨率版本，不加载 `photo/full/`；不嵌 iframe、不自动播放。

### 6.6 拖拽条

- `.dragbar` + `.dragbar-track` + `.dragbar-fill` + `.dragbar-handle` + `.dragbar-meta`：游戏名册专用（photo 已改为 FIELD ROLL，不再用拖拽条）。
- 游戏名册是纯拖拽驱动：页面滚轮垂直穿过，不 pin、不 scrub；横向移动只来自抓取拖拽与拖动条。
- `makeHorizontalScroller` 暴露 `render` / `setItemCount`；收藏筛选后拖动条计数要同步。

### 6.7 玻璃面板

- 玻璃 = `--glass-bg` + `backdrop-filter: blur(16px) saturate(150%)` + `--glass-edge` + `--shadow-soft-sm`。
- `prefers-reduced-transparency: reduce` 下改 `--color-surface` 实底，去掉 backdrop-filter。
- 玻璃面板内的文字对比度按叠加后的实际底色测。

### 6.8 焦点环

- 统一 `:focus-visible`；≥2px 实线；主色用 `--color-accent-text`；深色详情层用 `--color-glow`。
- 已覆盖：`.photo-frame-btn`、`.film-card`、`.series-card`、`.hof-item`、`.genre-chip`、`.archive-sort`、`.archive-density-btn`、`.archive-favorites-toggle`、`.archive-empty-clear`、`.fav-btn`、`.lb-close`、`.lb-nav`、`.lb-thumb`、`.lb-meta-link`、`.music-search-input`、`.idx-card[data-song-id]`。

## 7. 无障碍 / reduced-motion 验收

### 7.1 键盘

- 所有动作可 Tab 到达；组合件走 ARIA APG；`Esc` 关浮层；方向键在 tab / reel / 详情层内移动；Enter / Space 激活。
- `tabindex` 只用 0 和 -1；归档 tab 用 roving tabindex。
- 焦点陷阱覆盖详情层内所有可见控件；关闭后焦点回到触发卡片。

### 7.2 结构

- 一个 `<h1>` 不跳级；一个 `<main>`；skip link 是第一个可聚焦元素。
- 模态背景 `inert`；`overscroll-behavior: contain`；详情层短屏可滚动、顶部栏 sticky。
- 320px 无横向滚动；200% 缩放可用；文本容器用 `min-height` 而非固定 `height`。

### 7.3 目标尺寸

- AA 基线 24×24；桌面 40×40；触摸 44×44。
- `.fav-btn`、`.archive-sort`、`.archive-density-btn`、`.archive-favorites-toggle`、`.archive-empty-clear`、`.lb-close`、`.lb-nav`、`.lb-thumb` 在移动端 ≥44px。

### 7.4 reduced-motion / reduced-transparency

- `prefers-reduced-motion: reduce`：视差与自动播放全移除；scrub / pinned 动画静态化；图片 hover 缩放取消；photo roll line 变静态分段线；详情层 `transition: none`；光标禁用；ticker 停止。
- `prefers-reduced-transparency: reduce`：所有玻璃面板改实底，去掉 backdrop-filter。
- 自动播放媒体有可见暂停控件；本项目不自动播放音视频。

### 7.5 读屏 / 状态

- `#lb-live`：`role="status"` + `aria-live="polite"`，播报当前详情条目。
- `#archive-toolbar-count`：`role="status"`，播报筛选结果数。
- `#music-search-count`：搜索结果计数；`#music-search-empty` 给出空结果提示。
- 收藏按钮：`aria-pressed` + 动态 `aria-label`（Save / Remove）；静态 `☆` / `★` 反馈。

## 8. 改界面的最小检查清单

1. 主题锁：全站亮色不反转；`#lightbox` 是模态 scrim，不算暗色分区。
2. 单 accent 锁：accent 只给可交互 / 激活态；静态文字不用 accent（poem `.refrain` 是唯一品牌特例）。
3. 形状一致性：只用 `--radius-*`；嵌套用 concentric；按钮可 pill。
4. 动效有动机：层级 / 叙事 / 反馈 / 状态过渡四选一，说不出的删。
5. 性能：只动 transform / opacity / filter；scrub `invalidateOnRefresh`；滚动监听只走 ScrollTrigger / IntersectionObserver / Lenis。
6. reduced-motion / reduced-transparency 两条都要过；静态反馈通道必须存在。
7. 对比度实测，不估算；玻璃按叠加底色测。
8. 键盘 + 读屏两次走查；320px / 200% 不裁剪；目标尺寸达标。
9. 文案自审：按钮动词先行；错误说明怎么修；空状态给出下一步；英文禁 em dash。
10. 改完递增所有改动过的 `?v=N` 资源版本号。
