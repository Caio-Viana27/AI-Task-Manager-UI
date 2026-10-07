import { describe, expect, it } from 'vitest'
import { resources } from './index.ts'

function keysOf(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) {
    return [prefix]
  }
  return Object.entries(value)
    .flatMap(([key, child]) => keysOf(child, prefix ? `${prefix}.${key}` : key))
    .sort()
}

// Every error code in PLAN §2 (Errors), mirrored from the API's ErrorCode enum.
const API_ERROR_CODES = [
  'VALIDATION_ERROR',
  'INVALID_STATUS',
  'INVALID_PRIORITY',
  'INVALID_COMPLEXITY',
  'SUBTASK_DEPTH_EXCEEDED',
  'UNAUTHORIZED',
  'BAD_CREDENTIALS',
  'TASK_NOT_FOUND',
  'EMAIL_ALREADY_USED',
  'AI_INVALID_RESPONSE',
  'AI_RATE_LIMITED',
  'AI_UNAVAILABLE',
  'METHOD_NOT_ALLOWED',
  'UNSUPPORTED_MEDIA_TYPE',
  'INTERNAL_ERROR',
]

describe('locales', () => {
  it.each(['common', 'errors', 'auth', 'tasks', 'ai', 'aiBreakdown'] as const)('%s has the same keys in EN and PT-BR', (ns) => {
    expect(keysOf(resources['pt-BR'][ns])).toEqual(keysOf(resources.en[ns]))
  })

  it('has a message for every API error code plus a generic fallback', () => {
    expect(keysOf(resources.en.errors)).toEqual([...API_ERROR_CODES, 'generic'].sort())
  })

  it.each(['en', 'pt-BR'] as const)('%s has no empty messages', (lng) => {
    const values = [resources[lng].common, resources[lng].errors, resources[lng].auth, resources[lng].tasks, resources[lng].ai, resources[lng].aiBreakdown].flatMap((ns) =>
      keysOf(ns).map((key) => key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], ns)),
    )
    expect(values.every((value) => typeof value === 'string' && value.trim() !== '')).toBe(true)
  })
})
