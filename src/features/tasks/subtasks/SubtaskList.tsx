import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import type { SubtaskSummary } from '../../../api/tasks.ts'
import { CalendarIcon } from '../../../components/icons.tsx'
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
    return (
      <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
        {t('subtasks.empty')}
      </p>
    )
  }
  return (
    <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
      {subtasks.map((subtask) => (
        <li
          key={subtask.id}
          className={`flex flex-wrap items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50/80 ${subtask.status === 'OVERDUE' ? 'bg-red-50/40 shadow-[inset_3px_0_0_var(--color-red-500)]' : ''}`}
        >
          <Link
            to={`/tasks/${encodeURIComponent(subtask.id)}`}
            className={`min-w-0 flex-1 truncate font-medium transition-colors hover:text-brand-700 ${subtask.status === 'DONE' ? 'text-slate-400 line-through' : 'text-slate-900'}`}
          >
            {subtask.title}
          </Link>
          {subtask.subtaskCount > 0 && (
            <span className="tag">
              {t('subtasks.count', { count: subtask.subtaskCount })}
            </span>
          )}
          <StatusBadge status={subtask.status} />
          <PriorityBadge priority={subtask.priority} />
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <CalendarIcon className="size-3.5" />
            <span className="sr-only">{t('fields.dueDate')}: </span>
            {subtask.dueDate ? formatDueDate(subtask.dueDate, i18n.language) : t('detail.noDueDate')}
          </span>
        </li>
      ))}
    </ul>
  )
}
