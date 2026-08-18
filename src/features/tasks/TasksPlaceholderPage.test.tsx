import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TasksPlaceholderPage } from './TasksPlaceholderPage'

describe('TasksPlaceholderPage', () => {
  it('renders exactly one h1', () => {
    render(<TasksPlaceholderPage />)

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('does not render its own main landmark (the shell owns it)', () => {
    render(<TasksPlaceholderPage />)

    expect(screen.queryByRole('main')).not.toBeInTheDocument()
  })
})
