"""One-off doc corrections after the 2026-09-25 pass."""

EDITS = {
    "AGENTS.md": [
        (
            "它是 21 张里的第 14 张。**它不是控件**：同一张照片在棋盘里是 03 号格（真 `<button>`）",
            "它是 21 张里的第 14 张。**它不是控件**：同一张照片在棋盘里是 slot 13 那格（真 `<button>`）",
        ),
        (
            "宽度是 `min(90%, 87vh)`——一屏高度预算写在宽度轴上，1440×900 下是 866×578。",
            "宽度是 `min(90%, 87vh)`——一屏高度预算写在宽度轴上，1440×900 下是 783×522。",
        ),
        (
            '`output/board-map.py` 能把"第一屏到底显示哪些格"画出来。',
            '`output/board-map.py` 能把"第一屏到底显示哪些格"画出来，`output/opening.mjs` 直接在浏览器里量。',
        ),
    ],
    "DESIGN.md": [
        (
            "| hero 字标 (#F2F2EF) / 影像层+scrim，1440×900 最差像素 | **5.40:1** | AA（大字下限 3:1） |\n"
            "| hero 字标 / 影像层+scrim，390×844 最差像素 | 6.43:1 | AA |",
            "| hero 字标 (#F2F2EF) / 影像层+scrim，1440×900 最差像素 | **5.21:1** | AA（大字下限 3:1） |\n"
            "| hero 字标 / 影像层+scrim，390×844 最差像素 | 8.55:1 | AAA |\n"
            "| hero 字标 / 影像层+scrim，320×720 最差像素 | 8.91:1 | AAA |\n"
            "| 摄影开场大图里的正文（纸面） | 同 `--color-text-secondary` | 即 8.04:1，无新底色 |",
        ),
    ],
}


def main():
    for path, pairs in EDITS.items():
        s = open(path, encoding="utf-8").read()
        for a, b in pairs:
            if a not in s:
                raise SystemExit("%s: missing %r" % (path, a[:60]))
            s = s.replace(a, b)
        open(path, "w", encoding="utf-8", newline="").write(s)
        print("%s: %d edits" % (path, len(pairs)))


if __name__ == "__main__":
    main()
