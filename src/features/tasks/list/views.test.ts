import { describe, expect, it } from 'vitest'
import { EMPTY_DASHBOARD_STATE, parseDashboardParams } from './dashboardParams.ts'
import { activeView, viewHref, viewState } from './views.ts'

const TODAY = '2026-10-08'

describe('views', () => {
  it.each([
    ['all', '/'],
    ['today', '/?status=TODO&status=IN_PROGRESS&status=OVERDUE&dueFrom=2026-10-08&dueTo=2026-10-08'],
    ['upcoming', '/?status=TODO&status=IN_PROGRESS&status=OVERDUE&dueFrom=2026-10-09&dueTo=2026-10-15'],
    ['completed', '/?status=DONE'],
  ] as const)('%s links to %s', (view, href) => {
    expect(viewHref(view, TODAY)).toBe(href)
  })

  it.each(['all', 'today', 'upcoming', 'completed'] as const)('%s is active on its own link', (view) => {
    const query = viewHref(view, TODAY).split('?')[1] ?? ''
    expect(activeView(parseDashboardParams(new URLSearchParams(query)), TODAY)).toBe(view)
  })

  it('ignores the sort and the page', () => {
    expect(activeView({ ...viewState('completed', TODAY), sort: 'title,asc', page: 3 }, TODAY)).toBe('completed')
  })

  it('matches no view for other filters', () => {
    expect(activeView({ ...EMPTY_DASHBOARD_STATE, priority: ['HIGH'] }, TODAY)).toBeUndefined()
    expect(activeView({ ...EMPTY_DASHBOARD_STATE, status: ['TODO'] }, TODAY)).toBeUndefined()
    // Yesterday's "today" link is no longer the Today view.
    expect(activeView(viewState('today', '2026-10-07'), TODAY)).toBeUndefined()
  })
})
