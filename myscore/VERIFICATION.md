# MyScore 网页版验证（2026-11-01，本地）

范围是 `/myscore/` 页面与数据服务在本机和服务器上的实际行为：真实来源的赛程、比赛详情、球队与播放入口，键盘与浏览器历史，故障与恢复，以及线上 HTTPS 与 CORS。云端部署与验收见「云端验收」一节。

环境：Windows、Node v24.15.0、Chrome 无头（本地 CDP 脚本，无新增依赖）。`node serve.mjs` 在 `http://127.0.0.1:3100/`，`node --max-old-space-size=128 myscore/server/index.mjs` 在 `http://127.0.0.1:3101`，页面按设计先直连来源、失败时回退自有服务。

## 自动化与来源

| 检查 | 结果 |
| --- | --- |
| `node --test myscore/tests/data.test.mjs` | 22 项全部通过，0 失败（约 2.4 秒）。覆盖来源身份与统计、点球比分、北京时间跨日、未知字段、CS2 地图与侧别、LOL 小局与出装、F1 车手统计、咪咕／回放匹配、并发合并、缓存与 429 退避、服务跨域与错误文案 |
| `node myscore/tests/live.mjs`（03:11） | 7 个来源详情全部成功：ESPN 英超 1039ms、欧冠 410ms、NBA 393ms、NFL 406ms、5EPlay CS2 424ms（3 张地图）、LOL 官网 706ms（5 局）、F1 3379ms（2026 场次）。记录在 `.myscore-cache/live-result.json` |
| 10 访客 × 30 分钟本地压测（来源为原 App 真实样本的本地模拟） | 完成 1802 秒、8151 次请求、0 错误；峰值 RSS 86.2MiB、源缓存峰值 0.13MiB；Node v24.15.0 / win32。只覆盖同进程模拟访客，不等同云端验收；记录在 `.myscore-cache/load-result.json` |

压测不会向体育平台发压测流量；真实来源只做上面的有限联调。

## 浏览器走查

全部页面使用真实来源，没有演示数据。03:54 的完整走查中，`?date=2026-11-01` 读到 14 场比赛（英超 2、NBA 7、F1 2、LOL 3），其中 2 场进行中；03:43–03:46 的另一次走查读到同一批比赛。

| 宽度 | 结果 |
| --- | --- |
| 1440 | 14 场、4 个赛事分组；标题 96px、日期 66px；`scrollWidth` 1440，无横向溢出；可见区队徽 8/10 已加载，其余 14 处是来源未提供队徽时的字母回退，未出现破图 |
| 390 | 14 场；标题 44.46px、日期 33.15px，均在版心内（22–200 / 264–368）；`scrollWidth` 390；队徽 10/11，字母回退 13 |
| 320 | 14 场；标题 36.48px、日期 28px，均在版心内（18–178 / 211–302）；`scrollWidth` 320；队徽 24/24，无回退；两队上下两行构图正常，比赛行宽 284px |

320–767 的标题与日期内嵌检查另存 `.impeccable/review/myscore/title-checks.json`；359/360/361px 的连续缩放没有出现裁切。

- **比赛详情**：打开 01:30 的英超 Tottenham Hotspur 2:0 Crystal Palace，出现 4 个内容标签、3 条比赛信息、8 行技术统计，来源行显示「ESPN · 获取于 03:54」，页面标题随比赛更新。
- **表格排序**：在阵容表点击列名后首行由「31 Antonín Kinsky」变为「37 Micky van de Ven」，表头 `aria-sort="descending"`；排序只在当前阅读页生效。
- **弹窗与焦点**：球员资料显示「Micky van de Ven」，Escape 关闭后焦点回到触发按钮；播放弹窗显示「咪咕 · 回放」，关闭后焦点回到播放按钮。两个弹窗都在关闭时按原按钮恢复焦点。
- **浏览器历史**：从滚动到 400px 的赛程进入详情，后退回到 `/myscore/?date=2026-11-01`，滚动恢复到 400px；前进回到详情并重建 4 个标签。标签切换也写入历史，后退按实际层级返回，不越过上一页。
- **外观与动态**：切到深色为 `rgb(16, 27, 49)`、`aria-pressed="true"`，再切回浅色；减少动态下 14 行照常显示，`opacity: 1`，动画与过渡为 0s。
- **首页入口**：顶栏 MyScore 可见，点击进入 `/myscore/`；390px 下首页顶栏高 82px，四个链接全部落在 390px 内，无横向溢出，原有页内锚点高亮仍只处理 `#` 链接。
- **控制台**：没有 JavaScript 异常。记录到的错误都是直连 ESPN 的网络失败（`ERR_CONNECTION_CLOSED`、F1 的 CORS），随后页面经自有服务取得数据；这正是预期的回退路径。

