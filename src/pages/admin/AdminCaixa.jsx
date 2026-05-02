import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Sidebar from '@/components/layout/Sidebar'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Chip from '@/components/ui/Chip'
import Icon from '@/components/ui/Icons'
import { PageSpinner } from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import { useToast } from '@/context/ToastContext'
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

const STATUS_FILTERS = ['Todos', 'Em aberto', 'Paga', 'Expirada']

const PAY_METHODS = [
  { id: 'pix', icon: 'qr', label: 'Pix' },
  { id: 'dinheiro', icon: 'cash', label: 'Dinheiro' },
  { id: 'cartao_debito', icon: 'card', label: 'Débito' },
  { id: 'cartao_credito', icon: 'card', label: 'Crédito' },
]

function statusVariant(s) {
  if (s === 'Em aberto') return 'warning'
  if (s === 'Paga' || s === 'Pago') return 'success'
  return 'danger'
}

function statusLabel(s) {
  if (s === 'Pago') return 'Paga'
  return s
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}

function formatTime(t) {
  if (!t) return '—'
  return t.slice(0, 5)
}

function formatCurrency(v) {
  return `R$ ${Number(v).toFixed(2).replace('.', ',')}`
}

export default function AdminCaixa() {
  const { user } = useAuthStore()
  const { addToast } = useToast()

  const [tabs, setTabs] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [selectedId, setSelectedId] = useState(null)
  const [payMethod, setPayMethod] = useState('pix')
  const [paying, setPaying] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/tab')
      setTabs(data.data ?? [])
    } catch {
      setTabs([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Seleciona primeira tab ao carregar
  useEffect(() => {
    if (tabs.length > 0 && !selectedId) setSelectedId(tabs[0].UUID)
  }, [tabs])

  const filtered = statusFilter === 'Todos'
    ? tabs
    : tabs.filter((t) => {
        if (statusFilter === 'Paga') return t.Status === 'Paga' || t.Status === 'Pago'
        return t.Status === statusFilter
      })

  const selected = tabs.find((t) => t.UUID === selectedId)

  const emAberto = tabs.filter((t) => t.Status === 'Em aberto').length
  const totalAberto = tabs.filter((t) => t.Status === 'Em aberto').reduce((s, t) => s + t.Value, 0)

  async function handlePagar() {
    if (!selected) return
    setPaying(true)
    try {
      // Tabs com valor 0 (uso de combo) não geram transação financeira
      if (selected.Value > 0) {
        await api.post('/transaction', {
          Tab: selected.UUID,
          Method: payMethod,
          Net_amount: selected.Value,
          Gross_amount: selected.Value,
          Payment: true,
          Payment_date: new Date().toISOString(),
        })
      }
      await api.patch(`/tab/${selected.UUID}`, { Status: 'Paga' })
      addToast('Pagamento registrado', 'success')
      load()
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao registrar pagamento', 'error')
    } finally {
      setPaying(false)
    }
  }

  const sidebar = (
    <Sidebar navItems={navItems} footerUser={user?.name} footerRole="Admin">Admin</Sidebar>
  )

  return (
    <AppLayout sidebar={sidebar}>
      <div className="flex justify-between items-end mb-5 md:mb-6">
        <div>
          <h3 className="font-display font-medium text-[22px] md:text-[26px] tracking-tight">Comandas</h3>
          <p className="text-[12px] md:text-[13px] text-ink-3 mt-1">
            {emAberto} em aberto · {formatCurrency(totalAberto)} a receber
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-1.5 mb-5">
        {STATUS_FILTERS.map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`inline-flex items-center px-2.5 py-[4px] rounded-full text-xs font-medium border cursor-pointer transition-colors
              ${statusFilter === s ? 'bg-ink text-bg border-ink' : 'bg-surface-2 text-ink-2 border-line hover:border-ink-3'}`}>
            {s}
          </button>
        ))}
      </div>

      {loading ? <PageSpinner /> : tabs.length === 0 ? (
        <EmptyState icon="receipt" title="Nenhuma comanda" description="Nenhuma comanda encontrada." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4">

          {/* Lista */}
          <div className="bg-surface border border-line rounded-[14px] overflow-hidden h-fit">
            <div className="px-5 py-3.5 border-b border-line flex justify-between items-center">
              <div className="font-display font-medium text-[16px]">Comandas</div>
              <span className="font-mono text-[11px] text-ink-3">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
            </div>
            {filtered.length === 0 ? (
              <div className="px-5 py-8 text-center text-ink-3 text-[13px]">Nenhuma comanda neste filtro</div>
            ) : filtered.map((t, idx) => (
              <button key={t.UUID} onClick={() => setSelectedId(t.UUID)}
                className={`w-full flex items-center gap-3 px-4 md:px-5 py-3.5 md:py-4 border-b border-line-2 last:border-0 cursor-pointer transition-colors text-left
                  ${t.UUID === selectedId ? 'bg-brand-soft' : 'hover:bg-surface-2'}`}>
                <Avatar name={t.Appointment?.Client ?? '?'} index={idx} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] md:text-[13.5px] font-medium truncate">{t.Appointment?.Client ?? 'Sem agendamento'}</div>
                  <div className="font-mono text-[11px] text-ink-3 mt-0.5 truncate">
                    {t.Appointment
                      ? `${t.Appointment.Service} · ${formatDate(t.Appointment.Date)} · ${formatTime(t.Appointment.Start_time)}`
                      : `Criada em ${formatDate(t.Created_at)}`}
                  </div>
                </div>
                <div className="font-mono text-[12px] md:text-[13px] font-medium shrink-0">
                  {formatCurrency(t.Value)}
                </div>
                <Chip variant={statusVariant(t.Status)} className="shrink-0">{statusLabel(t.Status)}</Chip>
              </button>
            ))}
          </div>

          {/* Painel de pagamento */}
          {selected && (
            <div className="bg-surface border border-line rounded-[14px] h-fit lg:sticky top-6">
              <div className="px-6 py-5 border-b border-line">
                <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">Comanda selecionada</span>
                <h4 className="font-display font-medium text-[19px] tracking-tight mt-1.5">
                  {selected.Appointment?.Client ?? 'Comanda avulsa'}
                </h4>
                {selected.Appointment && (
                  <div className="font-mono text-[11.5px] text-ink-3 mt-1">
                    {selected.Appointment.Service} · {formatDate(selected.Appointment.Date)} · {formatTime(selected.Appointment.Start_time)} · {selected.Appointment.Professional}
                  </div>
                )}
              </div>

              <div className="px-6 py-5">
                {/* Valor */}
                <div className="flex justify-between items-center py-3.5 border-b border-dashed border-line-2">
                  <span className="font-mono text-[11px] uppercase tracking-widest text-ink-3">Valor</span>
                  <span className="font-display text-[22px] font-medium">{formatCurrency(selected.Value)}</span>
                </div>

                {/* Status */}
                <div className="flex justify-between items-center py-3.5 border-b border-dashed border-line-2 mb-4">
                  <span className="font-mono text-[11px] uppercase tracking-widest text-ink-3">Status</span>
                  <Chip variant={statusVariant(selected.Status)}>{statusLabel(selected.Status)}</Chip>
                </div>

                {selected.Status === 'Em aberto' ? (
                  <>
                    <div className="font-mono text-[11px] uppercase tracking-widest text-ink-3 mb-2.5">
                      Método de pagamento
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-5">
                      {PAY_METHODS.map((m) => (
                        <button key={m.id} onClick={() => setPayMethod(m.id)}
                          className={`px-3 py-3.5 rounded-[10px] border flex flex-col items-center gap-1.5 text-[13px] cursor-pointer transition-colors
                            ${payMethod === m.id ? 'bg-ink text-bg border-ink' : 'bg-surface border-line hover:border-ink-3'}`}>
                          <Icon name={m.icon} size={20} />
                          {m.label}
                        </button>
                      ))}
                    </div>
                    <Button variant="primary" className="w-full justify-center" onClick={handlePagar} disabled={paying}>
                      <Icon name="check" size={14} />
                      {paying ? 'Registrando...' : 'Registrar pagamento'}
                    </Button>
                  </>
                ) : (
                  <div className={`rounded-lg px-4 py-3 text-[13px] text-center
                    ${selected.Status === 'Paga' || selected.Status === 'Pago' ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}>
                    {selected.Status === 'Paga' || selected.Status === 'Pago' ? 'Pagamento confirmado' : 'Comanda expirada'}
                  </div>
                )}

                <div className="h-px bg-line my-4" />
                <div className="font-mono text-[11px] text-ink-3">
                  Expira em {formatDate(selected.Expire_at)}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  )
}
