import { http, HttpResponse, delay } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../../test/server'
import { apiRequest } from './apiClient'
import { ApiError, ConnectionError } from './apiErrors'

const BASE_URL = 'http://localhost:5078'

describe('apiRequest', () => {
  it('returns typed JSON on a successful GET', async () => {
    server.use(
      http.get(`${BASE_URL}/api/tasks/1`, () => HttpResponse.json({ id: 1, title: 'Teste' })),
    )

    const result = await apiRequest<{ id: number; title: string }>('/api/tasks/1')

    expect(result).toEqual({ id: 1, title: 'Teste' })
  })

  it('serializes the body and sends Content-Type on POST', async () => {
    server.use(
      http.post(`${BASE_URL}/api/tasks`, async ({ request }) =>
        HttpResponse.json({
          received: await request.json(),
          contentType: request.headers.get('Content-Type'),
        }),
      ),
    )

    const result = await apiRequest<{ received: unknown; contentType: string | null }>(
      '/api/tasks',
      { method: 'POST', body: { title: 'Nova tarefa' } },
    )

    expect(result.received).toEqual({ title: 'Nova tarefa' })
    expect(result.contentType).toBe('application/json')
  })

  it('sends Authorization when an access token is provided', async () => {
    server.use(
      http.get(`${BASE_URL}/api/tasks`, ({ request }) =>
        HttpResponse.json({ authorization: request.headers.get('Authorization') }),
      ),
    )

    const result = await apiRequest<{ authorization: string | null }>('/api/tasks', {
      accessToken: 'abc123',
    })

    expect(result.authorization).toBe('Bearer abc123')
  })

  it('does not send Authorization without an access token', async () => {
    server.use(
      http.get(`${BASE_URL}/api/tasks`, ({ request }) =>
        HttpResponse.json({ authorization: request.headers.get('Authorization') }),
      ),
    )

    const result = await apiRequest<{ authorization: string | null }>('/api/tasks')

    expect(result.authorization).toBeNull()
  })

  it('handles 204 No Content as undefined', async () => {
    server.use(
      http.delete(`${BASE_URL}/api/tasks/1`, () => new HttpResponse(null, { status: 204 })),
    )

    const result = await apiRequest<undefined>('/api/tasks/1', { method: 'DELETE' })

    expect(result).toBeUndefined()
  })

  it('forwards the AbortSignal to fetch', async () => {
    server.use(
      http.get(`${BASE_URL}/api/tasks/slow`, async () => {
        await delay(50)
        return HttpResponse.json({ ok: true })
      }),
    )

    const controller = new AbortController()
    const promise = apiRequest('/api/tasks/slow', { signal: controller.signal })
    controller.abort()

    await expect(promise).rejects.toThrow()
  })

  it('preserves AbortError instead of wrapping it as ConnectionError', async () => {
    server.use(
      http.get(`${BASE_URL}/api/tasks/slow`, async () => {
        await delay(50)
        return HttpResponse.json({ ok: true })
      }),
    )

    const controller = new AbortController()
    const promise = apiRequest('/api/tasks/slow', { signal: controller.signal })
    controller.abort()

    let caught: unknown
    try {
      await promise
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(Error)
    expect((caught as Error).name).toBe('AbortError')
    expect(caught).not.toBeInstanceOf(ConnectionError)
  })

  it('wraps a network failure as ConnectionError', async () => {
    server.use(http.get(`${BASE_URL}/api/tasks`, () => HttpResponse.error()))

    await expect(apiRequest('/api/tasks')).rejects.toThrow(ConnectionError)
  })

  it('turns a ProblemDetails error response into ApiError', async () => {
    server.use(
      http.post(
        `${BASE_URL}/api/register`,
        () =>
          new HttpResponse(
            JSON.stringify({
              title: 'Conflict',
              status: 409,
              detail: 'Usuário já existe.',
            }),
            { status: 409, headers: { 'Content-Type': 'application/json' } },
          ),
      ),
    )

    let caught: unknown
    try {
      await apiRequest('/api/register', { method: 'POST', body: {} })
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(ApiError)
    const apiError = caught as ApiError
    expect(apiError.status).toBe(409)
    expect(apiError.detail).toBe('Usuário já existe.')
  })

  it('preserves field errors from a ValidationProblemDetails response', async () => {
    server.use(
      http.post(
        `${BASE_URL}/api/tasks`,
        () =>
          new HttpResponse(
            JSON.stringify({
              title: 'One or more validation errors occurred.',
              status: 400,
              errors: { Title: ['O campo Title é obrigatório.'] },
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } },
          ),
      ),
    )

    let caught: unknown
    try {
      await apiRequest('/api/tasks', { method: 'POST', body: {} })
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(ApiError)
    expect((caught as ApiError).validationErrors).toEqual({
      Title: ['O campo Title é obrigatório.'],
    })
  })

  it('does not break on a malformed error payload', async () => {
    server.use(
      http.get(`${BASE_URL}/api/tasks`, () => new HttpResponse('não é json', { status: 500 })),
    )

    let caught: unknown
    try {
      await apiRequest('/api/tasks')
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(ApiError)
    expect((caught as ApiError).status).toBe(500)
    expect((caught as ApiError).validationErrors).toBeUndefined()
  })

  it('does not break on a non-JSON success response', async () => {
    server.use(http.get(`${BASE_URL}/api/health`, () => new HttpResponse('ok', { status: 200 })))

    const result = await apiRequest('/api/health')

    expect(result).toBeUndefined()
  })

  it('reads Retry-After on a 429 response', async () => {
    server.use(
      http.post(
        `${BASE_URL}/api/login`,
        () => new HttpResponse(null, { status: 429, headers: { 'Retry-After': '30' } }),
      ),
    )

    let caught: unknown
    try {
      await apiRequest('/api/login', { method: 'POST', body: {} })
    } catch (error) {
      caught = error
    }

    expect((caught as ApiError).retryAfterSeconds).toBe(30)
  })

  it('turns an invalid Retry-After into undefined', async () => {
    server.use(
      http.post(
        `${BASE_URL}/api/login`,
        () => new HttpResponse(null, { status: 429, headers: { 'Retry-After': 'em breve' } }),
      ),
    )

    let caught: unknown
    try {
      await apiRequest('/api/login', { method: 'POST', body: {} })
    } catch (error) {
      caught = error
    }

    expect((caught as ApiError).retryAfterSeconds).toBeUndefined()
  })

  it('rejects a path without a leading slash before touching fetch', async () => {
    // Sem handler MSW registrado para essa rota: se o fetch fosse disparado, cairia em
    // "no matching handler" em vez de TypeError — confirma que a validação corta antes.
    await expect(apiRequest('api/tasks')).rejects.toThrow(TypeError)
  })

  it('rejects a protocol-relative path before touching fetch', async () => {
    await expect(apiRequest('//outro-host/api')).rejects.toThrow(TypeError)
  })

  it('rejects an absolute URL passed as path before touching fetch', async () => {
    await expect(apiRequest('https://outro-host/api')).rejects.toThrow(TypeError)
  })

  it('never echoes a sensitive path in the TypeError message', async () => {
    const sensitivePath = 'https://usuario:senha@outro-host/api?token=segredo-ficticio'

    let caught: unknown
    try {
      await apiRequest(sensitivePath)
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(TypeError)
    const message = (caught as TypeError).message
    expect(message).not.toContain('usuario')
    expect(message).not.toContain('senha')
    expect(message).not.toContain('token')
    expect(message).not.toContain('segredo-ficticio')
  })

  it('accepts a well-formed path', async () => {
    server.use(http.get(`${BASE_URL}/api/tasks`, () => HttpResponse.json([])))

    await expect(apiRequest('/api/tasks')).resolves.toEqual([])
  })

  it('strips an Authorization header inherited from options.headers when no accessToken is given', async () => {
    server.use(
      http.get(`${BASE_URL}/api/tasks`, ({ request }) =>
        HttpResponse.json({ authorization: request.headers.get('Authorization') }),
      ),
    )

    const result = await apiRequest<{ authorization: string | null }>('/api/tasks', {
      headers: { Authorization: 'Bearer indevido' },
    })

    expect(result.authorization).toBeNull()
  })

  it('lets accessToken win even when options.headers carries a different Authorization', async () => {
    server.use(
      http.get(`${BASE_URL}/api/tasks`, ({ request }) =>
        HttpResponse.json({ authorization: request.headers.get('Authorization') }),
      ),
    )

    const result = await apiRequest<{ authorization: string | null }>('/api/tasks', {
      accessToken: 'legitimo',
      headers: { Authorization: 'Bearer indevido' },
    })

    expect(result.authorization).toBe('Bearer legitimo')
  })

  it('keeps response.status sovereign even when the body reports a different status', async () => {
    server.use(
      http.post(
        `${BASE_URL}/api/tasks`,
        () =>
          new HttpResponse(JSON.stringify({ status: 999, title: 'Corpo divergente' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }),
      ),
    )

    let caught: unknown
    try {
      await apiRequest('/api/tasks', { method: 'POST', body: {} })
    } catch (error) {
      caught = error
    }

    expect((caught as ApiError).status).toBe(400)
  })
})
