import type { ReactNode } from 'react'

interface AuthCardProps {
  title: string
  children: ReactNode
}

/** The frame shared by the login and signup pages. */
export function AuthCard({ title, children }: AuthCardProps) {
  return (
    <section className="mx-auto w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {children}
    </section>
  )
}
