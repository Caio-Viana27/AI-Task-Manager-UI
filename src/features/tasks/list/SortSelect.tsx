import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import type { TaskSort } from '../../../api/tasks.ts'
import { ChevronDownIcon, SortIcon } from '../../../components/icons.tsx'
import { SORT_OPTIONS } from './dashboardParams.ts'

interface SortSelectProps {
  value: TaskSort
  onChange: (sort: TaskSort) => void
}

type SortLabelKey<S extends TaskSort> = S extends `${infer Field},${infer Direction}` ? `list.sort.${Field}_${Direction}` : never

/** `dueDate,asc` → the i18n key `list.sort.dueDate_asc`. */
function sortKey(sort: TaskSort): SortLabelKey<TaskSort> {
  return `list.sort.${sort.replace(',', '_')}` as SortLabelKey<TaskSort>
}

/** A compact native select with a sort icon. Its label is for screen readers only. */
export function SortSelect({ value, onChange }: SortSelectProps) {
  const { t } = useTranslation('tasks')
  const id = useId()

  return (
    <div className="relative flex items-center">
      <label htmlFor={id} className="sr-only">
        {t('list.sort.label')}
      </label>
      <SortIcon className="pointer-events-none absolute left-3 size-4 text-stone-500" />
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(SORT_OPTIONS.find((option) => option === event.target.value) ?? value)}
        className="h-10 cursor-pointer appearance-none rounded-lg border border-line bg-white pr-8 pl-9 text-sm text-stone-700 shadow-xs transition-colors hover:bg-stone-50 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 focus:outline-none"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {t(sortKey(option))}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-2.5 size-4 text-stone-400" />
    </div>
  )
}
