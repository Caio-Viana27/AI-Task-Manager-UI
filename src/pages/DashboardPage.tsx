import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useTasks } from '../api/queries/tasks.ts'
import { Accent } from '../components/Accent.tsx'
import { PlusIcon, SlidersIcon } from '../components/icons.tsx'
import { toTaskFilters } from '../features/tasks/list/dashboardParams.ts'
import { panelFilterCount } from '../features/tasks/list/listControls.ts'
import { SearchInput } from '../features/tasks/list/SearchInput.tsx'
import { SortSelect } from '../features/tasks/list/SortSelect.tsx'
import { StatsStrip } from '../features/tasks/list/StatsStrip.tsx'
import { StatusTabs } from '../features/tasks/list/StatusTabs.tsx'
import { TaskFiltersPanel } from '../features/tasks/list/TaskFiltersPanel.tsx'
import { TaskList } from '../features/tasks/list/TaskList.tsx'
import { todayIso } from '../features/tasks/list/dates.ts'
import { useDashboardCounts } from '../features/tasks/list/useDashboardCounts.ts'
import { useDashboardParams } from '../features/tasks/list/useDashboardParams.ts'

/** The task list with tabs, search, filters, sort and pagination, all kept in the URL (PLAN §4, §6). */
export function DashboardPage() {
  const { t } = useTranslation(['common', 'tasks'])
  const { state, update, setPage, clearFilters } = useDashboardParams()
  const counts = useDashboardCounts(todayIso())
  // Shares the list's query, so it costs no extra request.
  const list = useTasks(toTaskFilters(state))
  const [filtersOpen, setFiltersOpen] = useState(false)
  const filtersId = useId()
  const planningId = useId()
  const filterCount = panelFilterCount(state)

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow flex items-center gap-2">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-sage-500" />
            {t('pages.dashboard.eyebrow')}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-brand-950 sm:text-5xl">
            {t('pages.dashboard.title')}
            <Accent />
          </h1>
          <p className="mt-3 text-sm text-stone-500">{t('pages.dashboard.subtitle')}</p>
        </div>
        <Link to="/tasks/new" className="btn btn-primary px-5 py-2.5">
          <PlusIcon />
          {t('nav.newTask')}
        </Link>
      </header>

      <StatsStrip />

      <section aria-labelledby={planningId} className="flex flex-col gap-5">
        <h2 id={planningId} className="flex items-center gap-2 text-xl font-semibold tracking-tight text-brand-950">
          {t('tasks:planning.title')}
          {list.data && (
            <span aria-hidden="true" className="count-chip">
              {list.data.totalElements}
            </span>
          )}
        </h2>
        <StatusTabs status={state.status} allCount={counts.all} onChange={(status) => update({ status })} />
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={state.q} onSearch={(q) => update({ q }, { replace: true })} />
          <button
            type="button"
            aria-expanded={filtersOpen}
            aria-controls={filtersOpen ? filtersId : undefined}
            aria-label={
              filterCount > 0
                ? `${t('tasks:list.filters.toggle')} ${t('tasks:list.filters.activeCount', { count: filterCount })}`
                : undefined
            }
            onClick={() => setFiltersOpen((open) => !open)}
            className={`btn btn-secondary h-10 ${filtersOpen ? 'bg-stone-50' : ''}`}
          >
            <SlidersIcon />
            {t('tasks:list.filters.toggle')}
            {filterCount > 0 && (
              <span aria-hidden="true" className="rounded-full bg-brand-700 px-1.5 text-[0.6875rem] font-semibold text-white">
                {filterCount}
              </span>
            )}
          </button>
          <SortSelect value={state.sort} onChange={(sort) => update({ sort })} />
        </div>
        {filtersOpen && <TaskFiltersPanel id={filtersId} state={state} onChange={update} onClear={clearFilters} />}
        <TaskList state={state} onPageChange={setPage} onClearFilters={clearFilters} />
      </section>
    </div>
  )
}
