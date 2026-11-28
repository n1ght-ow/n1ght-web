---
name: N1GHT CHXN9
description: "黑曜石与香槟金的私人馆藏界面；三维星轨入口连接摄影、文字、影像、赛场与应用档案。"
colors:
  obsidian: "#0b0c0e"
  surface: "#131519"
  elevated: "#1a1d23"
  paper: "#f4f1ea"
  ink: "#eae7e1"
  muted: "#9398a3"
  brass: "#d4a853"
  brass-light: "#f0d89e"
  hairline: "rgb(255 255 255 / 9%)"
typography:
  display: "Bricolage Grotesque"
  body: "PingFang SC / Microsoft YaHei"
  editorial: "Songti SC / Noto Serif SC"
  mono: "IBM Plex Mono"
layout:
  desktop-shell: "1440px"
  reading-shell: "1200px"
  header-height: "64px"
  gutter: "24px / 40px"
  grid: "3 columns desktop, 2 tablet, 1 phone"
engine:
  home: "Three.js WebGL sculpture"
  world: "local Three.js renderer"
---

# Design System: N1GHT CHXN9

## 01 · Direction

当前站点是一处夜间私人艺术馆，而不是通用作品集模板。整体以黑曜石色为底，用香槟金标记入口、索引号和可操作状态；纸白只承担正文与主要按钮。结构强调建筑式框架、明确的编号、细线和大幅留白，内容本身仍然决定图片、文字和信息的比例。

根首页是 React 应用，`3d/index.html` 与 `myscore/index.html` 是独立静态页面。三者共享同一套黑曜石／香槟金语言，但根据任务切换密度：首页负责气氛，展区负责浏览，MyScore 负责快速读取赛事数据。

## 02 · Page Roles

- **首页**：左侧标题与说明，右侧 Three.js 星轨雕塑，底部以十宫格列出九个展区和 3D 入口。雕塑随悬停改变强调色，并提供暂停动效。
- **摄影**：暗房式大图网格、章节标签、搜索和画廊／印样切换。大图检视器支持方向键和 Escape。
- **书籍**：暖纸色书脊与书架构图，重点让书名、作者和私人批注清晰可读。
- **诗歌**：较窄的排印栏、节制行宽和逐节阅读节奏，不让装饰压过正文。
- **名画**：深色展墙承托真实画作，缩略图用于定位，详情提供画面检视和馆藏来源。
- **体育**：球队影像、队徽与荣誉信息并置，保持项目之间的稳定对齐。
- **剧集与电影**：以海报墙建立第一层识别，再通过分类、导演和年代筛选收拢内容；详情使用独立阅读层。
- **游戏**：横向封面卡片和大型选中画幅，让发行年份、排名与封面共同形成浏览节奏。
- **应用**：手机实机截图作为主视觉，功能说明与下载／源码入口按作品分组。
- **3D 夜间陈列室**：八座沉浸式展区，空间、灯光和材质由 `css/world.css` 驱动；顶栏直接通向首页与 MyScore。
- **MyScore**：深色赛事工作台，信息密集但列轴稳定；浅色纸面主题可切换，移动端改为单场卡片式行。

## 03 · Shared Components

- 顶栏为 `64px` 高的固定深色横条，品牌、主导航和单一主入口分区明确。
- 栏目编号、状态和英文标签使用 IBM Plex Mono；中文标题使用粗体无衬线，长篇文字可切换宋体。
- 分隔依赖 `1px` 半透明细线，不叠加多层阴影。
- 卡片和控件使用小圆角，按钮以直角矩形和描边为主，不做重复胶囊。
- 主要操作使用香槟金；纸白按钮只用于当前视图中最明确的一步。
- 图标帮助识别，不作为唯一标签；关闭、前后切换和主题按钮都有可读名称。

## 04 · Motion

- 首页星轨装置是唯一持续运行的展示型循环，悬停负责反馈，离开后回到稳定状态。
- 页面切换以 hash 路由完成，视图立即定位到顶部，不使用会阻断阅读的全屏过渡。
- 3D 展厅只在对应路由加载；阴影贴图按需更新，空闲时不持续重绘。
- `prefers-reduced-motion` 下停用非必要循环，但保留筛选、详情、键盘和全部内容。
- 全屏索引抽屉打开后聚焦关闭按钮，Tab 在抽屉内循环，Escape 关闭并把焦点还给触发按钮。

## 05 · Responsive And Accessibility

- 桌面使用宽幅双栏或三栏；手机回到单栏并减少同时出现的按钮数量，但保留完整馆藏。
- 已在 `320px`、`390px` 与 `1440px` 检查；页面不应出现横向溢出。
- 触摸目标保持约 `40–44px`，文字和控件满足深色背景上的对比度要求。
- 动作使用 `button`，导航使用 `a`；筛选项使用 `aria-pressed` 或 `aria-selected`。
- 对话框、抽屉和灯箱都必须能用 Escape 关闭；打开后不得把键盘焦点留在遮罩后的页面。
- 图片提供真实替代文本；纯装饰元素使用 `aria-hidden="true"`。

## 06 · Implementation Map

- 根入口与 Vite 接线：`index.html`、`vite.config.ts`、`src/main.tsx`
- 路由、抽屉与顶栏：`src/App.tsx`、`src/components/`
- 各展区：`src/views/`
- 根页面样式：`src/index.css`
- 馆藏数据：`src/data/collections.ts`
- 3D 入口与视觉：`3d/index.html`、`css/world.css`、`js/world/`
- MyScore：`myscore/index.html`、`myscore/folio.css`、`myscore/app.mjs`
- 旧 Folio／Liminal 设计记录：`archive/DESIGN-folio-liminal.md`

改版可以继续推进新的材质、版式和动效，但应先确认真实馆藏仍是视觉主体，并同步更新本文件与相关预览说明。
