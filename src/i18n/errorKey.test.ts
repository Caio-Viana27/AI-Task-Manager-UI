import { describe, expect, it } from 'vitest'
import { ApiError } from '../api/client.ts'
import { errorKey } from './errorKey.ts'

describe('errorKey', () => {
  it('uses the API error code when it has a message', () => {
    expect(errorKey(new ApiError(404, 'TASK_NOT_FOUND', [], 'Not found'))).toBe('TASK_NOT_FOUND')
  })

  it.each([
    ['an ApiError without a code', new ApiError(502, null, [], 'Bad Gateway')],
    ['an unknown code', new ApiError(418, 'I_AM_A_TEAPOT', [], 'Teapot')],
    ['a code that matches an object property', new ApiError(400, 'toString', [], 'Odd')],
    ['a network failure', new TypeError('Failed to fetch')],
  ])('falls back to generic for %s', (_, error) => {
    expect(errorKey(error)).toBe('generic')
  })
})
