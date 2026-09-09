# N1GHT CHXN9 — 项目约定

纯静态个人收藏站：`index.html` 双击即用，无构建、无 npm 运行时依赖。改动必须先读本文件。

界面质量标准由两族已安装技能构成（都在 `~/.zcode/skills/`），各管一摊：

- **design-taste-frontend**（taste-skill，leonxlnx）——设计方向与反模板纪律的事实源：design read 先行、三档 dial、AI tells 禁令、redesign protocol、pre-flight 清单。
- **better-\* 技能族**（jakubkrehel/skills）——质量事实源：六个领域技能 `better-accessibility` / `better-layout` / `better-typography` / `better-colors` / `better-writing` / `better-ui` 依次为各领域事实来源；编排技能 `better-interface`（合并六域审查），工作流技能 `interface-review`（变更范围审查）、`explain-interface`、`break`、`variant`（后三个手动调用）。

冲突裁决顺序：**better-\* 的无障碍 / 对比度 / 性能红线最高**，风格与品牌特例都不得突破；其余风格问题上，**本文件记录的品牌特例 > taste-skill 默认纪律**；技能都没覆盖的项目操作约定以下文为准。

## 硬性禁区

- 不增删改 `.venv/`；不修改或删除 `photo/` 原图。新增照片时 `photo/` 与 `photo/full/` 两处都要有文件。
- 不引入外部图床 / CDN，图片、字体全走项目内相对路径。运行时外链（IMDb、网易云歌页 / APP 深链）只做内容跳转，不嵌 iframe、不加载外部资源。
- 不修改 `js/vendor/` 内压缩库；`js/sig-data.js` 是 fontTools 生成的签名路径数据，禁止手写 path。

## 技术约束

- 单页静态：`index.html` + `css/` + `js/`。脚本在 `<body>` 尾部按序加载：vendor（gsap → ScrollTrigger → SplitText → lenis）→ 数据（`film-data.js` → `series-data.js` → `music-data.js`）→ 工厂（`reel-stage.js`）→ stage（`film-stage.js` → `series-stage.js` → `music-stage.js`）→ `main.js`。
- 缓存失效：改了哪个带 `?v=N` 的 css/js 就把它的版本号 +1；改数据文件时给对应 `<script>` 补挂 `?v=`。
- GSAP/ScrollTrigger/SplitText/Lenis 走本地 `js/vendor/`。Lenis 仅非 REDUCED 启用；锚点跳转统一走 `lenis.scrollTo`。
- 内容归属红线：`#panel-books / films / series / music / sport / games` 六个面板各放本类内容，禁止跨面板搬移或新增；标识符沿用现有 token（books / films / series / music / sport / games）。
- 中文内容行加 `lang="zh"`（回退系统字体）。
- 动效与滚动监听的性能红线集中在下文「动效」一章。

## 视觉基调（项目身份）

Design read：个人收藏 / 档案站，受众是同好与自己，气质 = **明亮奢华 + iOS 质感 + 光效点缀 + 圆角体系**。对应 dial：`DESIGN_VARIANCE 7 / MOTION_INTENSITY 7 / VISUAL_DENSITY 4`。新粗野主义（硬边 2-3px 描边、硬偏移阴影、方角、grain 噪点）整体退役，不要再写。

