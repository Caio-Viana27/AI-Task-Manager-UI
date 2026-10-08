/** The localStorage key of the collapsed-sidebar preference. */
export const SIDEBAR_COLLAPSED_KEY = 'planned.sidebarCollapsed'

// localStorage can throw (private mode, blocked site data), so a failure means "expanded".

export function readSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
  } catch {
    return false
  }
}

export function writeSidebarCollapsed(collapsed: boolean): void {
  try {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed))
  } catch {
    // Ignored: the preference just won't survive a reload.
  }
}
