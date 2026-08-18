import { Button } from '../components/Button/Button'
import { TextField } from '../components/TextField/TextField'
import { PasswordField } from '../components/PasswordField/PasswordField'
import { Textarea } from '../components/Textarea/Textarea'
import { Select } from '../components/Select/Select'
import { Checkbox } from '../components/Checkbox/Checkbox'
import styles from './App.module.css'

const colorSwatches = [
  { name: 'background', variable: '--color-background' },
  { name: 'surface', variable: '--color-surface' },
  { name: 'text-primary', variable: '--color-text-primary' },
  { name: 'text-secondary', variable: '--color-text-secondary' },
  { name: 'primary', variable: '--color-primary' },
  { name: 'success', variable: '--color-success' },
  { name: 'warning', variable: '--color-warning' },
  { name: 'danger', variable: '--color-danger' },
]

function App() {
  return (
    <main className={styles.page}>
      <div className={styles.banner}>
        <h1 className="text-label">COMPONENTES BASE — REVISÃO</h1>
        <p className="text-helper">
          Catálogo temporário para revisão visual da Fase 2. Não é uma tela do produto — será
          removido quando as rotas reais (Login, Cadastro, Dashboard) forem implementadas.
        </p>
      </div>

      <section className={styles.section}>
        <h2 className="text-h2">Tipografia</h2>
        <p className="text-display">Entrar</p>
        <p className="text-h1">Suas tarefas</p>
        <p className="text-h2">Nenhuma tarefa</p>
        <p className="text-body-strong">Revisar testes de autenticação</p>
        <p className="text-body">Corrigir validação de prazo antes de criar a tarefa.</p>
        <p className="text-label">PRIORIDADE ALTA</p>
        <p className="text-helper">Campo obrigatório.</p>
        <p className="text-meta">12 MAI · #128</p>
      </section>

      <section className={styles.section}>
        <h2 className="text-h2">Cores principais</h2>
        <div className={styles.swatchRow}>
          {colorSwatches.map((swatch) => (
            <div className={styles.swatch} key={swatch.name}>
              <div
                className={styles.swatchColor}
                style={{ background: `var(${swatch.variable})` }}
              />
              <p className="text-helper">{swatch.name}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className="text-h2">Botões</h2>
        <div className={styles.group}>
          <Button variant="primary">Salvar</Button>
          <Button variant="primary" loading loadingLabel="Salvando tarefa">
            Salvar
          </Button>
          <Button variant="primary" disabled>
            Salvar
          </Button>
        </div>
        <div className={styles.group}>
          <Button variant="secondary">Cancelar</Button>
          <Button variant="secondary" disabled>
            Cancelar
          </Button>
        </div>
        <div className={styles.group}>
          <Button variant="danger-solid">Excluir permanentemente</Button>
          <Button variant="danger-solid" disabled>
            Excluir permanentemente
          </Button>
        </div>
        <div className={styles.group}>
          <Button variant="danger-ghost">Excluir tarefa</Button>
          <Button variant="danger-ghost" disabled>
            Excluir tarefa
          </Button>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className="text-h2">Campos</h2>
        <div className={styles.fieldColumn}>
          <TextField label="Usuário" placeholder="Seu usuário" />
          <TextField label="Usuário preenchido" defaultValue="guilherme" />
          <TextField label="Usuário com erro" defaultValue="gu" error="Mínimo de 3 caracteres." />
          <TextField
            label="Usuário com helper e erro"
            defaultValue="gu"
            helperText="Use de 3 a 50 caracteres."
            error="Mínimo de 3 caracteres."
          />
          <TextField label="Usuário desabilitado" defaultValue="guilherme" disabled />
          <PasswordField label="Senha" placeholder="Sua senha" />
          <Textarea label="Descrição (opcional)" placeholder="Detalhes adicionais..." />
          <Select label="Prioridade" defaultValue="media">
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
          </Select>
          <Checkbox label="Marcar como concluída" defaultChecked />
          <Checkbox label="Tarefa pendente" />
        </div>
      </section>
    </main>
  )
}

export default App
