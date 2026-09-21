#!/usr/bin/env python3
r"""Build the bookshelf spine subset.

The shelf was loading a 12.6 MB full CJK family to set sixteen English spines.
This cuts it down to the characters those spines can actually contain.

WHY THE SCRIPT TOUCHES vhea: the source font ships a vhea table at version
1.1, and Chrome's OTS sanitizer accepts only 1.0 - it rejects the WHOLE face
over it ("OTS parsing error: vhea: Unsupported table version: 0x10001"). The
original file was patched in place for that; fontTools would re-emit 1.1 from
the same table, so the subset has to be pinned back to 1.0 here. Both versions
share the same 36-byte layout and the vertical advances live in vmtx, so only
the version number changes.

CHARSET: read out of js/book-shelf-data.js at build time, so adding a book (or
renaming a spine) is followed by re-running this script rather than by hand.
spine + title + author, not just spine: the faces are the same object opened
and closed, and a future book with a Chinese spine should not silently fall
back to the page sans. Printable ASCII and Latin-1 ride along for the same
reason - they cost a few hundred bytes.

USAGE (fontTools is a build tool, not a runtime dependency - nothing in the
site loads it; the .venv belongs to the site and is not touched):

    python -m pip install --target %TEMP%\pytools fonttools brotli
    set PYTHONPATH=%TEMP%\pytools
    python -B archive/fonts-subset/build-subset.py

Writes fonts/KleinBlueNight-shelf.woff2 and prints what it did.
"""

import re
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

# the console on this machine defaults to GBK, and the report prints CJK
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "fonts" / "KeLaiYinLanDeYeWan.ttf"
DATA = ROOT / "js" / "book-shelf-data.js"
OUT = ROOT / "fonts" / "KleinBlueNight-shelf.woff2"

VHEA_V1_0 = 0x00010000


def shelf_charset():
    """(required, insurance): the shelf's own text, and the extra coverage."""
    src = DATA.read_text(encoding="utf-8")
    required = set()
    for field in ("spine", "title", "author"):
        for m in re.finditer(field + r':\s*"((?:[^"\\]|\\.)*)"', src):
            required.update(m.group(1))
    insurance = set(chr(c) for c in range(0x20, 0x7F))    # printable ASCII
    insurance |= set(chr(c) for c in range(0xA0, 0x100))   # Latin-1 letters
    return required, insurance - required


def main():
    required, insurance = shelf_charset()
    chars = required | insurance
    print("charset: %d characters (%d above U+2E7F) = %d shelf + %d insurance"
          % (len(chars), sum(1 for c in chars if ord(c) > 0x2E7F),
             len(required), len(insurance)))

    options = subset.Options()
    options.flavor = "woff2"
    options.glyph_names = False        # post 3.0: names are dead weight here
    options.notdef_outline = True
    options.recommended_glyphs = True
    options.layout_features = ["*"]    # kern / liga stay
    options.hinting = True             # the source has no hinting tables anyway

    font = subset.load_font(str(SRC), options)
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(text="".join(sorted(chars)))
    subsetter.subset(font)

    before = font["vhea"].tableVersion
    if before != VHEA_V1_0:
        font["vhea"].tableVersion = VHEA_V1_0
        print("vhea version 0x%08x -> 0x%08x (OTS accepts 1.0 only)"
              % (before, VHEA_V1_0))

    OUT.parent.mkdir(parents=True, exist_ok=True)
    subset.save_font(font, str(OUT), options)

    check = TTFont(str(OUT))
    cmap = check.getBestCmap()
    missing_required = sorted(c for c in required if ord(c) not in cmap)
    missing_insurance = sorted(c for c in insurance if ord(c) not in cmap)
    print("wrote %s" % OUT.relative_to(ROOT))
    print("  size      : %.1f KB (source %.1f KB)"
          % (OUT.stat().st_size / 1024, SRC.stat().st_size / 1024))
    print("  glyphs    : %d of %d"
          % (check["maxp"].numGlyphs, TTFont(str(SRC), lazy=True)["maxp"].numGlyphs))
    print("  vhea      : 0x%08x" % check["vhea"].tableVersion)
    print("  vmtx      : %s" % ("vmtx" in check))
    if missing_insurance:
        # not an error: a character the source font never had can only fall
        # back to the next family, which is what it did before the subset
        print("  not in src: %s (insurance only)"
              % " ".join("U+%04X" % ord(c) for c in missing_insurance[:12]))
    if missing_required:
        print("  MISSING   : %s" % "".join(missing_required))
        return 1
    print("  coverage  : every shelf character is in the cmap")
    return 0


if __name__ == "__main__":
    sys.exit(main())
