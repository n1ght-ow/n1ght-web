# 临时 Prompt：N1GHT CHXN9 后续升级（合并版）

> 用途：把本文件整段交给后续模型执行。它是任务提示词，不是已实施方案。
> 结论来源：3 条 X 推文中的视频逐帧审阅 + `sceneai.art` / `recent.design` / `styles.refero.design` / `animejs.com` 实站核验 + 现有 PHOTO 区代码与 11 张原图审阅。
> 执行前必读：`AGENTS.md`。
> 当前状态：站点文件未改动；执行时每次只做一个 Workstream 或 Phase，做完即验证、提交、汇报，不要一次性重写整站。

---

## 0. 总目标与执行顺序

在不改变 N1GHT CHXN9 品牌方向的前提下，把站点从“有动效的个人收藏页”提升为“可浏览、可比较、可回访的私人档案馆”，并优先解决 PHOTO 区的内容错位与视觉问题。

执行顺序：

1. **Workstream A：彻底重写 PHOTOGRAPHY 章节**（P0，优先完成）
2. **Workstream B：ARCHIVE 浏览与详情增强**（P1）
   - B1：ARCHIVE 二级浏览工具条
   - B2：统一详情层
   - B3：收藏与回访机制
   - B4：`DESIGN.md` 设计事实源
   - B5：动效参数抽象（可选）

每一轮只做一个 Workstream 或 Phase。不要同时重写 PHOTO 与 ARCHIVE。

---

## 1. 全局硬约束

以下约束适用于本文件所有任务：

- 保持亮色单主题，任何分区不得反转为暗色。
- 不新增紫色、霓虹、grain 噪点、硬边阴影、方角体系。
- 只使用项目内相对路径；不引入外部图床、CDN、外部字体或 iframe。
- 不修改 `photo/` 原图、`js/vendor/`、`js/sig-data.js`。
- 不跨面板搬移内容；六个归档面板的 token 保持 `books / films / series / music / sport / games`。
- 不新增第三条 ticker；当前两条是品牌特例。
- 不自动播放音频或视频。
- 所有新增交互必须支持键盘、可见焦点、reduced-motion。
- 只动 `transform` / `opacity` / `filter`；`clip-path: inset()` 幕帘等价允许。
- 滚动监听只走 ScrollTrigger / IntersectionObserver / Lenis，禁止裸 `window` scroll handler。
- `transition-property` 写具体属性，禁止 `transition: all`。
- 修改任何带 `?v=N` 的 CSS / JS 后必须递增版本号。
- 每个阶段完成后运行 `better-interface` 纪律审查；有 HIGH 必须修，结论只能是 `Block` 或 `Approve`。

---

# Workstream A：彻底重写 PHOTOGRAPHY 章节

## A0. 结论先行

当前 PHOTO 区不是“细节不够漂亮”，而是内容、版式、交互三层同时错位：

1. 11 张照片全部是自然题材：花枝、花朵、云层、田野、天空。
   现有文案却反复写 city、street、storefront、bus、routes，与画面直接冲突。
2. 11 张照片全部是 3:2 横构图，却被排成一条等比例横向轨道，节奏单一，像未整理的长胶片。
3. 拖拽条与照片主体割裂，用户需要先发现底部控件才能横向浏览。
4. 每张照片下面都有编号胶囊 + 一句话 caption，重复结构压住了照片本身。
5. 照片区的柔和金色光效与 lightbox 的通用深色遮罩之间缺少视觉连续性。

目标是重写成**明亮、安静、编辑感强的自然观察手记**，不是继续修饰旧横向画廊。

## A1. Design Read 与方向

Reading this as: personal photography chapter for a design-aware visitor, with a bright-luxury editorial archive language, leaning toward an asymmetric contact-sheet grid and restrained scroll-driven reveals.

章节级 dial：

- `DESIGN_VARIANCE 8`
- `MOTION_INTENSITY 6`
- `VISUAL_DENSITY 3`

整站品牌基线仍是 `DESIGN_VARIANCE 7 / MOTION_INTENSITY 7 / VISUAL_DENSITY 4`；以上只是 PHOTO 章节的 override。

一句话概念：

**FIELD ROLL / 11 FRAMES**：把 11 张照片整理成一份自然观察手记，分成 `BLOOM` 与 `HORIZON` 两个连续章节，用不对称网格、留白和克制的进入动效代替横向拖拽。

## A2. 照片事实与文案

