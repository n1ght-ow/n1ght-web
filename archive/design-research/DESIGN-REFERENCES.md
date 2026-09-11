# High-end web design references — photography/archive redesign

Scope note: everything below was fetched live. Refero style pages are Next.js pages whose DESIGN.md payload is embedded in the React flight stream; I extracted it with a balanced-brace parser (scripts in `archive/design-research/`). There is **no raw `.md` endpoint** (I probed `/style/<id>/design.md`, `.md`, `/api/style/<id>/design-md`, `/raw`, `/api/styles/<id>` — all 404); the file is copy-only in the browser UI.

## DESIGN.md anatomy

### The recurring section list (observed in all 10 extracted files)

Every DESIGN.md on Refero is the same document with the same ordered scaffold:

1. **North Star** — a one-line metaphor ("`northStar`"), an optional expanded "`northStarDetail`", and a long `description` paragraph that reads like a creative brief.
2. **Theme + industry** — `theme: light | dark | mixed`, `industry: saas | agency | design | ecommerce | media | ai | fintech | devtools`.
3. **Color tokens** — per color: `name`, `hex`, a `group` (`neutral` / `brand` / `accent`), and a **role sentence** that says where it may and may not be used.
4. **Surfaces** — levelled stack (`L0`…`L3`) with `name`, `hex`, `purpose`.
5. **Typography** — per family: `family`, `sizes`, `weight`, `lineHeight`, `letterSpacing`, `substitute` (fallback font), `fontFeatureSettings`, and a `role` paragraph.
6. **Type scale** — a role ladder (`caption → body-sm → body → subheading → heading-sm → heading → heading-lg → display`) with `size` / `lineHeight` / `letterSpacing` per step.
7. **Spacing** — `baseUnit`, a spacing token list, plus four named slots: `elementGap`, `sectionGap`, `cardPadding`, `pageMaxWidth`.
8. **Radius / shapes** — a named radius map (`buttons`, `cards`, `inputs`, `tags`, `images`, `pills` …).
9. **Elevation** — `element` → literal shadow `style` pairs (often the section is deliberately empty).
10. **Gradients** — present only when the system uses them.
11. **Components** — `name` + `role` + a long `description` with hard numbers (padding, radius, size, weight, colour).
12. **Layout** — prose describing grid, max-width, section rhythm, nav structure.
13. **Imagery** — prose describing photography treatment, icon style, what imagery is forbidden.
14. **Do's** — imperative rules, usually 5–8.
15. **Don'ts** — prohibitions, usually 5–8.
16. **Custom sections** — free-form additions such as *Typographic Philosophy*.
17. **Agent Prompt Guide** — a `Quick Color Reference` block plus numbered `Example Component Prompts` written as literal build instructions.
18. **More like this** — 4–5 sibling references with a `why` justification each.

### Rules these documents state

**On the document itself** (from the specification/template/for-agents pages):

- "The structured layer gives the agent exact values. The markdown layer gives the agent decision-making context."
- "A token named `primary` is not enough. The agent needs to know where `primary` belongs and where it should be avoided."
- "A useful DESIGN.md can include colors, typography, spacing, radii, elevation, component patterns, icons, accessibility notes, layout guidance, and usage rules."
- Template order: "Start with the product tone and design principles, then define colors, type, spacing, components, layout, motion, accessibility, and do-not-use rules."
- **Length cap:** "If the file is too long, the agent may ignore or dilute the important rules."
- **Specificity:** "Words like premium, playful, and clean need supporting rules to become useful."
- **Validation:** "A specification creates a review target… reviewers can compare the output against the file instead of debating taste from scratch."

**On colour** — every role sentence carries a permission boundary:

- "Reserve #fbff2b fill with 1px #1a1a1a border exclusively for the single primary action per screen — never use the yellow as a background for large surfaces or decorative blocks."
- "Don't use #fbff2b on more than one element per viewport — its power comes from scarcity."
- "Do not use Golden Amber for backgrounds, panels, or large fills — it loses its punch as an accent if it covers more than button-sized areas."
- "Reserve #855cf7 for the logo gradient and the active tab underline — every other accent must be the muted #dacefd lavender."
- "Do not introduce additional brand colors or saturated fills — the system is 99% achromatic by design."
- "Don't mix the cream canvas with cool grays (#e5e7eb, #f3f4f6) — stick to warm neutrals in the #eee9e2 / #f7f5f2 family."
- "Don't use Ash Gray (#a3a3a3) for body copy — it's a 2.5:1 contrast fail on white; reserve it for placeholders and inactive metadata only."

