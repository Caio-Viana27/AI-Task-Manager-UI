import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import enCommon from './locales/en/common.json'
import enErrors from './locales/en/errors.json'
import ptBRCommon from './locales/pt-BR/common.json'
import ptBRErrors from './locales/pt-BR/errors.json'

export const SUPPORTED_LANGUAGES = ['en', 'pt-BR'] as const
export type Language = (typeof SUPPORTED_LANGUAGES)[number]

export const resources = {
  en: { common: enCommon, errors: enErrors },
  'pt-BR': { common: ptBRCommon, errors: ptBRErrors },
} as const

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng
})

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: SUPPORTED_LANGUAGES,
    fallbackLng: 'en',
    ns: ['common', 'errors'],
    defaultNS: 'common',
    // The resources are bundled, so init synchronously and never suspend.
    initAsync: false,
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'planned.language',
      // Any Portuguese browser locale (pt, pt-PT, ...) gets PT-BR, the only one we have.
      convertDetectedLanguage: (lng) => (lng.toLowerCase().startsWith('pt') ? 'pt-BR' : lng),
    },
  })

export default i18n
