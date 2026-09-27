# colour audit

Two scripts, dev-only. The site never loads them and nothing here is a runtime
dependency — `capture.mjs` needs Node 21+ for its global `WebSocket` and a
Chromium binary that is already on the machine, `pixel-contrast.py` needs the
Pillow already installed in `.venv`.

They exist because of one rule: **对比度实测不估算**. A token pair is arithmetic —
the numbers in DESIGN.md 3.2 for `ink-900 / paper-050` and friends were computed
exactly, and recomputing one takes a second. But anything that *composites* —
glass over a photograph, a scrim over the hero plate, a duotone behind a 190px
wordmark — has no honest number except the pixel that actually rendered. Those
are the ones that broke when the palette changed, and they are what these two
files measure.

## capture.mjs

```
node archive/color-audit/capture.mjs \
  --url file:///C:/Users/qsr/night-web/index.html \
  --w 1440 --h 900 --sel ".hero-mask" \
  --hide ".hero-wordmark,.hero-kicker,.hero-foot" \
  --out %TEMP%/hero-1440.png
```

| flag | meaning |
| --- | --- |
| `--url` | page to open; a `file:///` URL is the normal case |
| `--w` / `--h` | viewport; below 600px wide it also switches the device emulation to mobile |
| `--sel` | element whose rect to report, in screenshot pixels |
| `--hide` | comma-separated selectors set to `visibility: hidden` first |
| `--scroll` | scroll to this y before shooting |
| `--eval` | JS body to run after load and before the shot — `document.querySelector('#tab-music').click()` to open a tab, for instance |
| `--settle` | ms to wait after load (default 4500 — the page builds 534 music rows) |
| `--out` | PNG path |

It prints `{"out":…,"viewport":…,"rect":{…}}` on one line.

`--hide` is not cosmetic. The wordmark's own white glyphs are the brightest
pixels inside the wordmark's own box, so the only way to read the contrast
*behind* the type is to take the type out of the picture first. This is the
method in DESIGN.md 3.2 inference 3 and it has not changed since V2.

## pixel-contrast.py

```
.venv/Scripts/python.exe archive/color-audit/pixel-contrast.py %TEMP%/hero-1440.png 162,214,1116,328
.venv/Scripts/python.exe archive/color-audit/pixel-contrast.py %TEMP%/hero-1440.png 162,214,1116,328 #172129
```

Prints the brightest and darkest pixel in the region and the WCAG ratio of each
against the foreground (default `#EDF3F8`, the value used by the hero mark, the
lightbox and the footer). **The worst case is the brightest pixel for light type
and the darkest for dark type** — report both, never the average.

## What has to be re-measured after a colour change

| what | floor | where it is written up |
| --- | --- | --- |
| hero wordmark over the plate | 3:1 (display type) | DESIGN.md 3.2 |
| nav glass over the hero plate | 4.5:1 | DESIGN.md 4.10 |
| the three bars over paper | 4.5:1 | DESIGN.md 4.8 |
| the selected pill, the accent glass | 4.5:1 | DESIGN.md 4.6, 4.8 |

And the ones that are arithmetic, listed in DESIGN.md 3.2, are recomputed from the
token table — no script needed, but they are recomputed, not carried over.

## What this does not do

It does not check the focus ring, the keyboard path or the screen reader. Those
are two manual walk-throughs and they stay manual: a script that reports "no
outline found" has not told you the thing is reachable.
