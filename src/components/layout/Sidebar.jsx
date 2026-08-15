import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import logo from '@/logo-dauth-agendamentos.png'
import Avatar from '@/components/ui/Avatar'
import Icon from '@/components/ui/Icons'
import api from '@/lib/api'
import useAuthStore from '@/store/authStore'
import useNotificationStore from '@/store/notificationStore'
import useWhatsappStatusStore from '@/store/whatsappStatusStore'
import { usePermission } from '@/hooks/usePermission'

function NavGroup({ item, onClose }) {
  const location = useLocation()
  const isActive = location.pathname === item.to || item.children.some(c => {
    const [cPath, cQuery] = c.to.split('?')
    if (location.pathname !== cPath) return false
    if (!cQuery) return !location.search
    return location.search === '?' + cQuery
  })
  const [open, setOpen] = useState(isActive)

  useEffect(() => { if (isActive) setOpen(true) }, [isActive])

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-2.5 px-2.5 py-[9px] rounded-lg text-[13.5px] transition-colors cursor-pointer
          ${isActive ? 'bg-brand-soft text-brand border border-brand/20 font-medium' : 'text-ink-2 hover:bg-surface-3 hover:text-ink'}`}
      >
        {item.icon && <Icon name={item.icon} size={16} />}
        <span className="flex-1 text-left">{item.label}</span>
        <Icon name="chevronRight" size={12} className={`transition-transform shrink-0 ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="ml-[22px] mt-0.5 flex flex-col gap-0.5 border-l border-line-2 pl-3">
          {item.children.map((child, i) => {
            const [cPath, cQuery] = child.to.split('?')
            const childActive = location.pathname === cPath && (cQuery ? location.search === '?' + cQuery : !location.search || location.search.startsWith('?appointment'))
            return (
              <NavLink
                key={i}
                to={child.to}
                onClick={onClose}
                className={`text-[13px] px-2 py-1.5 rounded-md transition-colors
                  ${childActive ? 'text-brand font-medium' : 'text-ink-3 hover:text-ink hover:bg-surface-3'}`}
              >
                {child.label}
              </NavLink>
            )
          })}
        </div>
      )}
    </div>
  )
}

const SCROLL_KEY = 'dauth_sidebar_scroll'

export default function Sidebar({ navItems, footerUser, footerRole, width = '240px', onClose }) {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const { unreadCount, openDrawer } = useNotificationStore()
  const { status: whatsappStatus } = useWhatsappStatusStore()
  const { can } = usePermission()
  const visibleNavItems = navItems.filter((item) => can(item.module, 'view'))
  const navScrollRef = useRef(null)

  useEffect(() => {
    const el = navScrollRef.current
    if (!el) return
    const saved = sessionStorage.getItem(SCROLL_KEY)
    if (saved) el.scrollTop = parseInt(saved, 10)
    const onScroll = () => sessionStorage.setItem(SCROLL_KEY, el.scrollTop)
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  async function handleLogout() {
    try { await api.post('/auth/logout') } catch {}
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside
      data-tour="sidebar"
      className="flex flex-col gap-0.5 bg-surface-2 border-r border-line px-4 py-6 h-full overflow-hidden"
      style={{ width, minWidth: width }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-2 pb-4 mb-1 border-b border-line">
        <img src={logo} alt="Dauth" className="w-11 h-11 rounded-lg object-cover shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-display font-semibold text-[13.5px] leading-none truncate">Dauth Agendamentos</div>
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
      <div ref={navScrollRef} className="nav-scroll flex-1 overflow-y-auto flex flex-col gap-0.5 min-h-0">
      {visibleNavItems.map((item, i) => {
        if (item.type === 'label') {
          return (
            <div key={i} className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3 px-2.5 pt-3.5 pb-1">
              {item.label}
            </div>
          )
        }
        if (item.children) {
          return <NavGroup key={i} item={item} onClose={onClose} />
        }
        return (
          <NavLink
            key={i}
            to={item.to}
            end={item.end}
            onClick={onClose}
            {...(item.to === '/profissional/comissoes' ? { 'data-tour': 'comissoes-link' } : {})}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-2.5 py-[9px] rounded-lg text-[13.5px] text-ink-2 hover:bg-surface-3 hover:text-ink transition-colors
              ${isActive ? 'bg-brand-soft text-brand border border-brand/20 font-medium' : ''}`
            }
          >
            {item.icon && <Icon name={item.icon} size={16} />}
            {item.label}
          </NavLink>
        )
      })}
      </div>

      {/* Footer */}
      {footerUser && (
        <div className="border-t border-line mt-2.5">
          <div className="flex items-center gap-2.5 p-2.5">
            <Avatar name={footerUser} index={0} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-medium truncate">{footerUser}</div>
              <div className="text-[11px] text-ink-3">{footerRole}</div>
            </div>
            {footerRole === 'Admin' && whatsappStatus && whatsappStatus !== 'connected' && (
              <button
                onClick={() => navigate('/perfil')}
                title="WhatsApp desconectado — clique para reconectar"
                className="p-1.5 rounded-lg text-danger hover:bg-danger-soft transition-colors shrink-0 cursor-pointer"
              >
                <Icon name="alertCircle" size={15} />
              </button>
            )}
            <button
              data-tour="notifications"
              onClick={openDrawer}
              title="Notificações"
              className="relative p-1.5 rounded-lg text-ink-4 hover:bg-surface-3 transition-colors shrink-0 cursor-pointer"
            >
              <Icon name="bell" size={15} />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-brand" />
              )}
            </button>
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
