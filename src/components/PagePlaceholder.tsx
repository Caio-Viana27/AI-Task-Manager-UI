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
    <section className="card mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="mt-2 text-stone-600">{t('placeholder')}</p>
      {children}
    </section>
  )
}
