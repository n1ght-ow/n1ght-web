# Liquid Glass segmented control — plain CSS + vanilla JS recipe

Researched and **empirically verified** on Chrome 152.0.7977.83 (headless, Windows).
Anything marked **[verified]** was reproduced locally with screenshots; anything marked **[claimed]** comes
from a cited third-party source and could not be reproduced here (this machine has no Safari and no Firefox).

Artifacts in this folder:
- `demo.html` — the deliverable (self-contained, opens by double-click)
- `demo.png` / `demo-zoom.png` / `demo-solid.png` — renders of it
- lab pages used for the measurements: `test2.html`, `test3.html`, `warp.html`, `order.html`,
  `final-tune.html`, `reuse.html`, `alpha-test.html`

---

## 0. What actually works (headline finding)

**[verified]** in Chrome 152:

| probe | result |
| --- | --- |
| `CSS.supports('backdrop-filter','url("#x")')` | `true` |
| `CSS.supports('backdrop-filter','url(#x)')` | `true` |
| `CSS.supports('-webkit-backdrop-filter','url(#x) blur(4px)')` | `false` — the prefixed property refuses `url()` |
| `getComputedStyle(el).backdropFilter` for `blur(2px) url(#f) saturate(1.2)` | `blur(2px) url("#f") saturate(1.2)` (kept, normalised) |
| `CSS.supports('mask-composite','exclude')` / `('-webkit-mask-composite','xor')` | both `true` |

So **`backdrop-filter: url(#filter)` is the real mechanism, it is Chromium-only, and the SVG filter receives
`SourceGraphic` = the pixels *behind* the element** (while `SourceAlpha` = the element's own rounded-box
alpha). [verified with `alpha-test.html`]

Two structural consequences shape everything below:

1. **No per-element `feImage` is needed.** `<feImage width="100%" height="100%" preserveAspectRatio="none">`
   resolves its percentages against **the element's own filter region**, so *one* filter id declared once
   serves a 600x56 bar and a 250x44 chip identically, with the bezel stretching to fit.
   [verified with `reuse.html`: variants A/B/C reused one `<filter>` at three sizes; the fixed-pixel
   `filterUnits="userSpaceOnUse"` control (D/E) broke on the narrow box]
2. **`SourceAlpha` is the element's box, not the backdrop.** A graph built from `in="SourceAlpha"`
   (the glassfx approach) yields a *box-shaped* field — a uniform inward pinch over the whole rectangle, not
   a rim-localised lens. [verified with `alpha-test.html`: `<feColorMatrix in="SourceAlpha">` renders a
   solid white rounded box]

