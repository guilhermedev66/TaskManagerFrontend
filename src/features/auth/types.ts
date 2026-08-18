import type { AlertTone } from '../../components/Alert/Alert'

export interface FormAlert {
  tone: AlertTone
  title: string
  description?: string
}
