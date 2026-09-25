"""Hero plate generation. Dev-only; the site never runs this.

The source is the owner's own photograph (a looking-up frame of the Lujiazui
towers). Three cuts come out of it, mirroring the three the nebula plate used
to have:

  hero/lujiazui.jpg        the whole frame, 1440x999. The delivered file is
                           already 1440px wide, so nothing here is upscaled
                           and nothing is invented.
  hero/lujiazui-1200.jpg   the same frame at 1200w for narrower desktops.
  hero/lujiazui-tall.jpg   a native portrait slice, 585x1263, for viewports
                           under 3/4 aspect. It is the SAME pixels
                           centre-cropped, not the wide frame stretched, so a
                           phone gets a real 1:2.16 window instead of a 1:1.44
                           picture squashed through object-fit.

Quality 86 / 4:2:0 / progressive, matching the other hero plates. No
sharpening, no colour grade: the photograph is the page.

Usage:  .venv/Scripts/python.exe archive/hero-refresh/build-hero.py
"""
import io
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "hero", "lujiazui-source.jpg")
OUT = os.path.join(ROOT, "hero")

# the tall cut's aspect. 390x844 is 1:2.164; the slice keeps a hair more width
# so object-fit: cover trims 3% instead of 10%.
TALL_RATIO = 1.0 / 2.16


def save(im, path, quality=86):
    im.save(path, "JPEG", quality=quality, optimize=True, progressive=True, subsampling=2)
    print("%-34s %sx%s  %.0f KB" % (os.path.basename(path), im.width, im.height, os.path.getsize(path) / 1024))


def main():
    src = Image.open(SRC).convert("RGB")
    print("source %sx%s" % src.size)
    w, h = src.size

    save(src, os.path.join(OUT, "lujiazui.jpg"))

    if w > 1200:
        save(src.resize((1200, round(h * 1200 / w)), Image.LANCZOS),
             os.path.join(OUT, "lujiazui-1200.jpg"))

    # centre crop, full height: the middle tower runs down the middle of this
    # photograph, so the tall window is the middle of the frame.
    tw = round(h * TALL_RATIO)
    left = (w - tw) // 2
    save(src.crop((left, 0, left + tw, h)), os.path.join(OUT, "lujiazui-tall.jpg"))


if __name__ == "__main__":
    main()