**On typography:**

- "Never set body copy below 12px or above 36px (the type system is intentionally a two-scale system: tiny UI and monumental display)."
- "Use Megazoid at 295px with line-height 0.9… it is the only element that earns full-bleed real estate."
- "Set Inter Display at weight 400 only; let size and -0.03em tracking carry hierarchy, never switch to bold."
- "Don't use bold (700) or semibold (600) weights for headings — Sharp Grotesk at 500 is the standard."
- "Do not set body text above 20px in Moderat — for larger sizes, switch to Millik."
- "Set type at -0.05em letter-spacing on anything 48px and above, -0.03em on 34px and below."
- "Keep all tracking negative — Moderat at -0.036em, Millik at -0.025em."
- "Never use line-height above 1.2 on Neue Haas Unica Pro."

**On spacing:**

- "Use 100px between major sections, 10–12px between inline elements, 24px inside cards."
- "Maintain 80–120px vertical breathing room between major layout sections."
- "Build vertical rhythm on the 6px base unit: 8px between list items, 12px for element gaps, 16px for card padding, 48-96px for section separation."
- "Don't compress section padding below 64px — the layout reads as cramped when vertical rhythm is reduced."
- "Don't break the 6px spacing grid with arbitrary pixel values; every gap should be a multiple of 6."

**On shape & elevation:**

- "Do not use border-radius values outside the defined scale (35/20/14/9/2px)."
- "Don't apply radius values other than 12px (cards/images) or 8px (buttons) — these two values define the visual softness."
- "Don't increase border-radius above 16px — the slightly squared geometry is part of the identity."
- "Don't use fully rounded (9999px) pill buttons for primary CTAs — 16px is the canonical radius."
- "Never use box-shadows for elevation — rely on the stark black/white contrast and 12px corner radius for surface separation."
- "Don't introduce drop shadows, glow effects, or blur — elevation is flat and border-defined."
- "Do not use soft blurred shadows on buttons; the signature is hard, solid, paper-cutout offsets."

**On imagery:**

- "Treat photography as full-bleed and unbordered — let the white canvas frame it like a gallery wall."
- "Let photography fill the viewport — use full-bleed images (100vw) with no border-radius for hero and section breaks."
- "Do not place content in equal-width grid columns — photo layouts use asymmetric, offset collage positioning."
- "Never add decorative gradients, textures, or background patterns to cards or surfaces."

**On layout:**

- "Do not center-align body paragraphs longer than two lines — the system is left-aligned with a centered display headline only."
- "Never center-align the Garamond about paragraph — it lives right-anchored as a deliberate editorial decision."
- "Never use a system font for body or nav."
- "Pair white (#ffffff) with cream (#f8f8f2) to create surface layering without using shadows — the color shift IS the elevation."

**How the tokens are derived (visible in the raw record).** Refero does not guess: each colour token ships with `frequency`, `prominence` (an area-weighted usage mass), `contexts` (heading/body/link/nav/card/hero/footer/icon/input/badge/image/list/button), `properties` (color/backgroundColor/borderColor/fill/stroke/boxShadow), and `usageCounts`. Typography carries the same, plus a detected **modular scale** (`base`, `ratio`, `name`, `confidence`) and per-step `frequency`. Spacing tokens are recorded as value + frequency + which CSS properties used them. That is what makes "restrained accent use" a measurable quantity rather than an opinion.


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

## Appendix A — gallery-level evidence and coverage notes

**Coverage corrections you need before acting on these URLs:**
- `https://mnmm.xyz` **no longer resolves to a minimal gallery** — it redirects cross-origin to `https://desengs.com`, which is now "DesEngs: Resources for Design Engineers… Curated by design engineers; — for design engineers," with sections *Inspiration / Minimum / DSGNRS / Newsletter*. There is no minimal-site gallery at that domain anymore.
- `https://a1.gallery` 301s to `https://www.a1.gallery`.
- `https://minimal.gallery` refuses the tool-level fetcher ("fetch failed") but serves fine over PowerShell with a normal UA — 96KB of server-rendered HTML. It is WordPress, not a JS-only shell.

