# Tailwind Color Configuration

## Color Choices

- **Primary:** `sky` — Used for primary actions (Rechercher button), focus rings, key accents. Echoes la thématique's signature blue.
- **Secondary:** `rose` — Used for newsletter panel accent, destructive actions (delete, remove), CTA secondaire. Modernizes the Poké-red.
- **Neutral:** `zinc` — Used for backgrounds, borders, text. Cool modern gray that complements the saturated primaries without warmth fight.

## Usage Examples

### Primary actions
```html
<button class="bg-sky-500 hover:bg-sky-600 text-white">Rechercher</button>
```

### Focus ring
```html
<input class="focus:outline-none focus:ring-2 focus:ring-sky-500" />
```

### Secondary / destructive
```html
<button class="bg-rose-500 hover:bg-rose-600 text-white">Supprimer</button>
<span class="text-rose-600 dark:text-rose-400">Erreur</span>
```

### Newsletter panel accent
```html
<span class="text-rose-600 dark:text-rose-400 font-mono uppercase tracking-widest">
  Panneau droit
</span>
```

### Neutral backgrounds & text
```html
<div class="bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
  ...
</div>
<div class="border-zinc-200 dark:border-zinc-800">...</div>
<p class="text-zinc-500 dark:text-zinc-400">Description</p>
```

### Event tag badges (used in newsletter sections)
| Tag        | Tailwind classes                                     |
| ---------- | ---------------------------------------------------- |
| event      | `bg-sky-100 text-sky-800 ring-sky-200`               |
| raid       | `bg-rose-100 text-rose-800 ring-rose-200`            |
| update     | `bg-emerald-100 text-emerald-800 ring-emerald-200`   |
| community  | `bg-amber-100 text-amber-800 ring-amber-200`         |
| research   | `bg-violet-100 text-violet-800 ring-violet-200`      |
| spotlight  | `bg-orange-100 text-orange-800 ring-orange-200`      |
| misc       | `bg-zinc-100 text-zinc-700 ring-zinc-200`            |

(Each has a `dark:` variant in components — see `components/EventTagBadge.tsx`.)

## Tailwind v4 Setup

Gazette uses Tailwind CSS v4. There is no `tailwind.config.js`. Colors are referenced directly via Tailwind's built-in palettes (`sky-500`, `rose-500`, `zinc-100`, etc.).

If your project uses an older Tailwind version, you may need to ensure these palettes are available (they are part of the default Tailwind theme).
