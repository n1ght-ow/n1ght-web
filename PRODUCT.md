# N1GHT CHXN9

<!-- impeccable:product-schema 1 -->

## Platform

web

## Product Purpose

A personal collection of photographs, books, poems, paintings, sport, films, series, games and self-made apps. Visitors browse a React gallery on desktop and phone, enter an independent three-dimensional exhibition, and can open MyScore as a separate sports surface.

## Users

Inferred from the existing site: curious visitors exploring a personal collection, on desktop and phone. The owner has delegated this redesign's visual and implementation decisions.

## Capabilities and Constraints

The root is a React 19 + Vite application with nine collection views, hash routing, search and filters, photo and film lightboxes, and a Three.js home sculpture. `3d/` remains a self-contained static Three.js gallery with eight rooms. `myscore/` is a static sports page backed by an optional bounded Node relay. Catalogue media and fonts live at the repository root and are copied into the production build.

## Brand Commitments

N1GHT CHXN9 is the original name. Chinese is the primary interface language; work titles keep their original language. The current visual system is Obsidian and Champagne: architectural dark surfaces, brass accents, editorial typography and real collection media.

## Evidence on Hand

The existing index.html, js/*-data.js, photo/, hero/, posters/, covers/ and sport/ contain the real collection. Paintings images live in assets/paintings/; sources.json records their origins, rights and dimensions. Use these assets rather than inventing collection items or personal facts.

## Product Principles

MyScore is a separate Chinese sports surface at `/myscore/`, linked from the Apps section. It preserves the original gallery and uses full-width match programmes, standalone match/team reading views, source-backed statistics and broadcaster links. Browser-direct data is supplemented by an optional bounded Node service for non-CORS sources. It has no subscriptions, calendar reminders or Android installer. See `myscore/README.md` for supported sources, setup and deployment boundaries.

Let the original collection lead. Make browsing and creating enjoyable. Keep original media intact. Preserve keyboard operation and reduced-motion access. Evaluate the built page in a browser.

## Browsing Modes

The default `/` is the React collection. The independent `/3d/` night gallery presents eight collection rooms. Visitors switch through relative links and can open or refresh either URL. Three.js and the world renderer load only in `/3d/`. MyScore remains at `/myscore/`. See `BROWSING_MODES.md` for preview, project-path deployment and verification; the retired Folio/Liminal record is in `archive/`.
