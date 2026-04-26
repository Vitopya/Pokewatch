import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { LiveAnnouncerProvider } from './components/LiveAnnouncer'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LiveAnnouncerProvider>
      <App />
    </LiveAnnouncerProvider>
  </StrictMode>,
)
