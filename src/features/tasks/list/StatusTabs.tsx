import { useTranslation } from 'react-i18next'
import type { TaskStatus } from '../../../api/tasks.ts'
import { STATUS_TAB_ORDER, statusTab, tabStatuses, type StatusTab } from './listControls.ts'

const LABEL_KEYS = {
  all: 'planning.tabs.all',
  todo: 'planning.tabs.todo',
  inProgress: 'planning.tabs.inProgress',
  done: 'planning.tabs.done',
} as const satisfies Record<StatusTab, string>

interface StatusTabsProps {
  status: readonly TaskStatus[]
  /** Shown next to "All". */
  allCount: number | undefined
  onChange: (status: TaskStatus[]) => void
}

/** All / To do / In progress / Completed, as toggle buttons over the status filter. */
export function StatusTabs({ status, allCount, onChange }: StatusTabsProps) {
  const { t } = useTranslation('tasks')
  const current = statusTab(status)

  return (
    <div role="group" aria-label={t('planning.tabs.label')} className="flex gap-6 overflow-x-auto border-b border-line">
      {STATUS_TAB_ORDER.map((tab) => {
        const active = current === tab
        return (
          <button
            key={tab}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(tabStatuses(tab))}
            className={`-mb-px flex shrink-0 cursor-pointer items-center gap-2 border-b-2 pt-1 pb-3 text-sm whitespace-nowrap transition-colors ${
              active
                ? 'border-brand-800 font-semibold text-brand-950'
                : 'border-transparent text-stone-500 hover:border-stone-300 hover:text-stone-800'
            }`}
          >
            {t(LABEL_KEYS[tab])}
            {tab === 'all' && allCount !== undefined && (
              <span aria-hidden="true" className="rounded bg-sage-100 px-1.5 text-[0.6875rem] font-semibold text-brand-700 tabular-nums">
                {allCount}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
