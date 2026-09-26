"""One-off: re-author the board's cell order in index.html, BY PHOTOGRAPH.

Run once. The board's content is a pure function of world position
(index = |(x + 3y) mod 21|) and the authored row 0 is centred on the board at
boot, so one cell - and only one - sits exactly on the board's centre: the one
at world x = 0, which lands at slot |(0 + 3*10) mod 21| = 10 at this width.
Measured live (output/board-slots.mjs, 1310x558 board, cell 262x175):

  world -1:  05(-36) 06(244) 07(524) 08(804) 09(1084)
  world  0:  08(-36) 09(244) 10(524) 11(804) 12(1084)   <- y 192 is the centre row
  world +1:  11(-36) 12(244) 13(524) 14(804) 15(1084)

So the lead photograph has to be at slot 10 for the board to open on the frame
the plate above it shows. (An earlier pass put it at 13, reading the middle of
the CENTRE COLUMN as the centre of the board; it is one row off, and the frame
at the centre was the pond.)

The order below is a rhythm, not a sort: the year runs from the bare branches,
through the yellows and whites and greens, with a horizon never more than two
cells away so no stretch of the board goes monochrome. The previous authored
order had twelve horizons in a row.

Figures are matched by their image path, so re-running this against a file that
has already been reordered is a no-op rather than a shuffle.
"""
import re

PATH = "index.html"

# slot -> the photograph's stem in photo/wall/. One entry per slot, 0..20.
ORDER = [
    "1779456446198",                           # 00  bare branches, the year before anything
    "1779456446218",                           # 01  the first yellow
    "SAVE_20260618_225416",                    # 02  the reindeer among the trunks
    "SAVE_20260616_234154",                    # 03  a wide field, so the row breathes
    "1779456446227",                           # 04  blossom on blue
    "SAVE_20260618_230022_1781795010861edit",  # 05  turbines, the furthest thing here
    "1779456446240",                           # 06  the buds, back to close
    "1779456446231",                           # 07  the branch reaching into the sky
    "1789470372631",                           # 08  cumulus over the ridge
    "1779456446248",                           # 09  dense white blossom
    "SAVE_20260618_225310",                    # 10  THE LEAD, on the board's own centre
    "1779456446245",                           # 11  the arc of blossom, first cell right
    "SAVE_20260618_225828",                    # 12  the pond
    "SAVE_20260616_234458",                    # 13  the cow, the one animal
    "SAVE_20260618_230059",                    # 14  the rooftops
    "SAVE_20260618_225844_1781795146234edit",  # 15  leaves against shadow
    "SAVE_20260616_234224",                    # 16  low cloud over a field
    "SAVE_20260618_225834_1781795044036edit",  # 17  the river bend
    "SAVE_20260618_230015_1781795020338edit",  # 18  the river in the forest
    "SAVE_20260616_234337",                    # 19  the grass slope
    "SAVE_20260616_234423",                    # 20  open fields, the frame left open
]

BLOCK = re.compile(
    r'<figure class="photo-frame" data-photo-index="(\d+)" data-act="(\w+)">(.*?)</figure>',
    re.S,
)
STEM = re.compile(r'photo/wall/([^."]+)\.webp')
NO = re.compile(r'(<span class="photo-frame-no mono">)(\d+)(</span>)')
ARIA = re.compile(r'(aria-label="Open frame )(\d+)(: )')


def main():
    html = open(PATH, encoding="utf-8").read()
    blocks = list(BLOCK.finditer(html))
    if len(blocks) != 21:
        raise SystemExit("expected 21 figures, found %d" % len(blocks))

    by_stem = {}
    for m in blocks:
        stem = STEM.search(m.group(3))
        if not stem:
            raise SystemExit("no photo/wall stem in one figure")
        by_stem[stem.group(1)] = m

    missing = [s for s in ORDER if s not in by_stem]
    if missing:
        raise SystemExit("these photographs are not in the markup: %r" % missing)
    if len(set(ORDER)) != 21:
        raise SystemExit("ORDER repeats a photograph")

    rebuilt = []
    for slot, stem in enumerate(ORDER):
        src = by_stem[stem]
        body = NO.sub(lambda m: m.group(1) + "%02d" % (slot + 1) + m.group(3), src.group(3))
        body = ARIA.sub(lambda m: m.group(1) + "%02d" % (slot + 1) + m.group(3), body)
        rebuilt.append(
            '<figure class="photo-frame" data-photo-index="%d" data-act="%s">%s</figure>'
            % (slot, src.group(2), body)
        )

    html = html[:blocks[0].start()] + "\n\n        ".join(rebuilt) + html[blocks[-1].end():]
    open(PATH, "w", encoding="utf-8", newline="").write(html)
    print("re-authored 21 cells; the lead sits at slot 10, the board's centre")


if __name__ == "__main__":
    main()
