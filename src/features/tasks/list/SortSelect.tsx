import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import type { TaskSort } from '../../../api/tasks.ts'
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

export function SortSelect({ value, onChange }: SortSelectProps) {
  const { t } = useTranslation('tasks')
  const id = useId()

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {t('list.sort.label')}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(SORT_OPTIONS.find((option) => option === event.target.value) ?? value)}
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {t(sortKey(option))}
          </option>
        ))}
      </select>
    </div>
  )
}
