import { createBrowserRouter, Outlet, type RouteObject } from 'react-router'
import { AuthProvider } from '../auth/AuthProvider.tsx'
import { AppLayout } from '../layouts/AppLayout.tsx'
import { DashboardPage } from '../pages/DashboardPage.tsx'
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage.tsx'
import { LoginPage } from '../pages/LoginPage.tsx'
import { NewTaskPage } from '../pages/NewTaskPage.tsx'
import { NotFoundPage } from '../pages/NotFoundPage.tsx'
import { ResetPasswordPage } from '../pages/ResetPasswordPage.tsx'
import { SignupPage } from '../pages/SignupPage.tsx'
import { TaskDetailPage } from '../pages/TaskDetailPage.tsx'
import { GuestRoute } from './GuestRoute.tsx'
import { ProtectedRoute } from './ProtectedRoute.tsx'

/** Every route from PLAN §6. Exported separately so tests can mount them in a memory router. */
export const routes: RouteObject[] = [
  {
    // Root auth route: the session provider needs the router to navigate on logout.
    element: (
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    ),
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: '/login',
            element: (
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            ),
          },
          {
            path: '/signup',
            element: (
              <GuestRoute>
                <SignupPage />
              </GuestRoute>
            ),
          },
          { path: '/forgot-password', element: <ForgotPasswordPage /> },
          { path: '/reset-password', element: <ResetPasswordPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
      {
        element: (
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        ),
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/tasks/new', element: <NewTaskPage /> },
          { path: '/tasks/:id', element: <TaskDetailPage /> },
        ],
      },
    ],
  },
]

export const router = createBrowserRouter(routes)
