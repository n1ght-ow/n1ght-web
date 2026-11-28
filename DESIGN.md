---
name: N1GHT CHXN9
description: "私人影像志采用独立动画首尾：日光金属环开场，饱和蓝蓝时环景收束。"
colors:
  folio-sage: "#dce5d5"
  folio-ink: "#263b32"
  folio-wine: "#5d2638"
  folio-paper: "#f9faf6"
  folio-muted: "#56645b"
  folio-line: "rgb(38 59 50 / 20%)"
  folio-soft: "#edf0e7"
  liminal-day-paper: "#f5f4f0"
  liminal-day-ink: "#24262b"
  liminal-day-muted: "#5f6267"
  liminal-day-line: "rgb(36 38 43 / 18%)"
  liminal-day-edge: "rgb(36 38 43 / 26%)"
  liminal-day-print: "#e7e4dd"
  liminal-blue: "#173be5"
  liminal-pearl: "#f5f4f0"
  liminal-rule: "rgb(245 244 240 / 26%)"
typography:
  hero:
    fontFamily: "Bricolage Grotesque, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "clamp(88px, 11.8vw, 184px)"
    fontWeight: 550
    lineHeight: 0.82
    letterSpacing: "-0.04em"
  footer:
    fontFamily: "Bricolage Grotesque, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "clamp(56px, 6.6vw, 104px)"
    fontWeight: 500
    lineHeight: 0.92
    letterSpacing: "-0.04em"
  body:
    fontFamily: "Bricolage Grotesque, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "14px–23px"
  poetry:
    fontFamily: "Georgia, Songti SC, SimSun, serif"
    fontSize: "18px–52px"
rounded:
  media: "2px"
  control: "6px"
  return-arrow: "50%"
layout:
  shell: "1600px"
  gutter: "clamp(20px, 4.5vw, 76px)"
  hero-height: "clamp(850px, 100svh, 1000px)"
  footer-height: "clamp(650px, 100svh, 850px)"
  hero-stage-desktop: "70% × 84%"
  footer-stage-desktop: "43% wide"
  mobile-stack: "720px"
  footer-four-columns: "≤900px"
  footer-two-columns: "≤340px"
engine:
  target-fps: 30
  desktop-dpr-limit: 1.5
  desktop-pixel-budget: 1250000
  mobile-dpr-limit: 1.35
  mobile-pixel-budget: 650000
  pointer-turn-limit: 0.1
---

# Design System: N1GHT CHXN9

本站同时提供两种浏览模式。本文描述根首页的 Folio／Liminal 普通版；`3d/index.html` 保留独立的万象游乐场，视觉与玩法沿用 [3d/DESIGN.md](3d/DESIGN.md)、[WORLD_INTERACTION_PLAN.md](WORLD_INTERACTION_PLAN.md)。普通版导航中的「进入 3D 世界」与 3D 顶部的「返回普通版」使用真实页面链接。普通版的本地银色 WebGL 雕塑继续保留；Three.js、九件装置和相应纹理仅在 3D 文档加载。路由、来源与验证见 [BROWSING_MODES.md](BROWSING_MODES.md)。

## 01 · Current World

站点有两条明确边界。中段仍是私人影像志：真实照片、书、诗、画、影视、体育和游戏决定内容结构。进入页面与离开页面时，视觉暂时离开鼠尾草绿／酒红的 folio 世界，进入独立制作的 liminal 动画空间。

- **开场**：日光珍珠纸上，`N1GHT`／`CHXN9` 分两行，右侧大型扭转银色闭环由原生 WebGL1 SDF/shader 现场生成。
- **中段**：摄影、收藏、策展和应用作品使用 Folio 的排版、纸色与真实内容。
- **页尾**：同一闭环在饱和蓝 `#173be5` 的蓝时环境中返回，右侧两行大字 `Once more, from the top.` 链接回 `#hero`。

首尾是世界边界的例外，不是全站换色。`css/folio.css` 继续提供全局 folio token、导航和中段共享几何；`css/liminal-hero.css` 与 `css/liminal-footer.css` 最后加载，只在 `#hero.liminal-hero` 和 `.footer.liminal-footer` 内覆盖。

前一版的“双照片封面／Another pair”和酒红大 footer 已过期，不再定义当前首尾。旧规则若仍作为组件兼容层存在，也被后加载的 liminal 样式覆盖，不能写进现行视觉说明。

当前辅助色 `#f5f4f0` 也是浏览器 `theme-color`。原始照片、字体现有文件和中段收藏系统保持原路径。

## 应用作品

首页在策展之后展示 N1ghtScore 和 N1ghtKey，导航和页脚的 Apps 都指向 `#apps`。两件作品用鼠尾草绿和淡酒红衬底呈现 Android 界面截图，桌面并排，窄屏逐件阅读。

