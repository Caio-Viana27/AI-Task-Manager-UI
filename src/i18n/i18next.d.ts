import 'i18next'
import type auth from './locales/en/auth.json'
import type common from './locales/en/common.json'
import type errors from './locales/en/errors.json'

// Type-checks translation keys against the English locale.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    resources: {
      common: typeof common
      errors: typeof errors
      auth: typeof auth
    }
  }
}
