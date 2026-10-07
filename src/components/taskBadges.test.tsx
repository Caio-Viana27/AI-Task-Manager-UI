import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import i18n from '../i18n/index.ts'
import { ComplexityBadge } from './ComplexityBadge.tsx'
import { PriorityBadge } from './PriorityBadge.tsx'
import { StatusBadge } from './StatusBadge.tsx'

describe('task badges', () => {
  it.each([
    ['en', 'High', 'Priority: High'],
    ['pt-BR', 'Alta', 'Prioridade: Alta'],
  ] as const)('PriorityBadge renders the %s label', async (lng, value, full) => {
    await i18n.changeLanguage(lng)
    const { container } = render(<PriorityBadge priority="HIGH" />)
    expect(screen.getByText(value)).toBeDefined()
    expect(container.textContent).toBe(full)
  })

  it.each([
    ['en', ['To do', 'In progress', 'Overdue', 'Done']],
    ['pt-BR', ['A fazer', 'Em andamento', 'Atrasada', 'Concluída']],
  ] as const)('StatusBadge renders every %s label', async (lng, labels) => {
    await i18n.changeLanguage(lng)
    render(
      <>
        <StatusBadge status="TODO" />
        <StatusBadge status="IN_PROGRESS" />
        <StatusBadge status="OVERDUE" />
        <StatusBadge status="DONE" />
      </>,
    )
    for (const label of labels) {
      expect(screen.getByText(label)).toBeDefined()
    }
  })

  it.each([
    ['en', 'Hard', 'Not estimated'],
    ['pt-BR', 'Difícil', 'Não estimada'],
  ] as const)('ComplexityBadge renders the %s label and the empty state', async (lng, hard, none) => {
    await i18n.changeLanguage(lng)
    render(
      <>
        <ComplexityBadge complexity="HARD" />
        <ComplexityBadge complexity={null} />
      </>,
    )
    expect(screen.getByText(hard)).toBeDefined()
    expect(screen.getByText(none)).toBeDefined()
  })
})
