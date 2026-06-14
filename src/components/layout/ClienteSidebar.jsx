import { useNavigate, NavLink } from 'react-router-dom'
import Avatar from '@/components/ui/Avatar'
import Icon from '@/components/ui/Icons'
import useAuthStore from '@/store/authStore'
import api from '@/lib/api'
import logo from '@/logo-dauth-agendamentos.png'

const navItems = [
  { to: '/cliente', end: true, icon: 'cal', label: 'Início' },
  { to: '/cliente/agendamentos', icon: 'receipt', label: 'Meus agendamentos' },
  { to: '/cliente/combos', icon: 'package', label: 'Meus combos' },
  { to: '/cliente/comandas', icon: 'cash', label: 'Minhas comandas' },
  { to: '/perfil', icon: 'users', label: 'Perfil e senha' },
]

export default function ClienteSidebar({ user, onClose }) {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)

  async function handleLogout() {
    try { await api.post('/auth/logout') } catch {}
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="flex flex-col gap-0.5 bg-surface-2 border-r border-line px-4 py-6 w-60 min-w-[240px] h-full overflow-y-auto">
      <div className="flex items-center gap-2.5 px-2 pb-4 mb-1 border-b border-line">
        <img src={logo} alt="Dauth" className="w-11 h-11 rounded-lg object-cover shrink-0" />
        <div className="flex-1 font-display font-semibold text-[13.5px] truncate">Dauth Agendamentos</div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg text-ink-4 hover:bg-surface-3 transition-colors">
            <Icon name="x" size={16} />
          </button>
        )}
      </div>
      <div className="text-center py-3 pb-[18px] border-b border-line mb-3">
        <Avatar name={user?.name ?? ''} index={2} size="xl" className="mx-auto mb-2" />
        <div className="font-display font-medium text-[15px]">{user?.name}</div>
        <div className="font-mono text-[11px] text-ink-3">cliente</div>
      </div>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-2.5 py-[9px] rounded-lg text-[13.5px] text-ink-2 hover:bg-surface-3 hover:text-ink transition-colors
            ${isActive ? 'bg-surface text-ink border border-line shadow-xs' : ''}`
          }
        >
          <Icon name={item.icon} size={16} />
          {item.label}
        </NavLink>
      ))}
      <div className="flex-1" />
      <NavLink to="/agendar" onClick={onClose}>
        <button className="w-full inline-flex justify-center items-center gap-2 px-4 py-[10px] rounded-md font-medium text-md bg-brand text-white border border-brand cursor-pointer hover:bg-[#72391f] transition-colors">
          <Icon name="plus" size={14} />Novo agendamento
        </button>
      </NavLink>
      <div className="border-t border-line mt-2.5">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-2.5 py-[9px] rounded-lg text-[13.5px] text-ink-3 hover:bg-danger-soft hover:text-danger transition-colors cursor-pointer mt-0.5"
        >
          <Icon name="logout" size={16} />
          Sair
        </button>
      </div>
    </aside>
  )
}
