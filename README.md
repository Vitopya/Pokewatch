<p align="center">
  <img src="public/logo.png" alt="Gazette logo" width="160" />
</p>

<h1 align="center">Gazette</h1>

<p align="center">
  <em>Atelier de newsletter mono-écran. RSS → IA → édition inline → copie en deux clics.</em><br/>
  <sub>Conformité visée : RGAA 4.1.2 · WCAG 2.2 AA</sub>
</p>

---

## Concept

**Gazette** transforme n'importe quel ensemble de flux RSS en newsletter structurée et rédigée par une IA. Aucun thème imposé, aucun template enfermant — l'utilisateur amène ses sources, choisit ses dépêches, et l'IA compose un brouillon en rubriques et items entièrement éditable.

Le parcours tient en cinq gestes :

1. **Configurer** ses flux RSS depuis le drawer Réglages.
2. **Récupérer** les dernières dépêches (filtrables par date, mot-clé, tirage).
3. **Sélectionner** les articles à inclure.
4. **Composer** : l'IA produit une newsletter structurée.
5. **Éditer** chaque rubrique et carte (titres, descriptions, listes à puces, images, drag-and-drop), puis **copier** en Markdown ou HTML.

L'identité visuelle est éditoriale / presse : palette papier-encre-vermillon, Fraunces (display serif) + Inter Tight + JetBrains Mono, grain papier, drop caps, kickers en majuscules.

---

## Setup

```bash
npm install
cp .env.example .env   # ajoute la clé du provider IA choisi
npm run dev            # http://localhost:3000
```

Clé API Google Gemini (free tier) : https://aistudio.google.com/apikey.

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Vite + API serverless émulées |
| `npm run build` | Type check + build production |
| `npm test` | Suite Vitest |
| `npm run lint` | ESLint |

## Stack

React 19 · Vite 7 · TypeScript · Tailwind CSS v4 · TipTap (édition riche) · @dnd-kit (drag-and-drop) · focus-trap-react (a11y) · Vercel Functions Node 20 · Google Gemini `gemini-2.5-flash` (par défaut, free tier).

## Architecture

```
api/                 fonctions serverless (health, rss, generate SSE)
src/
  App.tsx            câblage shell + workspace + drawer + tour + reducer
  main.tsx           bootstrap + LiveAnnouncer
  components/        SettingsDrawer, RichTextEditor, LiveAnnouncer
  shell/             AppShell, MainNav, ThemeToggle
  sections/workspace Workspace, RssPanel, NewsletterPanel,
                     ArticleCard, NewsletterSectionCard,
                     NewsletterItemCard, FilterControls,
                     SetupWizardModal, AppTour, Splashscreen
  lib/               reducer, hooks, fetch, serialize
  index.css          tokens (couleurs, typo) + reduced-motion + skip-link
public/logo.png      identité visuelle
```

## Persistance

`localStorage` (namespace `gazette:`) : `feeds`, `filters`, `newsletter-draft`, `setup`, `theme`, `ui-panel`. Reset complet via drawer Réglages → Zone sensible.

## Déploiement Vercel

```bash
vercel link
vercel env add GEMINI_API_KEY
vercel --prod
```

Variables : `GEMINI_API_KEY` (obligatoire), `GEMINI_MODEL` (optionnel, défaut `gemini-2.5-flash`).

---

## Accessibilité

Gazette a été soumise à un **audit complet RGAA 4.1.2 + WCAG 2.2 AA**. Les principales mesures appliquées :

- **Navigation clavier** : focus visible partout, focus trap dans drawer et tour, skip link "Aller au contenu", ordre Tab logique.
- **Contrastes** : tous les textes ≥ 4.5:1 sur clair et sombre (tokens `ink-3`, `ink-4`, `vermillion` foncés).
- **Cibles tactiles** : 24×24 minimum (WCAG 2.5.8 AA).
- **Mouvement** : `prefers-reduced-motion` respecté globalement (animations annulées) et sur le splash (skip auto).
- **Formulaires** : chaque input dans un `<label>`, erreurs inline `role="alert"` + `aria-invalid` + `aria-describedby`.
- **Annonces dynamiques** : `LiveAnnouncerProvider` avec régions polite/assertive — fetch, génération, copie, erreurs annoncés aux lecteurs d'écran.
- **Sémantique** : landmarks (`header`, `main`, `section`), hiérarchie h1→h2→h3 cohérente, `<title>` dynamique.

Compte rendu détaillé : [A11Y-REPORT.md](./A11Y-REPORT.md).

---

## Docs

- [CLAUDE.md](./CLAUDE.md) — conventions projet
- [A11Y-REPORT.md](./A11Y-REPORT.md) — audit accessibilité complet
- `product-plan/` — handoff package design d'origine

---

<p align="center">
  <sub>© 2026 — Joseph Deffayet · Designer · v1.0</sub>
</p>
