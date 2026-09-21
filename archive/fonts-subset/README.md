# fonts-subset

The bookshelf spine face. `build-subset.py` cuts the installed 12.6 MB CJK
family down to the characters the shelf can actually contain.

| | |
| --- | --- |
| source | `fonts/KeLaiYinLanDeYeWan.ttf`, 12,919 KB, 22,050 glyphs |
| output | `fonts/KleinBlueNight-shelf.woff2`, **46.4 KB**, 301 glyphs |
| charset | 150 characters (spine + title + author of the sixteen books) + 146 ASCII / Latin-1 for insurance |
| kept | `vmtx` / `vhea` - the spines are `writing-mode: vertical-rl`, so the vertical advances are load-bearing |

Why it exists: the face was 70% of the first load (12.9 MB) and, because of the
vhea bug below, it was also not rendering. Subsetting fixes the payload;
`css/fonts.css` documents the rest.

**Two things about this font are not obvious and both matter:**

1. **The vhea version.** The source ships `vhea` at version 1.1. Chrome's OTS
   sanitizer accepts only 1.0 and rejects the entire face over it:

       OTS parsing error: vhea: Unsupported table version: 0x10001

   The TTF in `fonts/` was patched in place for that (bytes 0-3 of the vhea
   table are 0x00010000). fontTools re-emits the version it read, so the build
   pins it again - a subset that skips that step is dead on arrival, silently,
   with every spine falling back to the page sans while the download happens
   anyway.

2. **The charset is derived, not typed.** `build-subset.py` reads
   `js/book-shelf-data.js` and collects every character of every `spine`,
   `title` and `author` field. **Adding or renaming a book means re-running
   the script** - a spine whose glyphs are missing from the subset falls back
   per character to `var(--font-sans)`, which for CJK means the system face.
   The script fails loudly if any shelf character is missing from the cmap.

Regenerate:

    python -m pip install --target %TEMP%\pytools fonttools brotli
    set PYTHONPATH=%TEMP%\pytools
    python -B archive/fonts-subset/build-subset.py

fontTools is a **build tool**. It is not a runtime dependency, and it is not
installed into `.venv` (that one belongs to the site and is not touched).
