import { describe, expect, it } from 'vitest'
import { ApiError } from '../../../api/client.ts'
import { taskDetail } from '../detail/testFixtures.ts'
import {
  diffTaskForm,
  EMPTY_TASK_FORM_VALUES,
  fieldErrorsFromApi,
  parseEstimatedHours,
  taskToFormValues,
  toCreateRequest,
  validateTaskForm,
} from './taskForm.ts'

const task = taskDetail('t1', {
  title: 'Write report',
  description: 'Quarterly numbers',
  dueDate: '2026-10-31',
  priority: 'HIGH',
  status: 'IN_PROGRESS',
  complexity: 'HARD',
})

describe('diffTaskForm', () => {
  it('is empty when nothing changed', () => {
    expect(diffTaskForm(task, taskToFormValues(task))).toEqual({})
  })

  it('ignores surrounding whitespace in title and description', () => {
    expect(diffTaskForm(task, { ...taskToFormValues(task), title: '  Write report ' })).toEqual({})
  })

  it('sends only the changed fields, with null for a cleared due date or complexity', () => {
    const values = { ...taskToFormValues(task), title: 'New title', dueDate: '', complexity: '' as const }
    expect(diffTaskForm(task, values)).toEqual({ title: 'New title', dueDate: null, complexity: null })
  })

  it('leaves out the status of an OVERDUE task unless the user picked another one', () => {
    const overdue = { ...task, status: 'OVERDUE' as const }
    expect(diffTaskForm(overdue, { ...taskToFormValues(overdue), priority: 'LOW' })).toEqual({ priority: 'LOW' })
    expect(diffTaskForm(overdue, { ...taskToFormValues(overdue), status: 'DONE' })).toEqual({ status: 'DONE' })
  })
})

describe('estimated hours', () => {
  const withHours = { ...task, estimatedHours: 8 }

  it('maps hours to and from the form, with null as an empty field', () => {
    expect(taskToFormValues(withHours).estimatedHours).toBe('8')
    expect(taskToFormValues(task).estimatedHours).toBe('')
  })

  it('patches changed hours, and sends null when the field is cleared', () => {
    expect(diffTaskForm(withHours, taskToFormValues(withHours))).toEqual({})
    expect(diffTaskForm(withHours, { ...taskToFormValues(withHours), estimatedHours: '12' })).toEqual({ estimatedHours: 12 })
    expect(diffTaskForm(withHours, { ...taskToFormValues(withHours), estimatedHours: '' })).toEqual({ estimatedHours: null })
    expect(diffTaskForm(task, { ...taskToFormValues(task), estimatedHours: '1' })).toEqual({ estimatedHours: 1 })
  })

  it('sends hours on create only when filled in', () => {
    const values = { ...EMPTY_TASK_FORM_VALUES, title: 'A', description: 'B' }
    expect(toCreateRequest({ ...values, estimatedHours: '999' })).toEqual({ title: 'A', description: 'B', priority: 'MEDIUM', estimatedHours: 999 })
    expect(toCreateRequest(values)).not.toHaveProperty('estimatedHours')
  })

  it.each(['0', '1000', '2.5', '-3', '1e2', 'abc'])('rejects %s', (hours) => {
    const values = { ...EMPTY_TASK_FORM_VALUES, title: 'A', description: 'B', estimatedHours: hours }
    expect(validateTaskForm(values)).toEqual({ estimatedHours: 'form.validation.estimatedHoursInvalid' })
    expect(parseEstimatedHours(hours)).toBeNull()
  })

  it.each([['', null], ['1', 1], ['999', 999], [' 40 ', 40]] as const)('accepts %j', (hours, parsed) => {
    const values = { ...EMPTY_TASK_FORM_VALUES, title: 'A', description: 'B', estimatedHours: hours }
    expect(validateTaskForm(values)).toEqual({})
    expect(parseEstimatedHours(hours)).toBe(parsed)
  })

  it('maps a server validation error on estimatedHours to its field', () => {
    const error = new ApiError(400, 'VALIDATION_ERROR', [{ field: 'estimatedHours', message: 'x' }], 'x')
    expect(fieldErrorsFromApi(error).fields).toEqual({ estimatedHours: 'form.validation.estimatedHoursInvalid' })
  })
})

describe('toCreateRequest', () => {
  it('trims the text and leaves out an empty due date and complexity', () => {
    expect(toCreateRequest({ ...EMPTY_TASK_FORM_VALUES, title: ' A ', description: ' B ' })).toEqual({
      title: 'A',
      description: 'B',
      priority: 'MEDIUM',
    })
  })
})

describe('validateTaskForm', () => {
  it('requires a non-blank title and description within their limits', () => {
    expect(validateTaskForm({ ...EMPTY_TASK_FORM_VALUES, title: '   ' })).toEqual({
      title: 'form.validation.titleRequired',
      description: 'form.validation.descriptionRequired',
    })
    expect(
      validateTaskForm({ ...EMPTY_TASK_FORM_VALUES, title: 'x'.repeat(101), description: 'y'.repeat(501) }),
    ).toEqual({ title: 'form.validation.titleTooLong', description: 'form.validation.descriptionTooLong' })
    expect(
      validateTaskForm({ ...EMPTY_TASK_FORM_VALUES, title: 'x'.repeat(100), description: 'y'.repeat(500) }),
    ).toEqual({})
  })
})

describe('fieldErrorsFromApi', () => {
  it('maps validation errors by their last path segment, including subtask batch paths', () => {
    const error = new ApiError(400, 'VALIDATION_ERROR', [
      { field: 'subtasks[0].title', message: 'size must be between 1 and 100' },
      { field: 'dueDate', message: 'bad' },
    ], 'invalid')
    expect(fieldErrorsFromApi(error)).toEqual({
      fields: { title: 'form.validation.titleInvalid', dueDate: 'form.validation.dueDateInvalid' },
      formError: null,
    })
  })

  it('maps enum codes to their field and keeps anything else form-level', () => {
    expect(fieldErrorsFromApi(new ApiError(400, 'INVALID_COMPLEXITY', [], 'x')).fields).toEqual({
      complexity: 'errors:INVALID_COMPLEXITY',
    })
    const other = new ApiError(400, 'SUBTASK_DEPTH_EXCEEDED', [], 'x')
    expect(fieldErrorsFromApi(other)).toEqual({ fields: {}, formError: other })
    const unknownField = new ApiError(400, 'VALIDATION_ERROR', [{ field: 'parentId', message: 'x' }], 'x')
    expect(fieldErrorsFromApi(unknownField)).toEqual({ fields: {}, formError: unknownField })
  })
})
