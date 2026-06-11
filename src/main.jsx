import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ThemeProvider from './context/ThemeContext.jsx'
import SidebarProvider from './context/SidebarContext.jsx'

/**
 * Application entry point.
 * ThemeProvider wraps SidebarProvider so theme state is available
 * to all components including the sidebar itself.
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <SidebarProvider>
        <App/>
      </SidebarProvider>
    </ThemeProvider>
  </StrictMode>,
)