实现前必须逐张查看 `photo/` 原图，不得沿用旧 city 叙事。

| 序号 | 文件 | 画面事实 | 建议归属 |
| --- | --- | --- | --- |
| 01 | `1779456446198.jpg` | 逆光枯枝，浅色天空 | BLOOM |
| 02 | `1779456446218.jpg` | 深色枝条上的黄色花簇 | BLOOM |
| 03 | `1779456446227.jpg` | 白色花朵，蓝色背景，浅景深 | BLOOM |
| 04 | `1779456446231.jpg` | 白色花枝伸向蓝空 | BLOOM |
| 05 | `1779456446240.jpg` | 浅色花苞与叶片，绿色虚化背景 | BLOOM |
| 06 | `1779456446245.jpg` | 弧形花枝，白花，蓝空 | BLOOM |
| 07 | `1779456446248.jpg` | 密集白花与深色枝干 | BLOOM |
| 08 | `SAVE_20260616_234154.jpg` | 绿地、蓝空、大团积云 | HORIZON |
| 09 | `SAVE_20260616_234224.jpg` | 田野与低垂云层 | HORIZON |
| 10 | `SAVE_20260616_234337.jpg` | 绿色草坡与积云 | HORIZON |
| 11 | `SAVE_20260616_234423.jpg` | 开阔田野与远处云带 | HORIZON |

文案规则：

- 删除所有 city / street / storefront / bus / route / window 之类与画面不符的词。
- 文案围绕“枝条、花、云、田野、季节、光”的真实内容展开。
- 保持现有品牌声音：短句、英文为主、克制，不写 AI 腔俏皮话。
- 每张照片 caption 最长不超过 8 个英文单词，不换行成三行。
- `alt` 描述画面事实；`figcaption` 才承担情绪。
- 中文出现时加 `lang="zh"`。
- 英文文案不使用 em dash；范围使用 en dash。

可作为起点的新文案：

- 01 `Before the leaves, the shape is the story.`
- 02 `Yellow arrives first.`
- 03 `Blossom against blue.`
- 04 `A branch reaches for the sky.`
- 05 `Still folded, already reaching.`
- 06 `The arc knows where it is going.`
- 07 `Too much bloom to hold.`
- 08 `A field under a sky that keeps opening.`
- 09 `Clouds moving slower than the road.`
- 10 `Green, then a long horizon.`
- 11 `The day leaves the frame open.`

## A3. 目标结构

保留 `#photo`、`.section` 与导航锚点语义；保留 `#photo-head` 作为标题挂点，避免破坏 `splitHeadParallax("photo-head")`。内部画廊可以完全重写。

建议结构：

```text
#photo
  header.photo-chapter-head
    eyebrow: FIELD NOTES / MMXXVI
    h2: PHOTOGRAPHY
    intro: 11 frames from the slow side of the year.
    index: 11 FRAMES / 2 MOVEMENTS

  section.photo-act.photo-act-bloom
    h3: BLOOM / 01–07
    lead frame 01
    contact grid 02–07

  section.photo-act.photo-act-horizon
    h3: HORIZON / 08–11
    panorama frame 08
    paired frames 09–10
    closing frame 11

  footer.photo-end
    END OF ROLL
    11 FRAMES / MMXXVI
```

`#photo` 里的 `.ticker` 与 `.poem-tail` 是独立内容，默认原样保留。如果必须调整外层包裹，只改结构，不改 poem 文案、ID、类名和交互。

## A4. 布局

桌面：

- 使用 CSS Grid，不用复杂 flex 百分比。
- 章节最大宽度建议 `min(1440px, 100%)`，左右安全边距沿用 `clamp(1.2rem, 5vw, 6rem)`。
- 标题区非对称两栏：左侧标题、导语、章节索引；右侧 frame 01 作为 lead image。
- BLOOM 使用 12 列不对称网格：
  - frame 02 占 5 列，frame 03 占 7 列；
  - frame 04、05、06 各占 4 列；
  - frame 07 占 8 列，右侧留白作为呼吸区。
- HORIZON 使用宽幅构图：
  - frame 08 全宽；
  - frame 09 与 10 各占 6 列；
  - frame 11 全宽收尾。
- 不要让所有图片等大等距；层级来自“主图 / 次图 / 全景”的角色差异。

移动端：

- `<= 720px`：单列纵向阅读，lead frame 全宽，BLOOM 的 02–07 使用 2 列 contact sheet。
- `<= 480px`：全部单列，图片全宽，caption 在图片下方左对齐。
- 320px 不允许横向滚动；禁止依赖横向拖拽才能看到内容。
- 移动端不显示桌面端 sticky index rail。

