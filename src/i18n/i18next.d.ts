import 'i18next'
import type ai from './locales/en/ai.json'
import type aiAnalysis from './locales/en/aiAnalysis.json'
import type aiBreakdown from './locales/en/aiBreakdown.json'
import type auth from './locales/en/auth.json'
import type chat from './locales/en/chat.json'
import type common from './locales/en/common.json'
import type errors from './locales/en/errors.json'
import type tasks from './locales/en/tasks.json'

// Type-checks translation keys against the English locale.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    resources: {
      common: typeof common
      errors: typeof errors
      auth: typeof auth
      tasks: typeof tasks
      ai: typeof ai
      aiBreakdown: typeof aiBreakdown
      aiAnalysis: typeof aiAnalysis
      chat: typeof chat
    }
  }
}
