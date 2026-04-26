import type { ReactNode } from 'react'
import { MainNav } from './MainNav'

export interface NavigationItem {
  label: string
  href: string
  isActive?: boolean
}

export interface AppShellUser {
  name: string
  avatarUrl?: string
}

export interface AppShellProps {
  children: ReactNode
  navigationItems?: NavigationItem[]
  user?: AppShellUser
  theme?: 'light' | 'dark'
  onNavigate?: (href: string) => void
  onLogout?: () => void
  onOpenSettings?: () => void
  onToggleTheme?: () => void
  onLogoClick?: () => void
}

export function AppShell({
  children,
  navigationItems = [],
  user,
  theme = 'light',
  onNavigate,
  onLogout,
  onOpenSettings,
  onToggleTheme,
  onLogoClick,
}: AppShellProps) {
  return (
    <div
      className="h-dvh max-h-dvh w-full max-w-full overflow-hidden flex flex-col bg-bone text-ink dark:bg-night dark:text-night-text font-sans selection:bg-ink selection:text-bone"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <a href="#main-content" className="skip-link">
        Aller au contenu principal
      </a>
      <MainNav
        navigationItems={navigationItems}
        user={user}
        theme={theme}
        onNavigate={onNavigate}
        onLogout={onLogout}
        onOpenSettings={onOpenSettings}
        onToggleTheme={onToggleTheme}
        onLogoClick={onLogoClick}
      />
      <main id="main-content" tabIndex={-1} className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
