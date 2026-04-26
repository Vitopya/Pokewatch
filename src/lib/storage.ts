const STORAGE_KEYS = {
  feeds: 'gazette:feeds',
  filters: 'gazette:filters',
  newsletter: 'gazette:newsletter-draft',
  setup: 'gazette:setup',
  theme: 'gazette:theme',
  uiPanel: 'gazette:ui-panel',
} as const

export type StorageKey = keyof typeof STORAGE_KEYS

export function readStorage<T>(key: StorageKey): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS[key])
    if (raw == null) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function writeStorage<T>(key: StorageKey, value: T): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(value))
  } catch {
    // ignore quota / serialization errors
  }
}

export function clearAllStorage(): void {
  if (typeof window === 'undefined') return
  for (const key of Object.values(STORAGE_KEYS)) {
    window.localStorage.removeItem(key)
  }
  // also wipe legacy pokewatch:* keys
  const legacy = [
    'pokewatch:feeds',
    'pokewatch:filters',
    'pokewatch:newsletter-draft',
    'pokewatch:onboarding',
    'pokewatch:theme',
    'pokewatch:ui-panel',
  ]
  for (const key of legacy) window.localStorage.removeItem(key)
}
