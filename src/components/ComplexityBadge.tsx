import { useTranslation } from 'react-i18next'
import type { TaskComplexity } from '../api/tasks.ts'
import { Badge } from './Badge.tsx'

const COLORS: Record<TaskComplexity, string> = {
  EASY: 'bg-emerald-50 text-emerald-700 ring-emerald-300',
  MEDIUM: 'bg-violet-50 text-violet-700 ring-violet-300',
  HARD: 'bg-fuchsia-50 text-fuchsia-800 ring-fuchsia-300',
}

const NONE_COLOR = 'bg-white text-slate-500 ring-slate-200'

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
