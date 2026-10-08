import { describe, expect, it } from 'vitest'
import { EMPTY_DASHBOARD_STATE } from './dashboardParams.ts'
import { panelFilterCount, statusTab, tabStatuses } from './listControls.ts'

describe('status tabs', () => {
  it('lists each tab’s statuses in lookup order', () => {
    expect(tabStatuses('all')).toEqual([])
    expect(tabStatuses('todo')).toEqual(['TODO', 'OVERDUE'])
    expect(tabStatuses('inProgress')).toEqual(['IN_PROGRESS'])
    expect(tabStatuses('done')).toEqual(['DONE'])
  })

  it.each([
    [[], 'all'],
    [['OVERDUE', 'TODO'], 'todo'],
    [['IN_PROGRESS'], 'inProgress'],
    [['DONE'], 'done'],
    [['TODO'], undefined],
    [['TODO', 'IN_PROGRESS', 'OVERDUE'], undefined],
  ] as const)('%j is the %s tab', (status, tab) => {
    expect(statusTab(status)).toBe(tab)
  })
})

describe('panelFilterCount', () => {
  it('is 0 with no filters, a tab’s statuses, or only a search', () => {
    expect(panelFilterCount(EMPTY_DASHBOARD_STATE)).toBe(0)
    expect(panelFilterCount({ ...EMPTY_DASHBOARD_STATE, status: ['DONE'], q: 'report' })).toBe(0)
  })

  it('counts each panel filter once', () => {
    expect(
      panelFilterCount({
        ...EMPTY_DASHBOARD_STATE,
        status: ['TODO'],
        priority: ['HIGH', 'LOW'],
        complexity: ['EASY'],
        dueFrom: '2026-10-01',
        dueTo: '2026-10-31',
        includeSubtasks: true,
      }),
    ).toBe(5)
    expect(panelFilterCount({ ...EMPTY_DASHBOARD_STATE, dueTo: '2026-10-31' })).toBe(1)
  })
})
