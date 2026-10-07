import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from '../auth/useAuth.ts'
import { SessionError, SessionLoading } from '../components/SessionStatus.tsx'
import type { RedirectState } from './redirectTarget.ts'

interface ProtectedRouteProps {
  children: ReactNode
}

/**
 * Renders its children only with a session. Without one it redirects to /login, keeping
 * the requested location so login can return there.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { status, retry } = useAuth()
  const location = useLocation()

  switch (status) {
    case 'authenticated':
      return children
    case 'loading':
      return <SessionLoading />
    case 'error':
      return <SessionError onRetry={retry} />
    case 'anonymous':
      return <Navigate to="/login" replace state={{ from: location } satisfies RedirectState} />
  }
}
