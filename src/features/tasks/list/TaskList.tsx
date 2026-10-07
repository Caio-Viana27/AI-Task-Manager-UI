import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useTasks } from '../../../api/queries/tasks.ts'
import { ErrorMessage } from '../../../components/ErrorMessage.tsx'
import { hasActiveFilters, toTaskFilters, type DashboardState } from './dashboardParams.ts'
import { Pagination } from './Pagination.tsx'
import { TaskRow } from './TaskRow.tsx'

interface TaskListProps {
  state: DashboardState
  onPageChange: (page: number) => void
  onClearFilters: () => void
}

const SECONDARY_BUTTON = 'rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-100'

function EmptyState({ title, body, children }: { title: string; body?: string; children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
      {body && <p className="mt-1 text-sm text-slate-600">{body}</p>}
      {children && <div className="mt-4 flex justify-center">{children}</div>}
    </div>
  )
}

/** One page of tasks for the dashboard state, with its loading, error and empty states. */
export function TaskList({ state, onPageChange, onClearFilters }: TaskListProps) {
  const { t } = useTranslation('tasks')
  const query = useTasks(toTaskFilters(state))

  if (query.isPending) {
    return (
      <p role="status" className="py-8 text-center text-sm text-slate-600">
        {t('list.loading')}
      </p>
    )
  }

  if (query.isError) {
    return (
      <div className="flex flex-col items-start gap-2">
        <ErrorMessage error={query.error} />
        <button type="button" onClick={() => void query.refetch()} className={SECONDARY_BUTTON}>
          {t('list.retry')}
        </button>
      </div>
    )
  }

  const { content, totalElements, totalPages } = query.data

  if (content.length === 0) {
    if (totalElements > 0) {
      // Past the last page, e.g. after tasks were deleted or from an old link.
      return (
        <EmptyState title={t('list.empty.pageTitle')}>
          <button type="button" onClick={() => onPageChange(1)} className={SECONDARY_BUTTON}>
            {t('list.empty.firstPage')}
          </button>
        </EmptyState>
      )
    }
    if (hasActiveFilters(state)) {
      return (
        <EmptyState title={t('list.empty.filteredTitle')} body={t('list.empty.filteredBody')}>
          <button type="button" onClick={onClearFilters} className={SECONDARY_BUTTON}>
            {t('list.filters.clear')}
          </button>
        </EmptyState>
      )
    }
    return (
      <EmptyState title={t('list.empty.title')} body={t('list.empty.body')}>
        <Link
          to="/tasks/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {t('list.newTask')}
        </Link>
      </EmptyState>
    )
  }

  return (
    <div className="flex flex-col gap-4" aria-busy={query.isPlaceholderData}>
      <p className="text-sm text-slate-600">{t('list.count', { count: totalElements })}</p>
      <ul
        className={`divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 shadow-sm ${query.isPlaceholderData ? 'opacity-60' : ''}`}
      >
        {content.map((task) => (
          <TaskRow key={task.id} task={task} />
        ))}
      </ul>
      {totalPages > 1 && <Pagination page={state.page} totalPages={totalPages} onPageChange={onPageChange} />}
    </div>
  )
}
