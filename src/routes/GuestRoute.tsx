import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from '../auth/useAuth.ts'
import { SessionLoading } from '../components/SessionStatus.tsx'
import { redirectTarget } from './redirectTarget.ts'

interface GuestRouteProps {
  children: ReactNode
}

/**
 * For pages only a logged-out user needs (/login, /signup). A logged-in user goes to the
 * page saved by `ProtectedRoute`, or the dashboard.
 */
export function GuestRoute({ children }: GuestRouteProps) {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'authenticated') {
    return <Navigate to={redirectTarget(location.state)} replace />
  }
  if (status === 'loading') {
    return <SessionLoading />
  }
  return children
}
