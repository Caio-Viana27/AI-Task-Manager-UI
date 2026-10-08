import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { taskDetail } from '../features/tasks/detail/testFixtures.ts'
import i18n from '../i18n/index.ts'
import { jsonResponse, problemResponse, stubFetch, TEST_USER_RESPONSE } from '../test/fetchMock.ts'
import { renderRoute } from '../test/renderRoute.tsx'

type Request = { method: string; path: string; body: unknown }

/** Stubs the session, `POST /tasks` with `create`, and the created task's page. */
function stubApi(create: (body: unknown) => Response) {
  const requests: Request[] = []
  stubFetch(({ method, path, body }) => {
    requests.push({ method, path, body })
    if (path === '/v1/users/me') {
      return jsonResponse(TEST_USER_RESPONSE)
    }
    if (method === 'POST' && path === '/v1/tasks') {
      return create(body)
    }
    if (method === 'GET' && path === '/v1/tasks/new-id') {
      return jsonResponse(taskDetail('new-id', { title: 'Write report' }))
    }
    return problemResponse(500, 'INTERNAL_ERROR')
  })
  const posts = () => requests.filter(({ method, path }) => method === 'POST' && path === '/v1/tasks')
  return { requests, posts }
}

async function form() {
  return screen.findByRole('form', { name: 'New task' })
}

describe('NewTaskPage', () => {
  it('creates the task with the entered values and opens its page', async () => {
    const user = userEvent.setup()
    const { posts } = stubApi(() => jsonResponse(taskDetail('new-id', { title: 'Write report' }), 201))
    const { router } = renderRoute('/tasks/new', { token: 'stored-token' })

    const newTask = within(await form())
    await user.type(newTask.getByLabelText('Title'), '  Write report ')
    await user.type(newTask.getByLabelText('Description'), 'Quarterly numbers')
    fireEvent.change(newTask.getByLabelText('Due date'), { target: { value: '2026-10-31' } })
    await user.selectOptions(newTask.getByLabelText('Priority'), 'High')
    await user.selectOptions(newTask.getByLabelText('Complexity'), 'Hard')
    await user.type(newTask.getByLabelText('Estimated hours'), '12')
    // New tasks start as TODO; there is no status control.
    expect(newTask.queryByLabelText('Status')).toBeNull()
    await user.click(newTask.getByRole('button', { name: 'Create task' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Write report' })).toBeDefined()
    expect(router.state.location.pathname).toBe('/tasks/new-id')
    expect(posts().map(({ body }) => body)).toEqual([
      { title: 'Write report', description: 'Quarterly numbers', priority: 'HIGH', dueDate: '2026-10-31', complexity: 'HARD', estimatedHours: 12 },
    ])
  })

  it('sends the defaults and leaves out an empty due date and complexity', async () => {
    const user = userEvent.setup()
    const { posts } = stubApi(() => jsonResponse(taskDetail('new-id'), 201))
    renderRoute('/tasks/new', { token: 'stored-token' })

    const newTask = within(await form())
    await user.type(newTask.getByLabelText('Title'), 'Plan trip')
    await user.type(newTask.getByLabelText('Description'), 'Book flights')
    await user.click(newTask.getByRole('button', { name: 'Create task' }))

    await screen.findByRole('heading', { level: 1, name: 'Write report' })
    expect(posts()[0].body).toEqual({ title: 'Plan trip', description: 'Book flights', priority: 'MEDIUM' })
  })

  it('checks required fields and lengths without calling the API', async () => {
    const user = userEvent.setup()
    const { posts } = stubApi(() => jsonResponse(taskDetail('new-id'), 201))
    renderRoute('/tasks/new', { token: 'stored-token' })

    const newTask = within(await form())
    await user.click(newTask.getByRole('button', { name: 'Create task' }))
    expect(newTask.getByText('Enter a title.')).toBeDefined()
    expect(newTask.getByText('Enter a description.')).toBeDefined()

    fireEvent.change(newTask.getByLabelText('Title'), { target: { value: 'x'.repeat(101) } })
    await user.click(newTask.getByRole('button', { name: 'Create task' }))
    expect(newTask.getByText('The title can have at most 100 characters.')).toBeDefined()
    expect(newTask.getByLabelText('Title').getAttribute('aria-invalid')).toBe('true')
    expect(posts()).toHaveLength(0)
  })

  it('shows server validation errors on the matching fields', async () => {
    const user = userEvent.setup()
    stubApi(() =>
      problemResponse(400, 'VALIDATION_ERROR', [
        { field: 'title', message: 'size must be between 1 and 100' },
        { field: 'description', message: 'must not be blank' },
      ]),
    )
    const { router } = renderRoute('/tasks/new', { token: 'stored-token' })

    const newTask = within(await form())
    await user.type(newTask.getByLabelText('Title'), 'Title')
    await user.type(newTask.getByLabelText('Description'), 'Description')
    await user.click(newTask.getByRole('button', { name: 'Create task' }))

    expect(await newTask.findByText('Enter a title of at most 100 characters.')).toBeDefined()
    expect(newTask.getByText('Enter a description of at most 500 characters.')).toBeDefined()
    expect(newTask.getByLabelText('Title').getAttribute('aria-invalid')).toBe('true')
    expect(newTask.getByLabelText('Description').getAttribute('aria-invalid')).toBe('true')
    // Mapped onto fields, so no form-level alert.
    expect(newTask.queryByRole('alert')).toBeNull()
    expect(router.state.location.pathname).toBe('/tasks/new')
  })

  it('shows an enum error on its field and other errors above the buttons, in PT-BR', async () => {
    await i18n.changeLanguage('pt-BR')
    const user = userEvent.setup()
    let response = problemResponse(400, 'INVALID_PRIORITY')
    stubApi(() => response)
    renderRoute('/tasks/new', { token: 'stored-token' })

    const newTask = within(await screen.findByRole('form', { name: 'Nova tarefa' }))
    await user.type(newTask.getByLabelText('Título'), 'Título')
    await user.type(newTask.getByLabelText('Descrição'), 'Descrição')
    await user.click(newTask.getByRole('button', { name: 'Criar tarefa' }))
    expect(await newTask.findByText('Essa prioridade não é válida.')).toBeDefined()

    response = problemResponse(500, 'INTERNAL_ERROR')
    await user.click(newTask.getByRole('button', { name: 'Criar tarefa' }))
    expect(await newTask.findByRole('alert')).toBeDefined()
    expect(newTask.queryByText('Essa prioridade não é válida.')).toBeNull()
  })
})
