import type { IsoDate, TaskStatus } from '../../../api/tasks.ts'
import { addDays } from './dates.ts'
import { DEFAULT_SORT, EMPTY_DASHBOARD_STATE, toDashboardParams, type DashboardState } from './dashboardParams.ts'

/** The statuses of a task still to be done. */
export const OPEN_STATUSES: readonly TaskStatus[] = ['TODO', 'IN_PROGRESS', 'OVERDUE']

/** How many days ahead, after today, the "Upcoming" view reaches. */
export const UPCOMING_DAYS = 7

/** The sidebar's views. Each one is a preset of the dashboard's URL filters, not a route of its own. */
export const TASK_VIEWS = ['all', 'today', 'upcoming', 'completed'] as const
export type TaskView = (typeof TASK_VIEWS)[number]

/** The dashboard state a view shows, for the given day. */
export function viewState(view: TaskView, today: IsoDate): DashboardState {
  switch (view) {
    case 'all':
      return EMPTY_DASHBOARD_STATE
    case 'today':
      return { ...EMPTY_DASHBOARD_STATE, status: [...OPEN_STATUSES], dueFrom: today, dueTo: today }
    case 'upcoming':
      return {
        ...EMPTY_DASHBOARD_STATE,
        status: [...OPEN_STATUSES],
        dueFrom: addDays(today, 1),
        dueTo: addDays(today, UPCOMING_DAYS),
      }
    case 'completed':
      return { ...EMPTY_DASHBOARD_STATE, status: ['DONE'] }
  }
}

/** The dashboard link of a view. */
export function viewHref(view: TaskView, today: IsoDate): string {
  const query = toDashboardParams(viewState(view, today)).toString()
  return query ? `/?${query}` : '/'
}

/** Only the filters, so sort and page never change which view is active. */
function filterKey(state: DashboardState): string {
  return toDashboardParams({ ...state, sort: DEFAULT_SORT, page: 1 }).toString()
}

/** The view whose filters are exactly the state's, if any. */
export function activeView(state: DashboardState, today: IsoDate): TaskView | undefined {
  const key = filterKey(state)
  return TASK_VIEWS.find((view) => filterKey(viewState(view, today)) === key)
}
