import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { apiRequest, type ApiRequestOptions } from '../lib/api/apiClient'
import { ApiError } from '../lib/api/apiErrors'
import type { AuthResponse, LogoutRequest, RefreshTokenRequest } from '../types/auth'
import { AuthContext, type AuthContextValue } from './AuthContext'
import type { AuthStatus } from './authTypes'
import {
  clearStoredRefreshToken,
  getStoredRefreshToken,
  setStoredRefreshToken,
} from './tokenStorage'

type RefreshOutcome =
  | { kind: 'no-token' }
  | { kind: 'success'; token: string }
  | { kind: 'invalid' }
  | { kind: 'transient'; reason: 'rate-limited' | 'connection-error'; retryAfterSeconds?: number }
  // Resposta (sucesso OU erro) chegou depois que a geração de sessão mudou — logout ou novo
  // login já aconteceu enquanto o refresh estava em voo. Nunca grava token, nunca muda status.
  | { kind: 'stale' }

export function AuthProvider({ children }: { children: ReactNode }) {
  const accessTokenRef = useRef<string | null>(null)
  const refreshPromiseRef = useRef<Promise<RefreshOutcome> | null>(null)
  // Incrementada a cada login/logout bem-sucedido. Um refresh iniciado antes de um logout (ou
  // de um novo login) só pode aplicar seu resultado se a geração não mudou nesse meio-tempo —
  // corrige a corrida em que um refresh tardio reautenticaria um usuário que já saiu.
  const sessionGenerationRef = useRef(0)

  const [status, setStatus] = useState<AuthStatus>({ kind: 'checking' })

  const bumpGeneration = useCallback(() => {
    sessionGenerationRef.current += 1
    return sessionGenerationRef.current
  }, [])

  // Single-flight: chamadas concorrentes (bootstrap + um possível 401 quase simultâneo)
  // compartilham a mesma promise em vez de rotacionar o refresh token duas vezes — a segunda
  // rotação veria o token da primeira já revogado e derrubaria a família inteira (comportamento
  // real do backend, ver AuthService.RefreshAsync). Aplica o resultado ao estado só se a geração
  // de sessão não mudou desde o início da chamada (ver comentário acima).
  const performRefresh = useCallback((): Promise<RefreshOutcome> => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current
    }

    const generationAtStart = sessionGenerationRef.current

    const promise = (async (): Promise<RefreshOutcome> => {
      const storedToken = getStoredRefreshToken()
      if (!storedToken) {
        if (sessionGenerationRef.current === generationAtStart) {
          accessTokenRef.current = null
          setStatus({ kind: 'anonymous' })
        }
        return { kind: 'no-token' }
      }

      let response: AuthResponse
      try {
        response = await apiRequest<AuthResponse>('/api/refresh', {
          method: 'POST',
          body: { refreshToken: storedToken } satisfies RefreshTokenRequest,
        })
      } catch (error) {
        if (sessionGenerationRef.current !== generationAtStart) {
          // Sessão mudou (logout/login) enquanto isso estava em voo — resultado obsoleto,
          // independentemente de qual erro tenha vindo. Nunca mexe em token/status.
          return { kind: 'stale' }
        }

        if (error instanceof ApiError && error.status === 401) {
          // Refresh inválido, expirado ou reutilizado: encerra a sessão de fato.
          accessTokenRef.current = null
          clearStoredRefreshToken()
          setStatus({ kind: 'anonymous', reason: 'session-expired' })
          return { kind: 'invalid' }
        }

        if (error instanceof ApiError && error.status === 429) {
          // Preserva o refresh token — a condição é transitória, não uma sessão inválida.
          setStatus({
            kind: 'anonymous',
            reason: 'rate-limited',
            retryAfterSeconds: error.retryAfterSeconds,
          })
          return {
            kind: 'transient',
            reason: 'rate-limited',
            retryAfterSeconds: error.retryAfterSeconds,
          }
        }

        // ConnectionError, AbortError ou ApiError 5xx: também transitório, também preserva token.
        setStatus({ kind: 'anonymous', reason: 'connection-error' })
        return { kind: 'transient', reason: 'connection-error' }
      }

      if (sessionGenerationRef.current !== generationAtStart) {
        // Resposta tardia com sucesso, mas a sessão já mudou (logout/novo login): descartada
        // por completo — nunca grava token nem retorna como se fosse um sucesso utilizável.
        return { kind: 'stale' }
      }

      accessTokenRef.current = response.token
      setStoredRefreshToken(response.refreshToken)
      setStatus({ kind: 'authenticated' })
      return { kind: 'success', token: response.token }
    })()

    refreshPromiseRef.current = promise
    return promise.finally(() => {
      refreshPromiseRef.current = null
    })
  }, [])

  useEffect(() => {
    void performRefresh()
  }, [performRefresh])

  const retryInitialization = useCallback(() => {
    setStatus({ kind: 'checking' })
    void performRefresh()
  }, [performRefresh])

  const login = useCallback(
    async (username: string, password: string) => {
      const response = await apiRequest<AuthResponse>('/api/login', {
        method: 'POST',
        body: { username, password },
      })
      bumpGeneration()
      accessTokenRef.current = response.token
      setStoredRefreshToken(response.refreshToken)
      setStatus({ kind: 'authenticated' })
    },
    [bumpGeneration],
  )

  const register = useCallback(async (username: string, password: string) => {
    await apiRequest('/api/register', {
      method: 'POST',
      body: { username, password },
    })
  }, [])

  const logout = useCallback(async () => {
    const storedToken = getStoredRefreshToken()
    bumpGeneration()
    accessTokenRef.current = null
    clearStoredRefreshToken()
    setStatus({ kind: 'anonymous' })

    if (storedToken) {
      try {
        await apiRequest('/api/logout', {
          method: 'POST',
          body: { refreshToken: storedToken } satisfies LogoutRequest,
        })
      } catch {
        // Logout é best-effort: a sessão local já foi encerrada acima independentemente do
        // resultado da chamada ao servidor (rede indisponível não pode travar o usuário logado).
      }
    }
  }, [bumpGeneration])

  // Wrapper fino que anexa o access token em memória e, só em 401, coordena um único refresh
  // (via performRefresh) e repete a requisição original no máximo uma vez. Se essa repetição
  // também vier 401, não tenta outro refresh — encerra a sessão de vez.
  const authenticatedRequest = useCallback(
    async <T,>(path: string, options: ApiRequestOptions = {}): Promise<T> => {
      try {
        return await apiRequest<T>(path, {
          ...options,
          accessToken: accessTokenRef.current ?? undefined,
        })
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) {
          throw error
        }

        const generationAtCall = sessionGenerationRef.current
        const outcome = await performRefresh()
        // "stale" (ou qualquer outro !== 'success') já teve o status correto aplicado dentro de
        // performRefresh quando aplicável — aqui só rejeita de forma controlada, sem tentar
        // outro refresh e sem marcar sessão expirada por conta própria. A checagem de geração
        // extra cobre a janela entre o refresh resolver e este ponto (defesa adicional, já que
        // um "success" só existe quando pertencia à geração vigente no momento em que resolveu).
        if (outcome.kind !== 'success' || sessionGenerationRef.current !== generationAtCall) {
          throw error
        }

        try {
          return await apiRequest<T>(path, { ...options, accessToken: outcome.token })
        } catch (retryError) {
          if (retryError instanceof ApiError && retryError.status === 401) {
            bumpGeneration()
            accessTokenRef.current = null
            clearStoredRefreshToken()
            setStatus({ kind: 'anonymous', reason: 'session-expired' })
          }
          throw retryError
        }
      }
    },
    [performRefresh, bumpGeneration],
  )

  const value = useMemo<AuthContextValue>(
    () => ({ status, login, register, logout, authenticatedRequest, retryInitialization }),
    [status, login, register, logout, authenticatedRequest, retryInitialization],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
