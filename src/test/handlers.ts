import type { HttpHandler } from 'msw'

// Vazio de propósito: handlers específicos são registrados por teste via `server.use(...)`,
// para manter cada cenário legível no próprio arquivo de teste em vez de um catálogo global.
export const handlers: HttpHandler[] = []