- **明暗**：全站锁定亮色单主题（Page Theme Lock），任何分区不得反转为暗色；明亮奢华靠大留白与柔和分层，不靠底色反转。
- **圆角**：全站一套 radius token（`--radius-sm` / `-md` / `-lg`，重构时定值入 token 层）；嵌套容器遵守 concentric radius——外圆角 = 内圆角 + padding；按钮允许全圆 pill；同站禁止混用方角与圆角两套体系（Shape Consistency Lock）。
- **玻璃面板**：`backdrop-filter: blur() saturate()` + 1px 内高光边（白系低透明）+ 内阴影高光；必须带 `@media (prefers-reduced-transparency: reduce)` 实底回退。
- **阴影**：分层透明软阴影，色相贴基底 hue；禁纯黑投影、禁硬偏移阴影。
- **光效（品牌特例）**：覆盖 taste-skill "NO neon / outer glows" 默认值（用户拍板要求光效）。accent 柔光辉光、radial 光斑、光泽渐变只给交互件与每区唯一 signature moment；不上正文文字；辉光必须有静态可见形态，动画不能是唯一信号。
- **渐变**：允许克制的光泽渐变；插值空间 `in oklab`，双 hue 中间发灰时改 `in oklch`；禁 AI 紫渐变。
- **纹理**：grain 噪点层退役，质感交给材质与光效。
- **色彩遗训**：禁紫；无纯黑 `#000` / 纯白 `#fff`（用近黑近白）；accent hue = 可交互，静态文字不用它；每视图只一个实心填充主操作。
- **色板（已拍板：钛银+香槟金，2026-09）**：原语 ramp `--sand-050 #F6F5F1` / `--sand-100 #EDEBE4` / `--sand-200 #DFDACE`、`--gold-100 #F3E9D2` / `--gold-300 #DDB76B` / `--gold-500 #C9A227` / `--gold-700 #7E5F20`、`--ink-900 #1D1B16` / `--ink-600 #4A463D` / `--ink-400 #6B675A`、面 `--paper #FCFBF8`；组件只准引用语义层（`--color-bg / -bg-deep / -surface / -text / -text-secondary / -text-muted / -line / -accent-solid / -accent-text / -accent-tint / -glow / -on-accent`）。gold-500 实心块必须配 1px gold-700 描边环（非文本 3:1）；关键对比对已实测（如 ink-900/sand-050 15.8:1、ink-400/sand-050 4.95:1、gold-700/sand-050 5.4:1、ink-900/gold-500 7.1:1）。
- 图片描边沿用中性低透明度（`oklch(0 0 0 / 0.1)` 类），不用带色调灰。

## 动效（better-ui × taste-skill）

- MOTION_INTENSITY 7：动效是站点身份，motion claimed = motion shown——声称的动效必须真的存在；每个动画要能一句话说出动机（层级 / 叙事 / 反馈 / 状态过渡），说不出的删。动效值是精确值：时长、曲线、缩放、blur 不写近似值。
- 性能红线：只动 `transform` / `opacity` / `filter`（`clip-path: inset()` 幕帘等价允许）；scrub 动画必须 `invalidateOnRefresh: true`；图片加载后的 refresh 用 250ms debounce 合并；滚动监听只走 ScrollTrigger / IntersectionObserver / Lenis，禁裸 `window` scroll handler。
- 可中断：交互状态变化用 CSS transition 或 GSAP + `overwrite`；keyframes 只用于一次性序列。
- 频率分治：高频交互（hover / press / 拖拽跟随）即时反馈，或只对 opacity / color 做 ≤150ms 过渡；按压反馈 scale 严格 `0.96`。低频入场 / 编排 / 状态切换可用 spring 弹性（GSAP `back.out` / `elastic` 或 CSS 近似曲线）——弹性是品牌特例，只许低频。
- 光效动效（辉光呼吸、光泽扫过、spotlight border）只给 signature moment；每个动画状态变化必须有**静态反馈通道**（颜色 / 图标 / 文字）——动画不能是唯一信号。
- 入场 stagger 只给不常见的分层进场，按语义分块约 `100ms`；退场比入场更柔和（小 translateY，两方向 ease-out）。
- `transition-property` 写具体属性，禁 `transition: all`；`will-change` 仅限 transform / opacity / filter，且只在实测首帧卡顿时加。
- reduced-motion：视差与自动播放全移除，scrub / pinned 动画静态化；玻璃面板保留但去动效。
- 自检方法：以 10% 速度回放动画，找"subtly wrong"。

## 排版（better-typography）

