import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import router from './router'
import useAuthStore from './store/authStore'
import api from './lib/api'
import { ToastProvider } from './context/ToastContext'

async function bootstrap() {
  const token = localStorage.getItem('access_token')
  if (token) {
    try {
      const { data } = await api.get('/users/perfil/me')
      // /users/perfil/me retorna { UUID, Name, Email, Role, Phone, Birthday, active }
      useAuthStore.getState().restoreSession({
        id: data.UUID,
        email: data.Email,
        name: data.Name,
        role: data.Role,
      })
    } catch {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    }
  }

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </StrictMode>
  )
}

bootstrap()
