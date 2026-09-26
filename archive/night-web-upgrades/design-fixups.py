"""One-off DESIGN.md updates after the 2026-09-25 pass."""

PATH = "DESIGN.md"

OLD_HERO = "hero（**两层**：一层全幅影像 + 压在它上面的**巨型字标**，`N1GHT CHXN9` 两行居中、字号跟着 `.shell` 的内容列走；导航条是第三个浮在上面的东西。影像层 `position: absolute; inset: 0`，完全脱离文档流，所以字标仍然精确居中在视口里。眉标、标题、统计条与滚动提示全部已退役）"
NEW_HERO = "hero（**两层**：一层全幅影像 + 压在它上面的**巨型字标**，`N1GHT CHXN9` 两行居中、字号跟着 `.shell` 的内容列走；导航条是第三个浮在上面的东西。影像层 `position: absolute; inset: 0`，完全脱离文档流，所以字标仍然精确居中在**它自己那块画布**里。**这一块比视口矮一档**（`calc(100dvh - clamp(120px, 18vh, 170px))`，`min-height: 440px`），底部那一条露出来的是 PHOTOGRAPHY 自己的眉标与导语——交接靠的是下一章的内容，**没有新增任何滚动提示元素**。眉标、标题、统计条与滚动提示全部已退役）"

EDITS = [
    (OLD_HERO, NEW_HERO),
    (
        "- **摄影是正文里的一屏**（`#photo` 段落内的 `.photo-wall`，高度 `clamp(400px, 62vh, 720px)`，`≤720px` 是 `clamp(320px, 56vh, 520px)`；格子宽度由 `js/photo-wall.js` 的 `CELL_VW 0.20 / CELL_MAX 280 / GAP 18` 算，实测 1440×900 下是 **262×175 的格子 + 558px 的条带**，旧的 0.14 / 208 / 14 是 183×122 + 504），不是全屏层：`#photo-view`、「Open the wall」按钮、滚动锁与 inert 那一套都已退役，nav 与页脚链接只是普通锚点。",
        "- **摄影是正文里的两屏**：章节头下面一张**开场大图**（`.photo-lead`，21 张里的第 14 张，`min(90%, 87vh)` 宽、3:2、出血无圆角、**不是控件**），再下面是 `.photo-wall`（`#photo` 段落内，高度 `clamp(400px, 62vh, 720px)`，`≤720px` 是 `clamp(320px, 56vh, 520px)`；格子宽度由 `js/photo-wall.js` 的 `CELL_VW 0.20 / CELL_MAX 280 / GAP 18` 算，实测 1440×900 下是 **262×175 的格子 + 558px 的条带**）。两者都不是全屏层：`#photo-view`、「Open the wall」按钮、滚动锁与 inert 那一套都已退役，nav 与页脚链接只是普通锚点。\n"
        "- **开场大图就是棋盘的第一屏**：世界公式 `|(x + 3y) mod 21|` 加上「authored 行 0 在 boot 时居中」，把第一屏正中那一格钉死在 **slot 13**（中间行是 `10 / 13 / 16`）。所以「让棋盘开场就是这张图」这件事只有一种做法——把那张排在 slot 13，`data-photo-index` / `.photo-frame-no` / `aria-label` 三处一起跟着重排。**开场格不是可以随便挑的**，重排之前先跑 `output/board-map.py`。",
    ),
    (
        "- **压在字标和影像之间的是 scrim，而且它是实测过的**：`linear-gradient(180deg, ink α0.46 → 0.66（20%）→ 0.66（56%）→ 0.46（78%）→ 0.70)`——中段最重，因为字标（1440×900 下 y 283–617）正好压在整张图最亮的那条带（受光云 + 燃烧环 + 尖刺星）上。实测最差像素：1440×900 **5.40:1**、390×844 6.43:1（前景 #F2F2EF；量法见 3.2 推论 3）。顶端留 0.46 是给导航玻璃留可折射的东西，底端 0.70 是让它交接到纸面那一刀干净。",
        "- **压在字标和影像之间的是 scrim，而且它是实测过的**：`linear-gradient(180deg, ink α0.50 → 0.72（22%）→ 0.72（60%）→ 0.54（80%）→ 0.78)`——中段最重，因为字标正好压在整张图最亮的那条带（三栋楼之间那块受光云）上。实测最差像素：1440×900 **5.02:1**、390×844 **8.55:1**、320×720 **8.91:1**（前景 #F2F2EF；量法见 3.2 推论 3，工具是 `output/hero-contrast.mjs` + `output/hero-analyze.py`）。顶端留 0.50 是给导航玻璃留可折射的东西，底端 0.78 是让它交接到纸面那一刀干净。**换图 / 改 object-position / 动这个渐变的任一段 alpha 都必须重新量。**",
    ),
    (
        "- **一张图三个切法**：`<picture>` 在 `max-aspect-ratio: 3/4` 时换 `hero/nebula-tall.jpg`（708×1532，从原图正中裁的原生像素切片——横图铺 390×844 本来也只露一条 1:2.2 的窗，与其把宽图拉高不如直接给它那块像素），否则走 `srcset` 的 1200w / 2400w。桌面 1440×900 实测取 2400w，竖屏 390×844 取 tall，横屏 844×390 取 1200w。换图要同步 `alt` 与 `width` / `height`，**原图不要预裁**：露哪一块由 `object-position` 选（桌面横图纵向没有余量，只有横向能动）。",
        "- **一张图三个切法（本人拍的陆家嘴仰拍）**：`<picture>` 在 `max-aspect-ratio: 3/4` 时换 `hero/lujiazui-tall.jpg`（462×999，从原图正中裁的原生像素切片——横图铺 390×844 本来也只露一条 1:2.16 的窗，与其把宽图拉高不如直接给它那块像素），否则走 `srcset` 的 1200w / 1440w。**交付的原图就是 1440×999，所以没有更大的档，也没有任何放大**：`srcset` 到 1440w 为止。三档全部由 `archive/hero-refresh/build-hero.py` 从 `hero/lujiazui-source.jpg` 生成，**不要手裁**。桌面 1440×900 取 1440w（`object-position: 50% 38%`，纵向 121px 余量花掉 62% 在上方：让字标落在云上而不是上海中心被灯打亮的那面幕墙上），竖屏 390×844 取 tall。它的 `object-position` 第一值只在竖屏起作用，第二值只在横屏起作用——两个值都是量过的，不要凭感觉调。",
    ),
    (
        "- **hero 的影像层也是全彩的**（无 `filter`）：**第二个明文例外**，理由同棋盘——它是这一屏的图画，压饱和只会读成渲染故障。",
        "- **hero 的影像层也是全彩的**（无 `filter`）：**第二个明文例外**，理由同棋盘——它是这一屏的图画，压饱和只会读成渲染故障。旧的星云图（`hero/nebula*.jpg`）**已无人引用**，文件留在仓库里，不要以为还有两个 hero。",
    ),
]

def main():
    s = open(PATH, encoding="utf-8").read()
    for a, b in EDITS:
        if a not in s:
            raise SystemExit("missing: %r" % a[:70])
        s = s.replace(a, b, 1)
    open(PATH, "w", encoding="utf-8", newline="").write(s)
    print("DESIGN.md: %d edits" % len(EDITS))


if __name__ == "__main__":
    main()
