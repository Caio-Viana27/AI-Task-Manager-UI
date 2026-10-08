import { useTranslation } from 'react-i18next'
import { CalendarIcon } from '../../../components/icons.tsx'
import { todayIso } from './dates.ts'
import { formatDueDate, formatDueDateShort, relativeDueDay } from './formatDueDate.ts'

interface DueDateProps {
  date: string | null
  /** Shows it in red. Comes from the `OVERDUE` status, never from comparing dates (D6). */
  overdue?: boolean
  className?: string
}

/** A calendar icon and the due date: "Today", "Tomorrow" or a short date, with the full date on hover. */
export function DueDate({ date, overdue = false, className }: DueDateProps) {
  const { t, i18n } = useTranslation('tasks')
  const today = todayIso()
  const relative = date ? relativeDueDay(date, today) : undefined
  const text = !date
    ? t('list.noDueDate')
    : relative === 'today'
      ? t('list.dueToday')
      : relative === 'tomorrow'
        ? t('list.dueTomorrow')
        : formatDueDateShort(date, i18n.language, today)

  return (
    <span
      title={date ? formatDueDate(date, i18n.language) : undefined}
      className={`inline-flex items-center gap-1.5 text-xs whitespace-nowrap ${
        overdue ? 'font-semibold text-red-700' : relative ? 'font-medium text-stone-800' : 'text-stone-500'
      } ${className ?? ''}`}
    >
      <CalendarIcon className="size-3.5 shrink-0" />
      <span className="sr-only">{t('fields.dueDate')}: </span>
      {text}
    </span>
  )
}
