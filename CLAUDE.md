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
- Tailwind CSS — all layout and utility classes, configured inline via `tailwind.config` in `<head>`; custom colors: `gold` (#FFD700), `gold-dark` (#B8860B), `gold-light` (#FFF8DC)
- Font Awesome 6.5.1 — icons (WhatsApp, LinkedIn, GitHub, arrows, etc.)
- Embla Carousel 8 (vanilla UMD, loaded just before the closing `</body>`) — powers the `#projects` carousel; the init code checks `window.EmblaCarousel` exists before wiring anything up, so a CDN failure degrades silently instead of throwing

**Custom CSS** (in the `<style>` block) defines:
- `.gradient-bg` — solid black background used in hero and contact sections (the `gradientShift` animation keyframe is defined but the class currently just sets `background: #000`)
- `.gold-gradient` — gold button/icon fill (`#FFD700` → `#B8860B`)
- `.hover-lift` — card lift animation on hover (used by project cards in the carousel)
- `.fade-in` / `.fade-in.visible` — scroll-triggered reveal (driven by IntersectionObserver)
- `nav.scrolled` — gold box-shadow added to navbar after 50px scroll (toggled by JS)
- `@keyframes blink` + `.typing-cursor` — blinking gold cursor for the typing effect
- `.stat-number` — gradient-clipped text for animated counters (the counter feature is currently commented out)
- `.ave-hero` + `@keyframes flotar` — hero logo container with floating up/down animation (2.4s cycle)
- `.ala-aleteo` + `@keyframes aleteo` — wing flap rotation anchored at shoulder (46.5% 42%), 1.2s = exactly 2 flaps per float cycle
- `.logo-sombra` + `@keyframes sombra-vuelo` — elliptic shadow below logo that scales in counterphase with the float
- `.logo-navbar` — navbar logo micro-interaction: subtle jump on hover (no continuous animation, to avoid distraction)
- `@media (prefers-reduced-motion: reduce)` — disables all logo animations for accessibility

**Inline JavaScript** (near the bottom, before Embla loads, plus one small block after) handles:
1. **Typing effect** — types/deletes `textToType` character by character into `#typing-text`; currently `textToType = ''` (empty string, effectively disabled)
2. **Navbar scroll effect** — adds/removes `.scrolled` class on `<nav>` at 50px scroll threshold
3. **Contact button** — `#btn-contactame` click → 1s delayed `mailto:noble-studiocr@proton.me` redirect
4. **Mobile menu / smooth scroll / fade-in** — standard nav toggle, anchor scroll, and IntersectionObserver reveal
5. **Projects carousel** — IIFE that wires up Embla Carousel on `#projects-carousel`, binds `#projects-prev`/`#projects-next` buttons, and enables/disables them via `emblaApi.canScrollPrev()`/`canScrollNext()` (re-evaluated on Embla's `select`/`reInit` events)

Note: the animated counter (`animateCounter`) function and its IntersectionObserver setup are commented out but the observer registration call still runs (referencing the missing function). The stat counter HTML is also commented out in the hero section. The hero-scroll parallax that used to translate `#hero-content` has been removed entirely (not just commented out).

The last `<script>` in the file is a Cloudflare challenge-platform snippet injected by the hosting/CDN layer — leave it alone, it isn't app code.

## Sections (page order)

1. `#inicio` — Hero with animated bird logo (video), typing subtitle (currently empty string), and CTA buttons
2. `#servicios` — Three service cards (Diseño Digital, Recuperación de Computadoras, Desarrollo Web)
3. `#projects` — Embla-powered horizontal carousel (drag-to-scroll + prev/next buttons) of project cards sourced from `assets/`/`img/`:
   - Diseño de Interfaz de Usuario (MyEduc, Canva)
   - Las Chemas del Mapa (online football/NBA/NFL/MLB/F1 jersey store)
   - Pokédex App (consumes PokéAPI)
   - Doja E-commerce (Next.js storefront)
   - Portafolio Diseñadora (Melissa Tinoco) — slide is commented out, temporarily removed
4. `#equipo` — Entire section is commented out (team bios for Melissa Lopez – CEO and Jimmy Cabalceta – CTO)
5. `#contacto` — Email (noble-studiocr@proton.me), Instagram and WhatsApp links, "Contáctanos" button
6. Footer — logo, copyright

**Removed/commented elements:**
- `#whatsapp-float` — the fixed floating WhatsApp button is commented out; WhatsApp is now only linked from the contact section
- Stat counters in hero — commented out
- Portafolio Diseñadora (Melissa) carousel slide — commented out
- Team section (`#equipo`) — commented out
- Hero parallax-on-scroll — removed entirely

## Hero Logo

The logo in the hero is a `<video>` (`/img/video-ave-logo.mp4`) with `autoplay muted loop playsinline` inside the `.ave-hero` container (which applies the float animation). The two-layer PNG approach (`logo-cuerpo.png` + `ala-aleteo` on `logo-ala.png`) is preserved in the HTML as comments for reference but is no longer active. The navbar logo uses the static `/img/noble-studio-logo.png`.

## Assets

- `img/` — logos (`noble_studio_logo.png`, `noble_studio_logo_con_letras.png`, `noble-studio-logo.png`), animated logo parts (`logo-ala.png`, `logo-cuerpo.png`), hero video (`video-ave-logo.mp4`), project videos (`doja-video.mp4`, `melissa-portafolio.mp4` — currently unused since its carousel slide is commented out), SVG icons
- `assets/` — project screenshots/videos for the carousel (`MyEducInicio.png`, `laschemasdelmapa.mp4`, `PokeApi.mp4`, `doja-preview.png`/`.jpg`, `portafolio-mel-preview.jpg` — currently unused), plus misc assets not wired into the current carousel (`VideoCortoTeslaApp.mp4`, `canva_icon.png`, `cerficacionLinkedinXms.jpg`, `menutresrayitas.png`, `closemenu.svg`)

When re-enabling a commented-out section or carousel slide, verify its referenced asset still exists — filenames have shifted across recent commits (e.g. project screenshots were reorganized between `img/` and `assets/`).

## Contact info

- Email: noble-studiocr@proton.me
- WhatsApp: +506 8975-5791 (`wa.me/50689755791`)
- Instagram: `__noble___studio___`