## 故障、恢复与文案

同时阻断直连来源和数据服务后，每个分组显示「这个来源暂时无法更新」与中文原因「数据服务暂时无法连接，请稍后重试」，并提供「重试」；赛程标题变为「当日赛程」，页面不保留伪造比分。解除阻断并重新加载后恢复 14 场（「14 场比赛，2 场正在进行」）。

本轮验证发现服务端会把上游的英文网络错误带到中文界面（`Failed to fetch`、`fetch failed`）。现在 `server/store.mjs` 与 HTTP 边界统一输出「来源暂时无法连接」，浏览器端连不上数据服务时显示「数据服务暂时无法连接，请稍后重试」；来源自身的 HTTP 状态和 429 退避仍保留可辨识信息。新增两项测试后共 22 项通过。

## 云端验收（2026-11-01）

部署目标：新加坡轻量应用服务器 `lhins-79novr63`（Ubuntu 26.04，2 vCPU / 955MB，公网 `43.160.228.109`）。宿主机原来没有 Node，中转以 Docker 容器运行；Nginx 1.28.3 与 Certbot 5.9.0（snap）装在宿主机。

- 容器：`node:24-alpine`，288MiB 硬上限 / 200MiB 软上限，只读根文件系统，端口只绑 `127.0.0.1:3101`，日志 10MiB × 2，health 检查正常。
- 证书：Let's Encrypt IP 证书，`--preferred-profile shortlived`，有效期至 2026-11-07；staging 与正式签发都成功，staging lineage 验证后已删除。`certbot renew --dry-run` 对两个 lineage 都模拟成功，部署钩子会在续期后 reload Nginx（已单独执行验证）。
- 对外只暴露 `/api/v1/`：其他路径 404，HTTP 308 跳 HTTPS；`Access-Control-Allow-Origin` 对 `https://n1ght-ow.github.io` 正确返回，非法来源 403，预检 204。
- 从真实的 GitHub Pages 来源（`https://n1ght-ow.github.io`）在 Chrome 中直接 fetch：health 200、LOL 赛程 200（3 场），没有混合内容或被拦截。
- 资源：容器 RSS 约 48–67MiB；5 个并发客户端 60 秒共 150 次请求全部 200；测试前后 `MemAvailable` 638 → 615MiB，既有 `yh-saibo` 容器保持 healthy，无 OOM 或重启。
- 浏览器通过系统代理打开 `https://43.160.228.109/api/v1/health` 正常渲染，说明 IP 证书被浏览器接受。

未做：云端 30 分钟 10 访客混合压测（本地模拟已完成）、连续多日续期观测、公开访问下的限流与访问日志分析。

## 未覆盖与限制

- 上游可用性在本机波动：03:47 的一次走查遇到 ESPN TLS 重置，页面只显示 LOL 3 场并逐项显示中文错误；03:54 来源恢复后完整走查通过。因此实时数据完整性取决于来源，页面不会用旧结果或推测值补足。
- 云端只做了一次验收（容器、IP 证书、CORS、150 次并发请求）；连续多日续期、公开限流与长期日志分析未做。
- 未覆盖真机移动网络、Safari/Firefox、屏幕阅读器逐项审计、200% 字号和高对比模式；CS2/LOL 的地图、阵容与回放入口只在 03:11 的真实详情数据上验证。
- 第三方可改变格式、缓存、地区限制或风控，单项失败时页面只对该来源报错，不推断其他来源的结果。

## 证据位置

以下为本机记录，`.impeccable/review/` 与 `.myscore-cache/` 默认不进入版本库：

- `.impeccable/review/myscore/checks.json`：03:54 的机器检查（视口尺寸、溢出、交互、故障与恢复、控制台条目）
- `.impeccable/review/myscore/`：完整数据下的 `verify-schedule-1440.png`、`verify-schedule-390.png`、`verify-schedule-320.png`、`verify-detail-1440.png`、`verify-schedule-dark-1440.png`、`verify-failure-1440.png`、`verify-detail-390.png`（03:54），`home-390.png`、`home-1440.png`（03:53），以及早前的 `schedule-*.jpg`、`detail-1440.jpg`、`lineup-390.jpg`（03:09–03:12）
- `title-checks.json`：320–767px 的标题与日期检查
- `.myscore-cache/live-result.json`、`.myscore-cache/load-result.json`：来源联调与 30 分钟压测的原始结果
- `.myscore-cache/verify.mjs`：本次浏览器走查使用的本地 CDP 脚本（不随站点加载）
- `myscore/deploy/docker-run.sh`、`nginx-https.conf`、`certbot-deploy-hook.sh`：线上实际使用的容器、Nginx 与续期钩子；云端检查通过 SSH 直接执行，输出已记在「云端验收」一节
