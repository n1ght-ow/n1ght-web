---
name: MyScore
description: 紧凑赛程与精确比赛报告共享同一对齐系统。
colors:
  primary: "#5d2638"
  link: "#5d2638"
  header: "#263b32"
  ground: "#dce5d5"
  surface: "#f9faf6"
  ink: "#263b32"
  deep: "#263b32"
  muted: "#56645b"
  wash: "#edf1e9"
  line: "#bcc8b9"
  better: "#2d6b45"
  worse: "#992f46"
  dark-primary: "#c98fa2"
  dark-link: "#e1a8b8"
  dark-ground: "#17241d"
  dark-surface: "#1d2c24"
  dark-ink: "#edf1ec"
  dark-deep: "#f4f7f1"
  dark-muted: "#aebbb2"
  dark-wash: "#2b3c32"
  dark-line: "#45594b"
  dark-better: "#82d9a4"
  dark-worse: "#ff9faf"
typography:
  headline:
    fontFamily: "Bricolage Grotesque, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "19px"
    fontWeight: 680
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Bricolage Grotesque, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "16px"
    fontWeight: 600
  body:
    fontFamily: "Bricolage Grotesque, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "14px"
    lineHeight: 1.5
  score:
    fontFamily: "Bricolage Grotesque, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "40px"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  label:
    fontFamily: "Bricolage Grotesque, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "11px"
rounded:
  chip: "7px"
  control: "9px"
  roster: "11px"
  surface: "14px"
  dialog: "16px"
spacing:
  compact: "8px"
  control: "12px"
  row: "16px"
  section: "24px"
  gutter: "32px"
components:
  button-watch:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "8px"
  button-text:
    textColor: "{colors.link}"
    rounded: "{rounded.control}"
    padding: "8px 13px"
  sport-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.chip}"
    padding: "8px 16px"
  field-team:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "6px 30px 6px 12px"
  chip-game:
    backgroundColor: "#eadde1"
    textColor: "{colors.link}"
    rounded: "{rounded.chip}"
    padding: "6px 14px"
  roster:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.roster}"
  match-row:
    padding: "10px 16px"
---

# Design System: MyScore

## Overview

**Creative North Star: "紧凑赛程与精确比赛报告"**

MyScore 是艺术馆内独立的中文赛事操作空间，以浅鼠尾草绿地面、纸白工作面、深绿文字和酒红操作色组成一处私人影像档案。赛程浏览与详情阅读同样频繁，因此两种视图共享无衬线界面字体、稳定的数字列轴和紧凑控件。它使用自己的局部样式与 token；本文件不改变根目录艺术馆的设计系统。

有效空间用于真实比赛、球队、选手和数据。上下文放在最近的共同父级，避免为每条记录重复标题；媒体身份与数字保持可追踪的对齐关系。桌面以连续行和共享表头比较，手机通过重排保留内容。

**Key Characteristics:**

- 鼠尾草绿地面、纸白工作面与酒红操作色形成清晰而有温度的层级。
- 真实队徽、头像、英雄与装备帮助识别记录。
- 共享上下文、稳定列轴与紧凑连续行支持扫描和比较。
- 浅色与深色使用同一结构，窄屏重排数据。

## Colors

色彩服务操作、信息层次和有明确方向的数值比较；规范值见 frontmatter，最终视觉覆盖位于最后加载的 `folio.css`。

### Primary

- **酒红操作色**：选中的赛事导航、主要操作、焦点环与强调边框。
- **链接酒红**：链接、轻按钮与直播状态；深色主题使用易读的浅酒红。
- **导航深绿**：全站顶栏；顶栏保留纸白文字，桌面高度 64px、手机高度 56px。

### Secondary

- **比较绿／红**：仅用于来源与比较规则支持的优势／劣势，深色有各自对应值；相同、缺失及无明确方向的数据保持中性。

### Neutral

- **鼠尾草绿地面／纸白工作面**：页面背景与赛程、报告、表格及弹窗。
- **深绿正文／次级灰绿**：正文、标题、队名、状态与元信息。
- **浅绿洗色／灰绿分隔线**：共享标题区、选中或悬停面、连续记录边界。

**The Meaningful Comparison Rule.** 比较色由指标方向和比赛状态决定，不因列排序或视觉位置而改变。

## Typography

**Body Font:** Bricolage Grotesque；`folio.css` 通过局部 `@font-face` 加载仓库的 `../fonts/BricolageGrotesque-latin.woff2`，中文回退至 PingFang SC、Microsoft YaHei 和 sans-serif。

**Character:** 赛程与报告都采用直接、紧凑的界面字体。比分和数据使用等宽数字；本空间没有独立的装饰展示字。

### Hierarchy

- **Headline**：赛事日历标题采用 frontmatter 的 headline；手机为 17px。日期按钮桌面为 20px，手机为 17px。
- **Title**：比赛元信息标题和报告章节为 16px；表格／队名标题多为 14–15px，按现有组件层级使用。
- **Body**：页面基准为 body；连续记录和明细在 12–14px 间分配。
- **Score**：报告比分采用 score，手机为 32px；三位数等长比分在手机为 22px，360px 以下为 20px，并收紧字距为 -0.035em。赛程比分为 20px，手机为 16px。
- **Label**：元信息、共享资源表头、来源和次级身份采用 label；当前最小可见字号为 11px，不将它扩展为所有正文的默认值。

