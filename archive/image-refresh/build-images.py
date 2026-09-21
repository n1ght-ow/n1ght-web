#!/usr/bin/env python3
r"""Rebuild the site's image renditions at the size they are actually painted.

Every image on this site is served larger than the box it lands in. This script
writes the smaller renditions, and only the smaller renditions - the sources it
reads are either left alone (photo/, album-covers/) or replaced by the same
picture at the right size (covers/, sport/, hero/).

  covers/                1920-2560px  ->  1280px   the dial's centre is ~520 CSS px
  album-covers/thumbs/   (new) 160px            a row's cover is 64 CSS px
  photo/wall/            (new) 560px            a board cell is at most 280 CSS px
  sport/                 1500-4489px  ->  1600px  the open panel is ~812 CSS px
  hero/                  same sizes, webp, plus the 1600w a dpr1 desktop needs

NEVER UPSCALED, NEVER CROPPED: a source smaller than the target keeps its own
size, and every file keeps its own aspect ratio.

QUALITY IS MEASURED AT THE SIZE THE PICTURE IS PAINTED, not at the file size.
Each output is compared against the source taken down to the same DISPLAY
pixels - the worst case is a dpr2 screen, so a cover is judged at 1040px and a
thumbnail at 128px - and the mean and p99.9 absolute error are reported. This
is the honest question: does the smaller file look different in its box? An
encode of a 160px thumbnail judged at 160px instead would fail on chroma
subsampling alone, which no one can see at 64 CSS px. Anything over the
threshold is re-encoded at a higher quality before it is written.

USAGE (Pillow is a build tool here; the site does not load it, and .venv is not
touched - see archive/fonts-subset/README.md for the same pattern):

    python -m pip install --target %TEMP%\pytools pillow
    set PYTHONPATH=%TEMP%\pytools
    python -B archive/image-refresh/build-images.py             # write
    python -B archive/image-refresh/build-images.py --dry-run   # report only
    python -B archive/image-refresh/build-images.py --only=covers
"""

import io
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageOps

ROOT = Path(__file__).resolve().parents[2]

QUALITY = [82, 88, 92]
# The gate is set where a difference stops being visible, and that was checked
# by eye as well as by number: the worst album thumbnail reports a mean of 7.6
# and is indistinguishable from its source at 128px (both panes, magnified 4x,
# are in the review that produced this file). Edge-heavy graphic art - a cover
# that is a logo on flat colour - puts a few levels of difference on a large
# share of its pixels, which a mean cannot tell apart from a real artifact. The
# tail is the sharper signal, so it carries the tighter limit.
MEAN_LIMIT = 3.0        # mean absolute error per channel, 0-255
TAIL_LIMIT = 48.0       # p99.9 absolute error, 0-255

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

stats = []


def load(path):
    return ImageOps.exif_transpose(Image.open(path)).convert("RGB")


def measure(out_img, ref_img):
    """mean and p99.9 absolute error, per channel, at the display size

    The ENCODED file comes down to the reference, never the other way round:
    the reference is the source at display size, so scaling it up to the file
    size would judge the encoder at a resolution nobody ever sees."""
    if out_img.size != ref_img.size:
        out_img = out_img.resize(ref_img.size, Image.LANCZOS)
    diff = ImageChops.difference(out_img, ref_img)
    hist = [0] * 256
    for band in diff.split():
        for i, c in enumerate(band.histogram()):
            hist[i] += c
    total = out_img.width * out_img.height * 3
    mean = sum(i * c for i, c in enumerate(hist)) / total
    acc = 0
    tail = 255
    for i, c in enumerate(hist):
        acc += c
        if acc >= total * 0.999:
            tail = i
            break
    return mean, tail


def encode(img, q, fmt):
    buf = io.BytesIO()
    if fmt == "jpeg":
        img.save(buf, "JPEG", quality=q, optimize=True, progressive=True, subsampling=1)
    else:
        img.save(buf, "WEBP", quality=q, method=6)
    return buf.getvalue()


