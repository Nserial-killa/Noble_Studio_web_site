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

**Styling** uses two CDN-loaded frameworks loaded in duplicate `<head>` tags (a known issue in the file):
- Tailwind CSS (CDN, configured inline via `tailwind.config`) — used for all layout and utility classes
- Bootstrap 5.3.7 (CDN) — loaded but not actively used in the current markup

**Custom CSS** (in the `<style>` block) defines:
- `.gradient-bg` — black hero/contact section background
- `.gold-gradient` — gold button/icon fill (`#FFD700` → `#B8860B`)
- `.hover-lift` — card hover animation
- `.fade-in` / `.fade-in.visible` — scroll-triggered reveal animation (driven by IntersectionObserver in the script block)

**Inline JavaScript** (bottom `<script>` block) handles:
- `btn-contactame` click → delayed `mailto:` redirect to `noble-studiocr@proton.me`
- Mobile menu toggle (`#menu-btn` / `#mobile-menu`)
- Smooth scroll for all `a[href^="#"]` anchors
- IntersectionObserver fade-in for `.fade-in` elements

## Known Issues

1. **Duplicate `<head>` tags** — Bootstrap is loaded in the first `<head>` (line 3), Tailwind and styles in the second `<head>` (line 11). Browsers tolerate this but it's malformed HTML.
2. **JavaScript fragment in footer HTML** — lines 392–397 have JS code accidentally embedded inside a `<div>` attribute string in the footer. The real, working copy of that listener is in the `<script>` block at the bottom of `<body>`.

## Sections (page order)

1. `#inicio` — Hero with logo and CTAs
2. `#servicios` — Three service cards (Diseño Digital, Recuperación de Computadoras, Desarrollo Web)
3. `#projects` — Featured project cards with screenshots/videos from `assets/`
4. `#equipo` — Two team member bios (Melissa Lopez – CEO, Jimmy Cabalceta – CTO)
5. `#contacto` — Contact info + "Contáctame" button (mailto redirect)

## Assets

- `img/` — logos and social icons
- `assets/` — project screenshots (`.png`) and demo videos (`.mp4`)
