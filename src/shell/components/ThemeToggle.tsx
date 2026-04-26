import { Moon, Sun } from 'lucide-react'

export interface ThemeToggleProps {
  theme?: 'light' | 'dark'
  onToggle?: () => void
}

export function ThemeToggle({ theme = 'light', onToggle }: ThemeToggleProps) {
  const isDark = theme === 'dark'
  return (
    <button
      type="button"
      onClick={onToggle}
      className="cursor-pointer inline-flex h-7 w-7 md:h-8 md:w-8 items-center justify-center border border-ink dark:border-night-text text-ink dark:text-night-text hover:bg-ink hover:text-bone dark:hover:bg-night-text dark:hover:text-night transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-vermillion"
      aria-label={isDark ? 'Mode jour' : 'Mode nuit'}
      title={isDark ? 'Mode jour' : 'Mode nuit'}
    >
      {isDark ? (
        <Sun className="h-3 w-3 md:h-3.5 md:w-3.5" aria-hidden="true" strokeWidth={2.5} />
      ) : (
        <Moon className="h-3 w-3 md:h-3.5 md:w-3.5" aria-hidden="true" strokeWidth={2.5} />
      )}
    </button>
  )
}
