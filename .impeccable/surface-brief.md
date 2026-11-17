# Personal photographic folio

Mode: Experience. The owner requests a complete redesign, explicitly delegates the visual direction to the main model, and asks subagents to implement it. No commit or push. Code-led execution uses the real collection as material.

## Direction contract

THESIS: A personal image folio whose content, rather than a simulated gallery building, determines the composition. A pair of original photographs makes the opening immediately browseable.

OWN-WORLD: Sage #dce5d5 at page scale, wine #5d2638 for identity and actions, paper #f9faf6 for reading, deep green #263b32 for text. Bricolage Grotesque is self-hosted; original media keeps its colour. Nearly square image edges, small control corners, visible focus.

STORY: Open a cover photograph, browse contact prints, read the collection in eight distinct media views, and arrange seven pieces into a downloadable poster. MyScore remains a compact Chinese sports tool with the same palette.

FIRST VIEWPORT: A wide wine wordmark, a short collection description, and two unequal photographic frames aligned to one set of edges. The cover is green hills beside an urban sunset; a manual control changes the pair. The photographs themselves open the viewer.

FORM: Grounded candidates: projection room, record sleeve, library catalogue, travel atlas, exhibition handlist, memory pinboard, photographic folio. Seventh candidate selected; seed 7981c0ba. The user delegates the choice to the lead designer, so this run proceeds without a separate selection round. Digital specimen informs typographic confidence; exposed binding informs a visible simple hierarchy. No borrowed decorative objects or invented collection facts.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Animated opening and closing

The owner now asks for the most visually ambitious animated hero and ending, explicitly freeing these two surfaces from the folio theme. The main model owns the design; implementation workers own bounded files. This replaces the previous two-photo cover and wine footer while the collection remains the folio described above.

THESIS: One sculptural loop seen in daylight and blue hour turns arrival and departure into two related moving compositions.

OWN-WORLD: Pearl #f5f4f0 and charcoal #24262b at the opening; saturated blue #173be5 and pearl at the close. A large twisted metal loop has silver, icy blue and restrained peach reflections. The lettering is the existing local Bricolage Grotesque. The subject is authored shader geometry, not a stock picture or a simulated interface.

STORY: Arrive at a kinetic wordmark and sculpture, enter the photographs, browse the existing collection, then return to the beginning through a full-scale typographic closing.

FIRST VIEWPORT: N1GHT / CHXN9 in two large lines at the left, an unframed sculpture occupying the right two-thirds, a direct entry, and three small working photograph prints along the bottom. Mobile gives the form its own readable space.

FORM: Code-led local WebGL artwork; one shared visibility-aware render loop for the two scenes, a single entrance sequence per surface, gentle pointer response, visible pause/resume, and a complete static reduced-motion state. No new dependency. A Canvas fallback preserves the artwork when WebGL is unavailable.

FINISH: Browser-check both surfaces at desktop and narrow widths, verify pause/reduced motion, the photo viewer and return link, inspect shader failures and offscreen work, obtain an independent finish review, and update the design and provenance records without treating prior folio QA as proof for the new surfaces.
