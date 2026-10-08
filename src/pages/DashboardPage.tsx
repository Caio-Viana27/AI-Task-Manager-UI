import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { PlusIcon } from '../components/icons.tsx'
import { SortSelect } from '../features/tasks/list/SortSelect.tsx'
import { TaskFiltersPanel } from '../features/tasks/list/TaskFiltersPanel.tsx'
import { TaskList } from '../features/tasks/list/TaskList.tsx'
import { useDashboardParams } from '../features/tasks/list/useDashboardParams.ts'

/** The task list with filters, sort and pagination, all kept in the URL (PLAN §4, §6). */
export function DashboardPage() {
  const { t } = useTranslation(['common', 'tasks'])
  const { state, update, setPage, clearFilters } = useDashboardParams()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">{t('pages.dashboard.title')}</h1>
          <p className="mt-1 text-sm text-stone-500">{t('pages.dashboard.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SortSelect value={state.sort} onChange={(sort) => update({ sort })} />
          <Link to="/tasks/new" className="btn btn-primary">
            <PlusIcon />
            {t('tasks:list.newTask')}
          </Link>
        </div>
      </div>
      <TaskFiltersPanel state={state} onChange={update} onClear={clearFilters} />
      <TaskList state={state} onPageChange={setPage} onClearFilters={clearFilters} />
    </div>
  )
}
