import { act, renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse, delay } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../test/server'
import { AuthProvider } from './AuthProvider'
import { getStoredRefreshToken, setStoredRefreshToken } from './tokenStorage'
import { useAuth } from './useAuth'

const BASE_URL = 'http://localhost:5078'

function renderAuth() {
  return renderHook(() => useAuth(), { wrapper: AuthProvider })
}

async function waitUntilSettled(result: { current: ReturnType<typeof useAuth> }) {
  await waitFor(() => expect(result.current.status.kind).not.toBe('checking'))
}

describe('AuthProvider — bootstrap', () => {
  it('settles as anonymous (no reason) when there is no stored refresh token', async () => {
    const { result } = renderAuth()
    await waitUntilSettled(result)

    expect(result.current.status).toEqual({ kind: 'anonymous' })
  })

  it('restores the session when the stored refresh token is valid', async () => {
    setStoredRefreshToken('refresh-seed')
    server.use(
      http.post(`${BASE_URL}/api/refresh`, () =>
        HttpResponse.json({ token: 'access-2', refreshToken: 'refresh-2' }),
      ),
    )

    const { result } = renderAuth()
    await waitUntilSettled(result)

    expect(result.current.status).toEqual({ kind: 'authenticated' })
    expect(getStoredRefreshToken()).toBe('refresh-2')
  })

  it('clears the session and marks session-expired on a 401 refresh', async () => {
    setStoredRefreshToken('refresh-seed')
    server.use(http.post(`${BASE_URL}/api/refresh`, () => new HttpResponse(null, { status: 401 })))

    const { result } = renderAuth()
    await waitUntilSettled(result)

    expect(result.current.status).toEqual({ kind: 'anonymous', reason: 'session-expired' })
    expect(getStoredRefreshToken()).toBeNull()
  })

  it('preserves the refresh token on a 429 and exposes retryAfterSeconds', async () => {
    setStoredRefreshToken('refresh-seed')
    server.use(
      http.post(
        `${BASE_URL}/api/refresh`,
        () => new HttpResponse(null, { status: 429, headers: { 'Retry-After': '30' } }),
      ),
    )

    const { result } = renderAuth()
    await waitUntilSettled(result)

    expect(result.current.status).toEqual({
      kind: 'anonymous',
      reason: 'rate-limited',
      retryAfterSeconds: 30,
    })
    expect(getStoredRefreshToken()).toBe('refresh-seed')
  })

  it('preserves the refresh token on a connection failure', async () => {
    setStoredRefreshToken('refresh-seed')
    server.use(http.post(`${BASE_URL}/api/refresh`, () => HttpResponse.error()))

    const { result } = renderAuth()
    await waitUntilSettled(result)

    expect(result.current.status).toEqual({ kind: 'anonymous', reason: 'connection-error' })
    expect(getStoredRefreshToken()).toBe('refresh-seed')
  })

  it('preserves the refresh token on a 5xx response', async () => {
    setStoredRefreshToken('refresh-seed')
    server.use(http.post(`${BASE_URL}/api/refresh`, () => new HttpResponse(null, { status: 500 })))

    const { result } = renderAuth()
    await waitUntilSettled(result)

    expect(result.current.status).toEqual({ kind: 'anonymous', reason: 'connection-error' })
    expect(getStoredRefreshToken()).toBe('refresh-seed')
  })

  it('does not treat an AbortError as a session-expired outcome', async () => {
    setStoredRefreshToken('refresh-seed')
    server.use(
      http.post(`${BASE_URL}/api/refresh`, () => {
        throw new DOMException('aborted', 'AbortError')
      }),
    )

    const { result } = renderAuth()
    await waitUntilSettled(result)

    expect(result.current.status).toEqual({ kind: 'anonymous', reason: 'connection-error' })
    expect(getStoredRefreshToken()).toBe('refresh-seed')
  })

  it('retryInitialization re-attempts the restore after a transient failure', async () => {
    setStoredRefreshToken('refresh-seed')
    let attempts = 0
    server.use(
      http.post(`${BASE_URL}/api/refresh`, () => {
        attempts += 1
        if (attempts === 1) return HttpResponse.error()
        return HttpResponse.json({ token: 'access-3', refreshToken: 'refresh-3' })
      }),
    )

    const { result } = renderAuth()
    await waitUntilSettled(result)
    expect(result.current.status).toEqual({ kind: 'anonymous', reason: 'connection-error' })

    act(() => {
      result.current.retryInitialization()
    })
    expect(result.current.status).toEqual({ kind: 'checking' })

    await waitUntilSettled(result)
    expect(result.current.status).toEqual({ kind: 'authenticated' })
  })
})

