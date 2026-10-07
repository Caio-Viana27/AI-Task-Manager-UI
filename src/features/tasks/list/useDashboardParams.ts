import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { EMPTY_DASHBOARD_STATE, parseDashboardParams, toDashboardParams, type DashboardState } from './dashboardParams.ts'

export interface UpdateOptions {
  /** Replace the history entry instead of pushing one, e.g. while the user types a search. */
  replace?: boolean
}

/**
 * The dashboard state from the URL, and setters that write it back. Changing a filter or the sort
 * goes back to page 1; changing the page keeps the filters.
 */
export function useDashboardParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const state = useMemo(() => parseDashboardParams(searchParams), [searchParams])

  const update = useCallback(
    (changes: Partial<Omit<DashboardState, 'page'>>, options: UpdateOptions = {}) => {
      setSearchParams((current) => toDashboardParams({ ...parseDashboardParams(current), ...changes, page: 1 }), options)
    },
    [setSearchParams],
  )

  const setPage = useCallback(
    (page: number) => {
      setSearchParams((current) => toDashboardParams({ ...parseDashboardParams(current), page }))
    },
    [setSearchParams],
  )

  /** Clears every filter, keeping the sort. */
  const clearFilters = useCallback(() => {
    setSearchParams((current) =>
      toDashboardParams({ ...EMPTY_DASHBOARD_STATE, sort: parseDashboardParams(current).sort }),
    )
  }, [setSearchParams])

  return { state, update, setPage, clearFilters }
}