- `line-height` 全部 unitless：标题 ~1.1，正文 1.5–1.6，任何 ≥3 行换行文本 ≥1.4。
- 长文行长 60–75ch；标题 `text-wrap: balance`，描述 `pretty`，长词 `overflow-wrap: break-word`，标签/徽章 `nowrap`。
- 会变化的数字（计数器、进度、搜索结果数、秒表类）一律 `tabular-nums`。
- 大号标题轻微负字距；小号大写标签轻微正字距；阅读尺寸正文两者都不加。
- UI 文本 ≥14px（caption 13px，很少低于 12px）；mono 小标签同等受此下限约束；移动端输入框 16px（防 iOS 缩放）。
- 正文用弯引号；范围用 en dash；省略号用单字符；文案按自然大小写存储、展示交给 `text-transform`。
- 字重 <400 只给 ≥28px 展示场景；加载实际使用的字重，避免浏览器合成。
- 字体：Space Grotesk（300-700 可变，展示 + 正文）+ IBM Plex Mono（标签）+ Instrument Serif italic（衬线点缀）自托管；Vast Shadow / Bungee / Calistoga / Notable 已退役（文件留在 `fonts/` 但不再声明、不再预载）；可增字重或字族，只能经 `css/fonts.css` 本地文件，禁外链。
- 英文文案禁 em-dash（用句号 / 逗号 / 冒号重写句子）；中文破折号不受限；en dash 只用于范围。

## 颜色（better-colors）

- 两层 token：原语按 hue（只进 token 层），组件只准用**语义层**；缺角色就新增语义 token，绝不借用近值。新色板落地时一并建立语义层。
- 语义命名按用途（`--color-accent-solid` 类），禁按外观命名。
- 对比度**实测不估算**（AA：正文 <24px 4.5:1、大字 ≥24px 与 UI 部件 3:1；AAA：7:1 / 4.5:1），测文字实际压着的背景——玻璃面板按叠加后的实际底色测；失败时报告色对 / 实测值 / 阈值，**颜色改动需用户拍板**。
- 一色一义：accent hue = 可交互，静态文字不用它；同 hue 15° 内视为同色。**品牌特例**：poem 区叠句（.refrain）用 gold-700 静态文字（2026-09 用户拍板；纸底实测 5.7:1，AA 达标）。
- 每视图只一个实心填充主操作；修对比度动 lightness，不动 hue。
- 新色板必须成 ramp：感知亮度等步、hue 恒定、鲜度中段最高两端回落、两端不碰纯黑纯白。
- 辉光 / 光效色与所压背景的对比度同样实测。

## 无障碍（better-accessibility）

- 焦点：`:focus-visible` + ≥2px 实线环；禁无替代的 `outline: none`；模态背景 `inert`、焦点进出管理；skip link 是第一个可聚焦元素。
- 键盘走 ARIA APG：Esc 关浮层、组合件内方向键、roving tabindex（活动项 0 其余 -1）、Enter/Space 激活；`tabindex` 只用 0 和 -1。
- 不做 `<div onClick>`：动作 `<button>`、导航 `<a href>`；真链接支持 Cmd/Ctrl/中键。
- 目标尺寸：AA 基线 24×24，触摸 44×44、桌面 40×40；伪元素扩展命中区且不重叠。
- "No ARIA is better than bad ARIA"：原生优先；`aria-hidden` 不上可聚焦元素；图标按钮带描述性 `aria-label`。
- reduced-motion：动效 opt-in 包裹；视差与自动播放全移除；自动播放媒体有可见暂停控件。
- 表单：`<label for>`、占位符是示例不是标签、autocomplete、永不禁粘贴。
- 结构：一个 `<h1>` 不跳级、一个 `<main>`、320px 无横向滚动、200% 缩放可用、文本容器 `min-height` 非 `height`。
- 验收两次走查：纯键盘 + 读屏。

## 布局（better-layout）

