import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ApiError } from '../api/client.ts'
import i18n from '../i18n/index.ts'
import { ErrorMessage } from './ErrorMessage.tsx'

describe('ErrorMessage', () => {
  it('shows the message for the ApiError code', () => {
    render(<ErrorMessage error={new ApiError(404, 'TASK_NOT_FOUND', [], 'x')} />)
    expect(screen.getByRole('alert').textContent).toBe("This task doesn't exist.")
  })

  it('shows the PT-BR message', async () => {
    await i18n.changeLanguage('pt-BR')
    render(<ErrorMessage error={new ApiError(400, 'SUBTASK_DEPTH_EXCEEDED', [], 'x')} />)
    expect(screen.getByRole('alert').textContent).toBe(
      'Esta tarefa está na profundidade máxima e não pode receber mais subtarefas.',
    )
  })

  it('falls back to the generic message for unknown errors', () => {
    render(<ErrorMessage error={new TypeError('Failed to fetch')} />)
    expect(screen.getByRole('alert').textContent).toBe('Something went wrong. Check your connection and try again.')
  })

  it('renders nothing without an error', () => {
    const { container } = render(<ErrorMessage error={null} />)
    expect(container.innerHTML).toBe('')
  })
})
