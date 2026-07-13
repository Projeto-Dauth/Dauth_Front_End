import axios from 'axios'
import useAuthStore from '@/store/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// O refresh_token do Supabase é rotativo e de uso único: se duas requisições
// expirarem ao mesmo tempo e cada uma disparar seu próprio /auth/refresh, a segunda
// chega com um refresh_token já consumido pela primeira e derruba a sessão.
// refreshPromise compartilha uma única chamada de refresh entre 401s concorrentes.
let refreshPromise = null

function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${import.meta.env.VITE_API_URL}/auth/refresh`, {}, { withCredentials: true })
      .finally(() => { refreshPromise = null })
  }
  return refreshPromise
}

// Se receber 401, tenta renovar a sessão via cookie e repete a requisição original.
// _retry evita loop infinito caso o refresh também retorne 401.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    const isAuthEndpoint = original.url?.includes('/auth/')
    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true

      try {
        await refreshSession()
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
        if (window.location.pathname !== '/login') {
          sessionStorage.setItem('session_expired', '1')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)

export default api
