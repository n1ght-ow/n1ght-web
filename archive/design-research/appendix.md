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

