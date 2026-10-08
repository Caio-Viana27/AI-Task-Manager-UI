import { useTranslation } from 'react-i18next'
import type { TaskStatus } from '../api/tasks.ts'
import { Badge } from './Badge.tsx'

const COLORS: Record<TaskStatus, string> = {
  TODO: 'bg-slate-50 text-slate-700 ring-slate-200',
  IN_PROGRESS: 'bg-sky-50 text-sky-700 ring-sky-200',
  OVERDUE: 'bg-red-50 text-red-700 ring-red-200',
  DONE: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
}

const DOTS: Record<TaskStatus, string> = {
  TODO: 'bg-slate-400',
  IN_PROGRESS: 'bg-sky-500',
  OVERDUE: 'bg-red-500',
  DONE: 'bg-emerald-500',
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
      dotClassName={DOTS[status]}
      field={t('fields.status')} value={t(`status.${status}`)} />
  )
}
