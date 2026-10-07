/** The localStorage key of the JWT. Exported so other tabs' changes can be detected. */
export const TOKEN_KEY = 'planned.token'

// localStorage can throw (private mode, blocked site data, quota), so every
// access is guarded and a failure behaves like "no token".

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // Ignored: the session just won't survive a reload.
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Ignored: nothing we can do if storage is unavailable.
  }
}
