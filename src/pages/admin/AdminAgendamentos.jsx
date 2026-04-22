import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import Sidebar from '@/components/layout/Sidebar'
import Button from '@/components/ui/Button'
import Chip from '@/components/ui/Chip'
import Icon from '@/components/ui/Icons'
import { PageSpinner } from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import useAuthStore from '@/store/authStore'
import api from '@/lib/api'

const navItems = [
  { to: '/admin', end: true, icon: 'cal', label: 'Agenda' },
  { to: '/admin/agendamentos', icon: 'receipt', label: 'Agendamentos' },
  { to: '/admin/usuarios', icon: 'users', label: 'Usuários' },
  { to: '/admin/convidar-profissional', icon: 'plus', label: 'Convidar profissional' },
  { to: '/admin/servicos', icon: 'scissors', label: 'Serviços' },
  { to: '/admin/combos', icon: 'package', label: 'Pacotes' },
  { type: 'label', label: 'Financeiro' },
  { to: '/admin/caixa', icon: 'receipt', label: 'Comandas' },
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

export default function AdminAgendamentos() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ date: '', status: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.date) params.date = filters.date
      if (filters.status) params.status = filters.status
      const { data } = await api.get('/appointment', { params })
      setItems(data.data ?? [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { load() }, [load])

  const sidebar = (
    <Sidebar navItems={navItems} footerUser={user?.name} footerRole="Admin">Admin</Sidebar>
  )

  return (
    <AppLayout sidebar={sidebar}>
      {/* Header */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h3 className="font-display font-medium text-[26px] tracking-tight">Agendamentos</h3>
          <p className="text-[13px] text-ink-3 mt-1">Gerencie todos os agendamentos do salão</p>
        </div>
        <Button size="sm" onClick={() => navigate('/agendamento/novo')}>
          <Icon name="plus" size={14} />Novo agendamento
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 items-center flex-wrap">
        <input
          type="date"
          value={filters.date}
          onChange={e => setFilters(f => ({ ...f, date: e.target.value }))}
          className="h-[36px] px-3 rounded-md border border-line bg-surface text-ink-2 text-[13px] focus:outline-none focus:border-brand transition-colors"
        />
        <div className="flex gap-1.5">
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => setFilters(f => ({ ...f, status: s }))}
              className={`inline-flex items-center px-2.5 py-[4px] rounded-full text-xs font-medium border cursor-pointer transition-colors
                ${filters.status === s ? 'bg-ink text-bg border-ink' : 'bg-surface-2 text-ink-2 border-line hover:border-ink-3'}`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        {(filters.date || filters.status) && (
          <button
            onClick={() => setFilters({ date: '', status: '' })}
            className="text-[12.5px] text-ink-3 hover:text-ink transition-colors cursor-pointer flex items-center gap-1"
          >
            <Icon name="x" size={12} />Limpar
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <PageSpinner />
      ) : items.length === 0 ? (
        <EmptyState icon="cal" title="Nenhum agendamento" description="Nenhum agendamento encontrado para os filtros selecionados." />
      ) : (
        <div className="bg-surface border border-line rounded-lg overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Data', 'Horário', 'Cliente', 'Profissional', 'Serviço', 'Status', ''].map(h => (
                  <th key={h} className="px-3.5 py-3 text-left font-mono text-[10.5px] uppercase tracking-widest text-ink-3 border-b border-line-2">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map(row => (
                <tr key={row.UUID} className="hover:bg-surface-2 transition-colors">
                  <td className="px-3.5 py-3 font-mono text-[12.5px] border-b border-line-2">{formatDate(row.Date)}</td>
                  <td className="px-3.5 py-3 font-mono text-[12.5px] border-b border-line-2">{row.Start_time?.slice(0, 5)} → {row.End_time?.slice(0, 5)}</td>
                  <td className="px-3.5 py-3 text-[12.5px] border-b border-line-2">{row.Client ?? '—'}</td>
                  <td className="px-3.5 py-3 text-[12.5px] border-b border-line-2">{row.Professional ?? '—'}</td>
                  <td className="px-3.5 py-3 text-[12.5px] border-b border-line-2">{row.Service ?? '—'}</td>
                  <td className="px-3.5 py-3 border-b border-line-2">
                    <Chip status={row.Status} dot>{STATUS_LABELS[row.Status] ?? row.Status}</Chip>
                  </td>
                  <td className="px-3.5 py-3 text-right border-b border-line-2">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/agendamento/${row.UUID}`)}>
                      <Icon name="chevronRight" size={14} />
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
