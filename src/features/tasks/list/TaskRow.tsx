import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import type { Task } from '../../../api/tasks.ts'
import { ErrorMessage } from '../../../components/ErrorMessage.tsx'
import { CheckIcon, ListTreeIcon } from '../../../components/icons.tsx'
import { PriorityBadge } from '../../../components/PriorityBadge.tsx'
import { StatusDot } from '../../../components/StatusBadge.tsx'
import { DUE_COLUMN, PRIORITY_COLUMN } from './columns.ts'
import { DueDate } from './DueDate.tsx'
import { RowMenu } from './RowMenu.tsx'
import { useToggleTaskDone } from './useToggleTaskDone.ts'

interface TaskRowProps {
  task: Task
}

/**
 * One task in the table: a round done/undone check, the title linking to its page with its status
 * underneath, then the priority flag, the due date and the row menu.
 */
export function TaskRow({ task }: TaskRowProps) {
  const { t } = useTranslation('tasks')
  const toggle = useToggleTaskDone()
  const done = task.status === 'DONE'
  // The overdue marker comes from the status the API sent, never from comparing dates (D6).
  const overdue = task.status === 'OVERDUE'

  return (
    <li
      data-testid={`task-row-${task.id}`}
      className={`flex flex-col gap-2 px-4 py-4 transition-colors hover:bg-canvas/70 sm:px-5 ${
        overdue ? 'bg-red-50/40 shadow-[inset_3px_0_0_var(--color-red-500)]' : ''
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="relative flex size-5 shrink-0">
          <input
            type="checkbox"
            checked={done}
            disabled={toggle.isPending}
            aria-label={t(done ? 'list.markNotDone' : 'list.markDone', { title: task.title })}
            onChange={(event) => toggle.mutate({ task, done: event.target.checked })}
            className="peer size-5 cursor-pointer appearance-none rounded-full border-[1.5px] border-stone-300 bg-white transition-colors hover:border-brand-500 checked:border-brand-700 disabled:cursor-wait"
          />
          <CheckIcon
            strokeWidth={3}
            className="pointer-events-none absolute inset-0 m-auto hidden size-3 text-brand-700 peer-checked:block"
          />
        </span>
        <div className={`min-w-48 flex-1 ${done ? 'opacity-60' : ''}`}>
          <Link
            to={`/tasks/${encodeURIComponent(task.id)}`}
            className={`block truncate font-medium transition-colors hover:text-brand-700 ${
              done ? 'text-stone-500 line-through' : 'text-stone-900'
            }`}
          >
            {task.title}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
            <StatusDot status={task.status} />
            {task.parentTaskId && (
              <span className="inline-flex items-center gap-1">
                <ListTreeIcon className="size-3" />
                {t('list.subtask')}
              </span>
            )}
          </div>
        </div>
        <div className={`ml-9 flex items-center gap-4 sm:ml-0 ${done ? 'opacity-60' : ''}`}>
          <span className={PRIORITY_COLUMN}>
            <PriorityBadge priority={task.priority} />
          </span>
          <DueDate date={task.dueDate} overdue={overdue} className={DUE_COLUMN} />
        </div>
        <RowMenu task={task} />
      </div>
      <ErrorMessage error={toggle.error} className="ml-9" />
    </li>
  )
}
