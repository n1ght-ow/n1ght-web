
## Minimal-premium principles

Numbers below are measured, not estimated: they come from (a) 10 DESIGN.md records I extracted from Refero, (b) the raw per-token `prominence`/frequency data in those records, (c) live CSS custom properties from photography portfolios listed on minimal.gallery, and (d) the galleries' own taxonomies.

1. **Pick one modular ratio and hold it.** Detected ratios in real systems: **Minor Third 1.2** (Lightship base 16, 099 Supply base 16, Shade base 16), **Major Second 1.125** (Programa base 16), **Augmented Fourth 1.414** (Ingmar Coenen base 18). The ladder lands on roughly 12 / 14 / 16 / 20 / 24 / 32 / 48 / 72.
2. **Run a two-register type system, not a continuous one.** Ingmar's own don't-rule: "Never set body copy below 12px or above 36px (the type system is intentionally a two-scale system: tiny UI and monumental display)." Their gap is 13px UI vs 295px masthead — **no 40–250px intermediate exists by design**.
3. **Negative tracking that scales with size.** Lightship: `-0.03em` at ≤34px, `-0.05em` at ≥48px. Shade: `-0.01em` body → `-0.03em` display. Cosmos: `0` at 14px → `-0.05em` at 74px. Programa: a flat `-0.03em` at every size. Measured pixel values at display: 72px @ `-3.6px`, 56px @ `-0.39px`, 80px @ `-0.88px`.
4. **Positive tracking on the mono/caps register — the mirror rule.** 099 Supply runs uppercase labels from `0.02em` at 8px up to `0.18em` at 26px. Secret Garden's hero eyebrow: `clamp(0.62rem,1.45vw,0.74rem)` at `letter-spacing:0.34em`. Mobbin flips positive at small sizes: `+0.013em` at 16px, `-0.011em` at 80px.
5. **Line-height is inversely proportional to size.** Display `0.80` (Cosmos 74px) to `1.10` (Shade 72px, Programa 42px); body `1.40–1.60`. Ingmar sets a 36px Garamond paragraph at `0.94` and a 295px masthead at `0.90`.
6. **One or two weights maximum; hierarchy from size and tracking.** Programa ships only 400 and 500 and its rule is explicit: "Communicate hierarchy through weight (400 vs 500), not color or size variation." Shade: "Set Inter Display at weight 400 only… never switch to bold." Dropbox: "Don't use bold (700) or semibold (600) weights for headings." Cosmos goes further and uses **350** for hero copy — lighter than body.
7. **Never `#ffffff` as the page canvas — use a warm off-white.** Measured canvases: `#f7f5f3` (Cosmos), `#faf6ef` (Lightship), `#f7f5f2` (Dropbox), `#f8f8f2` (Websmith), `#fff9f1` (Flutterwave), `#f7eeec` (Félix Péault). Rule stated twice: "Don't use pure white (#ffffff) as a surface — cream is the canvas, white breaks the warm system."
8. **Never `#000000` for text — use a near-black ink.** Measured inks: `#131315`, `#1a1a1a`, `#171717`, `#1e1919`, `#101010`, `#1d1d1b`, `#222`. Dropbox: "Warm near-black reads softer than pure ink on cream backgrounds."
9. **Ration the accent to roughly 0.01–0.02% of painted area.** Measured from the raw prominence data: Lightship's `#fa5c40` = **0.007%** of total visual mass; Programa's `#fbff2b` = **0.020%**; Miranda's `#c03f13` = **0.001%**. Programa's rule: "Don't use #fbff2b on more than one element per viewport — its power comes from scarcity."
10. **99% achromatic is a stated target, not a vibe.** Shade: "the system is 99% achromatic by design." Measured: Ingmar's top two neutrals carry ~99.5% of prominence; Sociotype's `#000000`+`#ffffff` = 99.5%. a1.gallery's own colour taxonomy confirms the bias at scale: **White 728, Black 529, Light grey 275** sites — light neutrals dominate every hue.
11. **Accent = interactive only.** "Reserve Golden Amber for the primary CTA fill and the heart logo only." "Never use Signal Green on anything other than the status dot." A token named `primary` is insufficient — "the agent needs to know where primary belongs and where it should be avoided."
12. **A two-value radius system, applied by element class.** Websmith: 12px cards/images + 8px buttons — "these two values are the only radii in the system." Dropbox: 8px cards, 16px buttons, 9999px pills, 12px nav. Shade: 35/20/14/9/2px and nothing else. Two systems in the corpus use **0px everywhere** (thms.works, Sociotype) — but they use it *consistently*.
13. **Flat by default; if elevated, hard offset with zero blur.** **6 of the 10 systems have an empty elevation array.** Where elevation exists it is either a 1px hairline ("never use box-shadows… the color shift IS the elevation") or a hard offset: `#f1f1f1 8px 8px 0px 0px` (Shade), `rgba(29,29,27,0.2) -4px 4px 6px 0px` (Miranda). The only soft shadow in the corpus is a floating nav: `0 2px 12px rgba(0,0,0,0.06)`.
14. **Section gaps of 60–120px, with the value named in the file.** Measured `sectionGap`: 40 → 60 → 64 → 72 → 80 → 96 → 100 → 120px. Lightship and Shade both use **100px**; thms.works **120px**; Programa **96px**; Websmith **96–112px**. Programa's floor rule: "Don't compress section padding below 64px."
15. **Card padding 16–32px.** Measured `cardPadding`: 12 / 14 / 16 / 20 / 24 / 27 / 30 / 32px, clustering at **16, 24, 32**.
16. **Content width 1200–1440px — or a deliberate full-bleed with a huge container.** The dominant `pageMaxWidth` is **1200px** (7 of 10 systems), then 1280px, then 1440px for photography-led layouts. thms.works and Yinger use **no max-width at all**. Félix Péault sets `--container-width: 2560px` and computes columns off it.
17. **Generous, unequal side margins.** Programa: 1200px max-width with a **111px left margin**. Félix Péault: `--margin-side` 8px → 16px only, but on an 8 → 16 column grid with `--gap` 8px → 16px.
18. **Full-bleed images get 0 radius; framed images get 12–20px.** Lightship: "full-bleed images (100vw) with no border-radius for hero and section breaks" + "20px border-radius on all framed photographs." Ingmar: "full-bleed and unbordered — let the white canvas frame it like a gallery wall." Cosmos frames small collage tiles at 12px inside a 16px card system.
19. **Image reveal is a short opacity fade, not a fancy transition.** Measured in the wild: Gatsby image wrapper `transition:opacity .25s linear` with `will-change:opacity`; Rich Stapleton `.image img{transition:opacity .3s ease-out}`. Both also gate on a `.loaded` class rather than animating layout.
20. **1px hairlines are the *last* resort, not the default separator.** "Use whitespace as the primary separator between sections — 100px vertical gaps, no visible dividers needed." Where lines do appear they are 1px at `#d9d9d9` / `#e0e0e0` / `#ecedee` — never heavier, never tinted.
21. **Left-align everything; centre only the display headline.** Stated rule: "Do not center-align body paragraphs longer than two lines — the system is left-aligned with a centered display headline only." Ingmar's counter-example proves the point by being deliberate: "Never center-align the Garamond about paragraph — it lives right-anchored as a deliberate editorial decision."
22. **Reuse a small set of named easing constants.** Félix Péault ships exactly four: `--ease-quart: cubic-bezier(.165,.84,.44,1)`, `--ease-quart-inout: cubic-bezier(.76,0,.24,1)`, `--ease-cubic: cubic-bezier(.33,1,.68,1)`, `--ease-cubic-inout: cubic-bezier(.785,.135,.15,.86)`. Nav underline in the wild: `transform .28s cubic-bezier(.16,1,.3,1)`.
23. **Animate `opacity` and `transform` only.** Observed in every live example I pulled CSS from. Line-by-line text reveals carry a specific fix: `.line{will-change:transform;margin-bottom:-.05em;padding-bottom:.05em}` to stop descenders clipping during the reveal.
24. **Consider a fractional weight axis instead of a new font.** Mobbin's signature is fractional weights (**440, 456, 652**) that sit between Regular and Semibold — "typography doing the work of color" in a zero-chroma palette. Cosmos does the same with a single 350.
25. **No gradients, no textures, no grain, no decorative illustration.** "Never add decorative gradients, textures, or background patterns to cards or surfaces." "Do not add gradient backgrounds to sections or cards — gradients are reserved for the brand mark." Where gradients do exist they are single-purpose brand marks, not surfaces.

