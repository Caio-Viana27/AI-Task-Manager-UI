import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearToken, getToken, setToken } from './tokenStorage.ts'

describe('tokenStorage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('stores, reads and clears the token', () => {
    setToken('abc')
    expect(getToken()).toBe('abc')

    clearToken()
    expect(getToken()).toBeNull()
  })

  it('survives localStorage throwing', () => {
    const fail = () => {
      throw new DOMException('denied', 'SecurityError')
    }
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(fail)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(fail)
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(fail)

    expect(() => setToken('abc')).not.toThrow()
    expect(getToken()).toBeNull()
    expect(() => clearToken()).not.toThrow()
  })
})
