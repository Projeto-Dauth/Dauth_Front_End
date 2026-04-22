import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import Sidebar from '@/components/layout/Sidebar'
import Button from '@/components/ui/Button'
import Chip from '@/components/ui/Chip'
import Avatar from '@/components/ui/Avatar'
import Icon from '@/components/ui/Icons'
import { PageSpinner } from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import useAuthStore from '@/store/authStore'
import api from '@/lib/api'

const navItems = [
  { to: '/profissional', end: true, icon: 'cal', label: 'Minha agenda' },
  { to: '/profissional/agendamentos', icon: 'receipt', label: 'Agendamentos' },
  { to: '/profissional/servicos', icon: 'scissors', label: 'Meus serviços' },
  { to: '/profissional/horarios', icon: 'clock', label: 'Meus horários' },
  { type: 'label', label: 'Conta' },
  { to: '/perfil', icon: 'users', label: 'Meu perfil' },
]

const STATUS_OPTIONS = ['', 'pendente', 'confirmado', 'concluido', 'cancelado']
const STATUS_LABELS = { '': 'Todos', pendente: 'Pendente', confirmado: 'Confirmado', concluido: 'Concluído', cancelado: 'Cancelado' }

function formatDate(str) {
  if (!str) return '—'
  const [y, m, d] = str.split('-')
  return `${d}/${m}/${y}`
}

export default function MinhaAgenda() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (dateFilter) params.date = dateFilter
      if (statusFilter) params.status = statusFilter
      const { data } = await api.get('/appointment/my', { params })
      setItems(data.data ?? [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter, dateFilter])

  useEffect(() => { load() }, [load])

  const sidebar = (
    <Sidebar navItems={navItems} footerUser={user?.name} footerRole="Profissional">Profissional</Sidebar>
  )

  return (
    <AppLayout sidebar={sidebar}>
      <div className="flex justify-between items-end mb-6">
        <div>
          <h3 className="font-display font-medium text-[26px] tracking-tight">Minha agenda</h3>
          <p className="text-[13px] text-ink-3 mt-1">Seus agendamentos e atendimentos</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 items-center flex-wrap">
        <input
          type="date"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          className="h-[36px] px-3 rounded-md border border-line bg-surface text-ink-2 text-[13px] focus:outline-none focus:border-brand transition-colors"
        />
        <div className="flex gap-1.5 flex-wrap">
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
        {(dateFilter || statusFilter) && (
          <button
            onClick={() => { setDateFilter(''); setStatusFilter('') }}
            className="text-[12.5px] text-ink-3 hover:text-ink transition-colors cursor-pointer flex items-center gap-1"
          >
            <Icon name="x" size={12} />Limpar
          </button>
        )}
      </div>

      {loading ? (
        <PageSpinner />
      ) : items.length === 0 ? (
        <EmptyState icon="cal" title="Nenhum agendamento" description="Não há agendamentos para os filtros selecionados." />
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map(row => (
            <div
              key={row.UUID}
              onClick={() => navigate(`/agendamento/${row.UUID}`)}
              className="bg-surface border border-line rounded-xl p-4 flex items-center gap-4 hover:border-line-3 transition-colors cursor-pointer"
            >
              <Avatar name={row.Client ?? '?'} index={0} size="md" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-[13.5px] truncate">{row.Client ?? '—'}</div>
                <div className="text-[12.5px] text-ink-3 mt-0.5">{row.Service ?? '—'}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-mono text-[12.5px] font-medium">{row.Start_time?.slice(0,5)} → {row.End_time?.slice(0,5)}</div>
                <div className="font-mono text-[11px] text-ink-3 mt-0.5">{formatDate(row.Date)}</div>
              </div>
              <Chip status={row.Status} dot className="shrink-0">{STATUS_LABELS[row.Status] ?? row.Status}</Chip>
              <Icon name="chevronRight" size={14} className="text-ink-3 shrink-0" />
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  )
}
