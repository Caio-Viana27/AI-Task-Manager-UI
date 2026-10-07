import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SuggestResponse } from '../../../api/ai.ts'
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
    <div role="group" aria-label={t('suggest.reviewTitle')} className="flex flex-col gap-3 rounded-md border border-violet-200 bg-violet-50 p-3">
      <h3 className="text-sm font-semibold text-violet-900">{t('suggest.reviewTitle')}</h3>
      <ul className="flex flex-col gap-3">
        {FIELDS.map((field) => (
          <li key={field} className="rounded-md bg-white p-2 text-sm">
            <label className="flex items-center gap-2 font-medium text-slate-800">
              <input
                type="checkbox"
                checked={selected[field]}
                onChange={(event) => setSelected((current) => ({ ...current, [field]: event.target.checked }))}
              />
              {t(USE_KEYS[field])}
            </label>
            <dl className="mt-1 grid gap-1 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-slate-500">{t('suggest.current')}</dt>
                <dd className="break-words whitespace-pre-wrap text-slate-600">{display(field, current)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">{t('suggest.suggested')}</dt>
                <dd className="break-words whitespace-pre-wrap text-slate-900">{display(field, suggested)}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
      <div className="text-sm">
        <p className="text-xs text-slate-500">{t('suggest.reasoning')}</p>
        <p className="break-words whitespace-pre-wrap text-slate-700">{suggestion.reasoning}</p>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {t('suggest.dismiss')}
        </button>
        <button
          type="button"
          onClick={() => accept(FIELDS.filter((field) => selected[field]))}
          disabled={disabled || noneSelected}
          className="rounded-md border border-violet-300 bg-white px-3 py-1.5 text-sm font-medium text-violet-800 hover:bg-violet-100 disabled:opacity-60"
        >
          {t('suggest.acceptSelected')}
        </button>
        <button
          type="button"
          onClick={() => accept(FIELDS)}
          disabled={disabled}
          className="rounded-md bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60"
        >
          {t('suggest.acceptAll')}
        </button>
      </div>
    </div>
  )
}