## Hero and one-page patterns

Structural statistics below come from the onepagelove detail pages that expose a machine-readable "Sections on this page" field (n=62 parsed); CSS numbers are quoted verbatim from fetched stylesheets.

1. **Full-viewport media hero with a locked-up centred wordmark.** `min-height:100svh; height:100dvh; display:grid; place-items:center; overflow:hidden` over an absolutely-positioned crossfade carousel (`.hero-slide{position:absolute;inset:0;opacity:0;transition:opacity 1.4s ease}`). Copy column capped at `width:min(100%,58rem)`; display type `clamp(3.6rem, 9.4vw, 8.25rem)` at `line-height:0.88`. (Secret Garden Stresa.)
2. **Two-column split hero: copy left, product visual right.** Text occupies ~40%, visual ~50%. Headline + body + one primary CTA left; a white-surface mockup on an 8px radius with a 1px hairline right. Section padding ≈96px vertical. This is the dominant SaaS pattern (Dropbox, Figma, Miro).
3. **Centred type stack with no hero image at all.** Eyebrow → 74px display headline → one-line body → two pill CTAs, all centred, with 60–140px image tiles at 12px radius floating at varied rotations around the periphery. The hero's only media is a collage, not a photograph. (Cosmos.)
4. **Typographic hero where the type IS the image.** No media above the fold: a single 88–96px sentence at `line-height:1.00`, `letter-spacing:-2.4px`, weight 700, left-aligned on cream — "the type IS the hero," with no kicker and no buttons. (Websmith Studio.)
5. **Monumental full-bleed masthead that bleeds past both viewport edges.** A 295px display wordmark at `line-height:0.9`, flush-left, no margin above or below — "it IS the page." The rule attached: this is "the only element that earns full-bleed real estate." (Ingmar Coenen.)
6. **Hero with a fixed-height composition reserving space for an interactive object.** DialKit: `min-height:100svh` with asymmetric padding `clamp(28px,4vw,70px) clamp(12px,3vw,48px) clamp(310px,32vw,430px)` — the 310–430px bottom padding is the widget's stage. H1 at `clamp(64px,8.9vw,128px)`, `letter-spacing:-.02em`, `text-wrap:balance`.
7. **Eyebrow-above-H1 is a mainstream, named pattern.** `Eyebrow Text` is its own tagged section on onepagelove (**72 examples**) and appears explicitly in real section orders. Gallery-verified eyebrow specs: `clamp(0.62rem,1.45vw,0.74rem)` at `letter-spacing:0.34em`, uppercase, with `clamp(2.8rem,9vh,5.5rem)` of gap below it.
8. **A bottom-corner scroll hint.** Also a named pattern (`Scroll Hint`, **153 tagged examples**). Measured implementation: `position:absolute; right:clamp(1rem,4vw,3rem); bottom:clamp(1.4rem,4vh,2.6rem); width:2.85rem; height:1.5rem; border:1px solid` — a small bordered box, not a bouncing chevron.
9. **Nav that sits *over* the hero rather than above it.** Anubi pins it inside the hero: `.style_heroHeader{height:88px;inset:0 0 auto;position:absolute;z-index:50}`, links at 15px / `letter-spacing:-.025em` / `min-height:44px`, animated underline `scaleX(0)→1` over `.28s cubic-bezier(.16,1,.3,1)`, and the contact item as a solid filled chip (`padding:0 18px`). A hero footer is pinned the same way at `bottom:28px`. Responsive cascade in one file: gutter 24→20→16px, header 88→76px, nav font 15→14→13px.
10. **Sticky translucent top bar on the gallery sites themselves.** Supahero: `sticky top-0 z-50`, `bg-white/80 backdrop-blur-md border-b border-[#e0e0e0] h-14`, inner `max-w-7xl`. Its hero is centred with no CTA at all: H1 ramp `text-4xl → sm:text-5xl → lg:text-[60px]`, `leading-[1.1]`, `tracking-tight`, sub capped at `max-w-md`.
11. **The measured one-pager spine.** Composite of the highest-frequency observed section orders: `Header Navigation → [Eyebrow Text] → Call-To-Action Hero → Product Mockup / Looping Demo → Bento Grid - Features → How It Works → Screenshots → Customers / Testimonial Slider → Pricing Table → FAQ Accordion → Call-To-Action Footer → Footer`. First section is nav or hero on 58% of pages (~85% open with nav and/or hero); last section is a footer or CTA-footer on **63%**.
12. **The one-page nav contract is anchor-based, and it is enforced.** onepagelove's submission gate requires: "I confirm this is a one-page website that does not link to separate about, contact, or other pages via the main navigation." Accepted: "header navigation links to the same page sections" and "projects that load up in overlays." Not accepted: "navigation linking to other pages." Off-page links (support, privacy, terms, blog) are tolerated **only from the footer**.
13. **Sections separated by colour bands or edges, not dividers.** Observed techniques: full-bleed alternating bands with the nav re-rendered at the top of each band; a torn/scalloped SVG edge between hero and content; photography-to-paper alternation with a small-caps eyebrow per section; long uninterrupted image bands with no rules at all.
14. **End on a CTA band *then* a footer — or end on an image.** 29% of curated one-pagers record `Call-To-Action Footer` as a distinct section. Two observed departures: ending on a full-bleed photograph with no footer at all, and ending on an oversized cropped wordmark as the terminal band.
15. **Long scrolling is the most-tagged feature in the whole taxonomy** — present on 20/28 pages where I captured the full feature list (71%). `Scroll Effects` is the 2nd-largest style category (**1,322 sites**). Gallery-wide tech counts: Tailwind 360, **GSAP 130**, Next.js 77, Lottie 71, Three.js 40.

