# Premium Static-Site Techniques — Liquid Glass, Animation, Type/Page Detail

Research for the N1GHT CHXN9 redesign. Constraints assumed: plain HTML/CSS/vanilla JS, no build step,
no runtime CDN, local GSAP + ScrollTrigger + SplitText + Lenis, modern Chromium/Safari/Firefox,
locked light theme (titanium-silver + champagne-gold), grain retired, one shadow/radius system.

Every browser-support number below was read from caniuse / MDN / web-features-explorer during this
research. Each code recipe is either quoted from a fetched source (cited) or composed from two cited
techniques (marked **composed — verify visually**).

## Sources fetched

- https://ui.aceternity.com/components — catalogue only; component pages are client-rendered
- https://animejs.com — landing page; docs live at /documentation
- https://html-in-canvas.dev/liquid-glass-effect/ — working CSS + GLSL, honest limits
- https://theplusaddons.com/blog/liquid-glass-ui/ — specular-edge recipe, feDisplacementMap recipe
- https://developer.mozilla.org/en-US/docs/Web/CSS/mask-composite
- https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter
- https://developer.mozilla.org/en-US/docs/Web/CSS/`media/prefers-reduced-transparency
- https://gsap.com/docs/v3/Plugins/SplitText/
- https://gsap.com/docs/v3/Plugins/ScrollTrigger/
- https://gsap.com/docs/v3/GSAP/gsap.quickTo()/
- https://caniuse.com/mdn-css_properties_mask-composite
- https://caniuse.com/mdn-css_at-rules_media_prefers-reduced-transparency
- https://caniuse.com/mdn-css_properties_text-wrap_balance
- https://caniuse.com/wf-text-wrap-pretty
- https://caniuse.com/css-text-box-trim
- https://web-platform-dx.github.io/web-features-explorer/features/prefers-reduced-transparency/
- https://wiki.webkit.org/show_bug.cgi?id=245510 — WebKit: backdrop-filter url() does not work

---

## 0. Headline verdicts (read first)

1. **True refraction is not expressible in CSS.** `backdrop-filter` accepts exactly ten functions
   (`blur brightness contrast drop-shadow grayscale hue-rotate invert opacity sepia saturate`) and
   **not one displaces a pixel** (MDN, corroborated by theplusaddons). Every "Liquid Glass in pure CSS"
   tutorial delivers glassmorphism with a brighter border.
2. **`backdrop-filter: url(#svgFilter)` is Chromium-only.** WebKit Bug 245510 tracks Safari's lack of
   support; Firefox does not implement it either. Do not ship it as load-bearing.
3. **On this site refraction would be invisible anyway.** The backdrop is flat near-white paper
   (`--paper #FCFBF8`). Displacing a flat field produces no observable change. All perceived
   "premium glass" value here lives in the **edge treatments**, not displacement. This kills the most
   expensive part of the Liquid Glass rabbit hole.
4. **`prefers-reduced-transparency` is Chromium-only** (Chrome/Edge 118–119+, Opera 106+). Safari
   declined it (position: concerns: privacy; Bug 175497) and Firefox has not shipped it (Bug 1822176).
   AGENTS.md mandates it as *the* glass fallback — **that fallback does not fire on Safari or Firefox**,
   which is most of the macOS/iOS audience. A second mechanism is required.
5. **Grain is retired by the project's own brief.** The only no-CDN grain is an inline SVG data URI;
   it is cheap, but adding it contradicts the locked brand direction. Documented, not recommended.

---

## 1. Apple "Liquid Glass" in CSS — layer by layer

### 1.1 Base frosted layer — RELIABLE everywhere

`backdrop-filter` is Baseline (newly available since Sept 2024). Both fetched sources agree on shape and
differ on numbers; the values below are tuned for a **light** theme, where the published dark-theme
values read as a grey smear.

```css
.glass {
  position: relative;
  border-radius: var(--radius-lg);            /* concentric: outer = inner + padding */

  /* Light-theme tint. Keep alpha LOW: the backdrop is already near-white.
     Dark-theme references use 0.08-0.13 white; on paper that is invisible. */
  background: color-mix(in oklab, var(--paper) 72%, transparent);

  backdrop-filter: blur(18px) saturate(1.6) brightness(1.04);
  -webkit-backdrop-filter: blur(18px) saturate(1.6) brightness(1.04);

  isolation: isolate;
}
```

Source values for reference: html-in-canvas uses `rgba(255,255,255,0.08)` with
`blur(18px) saturate(1.6)`; theplusaddons uses `rgba(255,255,255,.13)` with
`blur(12px) saturate(170%)`. Both assume a dark hero.

**Caveats (verified behaviour, not speculation):**

- The element needs a transparent or partly transparent background, or the filter has nothing to show.
- **Backdrop-root trap — this one will bite.** An ancestor with `filter`, `opacity < 1`, `mask`,
  `mix-blend-mode` or a transform can establish a new backdrop root / containing block. If a GSAP
  entrance animates `opacity` or `transform` on a **wrapper around** a glass panel, the panel's
  `backdrop-filter` may sample only its own subtree and render as if unblurred. Rule: never animate
  opacity/transform on an ancestor of a glass surface. Animate the glass element itself, or the sibling
  content inside it. **Verify on device.**
