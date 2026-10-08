import { useTranslation } from 'react-i18next'
import type { TaskStatus } from '../api/tasks.ts'
import { Badge } from './Badge.tsx'

const COLORS: Record<TaskStatus, string> = {
  TODO: 'bg-stone-50 text-stone-700 ring-stone-200',
  IN_PROGRESS: 'bg-sky-50 text-sky-700 ring-sky-200',
  OVERDUE: 'bg-red-50 text-red-700 ring-red-200',
  DONE: 'bg-sage-50 text-sage-600 ring-sage-200',
}

/** The dot color of each status. Shared by the badge and the inline `StatusDot`. */
const STATUS_DOTS: Record<TaskStatus, string> = {
  TODO: 'bg-amber-500',
  IN_PROGRESS: 'bg-sky-500',
  OVERDUE: 'bg-red-500',
  DONE: 'bg-sage-500',
}

interface StatusBadgeProps {
  /** The overdue marker comes from `OVERDUE` here, never from comparing dates (D6). */
  status: TaskStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useTranslation('tasks')
  return (
    <Badge
      colorClassName={COLORS[status]}
      dotClassName={STATUS_DOTS[status]}
      field={t('fields.status')} value={t(`status.${status}`)} />
  )
}

/** The status as a colored dot and plain text, for the meta line under a task title. */
export function StatusDot({ status }: StatusBadgeProps) {
  const { t } = useTranslation('tasks')
  return (
    <span className={`inline-flex items-center gap-1.5 ${status === 'OVERDUE' ? 'font-medium text-red-700' : ''}`}>
      <span aria-hidden="true" className={`size-1.5 rounded-full ${STATUS_DOTS[status]}`} />
      <span className="sr-only">{t('fields.status')}: </span>
      {t(`status.${status}`)}
    </span>
  )
}
