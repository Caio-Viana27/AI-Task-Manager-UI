import { useTranslation } from 'react-i18next'
import type { TaskPriority } from '../api/tasks.ts'
import { Badge } from './Badge.tsx'

const COLORS: Record<TaskPriority, string> = {
  LOW: 'bg-slate-50 text-slate-600 ring-slate-200',
  MEDIUM: 'bg-amber-50 text-amber-800 ring-amber-200',
  HIGH: 'bg-rose-50 text-rose-700 ring-rose-200',
}

interface PriorityBadgeProps {
  priority: TaskPriority
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const { t } = useTranslation('tasks')
  return (
    <Badge colorClassName={COLORS[priority]} field={t('fields.priority')} value={t(`priority.${priority}`)} />
  )
}
