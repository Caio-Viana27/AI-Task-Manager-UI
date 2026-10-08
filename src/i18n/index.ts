import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import enAi from './locales/en/ai.json'
import enAiBreakdown from './locales/en/aiBreakdown.json'
import enAuth from './locales/en/auth.json'
import enChat from './locales/en/chat.json'
import enCommon from './locales/en/common.json'
import enErrors from './locales/en/errors.json'
import enTasks from './locales/en/tasks.json'
import ptBRAi from './locales/pt-BR/ai.json'
import ptBRAiBreakdown from './locales/pt-BR/aiBreakdown.json'
import ptBRAuth from './locales/pt-BR/auth.json'
import ptBRChat from './locales/pt-BR/chat.json'
import ptBRCommon from './locales/pt-BR/common.json'
import ptBRErrors from './locales/pt-BR/errors.json'
import ptBRTasks from './locales/pt-BR/tasks.json'

export const SUPPORTED_LANGUAGES = ['en', 'pt-BR'] as const
export type Language = (typeof SUPPORTED_LANGUAGES)[number]

export const resources = {
  en: { common: enCommon, errors: enErrors, auth: enAuth, tasks: enTasks, ai: enAi, aiBreakdown: enAiBreakdown, chat: enChat },
  'pt-BR': { common: ptBRCommon, errors: ptBRErrors, auth: ptBRAuth, tasks: ptBRTasks, ai: ptBRAi, aiBreakdown: ptBRAiBreakdown, chat: ptBRChat },
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
    ns: ['common', 'errors', 'auth', 'tasks', 'ai', 'aiBreakdown', 'chat'],
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
