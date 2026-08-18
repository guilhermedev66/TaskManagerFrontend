# TaskManager — Frontend

SPA responsiva para gerenciamento de tarefas, construída em React e integrada à
[TaskManagerAPI](https://github.com/guilhermedev66/TaskManagerAPI). O projeto cobre o fluxo completo
de autenticação, consulta e manutenção de tarefas, com atenção especial a acessibilidade, estados
de falha e consistência de sessão.

## Funcionalidades

- cadastro, login, logout e restauração silenciosa da sessão;
- rotação coordenada de refresh token, sem refreshes concorrentes;
- rotas públicas e protegidas;
- listagem paginada com busca, filtro e oito opções de ordenação;
- filtros refletidos na URL e busca com debounce;
- criação e edição em diálogo responsivo;
- conclusão e reabertura otimistas, com rollback em falha;
- exclusão com confirmação;
- estados de carregamento, vazio, ausência de resultados, conexão, `404`, `429` e sessão expirada;
- layout adaptado para desktop e mobile, incluindo bottom sheet de filtros;
- navegação por teclado, foco visível e gerenciamento de foco em diálogos.

## Stack

- React 19 e TypeScript;
- Vite;
- React Router;
- TanStack Query;
- React Hook Form e Zod;
- CSS Modules e design tokens;
- Vitest, React Testing Library e MSW;
- ESLint e Prettier.

## Arquitetura

O código é organizado por responsabilidade, sem camadas artificiais:

```text
src/
├── app/          # rotas, providers e shell autenticado
├── auth/         # sessão, tokens e refresh silencioso
├── components/   # componentes básicos reutilizáveis
├── features/
│   ├── auth/     # Login e Cadastro
│   └── tasks/    # dashboard, consultas, mutações e componentes de tarefa
├── lib/          # cliente HTTP, QueryClient e hooks transversais
├── styles/       # tokens, tipografia e estilos globais
├── test/         # configuração e servidor MSW
└── types/        # contratos TypeScript equivalentes aos DTOs da API
```

O estado de servidor fica no TanStack Query; sessão fica no `AuthProvider`; filtros ficam na URL;
rascunhos de formulário e de interface permanecem locais aos respectivos componentes.

## Autenticação

O access token existe somente em memória. O refresh token fica em `sessionStorage` porque o
contrato atual da API o devolve no corpo JSON; portanto, ele ainda pode ser lido por JavaScript em
caso de XSS. Uma evolução futura seria o backend emitir o refresh token em cookie `HttpOnly`,
`Secure` e com `SameSite` apropriado.

O frontend coordena refreshes simultâneos em uma única operação. Respostas obsoletas são
descartadas quando logout ou novo login substituem a sessão. Somente `401` invalida a sessão;
falhas de conexão, `5xx` e `429` preservam o refresh token e oferecem recuperação.

## Executando localmente

### Requisitos

- Node.js LTS (desenvolvido com Node 24);
- npm;
- [TaskManagerAPI](https://github.com/guilhermedev66/TaskManagerAPI) executando localmente.

### Configuração

```bash
git clone https://github.com/guilhermedev66/TaskManagerFrontend.git
cd TaskManagerFrontend
npm install
```

Copie `.env.example` para `.env`:

```env
VITE_API_URL=http://localhost:5078
```

`VITE_API_URL` deve ser uma origem HTTP/HTTPS absoluta, sem credenciais, query string, fragmento ou
caminho adicional.

Inicie o frontend:

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`. O backend deve liberar essa origem na
configuração de CORS.

## Scripts

| Comando                | Finalidade                       |
| ---------------------- | -------------------------------- |
| `npm run dev`          | servidor de desenvolvimento      |
| `npm run build`        | typecheck e build de produção    |
| `npm run preview`      | prévia local do build            |
| `npm run lint`         | análise estática com ESLint      |
| `npm run typecheck`    | verificação de tipos sem emissão |
| `npm run format`       | formatação com Prettier          |
| `npm run format:check` | validação da formatação          |
| `npm run test`         | suíte de testes com Vitest       |
| `npm run test:watch`   | testes em modo de observação     |

## Qualidade

A suíte automatizada cobre componentes, formulários, cliente HTTP, autenticação, concorrência de
refresh, filtros, paginação e mutações com rollback. O pipeline executa:

```text
format:check → lint → typecheck → test → build
```

As integrações HTTP são exercitadas com MSW. O fluxo completo também foi validado localmente
contra a API real com dados fictícios.

## Design e acessibilidade

O design foi desenvolvido no Figma antes da implementação e traduzido para tokens CSS e
componentes reutilizáveis. A interface usa HTML nativo sempre que possível, landmarks, labels
associadas, mensagens anunciáveis, foco preso em diálogos, retorno de foco e alvos de toque
adequados em mobile.

[Abrir o arquivo de design no Figma](https://www.figma.com/design/DJ5kcPx19Bzp0kQyjR1kPB/TaskManagerAPI--Frontend)

## Deploy

O projeto está preparado para deploy na Vercel. O arquivo `vercel.json` redireciona as rotas da
SPA para `index.html`, permitindo abrir diretamente `/login`, `/register` e `/tasks`.

Antes de publicar:

1. publique a API em uma origem HTTPS com persistência para o SQLite;
2. configure `VITE_API_URL` na Vercel com a origem pública da API;
3. inclua a origem do frontend em `Cors:AllowedOrigins` no backend;
4. execute um novo deploy após salvar a variável de ambiente.

O frontend não contém segredos. A URL da API é incorporada ao bundle durante o build e pode ser
inspecionada pelo navegador, como esperado para uma SPA.

## Decisões de escopo

- frontend e backend permanecem em repositórios independentes;
- não há Redux ou outra store global: o estado atual não justifica essa dependência;
- criação, edição e exclusão aguardam confirmação do servidor;
- somente conclusão/reabertura usa atualização otimista;
- a aplicação não reordena páginas localmente nem tenta corrigir respostas do backend;
- Playwright ficou fora da primeira versão: a cobertura atual e a validação real oferecem melhor
  custo-benefício para este escopo. Ele pode ser adicionado quando houver ambiente de integração
  hospedado e estável.

## Repositórios

- Frontend: [TaskManagerFrontend](https://github.com/guilhermedev66/TaskManagerFrontend)
- Backend: [TaskManagerAPI](https://github.com/guilhermedev66/TaskManagerAPI)
