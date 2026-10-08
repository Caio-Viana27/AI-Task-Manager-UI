import { useTranslation } from 'react-i18next'
import { Link, NavLink, Outlet } from 'react-router'
import { useAuth } from '../auth/useAuth.ts'
import { Accent } from '../components/Accent.tsx'
import { LogoMark } from '../components/icons.tsx'
import { LanguageSwitcher } from '../components/LanguageSwitcher.tsx'

const USER_LINKS = [{ to: '/', labelKey: 'nav.allTasks', end: true }] as const

const GUEST_LINKS = [
  { to: '/login', labelKey: 'nav.login', end: false },
  { to: '/signup', labelKey: 'nav.signup', end: false },
] as const

/** The layout of the pages outside the app: login, signup, password pages and "not found". */
export function PublicLayout() {
  const { t } = useTranslation()
  const { status } = useAuth()
  // While the session is loading or failed, show neither set of links.
  const links = status === 'authenticated' ? USER_LINKS : status === 'anonymous' ? GUEST_LINKS : []

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-stone-900">
      <header className="border-b border-line bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5 text-xl font-semibold tracking-tight text-brand-900">
            <LogoMark />
            <span>
              {t('app.name')}
              <Accent />
            </span>
          </Link>
          <nav aria-label={t('nav.label')} className="flex flex-1 flex-wrap items-center justify-end gap-1 text-sm">
            {links.map(({ to, labelKey, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 font-medium transition-colors ${
                    isActive ? 'bg-sage-100 text-brand-800' : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                  }`
                }
              >
                {t(labelKey)}
              </NavLink>
            ))}
          </nav>
          <LanguageSwitcher />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 animate-fade-in px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
