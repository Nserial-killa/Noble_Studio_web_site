# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Noble Studio is a single-page static website (portfolio/landing page) for a digital design and web development studio based in Costa Rica. The entire site lives in one file: `index.html`.

## Development

No build system or package manager. To preview locally:

```bash
python3 -m http.server 8080
# Then open http://localhost:8080
```

Or use VS Code's Live Server extension for auto-reload on save.

## Architecture

Everything is in `index.html` — HTML structure, inline `<style>` block, and two `<script>` blocks (one in `<head>`, one near the bottom). There are no separate CSS or JS files.

**External dependencies** (CDN only, no local installs):
- Tailwind CSS — all layout and utility classes, configured inline via `tailwind.config` in `<head>`; custom colors: `gold-deep` (#A67C00), `gold` (#C9A227), `gold-light` (#F3E7C3), `gold-ink` (#8A6500), plus `ivory` (#FAF8F3), `ink` (#1A1A1A), `warmgray` (#5C5A55); custom `fontFamily`: `sans` → DM Sans, `display` → Cormorant Garamond; also extends `keyframes`/`animation` with `logo-cloud` (30s linear infinite `translateX`), which drives the tech-logo marquee in `#tecnologias`
- Google Fonts — Cormorant Garamond (600/700, headings via `font-display`) + DM Sans (400/500/700, body/UI via `font-sans`), loaded with `<link>` tags in `<head>` next to the Font Awesome stylesheet
- Font Awesome 6.5.1 — icons (WhatsApp, LinkedIn, GitHub, arrows, etc.)
- Embla Carousel 8 (vanilla UMD from jsDelivr, pinned only to major `@8` so minor/patch updates arrive unannounced; loaded near the closing `</body>`) — powers the `#projects` carousel; the init code checks `window.EmblaCarousel` exists before wiring anything up, so a CDN failure degrades silently instead of throwing
- Embla Carousel Autoplay 8 (vanilla UMD, official plugin, loaded right after the core script) — drives the `#projects` carousel's autoplay/progress bar; guarded the same way (`window.EmblaCarouselAutoplay`), so a CDN failure or `prefers-reduced-motion` just disables autoplay/progress and leaves the rest of the carousel (drag, buttons, dots, keyboard) working

**Color system**: the site is white/ivory with a refined gold accent (a rework from an earlier all-black/bright-gold theme). `gold-deep` (#A67C00) only reaches ~3.8:1 contrast on white — fine for large/bold headings and icons (AA-large, 3:1) but **not** for body-size text or links (needs 4.5:1). `gold-ink` (#8A6500, ~5.3:1) exists specifically for gold-colored links/labels at normal text size on light backgrounds. `gold` (#C9A227) and `gold-light` are for borders/icon fills/badge backgrounds, which aren't subject to text-contrast rules. On the site's two intentionally dark sections (`#projects`, the footer), the original `gold`-on-black styling still applies directly — no need for the `-ink`/`-deep` split there, contrast is already high.

**Custom CSS** (in the `<style>` block) defines:
- `.gold-gradient` — button/icon fill gradient (`#D4AF37` → `#A67C00`); `#btn-contactame` uses the same two colors defined separately via its ID selector (so it wins over Tailwind classes)
- `.hover-lift` — card lift animation on hover, with a soft warm shadow (used by service cards; **not** by the carousel cards — its 0.3s `transform` transition would lag the per-frame 3D tween)
- `.fade-in` / `.fade-in.visible` — scroll-triggered reveal (driven by IntersectionObserver)
- `nav.scrolled` — near-opaque white background + soft shadow added to navbar after 50px scroll (toggled by JS); the navbar itself is `bg-white/80 backdrop-blur-md` at rest
- `.logo-navbar` — navbar logo micro-interaction: subtle jump on hover (no continuous animation, to avoid distraction)
- `.logo-cloud-mask` — left/right fade mask (CSS `mask-image` gradient) on the `#tecnologias` logo marquee so logos fade in/out at the edges instead of popping
- `#whatsapp-float` + tooltip (`::before`) — floating WhatsApp button, white with a gold border/icon (not WhatsApp's brand green — kept deliberately understated)
- `.projects-card` / `.projects-card.is-active` / `.projects-card-shine` — carousel cards: only `box-shadow`/`border-color` transition (never `transform`), the active card gets a gold glow plus a light that travels around its border (`conic-gradient` border-box animated via `@property --borde-angulo`, static where `@property` isn't supported), a cursor-following highlight and an image/video parallax (`.projects-media`), both driven by `--mx`/`--my` CSS vars set from JS; non-active cards get `cursor:pointer`
- `.projects-slide-inner` — no CSS rule of its own outside the reduced-motion block; it's the JS 3D coverflow tween's transform/opacity target (see carousel JS below), always the *inner* card div, never the outer slide div Embla measures for layout
- `@media (prefers-reduced-motion: reduce)` — disables the navbar logo transition and the marquee animation, and forces `.projects-slide-inner` back to `transform:none; opacity:1` (defense-in-depth: the carousel JS already skips the tween in this case, this is a CSS-level guarantee)

**Inline JavaScript** (a single `<script>` block placed right *after* the two Embla CDN scripts, so `window.EmblaCarousel*` already exist when it runs) handles:
1. **Navbar scroll effect** — adds/removes `.scrolled` class on `<nav>` at 50px scroll threshold
2. **Contact button** — `#btn-contactame` click → 1s delayed `mailto:noble-studiocr@proton.me` redirect (⚠ out of sync: the email shown in `#contacto` is now `noblestudiocr@gmail.com` — see Contact info)
3. **Mobile menu / smooth scroll / fade-in** — nav toggle (syncs `aria-expanded` on `#menu-btn`), anchor scroll, and IntersectionObserver reveal
4. **Projects carousel** (the largest IIFE) — coverflow carousel: Embla with `align:'center', loop:true`, official Autoplay plugin (`delay:6000, stopOnInteraction:false, stopOnMouseEnter:true, stopOnFocusIn:true`, `rootNode` scoped to `#projects-carousel-region` so hovering dots/counter/progress also pauses it), a 3D coverflow "tween" on `scroll` (adapted from Embla's "Tween Scale" recipe via `internalEngine()`/`scrollProgress()`/`scrollSnapList()`, but with a *signed* -1..1 offset per slide so side cards get `rotateY` toward the center, `translateZ` back, a `translateX` pull inward, scale/opacity falloff, and `z-index` on the outer slide; `perspective()` lives inside each card's own transform because Embla owns the container's transform; also re-run on `slidesInView`, since that list is filled async and is empty at init), a one-time entrance animation (cards are hidden at `opacity:0` until an IntersectionObserver sees the region at 30%, then rise into place staggered by distance from center), a pointer tilt + shine on the active card (fine-pointer devices only, lerped in `requestAnimationFrame`, disabled while dragging), an `.is-active` class toggled on `select`, a capture-phase click handler that centers a side card instead of following its link (only the centered card's links open), dots whose active one stretches into a pill, dots + "01 / 05" counter (generated from the real slide count), a progress bar driven by `autoplayPlugin.timeUntilNext()` in `requestAnimationFrame` (not a CSS-reflow trick), per-slide video play/pause on `select` (only the active slide's video plays), keyboard arrows scoped to `#projects-carousel-region`, and a one-time pass at init that reads each slide's `data-tipo` attribute (`"cliente"` / `"conceptual"`) to fill in its `.proyecto-badge` label. Everything here is guarded: if `EmblaCarousel` fails to load nothing runs; if only `EmblaCarouselAutoplay` fails (or `prefers-reduced-motion` is set), the carousel still works manually just without autoplay/progress/tween.
5. **Tech logo cloud** — IIFE (separate from Embla) that clones the single `#tech-logos-track` child div 3 extra times (`aria-hidden` on the clones) so the CSS `animate-logo-cloud` marquee (defined via `tailwind.config` keyframes, see above) never shows a gap while it loops

The last `<script>` in the file is a Cloudflare challenge-platform snippet injected by the hosting/CDN layer — leave it alone, it isn't app code.

## Sections (page order)

1. `#inicio` — Hero: text only — "Noble Studio" wordmark (`<h1>`), a one-line value prop ("Diseño y desarrollo web que impulsan tu negocio") + subtitle, and a single "Ver proyectos" CTA (`#projects`). No logo, typing effect, or stat counters anymore (removed, see below).
2. `#servicios` — Three service cards (Diseño Digital, Recuperación de Computadoras, Desarrollo Web) on an `ivory` background; each card ends with a "Solicitar este servicio" link to `#contacto`.
3. `#proceso` — **New section**: "Cómo Trabajamos", 4 numbered steps (conversación → propuesta → diseño/desarrollo → entrega y soporte) on white background, between Servicios and Proyectos.
4. `#projects` — Embla-powered coverflow carousel (see JS above) of project cards sourced from `assets/`/`img/`, on a black background (one of two intentionally dark sections):
   - Diseño de Interfaz de Usuario (MyEduc, Canva) — `data-tipo="conceptual"`
   - Las Chemas del Mapa (online football/NBA/NFL/MLB/F1 jersey store) — `data-tipo="cliente"`
   - Pokédex App (consumes PokéAPI) — `data-tipo="conceptual"`
   - Doja E-commerce (Next.js storefront) — `data-tipo="conceptual"`
   - Pollo Frito GEME — Sitio web de pedidos (soda ordering site, video `img/soda-geme.mp4`, links to `soda-pollo-frito-geme.vercel.app`) — `data-tipo="cliente"`. It reuses the slot/markup of the old Melissa portfolio slide (SLIDE 5); the slide is live.

   The `data-tipo` values above are best guesses made during the redesign and still need confirmation from the studio; correct them directly on each slide's outer `data-tipo` attribute if wrong — the JS badge picks it up automatically, no other change needed.
5. `#tecnologias` — Infinite horizontal "logo cloud" marquee of tech/tool logos (SVGs from `svg/`) on an `ivory` background, separate carousel mechanism from Embla (CSS animation + JS clone, see above). Three of the SVGs (`supabase-logo-wordmark--dark.svg`, `tailwindcss-svgrepo-com.svg`, `vercel-svgrepo-com.svg`) are white-only "dark-background" assets — each is wrapped in a small `bg-ink` chip so it stays visible; don't remove that wrapper without swapping in a light-mode asset instead.
6. `#equipo` — Entire section is commented out (team bios for Melissa Lopez – CEO and Jimmy Cabalceta – CTO). Untouched by the redesign.
7. `#contacto` — WhatsApp is the primary contact channel (large highlighted block, listed first), then Email and Ubicación, then the "¿Listo para comenzar?" CTA and Instagram/WhatsApp social links. White background.
8. Footer — logo, copyright, on an intentionally dark band (`bg-[#111111]`) — the other of the two dark sections, for contrast against the otherwise white/ivory site.

**Removed/commented elements:**
- Typing effect (`#typing-text`, `textToType`) — removed entirely (was already disabled, `textToType` was `''`); the hero's new value-prop line replaced what it used to sit next to
- Stat counters in hero — removed entirely, including the dead `IntersectionObserver` that referenced a commented-out `animateCounter` function
- Portafolio Diseñadora (Melissa) carousel slide — removed; its slot was replaced by the GEME slide
- Hero animated bird logo (two-layer PNG `.ave-hero`/`.ala-aleteo`/`.logo-sombra` + `flotar`/`aleteo`/`sombra-vuelo` keyframes) — removed entirely, markup and CSS (commit 52ef5b0)
- Hero "Cotiza tu proyecto" WhatsApp CTA — removed; WhatsApp is still reachable via `#whatsapp-float` and `#contacto`
- Team section (`#equipo`) — still commented out
- Hero parallax-on-scroll — removed entirely (pre-existing, before this redesign)

## Logos

The navbar logo (`/img/noble-studio-logo.png`, `.logo-navbar`) is now the only logo above the footer; the hero has none. If an animated hero logo is ever brought back, `logo-cuerpo.png` + `logo-ala.png` are still in `img/` (recover the CSS from git history before 52ef5b0). Don't use `img/video-ave-logo.mp4` for it: that video has a **solid black background** (all four corners `rgb(0,0,0)`) and would render as a black box on the white hero.

## Assets

- `img/` — logos (`noble_studio_logo.png`, `noble_studio_logo_con_letras.png`, `noble-studio-logo.png`), former animated-logo parts (`logo-ala.png`, `logo-cuerpo.png`, unused) and `video-ave-logo.mp4` (unused — see Logos above), project videos (`soda-geme.mp4` in use; `doja-video.mp4`, `melissa-portafolio.mp4` unused), `instagram-svgrepo-com.svg` (white glyph, forced black in `#contacto` via `brightness-0`), plus a stray `WhatsApp Video 2026-06-13 at 1.06.45 AM.mp4` that nothing references
- `assets/` — project screenshots/videos for the carousel (`MyEducInicio.png`, `laschemasdelmapa.mp4`, `PokeApi.mp4`, `doja-preview.png`/`.jpg`, `portafolio-mel-preview.jpg` — currently unused), plus misc assets not wired into the current carousel (`VideoCortoTeslaApp.mp4`, `canva_icon.png`, `cerficacionLinkedinXms.jpg`, `menutresrayitas.png`, `closemenu.svg`)
- `svg/` — tech/tool logos for the `#tecnologias` marquee (Linux, VS Code, React, Supabase, HTML/CSS/JS/TypeScript, Tailwind, Bootstrap, Git, GitHub, Vercel, Canva). Three of these are dark-background-only assets (see `#tecnologias` above) — check an SVG's fill colors before reusing it elsewhere on a light background.

When re-enabling a commented-out section or carousel slide, verify its referenced asset still exists — filenames have shifted across recent commits (e.g. project screenshots were reorganized between `img/` and `assets/`).

## Contact info

- Email: `noblestudiocr@gmail.com` is what `#contacto` displays (changed in 7974769), but the `#btn-contactame` JS still sends to `mailto:noble-studiocr@proton.me`. Confirm with the studio which is correct before touching either.
- WhatsApp: +506 8975-5791 (`wa.me/50689755791`) — the primary contact channel, both in `#contacto` and via the floating `#whatsapp-float` button (white/gold, not WhatsApp green)
- Instagram: `__noble___studio___`
