import axios from 'axios'
import useAuthStore from '@/store/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// Se receber 401, tenta renovar a sessão via cookie e repete a requisição original.
// Só redireciona para /login se o usuário já estava autenticado — evita loop no bootstrap.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    const isAuthEndpoint = original.url?.includes('/auth/')
    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true

      const isAuthenticated = useAuthStore.getState().isAuthenticated
      if (!isAuthenticated) {
        return Promise.reject(error)
      }

      try {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        )
        return api(original)
      } catch {
        try {
          await axios.post(
            `${import.meta.env.VITE_API_URL}/auth/logout`,
            {},
            { withCredentials: true }
          )
        } catch {}
        useAuthStore.getState().logout()
        sessionStorage.setItem('session_expired', '1')
        window.location.href = '/login'
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)

export default api
