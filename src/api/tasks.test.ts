import { describe, expect, it } from 'vitest'
import { setToken } from '../auth/tokenStorage.ts'
import { jsonResponse, stubFetch } from '../test/fetchMock.ts'
import {
  buildTaskQuery,
  createSubtasks,
  createTask,
  deleteTask,
  getLookups,
  getTask,
  listTasks,
  patchTask,
  updateTask,
  type Task,
} from './tasks.ts'

const TASK: Task = {
  id: '0b0c1f9e-6a1d-4c47-9a49-5f8b8a1c2d3e',
  title: 'Write report',
  description: 'Quarterly numbers',
  dueDate: '2026-10-31',
  priority: 'HIGH',
  status: 'TODO',
  complexity: null,
  estimatedHours: null,
  parentTaskId: null,
  createdAt: '2026-10-07T12:00:00Z',
  updatedAt: '2026-10-07T12:00:00Z',
}

describe('buildTaskQuery', () => {
  it('returns an empty string without filters', () => {
    expect(buildTaskQuery()).toBe('')
    expect(buildTaskQuery({})).toBe('')
  })

  it('repeats array filters once per value', () => {
    const query = buildTaskQuery({ status: ['TODO', 'OVERDUE'], priority: ['HIGH'], complexity: ['EASY', 'HARD'] })
    const params = new URLSearchParams(query.slice(1))
    expect(params.getAll('status')).toEqual(['TODO', 'OVERDUE'])
    expect(params.getAll('priority')).toEqual(['HIGH'])
    expect(params.getAll('complexity')).toEqual(['EASY', 'HARD'])
    expect(query).toBe('?status=TODO&status=OVERDUE&priority=HIGH&complexity=EASY&complexity=HARD')
  })

  it('sends dates as given, sort, page and size', () => {
    expect(buildTaskQuery({ dueFrom: '2026-10-01', dueTo: '2026-10-31', sort: 'priority,desc', page: 2, size: 50 })).toBe(
      '?dueFrom=2026-10-01&dueTo=2026-10-31&page=2&size=50&sort=priority%2Cdesc',
    )
  })

  it('sends page 0', () => {
    expect(buildTaskQuery({ page: 0 })).toBe('?page=0')
  })

  it('sends includeSubtasks only when true', () => {
    expect(buildTaskQuery({ includeSubtasks: true })).toBe('?includeSubtasks=true')
    expect(buildTaskQuery({ includeSubtasks: false })).toBe('')
  })

  it('trims q, encodes it, and drops it when blank', () => {
    expect(buildTaskQuery({ q: '  50% off & more ' })).toBe('?q=50%25+off+%26+more')
    expect(buildTaskQuery({ q: '   ' })).toBe('')
  })

  it('drops empty arrays and empty dates', () => {
    expect(buildTaskQuery({ status: [], priority: [], dueFrom: '', dueTo: '' })).toBe('')
  })
})

describe('tasks api', () => {
  it('lists tasks with GET /v1/tasks and the query string', async () => {
    setToken('jwt')
    const page = { content: [TASK], page: 0, size: 20, totalElements: 1, totalPages: 1 }
    const fetchMock = stubFetch(() => jsonResponse(page))

    await expect(listTasks({ status: ['TODO', 'IN_PROGRESS'], page: 1 })).resolves.toEqual(page)

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/v1/tasks?status=TODO&status=IN_PROGRESS&page=1')
    expect(init?.method).toBe('GET')
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer jwt')
  })

  it('gets one task with GET /v1/tasks/{id}', async () => {
    const detail = { ...TASK, ancestors: [], canAddSubtasks: true, subtasks: [] }
    const fetchMock = stubFetch(() => jsonResponse(detail))

    await expect(getTask(TASK.id)).resolves.toEqual(detail)
    expect(fetchMock.mock.calls[0][0]).toBe(`/api/v1/tasks/${TASK.id}`)
  })

  it('creates a task with POST /v1/tasks', async () => {
    const fetchMock = stubFetch(() => jsonResponse(TASK, 201))
    const request = { title: 'Write report', description: 'Quarterly numbers', dueDate: '2026-10-31', priority: 'HIGH' as const }

    await expect(createTask(request)).resolves.toEqual(TASK)

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/v1/tasks')
    expect(init?.method).toBe('POST')
    expect(JSON.parse(String(init?.body))).toEqual(request)
  })

  it('replaces a task with PUT /v1/tasks/{id}', async () => {
    const fetchMock = stubFetch(() => jsonResponse(TASK))
    const request = {
      title: 'Write report',
      description: 'Quarterly numbers',
      dueDate: null,
      priority: 'LOW' as const,
      status: 'DONE' as const,
      complexity: null,
    }

    await updateTask(TASK.id, request)

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(`/api/v1/tasks/${TASK.id}`)
    expect(init?.method).toBe('PUT')
    expect(JSON.parse(String(init?.body))).toEqual(request)
  })

  it('patches with only the given fields, keeping null and dropping undefined', async () => {
    const fetchMock = stubFetch(() => jsonResponse(TASK))

    await patchTask(TASK.id, { status: 'DONE', dueDate: null, complexity: undefined, title: undefined })

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(`/api/v1/tasks/${TASK.id}`)
    expect(init?.method).toBe('PATCH')
    expect(init?.body).toBe('{"status":"DONE","dueDate":null}')
  })

  it('sends an empty object for an empty patch', async () => {
    const fetchMock = stubFetch(() => jsonResponse(TASK))

    await patchTask(TASK.id, { title: undefined })

    expect(fetchMock.mock.calls[0][1]?.body).toBe('{}')
  })

  it('deletes with DELETE /v1/tasks/{id} and an empty 204', async () => {
    const fetchMock = stubFetch(() => new Response(null, { status: 204 }))

    await expect(deleteTask(TASK.id)).resolves.toBeUndefined()

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(`/api/v1/tasks/${TASK.id}`)
    expect(init?.method).toBe('DELETE')
  })

  it('creates subtasks with POST /v1/tasks/{id}/subtasks and an array body', async () => {
    const subtask = { ...TASK, id: 'child', parentTaskId: TASK.id }
    const fetchMock = stubFetch(() => jsonResponse([subtask], 201))
    const items = [{ title: 'Collect data', description: 'From finance' }]

    await expect(createSubtasks(TASK.id, items)).resolves.toEqual([subtask])

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(`/api/v1/tasks/${TASK.id}/subtasks`)
    expect(init?.method).toBe('POST')
    expect(JSON.parse(String(init?.body))).toEqual(items)
  })

  it('gets the lookups with GET /v1/lookups', async () => {
    const lookups = {
      priorities: ['LOW', 'MEDIUM', 'HIGH'],
      statuses: ['TODO', 'IN_PROGRESS', 'OVERDUE', 'DONE'],
      complexities: ['EASY', 'MEDIUM', 'HARD'],
    }
    const fetchMock = stubFetch(() => jsonResponse(lookups))

    await expect(getLookups()).resolves.toEqual(lookups)
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/lookups')
  })
})
