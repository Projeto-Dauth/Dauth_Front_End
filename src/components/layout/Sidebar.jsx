import { NavLink } from 'react-router-dom'
import Avatar from '@/components/ui/Avatar'
import Icon from '@/components/ui/Icons'

export default function Sidebar({ navItems, footerUser, footerRole, width = '240px', children }) {
  return (
    <aside
      className="flex flex-col gap-0.5 bg-surface-2 border-r border-line px-4 py-6"
      style={{ width, minWidth: width }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-2 pb-4 mb-1 border-b border-line">
        <div className="w-8 h-8 rounded-lg bg-ink text-bg flex items-center justify-center font-display font-bold text-base">
          d
        </div>
        <div>
          <div className="font-display font-semibold text-base leading-none">Dauth</div>
          {children && <div className="font-mono text-[10px] text-ink-3 mt-0.5">{children}</div>}
        </div>
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
        <div className="flex items-center gap-2.5 p-2.5 border-t border-line mt-2.5">
          <Avatar name={footerUser} index={0} size="sm" />
          <div>
            <div className="text-[12.5px] font-medium">{footerUser}</div>
            <div className="text-[11px] text-ink-3">{footerRole}</div>
          </div>
        </div>
      )}
    </aside>
  )
}
