import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarDaysIcon, CheckCircleIcon, ListChecksIcon } from '../../../components/icons.tsx'
import { todayIso } from './dates.ts'
import { useDashboardCounts } from './useDashboardCounts.ts'

interface StatProps {
  icon: ReactNode
  iconClassName: string
  label: string
  value: number | undefined
  hint: string
}

function Stat({ icon, iconClassName, label, value, hint }: StatProps) {
  return (
    <div className="flex items-center gap-4 px-6 py-5">
      <span aria-hidden="true" className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${iconClassName}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-stone-500">{label}</dt>
        <dd className="mt-0.5 flex items-baseline gap-2">
          {value === undefined ? (
            <span aria-hidden="true" className="my-1 h-6 w-8 animate-pulse rounded bg-stone-200" />
          ) : (
            <span className="text-3xl leading-none font-semibold text-brand-950 tabular-nums">{value}</span>
          )}
          <span className="truncate text-xs text-stone-500">{hint}</span>
        </dd>
      </div>
    </div>
  )
}

/** Open, due-today and completed totals above the planning list. */
export function StatsStrip() {
  const { t } = useTranslation('tasks')
  const counts = useDashboardCounts(todayIso())

  return (
    <section aria-label={t('stats.label')} className="card">
      <dl className="grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <Stat
          icon={<ListChecksIcon className="size-5" />}
          iconClassName="bg-sage-100 text-brand-700"
          label={t('stats.open')}
          value={counts.open}
          hint={t('stats.openHint')}
        />
        <Stat
          icon={<CalendarDaysIcon className="size-5" />}
          iconClassName="bg-amber-50 text-amber-700"
          label={t('stats.today')}
          value={counts.today}
          hint={t('stats.todayHint')}
        />
        <Stat
          icon={<CheckCircleIcon className="size-5" />}
          iconClassName="bg-sage-100 text-brand-700"
          label={t('stats.done')}
          value={counts.done}
          hint={t('stats.doneHint')}
        />
      </dl>
    </section>
  )
}
