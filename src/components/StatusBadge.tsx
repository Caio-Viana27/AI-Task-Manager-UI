import { useTranslation } from 'react-i18next'
import type { TaskStatus } from '../api/tasks.ts'
import { Badge } from './Badge.tsx'

const COLORS: Record<TaskStatus, string> = {
  TODO: 'bg-slate-100 text-slate-700 ring-slate-300',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 ring-blue-300',
  OVERDUE: 'bg-red-50 text-red-700 ring-red-300',
  DONE: 'bg-green-50 text-green-700 ring-green-300',
}

interface StatusBadgeProps {
  /** The overdue marker comes from `OVERDUE` here, never from comparing dates (D6). */
  status: TaskStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useTranslation('tasks')
  return (
    <Badge colorClassName={COLORS[status]} field={t('fields.status')} value={t(`status.${status}`)} />
  )
}