## Anti-patterns

What the premium references consistently avoid — each is a stated rule or a measured absence, not an inference.

**Colour**
- A second chromatic accent. "Don't add a second accent color; the palette is monochrome + one yellow-green signal." "Do not introduce additional brand colors or saturated fills."
- Large accent fills. "Do not use Golden Amber for backgrounds, panels, or large fills." "Don't use the ember orange at large surface areas."
- Saturated CTA backgrounds in photography-led systems. Lightship: "Do not use filled buttons or saturated CTA backgrounds — the system has no primary action color."
- Cool greys on a warm canvas. "Don't mix the cream canvas with cool grays (#e5e7eb, #f3f4f6)."
- Pure `#000000` text and pure `#ffffff` page backgrounds (see principles 7–8).
- Muted grey used for body copy. "Don't use Ash Gray (#a3a3a3) for body copy — it's a 2.5:1 contrast fail on white."

**Type**
- Weight-based hierarchy. "Do not bold headlines or use weight 500+." "Don't use bold (700) or semibold (600) weights for headings."
- Loosening tracking at display sizes. "Never let letter-spacing drift to 0 or positive values." "Do not… loosen tracking at display sizes."
- Serif displays bolted onto a geometric sans system. "Don't introduce a second typeface or a serif display."
- Oversized body copy. "Do not set body text above 20px in Moderat — for larger sizes, switch to Millik."
- Loose line-height on UI type. "Never use line-height above 1.2 on Neue Haas Unica Pro."
- Centred long-form paragraphs. "Do not center-align body paragraphs longer than two lines."
- Kickers/eyebrows where the system has none. "Don't add a subtitle or eyebrow text above page headings — the 42px heading stands alone."