## A5. 交互

- 照片本身使用原生 `<button>` 或带正确可访问名的 `<a>`，不要继续使用 `<figure role="button">`。
- 点击照片打开 lightbox，使用低分辨率 `photo/` 版本，不加载 `photo/full/`。
- 键盘：Enter / Space 打开，Esc 关闭，左右方向键切换，关闭后焦点回到触发照片。
- lightbox 打开时给页面主体加 `inert`，并设置 `overscroll-behavior: contain`。
- 桌面端 hover / focus 只做轻微图片放大 `1.02`，不使用大面积外发光。
- 不再为 PHOTO 保留 `makeHorizontalScroller` 的调用；该函数继续服务 GAMES roster。
- 删除 PHOTO 的 `#hs-wrap` / `#hs-track` / `#hs-dragbar` 相关绑定与死代码。

## A6. 视觉语言

- 图片是唯一主角，不给每张图套独立卡片背景。
- 图片圆角使用 `--radius-md`，不要用 `--radius-lg` 的软卡片感。
- 图片边缘使用中性 1px 低透明描边，例如 `rgba(29, 27, 22, 0.12)`。
- 默认不加阴影；hover / focus 时只加一层很轻的软阴影和金色焦点环。
- 不做 sepia、重度滤镜或统一色调覆盖；保留照片原本的蓝、绿、黄、白。
- 标题、分组名、caption 继续使用 Space Grotesk + IBM Plex Mono。
- 不新增字体，不新增外链。
- 分组标题用 ink 色，不用金色静态文字；金色只用于交互与一个 signature moment。
- caption 使用 13–14px，行高不低于 1.5；正文使用 16–18px。
- 编号改为网格中的小号 mono 标签或统一 index rail，不再每张图下面放胶囊。

只保留一个章节级光效：

- 桌面端在章节左侧或标题下方放一条细金色 roll line，随章节滚动进度填充。
- 线旁显示静态 `FRAME 01 / 11` 或 `BLOOM` / `HORIZON` 状态。
- 动效不是唯一信号；静态数字与分组标题始终可见。
- 移动端与 reduced-motion 下改成静态分段线，不跟随滚动。

## A7. 动效

允许：

- 章节首次进入时按 BLOOM / HORIZON 分组 stagger，约 `0.08–0.1s`。
- 入场使用 `clip-path: inset()` + 小 `translateY`，时长 `0.7–0.9s`，`power3.out`。
- 图片 hover / focus：`scale(1.02)`，`0.35s`，`cubic-bezier(0.22, 1, 0.36, 1)`。
- lightbox：`opacity 0 → 1`，内部内容 `scale 0.98 → 1`，`0.25s`，`power2.out`。
- 高频 hover 只做颜色、描边、阴影的短过渡。

禁止：

- 不做滚动 pin、scrub 横向轨道、鼠标视差或图片无限漂浮。
- 不做每张图独立视差。
- 不使用 `transition: all`。
- 不给正文文字加 glow。
- reduced-motion 下移除所有位移、缩放、clip-path 与进度线动画，布局保持完整。

性能：

- 滚动监听只走 ScrollTrigger / IntersectionObserver。
- 图片补 `width`、`height`、`decoding="async"`；首屏外保持 `loading="lazy"`。
- 图片加载后的 ScrollTrigger refresh 继续使用现有 `scheduleRefresh`。

## A8. Lightbox 重做

- 顶部：`FRAME 01 / 11`、`BLOOM` 或 `HORIZON`、关闭按钮。
- 中间：照片主体，低分辨率版本，最大高度约 `78vh`。
- 底部：caption + 极简 11 格 thumbnail rail，当前格用金色描边和 `aria-current="true"`。
- 桌面端左右按钮保持可点击与键盘可达；移动端支持横向滑动。
- 关闭、上一张、下一张、thumbnail 都必须是原生按钮并有可访问名。
- 背景内容使用 `inert`，焦点陷阱覆盖所有可聚焦控件，关闭后焦点回到原图。
- 不自动播放，不嵌 iframe，不加载 `photo/full/`。

## A9. PHOTO 文件落点

- `index.html`
  - 重写 `#photo` 内标题区与画廊结构，当前约 86–166 行。
  - 保留 `#poem` 与两条 ticker；不要动 poem 文案。
  - 删除旧 `.hs-*` 画廊结构后，更新 lightbox 的图片查询挂点。
