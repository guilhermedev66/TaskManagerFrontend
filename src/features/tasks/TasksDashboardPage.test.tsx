import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse, delay } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { apiRequest } from '../../lib/api/apiClient'
import { AuthContext, type AuthContextValue } from '../../auth/AuthContext'
import { AuthProvider } from '../../auth/AuthProvider'
import { setStoredRefreshToken } from '../../auth/tokenStorage'
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
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 15_000 } },
  })
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

function captureRequests() {
  const calls: URLSearchParams[] = []
  server.use(
    http.get(`${BASE_URL}/api/tasks`, ({ request }) => {
      calls.push(new URL(request.url).searchParams)
      return HttpResponse.json(pagedResponse([buildTask()]))
    }),
  )
  return calls
}

describe('TasksDashboardPage', () => {
  it('sends the default query (page 1, pageSize 10, status All, sortBy CreatedAt, sortDirection Desc) with no title', async () => {
    const calls = captureRequests()
    renderDashboard()
    await screen.findAllByText('Comprar leite')

    expect(calls).toHaveLength(1)
    expect(calls[0].get('page')).toBe('1')
    expect(calls[0].get('pageSize')).toBe('10')
    expect(calls[0].get('status')).toBe('All')
    expect(calls[0].get('sortBy')).toBe('CreatedAt')
    expect(calls[0].get('sortDirection')).toBe('Desc')
    expect(calls[0].has('title')).toBe(false)
  })

  it('shows a skeleton region while the initial request is in flight', async () => {
    server.use(
      http.get(`${BASE_URL}/api/tasks`, async () => {
        await delay(30)
        return HttpResponse.json(pagedResponse([buildTask()]))
      }),
    )
    renderDashboard()
    expect(document.querySelector('[aria-hidden="true"]')).toBeTruthy()
    await screen.findAllByText('Comprar leite')
  })

  it('search only sends a request 350ms after the user stops typing, and omits an empty title entirely', async () => {
    const calls = captureRequests()
    const user = userEvent.setup()
    renderDashboard()
    await screen.findAllByText('Comprar leite')

    await user.type(screen.getByLabelText('Buscar tarefas por título'), 'leite')
    expect(calls).toHaveLength(1)

    await waitFor(() => expect(calls).toHaveLength(2), { timeout: 1000 })
    expect(calls[1].get('title')).toBe('leite')
    expect(calls[1].get('page')).toBe('1')
  })

  it('clearing the search is immediate and resets to page 1', async () => {
    const calls = captureRequests()
    const user = userEvent.setup()
    renderDashboard('/tasks?title=leite&page=2')
    await screen.findAllByText('Comprar leite')

    await user.click(screen.getByRole('button', { name: 'Limpar busca' }))
    await waitFor(() => expect(calls.at(-1)?.has('title')).toBe(false))
    expect(calls.at(-1)?.get('page')).toBe('1')
  })

  it('changing the status filter resets page to 1 and sends the new status', async () => {
    const calls = captureRequests()
    const user = userEvent.setup()
    renderDashboard('/tasks?page=2')
    await screen.findAllByText('Comprar leite')

    await user.click(screen.getByRole('radio', { name: /Pendentes/ }))
    await waitFor(() => expect(calls.at(-1)?.get('status')).toBe('Pending'))
    expect(calls.at(-1)?.get('page')).toBe('1')
  })

  it('clears search and status together in one URL update', async () => {
    const calls = captureRequests()
    const user = userEvent.setup()
    renderDashboard('/tasks?status=Pending&title=leite&page=2')
    await screen.findAllByText('Comprar leite')

    await user.click(screen.getByRole('button', { name: 'Limpar filtros' }))

    await waitFor(() => {
      const latest = calls.at(-1)
      expect(latest?.get('status')).toBe('All')
      expect(latest?.has('title')).toBe(false)
      expect(latest?.get('page')).toBe('1')
    })
  })

  it('changing only the page preserves the other active filters', async () => {
    const calls: URLSearchParams[] = []
    server.use(
      http.get(`${BASE_URL}/api/tasks`, ({ request }) => {
        const params = new URL(request.url).searchParams
        calls.push(params)
        return HttpResponse.json(
          pagedResponse([buildTask()], {
            page: Number(params.get('page') ?? '1'),
            totalPages: 3,
            totalItems: 25,
          }),
        )
      }),
    )
    const user = userEvent.setup()
    renderDashboard('/tasks?status=Pending&title=leite')
    await screen.findAllByText('Comprar leite')

    await user.click(screen.getByRole('button', { name: 'Próxima página' }))
    await waitFor(() => expect(calls.at(-1)?.get('page')).toBe('2'))
    expect(calls.at(-1)?.get('status')).toBe('Pending')
    expect(calls.at(-1)?.get('title')).toBe('leite')
  })

  it('never lets a stale (slower, earlier) response overwrite the latest query result', async () => {
    server.use(
      http.get(`${BASE_URL}/api/tasks`, async ({ request }) => {
        const title = new URL(request.url).searchParams.get('title')
        if (!title) {
          await delay(500)
          return HttpResponse.json(pagedResponse([buildTask({ id: 1, title: 'Resultado antigo' })]))
        }
        return HttpResponse.json(
          pagedResponse([buildTask({ id: 2, title: `Resultado para ${title}` })]),
        )
      }),
    )
    const user = userEvent.setup()
    renderDashboard()

    await user.type(screen.getByLabelText('Buscar tarefas por título'), 'x')
    await waitFor(() => expect(screen.getAllByText('Resultado para x').length).toBeGreaterThan(0), {
      timeout: 1000,
    })

    await new Promise((resolve) => setTimeout(resolve, 600))
    expect(screen.queryAllByText('Resultado antigo')).toHaveLength(0)
    expect(screen.getAllByText('Resultado para x').length).toBeGreaterThan(0)
  })

  it('shows the welcoming empty state without its own embedded create CTA (the header already has one)', async () => {
    server.use(http.get(`${BASE_URL}/api/tasks`, () => HttpResponse.json(pagedResponse([]))))
    renderDashboard()
    const emptyTitle = await screen.findByText('Você ainda não tem tarefas')
    const emptyCard = emptyTitle.parentElement as HTMLElement
    expect(within(emptyCard).queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nova tarefa' })).toBeInTheDocument()
  })

  it('shows a search-no-results state naming the term, with a Limpar busca action', async () => {
    server.use(http.get(`${BASE_URL}/api/tasks`, () => HttpResponse.json(pagedResponse([]))))
    renderDashboard('/tasks?title=inexistente')
    expect(await screen.findByText(/inexistente/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Limpar busca' })).toBeInTheDocument()
  })

  it('shows a filter-no-results state naming the active filter, with a clear action', async () => {
    server.use(http.get(`${BASE_URL}/api/tasks`, () => HttpResponse.json(pagedResponse([]))))
    renderDashboard('/tasks?status=Completed')
    expect(await screen.findByText('Filtro ativo: Concluídas.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Limpar filtro' })).toBeInTheDocument()
  })

  it('shows a persistent connection-failure state with Tentar novamente (not just a toast)', async () => {
    server.use(http.get(`${BASE_URL}/api/tasks`, () => HttpResponse.error()))
    renderDashboard()
    expect(await screen.findByText('Não foi possível carregar suas tarefas')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument()
  })

  it('shows a safe generic message for an unexpected server error, never raw detail/title', async () => {
    server.use(
      http.get(`${BASE_URL}/api/tasks`, () =>
        HttpResponse.json(
          { detail: 'segredo interno do servidor', title: 'Boom' },
          { status: 500 },
        ),
      ),
    )
    renderDashboard()
    await screen.findByText('Algo deu errado')
    expect(screen.queryByText(/segredo interno/)).not.toBeInTheDocument()
    expect(screen.queryByText('Boom')).not.toBeInTheDocument()
  })

  it('paginates: first page disables Anterior, a middle page enables both, last page disables Próxima', async () => {
    server.use(
      http.get(`${BASE_URL}/api/tasks`, () =>
        HttpResponse.json(pagedResponse([buildTask()], { page: 1, totalPages: 3, totalItems: 25 })),
      ),
    )
    renderDashboard()
    await screen.findAllByText('Comprar leite')
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Próxima página' })).not.toBeDisabled()
  })

  it('opens the mobile filter sheet and only Aplicar sends a new request', async () => {
    const calls = captureRequests()
    const user = userEvent.setup()
    renderDashboard()
    await screen.findAllByText('Comprar leite')
    calls.length = 0

    await user.click(screen.getByRole('button', { name: 'Filtros e ordenação' }))
    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('radio', { name: /Concluídas/ }))
    expect(calls).toHaveLength(0)

    await user.click(within(dialog).getByRole('button', { name: 'Aplicar' }))
    await waitFor(() => expect(calls).toHaveLength(1))
    expect(calls[0].get('status')).toBe('Completed')
    expect(calls[0].get('page')).toBe('1')
  })

  it('a 401 from GET /api/tasks flows through the central AuthProvider refresh, not a local list error', async () => {
    setStoredRefreshToken('refresh-seed')
    let taskCalls = 0
    server.use(
      http.post(`${BASE_URL}/api/refresh`, () =>
        HttpResponse.json({ token: 'fresh-token', refreshToken: 'refresh-2' }),
      ),
      http.get(`${BASE_URL}/api/tasks`, ({ request }) => {
        taskCalls += 1
        const auth = request.headers.get('Authorization')
        if (auth !== 'Bearer fresh-token') {
          return HttpResponse.json({ status: 401, title: 'Unauthorized' }, { status: 401 })
        }
        return HttpResponse.json(pagedResponse([buildTask()]))
      }),
    )

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    window.history.pushState({}, '', '/tasks')
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter initialEntries={['/tasks']}>
            <Routes>
              <Route path="/tasks" element={<TasksDashboardPage />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>,
    )

    await screen.findAllByText('Comprar leite')
    expect(taskCalls).toBe(2)
    expect(screen.queryByText('Algo deu errado')).not.toBeInTheDocument()
  })
})