**Surface & shape**
- Drop shadows as elevation. "Never use box-shadows for elevation." "Don't introduce drop shadows, glow effects, or blur." "Do not use soft blurred shadows on buttons."
- Mixing radius scales. "Do not use border-radius values outside the defined scale (35/20/14/9/2px)." "Don't apply radius values other than 12px (cards/images) or 8px (buttons)."
- Pills where the system specifies a rectangle. "Don't use fully rounded (9999px) pill buttons for primary CTAs — 16px is the canonical radius."
- Gradients, textures, patterns on chrome. "Do not add gradient backgrounds to sections or cards." "Never add decorative gradients, textures, or background patterns."
- Adding soft elevation selectively to just one component.

**Layout**
- Equal-width grid columns in photo layouts. "Do not place content in equal-width grid columns — photo layouts use asymmetric, offset collage positioning."
- Arbitrary spacing values. "Don't break the 6px spacing grid with arbitrary pixel values; every gap should be a multiple of 6."
- Compressed vertical rhythm. "Don't compress section padding below 64px — the layout reads as cramped."
- Visible dividers as the default separator.

**Motion**
- Motion without a reduced-motion escape. Live sites ship `@media` / class-level kill switches: `.style_hero *{animation:none!important;transition:none!important}`.
- Hiding nav behind a multi-page IA on a one-pager. "Not accepted: Landing Pages with a navigation linking to other pages."
- Shipping a barely-modified template. "Not accepted: One Pagers built using a website template with minimal modifications."

**Caveat on this section:** the only *explicitly published* curation criteria I found are structural, not aesthetic — a1.gallery's four axes (**Design / Usability / Originality / Craft**) and onepagelove's structural gate. **Neither onepagelove nor supahero publishes a hero rubric**; supahero's entire stated criterion is "Know a website with a **stunning hero section**?" and onepagelove titles every inclusion "One Page Website Award" with no published scoring process.
