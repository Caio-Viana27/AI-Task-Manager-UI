import { useTranslation } from 'react-i18next'
import type { Language } from '../i18n/index.ts'

const LANGUAGES = [
  { code: 'en', labelKey: 'language.en' },
  { code: 'pt-BR', labelKey: 'language.ptBR' },
] as const satisfies readonly { code: Language; labelKey: string }[]

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation()

  return (
    <div role="group" aria-label={t('language.label')} className="flex rounded-lg bg-slate-100 p-0.5">
      {LANGUAGES.map(({ code, labelKey }) => {
        const active = i18n.resolvedLanguage === code
        return (
          <button
            key={code}
            type="button"
            aria-pressed={active}
            onClick={() => void i18n.changeLanguage(code)}
            className={`cursor-pointer rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
              active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {t(labelKey)}
          </button>
        )
      })}
    </div>
  )
}
