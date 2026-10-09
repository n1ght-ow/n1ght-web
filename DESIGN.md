---
name: N1GHT CHXN9
description: 以真实私人馆藏构成的开放记忆雕塑园。
colors:
  cobalt: "#244be2"
  cobalt-link: "#2446be"
  cold-white: "#f8faff"
  white: "#ffffff"
  ink: "#1c3154"
  deep-ink: "#102348"
  muted: "#4b5d7a"
  subdued: "#51617b"
  line: "#d4dceb"
  cobalt-wash: "#dfe6ff"
  pale-cobalt: "#edf0ff"
  archive: "#eae6f5"
  archive-inset: "#ded8ee"
  archive-tray: "#dcd5ed"
  photo-surface: "#e4ecf9"
  workbench: "#f6d9a0"
  workbench-inset: "#efd095"
typography:
  display:
    fontFamily: "Calistoga, Georgia, Songti SC, serif"
    fontSize: "clamp(58px, 11.7vw, 174px)"
    fontWeight: 400
    lineHeight: 1.04
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Calistoga, Georgia, Songti SC, serif"
    fontSize: "clamp(42px, 5.5vw, 80px)"
    fontWeight: 400
    lineHeight: 1.12
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Calistoga, Georgia, Songti SC, serif"
    fontSize: "clamp(23px, 2.4vw, 34px)"
    fontWeight: 400
    lineHeight: 1.3
  body:
    fontFamily: "Space Grotesk, Helvetica Neue, Arial, sans-serif"
    fontSize: "15px"
    lineHeight: 1.8
  label:
    fontFamily: "Space Grotesk, Helvetica Neue, Arial, sans-serif"
    fontSize: "12px"
    lineHeight: 1.5
  metadata:
    fontFamily: "IBM Plex Mono, SFMono-Regular, Consolas, monospace"
    fontSize: "11px"
  poetry:
    fontFamily: "Georgia, Songti SC, serif"
    fontSize: "clamp(17px, 1.6vw, 22px)"
    fontWeight: 400
    lineHeight: 1.85
    letterSpacing: "-0.012em"
rounded:
  sm: "8px"
  frame: "14px"
  lg: "24px"
  pill: "999px"
  reading: "20px"
  collection: "22px"
  map: "28px"
spacing:
  compact: "8px"
  control: "16px"
  inset: "20px"
  content: "24px"
  group: "32px"
  room: "48px"
components:
  button-primary:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    padding: "17px 24px"
    height: "56px"
  button-primary-hover:
    backgroundColor: "{colors.cobalt-link}"
  button-text:
    textColor: "{colors.cobalt-link}"
    padding: "8px 0 8px 12px"
    height: "44px"
  route-chip:
    backgroundColor: "{colors.white}"
    textColor: "{colors.muted}"
    rounded: "{rounded.pill}"
    padding: "10px 16px"
    height: "44px"
  route-chip-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
  archive-tab:
    textColor: "{colors.ink}"
    padding: "16px 10px"
    height: "84px"
  archive-tab-selected:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.white}"
  story-card:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.map}"
    padding: "clamp(24px, 4vw, 56px)"
  search-field:
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "12px 18px"
    height: "52px"
---

# Design System: N1GHT CHXN9

## Overview

**Creative North Star: "开放的记忆雕塑园"**

真实照片与私人馆藏是空间里的作品，界面承担路标和展具的工作。冷白底、钴蓝字标、浅紫收藏室与杏色策展桌形成可辨认的场所；不同颜色帮助访客找到正在浏览或制作的内容。

Calistoga 的圆润字形提供雕塑般的展示轮廓，Space Grotesk 保持操作的准确和清晰。真实媒体保留原色，阅读区域使用安静的浅色面。空间允许尺度差、轻微倾斜和照片之间的关系，也给歌曲、诗节与藏品名称留出完整阅读的位置。

本次替换了旧 Atelier 的墨绿纸面世界。视觉事实以最后加载的 `css/gallery.css`、当前 `index.html` 与章节脚本为准；早先组件和 Atelier 文件继续提供布局与行为兼容。前置文件中的历史色板、印刷错版注释与旧验收表不再定义现行视觉。用户已授权整体改版并委托本次方向；后续新要求仍可改变这一系统。

**Key Characteristics:**

- 用连续的色彩空间区分抵达、收藏与制作。
- 大型雕塑感展示字与精确的无衬线控件并置。
- 真实媒体保留自身色彩和身份。
- 操作有明确选中态、键盘焦点与减少动态模式。

## Colors

颜色由冷白建筑底、深蓝可读文字和明确的钴蓝操作组成；浅紫与杏色是空间定位，不是藏品染色。

### Primary

- **钴蓝**：字标、主要入口、选中标签、下载操作与页脚使用 `cobalt`。
- **链接钴蓝**：文字操作和主要按钮悬停使用 `cobalt-link`，区分可点文字与背景色块。
- **钴蓝浅底**：摄影模式切换和部分选择反馈使用 `cobalt-wash`、`pale-cobalt`。

### Secondary

