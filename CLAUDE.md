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

Everything is in `index.html` — HTML structure, inline `<style>` block, and a `<script>` block at the bottom. There are no separate CSS or JS files.

**External dependencies** (CDN only, no local installs):
- Tailwind CSS — all layout and utility classes, configured inline via `tailwind.config` in `<head>`; custom colors: `gold` (#FFD700), `gold-dark` (#B8860B), `gold-light` (#FFF8DC)
- Font Awesome 6.5.1 — icons (WhatsApp, LinkedIn, GitHub, etc.)

**Custom CSS** (in the `<style>` block) defines:
- `.gradient-bg` — solid black background used in hero and contact sections (the `gradientShift` animation keyframe is defined but the class currently just sets `background: #000`)
- `.gold-gradient` — gold button/icon fill (`#FFD700` → `#B8860B`)
- `.hover-lift` — card lift animation on hover
- `.fade-in` / `.fade-in.visible` — scroll-triggered reveal (driven by IntersectionObserver)
- `nav.scrolled` — gold box-shadow added to navbar after 50px scroll (toggled by JS)
- `@keyframes blink` + `.typing-cursor` — blinking gold cursor for the typing effect
- `#hero-content` — `will-change: transform` for GPU-accelerated parallax
- `.stat-number` — gradient-clipped text for animated counters (the counter feature is currently commented out)
- `.ave-hero` + `@keyframes flotar` — hero logo container with floating up/down animation (2.4s cycle)
- `.ala-aleteo` + `@keyframes aleteo` — wing flap rotation anchored at shoulder (46.5% 42%), 1.2s = exactly 2 flaps per float cycle
- `.logo-sombra` + `@keyframes sombra-vuelo` — elliptic shadow below logo that scales in counterphase with the float
- `.logo-navbar` — navbar logo micro-interaction: subtle jump on hover (no continuous animation, to avoid distraction)
- `@media (prefers-reduced-motion: reduce)` — disables all logo animations for accessibility

**Inline JavaScript** (bottom `<script>` block) handles:
1. **Typing effect** — types/deletes `textToType` character by character into `#typing-text`; currently `textToType = ''` (empty string, effectively disabled)
2. **Navbar scroll effect** — adds/removes `.scrolled` class on `<nav>` at 50px scroll threshold
3. **Parallax** — translates `#hero-content` at 40% of scroll speed while hero is in viewport
4. **Contact button** — `#btn-contactame` click → 1s delayed `mailto:noble-studiocr@proton.me` redirect
5. **Mobile menu / smooth scroll / fade-in** — standard nav toggle, anchor scroll, and IntersectionObserver reveal

Note: the animated counter (`animateCounter`) function and its IntersectionObserver setup are commented out but the observer registration call still runs (referencing the missing function). The stat counter HTML is also commented out in the hero section.

## Sections (page order)

1. `#inicio` — Hero with animated bird logo (video), typing subtitle (currently empty string), and CTA buttons
2. `#servicios` — Three service cards (Diseño Digital, Recuperación de Computadoras, Desarrollo Web)
3. `#projects` — Four project cards with screenshots/videos from `assets/`: MyEduc UI (Canva), Las Chemas del Mapa (online shirt store), Pokédex App, Tesla App UI
4. `#equipo` — Entire section is commented out (team bios for Melissa Lopez – CEO and Jimmy Cabalceta – CTO)
5. `#contacto` — Email (noble-studiocr@proton.me), Instagram and WhatsApp links, "Contáctanos" button
6. Footer — logo, copyright

**Removed/commented elements:**
- `#whatsapp-float` — the fixed floating WhatsApp button is commented out; WhatsApp is now only linked from the contact section
- Stat counters in hero — commented out

## Hero Logo

The logo in the hero is a `<video>` (`/img/video-ave-logo.mp4`) with `autoplay muted loop playsinline` inside the `.ave-hero` container (which applies the float animation). The two-layer PNG approach (`logo-cuerpo.png` + `ala-aleteo` on `logo-ala.png`) is preserved in the HTML as comments for reference but is no longer active. The navbar logo uses the static `/img/noble-studio-logo.png`.

## Assets

- `img/` — logos (`noble_studio_logo.png`, `noble_studio_logo_con_letras.png`, `noble-studio-logo.png`), animated logo parts (`logo-ala.png`, `logo-cuerpo.png`), hero video (`video-ave-logo.mp4`), SVG icons
- `assets/` — project screenshots (`.png`) and demo videos (`.mp4`): `MyEducInicio.png`, `laschemasdelmapa.mp4`, `PokeApi.mp4`, `VideoCortoTeslaApp.mp4`

## Contact info

- Email: noble-studiocr@proton.me
- WhatsApp: +506 8975-5791 (`wa.me/50689755791`)
- Instagram: `__noble___studio___`