- `css/style.css`
  - 重写 HORIZONTAL GALLERY 段（约 624–719 行）与 PHOTO LIGHTBOX 段（约 1749–1876 行）。
  - 更新响应式段（约 1885–1943 行）与 reduced-motion 段（约 1946 行之后）。
  - 共享 `.dragbar` 保留给 GAMES roster；不要删除游戏仍在使用的规则。
- `js/main.js`
  - 删除 PHOTO 的 `makeHorizontalScroller` 调用（约 434–444 行）。
  - 保留 GAMES 的调用（约 446–456 行）。
  - 重写 lightbox 绑定（约 523–638 行），适配新的照片挂点、thumbnail rail 与 inert 管理。
  - `splitHeadParallax("photo-head")` 要么保留兼容，要么同步改写选择器，不能留下失效动画。
- `AGENTS.md`
  - 实施完成后更新“站点结构”中“两条横向拖拽画廊”的描述；PHOTO 不再属于拖拽画廊，GAMES 仍是。

版本号：

- 修改 `css/style.css` 后把 `css/style.css?v=45` 递增为 `?v=46`。
- 修改 `js/main.js` 后把 `js/main.js?v=35` 递增为 `?v=36`。
- 若新增独立 CSS / JS，使用项目内相对路径并带 `?v=1`。

---

# Workstream B：ARCHIVE 浏览与详情增强

## B0. 参考结论

### Alex Barashkov 推文（20s，有英文旁白）

- 直接在真实网页组件上通过侧边控制面板调参，改字号、颜色、位置、动效、投影、圆角、间距，然后 Apply 回写生产页面。
- 可迁移的不是“AI 生成网页”，而是把控制权交给访问者：让收藏者调整浏览密度、排序、动效强度、卡片形态，并即时看到结果。
- 不做开发者控制台，但可以做轻量 Archive View 控件：密度、排序、动效。只影响归档区。

### SIMOOM 推文（30s）

- 主题是 8 个顶级网页设计画廊；视频展示高密度作品瀑布流、缩略图悬停预览、点击进入详情、侧栏分类。
- 可迁移机制：画廊式发现。照片区适合沉浸式看片；ARCHIVE 适合补总览网格 / 索引视图，让内容快速扫视、比较、跳转。

### Csaba Kissi 推文（41.5s，无音轨）

- 主题：`styles.refero.design` 的 DESIGN.md、`vibeindex.dev`、`ui.aceternity.com`、`animejs.com`、`minimal.gallery`。
- 视频重点是：从真实产品站抽取颜色、字体、间距、组件，生成可交给 AI agent 的 `DESIGN.md`；以及动效库的实时 demo 与可复制代码。
- 可迁移机制：设计系统可读化 + 动效可复用化。不要引入 anime.js 造成双动画运行时。

### `sceneai.art`

- 深色首屏 → Trending/Recent 切换 → 视频预览卡片网格 → 点击卡片打开全屏预览浮层 → 浮层内提供 Share / Favorite / Copy Prompt → 底部一行描述与互动数。
- 关键机制：卡片是可预览媒体；预览浮层保留上下文；`Copy Prompt` 是唯一实心主操作；Trending/Recent 与类型筛选构成两级发现路径。
- 对本站的启示：照片 lightbox 已接近这个模式，但缺少收藏/分享/信息层级；游戏、影视、音乐没有统一详情层。优先把已有 lightbox 升级成通用详情层。

### `recent.design`

- 左侧固定分类导航，顶部标签筛选，右侧自适应瀑布卡片，底部插入 jobs 与 sponsor 模块。
- 关键机制：左侧分类 + 顶部标签两级过滤；卡片以媒体为主；排序控件独立。
- 对本站的启示：ARCHIVE 已有 tab，但每个 tab 内部缺少“筛选 + 排序 + 密度”的二级工具条。音乐已有 genre chips + 搜索 + 随机，影视/游戏/照片仍偏“只能一路看下去”。

### `styles.refero.design`

- 标题 + 搜索框 + Trending/Popular/Newest 切换 + 风格卡片网格。
- 单条内容承诺：颜色、字体、间距、组件、DESIGN.md，可直接用于 AI agent。
- 对本站的启示：补 `DESIGN.md` 比继续堆视觉特效更有价值。

### `animejs.com`

