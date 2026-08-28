# N1GHT CHXN9 — 项目约定（OpenCode 自动加载）

纯静态个人收藏站：`index.html` 双击即可运行，**没有构建步骤**，所有改动必须保持这一性质。
第一验收标准是动效质感：动效必须"会回应人"，不做无输入的纯播放装饰。

## 硬性禁区

- `.venv/` 是 Python 虚拟环境（仅用于 Pillow 图片处理），**禁止读取、修改、删除**。
- `photo/` 下的原图是唯一素材，**禁止修改或删除**；`photo/full/` 存放对应大图。
- 不引入外部图床 / CDN 资源；图片一律用项目内相对路径（`photo/…`、`covers/…`、`posters/…`、`fonts/…`）。

## 技术约束

- 单页静态站：`index.html` + `css/*.css` + `js/*.js`，无打包器、无 npm 运行时依赖；新脚本继续用 `<script>` 顺序加载。
- GSAP + ScrollTrigger 使用本地 vendor 文件（`js/vendor/`），已在 main.js 中 `gsap.registerPlugin`。
- 动画只操作 `transform` / `opacity`；`clip-path: inset()` 幕帘视为遮罩的等价形式，同样允许；所有 scrub 动画必须 `invalidateOnRefresh: true`；图片加载完成后调用 `ScrollTrigger.refresh()`。
- 必须尊重 `prefers-reduced-motion: reduce`：每段动画都要有静态降级（JS 的 `REDUCED` 分支和 CSS 媒体查询都要覆盖）。
- 字体通过 `css/fonts.css` 的 `@font-face` 加载本地 woff2。

## 动效基准：向这些站学习

动手前先问一句：**这个动效在回应什么？** 对标对象与各自学分：

| 站点 | 学什么 |
|---|---|
| dennissnellenberg.com | 微交互学派：磁吸按钮、自定义光标变形、遮罩行式文字进场、footer reveal、页面过场。与我们同属 landonorris 一脉，是质感标杆。 |
| joshwcomeau.com | 趣味来自"输入→反馈"：弹簧物理、一切可点之物都有回应、Web Audio 现场合成的声音设计。学他的思路，不搬他的 React 技术栈。 |
| seanhalpin.xyz | 场景化 hero：页面是一个小世界，元素对指针有反应、有角色感，而不是贴图加视差。 |
| lynnandtonic.com | 概念驱动：一年一个核心概念，动效从内容本身长出来，交互即概念的表达。 |
| bruno-simon.com | 一个 signature moment 打天下：站点本身就是玩具。学"做一件让人记住的中心件"，不是 three.js。 |
| cassie.codes | GSAP 原生的俏皮滚动叙事 + SVG 描线工艺：短小、精确、有惊喜感。 |
| landonorris.com | 原有质感基准：极端字重对比、大留白、不对称、scrub 的节奏与克制。继续作为视觉与节奏的底线。 |

## 动效铁律

1. **回应优先于播放**。每个区块至少一个"回应件"——对 hover / 点击 / 拖拽 / 滚动速度做出可感知反应。纯 fade、纯 scrub 视差不算数。
2. **一区一个 signature moment**。每个 ACT 只允许一个主角动效，其余退为配角；主角必须唯一、说得出名字（"这个区让人记住什么"）。
3. **微反馈要有物理性格**。hover / 按下用 `back.out`、`elastic.out`、`gsap.quickTo` 惯性插值；禁止 linear 硬切与瞬间跳变，被"碰"的东西要回弹。
4. **可点元素必须有光标/悬停反馈**。自定义光标变形（放大、贴标签）或磁吸位移，二选一；裸 `<a>` 无反馈视为 bug。
5. **文字进场走遮罩**。标题与段落用 overflow mask + `yPercent` 行级揭示，或等价的 `clip-path: inset()` 幕帘；禁止大面积裸 fade。
6. **滚动速度是输入**。marquee / 长列表可由滚动速度驱动 skew 或变速（快滚变形、停住回正）。
7. **玩具要成状态机**。元素有可翻转的状态、操作有后果：泡泡点爆重生、抽屉互斥、拖把吸附。这是站内已验证的最佳模式，新动效优先复制这类结构。
8. **概念长出动效**。摄影=胶片/暗房、游戏=名册/勋章、诗=纸与印章、音乐=唱片……动效必须从所在区的内容概念生长，禁止无来由的漂浮装饰。