`apps/n1ghtscore/` 和 `apps/n1ghtkey/` 使用同一套纸色、墨绿、酒红和 Bricolage Grotesque，首屏提供 APK 发布页和源码仓库，后续按功能、安装与数据边界展开。3D 版的展区索引也提供「应用作品」入口。N1ghtScore 另有独立的网页版 `myscore/`。

## 02 · Liminal Color Tokens

| Token | Value | Current role |
| --- | --- | --- |
| `--liminal-day-paper` | `#f5f4f0` | 开场底色、封面导航底色、WebGL day background |
| `--liminal-day-ink` | `#24262b` | 开场字标、说明、操作和焦点 |
| `--liminal-day-muted` | `#5f6267` | 开场注释、禁用／减动状态 |
| `--liminal-day-line` | `rgb(36 38 43 / 18%)` | 开场细规则 |
| `--liminal-day-edge` | `rgb(36 38 43 / 26%)` | 三张照片纸边 |
| `--liminal-day-print` | `#e7e4dd` | 照片按钮底色 |
| `--liminal-blue` | `#173be5` | 页尾整面饱和蓝与 night WebGL background |
| `--liminal-pearl` | `#f5f4f0` | 页尾大字、导航和环上的纸白高光 |
| `--liminal-rule` | `rgb(245 244 240 / 26%)` | 页尾边线、圆形返回按钮边框 |

Shader 在银色金属主调上加入冰蓝环境反射和少量 restrained peach／coral 反光。反光属于现场光照与材质，不是可导出的品牌渐变，也不是对中段照片统一套色。

## 03 · Typography

首尾仍使用自托管 Bricolage Grotesque，但字号和密度脱离中段章节标题。

- **Hero wordmark**：两个独立行 mask；桌面 `clamp(88px, 11.8vw, 184px)`、字重 `550`、行高 `.82`、字距 `-.04em`。手机 `clamp(62px, 18.6vw, 84px)`、行高 `.84`。
- **Hero description**：桌面 `clamp(18px, 1.5vw, 23px)/1.32`，手机 `18px/1.28`。
- **Footer return**：两行 `Once more,`／`from the top.`；桌面 `clamp(56px, 6.6vw, 104px)`、字重 `500`、行高 `.92`；`≤900px` 使用 `clamp(44px, 12.3vw, 72px)/.96`。
- **Interface labels**：入场、motion、footer nav 和辅助说明使用 `11px–15px`，保持 Bricolage Grotesque 的直接字形。
- **Middle-site poetry**：继续使用 Georgia／Songti SC，不因首尾动画改成展示无衬线。

`N1GHT` 与 `CHXN9` 位于一个 `h1` 内，并通过两个 `.liminal-word > span` 做 mask 入场；原 `h1` 保留可读名称 `N1GHT CHXN9`。

## 04 · Hero Layout

`#hero.liminal-hero` 是全宽、无框架的日光场景：

- 高度：桌面 `clamp(850px, 100svh, 1000px)`；手机 `clamp(820px, 100svh, 900px)`。
- 导航高 `72px`；`≤540px` 时沿用两行导航的 `96px` header token。
- WebGL stage：桌面 `right: -3%`、`width: 70%`、`height: 84%`；不套外框，占据右侧主要空间。
- 文字 lead：占 `min(64%, 900px)`，左对齐并以 `Step inside` 进入 `#photo`。
- 底部控制行：三张照片按钮在左、46 张照片说明在中、共享 motion 按钮在右。
- 三张照片按钮使用 `58–74px × 72–92px`，保留轻微错角；hover／focus 时回到正面并抬升。

`721px–900px` 单独修正 stage 到 `right: -1%`、`width: 76%`，让桌面式左右构图在平板宽度完整保留，避免右侧闭环裁切。

`≤720px` 时改为上下 stack：文字在上，stage 位于约 `330–340px` 后并占 `360px` 高，照片和 motion 控制落到最下方。`≤390px` 保持同样的 stack，仅收紧照片按钮和间距。

开场导航未滚动时使用珍珠纸与 charcoal；这是 liminal hero 的局部特例。离开首屏后的导航仍回到 folio 既有表面。

## 05 · Closing Layout

`footer#closing` 以 `#173be5` 覆盖整面：

- 桌面高度 `clamp(650px, 100svh, 850px)`。
- 左侧 stage 占 `43%`、最小 `360px`，展示蓝时银环。
- 右侧返回链接宽 `min(61%, 900px)`，两行大字与一个 84px 圆形箭头组成；整个链接返回 `#hero`。
- 底部规则线上方是 `N1GHT CHXN9` 品牌、四个导航链接和共享 motion 按钮。
- 四个导航项为 Photography、Collection、Curate、Apps，常用控件保持至少 44px 高。

`≤900px` 时页尾也改为纵向：环景先占满宽度的 `280–320px`，文字与返回按钮随后排列，品牌和 motion 同排，footer links 变成四等分列。

