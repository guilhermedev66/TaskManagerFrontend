const REFRESH_TOKEN_KEY = 'taskmanager.refreshToken'

// Refresh token em sessionStorage é uma limitação transitória documentada, não uma solução
// "segura": o backend atual devolve o token no corpo JSON (sem cookie HttpOnly), então algum
// storage do navegador é inevitável. sessionStorage reduz a janela de exposição a XSS frente a
// localStorage (some ao fechar a aba), sem forçar login a cada F5. Access token nunca é
// persistido aqui — vive só em memória no AuthProvider. Nunca usar localStorage.

// window.sessionStorage pode lançar SecurityError (modo privado restrito, iframe sandboxado,
// política do navegador) só ao ser ACESSADO — antes mesmo de chamar getItem/setItem.
function safeSessionStorage(): Storage | null {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

// Falha de leitura equivale a "token não disponível" — nunca derruba a árvore React.
export function getStoredRefreshToken(): string | null {
  const storage = safeSessionStorage()
  if (!storage) return null
  try {
    return storage.getItem(REFRESH_TOKEN_KEY)
  } catch {
    return null
  }
}

// Falha de escrita (quota, restrição do navegador) é best-effort e controlada: a sessão
// continua funcionando nesta aba via access token em memória, só não sobrevive a um reload.
export function setStoredRefreshToken(token: string): void {
  const storage = safeSessionStorage()
  if (!storage) return
  try {
    storage.setItem(REFRESH_TOKEN_KEY, token)
  } catch {
    // Escrita falhou — ignorado de propósito, ver comentário acima.
  }
}

export function clearStoredRefreshToken(): void {
  const storage = safeSessionStorage()
  if (!storage) return
  try {
    storage.removeItem(REFRESH_TOKEN_KEY)
  } catch {
    // Limpeza best-effort — mesmo raciocínio da escrita.
  }
}
