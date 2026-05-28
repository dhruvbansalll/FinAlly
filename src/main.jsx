import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { UserDataProvider } from './contexts/UserDataContext'
import { AppSettingsProvider } from './contexts/AppSettingsContext'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <UserDataProvider>
          <AppSettingsProvider>
            <App />
            <Toaster
              position="top-right"
              gutter={8}
              toastOptions={{
                duration: 4000,
                style: {
                  borderRadius: '16px',
                  fontFamily: 'Poppins, Nunito, system-ui, sans-serif',
                  fontSize: '13px',
                  fontWeight: '500',
                  boxShadow: '0 4px 20px -5px rgba(155, 111, 248, 0.2)',
                  padding: '12px 16px',
                },
                success: {
                  iconTheme: { primary: '#22c57a', secondary: '#fff' },
                },
                error: {
                  iconTheme: { primary: '#ff4d7d', secondary: '#fff' },
                },
              }}
            />
          </AppSettingsProvider>
        </UserDataProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
