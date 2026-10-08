import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'
import { useAuth } from '../auth/useAuth.ts'
import { Accent } from '../components/Accent.tsx'
import {
  CalendarDaysIcon,
  CalendarIcon,
  CheckCircleIcon,
  LayoutListIcon,
  LeafIcon,
  LogoMark,
  LogoutIcon,
  SparklesIcon,
  XIcon,
} from '../components/icons.tsx'
import { parseDashboardParams } from '../features/tasks/list/dashboardParams.ts'
import { todayIso } from '../features/tasks/list/dates.ts'
import { useDashboardCounts } from '../features/tasks/list/useDashboardCounts.ts'
import { activeView, viewHref, type TaskView } from '../features/tasks/list/views.ts'
import { initials } from './initials.ts'
import { useShell } from './useShell.ts'

type ViewLabelKey = 'nav.allTasks' | 'nav.today' | 'nav.upcoming' | 'nav.completed'

const VIEW_ITEMS: readonly { view: TaskView; labelKey: ViewLabelKey; icon: ReactNode }[] = [
  { view: 'all', labelKey: 'nav.allTasks', icon: <LayoutListIcon className="size-[18px]" /> },
  { view: 'today', labelKey: 'nav.today', icon: <CalendarIcon className="size-[18px]" /> },
  { view: 'upcoming', labelKey: 'nav.upcoming', icon: <CalendarDaysIcon className="size-[18px]" /> },
  { view: 'completed', labelKey: 'nav.completed', icon: <CheckCircleIcon className="size-[18px]" /> },
]

/** The task counts shown next to the views. "Upcoming" has none, as in the design. */
function useViewCounts(today: string): Partial<Record<TaskView, number>> {
  const counts = useDashboardCounts(today)
  return { all: counts.all, today: counts.today, completed: counts.done }
}

/**
 * The signed-in navigation: the views of the task list, the assistant toggle, and the account.
 * A sticky column on wide screens (collapsible to icons), a drawer on small ones.
 */
