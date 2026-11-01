# MyScore 网页版

静态页面属于 night-web；必要数据中转是独立的 Node.js 服务。无 npm 构建和第三方生产依赖。默认浅色，中文操作，浏览器原生链接、日期和历史记录；订阅、日历、提醒及 APK 更新不在网页中。

## 本地运行

在 night-web 根目录启动两个进程，保持运行：

```powershell
node serve.mjs
node --max-old-space-size=128 myscore/server/index.mjs
```

页面：<http://127.0.0.1:3100/myscore/>。数据服务：<http://127.0.0.1:3101/api/v1/health>。

首页顶栏也有 MyScore 入口。修改 MyScore 的前端模块和样式会刷新预览；修改服务器模块后需重启数据进程。生产部署前在 `config.mjs` 配置 HTTPS API 地址。

## 功能与数据边界

- ESPN：英超、欧冠、联赛杯、足总杯、NBA、NFL、F1；赛程、详情、球队赛季战绩、分节、技术统计、球员、足球阵容和文字实录、NFL 进攻回合与逐档进程。详情另接来源已提供的赛季排名、近期赛果、双方交锋及单项领跑数据，与本场统计分栏。
- 5EPlay：Major / S+ / S 一线赛事及 Team Spirit 的其他比赛；战队赛程、全场选手与已结束地图的侧别和选手统计。历史覆盖遵循来源分页上限。
- 英雄联盟官网及腾竞：Worlds 赛程与按战队身份核验的小局、时长、胜方、选手照片、英雄、等级、KDA、资源、出装（含饰品与位置任务装备）、BP、召唤师技能、符文、伤害、承伤、回复、视野与经济明细。英雄英文名缺失时使用腾讯官方英雄图鉴核对，装备图按实际装备 ID 加载；来源未发布时保持未知。
- 播放：CS2 斗鱼 6657、LOL 虎牙 149361；英超/NBA 精确匹配咪咕单场，双方中文队名、赛事和开赛时间 ±20 分钟均需一致。未找到单场只提供用户主动选择的专区。
- 结束后 CS2 一线赛事/Spirit 和 LOL 匹配原 App 指定 B 站账号的完整录像；曼城杯赛匹配指定账号的集锦，校验对手、比分、赛事及发布时间。F1/NFL 没有播放入口。
- 足球、NBA、NFL 球员补充资料验证 ESPN 球队与球员身份，支持 NFL 分组名单；补充生日、身高、体重、大学与职业年数等来源已有字段。足球照片缺失时自动尝试姓名与生日同时匹配的 FPL 照片；其他图片失败保留文字标识。不将赛季指标展示成本场统计，不制造评分或缺失成绩。CS2 使用来源 `portrait/half_portrait` 选手照，并接入首杀、爆头、多杀、残局、下拆包与对位击杀等实际明细；无侧别与选手数据的未出场决胜图不计为已打地图。

能直连的接口先由浏览器请求，网络/跨域失败时由自有服务重试。LOL、播放解析及球员补充资料通过必要中转。第三方可改变格式、缓存、地区限制或风控；本地联通不能代表新加坡服务器或所有访客网络联通。

数据读取与页面展示分开：`presentation.mjs` 保留原始来源对象，生成核心表格、补充数据、地图结果与资料分组。默认界面过滤全空、重复及内部字段，真实零值继续保留；次要指标可展开。详情样式位于后加载的 `reading.css`，赛程继续使用 `styles.css`。新增前端文件发布时需一并上传。

`comparison.mjs` 统一双队比较与比分胜负：绿为优势，红为劣势；相等或未知保持中性。数字方向随项目变化，犯规／失误越少越好，命中与出手的组合按命中率比较。足球点球比分独立于常规比分，不把普通平局当作点球决胜；未终场不宣告比分胜负。

列表按北京时间合并前一天和当天的独立源日期。进行中最短 2 秒检查；来源 `Cache-Control`、失败退避和 `Retry-After` 可延长间隔。F1 全量车手统计最短 15 秒；隐藏页面暂停快速轮询。终场结果自动锁定，手动刷新或长间隔复核可接受来源修正。

界面显示来源获取/检查时间，比赛计时、状态和比分来自来源；不在浏览器推算比赛时钟。缓存不等于实时，刷新频率也不等于来源更新频率。

## 服务接口

均为 GET，路径前缀 `/api/v1/`。线上地址是 <https://43.160.228.109/api/v1/>，只暴露这个前缀，跨域来源为 `https://n1ght-ow.github.io`：

- `scores?league=nba&date=2026-11-01`
- `detail?match=espn:nba:EVENT_ID:COMPETITION_ID`；F1 历史详情可在 ID 后带 `:YEAR`。
- `team?league=epl&id=382`
- `watch?match=SOURCE_MATCH_ID`
- `profile?match=SOURCE_MATCH_ID&id=PLAYER_ID`
- `source?kind=summary&league=nba&event=EVENT_ID`：仅允许浏览器直连适配器的固定端点；不接受 URL，不代理公开客户端配置。
- `health`：进程状态、缓存字节数、排队数、RSS。