- 每个能力都有实时 demo + 可复制代码。
- 对本站的启示：现有 GSAP 动效可以保留，但要建立“动效清单”：每个动效说明动机、触发条件、可中断性、reduced-motion 替代。

## B1. ARCHIVE 二级浏览工具条

目标：每个归档面板都具备“筛选 / 排序 / 密度”中的至少两项，且不改变内容归属。

落地：

- 在 `#archive .tab-panels` 上方或每个 panel 内部增加共享工具条，只在当前 tab 可见。
- 工具条结构：
  - 左侧：当前分类 / 类型筛选 chips，复用现有 `.genre-chip` 视觉语言，但不要复用 `#genre-filter` 的 id。
  - 中间：结果计数，`tabular-nums`，例如 `18 GAMES` / `763 SONGS`。
  - 右侧：排序 `<select>` 或分段按钮，例如 `CURATED / A-Z / HOURS`，影视用 `CURATED / YEAR / TITLE`。
  - 可选：密度切换 `COMFORT / COMPACT`，只影响卡片间距与尺寸，不改字体。
- 归属：
  - 通用工具条与状态管理放 `js/main.js` 的 `initArchiveTabs()` 附近，或新增 `initArchiveToolbar()`。
  - 样式放 `css/style.css` 的 THE ARCHIVE 段，语义 token 沿用现有 `--color-*`。
  - 数据筛选优先基于现有 DOM 的 `data-*` 与文本，不重写数据层；音乐渲染时输出稳定 `data-*`。
- 验收：
  - 纯键盘可操作筛选与排序；状态变化有文字 / 图标反馈，不只靠颜色。
  - 320px 下工具条换行不裁剪；200% 缩放可用。
  - 筛选后结果计数准确；空结果给出下一步提示。

## B2. 统一详情层

目标：照片、游戏、影视、音乐都能“打开一条”，但保持各自内容语义。

落地：

- 复用现有 `#lightbox` 作为通用详情层底座，扩展为支持多种内容类型；不要为每个面板新建一个模态。
- 内容类型：
  - 照片：低分辨率图 + caption + 前后导航。
  - 游戏：封面 + 名称 + 游玩时长 + 原 quote；可加当前排名与所属类型。
  - 影视：海报 + 标题 + 导演/年份/类型 + quote + IMDb 外链。
  - 音乐：歌名 + 艺人 + 所属流派 + 网易云外链；不嵌 iframe、不自动播放。
- 交互：
  - 卡片 / 行本身仍是触发源；`role="button"` 或原生 `<button>` 二选一，不要叠加冲突语义。
  - 打开后焦点进入详情层，Esc 关闭，焦点返回触发源；背景 `inert`。
  - 移动端支持滑动切换；桌面端保留左右方向键。
  - 关闭、外链、前后导航都要有可访问名。
- 归属：
  - 结构放 `index.html` 的 lightbox 附近，或由 JS 动态渲染；优先复用 `#lightbox`。
  - 行为放 `js/main.js` 的 lightbox 段，抽出 `openDetail(type, index)` 与 `closeDetail()`。
  - 样式放 `css/style.css` 的 PHOTO LIGHTBOX 段，扩展 `.lightbox` 变体类。
- 验收：
  - 四种类型都能打开 / 关闭；键盘焦点不逃逸；读屏能读出标题与关键信息。
  - 不加载 `photo/full/`；不嵌入外部资源。
  - reduced-motion 下详情层无过渡动画但仍可用。

## B3. 收藏与回访机制

目标：让“档案馆”有回访价值，而不是一次性浏览。

落地：

- 用 `localStorage` 保存轻量状态，不引入后端：
  - `night:favorites`：收藏条目 id（照片用文件名，游戏用 `data-game`，影视用 `data-film-id` / `data-series-id`，音乐用 `data-song-id`）。
  - `night:view`：归档区密度 / 排序偏好。
- UI：
  - 卡片 / 行上的收藏按钮使用图标按钮，必须有 `aria-label` 与 `aria-pressed`。
  - 归档工具条增加 `FAVORITES ONLY` 筛选；空状态提示“还没有收藏，先打开一条内容”。
  - 不做云同步，不收集用户数据。
- 验收：
  - 刷新后收藏保留；清除浏览器存储后恢复默认。
  - 收藏状态有静态反馈（图标填充 / 文字），不能只靠颜色。

## B4. 设计系统文档 `DESIGN.md`

目标：给后续模型一份机器可读的设计事实源，减少漂移。

落地：

