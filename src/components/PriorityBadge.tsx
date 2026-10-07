import { useTranslation } from 'react-i18next'
import type { TaskPriority } from '../api/tasks.ts'
import { Badge } from './Badge.tsx'

const COLORS: Record<TaskPriority, string> = {
  LOW: 'bg-slate-100 text-slate-700 ring-slate-300',
  MEDIUM: 'bg-amber-50 text-amber-800 ring-amber-300',
  HIGH: 'bg-red-50 text-red-700 ring-red-300',
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