**Therefore the map must encode the bezel explicitly**: *gradient map (static SVG, encodes rim thickness)
→ `feDisplacementMap` → light blur*. That is the nikdelvin/shuding lineage
([nikdelvin/liquid-glass](https://github.com/nikdelvin/liquid-glass),
[shuding/liquid-glass](https://github.com/shuding/liquid-glass)) and it is what I verified end to end.

---

## A. THE SVG FILTER

### A.1 The displacement map (a nested SVG data-URL)

The map is an ordinary image: **R channel = X displacement**, **G = Y**, **`#808080` = neutral**.
`feDisplacementMap` computes `P'(x,y) = P(x + scale*(R-0.5), y + scale*(G-0.5))`.

```svg
<svg xmlns='http://www.w3.org/2000/svg' width='600' height='100' viewBox='0 0 600 100'>
  <defs>
    <!-- Y (green) = vertical displacement; #0F0 = +1, #000 = -1 -->
    <linearGradient id='Y' x1='0' x2='0' y1='10%' y2='90%'>
      <stop offset='0%'   stop-color='#0F0'/>
      <stop offset='50%'  stop-color='#808080'/>
      <stop offset='100%' stop-color='#000'/>
    </linearGradient>
    <!-- X (red) = horizontal displacement -->
    <linearGradient id='X' x1='1.2%' x2='98.8%' y1='0' y2='0'>
      <stop offset='0%'   stop-color='#F00'/>
      <stop offset='50%'  stop-color='#808080'/>
      <stop offset='100%' stop-color='#000'/>
    </linearGradient>
  </defs>

  <rect x='0' y='0' width='600' height='100' fill='#808080'/>                                <!-- neutral -->
  <rect x='0' y='0' width='600' height='100' fill='url(#Y)' style='mix-blend-mode:screen'/>  <!-- + green   -->
  <rect x='0' y='0' width='600' height='100' fill='url(#X)' style='mix-blend-mode:screen'/>  <!-- + red     -->

  <!-- "flat interior": a blurred rounded rect of EXACTLY neutral grey, punching the ramps
       back to 0.5 everywhere except a band of width ~= the blur radius around the rim -->
  <rect x='7.2' y='10' width='585.6' height='80' rx='40' ry='40'
        fill='#808080' filter='blur(5)'/>
</svg>
```

Why each piece:

- **`mix-blend-mode:screen` over a `#808080` base.** `screen(a,b)=1-(1-a)(1-b)`; each ramp is `#808080`
  in its own neutral zone, so screening the red ramp onto the grey base only writes the R channel. This is
  nikdelvin's trick (`.mix { mix-blend-mode: screen; }`) for building an RGB vector map from plain rects.
  [verified visually — map A vs map B in `test3.png`]
- **`filter='blur(5)'` on the punch-out rect = the bezel width.** The ramp survives only within ~1.5x the
  blur sigma of that rect's edge, so 5 gives a ~7px bezel on a 56px bar. Too wide (16) and the whole pill
  magnifies instead of refracting. [verified, `test3.png` variant C vs `final-tune.png`]
- **`rx` = `min(w,h)/2`** so the flat interior follows the same pill shape as the element.
- **`preserveAspectRatio='none'`** belongs on the `feImage`, not here: the 600x100 viewBox is stretched to
  the element's filter region, which is what makes one map reusable at every size.
- **Do not use `feTurbulence` for this.** [verified, `test2.html` / `alpha-test.png`] It produces a
  *uniform static noise warp across the whole surface* (the entire pill wobbles), not an edge lens. It is a
  frosted-grain tool. The widely copied snippet on
  [html-in-canvas.dev](https://html-in-canvas.dev/liquid-glass-effect/) (`feTurbulence baseFrequency="0.008"
  numOctaves="2"` + `scale="60"`) does work, but it warps the middle too. [verified]

### A.2 The filter

```html
<svg width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute">
  <defs>
    <filter id="lg-refract" x="-12%" y="-30%" width="124%" height="160%"
            color-interpolation-filters="sRGB">
      <feImage x="0" y="0" width="100%" height="100%"
               preserveAspectRatio="none"
               href="data:image/svg+xml;utf8,..."   <!-- the map above, percent-encoded -->
               result="MAP"/>
      <feDisplacementMap in="SourceGraphic" in2="MAP"
                         scale="120"
                         xChannelSelector="R" yChannelSelector="G"/>
    </filter>
  </defs>
</svg>
```

| node / attribute | what it does | what the number means |
| --- | --- | --- |
| `<filter x y width height>` | filter region, in % of the element's border box | must be **larger** than the box or displaced edge pixels clip. `-12%/-30%/124%/160%` = 12% horizontal, 30% vertical headroom (the taller margin covers the drop shadow on a 56px bar) |
| `color-interpolation-filters="sRGB"` | keeps the maths in sRGB | **mandatory.** In the default `linearRGB` the 0.5 neutral of #808080 is no longer neutral after conversion and the whole backdrop shifts and darkens. Corroborated by [sohumsuthar/liquid-glass](https://github.com/sohumsuthar/liquid-glass) ("colorInterpolationFilters=sRGB is mandatory - in linearRGB the 128-neutral drifts and the whole backdrop shifts"); used by nikdelvin and rdev |
| `<feImage width="100%" height="100%" preserveAspectRatio="none">` | rasterises the map into the filter region | percentages resolve against **the element's** region → one filter, all sizes; `none` lets the map stretch non-uniformly |
| `feDisplacementMap in="SourceGraphic"` | input = backdrop pixels | in `backdrop-filter`, `SourceGraphic` is the backdrop, not the element [verified] |
| `in2="MAP"` | the vector field | |
| `xChannelSelector="R"` `yChannelSelector="G"` | R drives X, G drives Y | every implementation I read uses R/G; B stays free |
| `scale="120"` | max displacement in px | the number you tune. **The ramp only reaches ±0.5 at the outer edge**, so effective edge displacement ≈ `scale/2` → ~60px of inward pull on a 56px bar. [verified, `final-tune.png`: 80 = subtle, 130 = clearly lensed, 200 = carnival mirror] |

### A.3 Optional chromatic dispersion (3-pass graph)

From [glassfx `src/index.js`](https://github.com/SquareMediaGroup/glassfx): displace three times at
staggered scales, keep one channel from each, recombine with `screen`.

```svg
<feDisplacementMap in="SourceGraphic" in2="MAP" scale="136" xChannelSelector="R" yChannelSelector="G" result="dR"/>
<feColorMatrix in="dR" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="oR"/>
<feDisplacementMap in="SourceGraphic" in2="MAP" scale="120" xChannelSelector="R" yChannelSelector="G" result="dG"/>
<feColorMatrix in="dG" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="oG"/>
<feDisplacementMap in="SourceGraphic" in2="MAP" scale="104" xChannelSelector="R" yChannelSelector="G" result="dB"/>
<feColorMatrix in="dB" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="oB"/>
<feBlend in="oR" in2="oG" mode="screen" result="rg"/>
<feBlend in="rg" in2="oB" mode="screen"/>
```

I verified the graph renders (variant L4 in `lab.png`) but **not** that the fringe is visible at UI scale.
Two independent sources warn about cost: sohumsuthar ("the 3-pass graph can stall Chrome's compositor with
many elements (measured: 5 froze capture, 1 was fine)") and glassfx (drops refraction entirely under 768px).
**Ship it off by default.** [rdev/liquid-glass-react](https://github.com/rdev/liquid-glass-react) uses the
same three-pass shape (three `feDisplacementMap` nodes with staggered scales and
`xChannelSelector="R" yChannelSelector="B"`).

### A.4 Gotchas

1. **`color-interpolation-filters="sRGB"` or colours drift** (sohumsuthar README; used by nikdelvin, rdev).
2. **`feImage` percentage subregions resolve against the host SVG, not the filter region** — glassfx's own
   source comment says it builds its map from `SourceAlpha` primitives precisely to avoid `feImage`: *"no
   feImage — Chromium resolves feImage percentage subregions against the host SVG, not the filter region"*.
   [verified that percentages inside a `backdrop-filter` *do* track the element: `reuse.html`]
3. **rdev disables the lens on Firefox at runtime** (`filter: isFirefox ? null : url(#id)`) and applies the
   warp as the `filter` property on a child overlay rather than as `backdrop-filter` — a different
   architecture, see B.3.
4. **Blur before displacement erases the bend; heavy blur after it also erases it.** [verified, `order.html`]
   `url() blur(20px)` looked identical to `blur(20px)` alone. `url() blur(5px)` still reads as glass.
   Keep the post-lens blur ≤ 6px.
5. **`numOctaves` on `feTurbulence`** costs a full noise octave per unit and is invisible below
   `baseFrequency ≈ 0.01`; 2 is plenty. **`seed`** only makes the noise reproducible.
6. `filterUnits="userSpaceOnUse"` + fixed-px `feImage` = a filter that only works at one element size.
   Avoid unless you emit one filter per element in JS (exactly what nikdelvin's `getDisplacementFilter()`
   does — it returns a fresh data-URL filter per component instance).

---

## B. THE CSS

### B.1 The track

```css
.lg-track{
  position:relative;
  display:flex; align-items:center; gap:2px;
  height:56px; padding:5px; border-radius:999px;
  isolation:isolate;

  background:
    linear-gradient(180deg,
      rgba(255,255,255,.10) 0%,
      rgba(255,255,255,.030) 38%,
      rgba(255,255,255,.018) 62%,
      rgba(255,255,255,.070) 100%),
    rgba(16,16,20,.44);

  /* ORDER MATTERS — see B.2 */
  -webkit-backdrop-filter: blur(14px) saturate(1.8) brightness(.94);
  backdrop-filter:         blur(14px) saturate(1.8) brightness(.94);

  box-shadow:
    inset 0 1px 1px rgba(255,255,255,.85),   /* bright specular rim, top       */
    inset 0 2px 7px  rgba(255,255,255,.30),  /* its bloom into the glass       */
    inset 0 -1px 1px rgba(255,255,255,.42),  /* secondary rim, bottom          */
    inset 0 -7px 16px rgba(255,255,255,.07), /* bottom inner bounce            */
    inset 0 0 0 1px  rgba(255,255,255,.06),  /* faint full outline             */
    0 18px 44px rgba(0,0,0,.55),             /* elevation — the dark-bg shadow */
    0 4px 12px  rgba(0,0,0,.38);             /* contact shadow                 */
}
```

The specular rim is **four stacked inset shadows, not a border**: a hard 1px white line on top, a soft white
bloom under it, a dimmer 1px line at the bottom (light bouncing inside the glass) and a wide faint bottom
glow. Compare [glassfx `glass.css`](https://github.com/SquareMediaGroup/glassfx) (four inset shadows at
.45/.15/.15/.1) and the [kube.io article](https://kube.io/blog/liquid-glass-css-svg/), whose hero bakes a
**separate specular map PNG** into the filter graph (`feImage href="specular-map.png"` →
`feComposite operator="in"` → `feFuncA slope="0.2"` → `feBlend`). Both are legitimate; the inset-shadow
version needs no extra asset.

On dark backgrounds the outer shadow carries the whole sense of elevation: use two shadows (a wide soft one
plus a tight contact one), never a single blur.

### B.2 Applying the filter — ordering

```css
/* 1. unconditional frosted fallback. Declared FIRST, so an engine that cannot
      render url() inside backdrop-filter still gets real glass.            */
.lg-track{
  -webkit-backdrop-filter: blur(14px) saturate(1.8) brightness(.94);
  backdrop-filter:         blur(14px) saturate(1.8) brightness(.94);
}

/* 2. Chromium-only enhancement, declared later so it wins the cascade.     */
@supports (backdrop-filter: url("#lg-refract")){
  .lg-track{
    backdrop-filter: url(#lg-refract) blur(5px) saturate(1.8) brightness(.94);
  }
}
```

- **`url()` goes first inside the function list** — backdrop-filter functions apply in order and the lens must
  see the crisp backdrop. [verified, `order.html` V1 vs V3 vs V4]
- **Never put `url()` under `-webkit-backdrop-filter`.** [verified] `CSS.supports('-webkit-backdrop-filter',
  'url(#x) blur(4px)')` is `false` in Chrome, and Safari — the only reason the prefix exists — cannot render
  it. glassfx states it outright: *"-webkit- is intentionally NOT given the url() (Safari can't render it and
  would drop the whole filter)"*.
- **The ```supports` guard is safe in Chromium and false elsewhere** [verified true in Chrome 152; claimed
  false in Safari/Firefox]. This is exactly the project's "模糊声明永远写在 SVG 折射增强之前" rule, and it is the
  shape that stops Safari silently losing the blur along with the refraction.
- **Quote the url inside `supports`**: `url("#id")`. Both forms parse in Chrome [verified]; quoting is the
  unambiguous one.

### B.3 The other architecture (for completeness)

rdev's [liquid-glass-react](https://github.com/rdev/liquid-glass-react) does **not** warp via
`backdrop-filter: url()`. It stacks two properties on a child overlay: the warp as a normal
`filter: url(#id)` (skipped when the UA string says Firefox) and the frost as
`backdrop-filter: blur(..) saturate(..%)`. A plain `filter: url()` has broader support than
`backdrop-filter: url()`, but `filter` establishes a containing block and a new backdrop root, so nothing
inside that overlay can itself use `backdrop-filter` against the page. I rendered this shape
(`test.html` V4): it works, but the child's backdrop sampling happens inside the parent's isolated group,
which is fragile in nested layouts. Prefer the `backdrop-filter: url()` form — fewer moving parts, no extra
DOM, one `supports` to degrade.

### B.4 Hairline gradient border via `mask-composite`

```css
.lg-track::before{
  content:""; position:absolute; inset:0; z-index:4;
  border-radius:inherit; padding:1px; pointer-events:none;
  background:linear-gradient(180deg,
    rgba(255,255,255,.95) 0%,
    rgba(255,255,255,.42) 18%,
    rgba(255,255,255,.10) 46%,
    rgba(255,255,255,.16) 62%,
    rgba(255,255,255,.62) 100%);
  -webkit-mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite:xor;    /* Safari + older Blink */
          mask-composite:exclude;/* Chrome 120+ / Firefox */
}
```

`padding:1px` plus the `content-box` mask leaves only the 1px ring painted; `exclude`/`xor` subtracts
the content-box copy from the full copy. [verified: both `CSS.supports` forms true in Chrome 152] The same
technique and property pair appear in glassfx `.glass::before` and in rdev's border layer
(`WebkitMaskComposite:"xor"`, `maskComposite:"exclude"`, `mixBlendMode:"screen"`, `opacity:0.2`). Keep
the ring **asymmetric** (bright top, dim sides, medium bottom) — that asymmetry is what makes it read as a lit
edge rather than an outline.

### B.5 Fallbacks — four layers

```css
/* (a) no backdrop-filter at all */
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))){
  .lg-track{ background:linear-gradient(180deg,#2a2a31,#141419) }
}
/* (b) OS-level transparency reduction (the MQ itself is Chromium-only) */
@media (prefers-reduced-transparency: reduce){
  .lg-track{ -webkit-backdrop-filter:none; backdrop-filter:none;
             background:linear-gradient(180deg,#2b2b33,#15151a) }
}
@media (prefers-contrast: more){ /* near-solid + a hard 1px ring */ }
/* (c) explicit switch */
html[data-transparency="solid"] .lg-track{ backdrop-filter:none; ... }
/* (d) motion */
@media (prefers-reduced-motion: reduce){ .lg-pill,.lg-btn{ transition:none } }
```

**Legibility, measured by eye:** my first build put white labels on a washed-out pale bar over a bright sky
with almost no separation. The fix was three coordinated changes, not one — body alpha `.34 → .44` on a dark
tint, the top white gradient overlay cut from `.16 → .10`, `brightness(1.04) → brightness(.90)`, plus a
two-part text-shadow `0 1px 3px rgba(0,0,0,.8), 0 0 14px rgba(0,0,0,.45)`. [verified, before/after renders]
On a light backdrop you must **darken the glass body**, not just blur it.

---

## C. THE SELECTED PILL

- **Solid, not glass.** Near-opaque white gradient `linear-gradient(180deg,#ffffff,#f4f4f6 55%,#e6e6ea)` with
  its own tight shadow stack (`inset 0 1px 0 #fff`, `0 1px 1px rgba(0,0,0,.16)`,
  `0 6px 16px rgba(0,0,0,.30)`, `0 0 0 .5px rgba(0,0,0,.10)`). It is the one opaque thing in the component,
  which is exactly what makes the selection pop. A translucent indicator disappears over a busy backdrop.
- **It is a real child of the track**, absolutely positioned with `top/bottom: 5px` so it is inset from the
  glass edge, at a z-index between the glass surface and the labels.
- **Sized from the label, not from a slot:** `pill.style.width = btn.getBoundingClientRect().width + 'px'`.
  Segments are content-sized (`padding:0 20px`, `flex:0 0 auto`), so "Books" and "Favourites" get
  different-width pills. [verified, `demo-sel5.png` with the last item selected]
- **Movement:** `transform: translateX(...)` only (never `left`), with
  `transition: transform .42s cubic-bezier(.32,.72,0,1), width .42s cubic-bezier(.32,.72,0,1)` — a plain
  ease-out with no overshoot.
- **Re-measure on** `ResizeObserver` (track), `window.resize`, and `document.fonts.ready` (a webfont swap
  changes every label width). On non-animated paths set `pill.style.transition='none'`, force layout with
  `void pill.offsetWidth`, then restore — otherwise the pill visibly slides on first paint.
- **A11y:** `role="tablist"`/`role="tab"` + `aria-selected` + roving `tabindex` (0 selected, -1 the
  rest), `ArrowLeft/Right/Home/End` with automatic activation, `:focus-visible` ring at
  `outline-offset:3px`, reduced-motion swaps instantly.
- **The selected label flips to `#101010` and drops its text-shadow** — the pill is opaque, so the
  legibility shadow would only muddy it.

---

## D. SUPPORT MATRIX

| | Chrome 152 (verified here) | Safari | Firefox |
| --- | --- | --- | --- |
| `backdrop-filter: blur()` | yes | yes (`-webkit-` from 9, unprefixed 18) | yes (103+) |
| `backdrop-filter: url(#svg)` | **yes — verified**: parses, survives `getComputedStyle`, backdrop visibly warps | no [claimed] | no [claimed] |
| ```supports (backdrop-filter: url("#x"))` | `true` (verified) | `false` [claimed] — the guard is reliable | `false` [claimed] |
| `-webkit-backdrop-filter: url()` | `false` (verified) | no | no |
| `mask-composite:exclude` / `-webkit-mask-composite:xor` | both true (verified) | `-webkit-` form | `exclude` |
| `prefers-reduced-transparency` | MQ parses, evaluates `false` by default (verified) | no | no |

Citations for the "no" cells — I could not run Safari or Firefox on this machine (neither is installed):
- [html-in-canvas.dev](https://html-in-canvas.dev/liquid-glass-effect/): *"url() filters in backdrop-filter are Chromium-only. Safari and Firefox ignore the displacement and fall back to plain blur, so design for the blur-only case."*
- [kube.io](https://kube.io/blog/liquid-glass-css-svg/): *"The interactive demo at the end currently works in Chrome only (due to SVG filters as backdrop-filter)."*
- [glassfx README](https://github.com/SquareMediaGroup/glassfx): *"Refraction (backdrop-filter: url()) is currently Chromium-only."*
- [WebKit Bug 245510](https://bugs.webkit.org/show_bug.cgi?id=245510): *"backdrop-filter: url(#some-svg-filter) doesn't work with SVG filters like feDisplacementMap"* (title verified; the body needs Bugzilla login).
- [nikdelvin/liquid-glass](https://github.com/nikdelvin/liquid-glass) ships a runtime probe
  (`el.style.cssText = 'backdrop-filter: url(#test)'` then compares `el.style.backdropFilter`) and swaps to
  a blurred background-image fallback.

**Fallback story:** frosted glass everywhere, a lens in Chromium. Make the blur-only case look good on its
own; treat the lens as the enhancement. Because the lens is the *only* thing behind the `supports` gate,
nothing else needs a variant.

---

## E. COMPLETE MINIMAL EXAMPLE

**`archive/liquid-glass/demo.html`** — self-contained, opens by double-click, no build, no CDN, no external
asset (the photo is optional: `onerror` removes it and a CSS radial-gradient colour field takes over).

```
body
├─ .lg-bg          fixed colour field (5 radial-gradients)
├─ img.lg-photo    optional local photo, object-fit:cover
├─ .lg-scrim       fixed darkening gradient
├─ .lg-stage
│   ├─ .lg-track            role=tablist, 6 buttons, the LENSED glass pill
│   │    ├─ span.lg-pill    the solid selected indicator
│   │    └─ 6x button.lg-btn
│   ├─ .lg-track.lg-chip    a second, smaller group reusing the SAME filter id
│   └─ button#toggle-transparency
└─ svg[width=0]    <filter id="lg-refract"> — feImage + feDisplacementMap
```

- The map is a `data:image/svg+xml;utf8,` URL, percent-encoded, inlined in the `feImage href`.
- One filter id serves both the 6-item bar and the 3-item chip — proof of the percentage-resolution behaviour.
- JS is ~60 lines of plain vanilla: place/select/wire, `ResizeObserver`, ARIA APG keyboard, reduced-motion
  check, fallback toggle.
- Verified renders: `demo.png` (1280x640), `demo-zoom.png` (2.4x DPR — rim and lensed cloud edge),
  `demo-solid.png` (the `data-transparency="solid"` path).

**The lens is real, not a blur.** `warp.html` places the same pill over 18px black/white stripes: with
`blur(14px)` alone the stripes are simply averaged away; with `url(#lg-refract) blur(5px)` the stripe
spacing visibly **compresses toward the two rounded ends and splays across the middle** — a lens profile.
[verified, `warp2.png`]

---

## Recommendation for this project

1. The component maps onto `initArchiveTabs()`'s tab bar, but **do not** put the glass in the archive panel:
   AGENTS.md forbids glass in horizontal scrollers and the archive tab bar wraps at ≤720px. Use the recipe for
   the **nav** and for a future floating overlay instead.
2. Keep the plain blur unconditional and the `url()` variant inside `supports` — that is the
   "模糊声明永远写在 SVG 折射增强之前" rule, and it is what stops Safari silently losing the blur.
3. Budget: one `<svg>` + one `<filter>` per page, ~12 lines of CSS for the rim, ~60 lines of JS.
   No new dependency, no build step, nothing to vendor.
4. Keep the post-lens `--lg-blur` at ≤6px and the map's punch-out `blur()` at ~5, or you have paid for a
   lens nobody can see.