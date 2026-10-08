import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LogoMark } from './icons.tsx'

interface AuthCardProps {
  title: string
  children: ReactNode
}

/** The frame shared by the login and signup pages. */
export function AuthCard({ title, children }: AuthCardProps) {
  const { t } = useTranslation()

  return (
    <div className="flex justify-center py-6 sm:py-12">
      <section className="card w-full max-w-md animate-pop-in p-8 shadow-lift">
        <div className="flex flex-col items-center text-center">
          <LogoMark className="size-12" />
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-stone-900">{title}</h1>
          <p className="mt-1 text-sm text-stone-500">{t('app.tagline')}</p>
        </div>
        {children}
      </section>
    </div>
  )
}
