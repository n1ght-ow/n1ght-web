"""Hero plate generation. Dev-only; the site never runs this.

The source is the owner's own photograph (a looking-up frame of the Lujiazui
towers). Six files come out of it: the three full-colour cuts the page used
until the palette was rebuilt, and the three duotone cuts it uses now.

  hero/lujiazui.jpg        the whole frame, 1440x999. The delivered file is
                           already 1440px wide, so nothing here is upscaled
                           and nothing is invented.
  hero/lujiazui-1200.jpg   the same frame at 1200w for narrower desktops.
  hero/lujiazui-tall.jpg   a native portrait slice, 462x999, for viewports
                           under 3/4 aspect. It is the SAME pixels
                           centre-cropped, not the wide frame stretched, so a
                           phone gets a real 1:2.16 window instead of a 1:1.44
                           picture squashed through object-fit.

  hero/lujiazui-duo*.jpg   the same three cuts with the plate's LUMINANCE
                           mapped onto the palette's blue ramp. index.html
                           loads these, not the full-colour pair above, which
                           stay in the repo the way hero/nebula*.jpg does.

Why the grade is baked here and not written as a CSS filter: the plate is the
one image the interface is allowed to recolour, and a `filter` on it would be
the first runtime filter on the site. Grading offline also means the browser
gets one plain JPEG, no extra composite, and the ramp is reproducible.

Quality 86 / 4:2:0 / progressive for the colour cuts, 88 for the duo (the
duotone has no chroma noise to hide, and it is the one that ships). No
sharpening, no colour grade beyond what each family above states.

Usage:  .venv/Scripts/python.exe archive/hero-refresh/build-hero.py
"""
import os
from PIL import Image, ImageEnhance, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "hero", "lujiazui-source.jpg")
OUT = os.path.join(ROOT, "hero")

# the tall cut's aspect. 390x844 is 1:2.164; the slice keeps a hair more width
# so object-fit: cover trims 3% instead of 10%.
TALL_RATIO = 1.0 / 2.16

# The duotone ramp. Five stops, interpolated in sRGB, keyed on the source's
# grayscale. Both ends are deliberate:
#   - the floor is --sky-900, the same value .hero paints behind the plate, so
#     the letterbox object-fit: cover exposes on a phone is invisible;
#   - the ceiling is sky-400, NOT white. A highlight that reaches paper-white
#     leaves the 190px wordmark nothing to stand on - no scrim thick enough to
#     fix it also flattens the picture. Measured on this plate with the scrim
#     in css/style.css section 7, the worst pixel behind the mark is 4.10:1
#     with the ceiling where it is.
# The middle stops are the ramp's own colours, not CSS tokens: nothing on the
# page paints them, and DESIGN.md 1.1 wants primitives to earn their place.
DUO_RAMP = [
    (0.00, (0x08, 0x16, 0x26)),   # --sky-900
    (0.34, (0x0E, 0x2E, 0x46)),
    (0.62, (0x18, 0x58, 0x7E)),
    (0.86, (0x30, 0x8A, 0xB6)),
    (1.00, (0x6E, 0xC4, 0xE6)),   # sky-400, held short of white
]
DUO_CONTRAST = 1.18
DUO_LIFT = 0.98


def save(im, path, quality=86):
    im.save(path, "JPEG", quality=quality, optimize=True, progressive=True, subsampling=2)
    print("%-34s %sx%s  %.0f KB" % (os.path.basename(path), im.width, im.height, os.path.getsize(path) / 1024))


def ramp_lut(stops, size=256):
    """A 768-entry lookup for Image.point(), which reads it as three blocks of
    256 - all reds, then all greens, then all blues. Interpolating per channel
    keeps the ramp a straight sRGB lerp between the stops."""
    channels = [[], [], []]
    for i in range(size):
        t = i / (size - 1)
        for j in range(len(stops) - 1):
            t0, c0 = stops[j]
            t1, c1 = stops[j + 1]
            if t0 <= t <= t1:
                k = (t - t0) / (t1 - t0) if t1 != t0 else 0.0
                for ch in range(3):
                    channels[ch].append(int(round(c0[ch] + (c1[ch] - c0[ch]) * k)))
                break
        else:
            for ch in range(3):
                channels[ch].append(stops[-1][1][ch])
    return channels[0] + channels[1] + channels[2]


def duotone(im):
    g = ImageOps.grayscale(im)
    g = ImageEnhance.Contrast(g).enhance(DUO_CONTRAST)
    g = g.point(lambda v: min(255, int(v * DUO_LIFT)))
    return Image.merge("RGB", (g, g, g)).point(ramp_lut(DUO_RAMP))


def main():
    src = Image.open(SRC).convert("RGB")
    print("source %sx%s" % src.size)
    w, h = src.size

    # the tall cut, off the same frame: the middle tower runs down the middle
    # of this photograph, so the tall window is the middle of the frame.
    tw = round(h * TALL_RATIO)
    left = (w - tw) // 2
    tall = src.crop((left, 0, left + tw, h))
    tall_duo = duotone(tall)

    print("full colour (kept, not loaded by the page)")
    save(src, os.path.join(OUT, "lujiazui.jpg"))
    if w > 1200:
        save(src.resize((1200, round(h * 1200 / w)), Image.LANCZOS),
             os.path.join(OUT, "lujiazui-1200.jpg"))
    save(tall, os.path.join(OUT, "lujiazui-tall.jpg"))

    print("duotone (this is what the page loads)")
    duo = duotone(src)
    save(duo, os.path.join(OUT, "lujiazui-duo.jpg"), quality=88)
    if w > 1200:
        save(duo.resize((1200, round(h * 1200 / w)), Image.LANCZOS),
             os.path.join(OUT, "lujiazui-duo-1200.jpg"), quality=88)
    save(tall_duo, os.path.join(OUT, "lujiazui-duo-tall.jpg"), quality=88)


if __name__ == "__main__":
    main()