describe('AuthProvider — login/logout', () => {
  it('logs in and flips status to authenticated', async () => {
    server.use(
      http.post(`${BASE_URL}/api/login`, () =>
        HttpResponse.json({ token: 'access-1', refreshToken: 'refresh-1' }),
      ),
    )

    const { result } = renderAuth()
    await waitUntilSettled(result)
    await act(async () => {
      await result.current.login('guilherme', 'segredo123')
    })

    expect(result.current.status).toEqual({ kind: 'authenticated' })
    expect(getStoredRefreshToken()).toBe('refresh-1')
  })

  it('clears the local session on logout even when the server call fails', async () => {
    server.use(
      http.post(`${BASE_URL}/api/login`, () =>
        HttpResponse.json({ token: 'access-1', refreshToken: 'refresh-1' }),
      ),
      http.post(`${BASE_URL}/api/logout`, () => HttpResponse.error()),
    )

    const { result } = renderAuth()
    await waitUntilSettled(result)
    await act(async () => {
      await result.current.login('guilherme', 'segredo123')
    })

    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.status).toEqual({ kind: 'anonymous' })
    expect(getStoredRefreshToken()).toBeNull()
  })

  it('prevents a stale in-flight refresh from reauthenticating after logout', async () => {
    setStoredRefreshToken('refresh-stale')
    server.use(
      http.post(`${BASE_URL}/api/refresh`, async () => {
        await delay(50)
        return HttpResponse.json({ token: 'access-late', refreshToken: 'refresh-late' })
      }),
      http.post(`${BASE_URL}/api/logout`, () => new HttpResponse(null, { status: 204 })),
    )

    const { result } = renderAuth()
    expect(result.current.status.kind).toBe('checking')

    // Logout acontece enquanto o refresh de bootstrap ainda está em voo.
    await act(async () => {
      await result.current.logout()
    })
    expect(result.current.status).toEqual({ kind: 'anonymous' })

    // Deixa o refresh tardio resolver — seu resultado deve ser descartado.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 80))
    })

    expect(result.current.status).toEqual({ kind: 'anonymous' })
    expect(getStoredRefreshToken()).toBeNull()
  })
})

