import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { apiRequest } from '../../lib/api/apiClient'
import { AuthContext, type AuthContextValue } from '../../auth/AuthContext'
import { server } from '../../test/server'
import type { PagedResponse, TaskItem as TaskItemType } from '../../types/tasks'
import { TasksDashboardPage } from './TasksDashboardPage'

const BASE_URL = 'http://localhost:5078'

const STUB_AUTH: AuthContextValue = {
  status: { kind: 'authenticated' },
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  retryInitialization: vi.fn(),
  authenticatedRequest: (path, options) =>
    apiRequest(path, { ...options, accessToken: 'test-token' }),
}

// TaskItem renderiza o título duas vezes (texto visível + tooltip acessível) — toda asserção de
// título usa a variante "AllBy" por isso, nunca a singular.
async function findTaskTitle(title: string) {
  return (await screen.findAllByText(title))[0]
}
function queryTaskTitle(title: string) {
  const matches = screen.queryAllByText(title)
  return matches.length > 0 ? matches[0] : null
}

function buildTask(overrides: Partial<TaskItemType> = {}): TaskItemType {
  return {
    id: 1,
    title: 'Comprar leite',
    description: null,
    priority: 1,
    createdAt: '2026-01-01T00:00:00Z',
    dueDate: null,
    isCompleted: false,
    ...overrides,
  }
}

function pagedResponse(
  items: TaskItemType[],
  overrides: Partial<PagedResponse<TaskItemType>> = {},
): PagedResponse<TaskItemType> {
  return { items, page: 1, pageSize: 10, totalItems: items.length, totalPages: 1, ...overrides }
}

function renderDashboard(initialPath = '/tasks') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  window.history.pushState({}, '', initialPath)
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={STUB_AUTH}>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/tasks" element={<TasksDashboardPage />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  )
}