## Layout

页面外壳最大宽度 1440px，桌面侧边距使用 gutter；1000px 以下收为 24px，600px 以下为 16px，360px 以下为 12px。顶栏最小高度 64px，手机为 56px。日历标题、日期控件与工具在纸白工具条内紧凑排列；1000px 以下工具换行，手机日期控件占满一行。赛事导航在自身容器横向浏览。

赛程按来源组织，同一来源内连续同名赛事使用一次赛事标题。赛事组使用独立纸白容器，桌面记录最小高度 76px，列为时间、主队、比分、客队、播放；队名靠近对应队徽，比分保持居中。600px 以下记录最小高度 98px，球队上下排列，时间和播放跨两行，比分分别对齐两队。

详情阅读区最大宽度 1280px。比赛／日期元信息、对阵面和正文导航连续衔接。对阵面使用两侧弹性队伍和中央固定比分列；手机将队徽和队名上下排列。正文使用横向数据表、共享标题和分隔线，表格首列固定，宽表只在自己的容器内滚动。

LoL 小局先显示双方共享资源对照，队内只显示一次列标题。桌面每条选手记录最小高度 64px，身份、英雄、KDA、资源与出装共用五组列轴。1100px 以下英雄移至身份下方；800px 以下出装移至第二层；600px 以下采用身份／KDA、英雄／资源、完整装备三层，最小高度 108px。装备按八列自适应，保留全部内容；资源有隐藏语义标签，避免每行重复可见字段名。

**The Shared Context Rule.** 同一上下文只在最近的共同父级出现一次，保留记录自身需要的语义名称。

**The Alignment Rule.** 每个文本、数字和媒体元素都对应所属记录或共享表头的轴线；空间先用于内容，再用于分组。

## Elevation & Depth

工作面以底色、洗色、细线与轻量纸面阴影区分层次。活动导航和详情标签使用酒红内侧底线，属于状态指示。原生弹窗通过深绿半透明遮罩与工作面分离；焦点使用 3px 酒红轮廓，偏移 3px。

## Shapes

圆角区分主要工作面、列表容器与控件，规范值见 frontmatter；嵌套记录沿连续边界排列，不额外套卡片。队徽采用完整包含，头像与装备使用小圆角图像容器；图像失败显示可读文字，不编造身份图像。

## Components

### Buttons

播放动作使用实色酒红按钮，轻操作使用透明底文字／SVG 按钮；悬停进入洗色。所有按钮、选择框和导航操作至少 44px 高，表格排序与紧凑排序按钮也遵循同一触摸尺寸。保留可见焦点与可读操作名称。

### Chips

赛事导航用酒红实色选中面，地图／小局选择器用浅酒红选中面与操作色边线。它们均保留原生链接；导航和标签选择通过 `aria-current` 表达。

### Cards / Containers

赛程按赛事使用纸白容器，浅绿赛事标题与记录细线组织内容；报告对阵、数据表与 LoL 队伍列表使用纸白工作面。选手行悬停进入洗色，身份按钮打开对应人物资料。

### Inputs / Fields

球队筛选使用原生 select、灰绿细边框与纸白工作面；手机占工具行剩余宽度。日期按钮触发原生日期输入，输入获得键盘焦点时可见。选择框至少 44px 高，轮廓焦点沿用共享样式。

### Navigation

顶栏为小型品牌与站点链接；手机隐藏部分艺术馆入口以保留当前入口。赛事与详情导航保持自己的横向滚动范围。返回链接、可分享地址与浏览器历史继续承担跨视图定位。

### Report Data & Media

一般表格使用可排序列名、固定首列与等宽数字。LoL 使用共享列标题与专用选手记录，排序动作位于队伍标题同行。真实头像、英雄和装备保持与选手对应；没有发布的字段保持未知。额外技术指标和长进程按现有展开区阅读。

人物和播放选项使用原生 dialog、纸白工作面、酒红边框与深绿遮罩，关闭后恢复焦点。图像加载、缓存与比较语义的实现边界见根 `DESIGN.md` 的 MyScore 小节；来源和部署边界见 `README.md`。

## Do's and Don'ts

### Do:

- **Do** 让赛程与详情共享鼠尾草绿、纸白、深绿和酒红组成的紧凑操作层。
- **Do** 将上下文移到最近的共同父级，避免逐条重复。
- **Do** 保留真实媒体、真实零值、未知状态和完整手机数据。
- **Do** 在修改组件后检查窄屏重排、排序对应和焦点返回。

### Don't:

- **Don't** 将 MyScore 局部色板覆盖到其他艺术馆页面的根 token。
- **Don't** 重新引入已不属于当前实现的大标题与大日期构图。
- **Don't** 为精简可见标签删除辅助语义或省略选手装备。
- **Don't** 将局部截图或已有走查写成全站无障碍、性能或全浏览器通过。

本次文档从 `styles.css`、`reading.css`、最终覆盖层 `folio.css`、`index.html` 与 `app.mjs` 提取。浏览器走查的实际范围和限制保留于 `VERIFICATION.md`；本次文档同步未新增浏览器、无障碍或性能验证。
