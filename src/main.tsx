import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initializeAnalytics } from './utils/analytics'
import { initializeGlobalErrorHandler } from './utils/globalErrorHandler'

// Initialize safe error handler
initializeGlobalErrorHandler();

// Initialize Google Analytics
initializeAnalytics();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