describe('TasksDashboardPage — CRUD', () => {
  it('creates a task: POST fires, dialog closes, list refetches showing the new task', async () => {
    let tasks = [buildTask({ id: 1, title: 'Existente' })]
    server.use(
      http.get(`${BASE_URL}/api/tasks`, () => HttpResponse.json(pagedResponse(tasks))),
      http.post(`${BASE_URL}/api/tasks`, async ({ request }) => {
        const body = (await request.json()) as { title: string }
        const created = buildTask({ id: 2, title: body.title })
        tasks = [...tasks, created]
        return HttpResponse.json(created, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderDashboard()
    await findTaskTitle('Existente')

    await user.click(screen.getByRole('button', { name: 'Nova tarefa' }))
    await user.type(screen.getByLabelText('Título'), 'Tarefa nova')
    await user.click(screen.getByRole('button', { name: 'Criar tarefa' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await waitFor(async () => expect(await findTaskTitle('Tarefa nova')).toBeInTheDocument())
  })

  it('returns focus to "Nova tarefa" after Cancelar closes the create dialog', async () => {
    server.use(
      http.get(`${BASE_URL}/api/tasks`, () => HttpResponse.json(pagedResponse([buildTask()]))),
    )
    const user = userEvent.setup()
    renderDashboard()
    await findTaskTitle('Comprar leite')

    const trigger = screen.getByRole('button', { name: 'Nova tarefa' })
    await user.click(trigger)
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('edits a task: PUT sends the full payload including isCompleted', async () => {
    const task = buildTask({ id: 1, title: 'Comprar leite', priority: 1 })
    let putBody: unknown
    server.use(
      http.get(`${BASE_URL}/api/tasks`, () => HttpResponse.json(pagedResponse([task]))),
      http.put(`${BASE_URL}/api/tasks/1`, async ({ request }) => {
        putBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderDashboard()
    await findTaskTitle('Comprar leite')

    await user.click(screen.getByRole('button', { name: 'Editar "Comprar leite"' }))
    const titleField = await screen.findByLabelText('Título')
    await user.clear(titleField)
    await user.type(titleField, 'Comprar pão')
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(putBody).toEqual({
      title: 'Comprar pão',
      description: null,
      priority: 1,
      dueDate: null,
      isCompleted: false,
    })
  })

  it('editing a task that no longer exists (404) closes the dialog and shows a contextual message', async () => {
    const task = buildTask({ id: 1, title: 'Comprar leite' })
    let listCalls = 0
    server.use(
      http.get(`${BASE_URL}/api/tasks`, () => {
        listCalls += 1
        return HttpResponse.json(pagedResponse([task]))
      }),
      http.put(`${BASE_URL}/api/tasks/1`, () =>
        HttpResponse.json({ status: 404, title: 'Not Found' }, { status: 404 }),
      ),
    )
    const user = userEvent.setup()
    renderDashboard()
    await findTaskTitle('Comprar leite')

    await user.click(screen.getByRole('button', { name: 'Editar "Comprar leite"' }))
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(await screen.findByText('Esta tarefa não existe mais.')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => expect(listCalls).toBeGreaterThan(1))
  })

  it('toggling completion is optimistic: the row updates immediately, before the request settles', async () => {
    let isCompleted = false
    server.use(
      http.get(`${BASE_URL}/api/tasks`, () =>
        HttpResponse.json(
          pagedResponse([buildTask({ id: 1, title: 'Comprar leite', isCompleted })]),
        ),
      ),
      http.put(`${BASE_URL}/api/tasks/1`, async ({ request }) => {
        const body = (await request.json()) as { isCompleted: boolean }
        await new Promise((resolve) => setTimeout(resolve, 50))
        isCompleted = body.isCompleted
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderDashboard()
    await findTaskTitle('Comprar leite')

    const checkbox = screen.getByRole('checkbox')
    await user.click(checkbox)
    // Otimista: marcado e em loading antes da resposta do servidor (delay de 50ms) chegar.
    await waitFor(() => expect(checkbox).toBeChecked())
    expect(checkbox).toBeDisabled()

    await waitFor(() => expect(checkbox).not.toBeDisabled())
    expect(checkbox).toBeChecked()
  })

  it('rolls back the checkbox and shows a contextual error when the toggle request fails', async () => {
    server.use(
      http.get(`${BASE_URL}/api/tasks`, () =>
        HttpResponse.json(
          pagedResponse([buildTask({ id: 1, title: 'Comprar leite', isCompleted: false })]),
        ),
      ),
      http.put(`${BASE_URL}/api/tasks/1`, () => HttpResponse.error()),
    )
    const user = userEvent.setup()
    renderDashboard()
    await findTaskTitle('Comprar leite')

    const checkbox = screen.getByRole('checkbox')
    await user.click(checkbox)

    // A falha é síncrona o bastante para que o rollback possa acontecer antes de qualquer
    // pintura intermediária — a garantia observável real é o estado final: volta a desmarcado.
    await waitFor(() => expect(checkbox).not.toBeChecked())
    const row = checkbox.closest('li')
    expect(row).not.toBeNull()
    expect(await within(row as HTMLElement).findByRole('alert')).toHaveTextContent(
      /Não foi possível atualizar/,
    )
  })

  it('a completed task never shows as overdue, even with a past due date, after being toggled', async () => {
    let isCompleted = false
    server.use(
      http.get(`${BASE_URL}/api/tasks`, () =>
        HttpResponse.json(
          pagedResponse([buildTask({ id: 1, title: 'Comprar leite', isCompleted, dueDate: null })]),
        ),
      ),
      http.put(`${BASE_URL}/api/tasks/1`, async ({ request }) => {
        const body = (await request.json()) as { isCompleted: boolean }
        isCompleted = body.isCompleted
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderDashboard()
    await findTaskTitle('Comprar leite')

    await user.click(screen.getByRole('checkbox'))
    await waitFor(() => expect(screen.getByRole('checkbox')).toBeChecked())
    expect(screen.queryByText(/Atrasada/)).not.toBeInTheDocument()
  })

  it('deletes a task after confirmation, and Cancelar leaves it untouched', async () => {
    const task = buildTask({ id: 1, title: 'Comprar leite' })
    let deleteCalls = 0
    server.use(
      http.get(`${BASE_URL}/api/tasks`, () =>
        HttpResponse.json(pagedResponse(deleteCalls > 0 ? [] : [task])),
      ),
      http.delete(`${BASE_URL}/api/tasks/1`, () => {
        deleteCalls += 1
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderDashboard()
    await findTaskTitle('Comprar leite')

    await user.click(screen.getByRole('button', { name: 'Excluir "Comprar leite"' }))
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(deleteCalls).toBe(0)
    expect(queryTaskTitle('Comprar leite')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Excluir "Comprar leite"' }))
    await user.click(screen.getByRole('button', { name: 'Excluir' }))

    await waitFor(() => expect(deleteCalls).toBe(1))
    expect(await screen.findByText('Você ainda não tem tarefas')).toBeInTheDocument()
  })

  it('deleting a task that no longer exists (404) closes the dialog and shows a contextual message', async () => {
    const task = buildTask({ id: 1, title: 'Comprar leite' })
    let listCalls = 0
    server.use(
      http.get(`${BASE_URL}/api/tasks`, () => {
        listCalls += 1
        return HttpResponse.json(pagedResponse([task]))
      }),
      http.delete(`${BASE_URL}/api/tasks/1`, () =>
        HttpResponse.json({ status: 404, title: 'Not Found' }, { status: 404 }),
      ),
    )
    const user = userEvent.setup()
    renderDashboard()
    await findTaskTitle('Comprar leite')

    await user.click(screen.getByRole('button', { name: 'Excluir "Comprar leite"' }))
    await user.click(screen.getByRole('button', { name: 'Excluir' }))

    expect(await screen.findByText('Esta tarefa não existe mais.')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => expect(listCalls).toBeGreaterThan(1))
  })

  it('deleting the last task on page 2 normalizes back to a valid page', async () => {
    let onPageTwo = true
    server.use(
      http.get(`${BASE_URL}/api/tasks`, ({ request }) => {
        const page = new URL(request.url).searchParams.get('page') ?? '1'
        if (page === '2' && onPageTwo) {
          return HttpResponse.json(
            pagedResponse([buildTask({ id: 2, title: 'Última da página 2' })], {
              page: 2,
              totalPages: 2,
              totalItems: 11,
            }),
          )
        }
        return HttpResponse.json(
          pagedResponse(
            Array.from({ length: 10 }, (_, i) => buildTask({ id: i + 10, title: `Tarefa ${i}` })),
            { page: 1, totalPages: 1, totalItems: 10 },
          ),
        )
      }),
      http.delete(`${BASE_URL}/api/tasks/2`, () => {
        onPageTwo = false
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderDashboard('/tasks?page=2')
    await findTaskTitle('Última da página 2')

    await user.click(screen.getByRole('button', { name: 'Excluir "Última da página 2"' }))
    await user.click(screen.getByRole('button', { name: 'Excluir' }))

    await waitFor(async () => expect(await findTaskTitle('Tarefa 0')).toBeInTheDocument())
  })
})
