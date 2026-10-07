import { describe, expect, it } from 'vitest'
import { utf8ByteLength, validateSignIn, validateSignUp } from './validation.ts'

const VALID = { email: 'ana@example.com', name: 'Ana', password: 'secret123' }

describe('utf8ByteLength', () => {
  it('counts bytes, not characters', () => {
    expect(utf8ByteLength('abc')).toBe(3)
    expect(utf8ByteLength('é')).toBe(2)
    expect(utf8ByteLength('😀')).toBe(4)
  })
})

describe('validateSignUp', () => {
  it('accepts valid values', () => {
    expect(validateSignUp(VALID)).toEqual({})
  })

  it.each([
    [{ email: '' }, { email: 'validation.emailRequired' }],
    [{ email: 'not-an-email' }, { email: 'validation.emailInvalid' }],
    [{ email: `${'a'.repeat(89)}@example.com` }, { email: 'validation.emailTooLong' }],
    [{ name: '   ' }, { name: 'validation.nameRequired' }],
    [{ name: 'a'.repeat(101) }, { name: 'validation.nameTooLong' }],
    [{ password: '' }, { password: 'validation.passwordRequired' }],
    [{ password: 'short12' }, { password: 'validation.passwordTooShort' }],
    [{ password: 'é'.repeat(37) }, { password: 'validation.passwordTooLong' }],
  ])('rejects %j', (override, expected) => {
    expect(validateSignUp({ ...VALID, ...override })).toEqual(expected)
  })

  it('accepts limits exactly', () => {
    expect(
      validateSignUp({
        email: `${'a'.repeat(88)}@example.com`,
        name: 'a'.repeat(100),
        password: 'é'.repeat(36),
      }),
    ).toEqual({})
    expect(validateSignUp({ ...VALID, password: 'a'.repeat(72) })).toEqual({})
  })
})

describe('validateSignIn', () => {
  it('only requires both fields, without format or length checks', () => {
    expect(validateSignIn({ email: 'x', password: 'y' })).toEqual({})
    expect(validateSignIn({ email: '', password: '' })).toEqual({
      email: 'validation.emailRequired',
      password: 'validation.passwordRequired',
    })
  })
})
