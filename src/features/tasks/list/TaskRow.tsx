import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import type { Task } from '../../../api/tasks.ts'
import { ComplexityBadge } from '../../../components/ComplexityBadge.tsx'
import { ErrorMessage } from '../../../components/ErrorMessage.tsx'
import { CalendarIcon, ChevronRightIcon, ListTreeIcon } from '../../../components/icons.tsx'
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
      className={`group relative flex flex-col gap-2 px-4 py-3.5 transition-colors hover:bg-stone-50/80 sm:px-5 ${
        overdue ? 'bg-red-50/40 shadow-[inset_3px_0_0_var(--color-red-500)]' : ''
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <input
          type="checkbox"
          checked={done}
          disabled={toggle.isPending}
          aria-label={t(done ? 'list.markNotDone' : 'list.markDone', { title: task.title })}
          onChange={(event) => toggle.mutate({ task, done: event.target.checked })}
          className="size-4.5 shrink-0 cursor-pointer rounded-full disabled:cursor-wait"
        />
        <Link
          to={`/tasks/${encodeURIComponent(task.id)}`}
          className={`min-w-0 flex-1 truncate font-medium transition-colors hover:text-brand-700 ${done ? 'text-stone-400 line-through' : 'text-stone-900'}`}
        >
          {task.title}
        </Link>
        {task.parentTaskId && (
          <span className="tag">
            <ListTreeIcon className="size-3" />
            {t('list.subtask')}
          </span>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
          <ComplexityBadge complexity={task.complexity} />
          <span
            className={`inline-flex min-w-28 items-center gap-1.5 text-xs ${overdue ? 'font-semibold text-red-700' : 'text-stone-500'}`}
          >
            <CalendarIcon className="size-3.5" />
            <span className="sr-only">{t('fields.dueDate')}: </span>
            {task.dueDate ? formatDueDate(task.dueDate, i18n.language) : t('list.noDueDate')}
          </span>
          <ChevronRightIcon className="hidden size-4 text-stone-300 transition-transform group-hover:transtone-x-0.5 group-hover:text-stone-400 sm:block" />
        </div>
      </div>
      <ErrorMessage error={toggle.error} />
    </li>
  )
}
