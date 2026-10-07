import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import type { Task } from '../../../api/tasks.ts'
import { ComplexityBadge } from '../../../components/ComplexityBadge.tsx'
import { ErrorMessage } from '../../../components/ErrorMessage.tsx'
import { PriorityBadge } from '../../../components/PriorityBadge.tsx'
import { StatusBadge } from '../../../components/StatusBadge.tsx'
import { formatDueDate } from './formatDueDate.ts'
import { useToggleTaskDone } from './useToggleTaskDone.ts'

interface TaskRowProps {
  task: Task
}

/** One task in the list: a done/undone toggle, the title linking to its page, its badges and due date. */
export function TaskRow({ task }: TaskRowProps) {
  const { t, i18n } = useTranslation('tasks')
  const toggle = useToggleTaskDone()
  const done = task.status === 'DONE'
  // The overdue marker comes from the status the API sent, never from comparing dates (D6).
  const overdue = task.status === 'OVERDUE'

  return (
    <li
      data-testid={`task-row-${task.id}`}
      className={`flex flex-col gap-2 border-l-4 bg-white px-4 py-3 ${overdue ? 'border-red-500' : 'border-transparent'}`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="checkbox"
          checked={done}
          disabled={toggle.isPending}
          aria-label={t(done ? 'list.markNotDone' : 'list.markDone', { title: task.title })}
          onChange={(event) => toggle.mutate({ task, done: event.target.checked })}
          className="h-4 w-4 rounded border-slate-300"
        />
        <Link
          to={`/tasks/${encodeURIComponent(task.id)}`}
          className={`min-w-0 flex-1 truncate font-medium hover:underline ${done ? 'text-slate-500 line-through' : 'text-slate-900'}`}
        >
          {task.title}
        </Link>
        {task.parentTaskId && (
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{t('list.subtask')}</span>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
          <ComplexityBadge complexity={task.complexity} />
          <span className={`text-sm ${overdue ? 'font-medium text-red-700' : 'text-slate-600'}`}>
            <span className="sr-only">{t('fields.dueDate')}: </span>
            {task.dueDate ? formatDueDate(task.dueDate, i18n.language) : t('list.noDueDate')}
          </span>
        </div>
      </div>
      <ErrorMessage error={toggle.error} />
    </li>
  )
}
