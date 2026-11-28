# N1GHT CHXN9 · 协作与维护

回答始终使用中文。先理解用户本次想达到的效果，再选择实现方式。

## 如何使用这些文档

- 本文件说明工作流程与代码边界；[DESIGN.md](DESIGN.md)记录当前视觉方向和实现。
- 设计文档是起点，不是审美禁令。用户可以改变风格、布局、色板、字体、材质和动效。
- 用户明确提出的新要求优先于既有设计约定。不要用历史版本的“退役”“红线”阻止新的尝试。
- 修改相关功能前读对应文件；无需为了小改动重新审阅所有历史资料。
- 实现发生明显变化时同步文档，只记录仍然有效的事实，避免不断累加规则。

## 项目与实时预览

根入口现在是 React + Vite：`index.html`、`src/`、`package.json`。`3d/index.html` 和 `myscore/index.html` 仍是独立静态文档；三处共享根目录的照片、字体、海报和馆藏媒体。

根页面使用 hash 路由，`3d/` 是独立三维陈列室，`myscore/` 是独立赛事页面。导航使用相对链接 `3d/`、`myscore/` 与 `../`。路径和预览说明见 [BROWSING_MODES.md](BROWSING_MODES.md)。

- 涉及页面、样式或交互时，修改前先确认实时预览运行。
- 根页面使用 `npm run dev`，默认地址 http://127.0.0.1:3000/，保存后自动刷新；首次或依赖变更后先运行 `npm ci`。
- 需要 MyScore 实时数据时，另开 `node --max-old-space-size=128 myscore/server/index.mjs`，本地跨域环境通过 `ALLOWED_ORIGINS` 配置。
- `node serve.mjs` 只用于静态目录预览，不再编译 TSX；构建后可预览 `dist/`。
- 如果端口被占用，先确认是否就是本项目服务；需要换端口时说明新地址。
- 保持预览运行。完成后验证页面加载、控制台和受影响的交互，并告诉用户预览地址。

## 代码在哪里

| 范围 | 主要文件 |
| --- | --- |
| 根页面入口、构建与路由 | index.html、package.json、vite.config.ts、src/App.tsx、src/main.tsx |
| 根页面展区与共享组件 | src/views/、src/components/ |
| 根页面馆藏数据与样式 | src/data/collections.ts、src/index.css |
| 3D 页面、样式与入口 | 3d/index.html、css/world.css、js/world/app.js |
| 3D 引擎、装置与资源路径 | js/world/engine.js、experiences/、paths.js；遵循 js/world/EXPERIENCE_CONTRACT.md |
| 3D 共享馆藏数据 | js/*-data.js、js/world/collection.js |
| MyScore 页面与数据服务 | myscore/、myscore/server/ |
| 旧 Folio／Liminal 静态层 | css/folio*.css、liminal*.css、js/main.js、各 *-stage.js；根入口已不加载，修改前先确认仍有引用 |
| 共享媒体与字体 | photo/、posters/、covers/、assets/、fonts/ |
| 本地运行库 | js/vendor/ |
| Pages 发布 | .github/workflows/deploy.yml |

根页面由 React 组件与 `src/index.css` 决定，不再加载旧 `css/folio*.css`、`liminal*.css`、`js/main.js` 或 atelier 层。3D 独立加载 `world.css`，共用根目录媒体；文档相对路径使用 `../`，模块中的站点资源通过 `js/world/paths.js` 解析。
Vite 构建会为 `src/` 资源生成哈希文件名；静态目录中的带 `?v=` 文件修改后仍要递增版本。构建前 Vite 会把静态目录复制进 `dist/`。

## 改动与文件保护

- 保持文件为 UTF-8。用编辑工具或明确指定 UTF-8 的 Node/Python 写入；不要用 PowerShell 默认编码重写文件。
- 不把原始照片、.venv/ 或压缩 vendor 库当作普通改版文件。需要处理媒体时优先生成新文件，保留原图。
- 图片和字体优先使用仓库内相对路径。第三方内容链接与运行时加载外部资源是两件事。
- 运行依赖集中在 `package.json` 与 `package-lock.json`。新增生产依赖前先确认必要性，并说明维护、体积与性能代价。
- 保留数据字段和现有功能，除非任务本身要求调整。重构 DOM 时同步选择器、事件委托和 ARIA。
- 根页面由 React 状态切换视图，不再使用 `.tab-panels` 或旧 `main.js` 的 DOM 查找；只在维护仍被 3D／归档引用的旧静态脚本时处理这些结构。
- .glass 和 --sky-* 是兼容名称，当前分别表示纸面控件与墨绿强调色，不代表必须使用玻璃或天蓝。
- 避免留下没有调用点的脚本、无效规则与临时调试代码。

## 设计与交互的判断

- 当前方向是黑曜石／香槟金的夜间私人艺术馆，具体做法见 [DESIGN.md](DESIGN.md)；后续可以整体换方向。
- 让图片、书名和文字读得清楚，比例与留白服务内容。不要为了“高级”制造大段空场。
- 动效应帮助定位、切换、阅读或表达内容。可以探索新形式，同时照顾响应速度与滚动体验。
- 优先复用已有 GSAP、ScrollTrigger 和 Lenis；锚点与布局刷新沿用共享机制。
- 动画实例及时清理，空闲循环尽量停止，图片加载后合并刷新。避免同一元素被多套动画抢写。
- prefers-reduced-motion 下保留完整信息与可用操作。
- 字号、圆角、强调色数量、阴影、章节结构都没有永久配额；改动后检查整页是否协调。

## 验证

按影响范围验证，不为简单可逆样式修改堆砌测试。

- 检查修改过的 JS 语法、资源路径和 git diff。
- 根页面改动依次运行 `npm test`、`npm run lint`、`npm run build`；静态 3D 或 MyScore 改动按对应模块补测。
- 在桌面与窄屏检查比例、换行、裁切和横向溢出；必要时检查 320px 与放大显示。
- 受影响的控件测试点击与键盘：可见焦点、Enter/Space、方向键、Escape，以及关闭后焦点返回。
- 标签页、搜索、照片和藏品详情应继续可用；隐藏内容不应覆盖当前内容。
- 文字和控件需要足够对比度。旧色板报告不能当作新色板的验证结果。
- 动作使用 button，导航使用 a；图标操作有可读名称，触摸目标留足空间。

## Git 与交付

- 用户没有明确要求提交、推送或创建 PR 时，保留工作区改动供预览验收。
- 已获授权时继续完成相应操作，不重复询问。提交前说明范围与分支，推送前确认远端。
- 检查暂存内容，不提交凭证、环境目录、临时文件或无关改动。
- 默认正常提交和推送，不擅自强推或覆盖他人的提交。
- 最后说明实际完成的内容、验证情况和仍存在的限制。

## X/Twitter

读取时不用 agent-reach 或其配置。优先使用内置浏览器；直接 HTTP 请求默认使用本地代理 http://127.0.0.1:7897。
