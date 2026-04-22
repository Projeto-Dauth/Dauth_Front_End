import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Icon from '@/components/ui/Icons'
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

const statusStyle = {
  ativo:     'bg-success-soft text-success',
  pendente:  'bg-warning-soft text-warning',
  concluido: 'bg-surface-2 text-ink-3',
  cancelado: 'bg-danger-soft text-danger',
}
const statusLabel = {
  ativo:     'Ativo',
  pendente:  'Pendente',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}

function formatDate(str) {
  if (!str) return '—'
  const [y, m, d] = str.split('T')[0].split('-')
  return `${d}/${m}/${y}`
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function ProgressBar({ used, total }) {
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0
  return (
    <div className="h-1.5 bg-line rounded-full overflow-hidden">
      <div
        className="h-full bg-brand rounded-full transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function ComboCard({ combo }) {
  const pkg = combo.Service_package
  const items = combo.Client_package_items ?? []
  const totalSessions = items.reduce((s, i) => s + i.Total_quantity, 0)
  const usedSessions = items.reduce((s, i) => s + i.Used_quantity, 0)
  const remaining = totalSessions - usedSessions

  return (
    <div className="bg-surface border border-line rounded-2xl p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-widest text-ink-3 mb-1.5">
            <Icon name="package" size={11} />Pacote
          </div>
          <h4 className="font-display font-medium text-[18px] tracking-tight">{pkg?.Name ?? '—'}</h4>
          <div className="text-[13px] text-ink-3 mt-0.5">
            {pkg?.Price != null ? formatCurrency(pkg.Price) : '—'}
            {pkg?.Available_until && (
              <span className="ml-2">· válido até {formatDate(pkg.Available_until)}</span>
            )}
          </div>
        </div>
        <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full text-xs font-medium ${statusStyle[combo.Status] ?? 'bg-surface-2 text-ink-3'}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {statusLabel[combo.Status] ?? combo.Status}
        </span>
      </div>

      {/* Progresso geral */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1.5">
          <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">Sessões</span>
          <span className="font-mono text-[12px] text-ink-2">
            {usedSessions} / {totalSessions} usadas · <span className="text-brand">{remaining} restantes</span>
          </span>
        </div>
        <ProgressBar used={usedSessions} total={totalSessions} />
      </div>

      {/* Serviços incluídos */}
      <div className="border-t border-line pt-4 flex flex-col gap-2">
        {items.map((item) => {
          const rest = item.Total_quantity - item.Used_quantity
          return (
            <div key={item.UUID} className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[13px]">
                <Icon name="scissors" size={12} className="text-ink-4" />
                {item.Service?.Name ?? '—'}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] text-ink-3">
                  {item.Used_quantity}/{item.Total_quantity}
                </span>
                <span className={`font-mono text-[11px] px-2 py-0.5 rounded-full ${rest > 0 ? 'bg-success-soft text-success' : 'bg-surface-2 text-ink-4'}`}>
                  {rest > 0 ? `${rest} restante${rest > 1 ? 's' : ''}` : 'esgotado'}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="border-t border-line pt-3 mt-4">
        <div className="font-mono text-[10.5px] text-ink-4">
          Adquirido em {combo.Acquired_at ? formatDate(combo.Acquired_at) : formatDate(combo.Created_at)}
        </div>
      </div>
    </div>
  )
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

export default function MeusCombos() {
  const { user } = useAuthStore()
  const [combos, setCombos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    api.get(`/package/client/${user.id}`)
      .then(({ data }) => setCombos(data.data ?? []))
      .catch(() => setCombos([]))
      .finally(() => setLoading(false))
  }, [user?.id])

  const ativos = combos.filter(c => c.Status === 'ativo' || c.Status === 'pendente')
  const historico = combos.filter(c => c.Status === 'concluido' || c.Status === 'cancelado')

  return (
    <AppLayout sidebar={<ClienteSidebar user={user} />}>
      <div className="flex justify-between items-end mb-7">
        <div>
          <h3 className="font-display font-medium text-[26px] tracking-tight">Meus combos</h3>
          <p className="text-[13px] text-ink-3 mt-1">Pacotes adquiridos e sessões disponíveis</p>
        </div>
      </div>

      {loading ? (
        <PageSpinner />
      ) : combos.length === 0 ? (
        <EmptyState
          icon="package"
          title="Nenhum combo adquirido"
          description="Converse com a equipe sobre nossos pacotes e economize em cada atendimento."
          action={() => {}}
          actionLabel="Agendar serviço"
        />
      ) : (
        <>
          {ativos.length > 0 && (
            <>
              <h4 className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3 mb-3">
                Ativos · {ativos.length}
              </h4>
              <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
                {ativos.map(c => <ComboCard key={c.UUID} combo={c} />)}
              </div>
            </>
          )}

          {historico.length > 0 && (
            <>
              <h4 className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3 mb-3">
                Histórico · {historico.length}
              </h4>
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
                {historico.map(c => <ComboCard key={c.UUID} combo={c} />)}
              </div>
            </>
          )}
        </>
      )}
    </AppLayout>
  )
}
