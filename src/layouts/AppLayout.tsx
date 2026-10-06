import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, Outlet } from 'react-router'
import { LanguageSwitcher } from '../components/LanguageSwitcher.tsx'

interface AppLayoutProps {
  /** Slot for the chat assistant panel (Wave 4). Empty until then. */
  chatPanel?: ReactNode
}

const NAV_LINKS = [
  { to: '/', labelKey: 'nav.dashboard', end: true },
  { to: '/tasks/new', labelKey: 'nav.newTask', end: false },
  { to: '/login', labelKey: 'nav.login', end: false },
  { to: '/signup', labelKey: 'nav.signup', end: false },
] as const

export function AppLayout({ chatPanel }: AppLayoutProps) {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="text-lg font-semibold">
            {t('app.name')}
          </Link>
          <nav aria-label={t('nav.label')} className="flex flex-wrap gap-4 text-sm">
            {NAV_LINKS.map(({ to, labelKey, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  isActive ? 'font-semibold text-slate-900' : 'text-slate-600 hover:text-slate-900'
                }
              >
                {t(labelKey)}
              </NavLink>
            ))}
          </nav>
          <LanguageSwitcher />
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 px-4 py-6">
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
        {chatPanel && <aside className="w-80 shrink-0">{chatPanel}</aside>}
      </div>
    </div>
  )
}
