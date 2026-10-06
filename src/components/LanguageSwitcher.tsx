import { useTranslation } from 'react-i18next'
import type { Language } from '../i18n/index.ts'

const LANGUAGES = [
  { code: 'en', labelKey: 'language.en' },
  { code: 'pt-BR', labelKey: 'language.ptBR' },
] as const satisfies readonly { code: Language; labelKey: string }[]

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation()

  return (
    <div role="group" aria-label={t('language.label')} className="flex gap-1">
      {LANGUAGES.map(({ code, labelKey }) => {
        const active = i18n.resolvedLanguage === code
        return (
          <button
            key={code}
            type="button"
            aria-pressed={active}
            onClick={() => void i18n.changeLanguage(code)}
            className={`rounded px-2 py-1 text-sm font-medium ${
              active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t(labelKey)}
          </button>
        )
      })}
    </div>
  )
}