- 留白分组不用线：组间距 ≥ 组内 2×；分隔线是密集数据的最后手段。
- 对齐共享边缘，层级用单一间距步；物理 left/right 换逻辑属性（`margin-inline-start` 等）。
- 横向滚动器下一项露 16–32px 窥视；带框控件间 ≥12px、无框控件周围 ≥24px；移动端按钮内缩 16px + 安全区。
- 断点由内容驱动，组件优先容器查询；文本容器禁固定宽高。
- 关键操作永不放在会被裁剪的位置。

## 文案（better-writing）

- 先侦察既有语气：本站"中英混排、短句、大写 mono"是**刻意品牌声音，不是缺陷**——只修不一致、歧义、轻重失配。
- 按钮动词先行；确认框重复后果（"删除 + 取消"，不是 Yes/No）；链接描述目的地；一套大小写策略全站一致。
- 错误说明怎么修；空状态给出下一步；占位符是示例不是标签。
- 发布前文案自审（taste-skill）：重读所有可见字符串，改掉语法破碎、指代不明、AI 腔俏皮话；拿不准就换朴素功能句。

## better-interface 验收纪律

任何界面改动用 `better-interface` 的纪律验收：

- **上限 15 条发现**，一行一个根因，位置必须 `path:line`，附 Before / After / Why。
- **13 条 HIGH 触发器**（命中即 HIGH，永不下调）：无可访问名；无可见焦点；键盘不可达；无视 reduced-motion；320px 或 200% 裁剪；对比度不达标；状态仅由颜色承载；破坏性动作无确认/撤销；截断内容不可取回；内容只能越过滚动边缘到达；错误无恢复路径；语义色误用；状态仅由动效承载。
- **五步修复阶梯**（取最早可行）：删 → 用平台原生 → 复用项目已有 → 修正数值 → 新增。第 1 步可行时提第 5 步方案本身就是一条发现。
- 对比度**实测不估算**；跑不了的检查标 `Not verified`；结论只有 `Block`（有 HIGH）/ `Approve`。

界面改动另跑 taste-skill pre-flight 要点：主题锁、单 accent 锁、形状一致性锁、动效有动机、marquee ≤1/页、CTA 单行不换行、文案自审。

## 代码结构（新功能照此归属）

- `js/main.js` 站点交互层：preloader、光标徽章、磁吸、`makeHorizontalScroller`、泡泡场、统一详情层（photo / film / series / game / music，共用 `#lightbox`）、tab 切换、ARCHIVE 共享工具条（filter / sort / density）、音乐流派过滤 + 搜索 + 随机一首、网易云外链、导航高亮 + 滚动进度、共享 `scheduleRefresh`。
- 签名：已整体退役（2026-09 用户裁定，about 签名连带绘制代码一并移除）；`js/sig-data.js` 保留在仓库但不参与加载，仍是 fontTools 生成数据、禁止手改。
- 影 / 剧：数据（`film-data.js` 16 部 / `series-data.js` 19 部，字段 `{ id, imdb（ttID）, poster, title, director / years, year / seasons, genre / category, quote }`）→ 配置适配器经 `js/reel-stage.js` 的 `createReelStage()` 工厂渲染进 `#panel-films` / `#panel-series`；共享机械样式在 `css/reel-stage.css`，面板 accent / detail 区 / 断点 / reduce 块在各自 css。工厂暴露 `setData()` 供 ARCHIVE 工具条重排 / 筛选，重排不改 class 前缀与数据层。class 前缀（`film-*` / `series-*`）不许改——CSS 和 main.js 按它绑定。
- 音乐：`js/music-data.js`（`window.MUSIC_DATA`，763 首 16 组，`{ id, zh, en, groupLang, tracks: [{ id, title, artist }] }`）→ `js/music-stage.js` 渲染进 `.playlist[data-music-stage="auto"]` 并生成 `#genre-filter` 过滤 chips；`.genre-count` 由渲染器自动生成。歌单默认**全展开、无手风琴**（2026-09 用户裁定）：浏览靠流派 chips 过滤（sticky）+ 搜索叠加 + 随机一首（从当前可见卡片抽取，走同一网易云深链）。
- 书、球队硬编码在 `index.html`；历史调研产物放 `archive/<topic>/`，不参与站点加载。

