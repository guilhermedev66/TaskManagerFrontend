# TaskManager (frontend)

Frontend SPA em React para o [TaskManagerAPI](https://github.com/guilhermedev66/TaskManagerAPI) — consome a API REST de gerenciamento de tarefas com autenticação JWT.

> **Status:** fase inicial de scaffold. Nenhuma tela, autenticação ou chamada à API foi implementada ainda — este repositório contém só a estrutura base do projeto.

## Stack atual

- React 19 + TypeScript
- Vite
- ESLint + Prettier
- Vitest + React Testing Library

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

`VITE_API_URL` é a URL base da TaskManagerAPI. Ainda não é lida pelo código nesta fase — será usada quando o cliente HTTP for implementado.

## Relação com o TaskManagerAPI

Este é um repositório separado do backend, versionado de forma independente. O backend expõe CORS configurável para permitir chamadas deste frontend em desenvolvimento (`http://localhost:5173`).
