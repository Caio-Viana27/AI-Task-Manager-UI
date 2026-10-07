import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { loginPath } from '../auth/AuthContext.ts'
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
  const { status, expired, retry } = useAuth()
  const location = useLocation()

  switch (status) {
    case 'authenticated':
      return children
    case 'loading':
      return <SessionLoading />
    case 'error':
      return <SessionError onRetry={retry} />
    case 'anonymous':
      // After a 401 the provider also navigates to /login?expired=1; use the same target so
      // this redirect can't drop the banner.
      return <Navigate to={loginPath(expired)} replace state={{ from: location } satisfies RedirectState} />
  }
}
