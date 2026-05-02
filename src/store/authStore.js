import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user: null,           // { id, email, name, role, publicId }
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
}))

export default useAuthStore