- 新增 `DESIGN.md`，只记录现状，不发明新风格：
  - 品牌一句话与 Design read。
  - 语义 token 表（原语 → 语义 → 使用场景）。
  - 字体与字号、行高、字距规则。
  - 圆角、阴影、玻璃、光效规则。
  - 动效意图清单（层级 / 叙事 / 反馈 / 状态过渡）。
  - 组件边界（卡片、按钮、chips、工具条、详情层、拖拽条）。
  - 无障碍与 reduced-motion 验收清单。
- 不要复制 `AGENTS.md` 的全部内容；`DESIGN.md` 面向实现，`AGENTS.md` 面向约束与裁决。

## B5. 动效参数抽象（可选）

目标：让新增交互复用同一套动效参数，而不是继续堆一次性时间线。

落地：

- 在 `js/main.js` 内建立小型动效常量对象：
  - `MOTION.feedback`：高频交互，`power2.out`，≤150ms。
  - `MOTION.enter`：低频入场，`power3.out` / `power4.out`，0.7–1.1s。
  - `MOTION.spring`：仅低频状态切换，`back.out` / `elastic.out`。
- 不引入 anime.js；GSAP 已是现有事实源。
- 每个新动效必须在代码旁写一句动机注释；reduced-motion 必须有静态替代。

---

## 2. 全局禁止事项

- 不要把本站改成 SceneAI / recent.design 的视觉复刻；只迁移机制。
- 不要新增暗色主题、紫色渐变、霓虹、grain 噪点、硬边阴影、方角体系。
- 不要引入 React、Tailwind、外部 CDN、外部字体、图床或 iframe。
- 不要修改 `photo/` 原图、`js/vendor/`、`js/sig-data.js`。
- 不要把六个归档面板的内容跨面板搬移。
- 不要为了动效牺牲 320px / 200% / 键盘 / reduced-motion。
- 不要新增第三条 ticker。
- 不要自动播放音频或视频。

---

## 3. 全局验收

每个 Workstream 或 Phase 完成后必须：

1. 递增所有改动过的 `?v=N` 资源版本号。
2. 在浏览器中实测：桌面 + 320px + 200% 缩放；纯键盘走查；reduced-motion 走查。
3. 检查无 404、无外部资源请求、无新增长帧；图片懒加载仍生效。
4. 对比度实测，不估算；玻璃面板按叠加后底色测。
5. 运行 `better-interface` 纪律审查，结论只能是 `Block` 或 `Approve`；有 HIGH 必须修。
6. 提交并推送 `origin/main`，提交信息用英文祈使句。

PHOTO 专项验收：

- 11 张照片的 caption 与 alt 全部基于真实画面。
- BLOOM 与 HORIZON 的分组与实际照片内容一致。
- 1440 / 1280 / 1024 / 768 / 390 / 320 六个宽度都不横向溢出。
- 每张照片都有可见焦点环，键盘 Enter / Space 可打开。
- Esc 关闭，左右方向键切换，关闭后焦点回到触发照片。
- lightbox 背景 `inert`，焦点不逃逸。
- thumbnail rail 有 `aria-current`，按钮有可访问名。
- reduced-motion 下所有位移、缩放、进度线动画消失，布局不塌。
- 旧 PHOTO 的 `makeHorizontalScroller` 调用与 `.hs-*` 死代码已清理。
- GAMES roster 的拖拽仍正常。

ARCHIVE 专项验收：

- 纯键盘可操作筛选与排序；状态变化有文字 / 图标反馈。
- 320px 下工具条换行不裁剪；200% 缩放可用。
- 筛选后结果计数准确；空结果给出下一步提示。
- 四种内容类型都能打开 / 关闭；读屏能读出标题与关键信息。
- 收藏刷新后保留；清除浏览器存储后恢复默认。

建议提交拆分：

- `redesign(photo): replace horizontal strip with editorial field roll`
- `fix(photo): rewrite captions around the actual natural subjects`
- `refactor(photo): unify lightbox and remove dead drag code`
- `feat(archive): add shared filter and sort toolbar`
- `feat(detail): unify photo game film series music detail layer`
- `feat(archive): persist favorites and view preferences`
- `docs(design): add machine-readable design system reference`

---

## 4. 给后续模型的一句话

先把 11 张照片看成一组自然观察素材，而不是一组卡片；PHOTO 重写完成后，再按 Phase 逐项增强 ARCHIVE。每次只做一个阶段，做完即验证、提交、汇报，不要一次性重写整站。
