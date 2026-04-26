import { useEffect, useRef, useState } from 'react'
import { LogOut, Settings, User as UserIcon } from 'lucide-react'
import type { AppShellUser } from './AppShell'

export interface UserMenuProps {
  user: AppShellUser
  onOpenSettings?: () => void
  onLogout?: () => void
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function UserMenu({ user, onOpenSettings, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="cursor-pointer inline-flex h-7 w-7 md:h-8 md:w-8 items-center justify-center bg-ink text-bone dark:bg-night-text dark:text-night text-[10px] font-mono font-bold tracking-wider hover:bg-vermillion hover:text-paper dark:hover:bg-vermillion dark:hover:text-paper transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-vermillion focus-visible:ring-offset-2 focus-visible:ring-offset-bone dark:focus-visible:ring-offset-night"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Menu utilisateur — ${user.name}`}
      >
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span aria-hidden="true">{getInitials(user.name) || <UserIcon className="h-3.5 w-3.5" />}</span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 border-2 border-ink dark:border-night-text bg-paper dark:bg-night-paper shadow-[5px_5px_0_0_rgba(14,14,12,1)] dark:shadow-[5px_5px_0_0_rgba(232,226,212,0.4)] overflow-hidden"
        >
          <div className="px-3 py-2 border-b-2 border-ink dark:border-night-text">
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-ink-3 dark:text-night-text-3">
              Utilisateur
            </p>
            <p className="mt-0.5 font-display text-sm font-bold leading-tight text-ink dark:text-night-text truncate">
              {user.name}
            </p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onOpenSettings?.()
            }}
            className="cursor-pointer w-full flex items-center gap-2 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink hover:bg-bone-2 dark:text-night-text dark:hover:bg-night-2 transition-colors border-b border-rule dark:border-night-rule"
          >
            <Settings className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.25} />
            Réglages
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onLogout?.()
            }}
            className="cursor-pointer w-full flex items-center gap-2 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-vermillion hover:bg-vermillion hover:text-paper dark:hover:bg-vermillion dark:hover:text-paper transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.25} />
            Réinitialiser
          </button>
        </div>
      )}
    </div>
  )
}
