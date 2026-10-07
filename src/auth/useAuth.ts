import { useContext } from 'react'
import { AuthContext, type AuthContextValue } from './AuthContext.ts'

/** The session. Must be used below `AuthProvider`. */
export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (value === null) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return value
}
