import { createContext } from 'react'
import type { ApiRequestOptions } from '../lib/api/apiClient'
import type { AuthStatus } from './authTypes'

export interface AuthContextValue {
  status: AuthStatus
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  authenticatedRequest: <T>(path: string, options?: ApiRequestOptions) => Promise<T>
  retryInitialization: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
