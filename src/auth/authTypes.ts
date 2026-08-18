// Motivo controlado de um status anônimo — nunca inventado, sempre rastreável até uma causa
// real (401 do refresh, 429, falha de conexão/5xx/AbortError, ou nenhum: usuário nunca logou).
export type AnonymousReason = 'session-expired' | 'connection-error' | 'rate-limited'

// Estado explícito em vez de booleanos que podiam divergir (isAuthenticated/isInitializing/
// sessionExpired independentes permitiam combinações inválidas). Só um destes três é
// verdadeiro por vez, por construção.
export type AuthStatus =
  | { kind: 'checking' }
  | { kind: 'authenticated' }
  | { kind: 'anonymous'; reason?: AnonymousReason; retryAfterSeconds?: number }
