import { describe, expect, it } from 'vitest'
import { initials } from './initials.ts'

describe('initials', () => {
  it.each([
    ['Ada Lovelace', 'AL'],
    ['Ana Maria Souza', 'AS'],
    ['  caio  ', 'C'],
    ['', ''],
  ])('%j → %j', (name, expected) => {
    expect(initials(name)).toBe(expected)
  })
})