`≤340px` 时 footer links 变成两列；因此在 `320px` 视口中四项导航以 2×2 排列。

## 06 · Middle-Site Continuity

中段馆藏、策展和赛事入口：

- 46 个原始 `.photo-frame` 及 `data-photo-index=0–45` 继续服务摄影区和策展。
- 摄影仍有 Contact sheet／All frames、路线筛选、键盘切换和共享详情。
- Archive 有 Books、Poems、Paintings、Sport、Series、Films、Games 七室，`.tab-panels` 保持 `#archive` 直属子元素。
- Curator 由三张不同照片加 Book／Film／Series／Painting 四件收藏组成，三种布局导出 `1200 × 1800` PNG。
- `/myscore/` 仍是独立中文赛事操作面与深浅主题。

hero 的三张小照片是同一批 46 张收藏的前三个入口，不制造新的封面图片集；它们分别使用稳定 frame 索引 `8`、`32`、`35`。

## 07 · Shared Liminal Engine

`js/liminal-light.js` 是首尾共用的 `window.LiminalLight`：

- 原生 WebGL1 fragment shader 以 SDF 和 ray-march 绘制扭转闭环；形状随时间轻摆、扭转并保留中心孔。
- day／night 两个 `data-light-scene` 使用同一程序，由 `uScene` 切换日光珍珠与蓝时环境。
- 一个共享 RAF 服务所有可见 WebGL 场景，目标间隔为 `1000 / 30ms`，不叠加每个场景自己的 timer。
- IntersectionObserver 只让进入视口的场景绘制；场景离开后若没有其他可见 WebGL 场景，循环立即停止。
- `document.hidden` 时停止；恢复可见且未暂停时再启动。
- 桌面 DPR 上限 `1.5`、像素预算 `1,250,000`；手机／粗指针 DPR 上限 `1.35`、预算 `650,000`。
- pointer 让闭环朝指针轻微转向，水平与垂直最大偏移各为 `±0.1`；触摸不触发该效果。
- `LiminalLight.getState()` 暴露 `running`、`paused`、`reduced`、可见场景以及各场景 `frames`，供实际 QA 判断循环是否停、帧是否增长。

### Shared motion controls

hero 与 footer 共用 `LiminalLight.toggle()`。`js/atelier-hero.js` 监听 `liminal:motion-state`，同步全部 `[data-motion-toggle]` 的文案、`aria-pressed` 与 disabled 状态：

- running：`Pause motion`；
- paused：`Resume motion`；
- reduced：`Motion reduced`，按钮 disabled。

`prefers-reduced-motion: reduce` 下引擎不启动连续 RAF，只在场景可见时绘制静帧；GSAP 入场和首尾视差也改为无动画状态。正常与 reduced preference 切换时会同步停止或恢复。

### Failure behavior

WebGL context 创建失败、shader／program 失败或人为 `WEBGL_lose_context` 时，当前 canvas 立即替换为 Canvas2D 静态银色闭环 fallback。fallback 使用同一日光／蓝时背景和银色、冰蓝、少量 peach／coral 反光。重新加载页面会重新尝试 WebGL，恢复正常绘制。

## 08 · Hero Motion

- 每次加载只执行一次入场：stage 从 `scale(.965)`、`alpha(.84)` 进入；两行字标从 mask 下方错峰显现；说明、入口、底部和照片随后进入。
- 正常动效下使用 ScrollTrigger：字标轻微上移 `-3.5%`，stage 向下位移 `6%`，均使用 scrub 视差。
- 暂停时入场直接到最终帧，视差 tween 与 trigger 暂停；恢复时继续。
- reduced 时清除首屏 transform／opacity 并静态呈现，不等待动画才能阅读或操作。

## 09 · Closing Motion

`js/liminal-footer.js` 只拥有章法，不拥有 WebGL：

- footer 接近视口时触发一次：stage 由 `scale(1.08)` 收进，标题两行从 mask 下方错峰出现，圆形箭头淡入，底部导航上移。
- footer 与 hero 共用 motion state；暂停时已完成或正在执行的 reveal 直接落到最终帧。
- reduced 时以静态顺序显示完整文字与导航。

## 10 · Components And Interaction

### Hero prints

三张照片都是真实 `<button>`，点击后调用共享 `openDetail('photo', frame, trigger)`。Escape 或正常关闭后，焦点回到对应的 hero 照片按钮。

### Step inside

`Step inside` 是普通锚点，指向 `#photo`，不借用 WebGL canvas 作为点击区域。canvas stage 对辅助技术隐藏，主内容完全由 HTML 提供。

### Motion toggle

首尾两个按钮共享状态，不能各自启动或停止一套私有循环。任一按钮切换后，两处文案同时变为 Resume／Pause；reduced 下两处同时 disabled。