**minimal.gallery** — "a curated source of website design inspiration… **Running since 2013**", founded by **Piet Therheyden** (acquired 2026). Stated curation: *"Due to the amount of submissions and to keep a high standard, **most submissions are not accepted**… **We don't accept paid website submissions.**"* Its own taxonomy counts (server-rendered, live): Portfolio 979, Personal 801, Agency 754, E-commerce 140, Startup 126, **One page 122**, Pricing 96, Branding 83, **Photography 74**, SAAS 59, Music 35, **Online Gallery 21**, **Museum & gallery 17**, **Editorial 13**, Documentary 2. Platforms: Framer 123, Readymag 22, Webflow 18. Its own shell is a single Inter webfont, a tag drawer opened with `Alt + M`, and a `Dark/Light` toggle.

**a1.gallery** — made by **Bryn Taylor**. It publishes the only explicit aesthetic rubric I found on any of these sites:
> *"Every website or template is hand-picked based on **design, build quality, creativity, and usability**. It's not a gallery to show every website — but to highlight the very best of the best."*

> **"What we look for — Design:** Strong visuals, clear hierarchy, and a cohesive look. **Usability:** Easy to navigate, clear calls to action, and a logical flow. **Originality:** A fresh idea, a distinctive layout, or a strong point of view. **Craft:** Thoughtful details, not just a good first impression."*

Its taxonomy counts are the strongest available evidence for what the minimal-premium look converges on. **Style** — Minimal 355, Big type 282, Scroll animation 274, **Photography 262**, Video 246, Typographic 229, Serif 223, Pattern 193, Dark 185, Gradients 174. **Colour** — **White 728, Black 529, Light grey 275**, Blue 188, Orange 184, Light green 159, Beige 151, Light blue 143, Yellow 119, Grey 103, Purple 101. Type: Portfolio 192, Agency 226, Landing 707, One page 58. Tech: Next.js 293, **Framer 276**, Shopify 39, Astro 22.

**Photography portfolios listed on minimal.gallery.** I pulled live CSS from three of them; these are the most directly transferable numbers in this report.

| Token | Félix Péault (`felixpeault.com`) |
|---|---|
| `--container-width` | `2560px` |
| `--columns` | `8` → `16` (desktop) |
| `--gap` | `8px` → `16px` |
| `--margin-side` | `8px` → `16px` |
| `--column` | `calc(min(100vw, var(--container-width)) / var(--columns))` |
| `--header-letter-height` | `clamp(64px, 21vw, 128px)` → `clamp(96px, 11vw, 160px)` |
| `--header-letter-height-small` | `clamp(44px, 8.5vw, 64px)` → `clamp(48px, 6vw, 72px)` |
| `--screen` | `var(--vh)`, overridden to `100dvh` |
| `--color-dark` | `#222` |
| `--color-gray` | `#f7eeec` (warm off-white canvas) |
| `--color-primary` / `--color-secondary` | `#007cba` / `#00ba82` |
| `--font-title` / `--font-text` | `"Suisse Intl Cond", helvetica, arial, sans-serif` / `"Archivo", helvetica, arial, sans-serif` |
| Easings | `--ease-quart: cubic-bezier(.165,.84,.44,1)`; `--ease-quart-inout: cubic-bezier(.76,0,.24,1)`; `--ease-cubic: cubic-bezier(.33,1,.68,1)`; `--ease-cubic-inout: cubic-bezier(.785,.135,.15,.86)` |

Additional live detail from that site's component CSS: a **9-column** info-panel grid at ≥768px; a `3fr 5fr` label/value block grid; `gap: clamp(16px, 2vw, 24px)`; `padding-block: … clamp(64px, 10vw, 120px)`; a background `linear-gradient(90deg, var(--color-secondary) 60%, var(--color-primary) 100%)`; link hover transitioning **only `font-weight` and `letter-spacing`** over `.5s var(--ease-quart)` to `font-weight:800; letter-spacing:-.02em`; and `.line{will-change:transform; margin-bottom:-.05em; padding-bottom:.05em}` on animated text lines.

**Kai Blamey** — Gatsby, single custom face `ABC Schengen A`, image reveal `.gatsby-image-wrapper [data-main-image]{opacity:0; transition:opacity .25s linear; will-change:opacity}` with `object-fit:cover` on an absolutely-positioned image.

