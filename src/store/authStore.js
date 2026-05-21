import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user: null,           // { id, email, name, role, publicId, must_change_password }
  isAuthenticated: false,

  login: (user) => {
    set({ user, isAuthenticated: true })
  },

  logout: () => {
    set({ user: null, isAuthenticated: false })
  },

  restoreSession: (user) => {
    set({ user, isAuthenticated: true })
  },

  clearMustChangePassword: () => {
    set(state => ({ user: state.user ? { ...state.user, must_change_password: false } : null }))
  },
}))

export default useAuthStore
