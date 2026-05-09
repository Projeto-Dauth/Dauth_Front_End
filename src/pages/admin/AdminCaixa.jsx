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
  { to: '/admin/dashboard', end: true, icon: 'chart', label: 'Dashboard' },
  { type: 'label', label: 'Operação' },
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
  { to: '/profissional/servicos', icon: 'scissors', label: 'Meus serviços' },
  { to: '/profissional/horarios', icon: 'clock', label: 'Meus horários' },
]

const STATUS_FILTERS = ['Todos', 'Em aberto', 'Paga', 'Expirada']

const PAY_METHODS = [
  { id: 'pix', icon: 'qr', label: 'Pix' },
  { id: 'dinheiro', icon: 'cash', label: 'Dinheiro' },
  { id: 'cartao_debito', icon: 'card', label: 'Débito' },
  { id: 'cartao_credito', icon: 'card', label: 'Crédito' },
]

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
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
  return `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ─── Aba Comandas ─────────────────────────────────────────────────────────────

function TabComandas({ user }) {
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

  return (
    <>
      <div className="flex justify-between items-end mb-5 md:mb-6">
        <p className="text-[12px] md:text-[13px] text-ink-3">
          {emAberto} em aberto · {formatCurrency(totalAberto)} a receber
        </p>
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
                <div className="flex justify-between items-center py-3.5 border-b border-dashed border-line-2">
                  <span className="font-mono text-[11px] uppercase tracking-widest text-ink-3">Valor</span>
                  <span className="font-display text-[22px] font-medium">{formatCurrency(selected.Value)}</span>
                </div>

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
    </>
  )
}

// ─── Aba Comissões ────────────────────────────────────────────────────────────

function TabComissoes() {
  const now = new Date()
  const [selMonth, setSelMonth] = useState(now.getMonth())
  const [selYear, setSelYear] = useState(now.getFullYear())
  const [commissions, setCommissions] = useState([])
  const [loading, setLoading] = useState(true)

  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i)

  const monthKey = `${selYear}-${String(selMonth + 1).padStart(2, '0')}`

  useEffect(() => {
    setLoading(true)
    api.get(`/dashboard/commissions?month=${monthKey}`)
      .then(res => setCommissions(res.data.data ?? []))
      .catch(() => setCommissions([]))
      .finally(() => setLoading(false))
  }, [monthKey])

  const totalComissao = commissions.reduce((s, p) => s + p.commission_amount, 0)
  const totalReceita = commissions.reduce((s, p) => s + p.gross_amount, 0)

  return (
    <>
      {/* Cabeçalho com seletor */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <p className="text-[13px] text-ink-3">
          {loading ? '...' : commissions.length === 0
            ? 'Nenhum atendimento registrado neste período'
            : `${commissions.length} profissional${commissions.length !== 1 ? 'is' : ''} · ${formatCurrency(totalComissao)} a pagar`}
        </p>
        <div className="flex items-center gap-2">
          <select
            value={selMonth}
            onChange={e => setSelMonth(Number(e.target.value))}
            className="h-[38px] px-3 rounded-lg border border-line bg-surface text-ink-2 text-[13px] font-body focus:outline-none focus:border-brand cursor-pointer"
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>
          <select
            value={selYear}
            onChange={e => setSelYear(Number(e.target.value))}
            className="h-[38px] px-3 rounded-lg border border-line bg-surface text-ink-2 text-[13px] font-body focus:outline-none focus:border-brand cursor-pointer"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? <PageSpinner /> : commissions.length === 0 ? (
        <EmptyState icon="cash" title="Sem comissões" description="Nenhuma transação paga registrada neste período." />
      ) : (
        <>
          {/* Totalizadores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-surface border border-line rounded-xl p-5 flex flex-col gap-2">
              <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-4">Receita total do período</span>
              <span className="text-[22px] font-display font-semibold tracking-tight text-ink">{formatCurrency(totalReceita)}</span>
            </div>
            <div className="bg-brand border border-brand rounded-xl p-5 flex flex-col gap-2">
              <span className="font-mono text-[10.5px] uppercase tracking-widest text-white/70">Total de comissões a pagar</span>
              <span className="text-[22px] font-display font-semibold tracking-tight text-white">{formatCurrency(totalComissao)}</span>
            </div>
          </div>

          {/* Tabela — desktop */}
          <div className="bg-surface border border-line rounded-[14px] overflow-hidden hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-2">
                  <th className="text-left px-5 py-3.5 font-mono text-[10.5px] uppercase tracking-widest text-ink-4 font-normal">Profissional</th>
                  <th className="text-right px-5 py-3.5 font-mono text-[10.5px] uppercase tracking-widest text-ink-4 font-normal">Atendimentos</th>
                  <th className="text-right px-5 py-3.5 font-mono text-[10.5px] uppercase tracking-widest text-ink-4 font-normal">Receita gerada</th>
                  <th className="text-right px-5 py-3.5 font-mono text-[10.5px] uppercase tracking-widest text-ink-4 font-normal">Comissão a pagar</th>
                  <th className="text-right px-5 py-3.5 font-mono text-[10.5px] uppercase tracking-widest text-ink-4 font-normal">% média</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map((p, i) => {
                  const pct = p.gross_amount > 0 ? ((p.commission_amount / p.gross_amount) * 100).toFixed(1) : '—'
                  return (
                    <tr key={p.professional_id} className="border-b border-line-2 last:border-0 hover:bg-surface-2 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={p.name} index={i} size="sm" />
                          <span className="font-medium text-ink text-[13.5px]">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-[12.5px] text-ink-2">{p.atendimentos}</td>
                      <td className="px-5 py-4 text-right font-mono text-[12.5px] text-ink">{formatCurrency(p.gross_amount)}</td>
                      <td className="px-5 py-4 text-right">
                        <span className="font-mono text-[13px] font-semibold text-brand">{formatCurrency(p.commission_amount)}</span>
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-[12px] text-ink-3">{pct}%</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-line bg-surface-2">
                  <td className="px-5 py-3.5 font-mono text-[11px] uppercase tracking-widest text-ink-3">Total</td>
                  <td className="px-5 py-3.5 text-right font-mono text-[12.5px] text-ink-2">
                    {commissions.reduce((s, p) => s + p.atendimentos, 0)}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-[12.5px] font-semibold text-ink">{formatCurrency(totalReceita)}</td>
                  <td className="px-5 py-3.5 text-right font-mono text-[13px] font-semibold text-brand">{formatCurrency(totalComissao)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Cards — mobile */}
          <div className="md:hidden space-y-3">
            {commissions.map((p, i) => {
              const pct = p.gross_amount > 0 ? ((p.commission_amount / p.gross_amount) * 100).toFixed(1) : '—'
              return (
                <div key={p.professional_id} className="bg-surface border border-line rounded-[14px] px-4 py-4">
                  <div className="flex items-center gap-2.5 mb-3">
                    <Avatar name={p.name} index={i} size="sm" />
                    <span className="font-medium text-[14px] text-ink">{p.name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-y-2">
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-ink-4 mb-0.5">Atendimentos</div>
                      <div className="font-mono text-[13px] text-ink-2">{p.atendimentos}</div>
                    </div>
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-ink-4 mb-0.5">% média</div>
                      <div className="font-mono text-[13px] text-ink-3">{pct}%</div>
                    </div>
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-ink-4 mb-0.5">Receita gerada</div>
                      <div className="font-mono text-[13px] text-ink">{formatCurrency(p.gross_amount)}</div>
                    </div>
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-ink-4 mb-0.5">Comissão a pagar</div>
                      <div className="font-mono text-[14px] font-semibold text-brand">{formatCurrency(p.commission_amount)}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </>
  )
}

// ─── Aba Relatório de Pagamentos ─────────────────────────────────────────────

const METHOD_LABELS = {
  pix: 'Pix',
  dinheiro: 'Dinheiro',
  cartao_credito: 'Crédito',
  cartao_debito: 'Débito',
}

function TabRelatorio() {
  const now = new Date()
  const todayStr = now.toLocaleDateString('en-CA')
  const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const [start, setStart] = useState(firstOfMonth)
  const [end, setEnd] = useState(todayStr)
  const [payments, setPayments] = useState([])
  const [totais, setTotais] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  async function handleBuscar() {
    setLoading(true)
    setSearched(true)
    try {
      const { data } = await api.get(`/dashboard/payments?start=${start}&end=${end}`)
      setPayments(data.data ?? [])
      setTotais(data.totais ?? null)
    } catch {
      setPayments([])
      setTotais(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Filtro de período */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-6">
        <div className="flex flex-col gap-1">
          <label className="font-mono text-[10.5px] uppercase tracking-widest text-ink-4">De</label>
          <input
            type="date"
            value={start}
            max={end}
            onChange={e => setStart(e.target.value)}
            className="h-[38px] px-3 rounded-lg border border-line bg-surface text-ink-2 text-[13px] font-body focus:outline-none focus:border-brand cursor-pointer"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-mono text-[10.5px] uppercase tracking-widest text-ink-4">Até</label>
          <input
            type="date"
            value={end}
            min={start}
            onChange={e => setEnd(e.target.value)}
            className="h-[38px] px-3 rounded-lg border border-line bg-surface text-ink-2 text-[13px] font-body focus:outline-none focus:border-brand cursor-pointer"
          />
        </div>
        <Button variant="primary" onClick={handleBuscar} disabled={loading} className="sm:mb-0 self-end">
          <Icon name="search" size={14} />
          {loading ? 'Buscando...' : 'Buscar'}
        </Button>
      </div>

      {loading ? <PageSpinner /> : !searched ? (
        <EmptyState icon="receipt" title="Selecione um período" description="Escolha as datas e clique em Buscar para gerar o relatório." />
      ) : payments.length === 0 ? (
        <EmptyState icon="cash" title="Nenhum pagamento" description="Nenhum pagamento encontrado neste período." />
      ) : (
        <>
          {/* Totalizadores */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {['pix', 'dinheiro', 'cartao_credito', 'cartao_debito'].map(m => (
              <div key={m} className="bg-surface border border-line rounded-xl p-4 flex flex-col gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-widest text-ink-4">{METHOD_LABELS[m]}</span>
                <span className="text-[17px] font-display font-semibold tracking-tight text-ink">
                  {formatCurrency(totais?.[m] ?? 0)}
                </span>
              </div>
            ))}
          </div>
          <div className="bg-brand rounded-xl p-4 flex items-center justify-between mb-6">
            <span className="font-mono text-[10.5px] uppercase tracking-widest text-white/70">Total do período</span>
            <span className="text-[22px] font-display font-semibold tracking-tight text-white">
              {formatCurrency(totais?.geral ?? 0)}
            </span>
          </div>

          {/* Tabela — desktop */}
          <div className="bg-surface border border-line rounded-[14px] overflow-hidden hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-2">
                  <th className="text-left px-5 py-3.5 font-mono text-[10.5px] uppercase tracking-widest text-ink-4 font-normal">Data</th>
                  <th className="text-left px-5 py-3.5 font-mono text-[10.5px] uppercase tracking-widest text-ink-4 font-normal">Cliente</th>
                  <th className="text-left px-5 py-3.5 font-mono text-[10.5px] uppercase tracking-widest text-ink-4 font-normal">Profissional</th>
                  <th className="text-left px-5 py-3.5 font-mono text-[10.5px] uppercase tracking-widest text-ink-4 font-normal">Serviço</th>
                  <th className="text-left px-5 py-3.5 font-mono text-[10.5px] uppercase tracking-widest text-ink-4 font-normal">Método</th>
                  <th className="text-right px-5 py-3.5 font-mono text-[10.5px] uppercase tracking-widest text-ink-4 font-normal">Valor</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.uuid} className="border-b border-line-2 last:border-0 hover:bg-surface-2 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-[12px] text-ink-3">{formatDate(p.data)}</td>
                    <td className="px-5 py-3.5 text-[13.5px] font-medium text-ink">{p.cliente}</td>
                    <td className="px-5 py-3.5 text-[13px] text-ink-2">{p.profissional}</td>
                    <td className="px-5 py-3.5 text-[13px] text-ink-2">{p.servico}</td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-[11.5px] bg-surface-2 border border-line px-2 py-0.5 rounded-full">
                        {METHOD_LABELS[p.metodo] ?? p.metodo}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-[13px] font-semibold text-ink">{formatCurrency(p.valor)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-line bg-surface-2">
                  <td colSpan={5} className="px-5 py-3.5 font-mono text-[11px] uppercase tracking-widest text-ink-3">
                    {payments.length} pagamento{payments.length !== 1 ? 's' : ''}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-[13px] font-semibold text-ink">
                    {formatCurrency(totais?.geral ?? 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Cards — mobile */}
          <div className="md:hidden space-y-3">
            {payments.map(p => (
              <div key={p.uuid} className="bg-surface border border-line rounded-[14px] px-4 py-4">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="font-medium text-[14px] text-ink">{p.cliente}</span>
                  <span className="font-mono text-[13.5px] font-semibold text-ink">{formatCurrency(p.valor)}</span>
                </div>
                <div className="grid grid-cols-2 gap-y-2">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-ink-4 mb-0.5">Data</div>
                    <div className="font-mono text-[12px] text-ink-3">{formatDate(p.data)}</div>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-ink-4 mb-0.5">Método</div>
                    <div className="font-mono text-[12px] text-ink-2">{METHOD_LABELS[p.metodo] ?? p.metodo}</div>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-ink-4 mb-0.5">Profissional</div>
                    <div className="text-[13px] text-ink-2">{p.profissional}</div>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-ink-4 mb-0.5">Serviço</div>
                    <div className="text-[13px] text-ink-2">{p.servico}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function AdminCaixa() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('comandas')

  const sidebar = (
    <Sidebar navItems={navItems} footerUser={user?.name} footerRole="Admin">Admin</Sidebar>
  )

  return (
    <AppLayout sidebar={sidebar}>
      {/* Header + tabs */}
      <div className="mb-5 md:mb-6">
        <h3 className="font-display font-medium text-[22px] md:text-[26px] tracking-tight mb-4">Caixa</h3>
        <div className="flex gap-1 border-b border-line">
          {[
            { id: 'comandas', label: 'Comandas', icon: 'receipt' },
            { id: 'comissoes', label: 'Comissões', icon: 'cash' },
            { id: 'relatorio', label: 'Relatório', icon: 'chart' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[13.5px] font-medium border-b-2 -mb-px transition-colors cursor-pointer
                ${activeTab === tab.id
                  ? 'border-brand text-brand'
                  : 'border-transparent text-ink-3 hover:text-ink-2'}`}
            >
              <Icon name={tab.icon} size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'comandas' ? <TabComandas user={user} /> : activeTab === 'comissoes' ? <TabComissoes /> : <TabRelatorio />}
    </AppLayout>
  )
}
