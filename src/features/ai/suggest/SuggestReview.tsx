import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SuggestResponse } from '../../../api/ai.ts'
import { SparklesIcon } from '../../../components/icons.tsx'
import type { AiSuggestFields } from '../AiSuggestSlot.tsx'

type Field = keyof AiSuggestFields

const FIELDS: readonly Field[] = ['title', 'description', 'priority', 'complexity']

const USE_KEYS = {
  title: 'suggest.useTitle',
  description: 'suggest.useDescription',
  priority: 'suggest.usePriority',
  complexity: 'suggest.useComplexity',
} as const

interface SuggestReviewProps {
  current: AiSuggestFields
  suggestion: SuggestResponse
  /** Called with only the fields the user chose. */
  onAccept: (changes: Partial<AiSuggestFields>) => void
  onDismiss: () => void
  /** True while the form is saving: nothing can be accepted then. */
  disabled: boolean
}

function suggestedValues(suggestion: SuggestResponse): AiSuggestFields {
  return {
    title: suggestion.suggestedTitle,
    description: suggestion.suggestedDescription,
    priority: suggestion.suggestedPriority,
    complexity: suggestion.suggestedComplexity,
  }
}

/** Current vs suggested values, one checkbox per field (PLAN §6, diff-style accept/reject view). */
export function SuggestReview({ current, suggestion, onAccept, onDismiss, disabled }: SuggestReviewProps) {
  const { t } = useTranslation(['ai', 'tasks'])
  const [selected, setSelected] = useState<Record<Field, boolean>>({
    title: true,
    description: true,
    priority: true,
    complexity: true,
  })
  const suggested = suggestedValues(suggestion)
  const noneSelected = FIELDS.every((field) => !selected[field])

  function display(field: Field, values: AiSuggestFields): string {
    switch (field) {
      case 'priority':
        return t(`tasks:priority.${values.priority}`)
      case 'complexity':
        return values.complexity === '' ? t('tasks:complexity.none') : t(`tasks:complexity.${values.complexity}`)
      default:
        return values[field].trim() === '' ? t('suggest.empty') : values[field]
    }
  }

  function accept(fields: readonly Field[]) {
    const changes: Partial<AiSuggestFields> = {}
    for (const field of fields) {
      Object.assign(changes, { [field]: suggested[field] })
    }
    onAccept(changes)
  }

  return (
    <div role="group" aria-label={t('suggest.reviewTitle')} className="flex animate-fade-in flex-col gap-3 rounded-xl border border-sage-200 bg-white/80 p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-brand-900">
        <SparklesIcon className="size-4 text-brand-600" />
        {t('suggest.reviewTitle')}
      </h3>
      <ul className="flex flex-col gap-2">
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
            <dl className="mt-2 grid gap-2 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-stone-400">{t('suggest.current')}</dt>
                <dd className="break-words whitespace-pre-wrap text-stone-500 line-through decoration-stone-300">{display(field, current)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-brand-600">{t('suggest.suggested')}</dt>
                <dd className="rounded-md bg-sage-50 px-2 py-1 break-words whitespace-pre-wrap text-stone-900">{display(field, suggested)}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
      <div className="rounded-lg bg-sage-50/60 p-3 text-sm">
        <p className="text-xs font-semibold text-brand-700">{t('suggest.reasoning')}</p>
        <p className="mt-1 break-words whitespace-pre-wrap text-stone-700">{suggestion.reasoning}</p>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onDismiss}
          className="btn btn-ghost"
        >
          {t('suggest.dismiss')}
        </button>
        <button
          type="button"
          onClick={() => accept(FIELDS.filter((field) => selected[field]))}
          disabled={disabled || noneSelected}
          className="btn btn-ai-outline"
        >
          {t('suggest.acceptSelected')}
        </button>
        <button
          type="button"
          onClick={() => accept(FIELDS)}
          disabled={disabled}
          className="btn btn-ai"
        >
          {t('suggest.acceptAll')}
        </button>
      </div>
    </div>
  )
}
