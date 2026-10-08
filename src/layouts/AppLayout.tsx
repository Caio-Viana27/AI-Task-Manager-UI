import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, Outlet } from 'react-router'
import { useAuth } from '../auth/useAuth.ts'
import { LogoMark, LogoutIcon } from '../components/icons.tsx'
import { LanguageSwitcher } from '../components/LanguageSwitcher.tsx'

interface AppLayoutProps {
  /** Slot for the chat assistant panel; the protected routes pass `ChatPanel` (wave 4, D7). */
  chatPanel?: ReactNode
}

const USER_LINKS = [
  { to: '/', labelKey: 'nav.dashboard', end: true },
  { to: '/tasks/new', labelKey: 'nav.newTask', end: false },
] as const

const GUEST_LINKS = [
  { to: '/login', labelKey: 'nav.login', end: false },
  { to: '/signup', labelKey: 'nav.signup', end: false },
] as const

/** Up to two initials for the avatar, e.g. "Ada Lovelace" → "AL". */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const letters = parts.length > 1 ? [parts[0], parts[parts.length - 1]] : parts
  return letters.map((part) => part[0]?.toUpperCase() ?? '').join('')
}

export function AppLayout({ chatPanel }: AppLayoutProps) {
  const { t } = useTranslation()
  const { status, user, logout } = useAuth()
  // While the session is loading or failed, show neither set of links.
  const links = status === 'authenticated' ? USER_LINKS : status === 'anonymous' ? GUEST_LINKS : []

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,var(--color-brand-100),transparent)] text-stone-900">
      <header className="sticky top-0 z-40 border-b border-line bg-white/75 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-stone-900">
            <LogoMark />
            {t('app.name')}
          </Link>
          <nav aria-label={t('nav.label')} className="flex flex-1 flex-wrap items-center gap-1 text-sm">
            {links.map(({ to, labelKey, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 font-medium transition-colors ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                  }`
                }
              >
                {t(labelKey)}
              </NavLink>
            ))}
          </nav>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <LanguageSwitcher />
            {user && (
              <>
                <span className="flex items-center gap-2 font-medium text-stone-700">
                  <span
                    aria-hidden="true"
                    className="inline-flex size-8 items-center justify-center rounded-full bg-sage-100 text-xs font-semibold text-brand-800 ring-1 ring-sage-200"
                  >
                    {initials(user.name)}
                  </span>
                  <span className="sr-only sm:not-sr-only">{user.name}</span>
                </span>
                <button type="button" onClick={logout} className="btn btn-ghost px-3 py-1.5">
                  <LogoutIcon />
                  {t('nav.logout')}
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row">
        <main className="min-w-0 flex-1 animate-fade-in">
          <Outlet />
        </main>
        {chatPanel && <aside className="w-full shrink-0 lg:w-96">{chatPanel}</aside>}
      </div>
    </div>
  )
}
