import { useState, useEffect } from 'react'
import { useNavigate, NavLink } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import Button from '@/components/ui/Button'
import Chip from '@/components/ui/Chip'
import Icon from '@/components/ui/Icons'
import Avatar from '@/components/ui/Avatar'
import { PageSpinner } from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import useAuthStore from '@/store/authStore'
import api from '@/lib/api'

const navItems = [
  { to: '/cliente', end: true, icon: 'cal', label: 'Início' },
  { to: '/cliente/agendamentos', icon: 'receipt', label: 'Meus agendamentos' },
  { to: '/cliente/combos', icon: 'package', label: 'Meus combos' },
  { to: '/perfil', icon: 'users', label: 'Perfil e senha' },
]

const STATUS_OPTIONS = ['', 'pendente', 'confirmado', 'concluido', 'cancelado']
const STATUS_LABELS = { '': 'Todos', pendente: 'Pendente', confirmado: 'Confirmado', concluido: 'Concluído', cancelado: 'Cancelado' }

function formatDate(str) {
  if (!str) return '—'
  const [y, m, d] = str.split('-')
  return `${d}/${m}/${y}`
}

function ClienteSidebar({ user }) {
  return (
    <aside className="flex flex-col gap-0.5 bg-surface-2 border-r border-line px-4 py-6 w-60 min-w-[240px]">
      <div className="flex items-center gap-2.5 px-2 pb-4 mb-1 border-b border-line">
        <div className="w-8 h-8 rounded-lg bg-ink text-bg flex items-center justify-center font-display font-bold text-base">d</div>
        <div className="font-display font-semibold text-base">Dauth</div>
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
      <NavLink to="/agendar">
        <button className="w-full inline-flex justify-center items-center gap-2 px-4 py-[10px] rounded-md font-medium text-md bg-brand text-white border border-brand cursor-pointer hover:bg-[#72391f] transition-colors">
          <Icon name="plus" size={14} />Novo agendamento
        </button>
      </NavLink>
    </aside>
  )
}

export default function MeusAgendamentos() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    if (!user?.id) return
    api.get(`/appointment/client/${user.id}`)
      .then(({ data }) => setItems(data.data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [user?.id])

  const filtered = statusFilter ? items.filter(i => i.Status === statusFilter) : items

  return (
    <AppLayout sidebar={<ClienteSidebar user={user} />}>
      <div className="flex justify-between items-end mb-6">
        <div>
          <h3 className="font-display font-medium text-[26px] tracking-tight">Meus agendamentos</h3>
          <p className="text-[13px] text-ink-3 mt-1">Histórico completo dos seus atendimentos</p>
        </div>
        <NavLink to="/agendar">
          <Button size="sm"><Icon name="plus" size={14} />Novo agendamento</Button>
        </NavLink>
      </div>

      {/* Status filters */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
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
        <div className="bg-surface border border-line rounded-lg overflow-hidden">
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
      )}
    </AppLayout>
  )
}
