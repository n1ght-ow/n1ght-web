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
