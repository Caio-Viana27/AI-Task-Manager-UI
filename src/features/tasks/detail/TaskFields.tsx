import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { Task } from '../../../api/tasks.ts'
import { ComplexityBadge } from '../../../components/ComplexityBadge.tsx'
import { PriorityBadge } from '../../../components/PriorityBadge.tsx'
import { StatusBadge } from '../../../components/StatusBadge.tsx'
import { formatDueDate } from '../list/formatDueDate.ts'

/** A timestamp (an ISO-8601 instant, unlike a due date) in the reader's language and time zone. */
function formatInstant(instant: string, language: string): string {
  const date = new Date(instant)
  return Number.isNaN(date.getTime())
    ? instant
    : new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-900">{children}</dd>
    </div>
  )
}

interface TaskFieldsProps {
  task: Task
}

/** Every field of a task, read-only. */
export function TaskFields({ task }: TaskFieldsProps) {
  const { t, i18n } = useTranslation('tasks')
  // The overdue marker comes from the status the API sent, never from comparing dates (D6).
  const overdue = task.status === 'OVERDUE'

  return (
    <dl className="flex flex-col gap-4">
      <Field label={t('fields.description')}>
        <p className="whitespace-pre-wrap">{task.description}</p>
      </Field>
      <div className="grid gap-4 sm:grid-cols-4">
        <Field label={t('fields.status')}>
          <StatusBadge status={task.status} />
        </Field>
        <Field label={t('fields.priority')}>
          <PriorityBadge priority={task.priority} />
        </Field>
        <Field label={t('fields.complexity')}>
          <ComplexityBadge complexity={task.complexity} />
        </Field>
        <Field label={t('fields.dueDate')}>
          <span className={overdue ? 'font-medium text-red-700' : undefined}>
            {task.dueDate ? formatDueDate(task.dueDate, i18n.language) : t('detail.noDueDate')}
          </span>
        </Field>
      </div>
      <div className="grid gap-4 text-slate-600 sm:grid-cols-4">
        <Field label={t('detail.createdAt')}>{formatInstant(task.createdAt, i18n.language)}</Field>
        <Field label={t('detail.updatedAt')}>{formatInstant(task.updatedAt, i18n.language)}</Field>
      </div>
    </dl>
  )
}
