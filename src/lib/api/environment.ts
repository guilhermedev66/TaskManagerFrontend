import { ConfigurationError } from './apiErrors'

// Núcleo puro e testável: recebe o valor bruto em vez de ler import.meta.env diretamente,
// para não acoplar o teste ao ambiente do Vite.
//
// Mensagens de erro nunca ecoam o valor bruto: a URL pode conter credenciais acidentalmente
// embutidas (https://usuario:senha@host), e repeti-la exporia isso em log/UI.
export function resolveApiBaseUrl(rawValue: string | undefined): string {
  const trimmed = rawValue?.trim()

  if (!trimmed) {
    throw new ConfigurationError(
      'VITE_API_URL não configurada. Copie .env.example para .env e defina a URL da API.',
    )
  }

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    throw new ConfigurationError(
      'VITE_API_URL inválida. Use uma URL absoluta de origem (ex.: http://localhost:5078).',
    )
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new ConfigurationError('VITE_API_URL com protocolo não suportado. Use http ou https.')
  }

  if (parsed.username || parsed.password) {
    throw new ConfigurationError('VITE_API_URL não pode conter usuário/senha embutidos.')
  }

  if (parsed.search) {
    throw new ConfigurationError('VITE_API_URL não pode conter query string.')
  }

  if (parsed.hash) {
    throw new ConfigurationError('VITE_API_URL não pode conter fragmento.')
  }

  if (parsed.pathname !== '/' && parsed.pathname !== '') {
    throw new ConfigurationError(
      'VITE_API_URL deve ser uma URL de origem, sem caminho de aplicação além de "/".',
    )
  }

  // Normaliza sempre a partir do objeto URL validado (origin), nunca da string bruta.
  return parsed.origin
}

let cachedBaseUrl: string | undefined

// Lazy: só valida no primeiro uso real (apiRequest), não na importação do módulo — evita
// quebrar testes que importam o cliente sem terem VITE_API_URL definida.
export function getApiBaseUrl(): string {
  if (cachedBaseUrl === undefined) {
    cachedBaseUrl = resolveApiBaseUrl(import.meta.env.VITE_API_URL)
  }
  return cachedBaseUrl
}
