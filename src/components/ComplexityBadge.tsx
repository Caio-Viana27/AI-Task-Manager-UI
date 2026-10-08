import { useTranslation } from 'react-i18next'
import type { TaskComplexity } from '../api/tasks.ts'
import { Badge } from './Badge.tsx'

const COLORS: Record<TaskComplexity, string> = {
  EASY: 'bg-teal-50 text-teal-700 ring-teal-200',
  MEDIUM: 'bg-violet-50 text-violet-700 ring-violet-200',
  HARD: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200',
}

const NONE_COLOR = 'bg-white text-slate-400 ring-slate-200'

interface ComplexityBadgeProps {
  /** `null` when the task has no complexity yet; shown as "Not estimated". */
  complexity: TaskComplexity | null
}

export function ComplexityBadge({ complexity }: ComplexityBadgeProps) {
  const { t } = useTranslation('tasks')
  const value = complexity ? t(`complexity.${complexity}`) : t('complexity.none')
  return (
    <Badge
      colorClassName={complexity ? COLORS[complexity] : NONE_COLOR}
      field={t('fields.complexity')}
      value={value}
    />
  )
}
