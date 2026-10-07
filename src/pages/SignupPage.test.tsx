import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { getToken } from '../auth/tokenStorage.ts'
import i18n from '../i18n/index.ts'
import { dashboardResponse, jsonResponse, problemResponse, stubFetch } from '../test/fetchMock.ts'
import { renderRoute } from '../test/renderRoute.tsx'

const AUTH_RESPONSE = {
  token: 'new-token',
  expiresAt: '2026-10-07T12:00:00Z',
  user: { id: 'a1b2', name: 'Ana Souza', email: 'ana@example.com' },
}

interface Values {
  email?: string
  name?: string
  password?: string
}

async function fillAndSubmit({ email = 'ana@example.com', name = 'Ana Souza', password = 'secret123' }: Values = {}) {
  const user = userEvent.setup()
  await user.type(await screen.findByLabelText(/^(Email|E-mail)$/), email)
  await user.type(screen.getByLabelText(/^(Name|Nome)$/), name)
  // `user.type` would take far too long on long passwords, so paste instead.
  await user.click(screen.getByLabelText(/^(Password|Senha)$/))
  await user.paste(password)
  await user.click(screen.getByRole('button', { name: /^(Create account|Criar conta)$/ }))
}

/** The error message shown under the field with this label. */
function fieldError(label: string): string | null {
  const input = screen.getByLabelText(label)
  const id = input.getAttribute('aria-describedby')
  return id ? (document.getElementById(id)?.textContent ?? null) : null
}

describe('SignupPage', () => {
  it('signs up, stores the token and navigates to /', async () => {
    const fetchMock = stubFetch(({ path }) => dashboardResponse(path) ?? jsonResponse(AUTH_RESPONSE, 201))
    const { router } = renderRoute('/signup')

    await fillAndSubmit({ email: ' ana@example.com  ' })

    expect(await screen.findByRole('heading', { level: 1, name: 'Your tasks' })).toBeDefined()
    expect(router.state.location.pathname).toBe('/')
    expect(getToken()).toBe('new-token')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/v1/auth/signup')
    expect(JSON.parse(String(init?.body))).toEqual({
      email: 'ana@example.com',
      name: 'Ana Souza',
      password: 'secret123',
    })
  })

  it('shows a 409 EMAIL_ALREADY_USED on the email field', async () => {
    stubFetch(() => problemResponse(409, 'EMAIL_ALREADY_USED'))
    renderRoute('/signup')

    await fillAndSubmit()

    expect(await screen.findByText('An account with this email already exists.')).toBeDefined()
    expect(fieldError('Email')).toBe('An account with this email already exists.')
    expect(screen.getByLabelText('Email').getAttribute('aria-invalid')).toBe('true')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it.each([
    [
      'en',
      {
        Email: 'Enter a valid email address with at most 100 characters.',
        Name: 'Enter a name with at most 100 characters.',
        Password: "Use a password with at least 8 characters that isn't too long.",
      },
    ],
    [
      'pt-BR',
      {
        'E-mail': 'Informe um e-mail válido com no máximo 100 caracteres.',
        Nome: 'Informe um nome com no máximo 100 caracteres.',
        Senha: 'Use uma senha com pelo menos 8 caracteres e que não seja longa demais.',
      },
    ],
  ])('puts server field errors on the matching fields as localized messages (%s)', async (lng, expected) => {
    await i18n.changeLanguage(lng)
    stubFetch(() =>
      problemResponse(400, 'VALIDATION_ERROR', [
        { field: 'email', message: 'must be a well-formed email address' },
        { field: 'name', message: 'must not be blank' },
        { field: 'password', message: 'must be at most 72 bytes' },
      ]),
    )
    renderRoute('/signup')

    await fillAndSubmit()

    await screen.findByText(Object.values(expected)[0])
    for (const [label, message] of Object.entries(expected)) {
      expect(fieldError(label)).toBe(message)
    }
    expect(screen.queryByText('must not be blank')).toBeNull()
  })

  it('shows a form-level message for a validation error on an unknown field', async () => {
    stubFetch(() => problemResponse(400, 'VALIDATION_ERROR', [{ field: 'other', message: 'bad' }]))
    renderRoute('/signup')

    await fillAndSubmit()

    expect((await screen.findByRole('alert')).textContent).toBe('Some fields are invalid. Check them and try again.')
  })

  it('shows the generic message on a network error', async () => {
    stubFetch(() => Promise.reject(new TypeError('Failed to fetch')))
    renderRoute('/signup')

    await fillAndSubmit()

    expect((await screen.findByRole('alert')).textContent).toBe(
      'Something went wrong. Check your connection and try again.',
    )
  })

  it('rejects a password of 72 characters but more than 72 bytes client-side', async () => {
    const fetchMock = stubFetch(() => jsonResponse(AUTH_RESPONSE, 201))
    renderRoute('/signup')
    const password = 'é'.repeat(72)
    expect(password).toHaveLength(72)

    await fillAndSubmit({ password })

    expect(fieldError('Password')).toBe(
      'The password is too long. Accented letters and symbols count as more than one character.',
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([
    [{ email: 'not-an-email' }, 'Email', 'Enter a valid email address.'],
    [{ name: '   ' }, 'Name', 'Enter your name.'],
    [{ password: 'short' }, 'Password', 'The password must have at least 8 characters.'],
  ])('checks %j client-side', async (values, label, message) => {
    const fetchMock = stubFetch(() => jsonResponse(AUTH_RESPONSE, 201))
    renderRoute('/signup')

    await fillAndSubmit(values)

    expect(fieldError(label)).toBe(message)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('links to the login page', async () => {
    renderRoute('/signup')

    const main = await screen.findByRole('main')
    expect(main.querySelector('a[href="/login"]')?.textContent).toBe('Log in')
  })
})