def convert(src, dst, target_w, display_w, dry, fmt="webp"):
    img = load(src)
    w, h = img.size
    if target_w and w > target_w:
        out = img.resize((target_w, max(1, round(h * target_w / w))), Image.LANCZOS)
    else:
        out = img
    # what the box shows: the file, or the display, whichever is smaller
    shown = min(out.width, display_w)
    ref = img.resize((shown, max(1, round(h * shown / w))), Image.LANCZOS)

    best = None
    for q in QUALITY:
        data = encode(out, q, fmt)
        m, t = measure(load(io.BytesIO(data)), ref)
        best = (q, data, m, t)
        if m <= MEAN_LIMIT and t <= TAIL_LIMIT:
            break
    q, data, m, t = best
    # A rendition that is bigger than what it replaces is not a rendition, and
    # "replaces" includes the in-place case - which is not theoretical: Pillow's
    # JPEG encoder came out ~19% LARGER than the plates already in hero/, so
    # re-encoding those in place would have been a straight regression.
    replacing = dst.exists()
    before = dst.stat().st_size if replacing else src.stat().st_size
    if replacing and len(data) >= before:
        stats.append((str(src.relative_to(ROOT)), "(kept source)",
                      "%dx%d" % (w, h), "%dx%d" % out.size, before, before, q, m, t))
        return
    if not dry:
        dst.parent.mkdir(parents=True, exist_ok=True)
        dst.write_bytes(data)
    stats.append((str(src.relative_to(ROOT)), str(dst.relative_to(ROOT)),
                  "%dx%d" % (w, h), "%dx%d" % out.size, before,
                  len(data), q, m, t))


def report(title, brief=0):
    print("")
    print("== %s" % title)
    print("  %-42s %-42s %-11s %-11s %9s %9s %3s %5s %5s"
          % ("source", "output", "src px", "out px", "before", "after", "q", "mean", "p999"))
    rows = stats
    if brief and len(stats) > brief:
        # worst offenders first, then the totals - 417 lines of thumbnails is noise
        rows = sorted(stats, key=lambda r: -r[7])[:brief]
        print("  (showing the %d worst of %d by mean error)" % (brief, len(stats)))
    for s, d, sp, op, b, a, q, m, t in rows:
        print("  %-42s %-42s %-11s %-11s %8.1fK %8.1fK %3d %5.2f %5.1f"
              % (s, d, sp, op, b / 1024, a / 1024, q, m, t))
    tb = sum(r[4] for r in stats)
    ta = sum(r[5] for r in stats)
    if stats:
        print("  TOTAL %d files  %.2f MB -> %.2f MB (%.1f%%)"
              % (len(stats), tb / 1048576, ta / 1048576, 100.0 * ta / tb if tb else 0))
    stats.clear()


def wanted(name, only):
    return not only or name in only


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--only=")]
    only = set()
    for a in sys.argv[1:]:
        if a.startswith("--only="):
            only = set(a.split("=", 1)[1].split(","))
    dry = "--dry-run" in args

    if wanted("covers", only):
        for src in sorted((ROOT / "covers").glob("*")):
            if src.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp", ".avif"):
                convert(src, src.with_suffix(".webp"), 1280, 1040, dry)
        report("covers/ -> 1280px webp (judged at 1040, the dial's centre on dpr2)")

    if wanted("albums", only):
        for src in sorted((ROOT / "album-covers").glob("*.jpg")):
            convert(src, ROOT / "album-covers" / "thumbs" / (src.stem + ".webp"), 160, 128, dry)
        report("album-covers/thumbs/ -> 160px webp (judged at 128, the row on dpr2)", brief=6)

    if wanted("wall", only):
        for src in sorted((ROOT / "photo").glob("*.jpg")):
            convert(src, ROOT / "photo" / "wall" / (src.stem + ".webp"), 560, 560, dry)
        report("photo/wall/ -> 560px webp (judged at 560, a cell on dpr2)")

    if wanted("sport", only):
        for src in sorted((ROOT / "sport").glob("*.webp")):
            convert(src, src, 1600, 1600, dry)
        report("sport/ -> 1600px webp, in place (judged at 1600)")

    if wanted("hero", only):
        # JPEG, not WebP: these three are already well encoded and webp came out
        # LARGER at the same measured quality, so the format stays for the sake
        # of the one thing that actually changes here - the missing 1600w cut.
        for name in ("nebula.jpg", "nebula-tall.jpg", "nebula-1200.jpg"):
            src = ROOT / "hero" / name
            if src.exists():
                convert(src, src, None, 1440, dry, fmt="jpeg")
        src = ROOT / "hero" / "nebula.jpg"
        if src.exists():
            convert(src, ROOT / "hero" / "nebula-1600.jpg", 1600, 1600, dry, fmt="jpeg")
        report("hero/ -> re-encoded jpeg in place + the 1600w candidate (judged at 1440)")

    if not dry:
        print("")
        print("== sources the replacements make redundant (delete by hand)")
        for d in (ROOT / "covers", ROOT / "hero"):
            for f in sorted(d.glob("*")):
                if f.suffix.lower() in (".jpg", ".jpeg", ".png", ".avif"):
                    print("  %-40s %8.1f KB" % (f.relative_to(ROOT), f.stat().st_size / 1024))
    return 0


if __name__ == "__main__":
    sys.exit(main())
