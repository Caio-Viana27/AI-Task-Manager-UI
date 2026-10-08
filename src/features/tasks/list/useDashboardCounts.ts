import { useTaskCount } from '../../../api/queries/tasks.ts'
import type { IsoDate } from '../../../api/tasks.ts'
import { OPEN_STATUSES } from './views.ts'

/**
 * The task totals the sidebar, the stats strip and the assistant show, all top-level like the
 * list's default. Each one is a separate count query, shared by every component that asks.
 */
export function useDashboardCounts(today: IsoDate) {
  const all = useTaskCount({})
  const open = useTaskCount({ status: [...OPEN_STATUSES] })
  const dueToday = useTaskCount({ status: [...OPEN_STATUSES], dueFrom: today, dueTo: today })
  const done = useTaskCount({ status: ['DONE'] })
  return { all: all.data, open: open.data, today: dueToday.data, done: done.data }
}