- **浅紫收藏室**：`archive` 是七个房间共享的背景；`archive-inset` 与 `archive-tray` 表达书架、诗歌目录和标签托盘的层次。
- **杏色工作台**：`workbench` 识别制作区域，`workbench-inset` 承托导出预览。
- **冷蓝摄影面**：`photo-surface` 承托空间印样，画面保持原片颜色。

### Neutral

- **冷白与白色**：`cold-white` 是页面和详情面，`white` 是照片纸边、故事编辑面与浅色导出画纸。
- **深蓝墨色**：`ink` 用于正文，`deep-ink` 用于深色海报与遮罩基色。
- **次级文字**：`muted` 用于说明和元信息；`subdued` 保留基础组件中较弱的语义文字角色。
- **细线**：`line` 供题签、目录和表单边界使用，不能替代可见焦点。

**The Room Color Rule.** 色彩首先说明所在空间和当前操作；照片、封面和书籍内容不被统一套上品牌滤镜。

本轮计算核对了白色文字与钴蓝、次级文字与收藏室、次级文字与工作台、正文与冷白的组合，分别约为 6.60、5.45、4.88、12.44。它们只说明这些组合的文字对比度，不构成所有内容、状态或像素的完整审计。

## Typography

**Display Font:** 本地 Calistoga，回退 Georgia、Songti SC、serif。

**Body Font:** 本地 Space Grotesk，回退 Helvetica Neue、Arial、sans-serif。

**Label/Mono Font:** 本地 IBM Plex Mono，用于照片编号、部分阅读元信息和导出题签。

**Character:** 展示文字圆润而有体积，界面文字紧凑而直接。中文由适合该角色的回退字体呈现；藏品保持原始中文或其他语言，界面操作继续使用英语。

### Hierarchy

- **Display**：首屏两段字标，参数见 frontmatter；桌面横排，窄屏分成两行。
- **Headline**：摄影、收藏与策展的章节标题。策展标题另有适应自身宽度的局部尺寸，不把标题压进一个统一字号。
- **Title**：房间名称、目录入口及选中照片的标题；诗名也使用展示字角色。
- **Body**：介绍和说明使用无衬线正文，首屏简介约束在 39ch；手机按真实宽度换行。
- **Label / Metadata**：操作名与元信息由字重、位置和字体角色区分。小编号不是独立装饰段落。
- **Poetry**：正文保留 Georgia／Songti SC 的阅读衬线角色及完整诗节；诗歌标题与正文分别承担展示和阅读。

书脊、原有封面和数据中的装订字体继续服务作品本身，不把展示字体强行覆盖到每一本书。Instrument Serif 的历史文件不代表它仍是首屏标题或全站展示字。

**The Content Type Rule.** 展示字建立空间性格，正文和控件保障阅读；真实书名、歌曲名、作者和诗节不能为了构图被删改。

## Layout

共享版心上限为 1600px，页边距采用 `clamp(20px, 4.5vw, 72px)`；章节间距按内容调整。标题与说明在桌面并排，较窄屏幕单栏。不要把标题、父容器与组件的间距重复相加。

首屏为两段钴蓝字标、中央拱形照片及两张偏轴小照片；中央照片高度采用 `clamp(310px, 32vw, 460px)`。底部将主题句、介绍和入口并排。三个目录入口只保留强标题与描述，以真实内容引导开始浏览，没有额外编号或眉题。

摄影沿用空间地图和完整索引两种模式。地图桌面高度采用 `clamp(430px, 42vw, 620px)`，小屏为 420px；索引根据宽度减少列数。故事预览和编辑采用同一画布逻辑。收藏的七个标签与 `.tab-panels` 保持既有结构：后者是 `#archive` 的直接子元素。Poems 始终在 Archive 的面板内阅读。

策展区域桌面使用编辑区与预览区两列，五类藏品共享一条操作序列。宽度不超过 1100px 时预览落到编辑区下方；不超过 720px 时章节头、首屏与目录调整为手机构图，侧边首屏照片隐藏，藏品槽和标签在各自容器内横向浏览。不超过 360px 时导航间距和局部标题进一步收紧，导航文字仍保留完整名称。

本轮已在 1440×1000、390px 和 320px 对相关页面与七个标签走查。记录的是本次版本的验证范围；后续改变布局仍需重测。

## Elevation & Depth

以色面分区、作品尺寸、拱形裁切与少量柔影建立深度。首屏和收藏托盘本身不靠硬错位阴影，空间照片的纸边、故事画纸、策展预览和弹窗允许柔影表达物件与背景的关系。阴影和运动的精确参数在 sidecar 扩展中记录。

### Shadow Vocabulary

- **共享浮起面**：`0 14px 36px rgb(16 35 72 / 12%)`，来自现行共享浮起 token。
- **空间印样**：`0 9px 25px rgb(16 35 72 / 13%)`，帮助分辨地图上重叠照片。
- **策展选择器**：`0 24px 80px rgb(16 35 72 / 25%)`，配合深蓝遮罩建立前景层。

**The Object Depth Rule.** 深度用于说明照片、画纸和弹窗的空间关系；普通文字与房间底色保持稳定。

