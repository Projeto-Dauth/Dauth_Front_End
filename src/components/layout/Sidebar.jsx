import { NavLink, useNavigate } from 'react-router-dom'
import logo from '@/logo-dauth-agendamentos.png'
import Avatar from '@/components/ui/Avatar'
import Icon from '@/components/ui/Icons'
import api from '@/lib/api'
import useAuthStore from '@/store/authStore'

export default function Sidebar({ navItems, footerUser, footerRole, width = '240px', children, onClose }) {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)

  async function handleLogout() {
    try { await api.post('/auth/logout') } catch {}
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside
      className="flex flex-col gap-0.5 bg-surface-2 border-r border-line px-4 py-6 h-full overflow-y-auto"
      style={{ width, minWidth: width }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-2 pb-4 mb-1 border-b border-line">
        <img src={logo} alt="Dauth" className="w-8 h-8 rounded-lg object-cover shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-display font-semibold text-[13.5px] leading-none truncate">Dauth Agendamentos</div>
          {children && <div className="font-mono text-[10px] text-ink-3 mt-0.5">{children}</div>}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-4 hover:bg-surface-3 transition-colors"
          >
            <Icon name="x" size={16} />
          </button>
        )}
      </div>

      {/* Nav items */}
      {navItems.map((item, i) => {
        if (item.type === 'label') {
          return (
            <div key={i} className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3 px-2.5 pt-3.5 pb-1">
              {item.label}
            </div>
          )
        }
        if (item.type === 'sub') {
          return (
            <NavLink
              key={i}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-2.5 pl-9 pr-2.5 py-2 rounded-lg text-[13px] text-ink-3 hover:bg-surface-3 hover:text-ink transition-colors
                ${isActive ? 'text-ink' : ''}`
              }
            >
              {item.label}
            </NavLink>
          )
        }
        return (
          <NavLink
            key={i}
            to={item.to}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-2.5 py-[9px] rounded-lg text-[13.5px] text-ink-2 hover:bg-surface-3 hover:text-ink transition-colors
              ${isActive ? 'bg-surface text-ink border border-line shadow-xs' : ''}`
            }
          >
            {item.icon && <Icon name={item.icon} size={16} />}
            {item.label}
          </NavLink>
        )
      })}

      <div className="flex-1" />

      {/* Footer */}
      {footerUser && (
        <div className="border-t border-line mt-2.5">
          <div className="flex items-center gap-2.5 p-2.5">
            <Avatar name={footerUser} index={0} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-medium truncate">{footerUser}</div>
              <div className="text-[11px] text-ink-3">{footerRole}</div>
            </div>
            <button
              onClick={handleLogout}
              title="Sair"
              className="p-1.5 rounded-lg text-ink-4 hover:text-danger hover:bg-danger-soft transition-colors shrink-0 cursor-pointer"
            >
              <Icon name="logout" size={15} />
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
