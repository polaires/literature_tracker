import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'react-pdf-highlighter/dist/style.css'
import App from './App.tsx'

// Run data migrations before rendering
import { ensureMigrated } from './services/storage/migrations'
const migrationResult = ensureMigrated();
if (migrationResult.migrationsApplied.length > 0) {
  console.log('[IdeaGraph] Applied migrations:', migrationResult.migrationsApplied);
}
if (!migrationResult.success) {
  console.error('[IdeaGraph] Migration errors:', migrationResult.errors);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