首屏按字标、画框、图注与入口依次出现；换图先解码，再以约 0.6 秒的裁切进入。章节标题只进入一次。持续变化由各组件负责，布局刷新沿用共享机制。减少动态偏好下保留完整内容与全部操作，不要求访客等待动画才能阅读。

## Shapes

圆润的建筑开口与圆角展具共存。共享框体、较大的弹窗、阅读面与地图的常用圆角见 frontmatter；按钮、路线和流派标签使用胶囊。收藏区域的大上圆角将房间连成连续空间，而不是一排独立卡片。

首屏中央框采用顶部大拱、底部小圆角，桌面为 `160px 160px 16px 16px`，手机为 `90px 90px 14px 14px`。侧照片采用 `80px 80px 10px 10px`。照片和外框只在一个可见边界上裁切；书本保留装订需要的小圆角，圆形按钮保持圆形。现行共享 `corner-shape` 为 `round`。

## Components

以下组件的可独立渲染 HTML／CSS 规格位于 `.impeccable/design.json` 的 `components`，共八个代表样式；其中的 SVG 路径直接内联，样式含悬停与可见焦点，不依赖框架或外部图片。

### Buttons

主要入口是一枚明确的钴蓝胶囊，文字和线性 SVG 同行；悬停进入链接钴蓝。轻操作使用文字与同族线性 SVG，不人为增加一个厚重面。等待换图时按钮禁用并提供忙碌信息；下载不可用时沿用组件的禁用反馈。摄影和策展控件的局部焦点样式仍由组件定义，不假定所有控件都只有一个全局焦点环。

### Chips

摄影路线默认白底、次级文字，选中使用深蓝墨色与白字；模式切换和音乐流派的选中态使用钴蓝。状态继续通过 `aria-pressed`、既有选中 class 和控件名称表达。路线计数来自真实照片数据。

### Cards / Containers

故事面为白色大圆角面，标题使用展示字，说明保持无衬线。空间印样使用白纸边与柔影；策展槽以紧凑白色展具呈现五种固定内容。图片按组件需要选择完整呈现或浏览裁切，导出保持作品身份和标题。

### Inputs / Fields

音乐搜索是浅色胶囊输入，保持独立可读名称、占位文字与聚焦反馈。策展表单沿用明确标签与底线输入：标题具有展示字角色，说明采用有内边距的正文区域；焦点加深底线或左边界。编辑框与选择器继续保留移动端输入大小和可读反馈。

### Navigation

顶部完整显示 Photography、Archive、Curate；品牌与链接共同使用清晰的无衬线字号。顶部导航有冷白底，在滚动时收紧并出现轻柔阴影。目录使用展示字标题加一句真实描述。收藏标签使用标题与简短说明，选中为钴蓝面；手机在标签容器内浏览，不让整页横向溢出。

### Reading & Making

诗歌目录与阅读区位于同一浅紫内面，选中行有浅底与短竖线；阅读区保持原位切换、完整诗节、前后篇和键盘导航，窄屏按诗节原序单栏。

照片故事保留三张不同照片、标题、排序、删除、草稿与 PNG 导出；尺寸为 1800×1080。策展桌保留照片、书、电影、剧集、歌曲五个槽位，支持中文搜索、键盘排序、三种海报布局与 1200×1800 PNG 导出。浅色海报使用白底与深蓝文字，After dark 使用深蓝底与浅色文字；两者都使用当前展示字与界面字体。预览和下载等待字体与图像，失败允许重试。

共享照片／音乐详情使用冷白面与深蓝遮罩；打开后的 Escape、方向键和关闭后的焦点返回继续服务浏览。控件图标由 `js/atelier.js` 统一为线性 SVG：仅替换操作中的图标文本节点，不改藏品标题、稳定 ID、监听器或可访问名称。

原始照片和现有封面是改版前的所有者提供素材，本轮保留原文件。首屏火箭图继续使用既有原图与响应式 WebP，切换视图从真实照片集中取图；未生成虚构藏品或新的媒体来源。来源记录见 `.impeccable/asset-provenance.json`。

## Do's and Don'ts

### Do:

- **Do** 用房间底色、钴蓝操作和真实媒体共同建立方向感。
- **Do** 按展示、界面、诗文与藏品本体分配字体角色。
- **Do** 保留英语界面与藏品原始名称，使用完整标题测试真实窄屏。
- **Do** 维护七个收藏面板、浏览详情、三张故事和五件策展的完整操作循环。
- **Do** 检查焦点、键盘、减少动态和导出结果；改变背景时重新计算相关文字组合。

### Don't:

- **Don't** 将前置样式文件中的旧墨绿 token、印刷错版注释或历史审计当作现行视觉事实。
- **Don't** 为导航和目录添加只重复标题的编号、装饰眉题或难辨认的字形图标。
- **Don't** 为统一风格给真实照片套品牌滤镜，或替换藏品的原始名称与身份。
- **Don't** 将诗歌从 Archive 拆成独立章节，或改变 DOM 后遗漏查找、焦点与 ARIA 契约。
- **Don't** 把本轮局部对比度和浏览验证表述为全站性能或完整无障碍审计。
