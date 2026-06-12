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
- Tailwind CSS — all layout and utility classes, configured inline via `tailwind.config` in `<head>`
- Font Awesome 6.5.1 — icons (WhatsApp, LinkedIn, GitHub, etc.)

**Custom CSS** (in the `<style>` block) defines:
- `@keyframes gradientShift` + `.gradient-bg` — animated shifting gradient for hero and contact sections
- `.gold-gradient` — gold button/icon fill (`#FFD700` → `#B8860B`)
- `.hover-lift` — card lift animation on hover
- `.fade-in` / `.fade-in.visible` — scroll-triggered reveal (driven by IntersectionObserver)
- `nav.scrolled` — gold box-shadow added to navbar after 50px scroll (toggled by JS)
- `@keyframes blink` + `.typing-cursor` — blinking gold cursor for the typing effect
- `#hero-content` — `will-change: transform` for GPU-accelerated parallax
- `.stat-number` — gradient-clipped text for the animated counters
- `@keyframes pulse` + `#whatsapp-float` — fixed floating WhatsApp button (bottom-right)

**Inline JavaScript** (bottom `<script>` block) handles six features:
1. **Typing effect** — types/deletes `textToType` character by character into `#typing-text`
2. **Animated counters** — counts `.stat-number[data-target]` from 0 using `requestAnimationFrame` + easeOut, triggered by IntersectionObserver
3. **Navbar scroll effect** — adds/removes `.scrolled` class on `<nav>` at 50px scroll threshold
4. **Parallax** — translates `#hero-content` at 40% of scroll speed while hero is in viewport
5. **Contact button** — `#btn-contactame` click → 1s delayed `mailto:` redirect
6. **Mobile menu / smooth scroll / fade-in** — standard nav toggle, anchor scroll, and IntersectionObserver reveal

## Sections (page order)

1. `#inicio` — Hero with logo, typing subtitle, CTA buttons, and animated stat counters (5+ projects, 1 year)
2. `#servicios` — Three service cards (Diseño Digital, Recuperación de Computadoras, Desarrollo Web)
3. `#projects` — Four project cards with screenshots/videos from `assets/`
4. `#equipo` — Two team member bios (Melissa Lopez – CEO, Jimmy Cabalceta – CTO) with LinkedIn buttons (placeholder `#` links — replace with real URLs)
5. `#contacto` — Email, WhatsApp (+506 8975-5791), location + "Contáctanos" button
6. Footer — logo, Instagram link (currently `#`), copyright

**Floating element:** `#whatsapp-float` — fixed WhatsApp button visible across all sections.

## Assets

- `img/` — logos (`noble_studio_logo.png`, `noble_studio_logo_con_letras.png`) and social icons
- `assets/` — project screenshots (`.png`) and demo videos (`.mp4`)