describe('AuthProvider — authenticatedRequest', () => {
  it('retries a protected request once after refreshing on a 401', async () => {
    let refreshCalls = 0
    let protectedCalls = 0

    server.use(
      http.post(`${BASE_URL}/api/login`, () =>
        HttpResponse.json({ token: 'access-stale', refreshToken: 'refresh-stale' }),
      ),
      http.post(`${BASE_URL}/api/refresh`, () => {
        refreshCalls += 1
        return HttpResponse.json({ token: 'access-new', refreshToken: 'refresh-new' })
      }),
      http.get(`${BASE_URL}/api/protected`, ({ request }) => {
        protectedCalls += 1
        if (request.headers.get('Authorization') === 'Bearer access-new') {
          return HttpResponse.json({ ok: true })
        }
        return new HttpResponse(null, { status: 401 })
      }),
    )

    const { result } = renderAuth()
    await waitUntilSettled(result)
    await act(async () => {
      await result.current.login('guilherme', 'segredo123')
    })

    let response: unknown
    await act(async () => {
      response = await result.current.authenticatedRequest('/api/protected')
    })

    expect(response).toEqual({ ok: true })
    expect(refreshCalls).toBe(1)
    expect(protectedCalls).toBe(2)
    expect(result.current.status).toEqual({ kind: 'authenticated' })
  })

  it('coordinates concurrent 401s into a single refresh call (single-flight)', async () => {
    let refreshCalls = 0

    server.use(
      http.post(`${BASE_URL}/api/login`, () =>
        HttpResponse.json({ token: 'access-stale', refreshToken: 'refresh-stale' }),
      ),
      http.post(`${BASE_URL}/api/refresh`, () => {
        refreshCalls += 1
        return HttpResponse.json({ token: 'access-new', refreshToken: 'refresh-new' })
      }),
      http.get(`${BASE_URL}/api/protected`, ({ request }) => {
        if (request.headers.get('Authorization') === 'Bearer access-new') {
          return HttpResponse.json({ ok: true })
        }
        return new HttpResponse(null, { status: 401 })
      }),
    )

    const { result } = renderAuth()
    await waitUntilSettled(result)
    await act(async () => {
      await result.current.login('guilherme', 'segredo123')
    })

    let responses: unknown[] = []
    await act(async () => {
      responses = await Promise.all([
        result.current.authenticatedRequest('/api/protected'),
        result.current.authenticatedRequest('/api/protected'),
      ])
    })

    expect(responses).toEqual([{ ok: true }, { ok: true }])
    expect(refreshCalls).toBe(1)
  })

  it('ends the session when the retried request also returns 401, without a second refresh', async () => {
    let refreshCalls = 0

    server.use(
      http.post(`${BASE_URL}/api/login`, () =>
        HttpResponse.json({ token: 'access-stale', refreshToken: 'refresh-stale' }),
      ),
      http.post(`${BASE_URL}/api/refresh`, () => {
        refreshCalls += 1
        return HttpResponse.json({ token: 'access-new', refreshToken: 'refresh-new' })
      }),
      http.get(`${BASE_URL}/api/protected`, () => new HttpResponse(null, { status: 401 })),
    )

    const { result } = renderAuth()
    await waitUntilSettled(result)
    await act(async () => {
      await result.current.login('guilherme', 'segredo123')
    })

    let caught: unknown
    await act(async () => {
      try {
        await result.current.authenticatedRequest('/api/protected')
      } catch (error) {
        caught = error
      }
    })

    expect(caught).toBeDefined()
    expect(refreshCalls).toBe(1)
    expect(result.current.status).toEqual({ kind: 'anonymous', reason: 'session-expired' })
  })

  it('marks the session as anonymous when refresh has nothing to work with', async () => {
    server.use(http.get(`${BASE_URL}/api/protected`, () => new HttpResponse(null, { status: 401 })))

    const { result } = renderAuth()
    await waitUntilSettled(result)

    let caught: unknown
    await act(async () => {
      try {
        await result.current.authenticatedRequest('/api/protected')
      } catch (error) {
        caught = error
      }
    })

    expect(caught).toBeDefined()
    expect(result.current.status).toEqual({ kind: 'anonymous' })
  })

  it('discards a refresh that resolves after logout: never retries the protected call, never receives the late token, never starts a second refresh', async () => {
    let refreshCalls = 0
    let protectedCalls = 0
    let lateTokenCalls = 0

    server.use(
      http.post(`${BASE_URL}/api/login`, () =>
        HttpResponse.json({ token: 'access-old', refreshToken: 'refresh-old' }),
      ),
      http.post(`${BASE_URL}/api/logout`, () => new HttpResponse(null, { status: 204 })),
      http.post(`${BASE_URL}/api/refresh`, async () => {
        refreshCalls += 1
        await delay(60)
        return HttpResponse.json({ token: 'access-late', refreshToken: 'refresh-late' })
      }),
      http.get(`${BASE_URL}/api/protected`, ({ request }) => {
        protectedCalls += 1
        if (request.headers.get('Authorization') === 'Bearer access-late') {
          lateTokenCalls += 1
        }
        return new HttpResponse(null, { status: 401 })
      }),
    )

    // 1. usuário autenticado com access token antigo.
    const { result } = renderAuth()
    await waitUntilSettled(result)
    await act(async () => {
      await result.current.login('guilherme', 'segredo123')
    })

    let caught: unknown
    await act(async () => {
      // 2. requisição protegida retorna 401 → 3. refresh começa e fica pendente (delay de 60ms).
      const requestPromise = result.current
        .authenticatedRequest('/api/protected')
        .catch((error) => {
          caught = error
        })

      // Dá tempo do 401 inicial ser processado e do refresh (com delay) já estar em voo, mas
      // ainda sem resolver, antes do logout.
      await new Promise((resolve) => setTimeout(resolve, 20))

      // 4. logout acontece enquanto o refresh está em andamento.
      await result.current.logout()

      // 5. resposta tardia do refresh devolve um novo access token (resolve depois do logout).
      await requestPromise
    })

    // 6. authenticatedRequest não repete a requisição protegida — só a chamada inicial que deu
    // 401 (uma repetição teria produzido uma segunda chamada).
    expect(protectedCalls).toBe(1)
    // 7. nenhum endpoint protegido recebe o token tardio.
    expect(lateTokenCalls).toBe(0)
    // A operação original é rejeitada de forma controlada (o 401 original), sem retry.
    expect(caught).toBeDefined()
    // 8. status final continua anonymous (sem motivo — o logout não marca "sessão expirada").
    expect(result.current.status).toEqual({ kind: 'anonymous' })
    // 9. sessionStorage continua vazio.
    expect(getStoredRefreshToken()).toBeNull()
    // 10. nenhum novo refresh é iniciado além do único disparado pelo 401 original.
    expect(refreshCalls).toBe(1)
  })

  it('discards a stale refresh outcome when a new login replaces the session while it is pending', async () => {
    let refreshCalls = 0
    let protectedCalls = 0

    server.use(
      http.post(`${BASE_URL}/api/login`, () =>
        HttpResponse.json({ token: 'access-old', refreshToken: 'refresh-old' }),
      ),
      http.post(`${BASE_URL}/api/refresh`, async () => {
        refreshCalls += 1
        await delay(60)
        return HttpResponse.json({ token: 'access-stale-late', refreshToken: 'refresh-stale-late' })
      }),
      http.get(`${BASE_URL}/api/protected`, () => {
        protectedCalls += 1
        return new HttpResponse(null, { status: 401 })
      }),
    )

    const { result } = renderAuth()
    await waitUntilSettled(result)
    await act(async () => {
      await result.current.login('guilherme', 'segredo123')
    })

    let caught: unknown
    await act(async () => {
      const requestPromise = result.current
        .authenticatedRequest('/api/protected')
        .catch((error) => {
          caught = error
        })

      await new Promise((resolve) => setTimeout(resolve, 20))

      // Novo login substitui a sessão enquanto o refresh anterior ainda está em voo.
      server.use(
        http.post(`${BASE_URL}/api/login`, () =>
          HttpResponse.json({ token: 'access-new', refreshToken: 'refresh-new' }),
        ),
      )
      await result.current.login('outrousuario', 'outrasenha123')

      await requestPromise
    })

    expect(protectedCalls).toBe(1)
    expect(caught).toBeDefined()
    // A sessão nova (do segundo login) não pode ser sobrescrita pela resposta tardia do refresh
    // da sessão antiga.
    expect(result.current.status).toEqual({ kind: 'authenticated' })
    expect(getStoredRefreshToken()).toBe('refresh-new')
    expect(refreshCalls).toBe(1)
  })
})
