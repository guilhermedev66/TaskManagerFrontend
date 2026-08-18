import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the temporary component review page', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'COMPONENTES BASE — REVISÃO' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Tipografia' })).toBeInTheDocument()
  })
})
