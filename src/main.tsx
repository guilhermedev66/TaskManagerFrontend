import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App.tsx'
import { AuthProvider } from './auth/AuthProvider.tsx'
import { queryClient } from './lib/queryClient.ts'
import './styles/reset.css'
import './styles/tokens.css'
/* Só o subset "latin" (unicode.json do Fontsource: U+0000-00FF, cobre todo o Latin-1
   Supplement — ã, õ, ç, á, é, í, ó, ú, â, ê, ô, à, ü). "latin-ext" começa em U+0100
   (línguas da Europa Central/Oriental) — não é usado pelo pt-BR, removido. Os arquivos
   por peso do Fontsource sem sufixo de subset declaram @font-face para TODOS os scripts
   (cyrillic/greek/vietnamese/etc.) sem unicode-range compartilhado corretamente — usar
   só "latin" evita esse peso morto. */
import '@fontsource/fraunces/latin-400.css'
import '@fontsource/fraunces/latin-600.css'
import '@fontsource/ibm-plex-sans/latin-400.css'
import '@fontsource/ibm-plex-sans/latin-500.css'
import '@fontsource/ibm-plex-sans/latin-600.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import './styles/typography.css'
import './styles/globals.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