### 光标徽章（品牌特例）

taste-skill 禁自定义光标，本项目**显式豁免**保留：`initCursor()` + `data-cursor` 取值出徽章，仅精指针且非 REDUCED 启用（`html.has-cursor` 由 JS 设置）。徽章为深墨圆角胶囊（dynamic-island 语汇），文字 0.875rem，跟随与展缩即时跟随（power2.out，无弹性）。挂点：`VIEW`（.photo-frame-btn、.hof-item、影/剧 IMDb 按钮）、`DRAG`（#hof-scroll、hof dragbar-track、影/剧 range）、`PLAY`（音乐 .idx-card）、`OPEN`（影/剧海报卡）、`STAMP`（.poem-stamp）。新交互卡片挂对应值即可，无需改 JS/CSS。

## 站点结构（改动前核对实际现状）

preloader → hero（大标题 + 泡泡场）→ PHOTOGRAPHY（FIELD ROLL 编辑式双章节网格 11 帧 → DO NOT GO GENTLE 诗条 → Dylan Thomas 诗块收尾）→ THE ARCHIVE（六 tab：书 6 / 影 16 / 剧 19 / 音乐 763 首 16 组 / 球队 5 / 游戏 HOF 18 卡；每 tab 带共享 filter / sort / density 工具条；照片 / 影 / 剧 / 游戏 / 音乐共用统一详情层）→ ABOUT（统计）→ footer。GAME ARCHIVE 独立区与独立 POEM 区已撤销（2026-09 用户裁定：游戏并入 archive 第六 tab，诗并入 photo 区尾）。poem 块为杂志跨页排版：eyebrow + serif 大标题 + 导语居中开场，桌面诗笺左/注释栏右双栏（720px 单列堆叠），叠句金色贯穿。

archive 内的游戏名册为**纯拖拽驱动**：页面滚轮垂直穿过，不 pin、不 scrub；横向移动只来自抓取拖拽（含触屏横滑）与拖动条。游戏卡片框贴合图片原始比例（`width: min-content` 收缩包裹）。PHOTO 改为 FIELD ROLL 编辑式网格（BLOOM / HORIZON 双章节，不依赖横向拖拽）；lightbox 展示 photo/ 低分辨率版本，不加载 photo/full/ 原图。大标题（bighead）双词从两侧滑动居中，scrub 锁定。

TICKER 共 2 条（2026-09 用户拍板收敛：原 01/02 移除，保留计数条与诗条）；taste-skill marquee ≤1/页与本项目 2 条的出入记录为品牌特例，不再增配第三条。

## 内容更新

- 摄影：`.photo-frame`，`photo/` 与 `photo/full/` 都放。
- 游戏：`hof-item`，封面 `covers/`。
- 影视：海报 `posters/<ttID>.jpg`，条目进 `film-data.js` / `series-data.js`。
- 音乐：`data-song-id` 必须经网易云接口核实，禁止凭记忆填造；加进 `music-data.js` 对应组 `tracks`，计数自动。
- 球队：logo `logos/`；队名是官网直达真链接（`target="_blank" rel="noopener"`），新增队伍时连同官网 href 一起核实填写。
- 增删内容同步 `#about-stats`、计数 TICKER。

## 改完自检

双击可用、无外部 CDN、无新增长帧、reduced-motion 不破布局、引用资源无 404、`?v=` 已递增；纯键盘走查、320px / 200% 不裁剪、对比度实测、动画 10% 慢速回放；better-interface 标准下无 HIGH；taste-skill pre-flight 要点：主题锁（全站亮色不反转）、单 accent 锁、形状一致性锁（一套圆角体系）、动效有动机、marquee ≤1、玻璃材质 reduced-transparency 回退可验证。提交并推送 `origin/main`。