- `backdrop-filter` inside a scrolling container re-reads the backdrop every frame. Keep glass off long
  scrolling strips.
- `backdrop-filter` clips to `border-radius` automatically; `overflow: hidden` is only needed for
  overflowing children.

### 1.2 Edge "lensing" / refraction illusion

Three options, honestly ranked.

**(a) SVG displacement — Chromium only. Do not ship as load-bearing.**

Quoted from html-in-canvas (`baseFrequency 0.008`, `scale 60`) and theplusaddons
(`baseFrequency "0.006 0.012"`, `numOctaves 2`, `feGaussianBlur stdDeviation 1.4`, `scale 42`,
`seed 7`). The intermediate `feGaussianBlur` is not decorative — raw turbulence produces a
broken-screen glitch; blurring the displacement map is what makes it read as glass.

```html
<svg width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute">
  <filter id="lg-lens" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.006 0.012"
                  numOctaves="2" seed="7" result="noise"/>
    <feGaussianBlur in="noise" stdDeviation="1.4" result="smooth"/>
    <feDisplacementMap in="SourceGraphic" in2="smooth" scale="42"
                       xChannelSelector="R" yChannelSelector="G"/>
  </filter>
</svg>
```

```css
/* Declare the universally-supported version FIRST so a rejected
   declaration in Safari/Firefox cannot cost you the blur. */
.glass { backdrop-filter: blur(18px) saturate(1.6); }

`supports (backdrop-filter: url(#lg-lens)) {
  .glass { backdrop-filter: blur(4px) saturate(1.6) url(#lg-lens); }
}
```

- `color-interpolation-filters="sRGB"` is reported as mandatory: in the default `linearRGB` the
  128-neutral of the turbulence map drifts and the whole backdrop shifts in brightness. Surfaced from a
  third-party liquid-glass repo via search (**unverified** — raw.githubusercontent is unreachable here —
  but free to honour).
- `@supports` is **not** a trustworthy detector here: Safari parses `url()` inside `backdrop-filter` but
  does not render it (WebKit 245510), so `@supports` can return true and you silently lose the blur.
- The displacement field is **static**. `feTurbulence` gives one fixed warp; a pointer-following lens is
  not expressible. Animating the filter `scale` per frame is a full per-pixel pass — do not.

**(b) Duplicated-background displacement — works everywhere, fragile.**
Place a copy of the background *inside* the pane, aligned with the real one, apply `filter: url(#lg-lens)`
(which **is** supported everywhere, unlike `backdrop-filter: url()`), clip with `overflow: hidden`. Only
viable over a fixed known background; desynchronises over scrolling content. **Not recommended here.**

**(c) Layered-mask lensing — cross-browser, cheap, best fit. Composed — verify visually.**
Stack two backdrop-filter layers: an inner body with heavy blur, and an edge band with a *lighter* blur
plus brightness/saturation lift, masked to a ring with `mask-composite: exclude`. Because each element's
backdrop includes previously painted siblings, the edge band samples the already-blurred body — so the
rim renders visibly sharper and brighter than the interior. That discontinuity is exactly the read of a
lens edge, using only Baseline features.

```html
<div class="glass">
  <div class="glass__body" aria-hidden="true"></div>
  <div class="glass__edge" aria-hidden="true"></div>
  <div class="glass__content">…</div>
</div>
```

```css
.glass { position: relative; border-radius: var(--radius-lg); overflow: hidden; }

/* Paint order matters: body first, edge on top. */
.glass__body,
.glass__edge { position: absolute; inset: 0; border-radius: inherit; pointer-events: none; }

.glass__body {
  backdrop-filter: blur(20px) saturate(1.55);
  -webkit-backdrop-filter: blur(20px) saturate(1.55);
}

/* Edge band = a 14px ring with a different (weaker) optical treatment. */
.glass__edge {
  padding: 14px;
  backdrop-filter: blur(3px) brightness(1.10) saturate(1.35);
  -webkit-backdrop-filter: blur(3px) brightness(1.10) saturate(1.35);

  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;      /* legacy keyword: Chrome < 120, older WebKit */
          mask-composite: exclude;  /* standard keyword */
}

.glass__content { position: relative; z-index: 1; }
```

Cost: two backdrop reads per frame per panel. Fine for a handful of static panels; do not put this on a
sticky nav that repaints during scroll alongside other compositing work.

### 1.3 The 1px specular rim — RELIABLE, highest value per line

theplusaddons calls this "the single change that most makes a panel read as glass rather than as tinted
film". Their dark-theme stack:

```css
border: 1px solid rgba(255,255,255,.30);
box-shadow:
  inset 0 1.5px 0 rgba(255,255,255,.85),   /* the specular edge */
  inset 0 -1px 0 rgba(255,255,255,.14),    /* faint bounce below */
  0 10px 30px rgba(0,0,0,.32);             /* lift off the page */
```

**Light-theme adaptation (project-correct):** white on near-white has almost no contrast, so the rim
alone reads flat. Invert the polarity — bright top bevel against a faintly *darkened* lower inner edge —
and tint the outer shadows with the ink hue instead of black, per the project's shadow rules:

```css
.glass {
  box-shadow:
    /* specular top bevel, built from the lightest sand */
    inset 0 1px 0 0 color-mix(in oklab, var(--sand-050) 92%, transparent),
    /* side bevels at half strength, so the rim reads as a curve not a box */
    inset 1px 0 0 0 color-mix(in oklab, var(--sand-050) 55%, transparent),
    inset -1px 0 0 0 color-mix(in oklab, var(--sand-050) 55%, transparent),
    /* underside: a SOFT dark implying thickness. This is what sells the bevel. */
    inset 0 -1px 0 0 oklch(0 0 0 / 0.055),
    /* faint inner bloom just under the top edge = light entering the material */
    inset 0 10px 18px -14px color-mix(in oklab, var(--sand-050) 95%, transparent),
    /* tinted, layered outer shadow — never pure black */
    0 1px 2px oklch(0 0 0 / 0.04),
    0 12px 32px -12px color-mix(in oklab, var(--ink-900) 18%, transparent);
}
```

- `inset 0 1px 0` (not `1.5px`) keeps the bevel crisp at DPR 1. `1.5px` is the dark-theme value; it is
  fine at DPR 2 but can smear at DPR 1.
- Inset shadows do not follow a `border-radius` that differs from the parent's — keep every layer's
  radius identical.
- Never combine a real `border: 1px` with the mask-composite ring in 1.4; pick one. Use the mask ring
  (it can be a gradient) and set `border: 0`.

### 1.4 Gradient hairline border via mask-composite: exclude — RELIABLE

Support (**verified**): Chrome/Edge **120+**, Safari **15.4+**, Firefox **53+**. Global ~92.9%.
For Chrome 104–119 and older WebKit add the legacy `-webkit-mask-composite: xor` keyword.

```css
.glass { position: relative; border: 0; }

.glass::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;                     /* the ring thickness */

  /* light comes from the upper-left, so the border is brightest there */
  background: linear-gradient(
    135deg,
    color-mix(in oklab, var(--sand-050) 98%, transparent) 0%,
    color-mix(in oklab, var(--sand-050) 22%, transparent) 26%,
    oklch(0 0 0 / 0.07)                                   58%,
    oklch(0 0 0 / 0.12)                                  100%
  );

  /* two mask layers: [content-box ring cut-out] XOR [full box] = the 1px frame */
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
          mask-composite: exclude;

  pointer-events: none;
}
```

Why it works: `padding: 1px` shrinks the mask's content-box by 1px on every side. Compositing the
content-box mask `exclude` the border-box mask leaves exactly the 1px frame, which the gradient fills.
`border-radius: inherit` is required or the ring squares off.

- On a light theme a pure-white hairline is invisible; the gradient above runs white → neutral dark so
  the ring is legible on both the lit and unlit sides. Keep strokes neutral low-alpha
  (`oklch(0 0 0 / …)`), per the project's colour rules.
- Paint-once and static: effectively free. Only re-rasterises on resize.
- If a parent has `overflow: hidden` with a smaller radius, the ring's outer corners clip — keep radii
  concentric.

### 1.5 Moving specular sweep — pointer-tracked

**Prefer (b).** (a) animates a paint property.

**(a) Hover sweep via background-position** — simple, but a *paint* animation, not composited. Fine on a
small button, janky on a full-width panel.

```css
.glass::after {
  content: "";
  position: absolute; inset: 0; border-radius: inherit;
  background: linear-gradient(105deg,
    transparent 38%,
    color-mix(in oklab, var(--sand-050) 45%, transparent) 47%,
    color-mix(in oklab, var(--sand-050) 85%, transparent) 50%,
    color-mix(in oklab, var(--sand-050) 45%, transparent) 53%,
    transparent 62%);
  background-size: 240% 100%;
  background-position: 190% 0;
  opacity: 0;
  transition: background-position .85s cubic-bezier(.22,.61,.36,1), opacity .2s ease-out;
  pointer-events: none;
}
.glass:hover::after,
.glass:focus-within::after { opacity: 1; background-position: -50% 0; }

`media (prefers-reduced-motion: reduce) {
  .glass::after { transition: opacity .2s ease-out; background-position: 50% 0; }
}
```

**(b) Pointer-tracked spotlight (composited)** — drive CSS custom properties from `pointermove` and let a
`radial-gradient` follow. Throttle to one write per animation frame.

```css
.spot { --mx: 50%; --my: 0%; }

.spot::after {
  content: "";
  position: absolute; inset: 0; border-radius: inherit;
  background: radial-gradient(
    240px circle at var(--mx) var(--my),
    color-mix(in oklab, var(--sand-050) 70%, transparent),
    transparent 68%);
  opacity: 0;
  transition: opacity .18s ease-out;
  pointer-events: none;
}
.spot:hover::after,
.spot:focus-within::after { opacity: .85; }

/* Static fallback: the glow must exist without motion. */
`media (prefers-reduced-motion: reduce) {
  .spot::after {
    opacity: .35;
    background: radial-gradient(240px circle at 30% 0%,
      color-mix(in oklab, var(--sand-050) 60%, transparent), transparent 68%);
  }
}
```

```js
// One rAF-throttled write per frame. No GSAP needed: a custom property is not a
// transform, so quickTo() (documented for numeric tweenable props) is the wrong tool
// here — plain setProperty is exact and cheapest.
function initSpotlight(el) {
  let queued = false, px = 0, py = 0;
  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    px = ((e.clientX - r.left) / r.width) * 100;
    py = ((e.clientY - r.top) / r.height) * 100;
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      el.style.setProperty("--mx", px.toFixed(2) + "%");
      el.style.setProperty("--my", py.toFixed(2) + "%");
      queued = false;
    });
  });
}
```

Gate behind `matchMedia('(pointer: fine)')` and the existing REDUCED check — a touch device never fires
a useful `pointermove` and the rAF loop is pure waste there.

**Project-rule conflict to respect:** a sweep/spotlight is a light effect, so it may only be the
*signature moment*, and it must have a **static visible form** (the reduced-motion block supplies one),
because animation cannot be the sole signal.

### 1.6 Fallbacks

**(a) No backdrop-filter at all** — feature-query, never UA-sniff:

```css
`supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .glass {
    background: color-mix(in oklab, var(--paper) 94%, var(--sand-200));
  }
  .glass__body, .glass__edge { display: none; }
  .glass {
    box-shadow: 0 1px 2px oklch(0 0 0 / .05),
                0 12px 32px -12px color-mix(in oklab, var(--ink-900) 16%, transparent);
  }
}
```

**(b) prefers-reduced-transparency: reduce — support verified as Chromium-only.**

| Browser | Support |
|---|---|
| Chrome / Edge | 118–119+ |
| Opera | 106+ |
| Safari / Safari iOS | **Not supported** (position: concerns: privacy; Bug 175497) |
| Firefox / Firefox Android | **Not supported** (Bug 1822176) |

Global usage ~75.4%. MDN flags it "Limited availability / Experimental".

```css
`media (prefers-reduced-transparency: reduce) {
  .glass__body, .glass__edge { display: none; }
  .glass {
    background: var(--paper);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    box-shadow: 0 1px 2px oklch(0 0 0 / .05),
                0 12px 32px -12px color-mix(in oklab, var(--ink-900) 16%, transparent);
  }
  .glass::before { opacity: .55; }   /* keep the hairline, drop the glow */
}
```

**Because Safari/Firefox never match this query, a second mechanism is required.** Recommended pair:

```css
/* 1. Broader-coverage accessibility signal. prefers-contrast has wider support than
      prefers-reduced-transparency — VERIFY the exact window before relying on it. */
`media (prefers-contrast: more) { /* …same solid rules… */ }

/* 2. Explicit opt-in/out, set by the existing JS flag layer. */
html[data-transparency="solid"] .glass { /* …same solid rules… */ }
```

```js
// matchMedia for reduced-transparency is inert on Safari/Firefox, so it is a
// progressive enhancement only — never the sole path.
if (window.matchMedia?.("(prefers-reduced-transparency: reduce)").matches) {
  document.documentElement.dataset.transparency = "solid";
}
```

This is a real gap in the current AGENTS.md requirement (glass must carry a
`prefers-reduced-transparency: reduce` solid fallback): the rule is right, but on Safari it is a no-op.
Worth raising with the user before shipping.

### 1.7 Reliability summary — glass

| Layer | Chromium | Safari | Firefox | Verdict |
|---|---|---|---|---|
| `backdrop-filter: blur/saturate/brightness` | yes | yes | yes | **Reliable** |
| `backdrop-filter: url(#svg)` displacement | yes | no (WK 245510) | no | **Risky — garnish only** |
| Specular inset rim | yes | yes | yes | **Reliable — best value** |
| `mask-composite: exclude` hairline | 120+ | 15.4+ | 53+ | **Reliable** (add `-webkit-mask-composite: xor`) |
| Layered-mask edge lensing (1.2c) | yes | yes | yes | **Composed — verify visually** |
| Pointer-tracked spotlight | yes | yes | yes | Reliable; gate on `pointer: fine` |
| `prefers-reduced-transparency` | 118+ | no | no | **Risky — Chromium only** |
| True refraction / chromatic aberration | no | no | no | **Impossible without WebGL** |

---

## 2. Animation techniques worth reimplementing with GSAP/CSS

The Aceternity catalogue was fetched and confirms these named components exist. The component *pages*
are client-rendered, so their source is **not** extractable via fetch — the sketches below are my own
GSAP/CSS implementations of each technique, **not** reproductions of Aceternity's code:

> Card Spotlight · Sticky Scroll Reveal · Infinite Moving Cards · Magnetic Button · Tracing Beam ·
> Spotlight · Comet Card · Glare Card · 3D Card Effect · Wobble Card · Focus Cards · Compare Slider ·
> Direction Aware Hover · Moving Border · Hover Border Gradient · Text Generate Effect · Flip Words ·
> Container Text Flip · Text Reveal Card · Hero Highlight · Canvas Reveal Effect · SVG Mask Effect ·
> Parallax Scroll · Macbook Scroll · Container Scroll Animation · Hero Parallax · Apple Cards Carousel ·
> Bento Grid · Layout Grid · Animated Tabs · Images Slider · Animated Testimonials · Lens · Images Badge

Anime.js was fetched at the landing page only (docs live at `/documentation`). Its value here is the
*easing catalogue* and its timeline/stagger model — all already covered by GSAP. **Nothing in Anime.js
requires adopting it**; do not add a second animation library to a no-build site.

### 2.1 Text-mask line reveals — cheap, do this

Native to the installed SplitText build. `mask: "lines"` wraps each line in an extra clipping element,
so a translate never bleeds.

```js
SplitText.create(".reveal", {
  type: "lines", mask: "lines", autoSplit: true,   // autoSplit re-splits on resize/font load
  onSplit(self) {
    return gsap.from(self.lines, {
      yPercent: 110, duration: MOTION.enter, ease: "power3.out", stagger: 0.08
    });
  }
});
```

SplitText v3.13+ adds `aria-label` to the split element and `aria-hidden` to generated line/word/char
nodes automatically — do not add your own `aria-hidden` on top. `autoSplit: true` requires the `onSplit`
form; a plain `gsap.from` will not re-run after a resize re-split.

### 2.2 Scroll-linked image reveal — cheap

`clip-path: inset()` is already on the project's approved property list (curtain equivalent).

```js
gsap.fromTo(".reveal-img",
  { clipPath: "inset(0% 0% 100% 0% round var(--radius-lg))" },
  { clipPath: "inset(0% 0% 0% 0% round var(--radius-lg))", ease: "none",
    scrollTrigger: { trigger: ".reveal-img", start: "top 85%", end: "top 40%",
                     scrub: 0.6, invalidateOnRefresh: true } });
```

Pair with a counter-scale on the inner `<img>` (`gsap.fromTo` scale 1.12 → 1, `ease: "none"`, same
trigger, `scrub: true`) or the curtain reads as a static crop. `invalidateOnRefresh: true` is mandatory
for scrub per the project's performance rules.

### 2.3 Magnetic buttons — cheap

`gsap.quickTo()` is documented exactly for this: "If you find yourself calling gsap.to() many times on
the same numeric property of the same target, like in a mousemove event, you can boost performance by
creating a quickTo() function instead."

```js
const xTo = gsap.quickTo(btn, "x", { duration: 0.4, ease: "power3" });
const yTo = gsap.quickTo(btn, "y", { duration: 0.4, ease: "power3" });
field.addEventListener("pointermove", (e) => {
  const r = field.getBoundingClientRect();
  xTo((e.clientX - (r.left + r.width  / 2)) * 0.28);
  yTo((e.clientY - (r.top  + r.height / 2)) * 0.28);
});
field.addEventListener("pointerleave", () =>
  gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: "power3.out", overwrite: true }));
```

Gate on `(pointer: fine)` and non-REDUCED. Use `power3.out` for the return: the project's rules allow
spring only for low-frequency state changes, and hover-out is high-frequency. Move the *inner* element,
never the hit target, or the target runs away from the cursor.

### 2.4 Sticky / pinned stacking cards — two routes

**Cheap route: CSS position: sticky does the pinning; GSAP only scales.** No ScrollTrigger pin, no
spacer element, no layout thrash.

```css
.stack { display: grid; gap: 24px; }
.stack-card { position: sticky; top: 12vh; }   /* each card parks under the last */
```

```js
gsap.to(".stack-card", {
  scale: 0.94, opacity: 0.72, ease: "none",
  scrollTrigger: { trigger: ".stack", start: "top top", end: "bottom bottom",
                   scrub: 0.5, invalidateOnRefresh: true }
});
```

**Controlled route: ScrollTrigger `pin: true`** when the whole section must lock. Use `pinSpacing: false`
only when the space is explicitly managed, and re-check after every `scheduleRefresh()` — pin spacers
are the usual cause of layout jump after image load.

**Do not animate `filter: blur()` on stacked full-width cards** to fake depth; it re-rasterises a large
layer every frame. `scale` + `opacity` only.

### 2.5 Spotlight-follow borders — cheap

Same machinery as 1.5(b): a `mask-composite: exclude` ring whose gradient is a
`radial-gradient(… at var(--mx) var(--my))`. The whole border effect is one custom-property write per
frame. Keep a base ring at low opacity underneath so the border exists statically — animation must not
be the only signal.

### 2.6 Marquee — cheapest (pure CSS, no JS)

Two identical tracks; animate `transform` only. The duplicate must be `aria-hidden="true"`.

```css
.marquee { display: flex; overflow: hidden; }
.marquee__track { display: flex; flex: 0 0 auto; min-width: 100%;
                  gap: var(--gap); animation: marquee 40s linear infinite; }
`keyframes marquee { to { transform: translate3d(-100%, 0, 0); } }

.marquee:hover .marquee__track,
.marquee:focus-within .marquee__track { animation-play-state: paused; }

`media (prefers-reduced-motion: reduce) {
  .marquee__track { animation: none; }
  .marquee { overflow-x: auto; }        /* content stays reachable, never only past the edge */
}
```

The brief caps this at 2 tickers total as a brand exception (taste-skill default is at most 1). Respect
the cap.

### 2.7 Number counters — cheap, but respect two rules

```js
const state = { v: 0 };
gsap.to(state, {
  v: target, duration: 1.2, ease: "power2.out", snap: { v: 1 },
  onUpdate: () => { node.textContent = Math.round(state.v).toLocaleString("en-US"); },
  scrollTrigger: { trigger: node, start: "top 90%", once: true }
});
```

Tween a plain object, not the DOM node — `textContent` is not a GSAP-tweenable property. Set
`font-variant-numeric: tabular-nums` on any changing number (project rule) or the layout jitters
mid-count. Under REDUCED, skip the tween and write the final value.

### 2.8 Staggered grid entrances — cheap

`ScrollTrigger.batch()` is the right tool: it groups elements entering in the same window into one tween.

```js
ScrollTrigger.batch(".grid-card", {
  start: "top 88%", once: true,
  onEnter: (batch) => gsap.from(batch, {
    y: 24, autoAlpha: 0, duration: MOTION.enter, ease: "power3.out",
    stagger: 0.06, overwrite: true
  })
});
```

The project's rule says ~100ms per semantic block; 60–80ms is right within a single grid row.

### 2.9 The rest — one-line sketches

| Technique | Implementation |
|---|---|
| Tracing Beam | SVG `<path>` with `stroke-dasharray` = `getTotalLength()`, tween `strokeDashoffset` under a scrubbed ScrollTrigger. |
| Compare / before-after slider | Native `<input type="range">` driving `clip-path: inset(0 calc(100% - var(--p)) 0 0)`. Keyboard-accessible for free — do not build a div drag handle. |
| Parallax Scroll / Hero Parallax | `gsap.to(layer, { yPercent: -12, ease: "none", scrollTrigger: { …, scrub: true, invalidateOnRefresh: true } })` with a different speed per layer. Parallax is removed entirely under REDUCED per project rules. |
| Macbook / Container Scroll (3D tilt) | `transform: perspective(1200px) rotateX(var(--rx))`, `--rx` scrubbed 18deg → 0deg. Only `transform` animates, so it composites. |
| Comet / Glare card | Pointer-tracked `--mx/--my/--angle` feeding a `conic-gradient` or `linear-gradient` sheen. Same rAF writer as 1.5(b). |
| Direction-aware hover | On `pointerenter` compute `Math.atan2(dy, dx)`, set `--enter-angle`, animate a `::before` overlay in from that angle with `gsap.fromTo` on `xPercent/yPercent`. |
| Flip Words / Container Text Flip | Timeline of word spans: `yPercent` out / in with a 2-element stagger, or `gsap.timeline({ repeat: -1, repeatDelay: 2 })`. Cheap — cap it and stop under REDUCED. |
| Apple Cards Carousel | CSS `scroll-snap-type: x mandatory` + `overflow-x: auto`; scroll-driven `scale` on the active slide. No JS. Add the 16–32px peek the layout rules require. |
| Bento Grid / Layout Grid | Pure CSS Grid with `grid-template-areas`; the only animation is the 2.8 entrance. Cheapest possible. |
| Animated Tabs | Already implemented (`initArchiveTabs().animateIn()`). Keep the mandatory `clearProps: "clipPath"`. |
| Focus Cards (hover dims siblings) | `.grid:has(.card:hover) .card:not(:hover) { opacity: .55 }` — zero JS, but hover-only, so pair with `:focus-within` for keyboard parity. |
| Wobble Card | Two `radial-gradient` blobs translated at different rates from pointer position, off the same rAF writer. |
| SVG Mask Effect / Canvas Reveal | `mask-image` or a radial `mask` whose position is a custom property; scrub the property, not the mask. |

---

## 3. Premium type / page-detail techniques

### 3.1 Cheap vs expensive at runtime

| Technique | Runtime cost | Verdict |
|---|---|---|
| `text-wrap: balance` / `pretty` | Layout-time, once per reflow | **Cheap — do it** |
| `text-box-trim` (optical alignment) | Layout-time | **Cheap — do it** |
| Variable-font optical sizing (`opsz`) | Zero (font does it) | **Cheap — but unavailable here, see 3.4** |
| Hairline grid overlay | Paint-once | **Cheapest — do it** |
| Gradient text | Paint-once | **Cheap** (watch contrast + forced-colors) |
| Grayscale → colour reveal | GPU filter per transition | **Cheap if scoped to thumbs**, expensive full-bleed |
| Duotone via blend modes | Compositing per changed frame | **Cheap-ish** |
| Duotone via SVG feColorMatrix | Re-runs on every re-raster | **Expensive on large images** |
| Grain/noise tile | Rasterised once, then repeated paint | Cheap **if static**; expensive if animated |
| WebGL refraction shader | Render loop + texture upload per frame | **Expensive — out of scope** |

### 3.2 Optical margin alignment — cheap, do it

`text-box-trim` / `text-box-edge` support (**verified**): Chrome **133+**, Safari **18.2+**,
Firefox **154+**. Global ~85.3%. This trims the font's leading above cap-height and below the baseline,
so a heading's visual top aligns with the box edge — the real optical-margin win.

```css
.display {
  text-box-trim: trim-both;
  text-box-edge: cap alphabetic;   /* trim to cap-height above, baseline below */
}
```

Fallback for older engines (no `@supports` needed — just a negative margin on the display block):
`margin-block-start: -0.12em`, tuned per family. Do not use `hanging-punctuation`: it is a long-standing
**Safari-only** feature that Chromium and Firefox have never shipped (**verify before relying on it**).
Hanging punctuation must be hand-placed — `margin-inline-start: -0.42ch` on a leading `<span>` wrapping
the quote glyph — or skipped.

### 3.3 text-wrap — cheap, do it

Support (**verified**): `balance` — Chrome 114+, Safari **17.5+**, Firefox 121+ (92.7% global).
`pretty` — Chrome/Edge **117+**, Safari **26.0+**, **Firefox: not supported** (87.1% global).

```css
h1, h2, h3, .card-title { text-wrap: balance; }
p, .lede, figcaption    { text-wrap: pretty; }   /* silently ignored in Firefox — safe */
```

- `balance` is capped to a small line count by Chromium (it is intended for short headings, not body
  copy). Beyond the cap it is ignored, so it degrades gracefully — do not depend on it for a long
  paragraph.
- `pretty` in Chromium mainly suppresses orphans/short final lines; Safari 26+ may differ. Treat it as a
  progressive enhancement and never let layout depend on it.

### 3.4 Variable-font optical sizing — NOT AVAILABLE in this project

`font-optical-sizing: auto` (the default) only does anything if the loaded font actually has an `opsz`
variation axis. The project's three families are:

- **Space Grotesk** variable — `wght` axis only (300–700).
- **IBM Plex Mono** — static weights.
- **Instrument Serif** — Regular + Italic.

So `font-optical-sizing` is a **no-op** here, and `font-variation-settings: "opsz" n` would do nothing.
**Verify locally with fontTools** (already in the repo toolchain) before believing this — but do not
budget design work for an optical-size axis that does not exist.

The practical substitute is a manual optical type scale: tighten `letter-spacing` and lift `font-weight`
slightly as size increases, which is what optical sizing approximates.

```css
.display-xl { font-size: clamp(3rem, 7vw, 5.5rem);      letter-spacing: -0.03em;   font-weight: 500; }
.display-md { font-size: clamp(1.75rem, 3vw, 2.5rem);   letter-spacing: -0.015em;  font-weight: 500; }
```

### 3.5 Gradient text that stays legible — cheap, but four traps

```css
.grad-text {
  background-image: linear-gradient(100deg in oklch,
    var(--gold-700) 0%, var(--gold-500) 52%, var(--ink-900) 100%);
  -webkit-background-clip: text;
          background-clip: text;
  color: transparent;
}
```

1. **Measure contrast at the lightest stop against the actual backdrop.** `--gold-300 #DDB76B` is only
   ~1.9:1 on `--paper` — it fails even the 3:1 large-text threshold. Anchor the gradient in `gold-700`
   (5.4:1 on sand-050, already measured in AGENTS.md) and `ink-900`, and use `gold-500` only as a
   mid-stop. Treat gradient text as **large-text only** (at least 28px).
2. **`forced-colors` / high-contrast mode renders it invisible** (`color: transparent` +
   background-clip is discarded). Mandatory escape hatch:

```css
`media (forced-colors: active) {
  .grad-text {
    color: CanvasText;
    background-image: none;
    -webkit-background-clip: border-box;
            background-clip: border-box;
  }
}
```

3. **Selection becomes invisible.** Set
   `::selection { background: var(--color-accent-tint); color: var(--ink-900); }` on gradient-text
   elements explicitly.
4. Interpolate `in oklch` per the project's gradient rule (gold → ink passes through a muddy middle in
   `oklab`).

### 3.6 Grayscale → colour image reveal — cheap when scoped

```css
.frame img { filter: grayscale(1) contrast(1.04); transition: filter .45s ease-out; }
.frame:hover img,
.frame:focus-within img { filter: grayscale(0) contrast(1); }
```

- `filter` is compositor-accelerated in Chromium and Safari, so the transition is cheap; the cost is the
  extra GPU layer held for every image. Apply to grid thumbnails, not to 11 full-bleed photography frames.
- **`filter` creates a containing block and a stacking context.** Any `position: fixed` descendant (the
  lightbox, the cursor badge) starts positioning against the filtered element instead of the viewport.
  This is the most likely bug from this technique — check `#lightbox` and `initCursor()` after adding it.
- Use `:focus-within` alongside `:hover` or the effect is mouse-only. Remember colour is a *reward*,
  never the only state signal.

### 3.7 Duotone — two routes

**(a) Blend modes — cheap, no SVG. Composed — verify visually.**

```css
.duotone { position: relative; background: var(--ink-900); isolation: isolate; }
.duotone img {
  display: block; width: 100%;
  filter: grayscale(1) contrast(1.15);
  mix-blend-mode: luminosity;   /* takes the image's luminance, the layer's hue */
  opacity: .92;
}
.duotone::after {           /* highlights in champagne */
  content: ""; position: absolute; inset: 0;
  background: linear-gradient(155deg, var(--gold-300), var(--gold-700));
  mix-blend-mode: screen; opacity: .38; pointer-events: none;
}
```

`isolation: isolate` is required so the blend does not reach through to the page background.
`mix-blend-mode` also makes the element a backdrop root (see the 1.1 caveat).

**(b) SVG feColorMatrix + feComponentTransfer — precise, expensive on large images.**

`filter: url(#duotone)` on a normal element **is supported in Chromium, Safari and Firefox**. The
Chromium-only limitation applies to `backdrop-filter: url()`, **not** to `filter: url()`. That
distinction is easy to get wrong and matters.

```html
<svg width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute">
  <filter id="duotone" color-interpolation-filters="sRGB">
    <feColorMatrix type="matrix" values="
      0.2126 0.7152 0.0722 0 0
      0.2126 0.7152 0.0722 0 0
      0.2126 0.7152 0.0722 0 0
      0      0      0      1 0"/>
    <feComponentTransfer>
      <feFuncR type="table" tableValues="0.114 0.984"/>
      <feFuncG type="table" tableValues="0.090 0.722"/>
      <feFuncB type="table" tableValues="0.047 0.302"/>
    </feComponentTransfer>
  </filter>
</svg>
```

The two `tableValues` per channel are the shadow and highlight endpoints (here `ink-900` → `gold-300`).
Because the SVG filter re-runs whenever the element re-rasterises, **never put this on a full-bleed hero
or anything inside a scrubbed animation.** Use it for one small signature image, or pre-bake the duotone
into the asset and ship a plain `<img>` — which is free, and what I would do.

### 3.8 Hairline grid overlay — cheapest technique in this document

```css
.grid-lines::before {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background-image:
    linear-gradient(to right,  oklch(0 0 0 / 0.055) 1px, transparent 1px),
    linear-gradient(to bottom, oklch(0 0 0 / 0.055) 1px, transparent 1px);
  background-size: var(--col, 8.333%) 100%, 100% var(--row, 96px);
  background-position: 0 0;
}
```

- Paint-once, no runtime cost, no extra DOM (a pseudo-element).
- Keep alpha at or below 0.06 on a light theme; anything stronger reads as a wireframe.
- **DPR caveat:** at fractional device pixel ratios (1.25, 1.5) a `1px` gradient line can render lighter
  or heavier than its neighbour. If the unevenness is visible, switch to absolutely-positioned `1px`
  divs, which snap to the device grid more predictably. Do not use `0.5px` — it rounds inconsistently
  across engines.
- The overlay must sit under interactive content and never intercept pointer events.

### 3.9 Grain / noise — available, but retired here

There is no no-CDN *library* worth using: grain.js and similar generate canvas noise at runtime, adding a
fetch plus a per-frame cost. The only sensible static-site implementation is one inline SVG data URI
rasterised once into a tile:

```css
.grain::after {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E");
  opacity: .12;
}
```

`stitchTiles='stitch'` is what makes the 140px tile seamless; omit it and a visible grid appears. Static
is cheap (one rasterisation, then a repeated paint). Animating it with `steps()` background jitter forces
repaints — do not.

**However, AGENTS.md explicitly retires grain** ("纹理：grain 噪点层退役，质感交给材质与光效"). Listed
for completeness only; adding it would contradict the locked brand direction.

---

## 4. Not verified / open questions

- **Aceternity component source could not be extracted.** ui.aceternity.com is client-rendered, so
  web_fetch returns only the catalogue shell. Component *names* above are confirmed from
  https://ui.aceternity.com/components; the implementations are mine, not theirs. Exact source would
  need a browser or their docs/MCP route.
- **Anime.js** — only the landing page was fetched (the site is large); documentation lives at
  `/documentation`. Nothing found changes the recommendation not to adopt it.
- The **`color-interpolation-filters="sRGB"`** gotcha came from a third-party repo summary in search
  results, not from the repo itself (raw.githubusercontent is unreachable from this environment). Cheap
  to honour, plausible, but treat as unverified.
- **Layered-mask lensing (1.2c)** is composed from two verified techniques rather than quoted from a
  source. Visual check in all three engines before committing.
- **`prefers-contrast: more`** support window was not fetched — verify before using it as the Safari-side
  fallback for reduced transparency.
- **WebKit Bug 245510 and w3c/svgwg issue 1142** were surfaced by search but the pages timed out on
  fetch. The Safari/Firefox limitation on `backdrop-filter: url()` is corroborated in plain text by
  html-in-canvas: "Chromium-only: url() filters inside backdrop-filter are not supported in Safari or
  Firefox — keep a blur-only fallback."
