import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useTasks } from '../../../api/queries/tasks.ts'
import { ErrorMessage } from '../../../components/ErrorMessage.tsx'
import { InboxIcon, PlusIcon } from '../../../components/icons.tsx'
import { hasActiveFilters, toTaskFilters, type DashboardState } from './dashboardParams.ts'
import { Pagination } from './Pagination.tsx'
import { TaskRow } from './TaskRow.tsx'

interface TaskListProps {
  state: DashboardState
  onPageChange: (page: number) => void
  onClearFilters: () => void
}

const SECONDARY_BUTTON = 'btn btn-secondary'

function EmptyState({ title, body, children }: { title: string; body?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <InboxIcon className="size-6" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-slate-800">{title}</h2>
      {body && <p className="mt-1 max-w-sm text-sm text-slate-500">{body}</p>}
      {children && <div className="mt-6 flex justify-center">{children}</div>}
    </div>
  )
}

/** One page of tasks for the dashboard state, with its loading, error and empty states. */
export function TaskList({ state, onPageChange, onClearFilters }: TaskListProps) {
  const { t } = useTranslation('tasks')
  const query = useTasks(toTaskFilters(state))

  if (query.isPending) {
    return (
      <div role="status" className="card divide-y divide-slate-100 overflow-hidden">
        <span className="sr-only">{t('list.loading')}</span>
        {[0, 1, 2, 3].map((row) => (
          <div key={row} aria-hidden="true" className="flex items-center gap-3 px-5 py-4">
            <div className="size-4 animate-pulse rounded-full bg-slate-200" />
            <div className="h-4 flex-1 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-16 animate-pulse rounded-full bg-slate-100" />
            <div className="h-4 w-16 animate-pulse rounded-full bg-slate-100" />
          </div>
        ))}
      </div>
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
        <Link to="/tasks/new" className="btn btn-primary">
          <PlusIcon />
          {t('list.newTask')}
        </Link>
      </EmptyState>
    )
  }

  return (
    <div className="flex flex-col gap-3" aria-busy={query.isPlaceholderData}>
      <p className="px-1 text-xs font-medium tracking-wide text-slate-500 uppercase">
        {t('list.count', { count: totalElements })}
      </p>
      <ul
        className={`card divide-y divide-slate-100 overflow-hidden transition-opacity ${query.isPlaceholderData ? 'opacity-60' : ''}`}
      >
        {content.map((task) => (
          <TaskRow key={task.id} task={task} />
        ))}
      </ul>
      {totalPages > 1 && <Pagination page={state.page} totalPages={totalPages} onPageChange={onPageChange} />}
    </div>
  )
}
