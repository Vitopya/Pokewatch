# Gazette — Compte rendu produit, design et accessibilité

> Application : **Gazette** · Version 1.0 · Avril 2026
> Auteur : Joseph Deffayet · Designer
> Stack : React 19 · Vite 7 · TypeScript · Tailwind CSS v4 · @dnd-kit · TipTap · Google Gemini

---

## 1. Présentation

**Gazette** est une application web mono-écran qui transforme n'importe quel ensemble de flux RSS en newsletter structurée et rédigée par une IA. L'utilisateur :

1. configure ses propres sources (aucun preset, aucun thème imposé) ;
2. lance la récupération des dépêches ;
3. sélectionne celles qu'il souhaite voir paraître ;
4. déclenche la composition IA, qui produit un brouillon structuré en rubriques et items ;
5. édite chaque rubrique et chaque carte directement dans l'interface (titres, descriptions, listes à puces, image) ;
6. réorganise sections et cartes par drag-and-drop ;
7. copie le résultat final en Markdown ou HTML pour l'envoyer dans son outil de diffusion.

La promesse est simple : **donner aux créateurs de newsletter un atelier rapide, neutre et lisible, sans verticalité imposée**. Gazette est volontairement domain-agnostic — chaque utilisateur amène ses sources et la tonalité s'adapte au matériau d'origine via le prompt système générique.

---

## 2. Concept et positionnement

### Le problème

Les outils actuels de génération de newsletter par IA souffrent de trois maux :
- ils enferment l'utilisateur dans un thème (tech, finance, lifestyle…) ;
- ils proposent des templates rigides qui forcent un ton ;
- l'édition post-génération est souvent inexistante ou désastreuse.

### La réponse Gazette

- **Une seule promesse** : RSS + IA → brouillon structuré, éditable en place, exportable en deux clics.
- **Aucun preset** : l'utilisateur choisit ses sources. La tonalité est portée par le matériau, pas par un template.
- **Une app, une page** : pas de routage, pas d'onboarding lourd, pas de menus enfouis.
- **L'identité éditoriale est forte** : choix tipographiques (Fraunces serif + Inter Tight + JetBrains Mono), palette papier/encre/vermillon, grain papier, drop caps, kickers en majuscules — la sensation est celle d'un journal, pas d'un SaaS.

---

## 3. Conception UX/UI

### 3.1 Architecture mono-écran

Gazette est structurée autour de **deux panneaux** côte à côte (responsive : empilés sur mobile avec un toggle bas) :

| Panneau | Rôle |
|---|---|
| **A — Sources** (gauche) | Filtres (date, mot-clé, tirage), liste des flux actifs, dépêches reçues, sélection à cocher, bouton de composition |
| **B — Édition** (droite) | Newsletter composée par l'IA, éditable inline, drag-and-drop des rubriques et cartes, boutons copier MD/HTML |

L'en-tête fixe (h-12/h-14) porte le logo, le bouton **Réglages** unique, et le toggle de thème clair/sombre.

### 3.2 Système de design

L'app est intentionnellement **éditoriale / presse**. Tokens définis dans `src/index.css` :

