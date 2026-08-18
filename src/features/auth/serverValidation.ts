import type { UseFormSetError } from 'react-hook-form'

interface LoginOrRegisterValues {
  username: string
  password: string
}

// O servidor continua sendo a validação definitiva: ValidationProblemDetails.errors usa os
// nomes de campo do C# (PascalCase) — mapeia pra chave do formulário e mostra a primeira
// mensagem de cada campo reconhecido. Campos não reconhecidos são ignorados, não quebram nada.
export function applyServerValidationErrors(
  setError: UseFormSetError<LoginOrRegisterValues>,
  validationErrors: Record<string, string[]>,
): void {
  for (const [field, messages] of Object.entries(validationErrors)) {
    const key = field.toLowerCase()
    const message = messages[0]
    if (!message) continue
    if (key === 'username' || key === 'password') {
      setError(key, { type: 'server', message })
    }
  }
}
