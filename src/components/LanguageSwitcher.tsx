import { useTranslation } from 'react-i18next'
import type { Language } from '../i18n/index.ts'
import { CheckIcon, ChevronDownIcon } from './icons.tsx'
import { Menu, MenuItem } from './Menu.tsx'

const LANGUAGES = [
  { code: 'en', labelKey: 'language.en' },
  { code: 'pt-BR', labelKey: 'language.ptBR' },
] as const satisfies readonly { code: Language; labelKey: string }[]

interface LanguageSwitcherProps {
  /** `dark` for the sidebar's green background. */
  tone?: 'light' | 'dark'
}

/** A small menu with the current language, e.g. "PT-BR ▾". */
export function LanguageSwitcher({ tone = 'light' }: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation()
  const current = LANGUAGES.find(({ code }) => code === i18n.resolvedLanguage) ?? LANGUAGES[0]

  return (
    <Menu
      label={t('language.menu', { language: t(current.labelKey) })}
      triggerClassName={`inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
        tone === 'dark' ? 'text-brand-100 hover:bg-white/10' : 'text-stone-700 hover:bg-stone-100'
      }`}
      trigger={
        <>
          {t(current.labelKey)}
          <ChevronDownIcon className="size-3.5 text-stone-400" />
        </>
      }
    >
      {(close) =>
        LANGUAGES.map(({ code, labelKey }) => {
          const active = current.code === code
          return (
            <MenuItem
              key={code}
              checked={active}
              onSelect={() => {
                void i18n.changeLanguage(code)
                close()
              }}
              icon={<CheckIcon className={`size-3.5 ${active ? '' : 'invisible'}`} />}
            >
              {t(labelKey)}
            </MenuItem>
          )
        })
      }
    </Menu>
  )
}