- **Typographies** : Fraunces (display serif) pour les titres et la touche éditoriale ; Inter Tight (sans-serif) pour le corps ; JetBrains Mono (mono) pour les kickers et métadonnées.
- **Palette mode jour** : `paper #fffdf7`, `bone #f4efe6`, `ink #0e0e0c`, accent unique `vermillion #c2200f`.
- **Palette mode nuit** : `night #14140f`, `night-paper #1a1a14`, `night-text #e8e2d4`.
- **Détails éditoriaux** : grain papier en overlay, drop cap rouge sur le lead item, numérotation des dépêches en `№ 01`, badge `№ 088` (numéro d'édition daté), filets et règles partout.

### 3.3 Parcours de premier lancement

1. **Splashscreen** — logo + nom + bouton "Passer". Respecte `prefers-reduced-motion` (saute l'animation pour les utilisateurs concernés).
2. **Visite guidée (AppTour)** — 5 étapes, spotlight + carte explicative, navigation au clavier (flèches, Entrée, Échap), sortie possible à tout moment.
3. **Assistant d'installation (SetupWizardModal)** — 3 phases : choix du moteur IA, ajout des premiers flux, récapitulatif. La clé API n'est jamais saisie côté navigateur — info pédagogique sur l'env var attendue.

Tous trois sont relançables depuis le drawer des réglages.

### 3.4 Drawer des réglages

Une **entrée unique** (bouton "Réglages" dans la navbar). Le drawer (largeur responsive `min(100%, 560px)`, hauteur `100dvh`, focus trap) regroupe :

- **Moteur d'IA** — Gemini actif (autres marqués "Bientôt"), statut de connexion, info clé API détaillée par provider.
- **Sources d'articles** — liste, ajout, suppression, activation/désactivation.
- **Prise en main** — relancer la visite, refaire la configuration.
- **Zone sensible** — réinitialisation totale avec confirmation explicite.

Footer : `© 2026 tous droits réservés — Joseph Deffayet | Designer · v1.0`.

---

## 4. Audit d'accessibilité

L'app a été soumise à un audit complet aligné sur **RGAA 4.1.2** (référentiel français) et **WCAG 2.2 niveau AA** (standard international).

### 4.1 Périmètre audité

Toute l'app (`src/`), avec focus sur :
- Shell : `AppShell`, `MainNav`, `ThemeToggle`
- Workspace : `Workspace`, `RssPanel`, `NewsletterPanel`, `NewsletterSectionCard`, `NewsletterItemCard`, `ArticleCard`, `FilterControls`
- Modales : `SettingsDrawer`, `SetupWizardModal`, `AppTour`, `Splashscreen`
- Éditeur : `RichTextEditor` (TipTap)

### 4.2 Méthodologie

Audit en 8 dimensions :
1. **Structure et sémantique** — landmarks, hiérarchie de titres, rôles.
2. **Navigation clavier** — focus visible, ordre logique, focus trap dans les dialogs, raccourcis.
3. **Contrastes** — ratios calculés sur tokens (texte/fond, composants UI, états de focus).
4. **Cibles tactiles** — taille minimale 24×24 (WCAG 2.5.8 AA).
5. **Mouvement et animations** — respect de `prefers-reduced-motion`.
6. **Formulaires** — labels associés, identification des erreurs, aide à la correction.
7. **Annonces dynamiques** — live regions pour les changements d'état.
8. **Imagerie et icônes** — alt textes, icônes `aria-hidden`, alternatives textuelles.

### 4.3 Non-conformités relevées (avant correction)

| Sévérité | NC | Critère | Correctif |
|---|---|---|---|
| Critique | Boutons d'action invisibles au focus clavier (drag, trash, image options, lien externe) | RGAA 10.7 / WCAG 2.4.7, 2.1.1 | `focus-visible:opacity-100` + `focus-visible:ring` |
| Critique | Drawer + Tour sans focus trap ni focus initial | RGAA 9.1 / WCAG 2.4.3 | Lib `focus-trap-react` sur les deux dialogs |
| Critique | Cibles tactiles < 24×24 (trash 20px, X bullet 16px, grip 16px, lien externe 20px) | WCAG 2.5.8 AA | Toutes passées à `min-h-6 min-w-6` (24×24) |
| Critique | `text-ink-4` (#8a8a80) ratio 3.3:1 sur fond bone — **insuffisant** | WCAG 1.4.3 AA | Foncé en `#6e6e64` (≥ 4.7:1) |
| Critique | `text-vermillion` (#d7321c) ratio 4.4:1 sur fond clair — limite | WCAG 1.4.3 AA | Foncé en `#c2200f` (≥ 5.3:1) |
| Majeure | `prefers-reduced-motion` non respecté | WCAG 2.3.3, 2.2.2 | Bloc CSS global qui annule animations/transitions |
| Majeure | Pas de skip link "Aller au contenu" | RGAA 12.7 / WCAG 2.4.1 | Skip link visible au focus dans `AppShell` |
| Majeure | Inputs `add-feed` sans `<label>` | RGAA 11.1 / WCAG 3.3.2 | Wrapper `<label><span class="sr-only">…</span><input/></label>` |
| Majeure | Color picker `aria-label` sur valeur brute (`sky`, `rose`…) | RGAA 11.1 | Localisation : `Couleur Bleu ciel`, `Couleur Émeraude`… |
| Majeure | Erreur URL via `window.alert` brut | RGAA 11.10 / WCAG 3.3.1, 3.3.3 | Erreur inline `role="alert"`, `aria-invalid`, `aria-describedby` |
| Majeure | Splash 1700 ms non ajustable | WCAG 2.2.1 | Bouton "Passer" + skip auto si reduced-motion |
| Majeure | Aucun `<h1>` permanent | RGAA 9.1 / WCAG 1.3.1 | `<h1 class="sr-only">` dans `Workspace` |
| Majeure | Changements d'état muets pour AT (fetch, génération, copie) | WCAG 4.1.3 | `LiveAnnouncerProvider` avec deux régions sr-only (polite + assertive), wiring dans `App.tsx` |
| Mineure | `<title>` statique | WCAG 2.4.2 | Mise à jour dynamique selon état (Composition, Newsletter prête, Erreur, dépêches count) |
| Mineure | ArticleCard checkbox `sr-only` sans focus visuel sur le label | WCAG 4.1.2 | `has-[:focus-visible]:ring` + `aria-label` détaillé |
| Mineure | Bordures inactives `border-ink/40` — contraste UI < 3:1 | WCAG 1.4.11 | Sweep `40` → `60` |

### 4.4 Couverture après correction

| Dimension | État |
|---|---|
| Structure / sémantique | ✅ landmarks (`header`, `main`, `section`), hiérarchie h1→h2→h3 cohérente |
| Navigation clavier | ✅ focus visible partout, focus trap dans drawer/tour, skip link, ordre Tab logique |
| Contrastes | ✅ tous les textes ≥ 4.5:1 sur fond clair et sombre |
| Cibles tactiles | ✅ 24×24 minimum atteint |
| Mouvement | ✅ `prefers-reduced-motion` respecté globalement et sur le splash |
| Formulaires | ✅ chaque input dans un `<label>`, erreurs inline accessibles |
| Annonces dynamiques | ✅ live regions polies et assertives, wiring sur fetch/génération/copie |
| Imagerie / icônes | ✅ `alt=""` + `aria-hidden` sur les icônes décoratives, alt explicite sur les autres |

### 4.5 Tests menés

- **Compilation TypeScript stricte** (`tsc --noEmit`) : 0 erreur.
- **Build production Vite** : succès (`npm run build`).
- **Vérification manuelle clavier** : Tab → tous contrôles atteignables, Shift+Tab → ordre inverse, Échap → ferme dialogs.
- **Vérification tokens contraste** : ratios calculés à la main avec WCAG formula.
- **Vérification responsive** : viewports 375 / 768 / 1280 / 1920.

### 4.6 Limites et recommandations futures

Tests **non automatisés** dans cette passe (à mener avant tout déploiement client critique) :
- axe DevTools / WAVE en navigateur réel ;
- NVDA + JAWS sous Windows, VoiceOver sous macOS/iOS ;
- zoom 200 % et 400 % (RGAA 10.4) ;
- simulation daltonisme (deutéranopie, protanopie, achromatopsie) ;
- audit Lighthouse a11y ≥ 95 ;
- tests utilisateurs avec personne malvoyante et personne motrice.

---

## 5. Synthèse

Gazette livre une expérience produit **rapide, neutre et éditorialement forte**, avec un socle d'accessibilité **conforme RGAA 4.1.2 et WCAG 2.2 niveau AA** sur l'ensemble des critères statiques vérifiables sur le code. Les correctifs ont visé en priorité l'usage clavier, les contrastes texte et l'égalité d'accès aux interactions cachées (drag, suppression, ouverture de menus).

Le travail restant relève principalement de **l'audit en environnement réel** (technologies d'assistance, lecteurs d'écran), à mener avant toute mise en production destinée à un public étendu.

---

*Document généré le 2026-04-26. Pour toute question : joseph.deffayet@gmail.com.*
