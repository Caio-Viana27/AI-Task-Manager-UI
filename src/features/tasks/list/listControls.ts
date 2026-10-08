import { TASK_STATUSES, type TaskStatus } from '../../../api/tasks.ts'
import type { DashboardState } from './dashboardParams.ts'

/** The status tabs above the list, each a preset of the status filter. "To do" includes overdue tasks. */
export const STATUS_TABS = {
  all: [],
  todo: ['TODO', 'OVERDUE'],
  inProgress: ['IN_PROGRESS'],
  done: ['DONE'],
} as const satisfies Record<string, readonly TaskStatus[]>

export type StatusTab = keyof typeof STATUS_TABS

export const STATUS_TAB_ORDER: readonly StatusTab[] = ['all', 'todo', 'inProgress', 'done']

/** The statuses of a tab, in lookup order, as the URL holds them. */
export function tabStatuses(tab: StatusTab): TaskStatus[] {
  const statuses: readonly TaskStatus[] = STATUS_TABS[tab]
  return TASK_STATUSES.filter((status) => statuses.includes(status))
}

/** The tab whose statuses are exactly `status`, or `undefined` for a mix no tab offers. */
export function statusTab(status: readonly TaskStatus[]): StatusTab | undefined {
  const key = TASK_STATUSES.filter((value) => status.includes(value)).join()
  return STATUS_TAB_ORDER.find((tab) => tabStatuses(tab).join() === key)
}

/**
 * How many filters the "Filters" panel holds that are set: a status mix no tab offers, priority,
 * complexity, the due-date range (one, whichever ends are set) and "include subtasks".
 * The text search is left out; it sits outside the panel.
 */
export function panelFilterCount(state: DashboardState): number {
  return [
    statusTab(state.status) === undefined,
    state.priority.length > 0,
    state.complexity.length > 0,
    state.dueFrom !== undefined || state.dueTo !== undefined,
    state.includeSubtasks,
  ].filter(Boolean).length
}
