import { createContext } from 'react'
import type { AuthResponse, AuthUser } from '../api/auth.ts'

/**
 * - `anonymous`: no token.
 * - `loading`: a token exists and `GET /users/me` is in flight.
 * - `authenticated`: the user is loaded.
 * - `error`: `/users/me` failed with a network error or a 5xx. The token is kept (D7).
 */
export type AuthStatus = 'anonymous' | 'loading' | 'authenticated' | 'error'

export interface AuthContextValue {
  status: AuthStatus
  /** The current user, set only when `status` is `authenticated`. */
  user: AuthUser | null
  /** Stores the token and seeds the current user from a sign-up or sign-in response. */
  login: (response: AuthResponse) => void
  /** Clears the token, goes to /login, then clears the query cache. No API call. */
  logout: () => void
  /** Refetches the current user after an `error`. */
  retry: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