赛事 ID：`epl/ucl/efl/fa/nba/nfl/f1/cs2/lol`。比赛 ID 沿用 App；参数先验证，再拼装固定 HTTPS 来源地址。跨域允许列表配置在 `ALLOWED_ORIGINS` 中，值为逗号分隔的网站来源，不包含路径；没有 Cookie 或登录令牌。生产凭证、证书私钥和环境文件不能放入仓库。

## 500MB 余量下的资源控制

一个进程、最多 2 个上游请求、64 项等待队列、相同请求合并；单个上游响应上限 8MB、超时 12 秒。源缓存最多 16MiB，标准化结果另限 4MiB/128 项，磁盘源缓存最多 64MiB；失败记录有上限。磁盘清理仅处理服务自己按哈希命名的缓存文件。

默认系统服务将 V8 老生代限制在 128MiB，cgroup 的 `MemoryHigh=224M`、`MemoryMax=288M` 是额外的进程组保护。它们不是容量保证；达到硬上限可能终止服务，systemd 会有限重试。磁盘缓存、日志和其他已有业务也要纳入系统验收。

正常负载目标：服务进程组在 224MiB 内，全机 MemAvailable 约 150MiB 或以上，无 OOM、持续换页和既有业务退化。失败时把上游并发改为 1、内存缓存改为 8MiB 后复测；仍失败则停止上线，不擅自清理业务或购买升级。

## 腾讯云 Ubuntu 部署

2026-11-01 已在新加坡轻量应用服务器（`lhins-79novr63`，Ubuntu 26.04，2 vCPU / 955MB，公网 `43.160.228.109`）完成部署与验收。网页仍由 GitHub Pages 托管；宿主机没有 Node，中转以 Docker 容器运行，HTTPS 由宿主机 Nginx 和 Let's Encrypt IP 证书提供。

1. 把中转模块放到 `/opt/myscore`：`shared.mjs`、`provider.mjs`、`sources.mjs`、`media.mjs`、`team-names.mjs` 和 `server/index.mjs`、`server/store.mjs`。
2. 安装 Docker，用 `deploy/docker-run.sh` 启动容器：Node 24 alpine；只监听 `127.0.0.1:3101`；288MiB 硬上限、200MiB 软上限；只读根文件系统；日志上限 10MiB；自带 health 检查。`ALLOWED_ORIGINS` 只写站点来源（协议＋主机），实际为 `https://n1ght-ow.github.io`，不含仓库路径。
3. 安装 Nginx（`apt install nginx`）和 Certbot。Certbot 必须 5.4 或以上，用 snap 安装（`snap install --classic certbot`，本机 5.9.0）；Ubuntu 仓库的 4.0 不支持 IP 证书。
4. 先启用 `deploy/nginx-http.conf`，创建 `/var/www/letsencrypt`，并在轻量应用服务器的防火墙放行 80、443（Nginx 未装好前 80/443 不通是正常的）。
5. 申请 IP 证书，先加 `--staging` 验证，成功后再去掉：

    ```bash
    certbot certonly --webroot -w /var/www/letsencrypt \
      --ip-address SERVER_PUBLIC_IP --preferred-profile shortlived \
      --register-unsafely-without-email --agree-tos
    ```

本轮未登记邮箱；需要到期提醒时用 `certbot update_account --email` 补上。

6. 证书存在后换成 `deploy/nginx-https.conf`，把 `SERVER_PUBLIC_IP` 替换为公网 IP，`nginx -t` 后 reload。IP 证书约 6 天有效；配置只暴露 `/api/v1/`，其他路径返回 404，HTTP 跳转 HTTPS。
7. 把 `deploy/certbot-deploy-hook.sh` 安装为 `/etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh`，mode 755。snap 定时器每天续期两次，`certbot renew --dry-run` 已通过（staging 与正式 lineage 都模拟成功）。
8. 把 `myscore/config.mjs` 的线上 `apiBase` 指向 `https://SERVER_PUBLIC_IP`。此仓库不会自动推送；网站正式发布由用户安排。

命令中的公网 IP 按实际替换；证书私钥、环境文件和令牌不进入仓库。宿主机有 Node 24 时也可以改用 `deploy/myscore.service`，但本轮部署走 Docker。

## 验证

```powershell
node --test myscore/tests/data.test.mjs myscore/tests/presentation.test.mjs myscore/tests/comparison.test.mjs myscore/tests/images.test.mjs
node --max-old-space-size=128 myscore/tests/load.mjs --duration=1800
```

压测只使用原 App 的真实 JSON 样本和本地模拟来源，不向体育平台压测。Windows 本地压测包括同进程模拟访客，不等于 Ubuntu 进程组/全机内存验收；云端已用 `docker stats`、`free -m`、真实来源请求和证书续期模拟完成一次验收，连续多日观测仍待进行。

页面、来源、浏览器走查与云端验收记录见 [VERIFICATION.md](VERIFICATION.md)。
