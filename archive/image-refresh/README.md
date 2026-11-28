# image-refresh

Every image on this site was being served larger than the box it lands in.
`build-images.py` writes the renditions that are actually painted, and reports
what each one cost in bytes and in measured error.

| what | before | after | target | why that size |
| --- | --- | --- | --- | --- |
| `covers/` (18) | 5.76 MB | **1.64 MB** | 1280px webp | the dial's centre card measures ~447-520 CSS px; dpr2 needs ~1040 |
| `photo/wall/` (21, new) | 3.14 MB | **0.65 MB** | 560px webp | the lightbox rail thumbnail is 48 CSS px, i.e. 96 device px on dpr2 |
| `sport/` (5, in place) | 1.25 MB | **0.78 MB** | 1600px webp | the open accordion panel is ~812 CSS px wide |
| `hero/` | 0.91 MB | +0.41 MB | unchanged + a **1600w** cut | the srcset jumped 1200 -> 2400, so a dpr1 1440 viewport had to take 2400w |

**Sources are never modified in place except where the file IS the rendition.**
`covers/`, `sport/` and `hero/` are replaced by the same picture at the right
size (the old covers were deleted by hand after the run; git has them).
`photo/` is read-only. The script writes derived images under `photo/wall/`.

## Quality is measured at the size the picture is painted

Each output is compared against the source taken down to the same **display**
pixels - the browser's own path - and the mean and p99.9 absolute error are
printed. Anything over the gate is re-encoded at a higher quality before it is
written.

Edge-heavy graphic art can show small differences across many pixels. The tail of the error distribution makes visible artifacts easier to detect.

## Two things the script learned the hard way

1. **Never upscale, never crop.** A source smaller than the target keeps its
   own size, every file keeps its own aspect ratio.
2. **A rendition bigger than what it replaces is not a rendition.** This is not
   hypothetical: Pillow's JPEG encoder came out **19% larger** than the plates
   already in `hero/`, and the first run wrote them in place. The guard now
   covers the in-place case, which is why `hero/` keeps its three original
   JPEGs and only gains the missing 1600w cut.

## Regenerate

    python -m pip install --target %TEMP%\pytools pillow
    set PYTHONPATH=%TEMP%\pytools
    python -B archive/image-refresh/build-images.py             # write
    python -B archive/image-refresh/build-images.py --dry-run   # report only
    python -B archive/image-refresh/build-images.py --only=covers,hero

Pillow is a **build tool**. The site does not load it, and it is not installed
into `.venv` (that one belongs to the site and is not touched - same pattern as
`archive/fonts-subset/`).

**Adding content means re-running this**: a new photo needs a `photo/wall/`
entry for the photo viewer thumbnails.

> **2026-09 更新**：摄影章节的呈现方式换成了**牌堆**（`css/photo-deck.css` + `js/photo-deck.js`），牌面封顶 **800 CSS px**。所以牌面与灯箱大图都走 `photo/` 的 **1600px 线性档**（800 正好是它的一半，dpr2 下也不放大），`photo/wall/` 的 560px 现在**只喂灯箱缩略条**（48 CSS px）。原来那条「棋盘格 258 CSS px」的说法随全屏棋盘一起退役。