# Gazette — Product Overview

## Summary

Gazette est une webapp single-screen qui transforme des flux RSS sujet en newsletters structurées, illustrées et synthétiques. À gauche, gestion des flux RSS et filtres de recherche ; à droite, une newsletter générée par IA, groupée par type d'événement, éditable inline et copiable en markdown ou HTML.

## Planned Sections

1. **Workspace** — Écran principal et unique de Gazette. Combine la gestion des flux RSS, les filtres de recherche, la sélection d'articles et la génération/édition de newsletter dans une vue split vertical (panneaux côte-à-côte gauche/droite).

> Note : la roadmap initiale définissait 5 sections (Gestion flux RSS, Recherche/filtres, Génération, Édition/export, Paramètres). Vu le caractère single-screen du produit, les sections 2/3/4 ont été regroupées dans la section unique "Workspace". Les sections 1 et 5 sont implémentées sous forme de drawer paramètres accessible depuis le shell (non couvert par cet export — à concevoir lors de l'implémentation).

## Product Entities

- **RssFeed** — Une source RSS configurée par l'utilisateur (URL, titre, état d'activation, accent color, dernière sync).
- **Article** — Un article récupéré depuis un flux RSS, candidat pour la newsletter (titre, description, lien, date, image, source, état de sélection).
- **SearchFilters** — Filtres appliqués à la recherche (date range, flux actifs, mot-clé, limite).
- **Newsletter** — Document généré par le LLM (titre, date génération, sections, statut, format).
- **NewsletterSection** — Regroupement d'événements de même type (Raids, Événements, Mises à jour…). Issue du tagging LLM.
- **NewsletterItem** — Un événement rédigé (titre, description, bullets, image, source).
- **OnboardingState** — Progression du tutoriel premier lancement (3 étapes).
- **ApiSettings** — Configuration runtime (clé API Claude, modèle, format préféré).

## Design System

**Colors:**
- Primary: `sky` (Tailwind) — actions principales, focus, accents bleu la thématique
- Secondary: `rose` (Tailwind) — CTA destructive, accents secondaires, panneau newsletter
- Neutral: `zinc` (Tailwind) — backgrounds, borders, text

**Typography:**
- Heading: `Plus Jakarta Sans` (Google Fonts)
- Body: `Plus Jakarta Sans` (single-font system)
- Mono: `JetBrains Mono` (Google Fonts) — utilisée pour micro-labels, timestamps, dates relatives

## Implementation Sequence

Build this product in milestones:

1. **Shell** — Design tokens (sky/rose/zinc + Plus Jakarta Sans + JetBrains Mono) et application shell minimal (header avec logo, settings, theme toggle, user menu).
2. **Workspace** — Section principale split vertical : panneau gauche flux RSS + filtres + sélection articles, panneau droit newsletter générée éditable + copy MD/HTML, onboarding 3 étapes.

Each milestone has a dedicated instruction document in `product-plan/instructions/`.
