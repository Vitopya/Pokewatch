import { Settings } from 'lucide-react'
import type { AppShellUser, NavigationItem } from './AppShell'
import { ThemeToggle } from './ThemeToggle'

export interface MainNavProps {
  navigationItems?: NavigationItem[]
  user?: AppShellUser
  theme?: 'light' | 'dark'
  onNavigate?: (href: string) => void
  onLogout?: () => void
  onOpenSettings?: () => void
  onToggleTheme?: () => void
  onLogoClick?: () => void
}

const ISSUE_NUMBER = (() => {
  const start = new Date('2026-01-01T00:00:00Z')
  const now = new Date()
  const days = Math.floor((now.getTime() - start.getTime()) / 86_400_000)
  return String(days + 1).padStart(3, '0')
})()

export function MainNav({
  navigationItems = [],
  theme = 'light',
  onNavigate,
  onOpenSettings,
  onToggleTheme,
  onLogoClick,
}: MainNavProps) {
  return (
    <header
      data-tour="main-nav"
      className="relative z-30 h-12 md:h-14 shrink-0 flex items-center justify-between gap-2 sm:gap-3 px-3 md:px-5 bg-bone dark:bg-night border-b-2 border-ink dark:border-night-text"
    >
      <button
        type="button"
        onClick={onLogoClick}
        className="group flex items-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-vermillion focus-visible:ring-offset-2 focus-visible:ring-offset-bone dark:focus-visible:ring-offset-night px-1 -ml-1 min-w-0"
        aria-label="Gazette — accueil"
      >
        <img
          src="/logo.png"
          alt=""
          aria-hidden="true"
          className="h-7 w-7 md:h-8 md:w-8 object-contain shrink-0"
        />
        <span className="font-display font-black tracking-tighter text-[20px] md:text-[22px] leading-none text-ink dark:text-night-text">
          Gazette
        </span>
        <span className="hidden sm:inline font-mono text-[9px] uppercase tracking-[0.22em] text-vermillion shrink-0 self-center">
          № {ISSUE_NUMBER}
        </span>
      </button>

      {navigationItems.length > 0 && (
        <nav className="hidden md:flex items-center gap-4" aria-label="Navigation principale">
          {navigationItems.map((item) => (
            <button
              key={item.href}
              type="button"
              onClick={() => onNavigate?.(item.href)}
              className={[
                'cursor-pointer font-mono text-[11px] uppercase tracking-[0.18em] py-1 border-b-2 transition-colors',
                item.isActive
                  ? 'border-vermillion text-ink dark:text-night-text'
                  : 'border-transparent text-ink-3 hover:text-ink dark:text-night-text-3 dark:hover:text-night-text',
              ].join(' ')}
              aria-current={item.isActive ? 'page' : undefined}
            >
              {item.label}
            </button>
          ))}
        </nav>
      )}

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onOpenSettings}
          data-tour="settings-button"
          className="cursor-pointer inline-flex items-center gap-1.5 h-7 md:h-8 px-2.5 border-2 border-ink dark:border-night-text text-ink dark:text-night-text font-mono text-[10px] uppercase tracking-[0.18em] hover:bg-ink hover:text-bone dark:hover:bg-night-text dark:hover:text-night transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-vermillion"
          aria-label="Ouvrir les réglages"
          title="Réglages"
        >
          <Settings className="h-3 w-3" aria-hidden="true" strokeWidth={2.25} />
          <span className="hidden md:inline">Réglages</span>
        </button>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
    </header>
  )
}
