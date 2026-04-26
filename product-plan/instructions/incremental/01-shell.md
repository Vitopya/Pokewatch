# Milestone 1: Shell

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** None

---

## About This Handoff

**What you're receiving:**
- Finished UI designs (React components with full styling)
- Product requirements and user flow specifications
- Design system tokens (colors, typography)
- Sample data showing the shape of data components expect
- Test specs focused on user-facing behavior

**Your job:**
- Integrate these components into your application
- Wire up callback props to your routing and business logic
- Replace sample data with real data from your backend
- Implement loading, error, and empty states

The components are props-based — they accept data and fire callbacks. How you architect the backend, data layer, and business logic is up to you.

---

## Goal

Set up the design tokens and application shell — the persistent chrome that wraps Gazette's single workspace screen.

## What to Implement

### 1. Design Tokens

Configure your styling system with these tokens:

- See `product-plan/design-system/tokens.css` for CSS custom properties
- See `product-plan/design-system/tailwind-colors.md` for Tailwind palette mapping (`sky` primary, `rose` secondary, `zinc` neutral)
- See `product-plan/design-system/fonts.md` for Google Fonts setup (Plus Jakarta Sans + JetBrains Mono)

Gazette uses **Tailwind CSS v4** (no `tailwind.config.js`). Built-in Tailwind palettes are referenced directly: `sky-500`, `rose-500`, `zinc-100`, etc. If your project uses Tailwind v3 or another system, adapt accordingly.

### 2. Application Shell

Copy the shell components from `product-plan/shell/components/` to your project:

- `AppShell.tsx` — Main wrapper. Locks layout to `h-dvh max-h-dvh overflow-hidden flex flex-col`. The single child `<main>` takes the remaining height.
- `MainNav.tsx` — Sticky header (h-12 mobile, h-14 desktop) with logo, optional nav items, settings button, theme toggle, user menu.
- `UserMenu.tsx` — Avatar dropdown with settings shortcut and reset session.
- `ThemeToggle.tsx` — Light/dark switcher icon button.
- `index.ts` — Barrel exports.

**Wire Up Header Actions:**

Gazette is a single-screen app. The shell does NOT render a sidebar or main navigation. Default `navigationItems` to an empty array. The header carries:

- **Logo (clickable)** — wire to a "back to default workspace state" callback
- **Settings button** — opens your settings drawer/modal (feed CRUD, Claude API key, format prefs, reset localStorage)
- **Theme toggle** — wire to your theme state. Persist preference in `localStorage` under key `gazette:theme`
- **User menu** — pass a `user` prop with `name` (initials are computed) and optional `avatarUrl`. Wire `onLogout` to your "reset session" handler

**Settings Drawer (out of scope for shell components):**

The shell exposes `onOpenSettings` as a callback. You implement the actual drawer/modal in your application code. It should support:
- CRUD of RSS feeds (add by URL, remove, toggle active, set accent color)
- Claude API key input + persistence to localStorage
- Default copy format toggle (markdown vs HTML)
- Reset localStorage / clear data action

## Files to Reference

- `product-plan/design-system/` — Design tokens (CSS, Tailwind, fonts)
- `product-plan/shell/README.md` — Shell design intent
- `product-plan/shell/components/` — Shell React components

## Done When

- [ ] Plus Jakarta Sans + JetBrains Mono are loaded via Google Fonts
- [ ] Tailwind palettes `sky`, `rose`, `zinc` are usable in components
- [ ] AppShell renders with `h-dvh` and locks scroll to internal panels
- [ ] Header logo, settings, theme toggle, and user menu are wired
- [ ] Theme preference persists in `localStorage` key `gazette:theme`
- [ ] Settings drawer opens when `onOpenSettings` fires (drawer content can be a stub initially)
- [ ] Light/dark mode is functional across the shell
- [ ] Shell is responsive (compact header < 768px, full header ≥ 768px)
