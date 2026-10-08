import { useCallback, useEffect, useId, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router'
import { LeafIcon } from '../components/icons.tsx'
import { ShellContext, type ShellContextValue } from './ShellContext.ts'
import { Sidebar } from './Sidebar.tsx'
import { readSidebarCollapsed, writeSidebarCollapsed } from './sidebarStorage.ts'
import { Topbar } from './Topbar.tsx'

interface AppShellProps {
  /** The assistant panel; the protected routes pass `ChatPanel` (wave 4, D7). It stays mounted while hidden. */
  assistant?: ReactNode
}

/** The signed-in layout: sidebar, top bar, the page, and the assistant column. */
export function AppShell({ assistant }: AppShellProps) {
  const { t } = useTranslation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readSidebarCollapsed)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const assistantId = useId()

  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed((current) => {
      writeSidebarCollapsed(!current)
      return !current
    })
  }, [])

  useEffect(() => {
    if (!drawerOpen) {
      return
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setDrawerOpen(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [drawerOpen])

  const shell = useMemo<ShellContextValue>(
    () => ({
      sidebarCollapsed,
      toggleSidebarCollapsed,
      drawerOpen,
      setDrawerOpen,
      assistantOpen,
      setAssistantOpen,
      assistantId,
    }),
    [sidebarCollapsed, toggleSidebarCollapsed, drawerOpen, assistantOpen, assistantId],
  )

  return (
    <ShellContext.Provider value={shell}>
      <div className="min-h-screen bg-canvas text-stone-900 lg:flex">
        {drawerOpen && (
          <div
            aria-hidden="true"
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 z-40 animate-fade-in bg-brand-950/40 backdrop-blur-[2px] lg:hidden"
          />
        )}
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <div className="flex flex-1 flex-col gap-8 px-4 py-8 sm:px-8 sm:py-10 xl:flex-row xl:items-start">
            <main className="min-w-0 flex-1 animate-fade-in">
              <Outlet />
            </main>
            {assistant && (
              <div id={assistantId} hidden={!assistantOpen} className="w-full shrink-0 xl:sticky xl:top-24 xl:w-80 2xl:w-96">
                {assistant}
              </div>
            )}
          </div>
          <footer className="mx-4 flex items-center justify-between gap-4 border-t border-line py-5 text-xs text-stone-500 sm:mx-8">
            <p>{t('shell.footer')}</p>
            <LeafIcon className="size-4 text-sage-500" />
          </footer>
        </div>
      </div>
    </ShellContext.Provider>
  )
}
