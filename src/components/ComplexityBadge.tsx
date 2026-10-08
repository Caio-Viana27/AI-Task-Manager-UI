import { useTranslation } from 'react-i18next'
import type { TaskComplexity } from '../api/tasks.ts'
import { Badge } from './Badge.tsx'

const COLORS: Record<TaskComplexity, string> = {
  EASY: 'bg-teal-50 text-teal-700 ring-teal-200',
  MEDIUM: 'bg-sage-50 text-brand-700 ring-sage-200',
  HARD: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200',
}

const NONE_COLOR = 'bg-white text-stone-400 ring-stone-200'

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
