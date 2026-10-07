import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{t('pages.dashboard.title')}</h1>
        <Link
          to="/tasks/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {t('tasks:list.newTask')}
        </Link>
      </div>
      <TaskFiltersPanel state={state} onChange={update} onClear={clearFilters} />
      <div className="flex justify-end">
        <SortSelect value={state.sort} onChange={(sort) => update({ sort })} />
      </div>
      <TaskList state={state} onPageChange={setPage} onClearFilters={clearFilters} />
    </div>
  )
}
