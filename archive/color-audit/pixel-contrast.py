"""Read a contrast ratio off a real screenshot. Dev-only; the site never runs this.

The site has one rule about colour that this exists to serve: **measured, not
estimated**. Arithmetic on two hex values is fine for a solid surface - the
numbers in DESIGN.md 3.2 that describe a token pair were computed exactly that
way. It is not fine for anything that composites: glass over a photograph, a
scrim over a plate, a duotone behind white type. For those the only honest
number is the pixel that actually rendered.

  .venv/Scripts/python.exe archive/color-audit/pixel-contrast.py shot.png 162,214,1116,328
  .venv/Scripts/python.exe archive/color-audit/pixel-contrast.py shot.png x,y,w,h #EDF3F8

The rect is x,y,w,h in the screenshot's own pixels, and capture.mjs prints it
ready to paste. The default foreground is --on-dark, which is what the hero
mark, the lightbox and the footer all use.

For light type the worst case is the BRIGHTEST pixel in the box and for dark
type it is the DARKEST, so both ends are reported. Reporting only the average
is how a gradient scrim passes a review and then fails in the corner.
"""
import sys
from PIL import Image


def _lin(c):
    c /= 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def luminance(rgb):
    r, g, b = rgb
    return 0.2126 * _lin(r) + 0.7152 * _lin(g) + 0.0722 * _lin(b)


def ratio(fg, bg):
    a, b = luminance(fg), luminance(bg)
    hi, lo = max(a, b), min(a, b)
    return (hi + 0.05) / (lo + 0.05)


def hex_rgb(s):
    s = s.lstrip("#")
    return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))


def main(path, rect, fg):
    x, y, w, h = rect
    im = Image.open(path).convert("RGB")
    box = (x + 4, y + 4, x + w - 4, y + h - 4)   # 4px inset: a glyph's own
                                                 # antialiased edge is not the
                                                 # thing being measured
    band = im.crop(box)
    raw = band.tobytes()                           # RGB, three bytes a pixel
    pixels = [tuple(raw[i:i + 3]) for i in range(0, len(raw), 3)]
    if not pixels:
        print("empty region")
        return
    ranked = sorted(pixels, key=luminance)
    darkest, brightest = ranked[0], ranked[-1]
    print(f"{path}  region {x},{y},{w},{h}  n={len(pixels)}")
    print(f"  brightest {brightest}  {ratio(fg, brightest):6.2f}:1   <- worst for light type")
    print(f"  darkest  {darkest}   {ratio(fg, darkest):6.2f}:1   <- worst for dark type")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        raise SystemExit(__doc__)
    main(sys.argv[1],
         tuple(int(v) for v in sys.argv[2].split(",")),
         hex_rgb(sys.argv[3] if len(sys.argv) > 3 else "#EDF3F8"))
