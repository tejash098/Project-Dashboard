import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ThemeProvider from './context/ThemeContext.jsx'
import AuthProvider from './context/AuthContext.jsx'
import ToastProvider from './context/ToastContext.jsx'
import SidebarProvider from './context/SidebarContext.jsx'
import { BrowserRouter } from "react-router-dom";

/**
 * Application entry point.
 * AuthProvider sits above SidebarProvider so the TopBar (profile/sign-in) can
 * read auth state, and ToastProvider sits inside so any component — including
 * inline editors — can raise toasts.
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <SidebarProvider>
              <App />
            </SidebarProvider>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
