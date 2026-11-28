# 浏览与预览

站点保留三个可直接访问的入口：

- `/`：React + Vite 主站，包含首页、九个收藏展区和 3D 世界入口。
- `/3d/`：独立静态的三维夜间陈列室，八座展区共用根目录馆藏媒体。
- `/myscore/`：独立静态的赛事页面，按需连接 MyScore 数据中转。

三者使用相对链接互相切换；根页面是 hash 路由，不依赖服务器端 SPA 重写。

## 本地运行

```powershell
npm ci
npm run dev
```

主站：<http://127.0.0.1:3000/>

需要 MyScore 实时数据时，在第二个终端运行：

```powershell
$env:ALLOWED_ORIGINS = 'http://127.0.0.1:3000'
node --max-old-space-size=128 myscore/server/index.mjs
```

数据服务监听 `http://127.0.0.1:3101`。本地页面会优先直连可跨域来源，失败后转到该服务；控制台中的上游 CORS 提示属于预期回退，不代表页面数据失败。

## 构建与子路径

```powershell
npm test
npm run lint
npm run build
```

Vite 使用相对 `base`，因此 `dist/` 可以放在域名根目录，也可以放在 GitHub Pages 的 `/n1ght-web/`。`vite.config.ts` 会把 `3d/`、`myscore/`、照片、海报、字体和馆藏资源复制进 `dist/`。

可在本地模拟仓库子路径：

```powershell
$env:PORT = '3002'
$env:BASE_PATH = '/n1ght-web/'
node serve.mjs
```

这里应把 `serve.mjs` 的工作目录设为 `dist/`，然后访问 <http://127.0.0.1:3002/n1ght-web/>。`serve.mjs` 只提供静态预览，不再编译 TSX。

## Pages 发布

`.github/workflows/deploy.yml` 在推送到 `main` 后执行 `npm ci`、类型检查、测试和构建，再发布 `dist/`。仓库 Pages 的 Source 必须设为 **GitHub Actions**；不要改回从 `main` 根目录直接发布源码。

旧 Folio／Liminal 的浏览模式和整合记录保存在 `archive/BROWSING_MODES-folio-liminal.md`，不再描述当前根页面。
