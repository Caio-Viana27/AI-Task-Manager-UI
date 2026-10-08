import { createContext } from 'react'

export interface ShellContextValue {
  /** Desktop only: the sidebar shows icons alone. Remembered across visits. */
  sidebarCollapsed: boolean
  toggleSidebarCollapsed: () => void
  /** Small screens only: the sidebar is open as a drawer over the page. */
  drawerOpen: boolean
  setDrawerOpen: (open: boolean) => void
  /** The assistant panel is shown. The panel stays mounted either way, so its conversation is kept. */
  assistantOpen: boolean
  setAssistantOpen: (open: boolean) => void
  /** The `id` of the assistant panel's container, for `aria-controls`. */
  assistantId: string
}

export const ShellContext = createContext<ShellContextValue | null>(null)
