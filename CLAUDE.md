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
- Embla Carousel 8 (vanilla UMD, loaded just before the closing `</body>`) — powers the `#projects` carousel; the init code checks `window.EmblaCarousel` exists before wiring anything up, so a CDN failure degrades silently instead of throwing
- Embla Carousel Autoplay 8 (vanilla UMD, official plugin, loaded right after the core script) — drives the `#projects` carousel's autoplay/progress bar; guarded the same way (`window.EmblaCarouselAutoplay`), so a CDN failure or `prefers-reduced-motion` just disables autoplay/progress and leaves the rest of the carousel (drag, buttons, dots, keyboard) working

**Color system**: the site is white/ivory with a refined gold accent (a rework from an earlier all-black/bright-gold theme). `gold-deep` (#A67C00) only reaches ~3.8:1 contrast on white — fine for large/bold headings and icons (AA-large, 3:1) but **not** for body-size text or links (needs 4.5:1). `gold-ink` (#8A6500, ~5.3:1) exists specifically for gold-colored links/labels at normal text size on light backgrounds. `gold` (#C9A227) and `gold-light` are for borders/icon fills/badge backgrounds, which aren't subject to text-contrast rules. On the site's two intentionally dark sections (`#projects`, the footer), the original `gold`-on-black styling still applies directly — no need for the `-ink`/`-deep` split there, contrast is already high.

**Custom CSS** (in the `<style>` block) defines:
- `.gold-gradient` — button/icon fill gradient (`#D4AF37` → `#A67C00`); `#btn-contactame` uses the same two colors defined separately via its ID selector (so it wins over Tailwind classes)
- `.hover-lift` — card lift animation on hover, with a soft warm shadow (used by project/service cards)
- `.fade-in` / `.fade-in.visible` — scroll-triggered reveal (driven by IntersectionObserver)
- `nav.scrolled` — near-opaque white background + soft shadow added to navbar after 50px scroll (toggled by JS); the navbar itself is `bg-white/80 backdrop-blur-md` at rest
- `.ala-aleteo` + `@keyframes aleteo` — wing flap rotation anchored at shoulder (46.5% 42%), 1.2s = exactly 2 flaps per float cycle
- `.ave-hero` + `@keyframes flotar` — hero logo container with floating up/down animation (2.4s cycle)
- `.logo-sombra` + `@keyframes sombra-vuelo` — elliptic shadow below logo that scales in counterphase with the float
- `.logo-navbar` — navbar logo micro-interaction: subtle jump on hover (no continuous animation, to avoid distraction)
- `.logo-cloud-mask` — left/right fade mask (CSS `mask-image` gradient) on the `#tecnologias` logo marquee so logos fade in/out at the edges instead of popping
- `#whatsapp-float` + tooltip (`::before`) — floating WhatsApp button, white with a gold border/icon (not WhatsApp's brand green — kept deliberately understated)
- `.projects-slide-inner` — no CSS rule of its own outside the reduced-motion block; it's the JS coverflow tween's transform/opacity target (see carousel JS below), always the *inner* card div, never the outer slide div Embla measures for layout
- `@media (prefers-reduced-motion: reduce)` — disables all logo/marquee animations, and forces `.projects-slide-inner` back to `transform:none; opacity:1` (defense-in-depth: the carousel JS already skips the tween in this case, this is a CSS-level guarantee)

**Inline JavaScript** (near the bottom, before Embla loads, plus one small block after) handles:
1. **Navbar scroll effect** — adds/removes `.scrolled` class on `<nav>` at 50px scroll threshold
2. **Contact button** — `#btn-contactame` click → 1s delayed `mailto:noble-studiocr@proton.me` redirect
3. **Mobile menu / smooth scroll / fade-in** — nav toggle (syncs `aria-expanded` on `#menu-btn`), anchor scroll, and IntersectionObserver reveal
4. **Projects carousel** (the largest IIFE) — coverflow carousel: Embla with `align:'center', loop:true`, official Autoplay plugin (`delay:6000, stopOnInteraction:false, stopOnMouseEnter:true, stopOnFocusIn:true`, `rootNode` scoped to `#projects-carousel-region` so hovering dots/counter/progress also pauses it), a scale/opacity "tween" on the `scroll` event (Embla's official coverflow recipe, via `internalEngine()`/`scrollProgress()`/`scrollSnapList()`), dots + "01 / 04" counter, a progress bar driven by `autoplayPlugin.timeUntilNext()` in `requestAnimationFrame` (not a CSS-reflow trick), per-slide video play/pause on `select` (only the active slide's video plays), keyboard arrows scoped to `#projects-carousel-region`, and a one-time pass at init that reads each slide's `data-tipo` attribute (`"cliente"` / `"conceptual"`) to fill in its `.proyecto-badge` label. Everything here is guarded: if `EmblaCarousel` fails to load nothing runs; if only `EmblaCarouselAutoplay` fails (or `prefers-reduced-motion` is set), the carousel still works manually just without autoplay/progress/tween.
5. **Tech logo cloud** — IIFE (separate from Embla) that clones the single `#tech-logos-track` child div 3 extra times (`aria-hidden` on the clones) so the CSS `animate-logo-cloud` marquee (defined via `tailwind.config` keyframes, see above) never shows a gap while it loops

The last `<script>` in the file is a Cloudflare challenge-platform snippet injected by the hosting/CDN layer — leave it alone, it isn't app code.

## Sections (page order)

1. `#inicio` — Hero: two-layer animated bird logo (`logo-cuerpo.png` + `logo-ala.png` with `.ala-aleteo`, floating via `.ave-hero`/`flotar`), "Noble Studio" wordmark, a one-line value prop ("Diseño y desarrollo web que impulsan tu negocio") + subtitle, and two CTAs: "Cotiza tu proyecto" (WhatsApp) and "Ver proyectos" (`#projects`). No typing effect or stat counters anymore (removed, see below).
2. `#servicios` — Three service cards (Diseño Digital, Recuperación de Computadoras, Desarrollo Web) on an `ivory` background; each card ends with a "Solicitar este servicio" link to `#contacto`.
3. `#proceso` — **New section**: "Cómo Trabajamos", 4 numbered steps (conversación → propuesta → diseño/desarrollo → entrega y soporte) on white background, between Servicios and Proyectos.
4. `#projects` — Embla-powered coverflow carousel (see JS above) of project cards sourced from `assets/`/`img/`, on a black background (one of two intentionally dark sections):
   - Diseño de Interfaz de Usuario (MyEduc, Canva) — `data-tipo="conceptual"`
   - Las Chemas del Mapa (online football/NBA/NFL/MLB/F1 jersey store) — `data-tipo="cliente"`
   - Pokédex App (consumes PokéAPI) — `data-tipo="conceptual"`
   - Doja E-commerce (Next.js storefront) — `data-tipo="conceptual"`
   - Portafolio Diseñadora (Melissa Tinoco) — slide is commented out, temporarily removed

   The `data-tipo` values above are best guesses made during the redesign and still need confirmation from the studio; correct them directly on each slide's outer `data-tipo` attribute if wrong — the JS badge picks it up automatically, no other change needed.
5. `#tecnologias` — Infinite horizontal "logo cloud" marquee of tech/tool logos (SVGs from `svg/`) on an `ivory` background, separate carousel mechanism from Embla (CSS animation + JS clone, see above). Three of the SVGs (`supabase-logo-wordmark--dark.svg`, `tailwindcss-svgrepo-com.svg`, `vercel-svgrepo-com.svg`) are white-only "dark-background" assets — each is wrapped in a small `bg-ink` chip so it stays visible; don't remove that wrapper without swapping in a light-mode asset instead.
6. `#equipo` — Entire section is commented out (team bios for Melissa Lopez – CEO and Jimmy Cabalceta – CTO). Untouched by the redesign.
7. `#contacto` — WhatsApp is the primary contact channel (large highlighted block, listed first), then Email and Ubicación, then the "¿Listo para comenzar?" CTA and Instagram/WhatsApp social links. White background.
8. Footer — logo, copyright, on an intentionally dark band (`bg-[#111111]`) — the other of the two dark sections, for contrast against the otherwise white/ivory site.

**Removed/commented elements:**
- Typing effect (`#typing-text`, `textToType`) — removed entirely (was already disabled, `textToType` was `''`); the hero's new value-prop line replaced what it used to sit next to
- Stat counters in hero — removed entirely, including the dead `IntersectionObserver` that referenced a commented-out `animateCounter` function
- Portafolio Diseñadora (Melissa) carousel slide — still commented out
- Team section (`#equipo`) — still commented out
- Hero parallax-on-scroll — removed entirely (pre-existing, before this redesign)

## Hero Logo

The logo in the hero is the two-layer PNG approach: `logo-cuerpo.png` (static body) + `logo-ala.png` (wing, `.ala-aleteo` rotation) stacked via CSS grid in `.ave-hero`, which also applies the `flotar` float animation; `.logo-sombra` renders the counterphase ground shadow. This replaced a `<video>` (`video-ave-logo.mp4`) that was tried at one point — that video has a **solid black background** (confirmed via `ffprobe`/pixel sampling: all four corners are `rgb(0,0,0)`), which is why it doesn't work now that the hero background is white; it would render as a black box. The video file is still in `img/` but no longer referenced. The navbar logo uses the static `/img/noble-studio-logo.png`.

## Assets

- `img/` — logos (`noble_studio_logo.png`, `noble_studio_logo_con_letras.png`, `noble-studio-logo.png`), animated logo parts (`logo-ala.png`, `logo-cuerpo.png`), hero video (`video-ave-logo.mp4`, unused — see Hero Logo above), project videos (`doja-video.mp4`, `melissa-portafolio.mp4` — currently unused since its carousel slide is commented out), SVG icons
- `assets/` — project screenshots/videos for the carousel (`MyEducInicio.png`, `laschemasdelmapa.mp4`, `PokeApi.mp4`, `doja-preview.png`/`.jpg`, `portafolio-mel-preview.jpg` — currently unused), plus misc assets not wired into the current carousel (`VideoCortoTeslaApp.mp4`, `canva_icon.png`, `cerficacionLinkedinXms.jpg`, `menutresrayitas.png`, `closemenu.svg`)
- `svg/` — tech/tool logos for the `#tecnologias` marquee (Linux, VS Code, React, Supabase, HTML/CSS/JS/TypeScript, Tailwind, Bootstrap, Git, GitHub, Vercel, Canva). Three of these are dark-background-only assets (see `#tecnologias` above) — check an SVG's fill colors before reusing it elsewhere on a light background.

When re-enabling a commented-out section or carousel slide, verify its referenced asset still exists — filenames have shifted across recent commits (e.g. project screenshots were reorganized between `img/` and `assets/`).

## Contact info

- Email: noble-studiocr@proton.me
- WhatsApp: +506 8975-5791 (`wa.me/50689755791`) — the primary contact channel, both in `#contacto` and via the floating `#whatsapp-float` button (white/gold, not WhatsApp green)
- Instagram: `__noble___studio___`
