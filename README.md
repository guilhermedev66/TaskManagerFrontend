# TaskManager (frontend)

Frontend SPA em React para o [TaskManagerAPI](https://github.com/guilhermedev66/TaskManagerAPI) — consome a API REST de gerenciamento de tarefas com autenticação JWT.

> **Status:** foundations de design, componentes base e cliente HTTP implementados. Ainda não há telas, autenticação (login/cadastro), gerenciamento de sessão ou rotas — isso pertence às próximas fases.

## Stack atual

- React 19 + TypeScript
- Vite
- ESLint + Prettier
- Vitest + React Testing Library
- MSW (mocks de rede nos testes do cliente HTTP)

## Requisitos

- Node.js LTS (testado com Node 24)
- npm

## Instalação

```bash
npm install
```

## Comandos disponíveis

| Comando                | Descrição                                |
| ---------------------- | ---------------------------------------- |
| `npm run dev`          | Sobe o servidor de desenvolvimento       |
| `npm run build`        | Typecheck + build de produção            |
| `npm run preview`      | Serve o build de produção localmente     |
| `npm run lint`         | Roda o ESLint                            |
| `npm run typecheck`    | Verifica tipos sem gerar arquivos        |
| `npm run format`       | Formata os arquivos com Prettier         |
| `npm run format:check` | Verifica formatação sem alterar arquivos |
| `npm run test`         | Roda a suíte de testes uma vez           |
| `npm run test:watch`   | Roda os testes em modo watch             |

## Variáveis de ambiente

Copie `.env.example` para `.env` e ajuste conforme necessário:

```
VITE_API_URL=http://localhost:5078
```

`VITE_API_URL` é a URL base da TaskManagerAPI e agora é **obrigatória**: o cliente HTTP (`src/lib/api/apiClient.ts`) valida essa variável no primeiro uso e lança um erro claro se estiver ausente, relativa ou com protocolo diferente de `http`/`https`. Sem `.env`, qualquer chamada à API falha imediatamente com essa mensagem.

## Relação com o TaskManagerAPI

Este é um repositório separado do backend, versionado de forma independente. O backend é esperado em `http://localhost:5078` durante o desenvolvimento local (padrão em `.env.example`) e expõe CORS configurável para permitir chamadas deste frontend (`http://localhost:5173`).

## Cliente HTTP

`src/lib/api/apiClient.ts` expõe `apiRequest<T>(path, options)`, um wrapper fino sobre `fetch` nativo (sem Axios/ky). Ele monta a URL a partir de `VITE_API_URL`, define `Accept`/`Content-Type`, envia `Authorization: Bearer` quando um token é passado, encaminha `AbortSignal`, trata `204 No Content` e converte respostas de erro em `ApiError` (com `status`, `title`, `detail`, `validationErrors` e `retryAfterSeconds` normalizado a partir do header `Retry-After`). Falhas de rede viram `ConnectionError`; erros de configuração viram `ConfigurationError`. Ele **não** implementa refresh de token, retry automático ou timeout — isso é escopo de uma fase futura (autenticação).

Os tipos do contrato (`src/types/{auth,tasks,problemDetails}.ts`) refletem o JSON real da API: `priority` é numérico, datas HTTP são `string`, e `TaskItem` não expõe `userId` no JSON (o backend o marca com `[JsonIgnore]`).
