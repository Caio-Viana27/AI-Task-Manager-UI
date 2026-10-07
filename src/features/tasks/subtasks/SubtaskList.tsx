import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import type { SubtaskSummary } from '../../../api/tasks.ts'
import { PriorityBadge } from '../../../components/PriorityBadge.tsx'
import { StatusBadge } from '../../../components/StatusBadge.tsx'
import { formatDueDate } from '../list/formatDueDate.ts'

interface SubtaskListProps {
  /** Direct children, kept in API order (D5). */
  subtasks: SubtaskSummary[]
}

/** The direct subtasks, each linking to its own page and showing how many subtasks it has. */
export function SubtaskList({ subtasks }: SubtaskListProps) {
  const { t, i18n } = useTranslation('tasks')

  if (subtasks.length === 0) {
    return <p className="text-sm text-slate-600">{t('subtasks.empty')}</p>
  }
  return (
    <ul className="divide-y divide-slate-200 rounded-md border border-slate-200">
      {subtasks.map((subtask) => (
        <li
          key={subtask.id}
          className={`flex flex-wrap items-center gap-3 border-l-4 px-4 py-3 ${subtask.status === 'OVERDUE' ? 'border-red-500' : 'border-transparent'}`}
        >
          <Link
            to={`/tasks/${encodeURIComponent(subtask.id)}`}
            className={`min-w-0 flex-1 truncate font-medium hover:underline ${subtask.status === 'DONE' ? 'text-slate-500 line-through' : 'text-slate-900'}`}
          >
            {subtask.title}
          </Link>
          {subtask.subtaskCount > 0 && (
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
              {t('subtasks.count', { count: subtask.subtaskCount })}
            </span>
          )}
          <StatusBadge status={subtask.status} />
          <PriorityBadge priority={subtask.priority} />
          <span className="text-sm text-slate-600">
            <span className="sr-only">{t('fields.dueDate')}: </span>
            {subtask.dueDate ? formatDueDate(subtask.dueDate, i18n.language) : t('detail.noDueDate')}
          </span>
        </li>
      ))}
    </ul>
  )
}
