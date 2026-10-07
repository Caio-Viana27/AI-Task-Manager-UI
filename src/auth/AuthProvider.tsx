import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { getMe, type AuthResponse } from '../api/auth.ts'
import { ApiError, setUnauthorizedHandler } from '../api/client.ts'
import { AuthContext, loginPath, type AuthContextValue, type AuthStatus } from './AuthContext.ts'
import { clearToken, getToken, setToken, TOKEN_KEY } from './tokenStorage.ts'

const ME_QUERY_KEY = ['me'] as const

interface AuthProviderProps {
  children: ReactNode
}

/**
 * Holds the session (wave 1 plan, D7). The token lives in localStorage; the user is
 * loaded from `GET /users/me` and the JWT is never decoded. Must be rendered inside the
 * router, because logging out navigates to /login.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [token, setTokenState] = useState(getToken)
  // Mirrors `token` for event handlers, and marks a session that already ended, so
  // several 401s (or a 401 arriving after logout) redirect only once.
  const tokenRef = useRef(token)
  const sessionEndedRef = useRef(false)
  const [expired, setExpired] = useState(false)

  const startSession = useCallback((next: string) => {
    tokenRef.current = next
    sessionEndedRef.current = false
    setExpired(false)
    setTokenState(next)
  }, [])

  const endSession = useCallback(
    (reason: 'logout' | 'expired') => {
      if (sessionEndedRef.current) {
        return
      }
      sessionEndedRef.current = true
      tokenRef.current = null
      clearToken()
      setExpired(reason === 'expired')
      setTokenState(null)
      // Navigate before clearing, so the protected page's queries don't refetch without a token.
      void navigate(loginPath(reason === 'expired'), { replace: true })
      queryClient.clear()
    },
    [navigate, queryClient],
  )

  const meQuery = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: ({ signal }) => getMe(signal),
    enabled: token !== null,
    staleTime: Infinity,
    retry: false,
  })

  const login = useCallback(
    (response: AuthResponse) => {
      setToken(response.token)
      queryClient.setQueryData(ME_QUERY_KEY, response.user)
      startSession(response.token)
    },
    [queryClient, startSession],
  )

  const logout = useCallback(() => endSession('logout'), [endSession])

  const { refetch } = meQuery
  const retry = useCallback(() => {
    void refetch()
  }, [refetch])

  useEffect(() => {
    setUnauthorizedHandler(() => endSession('expired'))
    return () => setUnauthorizedHandler(null)
  }, [endSession])

  // Follow logins and logouts made in other tabs.
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      // A null key means another tab cleared all of localStorage.
      if (event.key !== null && event.key !== TOKEN_KEY) {
        return
      }
      const next = getToken()
      if (next === tokenRef.current) {
        return
      }
      if (next === null) {
        endSession('logout')
      } else {
        startSession(next)
        // Another user may have logged in: drop the old user's data and refetch.
        void queryClient.resetQueries()
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [endSession, queryClient, startSession])

  const status = statusOf(token, meQuery.data, meQuery.error)
  const user = status === 'authenticated' ? (meQuery.data ?? null) : null

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, expired, login, logout, retry }),
    [status, user, expired, login, logout, retry],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}

function statusOf(token: string | null, user: unknown, error: Error | null): AuthStatus {
  if (token === null) {
    return 'anonymous'
  }
  if (user) {
    return 'authenticated'
  }
  // A 401 is handled by the unauthorized handler, which ends the session.
  if (error && !(error instanceof ApiError && error.status === 401)) {
    return 'error'
  }
  return 'loading'
}
