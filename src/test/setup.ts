import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import i18n from '../i18n/index.ts'

afterEach(async () => {
  cleanup()
  localStorage.clear()
  await i18n.changeLanguage('en')
})
