import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import { useAuth } from '../auth/useAuth.ts'
import { ChevronRightIcon, MenuIcon, PanelLeftIcon } from '../components/icons.tsx'
import { LanguageSwitcher } from '../components/LanguageSwitcher.tsx'
import { initials } from './initials.ts'
import { useShell } from './useShell.ts'

type SectionKey = 'shell.sections.tasks' | 'shell.sections.newTask' | 'shell.sections.task'

function sectionKey(pathname: string): SectionKey {
  if (pathname === '/tasks/new') {
    return 'shell.sections.newTask'
  }
  return pathname.startsWith('/tasks/') ? 'shell.sections.task' : 'shell.sections.tasks'
}

/** Today as a long date in the reader's language, e.g. "Thursday, October 8", with a capital first letter. */
function formatToday(language: string): string {
  const text = new Intl.DateTimeFormat(language, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())
  return text.charAt(0).toLocaleUpperCase(language) + text.slice(1)
}

/** The bar above the page: sidebar toggle, where you are, today's date, language and avatar. */
export function Topbar() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const { sidebarCollapsed, toggleSidebarCollapsed, setDrawerOpen } = useShell()
  const { pathname } = useLocation()

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur-md sm:px-8">
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        aria-label={t('shell.openMenu')}
        className="btn btn-ghost -ml-2 p-2 lg:hidden"
      >
        <MenuIcon className="size-5" />
      </button>
      <button
        type="button"
        onClick={toggleSidebarCollapsed}
        aria-label={sidebarCollapsed ? t('shell.expand') : t('shell.collapse')}
        className="btn btn-ghost -ml-2 hidden p-2 lg:inline-flex"
      >
        <PanelLeftIcon className={`size-5 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
      </button>
      <p className="flex min-w-0 items-center gap-2 text-sm">
        <span className="hidden text-stone-500 sm:inline">{t('shell.workspaceName')}</span>
        <ChevronRightIcon className="hidden size-3.5 text-stone-400 sm:block" />
        <span className="truncate font-medium text-stone-900">{t(sectionKey(pathname))}</span>
      </p>
      <div className="ml-auto flex items-center gap-2 sm:gap-4">
        <span className="hidden text-xs text-stone-500 md:inline">{formatToday(i18n.language)}</span>
        <LanguageSwitcher />
        {user && (
          <span
            aria-hidden="true"
            className="flex size-8 items-center justify-center rounded-full border border-line bg-sage-50 text-xs font-semibold text-brand-800"
          >
            {initials(user.name)}
          </span>
        )}
      </div>
    </header>
  )
}
