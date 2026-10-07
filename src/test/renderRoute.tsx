import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router'
import { setToken } from '../auth/tokenStorage.ts'
import { routes as appRoutes } from '../routes/router.tsx'

export interface RenderRouteOptions {
  /** Stored before rendering, as if left by a previous visit. */
  token?: string
  /** Routes to mount instead of the app's. */
  routes?: RouteObject[]
}

/** A query client for one test: no retries, so failures surface at once. */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
}

/** Renders the app's routes in a memory router, starting at `path`, with a fresh query client. */
export function renderRoute(path: string, options: RenderRouteOptions = {}) {
  if (options.token !== undefined) {
    setToken(options.token)
  }
  const queryClient = createTestQueryClient()
  const router = createMemoryRouter(options.routes ?? appRoutes, { initialEntries: [path] })
  const result = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return { ...result, router, queryClient }
}
