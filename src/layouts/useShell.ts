import { useContext } from 'react'
import { ShellContext, type ShellContextValue } from './ShellContext.ts'

/** The app shell's state. Must be used below the `AppShell`. */
export function useShell(): ShellContextValue {
  const value = useContext(ShellContext)
  if (value === null) {
    throw new Error('useShell must be used within the AppShell')
  }
  return value
}
