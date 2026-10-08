import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { useLookups } from '../../../api/queries/tasks.ts'
import { ErrorMessage } from '../../../components/ErrorMessage.tsx'
import { XIcon } from '../../../components/icons.tsx'
import { hasActiveFilters, isIsoDate, type DashboardState } from './dashboardParams.ts'
import { SearchInput } from './SearchInput.tsx'
import type { UpdateOptions } from './useDashboardParams.ts'

interface TaskFiltersPanelProps {
  state: DashboardState
  onChange: (changes: Partial<Omit<DashboardState, 'page'>>, options?: UpdateOptions) => void
  onClear: () => void
}

interface CheckboxGroupProps<T extends string> {
  legend: string
  options: readonly T[]
  selected: readonly T[]
  label: (value: T) => string
  onChange: (selected: T[]) => void
}

/** A multi-select as a group of checkboxes. The selection keeps the options' order. */
function CheckboxGroup<T extends string>({ legend, options, selected, label, onChange }: CheckboxGroupProps<T>) {
  function toggle(value: T, checked: boolean) {
    onChange(options.filter((option) => (option === value ? checked : selected.includes(option))))
  }

  return (
    <fieldset>
      <legend className="mb-2 text-xs font-semibold tracking-wide text-stone-500 uppercase">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-sm text-stone-600 transition-colors select-none hover:border-stone-300 hover:bg-stone-50 has-checked:border-brand-300 has-checked:bg-brand-50 has-checked:text-brand-800 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand-500"
          >
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={(event) => toggle(option, event.target.checked)}
              className="sr-only"
            />
            {label(option)}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

interface DateInputProps {
  label: string
  value: string | undefined
  onChange: (value: string | undefined) => void
}

function DateInput({ label, value, onChange }: DateInputProps) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <input
        id={id}
        type="date"
        value={value ?? ''}
        // The native input gives `YYYY-MM-DD` or '' (cleared or incomplete); it's never parsed into a Date.
        onChange={(event) => onChange(isIsoDate(event.target.value) ? event.target.value : undefined)}
        className="input"
      />
    </div>
  )
}

/** Status, priority and complexity multi-selects, a due-date range, text search and the subtask toggle. */
export function TaskFiltersPanel({ state, onChange, onClear }: TaskFiltersPanelProps) {
  const { t } = useTranslation('tasks')
  const lookups = useLookups()

  return (
    <section aria-label={t('list.filters.label')} className="card p-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <SearchInput value={state.q} onSearch={(q) => onChange({ q }, { replace: true })} />
        </div>
        <DateInput
          label={t('list.filters.dueFrom')}
          value={state.dueFrom}
          onChange={(dueFrom) => onChange({ dueFrom })}
        />
        <DateInput label={t('list.filters.dueTo')} value={state.dueTo} onChange={(dueTo) => onChange({ dueTo })} />
      </div>

      <ErrorMessage error={lookups.error} className="mt-4" />
      {lookups.data && (
        <div className="mt-5 grid gap-5 border-t border-stone-100 pt-5 sm:grid-cols-3">
          <CheckboxGroup
            legend={t('fields.status')}
            options={lookups.data.statuses}
            selected={state.status}
            label={(value) => t(`status.${value}`)}
            onChange={(status) => onChange({ status })}
          />
          <CheckboxGroup
            legend={t('fields.priority')}
            options={lookups.data.priorities}
            selected={state.priority}
            label={(value) => t(`priority.${value}`)}
            onChange={(priority) => onChange({ priority })}
          />
          <CheckboxGroup
            legend={t('fields.complexity')}
            options={lookups.data.complexities}
            selected={state.complexity}
            label={(value) => t(`complexity.${value}`)}
            onChange={(complexity) => onChange({ complexity })}
          />
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-stone-100 pt-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            checked={state.includeSubtasks}
            onChange={(event) => onChange({ includeSubtasks: event.target.checked })}
            className="size-4 cursor-pointer"
          />
          {t('list.filters.includeSubtasks')}
        </label>
        {hasActiveFilters(state) && (
          <button
            type="button"
            onClick={onClear}
            className="btn btn-ghost px-3 py-1.5"
          >
            <XIcon />
            {t('list.filters.clear')}
          </button>
        )}
      </div>
    </section>
  )
}
