import { useState, useEffect } from 'react'
import { useNavigate, NavLink } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import Button from '@/components/ui/Button'
import Chip from '@/components/ui/Chip'
import Icon from '@/components/ui/Icons'
import Avatar from '@/components/ui/Avatar'
import { PageSpinner } from '@/components/ui/Spinner'
import logo from '@/logo-dauth-agendamentos.png'
import EmptyState from '@/components/ui/EmptyState'
import useAuthStore from '@/store/authStore'
import api from '@/lib/api'
import { useTour } from '@/hooks/useTour'
import { clienteAgendamentosSteps } from '@/tours/clienteAgendamentosTour'

const navItems = [
  { to: '/cliente', end: true, icon: 'cal', label: 'Início' },
  { to: '/cliente/agendamentos', icon: 'receipt', label: 'Meus agendamentos' },
  { to: '/cliente/combos', icon: 'package', label: 'Meus combos' },
  { to: '/cliente/comandas', icon: 'cash', label: 'Minhas comandas' },
  { to: '/perfil', icon: 'users', label: 'Perfil e senha' },
]

const STATUS_OPTIONS = ['', 'pendente', 'confirmado', 'concluido', 'cancelado']
const STATUS_LABELS = { '': 'Todos', pendente: 'Pendente', confirmado: 'Confirmado', concluido: 'Concluído', cancelado: 'Cancelado' }

const statusStyle = {
  confirmado: 'bg-success-soft text-success',
  pendente: 'bg-warning-soft text-warning',
  concluido: 'bg-surface-2 text-ink-3',
  cancelado: 'bg-danger-soft text-danger',
}

function formatDate(str) {
  if (!str) return '—'
  const [y, m, d] = str.split('-')
  return `${d}/${m}/${y}`
}

function ClienteSidebar({ user, onClose }) {
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
      {user?.role === 'Profissional' && (
        <NavLink to="/profissional" onClick={onClose}>
          <button className="w-full inline-flex justify-center items-center gap-2 px-4 py-[10px] rounded-md font-medium text-md bg-surface border border-line text-ink-2 cursor-pointer hover:border-ink-3 transition-colors mb-2">
            <Icon name="arrowLeft" size={14} />Voltar ao painel
          </button>
        </NavLink>
      )}
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

export default function MeusAgendamentos() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const { restartTour } = useTour('cliente_agendamentos', clienteAgendamentosSteps, !loading)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    if (!user?.id) return
    api.get(`/appointment/client/${user.id}`, { params: { limit: 100 } })
      .then(({ data }) => setItems(data.data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [user?.id])

  const filtered = statusFilter ? items.filter(i => i.Status === statusFilter) : items

  return (
    <AppLayout sidebar={<ClienteSidebar user={user} />}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 mb-5 md:mb-6">
        <div>
          <h3 className="font-display font-medium text-[22px] md:text-[26px] tracking-tight">Meus agendamentos</h3>
          <p className="text-[12px] md:text-[13px] text-ink-3 mt-1">Histórico completo dos seus atendimentos</p>
          <button onClick={restartTour} className="inline-flex items-center gap-1 text-[11px] text-ink-4 hover:text-brand transition-colors mt-1.5" title="Repetir tour guiado">
            <Icon name="helpCircle" size={12} />
            Ver tour
          </button>
        </div>
        <NavLink to="/agendar">
          <Button data-tour="agendamentos-novo-cliente" size="sm"><Icon name="plus" size={14} />Novo agendamento</Button>
        </NavLink>
      </div>

      {/* Status filters */}
      <div data-tour="agendamentos-filtro-cliente" className="flex gap-1.5 mb-5 flex-wrap">
        {STATUS_OPTIONS.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`inline-flex items-center px-2.5 py-[4px] rounded-full text-xs font-medium border cursor-pointer transition-colors
              ${statusFilter === s ? 'bg-ink text-bg border-ink' : 'bg-surface-2 text-ink-2 border-line hover:border-ink-3'}`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <PageSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="cal"
          title="Nenhum agendamento encontrado"
          description={statusFilter ? 'Não há agendamentos com este status.' : 'Você ainda não tem agendamentos. Que tal marcar um?'}
          action={() => navigate('/agendar')}
          actionLabel="Agendar agora"
        />
      ) : (
        <>
          {/* Desktop table */}
          <div data-tour="agendamentos-lista-cliente" className="hidden md:block bg-surface border border-line rounded-lg overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Data', 'Horário', 'Serviço', 'Profissional', 'Status', ''].map(h => (
                    <th key={h} className="px-3.5 py-3 text-left font-mono text-[10.5px] uppercase tracking-widest text-ink-3 border-b border-line-2">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => (
                  <tr key={row.UUID} className="hover:bg-surface-2 transition-colors">
                    <td className="px-3.5 py-3 font-mono text-[12.5px] border-b border-line-2">{formatDate(row.Date)}</td>
                    <td className="px-3.5 py-3 font-mono text-[12.5px] border-b border-line-2">{row.Start_time?.slice(0,5)} → {row.End_time?.slice(0,5)}</td>
                    <td className="px-3.5 py-3 text-[12.5px] border-b border-line-2">{row.Service ?? '—'}</td>
                    <td className="px-3.5 py-3 text-[12.5px] border-b border-line-2">{row.Professional ?? '—'}</td>
                    <td className="px-3.5 py-3 border-b border-line-2">
                      <Chip status={row.Status} dot>{STATUS_LABELS[row.Status] ?? row.Status}</Chip>
                    </td>
                    <td className="px-3.5 py-3 text-right border-b border-line-2">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/agendamento/${row.UUID}`)}>
                        Detalhes
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-2 md:hidden">
            {filtered.map(row => (
              <div
                key={row.UUID}
                className="bg-surface border border-line rounded-xl p-4 cursor-pointer"
                onClick={() => navigate(`/agendamento/${row.UUID}`)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="font-medium text-[14px] flex-1 min-w-0 truncate">{row.Service ?? '—'}</div>
                  <span className={`inline-flex items-center gap-1 px-2 py-[3px] rounded-full text-[11px] font-medium shrink-0 ${statusStyle[row.Status] ?? ''}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {STATUS_LABELS[row.Status] ?? row.Status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[12px] text-ink-3">
                  <span>{formatDate(row.Date)}</span>
                  <span>·</span>
                  <span>{row.Start_time?.slice(0,5)} → {row.End_time?.slice(0,5)}</span>
                </div>
                {row.Professional && (
                  <div className="text-[12px] text-ink-3 mt-0.5">com {row.Professional}</div>
                )}
                <div className="flex justify-end mt-2">
                  <span className="text-[12px] text-brand font-medium flex items-center gap-1">
                    Detalhes <Icon name="chevronRight" size={12} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </AppLayout>
  )
}
