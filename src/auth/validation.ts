import type { ParseKeys } from 'i18next'

/** A message key from the `auth` namespace, or `errors:<CODE>`. */
export type AuthMessageKey = ParseKeys<['auth', 'errors']>

export type SignUpField = 'email' | 'name' | 'password'
export type SignInField = 'email' | 'password'
export type FieldErrors<F extends string> = Partial<Record<F, AuthMessageKey>>

/** Limits from the wave 1 plan, D5, mirroring the API's `SignUpRequest`. */
export const EMAIL_MAX_LENGTH = 100
export const NAME_MAX_LENGTH = 100
export const PASSWORD_MIN_LENGTH = 8
/** BCrypt only uses the first 72 bytes of a password, so the API rejects longer ones. */
export const PASSWORD_MAX_BYTES = 72

// Like the API's @Email, it only rejects clearly malformed addresses.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+$/

export function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).length
}

/** Client-side sign-up checks (D5). `email` is expected already trimmed. */
export function validateSignUp(values: Record<SignUpField, string>): FieldErrors<SignUpField> {
  const errors: FieldErrors<SignUpField> = {}
  const { email, name, password } = values

  if (email === '') {
    errors.email = 'validation.emailRequired'
  } else if (email.length > EMAIL_MAX_LENGTH) {
    errors.email = 'validation.emailTooLong'
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'validation.emailInvalid'
  }

  if (name.trim() === '') {
    errors.name = 'validation.nameRequired'
  } else if (name.length > NAME_MAX_LENGTH) {
    errors.name = 'validation.nameTooLong'
  }

  if (password === '') {
    errors.password = 'validation.passwordRequired'
  } else if (password.length < PASSWORD_MIN_LENGTH) {
    errors.password = 'validation.passwordTooShort'
  } else if (utf8ByteLength(password) > PASSWORD_MAX_BYTES) {
    errors.password = 'validation.passwordTooLong'
  }

  return errors
}

/**
 * Client-side sign-in checks: only that both fields are filled in. Sign-in never checks
 * formats or lengths, so a failed sign-in doesn't reveal the sign-up rules (D5).
 */
export function validateSignIn(values: Record<SignInField, string>): FieldErrors<SignInField> {
  const errors: FieldErrors<SignInField> = {}
  if (values.email === '') {
    errors.email = 'validation.emailRequired'
  }
  if (values.password === '') {
    errors.password = 'validation.passwordRequired'
  }
  return errors
}

export function hasErrors(errors: object): boolean {
  return Object.keys(errors).length > 0
}
