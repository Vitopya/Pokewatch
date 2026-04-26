# Gazette Application Shell

## Overview

Gazette is a single-screen webapp. The shell provides minimal chrome above a unique workspace area that hosts the two main panels (RSS management on the left, newsletter on the right). No sidebar navigation, no multiple routes — the roadmap "sections" are functional zones of one screen or settings drawers opened from the header.

## Components Provided

- **`AppShell.tsx`** — Main wrapper. Renders the header and a flex-1 main area for the section content. Uses `h-dvh max-h-dvh overflow-hidden flex flex-col` to lock the layout to the dynamic viewport height.
- **`MainNav.tsx`** — Sticky header (h-12 mobile, h-14 desktop) with logo, optional nav items (defaults to none for Gazette), settings button, theme toggle, and user menu.
- **`UserMenu.tsx`** — Dropdown with user initials avatar, settings shortcut, and "Reset session" action.
- **`ThemeToggle.tsx`** — Light/dark switch icon button.

## Layout Pattern

- **Header height:** 56px desktop, 48px mobile
- **Workspace:** occupies full remaining height under the header, no internal padding (sections handle their own layout)
- **Z-index:** header is z-30, modals/drawers go z-50 above

## Header Actions

- **Logo (clickable)** — back to default workspace state
- **Settings button** — opens settings drawer (feed CRUD, API key, format prefs, reset localStorage)
- **Theme toggle** — light/dark, persisted in `localStorage` under key `gazette:theme`
- **User menu** — initials avatar dropdown with settings shortcut and reset session

## Responsive Behavior

- **Desktop (≥1024px)** — full header with logo + label, action icons + tooltips, workspace split vertical (panels side-by-side gauche/droite)
- **Tablet (≥768px)** — header keeps logo + label, workspace split adapts
- **Mobile (<768px)** — compact header (logo only without label), action icons condensed, workspace stacks vertically with bottom toggle

## Tokens Applied

- Primary `sky` — logo accent badge, focus rings, active states
- Secondary `rose` — destructive / high-emphasis CTA (used by sections, not directly by the shell)
- Neutral `zinc` — backgrounds, borders, text

