import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user: null,           // { id, email, role, publicId }
  isAuthenticated: false,

  login: (user, accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
    if (user.publicId) localStorage.setItem('public_id', user.publicId)
    set({ user, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    set({ user: null, isAuthenticated: false })
  },

  // Restaura sessão a partir do localStorage (chamado no App ao montar)
  restoreSession: (user) => {
    set({ user, isAuthenticated: true })
  },
}))

export default useAuthStore