export function Sidebar() {
  const { t } = useTranslation(['common', 'chat'])
  const { user, logout } = useAuth()
  const { sidebarCollapsed: collapsed, drawerOpen, setDrawerOpen, assistantOpen, setAssistantOpen, assistantId } = useShell()
  const location = useLocation()
  const today = todayIso()
  const counts = useViewCounts(today)
  const current =
    location.pathname === '/' ? activeView(parseDashboardParams(new URLSearchParams(location.search)), today) : undefined
  // On wide screens a collapsed sidebar keeps its labels for screen readers only.
  const label = collapsed ? 'lg:sr-only' : ''
  const closeDrawer = () => setDrawerOpen(false)

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-brand-900 text-brand-100 transition-[translate,width] duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
        drawerOpen ? 'translate-x-0' : '-translate-x-full max-lg:invisible'
      } ${collapsed ? 'lg:w-[4.75rem]' : 'lg:w-64'}`}
    >
      <div className={`flex items-center gap-3 px-5 pt-6 pb-5 ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}>
        <Link to="/" onClick={closeDrawer} className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight text-white">
          <LogoMark className="size-9" />
          <span className={label}>
            {t('app.name')}
            <Accent />
          </span>
        </Link>
        <button
          type="button"
          onClick={closeDrawer}
          aria-label={t('shell.closeMenu')}
          className="btn btn-sm ml-auto p-1.5 text-brand-200 hover:bg-white/10 hover:text-white lg:hidden"
        >
          <XIcon className="size-5" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-4">
        <div
          className={`flex items-center gap-3 rounded-xl border border-white/10 p-3 ${collapsed ? 'lg:justify-center lg:border-transparent lg:p-1' : ''}`}
        >
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-sm font-semibold text-white"
          >
            {user ? initials(user.name).slice(0, 1) : ''}
          </span>
          <span className={`flex min-w-0 flex-col ${label}`}>
            <span className="truncate text-sm font-medium text-white">{t('shell.workspaceName')}</span>
            <span className="truncate text-xs text-brand-200/70">{t('shell.workspaceKind')}</span>
          </span>
        </div>

        <nav aria-label={t('nav.label')} className="mt-7 flex flex-col gap-7">
          <div>
            <p className={`eyebrow mb-2 px-3 text-brand-200/60 ${label}`}>{t('nav.workspaceGroup')}</p>
            <ul className="flex flex-col gap-1">
              {VIEW_ITEMS.map(({ view, labelKey, icon }) => {
                const active = current === view
                const count = counts[view]
                return (
                  <li key={view}>
                    <Link
                      to={viewHref(view, today)}
                      onClick={closeDrawer}
                      aria-current={active ? 'page' : undefined}
                      title={collapsed ? t(labelKey) : undefined}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        active ? 'bg-white/10 text-white' : 'text-brand-100/80 hover:bg-white/5 hover:text-white'
                      } ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}
                    >
                      {icon}
                      <span className={`flex-1 ${label}`}>{t(labelKey)}</span>
                      {count !== undefined && count > 0 && (
                        <span
                          aria-hidden="true"
                          className={`rounded-md px-1.5 text-xs tabular-nums ${active ? 'bg-white/15 text-white' : 'text-brand-200/70'} ${
                            collapsed ? 'lg:hidden' : ''
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          <div>
            <p className={`eyebrow mb-2 px-3 text-brand-200/60 ${label}`}>{t('nav.assistantGroup')}</p>
            <button
              type="button"
              aria-expanded={assistantOpen}
              aria-controls={assistantId}
              aria-label={assistantOpen ? t('chat:panel.close') : t('chat:panel.open')}
              title={collapsed ? t('nav.assistant') : undefined}
              onClick={() => {
                setAssistantOpen(!assistantOpen)
                closeDrawer()
              }}
              className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                assistantOpen ? 'bg-white/10 text-white' : 'text-brand-100/80 hover:bg-white/5 hover:text-white'
              } ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}
            >
              <SparklesIcon className="size-[18px]" />
              <span className={`flex-1 text-left ${label}`}>{t('nav.assistant')}</span>
              <span
                aria-hidden="true"
                className={`rounded border border-white/15 px-1.5 text-[0.625rem] font-semibold tracking-wide text-brand-200 uppercase ${
                  collapsed ? 'lg:hidden' : ''
                }`}
              >
                {t('nav.newTag')}
              </span>
            </button>
          </div>
        </nav>

        <div
          className={`mt-auto flex min-h-44 flex-col justify-end rounded-xl bg-brand-950/70 bg-[radial-gradient(circle_at_75%_15%,rgb(143_179_138/0.28),transparent_60%)] p-5 ring-1 ring-white/5 ${
            collapsed ? 'lg:hidden' : ''
          } [@media(max-height:760px)]:hidden`}
        >
          <LeafIcon className="size-5 text-sage-300" />
          <p className="mt-3 text-2xl leading-tight font-light text-white">{t('shell.quote.title')}</p>
          <p className="mt-2 text-xs text-brand-200/70">{t('shell.quote.body')}</p>
        </div>
      </div>

      {user && (
        <div className={`flex items-center gap-3 border-t border-white/10 px-5 py-4 ${collapsed ? 'lg:flex-col lg:px-2' : ''}`}>
          <span
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sage-400 text-sm font-semibold text-brand-900"
          >
            {initials(user.name)}
          </span>
          <span className={`flex min-w-0 flex-1 flex-col ${label}`}>
            <span className="truncate text-sm font-medium text-white">{user.name}</span>
            <span className="truncate text-xs text-brand-200/70">{t('shell.account')}</span>
          </span>
          <button
            type="button"
            onClick={logout}
            aria-label={t('nav.logout')}
            title={t('nav.logout')}
            className="btn btn-sm p-2 text-brand-200 hover:bg-white/10 hover:text-white"
          >
            <LogoutIcon />
          </button>
        </div>
      )}
    </aside>
  )
}
