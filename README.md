# N1GHT CHXN9

私人馆藏站点。根页面是 React + Vite 前端，`3d/` 与 `myscore/` 仍由独立静态模块提供。

## 本地运行

```powershell
npm ci
npm run dev
```

开发地址为 `http://127.0.0.1:3000/`。

## 验证与构建

```powershell
npm test
npm run lint
npm run build
```

`dist/` 包含可直接部署的完整站点。推送到 `main` 后，GitHub Actions 会构建并发布到 GitHub Pages。
