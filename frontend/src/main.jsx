import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.jsx'

// ── Sentry Initialization ──
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  // Capture 100% of transactions for performance monitoring
  tracesSampleRate: 1.0,
  // Capture 10% of sessions for replay
  replaysSessionSampleRate: 0.1,
  // Capture 100% of sessions with errors for replay
  replaysOnErrorSampleRate: 1.0,
});

console.log('API_BASE (build):', import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000');
window.__API_BASE__ = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<p>Something went wrong. Please refresh the page.</p>}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
