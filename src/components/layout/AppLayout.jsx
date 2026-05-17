import { useState, cloneElement } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '@/components/ui/Icons'
import logo from '@/logo-dauth-agendamentos.png'
import useAuthStore from '@/store/authStore'
import api from '@/lib/api'

export default function AppLayout({ sidebar, children }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)

  async function handleLogout() {
    try { await api.post('/auth/logout') } catch {}
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        {sidebar}
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-ink/30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 md:hidden transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {cloneElement(sidebar, { onClose: () => setOpen(false) })}
      </div>

      <main className="flex-1 overflow-auto bg-bg px-4 py-5 md:px-8 md:py-7">
        {/* Mobile top bar */}
        <div className="flex items-center gap-3 mb-5 md:hidden">
          <button
            onClick={() => setOpen(true)}
            className="p-2 rounded-lg text-ink-3 hover:bg-surface-2 transition-colors"
          >
            <Icon name="menu" size={18} />
          </button>
          <img src={logo} alt="Dauth" className="w-9 h-9 rounded-lg object-cover" />
          <div className="font-display font-semibold text-[13.5px] flex-1">Dauth Agendamentos</div>
          <button
            onClick={handleLogout}
            title="Sair"
            className="p-2 rounded-lg text-ink-4 hover:text-danger hover:bg-danger-soft transition-colors"
          >
            <Icon name="logout" size={17} />
          </button>
        </div>

        {children}
      </main>
    </div>
  )
}