### 已验收合格线（保持，可复制其模式）

- 抽屉手风琴：互斥展开 + 高度动画 + 完成后 `ScrollTrigger.refresh()`。
- 横向 pinned 滚动 + 底部拖把直接操纵（scroll 与拖杆双向同步）。
- 泡泡：点击爆裂 + 随机重生，操作有后果。

### 淘汰名单（出现即替换）

- 无输入响应的光球/装饰视差。
- 大面积裸 fade 进场。
- 与内容无关的纯装饰循环动画。

### 每区验收清单

- [ ] 至少一个回应件（hover / click / drag / scroll-velocity 任一）。
- [ ] signature moment 唯一且明确。
- [ ] 进场全部走 mask/transform，无大面积裸 fade。
- [ ] reduced-motion 降级不破布局、不丢内容。
- [ ] 只动 `transform`/`opacity`，DevTools Performance 无长帧。
- [ ] 触屏可用：回应件不依赖 hover 才能被发现。

## 视觉规范

站点实际是**新粗野主义（neo-brutalism）**语汇，以代码里的设计变量为准：

- 底色 `--bg #F4F6F9` / 深纸 `--bg-deep #E7ECF2`，文字墨色 `--ink #1B2430`，蓝灰辅助 `--slate #6E839E` / `--slate-2 #8FA3BC` / `--ice #A8C3DE`。
- 三个强调色：volt 蓝 `#2B4CFF`、punch 橙 `#FF5C1F`、acid 绿 `#C6F439`——只做小面积点缀（印章、计数章、悬停阴影），禁止大面积铺色。
- 硬边语汇：2-3px ink 描边 + 硬偏移阴影（`box-shadow: Npx Npx 0 var(--ink)`），无圆角滥用、无软阴影、无渐变。
- 禁止紫色、紫色渐变、glow neon。
- 超大展示标题 + 细体小标签的极端字重对比；行长 ≤65 字符；大量留白、不对称构图；禁止卡片套卡片、等分三栏模板感。

## 内容更新流程

- 摄影画廊照片硬编码在 `index.html` 的横向滚动区（`.hs-img-wrap` 模式），lightbox 会把 `/photo/xxx.jpg` 替换为 `/photo/full/xxx.jpg` 取大图——新增照片时两处都要有文件。
- 游戏收藏卡片在 GAME/ARCHIVE 区，hover 时封面显影/放大并显示详情；触屏设备 tap 卡片切换 `is-active` 达到同样效果。
- 影视海报在 `posters/<ttID>.jpg`（已全部本地化），行内 `data-cursor="OPEN"` + `data-imdb` 由 main.js 事件委托打开 IMDb。
- The Archive 区数据同样硬编码（书/影/剧/音乐/球队五个 tab）；影视行可挂 `data-imdb`，音乐卡片（正主 `track-own` / SIMILAR `track-sim`）可挂 `data-song-id`，点击行为由 main.js 事件委托处理。

## 当前已知欠账（修完即删行）

- [ ] 音乐正主曲目尚有 7 首未挂 `data-song-id`（已核实 125/132，剩下这些在网易云搜索接口反复核实不到，需人工确认后再挂，**禁止凭记忆填造**）：《We Don't Talk Anymore (Remix)》《Slow Down》Madnap、《S&M》Rihanna、《Come Back To Me》Utada Hikaru、《Turnin'》Young Rising Sons、《Try》P!nk、《Galway Girl》Ed Sheeran。

## 文案风格

冷峻克制的中英混排，短句为主；文案质量不重要，动效质感是第一标准。
