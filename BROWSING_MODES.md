# 两种浏览模式

默认首页 `/` 是 normal 最新的 Folio／Liminal 设计；`/3d/` 是 3dweb 最新的「万象游乐场」。各自页面顶部的「进入 3D 世界」与「返回普通版」通过原生链接切换。两者是独立 HTML 文档，支持直接访问、刷新、浏览器前进和后退。3D 装置继续使用 `#photo`、`#books` 等原有 hash。

## 来源与带入方式

整合目录是 `C:/Users/qsr/.codex/worktrees/541d/night-web`，起点为 detached `b411085`。两个来源也都从该提交开始，最新成果均在工作区，不能通过分支提交或合并结果辨认：

- normal：`C:/Users/qsr/.codex/worktrees/e857/night-web`；13 个未暂存文件、12 个未跟踪文件，无暂存修改。
- 3dweb：`C:/Users/qsr/.codex/worktrees/23ed/night-web`；4 个未暂存文件、24 个未跟踪文件，无暂存修改。

以上是开始带入时的状态。终检时来源的 Git 元数据已发生变化：normal 为 `codex/nightweb-ai`／`94439dc`，3D 为 `codex/3d`／`24325ec`，两边工作区均干净。整合过程未执行这些提交或切换。与初始快照逐字节对比，53 个相关来源文件全部保持相同，且当前来源相对共同起点的完整文件清单与快照一致，没有新遗漏。

按实际文件逐项带入普通版的全部 25 个文件，包括 MyScore 外观、字体、图标、脚本和设计记录。3D 入口迁至 `3d/index.html`，完整带入 `css/world.css`、`js/world/`、本地 Three.js 及许可证、玩法与验证文档；其产品和设计说明保存在 `3d/PRODUCT.md`、`3d/DESIGN.md`。根协作说明补入两种模式的边界。

3D 来源的 `reading.html` 与起点的原普通首页内容一致，仅行尾不同。它的阅读入口现在指向最新普通首页，避免重复一份过时页面；原有馆藏内容仍在普通版与共享数据中。3D 模块仅作站点路径适配及按钮接线，整合时保留当时各装置的模型和玩法。

带入前保存了两边 Git 状态、HEAD、暂存差异和所有相关未提交文件的 SHA-256；交付前再次对照。主模型与子代理在来源目录只执行读取与比较，未修改文件、切分支、重置、清理、提交或操作暂存。初次整合验收未提交或发布。随后用户明确授权提交本次成果、合并 main 并正常推送；成果分支为 `codex/browsing-modes`，保留其他工作树的分支归属。现有 GitHub Pages 从 main 根目录自动部署，无需修改部署配置。

## 代码与资源

- 普通版：根 `index.html`、原组件与后置的 `folio*.css`／`liminal*.css`，按钮使用 `css/mode-switch.css`。
- 3D 版：`3d/index.html`、`css/world.css`、`js/world/`、`js/vendor/three/`。模块相对导入保持原结构；`js/world/paths.js` 从模块地址计算站点根路径，统一解析图片、纹理、详情与海报导出资源。
- 共用现有 `js/*-data.js`、照片、书影、画作等；不复制整套媒体，不增加生产依赖。
- 两页样式互不加载。普通版保留原本独立的银色雕塑 WebGL 动效，但不请求 Three.js、`js/world/`、`world.css` 或展厅装置的资源。
- `/myscore/` 仍为独立页面，保留 normal 已完成的外观。其数据服务和线上源与本次整合无关。

## 本地运行与部署

没有包管理器或构建步骤，使用现有 Node 静态预览。先检查端口，避免占用来源的 3117（3D）和 3127（normal）。PowerShell：

```powershell
$env:PORT = '3137'
node serve.mjs
```

普通版 `http://127.0.0.1:3137/`，3D 版 `http://127.0.0.1:3137/3d/`，MyScore `http://127.0.0.1:3137/myscore/`。服务支持目录末尾斜杠重定向并监听 `3d/` 的入口改动。

仓库远端为 `n1ght-ow/n1ght-web`。若 GitHub Pages 按仓库名部署，站点前缀为 `/n1ght-web/`。切换及资源均使用相对地址，静态托管只需连同 `3d/index.html` 发布完整目录，无需 SPA 重写规则。可以在第二个终端模拟子路径：

```powershell
$env:PORT = '3138'
$env:BASE_PATH = '/n1ght-web/'
node serve.mjs
```

对应 `http://127.0.0.1:3138/n1ght-web/` 与 `http://127.0.0.1:3138/n1ght-web/3d/`。服务的 `BASE_PATH` 仅用于预览，生产文件不依赖该环境变量。`myscore/deploy/nginx-*.conf` 仅供 MyScore API 主机使用，不是本网站的静态托管配置；此次没有修改或发布线上服务。

## 本次验证

详细浏览器与来源比对记录见 `INTEGRATION_VERIFICATION.md`。`WORLD_VERIFICATION.md` 是从 3D 来源保留的历史验证报告，不代表本次整合验收。
