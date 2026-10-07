import type { Location } from 'react-router'

/** Navigation state `ProtectedRoute` leaves on /login: the page the user asked for. */
export interface RedirectState {
  from?: Location
}

/** Where to go after logging in: the page saved by `ProtectedRoute`, or the dashboard. */
export function redirectTarget(state: unknown): string {
  const from = (state as RedirectState | null)?.from
  if (!from || typeof from.pathname !== 'string' || from.pathname === '/login' || from.pathname === '/signup') {
    return '/'
  }
  return `${from.pathname}${from.search ?? ''}${from.hash ?? ''}`
}
