import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TaskAnalysis } from '../../../api/aiAnalysis.ts'
import type { Task } from '../../../api/tasks.ts'
import { SparklesIcon } from '../../../components/icons.tsx'
import type { TaskFormValues } from '../../tasks/form/taskForm.ts'

/** The edit-form fields an analysis may fill (wave 4, D14). */
export type AnalysisFields = Pick<TaskFormValues, 'priority' | 'complexity' | 'estimatedHours'>

type Field = keyof AnalysisFields

const FIELDS: readonly Field[] = ['priority', 'complexity', 'estimatedHours']

const USE_KEYS = {
  priority: 'usePriority',
  complexity: 'useComplexity',
  estimatedHours: 'useEstimatedHours',
} as const

interface AnalysisReviewProps {
  task: Task
  analysis: TaskAnalysis
  /** Called with only the checked fields, as form values. Nothing is saved yet. */
  onApply: (changes: Partial<AnalysisFields>) => void
  onDismiss: () => void
}

/**
 * Current vs suggested priority, complexity and hours, one checkbox per field (all checked),
 * and the AI's reason (wave 4, D14; PLAN §6, diff-style accept/reject view).
 */
export function AnalysisReview({ task, analysis, onApply, onDismiss }: AnalysisReviewProps) {
  const { t } = useTranslation(['aiAnalysis', 'tasks'])
  const [selected, setSelected] = useState<Record<Field, boolean>>({
    priority: true,
    complexity: true,
    estimatedHours: true,
  })
  const noneSelected = FIELDS.every((field) => !selected[field])

  function display(field: Field, source: 'current' | 'suggested'): string {
    const values = source === 'current' ? task : analysis
    switch (field) {
      case 'priority':
        return t(`tasks:priority.${values.priority}`)
      case 'complexity':
        return values.complexity === null ? t('tasks:complexity.none') : t(`tasks:complexity.${values.complexity}`)
      case 'estimatedHours':
        return values.estimatedHours === null
          ? t('tasks:detail.notEstimated')
          : t('tasks:detail.estimatedHours', { count: values.estimatedHours })
    }
  }

  function apply() {
    const suggested: AnalysisFields = {
      priority: analysis.priority,
      complexity: analysis.complexity,
      estimatedHours: String(analysis.estimatedHours),
    }
    const changes: Partial<AnalysisFields> = {}
    for (const field of FIELDS.filter((name) => selected[name])) {
      Object.assign(changes, { [field]: suggested[field] })
    }
    onApply(changes)
  }

  return (
    <section
      aria-label={t('reviewTitle')}
      className="flex animate-fade-in flex-col gap-3 rounded-xl border border-sage-200 bg-white/80 p-4"
    >
      <h2 className="flex items-center gap-2 text-sm font-semibold text-brand-900">
        <SparklesIcon className="size-4 text-brand-600" />
        {t('reviewTitle')}
      </h2>
      <ul className="grid gap-2 sm:grid-cols-3">
        {FIELDS.map((field) => (
          <li
            key={field}
            className="rounded-lg bg-white p-3 text-sm ring-1 ring-stone-200 transition-colors has-checked:ring-sage-300"
          >
            <label className="flex cursor-pointer items-center gap-2 font-medium text-stone-800">
              <input
                type="checkbox"
                checked={selected[field]}
                onChange={(event) => setSelected((current) => ({ ...current, [field]: event.target.checked }))}
              />
              {t(USE_KEYS[field])}
            </label>
            <dl className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <dt className="text-xs font-medium text-stone-400">{t('current')}</dt>
                <dd className="text-stone-500">{display(field, 'current')}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-brand-600">{t('suggested')}</dt>
                <dd className="rounded-md bg-sage-50 px-2 py-1 text-stone-900">{display(field, 'suggested')}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
      <div className="rounded-lg bg-sage-50/60 p-3 text-sm">
        <p className="text-xs font-semibold text-brand-700">{t('reason')}</p>
        <p className="mt-1 break-words whitespace-pre-wrap text-stone-700">{analysis.reason}</p>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onDismiss} className="btn btn-ghost">
          {t('dismiss')}
        </button>
        <button type="button" onClick={apply} disabled={noneSelected} className="btn btn-ai">
          {t('apply')}
        </button>
      </div>
    </section>
  )
}
