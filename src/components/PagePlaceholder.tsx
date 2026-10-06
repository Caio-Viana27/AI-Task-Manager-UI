import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

interface PagePlaceholderProps {
  title: string
  children?: ReactNode
}

/** Stand-in body for pages that later waves implement. */
export function PagePlaceholder({ title, children }: PagePlaceholderProps) {
  const { t } = useTranslation()

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-slate-600">{t('placeholder')}</p>
      {children}
    </section>
  )
}
