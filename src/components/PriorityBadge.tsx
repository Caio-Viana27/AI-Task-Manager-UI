import { useTranslation } from 'react-i18next'
import type { TaskPriority } from '../api/tasks.ts'
import { Badge } from './Badge.tsx'
import { FlagIcon } from './icons.tsx'

const COLORS: Record<TaskPriority, string> = {
  LOW: 'bg-sage-50 text-sage-600 ring-sage-200',
  MEDIUM: 'bg-amber-50 text-amber-700 ring-amber-200',
  HIGH: 'bg-rose-50 text-rose-700 ring-rose-200',
}

interface PriorityBadgeProps {
  priority: TaskPriority
}

/** The priority as a small flag tag, as in the task table. */
export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const { t } = useTranslation('tasks')
  return (
    <Badge
      colorClassName={COLORS[priority]}
      icon={<FlagIcon className="size-3" />}
      shape="tag"
      field={t('fields.priority')}
      value={t(`priority.${priority}`)}
    />
  )
}
