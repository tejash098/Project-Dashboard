import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ThemeProvider from './context/ThemeContext.jsx'
import AuthProvider from './context/AuthContext.jsx'
import ToastProvider from './context/ToastContext.jsx'
import SidebarProvider from './context/SidebarContext.jsx'
import { BrowserRouter } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

/**
 * Application entry point.
 * AuthProvider sits above SidebarProvider so the sidebar account control
 * (profile/sign-in) can read auth state, and ToastProvider sits inside so any
 * component — including inline editors — can raise toasts.
 *
 * Analytics and SpeedInsights are Vercel's invisible trackers (page views +
 * Core Web Vitals). They render no UI and are mounted once at the root so they
 * cover every route; data is viewed in the Vercel project dashboard.
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
      <Analytics />
      <SpeedInsights />
    </BrowserRouter>
  </StrictMode>,
)
