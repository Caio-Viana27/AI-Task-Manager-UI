import type { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
}

/** Wave 0 stub: always renders its children. Wave 1 redirects to /login without a session. */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  return children
}
