import { Settings, Sparkles } from 'lucide-react'
import type { AppShellUser, NavigationItem } from './AppShell'
import { ThemeToggle } from './ThemeToggle'
import { UserMenu } from './UserMenu'

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

export function MainNav({
  navigationItems = [],
  user,
  theme = 'light',
  onNavigate,
  onLogout,
  onOpenSettings,
  onToggleTheme,
  onLogoClick,
}: MainNavProps) {
  return (
    <header className="sticky top-0 z-30 h-12 md:h-14 flex items-center justify-between px-3 md:px-6 bg-white/90 dark:bg-zinc-900/90 backdrop-blur border-b border-zinc-200 dark:border-zinc-800">
      <button
        type="button"
        onClick={onLogoClick}
        className="flex items-center gap-2 cursor-pointer rounded-md px-1.5 py-1 -ml-1.5 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        aria-label="Gazette — retour à l'accueil"
      >
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-sky-500 text-white shadow-sm">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="hidden sm:inline font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Gazette
        </span>
      </button>

      {navigationItems.length > 0 && (
        <nav className="hidden md:flex items-center gap-1" aria-label="Navigation principale">
          {navigationItems.map((item) => (
            <button
              key={item.href}
              type="button"
              onClick={() => onNavigate?.(item.href)}
              className={[
                'cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                item.isActive
                  ? 'bg-sky-100 text-sky-900 dark:bg-sky-500/15 dark:text-sky-200'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100',
              ].join(' ')}
              aria-current={item.isActive ? 'page' : undefined}
            >
              {item.label}
            </button>
          ))}
        </nav>
      )}

      <div className="flex items-center gap-1 md:gap-2">
        <button
          type="button"
          onClick={onOpenSettings}
          className="cursor-pointer inline-flex h-9 w-9 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          aria-label="Ouvrir paramètres"
          title="Paramètres"
        >
          <Settings className="h-4.5 w-4.5" aria-hidden="true" />
        </button>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        {user && <UserMenu user={user} onOpenSettings={onOpenSettings} onLogout={onLogout} />}
      </div>
    </header>
  )
}
