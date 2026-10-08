import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import type { SubtaskSummary } from '../../../api/tasks.ts'
import { ListTreeIcon } from '../../../components/icons.tsx'
import { PriorityBadge } from '../../../components/PriorityBadge.tsx'
import { StatusDot } from '../../../components/StatusBadge.tsx'
import { DUE_COLUMN, PRIORITY_COLUMN } from '../list/columns.ts'
import { DueDate } from '../list/DueDate.tsx'

interface SubtaskListProps {
  /** Direct children, kept in API order (D5). */
  subtasks: SubtaskSummary[]
}

/** The direct subtasks, each linking to its own page and showing how many subtasks it has. */
export function SubtaskList({ subtasks }: SubtaskListProps) {
  const { t } = useTranslation('tasks')

  if (subtasks.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-stone-300 px-4 py-6 text-center text-sm text-stone-500">
        {t('subtasks.empty')}
      </p>
    )
  }
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line">
      {subtasks.map((subtask) => {
        const done = subtask.status === 'DONE'
        const overdue = subtask.status === 'OVERDUE'
        return (
          <li
            key={subtask.id}
            className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 transition-colors hover:bg-canvas/70 ${
              overdue ? 'bg-red-50/40 shadow-[inset_3px_0_0_var(--color-red-500)]' : ''
            } ${done ? 'opacity-60' : ''}`}
          >
            <div className="min-w-48 flex-1">
              <Link
                to={`/tasks/${encodeURIComponent(subtask.id)}`}
                className={`block truncate font-medium transition-colors hover:text-brand-700 ${
                  done ? 'text-stone-500 line-through' : 'text-stone-900'
                }`}
              >
                {subtask.title}
              </Link>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
                <StatusDot status={subtask.status} />
                {subtask.subtaskCount > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <ListTreeIcon className="size-3" />
                    {t('subtasks.count', { count: subtask.subtaskCount })}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={PRIORITY_COLUMN}>
                <PriorityBadge priority={subtask.priority} />
              </span>
              <DueDate date={subtask.dueDate} overdue={overdue} className={DUE_COLUMN} />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