**Rich Stapleton** — Nuxt. `.image img{opacity:0; transition:opacity .3s ease-out}` gated on a `.loaded` class; portrait images use `.image--fit img{height:100%; width:auto}` with `@media(max-width:767px){.image--fit{max-height:80svh}}` — the mobile cap that stops a portrait frame exceeding the viewport.

**Limits of this appendix:** no image analysis was performed, so visual claims are limited to what markup and CSS actually state. `minimal.gallery/about` and its tag pages returned 200 and were read; `minimal.gallery` itself needed a UA header to fetch.


## Sources

**Fetched directly (Refero Styles)**
- [Refero Styles — DESIGN.md examples library](https://styles.refero.design)
- [DESIGN.md Specification for AI Design Systems](https://styles.refero.design/design-md/design-md-specification)
- [DESIGN.md Template for AI Agents](https://styles.refero.design/design-md/design-md-template)
- [DESIGN.md for AI Agents](https://styles.refero.design/design-md/design-md-for-ai-agents)
- [DESIGN.md Examples for AI Agents](https://styles.refero.design/ai-agents/design-md-examples)
- [What Is DESIGN.md?](https://styles.refero.design/design-md/what-is-design-md)
- [Google Stitch DESIGN.md Guide](https://styles.refero.design/design-md/google-stitch-design-md)
- Discovery sitemaps: [sitemap.xml](https://styles.refero.design/sitemap.xml) → [sitemaps/styles.xml](https://styles.refero.design/sitemaps/styles.xml) (1,290 style URLs), [sitemaps/collections.xml](https://styles.refero.design/sitemaps/collections.xml)

**Individual DESIGN.md records extracted in full** — all `https://styles.refero.design/style/<id>`

| id | site | why it was chosen |
|---|---|---|
| `e549766e-b8b1-48a2-bd72-8cc04e9e4e9d` | [Shade](https://shade.inc) | hard-offset "paper cutout" elevation; explicit do/don't grid |
| `a6efcd16-dcd8-435b-9bd6-8c590589b424` | [Zellerfeld](https://zellerfeld.com) | photography-led grid; full component spec with px values |
| `f8c92b6b-a3a7-4141-ae61-3d865a106761` | [Ingmar Coenen](https://ingmarcoenen.com) | 295px masthead; binary palette; three-voice type philosophy |
| `97bbc1bd-873f-4048-b4cc-b20ea2e70097` | [Flutterwave Design](https://flutterwave.design) | warm cream canvas + one amber accent |
| `fdcd4cbb-4db6-4138-9cfd-964795f1e1d6` | [Lightship](https://lightshiprv.com) | photography-first; full-bleed hero + asymmetric mosaic |
| `11cfc460-807b-42c5-b10a-7b042c60f3e8` | [Websmith Studio](https://websmith.studio) | 96px typographic hero; pastel card tints |
| `3b46c64e-b733-4d70-8cd0-531ca1f92937` | [Threads](https://threads.net) | single-column 640px feed; 18px radius |
| `2b41e7c4-1e8c-4ea2-a87f-51e24c57886e` | [Dropbox](https://dropbox.com) | 6px base unit; cream canvas; medium-weight headings |
| `41af8353-6a8f-416d-947b-57932f591497` | [Programa](https://programa.design) | Swiss; 111px side margin; one highlighter accent |
| `e4a7b5f3-f393-4f6d-b4a5-ecf874024bed` | [099 Supply](https://099.supply) | zero-chroma museum grid; mono caps up to 0.18em |
| `973332dc-4e10-4e90-85d8-3bce9c3cd3ed` | [Sociotype](https://socio-type.com) | 251px specimens; all-zero radii; 120px section gaps |
| `3f6e3076-e77f-487e-b212-3b5946a34e87` | [Miranda](https://www.niccolomiranda.com) | broadsheet serif; hard offset card shadows |
| `eb804e3a-1b75-446c-8374-114bbabaf0cd` | [Cosmos](https://cosmos.so) | polaroid collage hero; weight-350 display |
| `1b293bed-e6fc-4880-9691-2dbf04339bd5` | [Thomas Vimare](https://thms.works) | monochrome dark; 0px radius; no buttons |
| `ef44a995-6745-4dc7-86ab-f7227f108f81` | [Mobbin](https://mobbin.com) | fractional weights 440/456/652; zero chroma |
| `a7891223-a93e-4731-a1aa-4079f1ee928b` | [Max Yinger](https://yinger.dev) | corner-anchored z-pattern; 4px gaps |

**Fetched directly (galleries and portfolios)**
- [minimal.gallery](https://minimal.gallery/) · [about](https://minimal.gallery/about/) · [submit](https://minimal.gallery/submit/) · [tag/photography](https://minimal.gallery/tag/photography/) · [tag/online-gallery](https://minimal.gallery/tag/online-gallery/) · [tag/editorial](https://minimal.gallery/tag/editorial/)
- [a1.gallery](https://www.a1.gallery) · [about](https://www.a1.gallery/about) · [submit](https://www.a1.gallery/submit)
- [mnmm.xyz](https://mnmm.xyz) → redirects to [desengs.com](https://desengs.com)
- Photography portfolios reached from minimal.gallery: [kaiblamey.com](https://kaiblamey.com/) · [richstapleton.com](https://richstapleton.com/) · [felixpeault.com](https://www.felixpeault.com/) (plus token stylesheet `/_app/immutable/assets/0.DwEff9ou.css` and `/_nuxt/entry.DWCTpwnH.css`)

**Fetched by a delegated researcher (target 3)**
- [supahero.io](https://supahero.io) · [submit](https://supahero.io/submit) · [pricing](https://supahero.io/pricing)
- [onepagelove.com](https://onepagelove.com) · [what-is-a-one-page-website](https://onepagelove.com/what-is-a-one-page-website) · [submit](https://onepagelove.com/submit) · [about](https://onepagelove.com/about) · [sections](https://onepagelove.com/sections) · [typefaces](https://onepagelove.com/typefaces) · 68 individual showcase detail pages
- Live sites reached from those galleries, with real CSS: [secretgardenstresa.com](https://secretgardenstresa.com), [anubi.io](https://anubi.io), [dialkit.dev](https://dialkit.dev), [oodos.life](https://oodos.life), [svgdoodles.com](https://svgdoodles.com), [smallbits.design](https://smallbits.design), [openscreenshot.app](https://openscreenshot.app), [rmc-studio.com](https://rmc-studio.com)

**Not fetched / unavailable** — so you know the gaps
- Every raw-markdown endpoint on Refero (`/style/<id>/design.md`, `.md`, `/api/style/<id>/design-md`, `/raw`, `/api/styles/<id>`) → **404**. The DESIGN.md is copy-only in the browser UI; extracting it required parsing the RSC flight payload.
- `onepagelove.com/guidelines` → 404; `onepagelove.com/section/call-to-action-hero` → 404; `supahero.io/about` and `/heroes` → 404.
- `github.com/fidgetcoding/refero-design-mcp` → fetch failed.
- Hero screenshots `bmw.webp` and `monolith-studio.webp` failed to download from supahero's R2 bucket.
- **Neither supahero nor onepagelove publishes a hero rubric.** onepagelove's enforceable rules are structural; supahero's entire stated criterion is *"Know a website with a stunning hero section?"*

**Reproduction artifacts** written during this research, in `archive/design-research/` (research output only — not part of the site build): `ds.ps1`, `final.ps1`, `raw.ps1`, `summ.ps1` (extractors for the React flight payload and its raw token data), and the extracted outputs `final_a.txt`–`final_d.txt`, `raw1.txt`–`raw3.txt`, `summary.txt`.

## Method note

Refero style pages are Next.js pages whose DESIGN.md payload is embedded in the React flight stream rather than in the DOM. The tool-level fetcher truncates at 100,000 characters, which cuts the payload in half, so I fetched each page with PowerShell and parsed the record with a balanced-brace scanner that respects string escapes. That yields two layers: a **curated layer** (`colors`, `typography`, `typeScale`, `spacing`, `components`, `dos`, `donts`, `layout`, `imagery`) and a **raw layer** (`colors.tokens[].prominence/frequency/contexts/properties`, `typography.scale.ratio` with a confidence score, `spacing.tokens[]` with per-property usage counts). Every ratio quoted in this report comes from the raw layer, which is why the accent-share figures are precise rather than impressionistic.
