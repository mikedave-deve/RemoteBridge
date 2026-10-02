import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { hydrateSiteData } from './lib/siteData'

// Load the editable site text first (falls back to built-in text within 2.5s).
hydrateSiteData().finally(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