### Return link

页尾大标题和圆形箭头共同组成一个链接，可读名称为 `Back to the beginning`，目标为 `#hero`。视觉上的大字不适合作为唯一小点击面，箭头、整行链接和键盘焦点共同保证操作明确。

### Context fallback

fallback 是同一构图与同一语义的降级，不是空白占位；它阻止 context-loss 默认行为并立即绘制静态环。fallback 和 WebGL canvas 都保持 `aria-hidden`，不增加重复朗读。

## 11 · Source Map

| Surface | Source |
| --- | --- |
| Hero HTML | `index.html` → `#hero.liminal-hero` |
| Footer HTML | `index.html` → `footer#closing.liminal-footer` |
| Hero visual | `css/liminal-hero.css` |
| Footer visual | `css/liminal-footer.css` |
| Engine and shader | `js/liminal-light.js` |
| Hero behavior | `js/atelier-hero.js` |
| Closing reveal | `js/liminal-footer.js` |
| Shared middle tokens | `css/folio.css` |
| Middle photography | `css/folio-photo.css`、`js/atelier-photo.js` |
| Middle archive | `css/folio-archive.css`、archive scripts |
| Curator | `css/folio-curate.css`、`js/curator-desk.js` |
| MyScore | `myscore/folio.css`、`myscore/app.mjs` |

加载顺序以 `index.html` 为准：GSAP、ScrollTrigger 和既有组件先加载，`liminal-light.js` 在 `atelier-hero.js` 之前建立共享引擎，`liminal-footer.js` 最后初始化页尾章法。

## 12 · Asset And Dependency Policy

- 没有新增生产依赖。
- 没有新增或修改 raster、照片或字体文件。
- 首尾新艺术由 `js/liminal-light.js` 中的 GLSL 和 Canvas2D fallback 现场生成。
- 三张 hero 小照片复用既有所有者收藏文件，没有生成、裁切或重制新照片。
- 当前 favicon 仍为 `assets/icons/folio-mark.svg`；Apple Touch Icon 仍单独使用既有 `assets/icons/night-enamel-apple-180.png`。
- 逐项来源见 `.impeccable/asset-provenance.json`。

## 13 · Verification Status

本轮 liminal 首尾已按 `checked_at_scope` 验证；状态为本轮指定范围，不是最终 finish review。

### Browser and engine checks

- `1440`、`1024`、`768`、`390`、`320px` 五档均无 document 横向溢出。
- 五档两个场景都进入 `webgl` 状态；对应结果见 `.impeccable/review/liminal/responsive.json`。
- Pause 后 day scene `frames` 从 `403` 到 `403` 保持不变，`running:false`；两个按钮同步显示 Resume。
- Archive 可见时 `visible:[]`、`running:false`；Night footer 独立进入后 `frames:3`，说明离屏 scene 不继续贡献 RAF。
- `Step inside` 可进入摄影；hero 照片打开 lightbox 后，Escape 关闭并回到原按钮。
- 从 footer 返回 `#hero` 后最终 `scrollY=0`。
- 通过 `WEBGL_lose_context` 实际触发 day fallback；截图 `hero-fallback.jpg` 已打开核对。Reload 后 WebGL 正常恢复。
- 正常与 reduced preference 切换时，引擎、按钮和静态帧状态同步。
- 三个变更脚本 `js/liminal-light.js`、`js/atelier-hero.js`、`js/liminal-footer.js` 通过 `node --check`。
- 正常流程暂未记录 JavaScript error；context-loss 属于人工故障注入测试。

### Visual evidence

`.impeccable/review/liminal/` 含：

- `hero-1440.jpg`、`hero-1024.jpg`、`hero-768.jpg`、`hero-390.jpg`、`hero-320.jpg`
- `footer-1440.jpg`、`footer-1024.jpg`、`footer-768.jpg`、`footer-390.jpg`、`footer-320.jpg`
- `hero-fallback.jpg`
- `responsive.json`

本轮验证报告已写入同目录的 `VERIFICATION.md`；`motion-checks.json` 记录正常运动、暂停及离屏状态。`hero-motion.jpg` 与 `footer-motion.jpg` 是普通动画运行时刻的成稿截图。关键文字组合已计算：炭黑／珍珠白 `13.76:1`、次级文字／珍珠白 `5.56:1`、珍珠白／蓝 `6.83:1`；只代表这些组合。

此前 folio／MyScore 的 QA 不构成本轮新动画的证明。本轮未测真机、`200%` 放大、实际屏幕阅读器、WebGL 性能基准、所有 GPU／浏览器组合或无动画环境的无障碍穷举。

主模型最后复测与独立 finish review 已完成；终审结论为 `ship`，本轮首尾没有必须修复项。该结论仅覆盖上述证据范围，短屏底部内容允许少量纵向滚动。
