import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { useLookups } from '../../../api/queries/tasks.ts'
import { ErrorMessage } from '../../../components/ErrorMessage.tsx'
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
    <fieldset className="flex flex-col gap-1">
      <legend className="mb-1 text-sm font-medium text-slate-700">{legend}</legend>
      {options.map((option) => (
        <label key={option} className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={selected.includes(option)}
            onChange={(event) => toggle(option, event.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          {label(option)}
        </label>
      ))}
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
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        type="date"
        value={value ?? ''}
        // The native input gives `YYYY-MM-DD` or '' (cleared or incomplete); it's never parsed into a Date.
        onChange={(event) => onChange(isIsoDate(event.target.value) ? event.target.value : undefined)}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
    </div>
  )
}

/** Status, priority and complexity multi-selects, a due-date range, text search and the subtask toggle. */
export function TaskFiltersPanel({ state, onChange, onClear }: TaskFiltersPanelProps) {
  const { t } = useTranslation('tasks')
  const lookups = useLookups()

  return (
    <section aria-label={t('list.filters.label')} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
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
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
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

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={state.includeSubtasks}
            onChange={(event) => onChange({ includeSubtasks: event.target.checked })}
            className="h-4 w-4 rounded border-slate-300"
          />
          {t('list.filters.includeSubtasks')}
        </label>
        {hasActiveFilters(state) && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-100"
          >
            {t('list.filters.clear')}
          </button>
        )}
      </div>
    </section>
  )
}
