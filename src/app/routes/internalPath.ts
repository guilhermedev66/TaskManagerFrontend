// Só aceita caminho interno começando com "/" e não "//" (protocol-relative) — usado para não
// deixar um redirect pós-login aceitar destino externo vindo de location.state, que pode ter
// sido manipulado fora do fluxo normal de navegação.
export function isSafeInternalPath(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
}
