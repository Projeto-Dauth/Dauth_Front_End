import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import router from './router'
import useAuthStore from './store/authStore'
import api from './lib/api'
import { ToastProvider } from './context/ToastContext'

async function bootstrap() {
  try {
    const { data } = await api.get('/users/perfil/me')
    useAuthStore.getState().restoreSession({
      id: data.UUID,
      publicId: data.UUID,
      email: data.Email,
      name: data.Name,
      role: data.Role,
    })
    // Populate localStorage from backend so returning users don't see tours again
    const toursCompleted = data.Tours_completed ?? {}
    Object.entries(toursCompleted).forEach(([key, done]) => {
      if (done) localStorage.setItem(`dauth_tour_${key}`, 'done')
    })
  } catch {
    // 401 = sem sessão ativa — continua sem autenticação
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
