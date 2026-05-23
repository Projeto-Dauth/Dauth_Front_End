import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import Sidebar from '@/components/layout/Sidebar'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Chip from '@/components/ui/Chip'
import Icon from '@/components/ui/Icons'
import Modal from '@/components/ui/Modal'
import { PageSpinner } from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import { useToast } from '@/context/ToastContext'
import useAuthStore from '@/store/authStore'
import api from '@/lib/api'
import { navItemsByRole } from '@/config/navItems'
import { useTour } from '@/hooks/useTour'
import { adminCaixaComandasSteps } from '@/tours/adminCaixaComandas'
import { adminCaixaComissoesSteps } from '@/tours/adminCaixaComissoes'

const navItems = navItemsByRole['Admin']

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

const PROD_STATUS_LABELS = { encomendado: 'Encomendado', pago: 'Pago', cancelado: 'Cancelado' }
const PROD_STATUS_COLORS = {
  encomendado: 'bg-warning-soft text-warning',
  pago: 'bg-success-soft text-success',
  cancelado: 'bg-surface-2 text-ink-3',
}
const PAYMENT_LABELS_PROD = { dinheiro: 'Dinheiro', pix: 'Pix', cartao_credito: 'Crédito', cartao_debito: 'Débito' }
const inputClsProd = 'h-[42px] px-[14px] rounded-md border border-line bg-surface text-ink-2 font-body text-md placeholder:text-ink-4 focus:outline-none focus:border-brand transition-colors w-full'
const EMPTY_ORDER = { Product_id: '', Client_id: '', Quantity: '1', Payment_method: '', Notes: '' }

function FieldProd({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] text-ink-3 font-medium uppercase tracking-wider">{label}</label>
      {children}
    </div>
  )
}
function InfoRowProd({ label, value, mono, highlight }) {
  return (
    <div className="flex justify-between items-baseline gap-3">
      <span className="text-[12px] text-ink-3 shrink-0">{label}</span>
      <span className={`text-right ${mono ? 'font-mono text-[12px]' : 'text-[13px]'} ${highlight ? 'font-medium text-brand' : 'text-ink-2'}`}>
        {value ?? '—'}
      </span>
    </div>
  )
}

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

function TabComandas({ user, initialAppointmentId }) {
  const { addToast } = useToast()

  const [tabs, setTabs] = useState([])
  const [loading, setLoading] = useState(true)
  useTour('admin_caixa_comandas', adminCaixaComandasSteps, !loading)
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [selectedId, setSelectedId] = useState(null)
  const [payMethod, setPayMethod] = useState('pix')
  const [paying, setPaying] = useState(false)

  // Fechar conta (batch pay)
  const [batchClient, setBatchClient] = useState(null) // { name, clientId, tabs: [] }
  const [batchMethod, setBatchMethod] = useState('pix')
  const [batchPaying, setBatchPaying] = useState(false)
  const [batchOrders, setBatchOrders] = useState([])
  const [batchOrdersLoading, setBatchOrdersLoading] = useState(false)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const { data } = await api.get('/tab')
      setTabs(data.data ?? [])
    } catch {
      setTabs([])
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (tabs.length === 0) return
    if (initialAppointmentId) {
      const match = tabs.find(t => t.Appointment?.UUID === initialAppointmentId)
      if (match) { setSelectedId(match.UUID); return }
    }
    if (!selectedId) setSelectedId(tabs[0].UUID)
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

  // Agrupamento por cliente para detectar comandas em aberto
  const clientsWithOpenTabs = (() => {
    const map = {}
    tabs.filter(t => t.Status === 'Em aberto' && t.Appointment?.ClientId).forEach(t => {
      const id = t.Appointment.ClientId
      if (!map[id]) map[id] = { name: t.Appointment.Client, clientId: id, tabs: [] }
      map[id].tabs.push(t)
    })
    return Object.values(map)
  })()

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
      load(true)
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao registrar pagamento', 'error')
    } finally {
      setPaying(false)
    }
  }

  async function openBatchModal(c) {
    setBatchClient(c)
    setBatchMethod('pix')
    setBatchOrders([])
    setBatchOrdersLoading(true)
    try {
      const { data } = await api.get(`/product-order?client_id=${c.clientId}&status=encomendado`)
      setBatchOrders(data.data ?? [])
    } catch {
      setBatchOrders([])
    } finally {
      setBatchOrdersLoading(false)
    }
  }

  async function handleFecharConta() {
    if (!batchClient) return
    setBatchPaying(true)
    try {
      await api.post('/tab/batch-pay', {
        tab_ids: batchClient.tabs.map(t => t.UUID),
        Method: batchMethod,
        Payment_date: new Date().toISOString(),
        client_id: batchClient.clientId,
      })
      addToast(`Conta de ${batchClient.name} fechada com sucesso`, 'success')
      setBatchClient(null)
      setBatchOrders([])
      load(true)
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao fechar conta', 'error')
    } finally {
      setBatchPaying(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-5 md:mb-6">
        <p className="text-[12px] md:text-[13px] text-ink-3">
          {emAberto} em aberto · {formatCurrency(totalAberto)} a receber
        </p>
      </div>

      {/* Contas a fechar */}
      {clientsWithOpenTabs.length > 0 && (
        <div className="mb-5 space-y-2">
          <p className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3 mb-2">
            {clientsWithOpenTabs.length === 1 ? 'Conta em aberto' : 'Contas em aberto'}
          </p>
          {clientsWithOpenTabs.map((c, idx) => {
            const total = c.tabs.reduce((s, t) => s + t.Value, 0)
            return (
              <div key={c.clientId} className="flex items-center justify-between gap-3 bg-surface border border-line rounded-[12px] px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={c.name} index={idx} size="sm" />
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium truncate">{c.name}</div>
                    <div className="font-mono text-[11px] text-ink-3">
                      {c.tabs.length} comanda{c.tabs.length !== 1 ? 's' : ''} · {formatCurrency(total)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => openBatchModal(c)}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] text-[12.5px] font-medium bg-brand text-white hover:bg-brand/90 transition-colors cursor-pointer">
                  <Icon name="cash" size={13} />
                  Fechar conta
                </button>
              </div>
            )
          })}
        </div>
      )}

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

      {/* Modal fechar conta */}
      {batchClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-surface border border-line rounded-[16px] w-full max-w-[400px] shadow-xl">
            <div className="px-6 py-5 border-b border-line flex justify-between items-center">
              <div>
                <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">Fechar conta</span>
                <h4 className="font-display font-medium text-[18px] tracking-tight mt-1">{batchClient.name}</h4>
              </div>
              <button onClick={() => { setBatchClient(null); setBatchOrders([]) }} className="text-ink-3 hover:text-ink transition-colors cursor-pointer">
                <Icon name="x" size={18} />
              </button>
            </div>
            <div className="px-6 py-5">
              {batchOrdersLoading ? (
                <div className="space-y-2 mb-5 animate-pulse">
                  {batchClient.tabs.map(t => (
                    <div key={t.UUID} className="flex items-center justify-between">
                      <div className="h-3.5 bg-line rounded w-2/3" />
                      <div className="h-3.5 bg-line rounded w-16" />
                    </div>
                  ))}
                  <div className="pt-2 border-t border-dashed border-line-2 space-y-2">
                    <div className="h-3 bg-line rounded w-1/4" />
                    <div className="flex items-center justify-between">
                      <div className="h-3.5 bg-line rounded w-1/2" />
                      <div className="h-3.5 bg-line rounded w-16" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-dashed border-line-2">
                    <div className="h-3 bg-line rounded w-10" />
                    <div className="h-6 bg-line rounded w-24" />
                  </div>
                </div>
              ) : (
                <div className="space-y-2 mb-5">
                  {batchClient.tabs.map(t => (
                    <div key={t.UUID} className="flex items-center justify-between text-[13px]">
                      <span className="text-ink-2">{t.Appointment?.Service} · {formatTime(t.Appointment?.Start_time)}</span>
                      <span className="font-mono font-medium text-ink">{formatCurrency(t.Value)}</span>
                    </div>
                  ))}
                  {batchOrders.length > 0 && (
                    <>
                      <div className="pt-2 border-t border-dashed border-line-2">
                        <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">Produtos</span>
                      </div>
                      {batchOrders.map(o => (
                        <div key={o.UUID} className="flex items-center justify-between text-[13px]">
                          <span className="text-ink-2">{o.Product?.Name} × {o.Quantity}</span>
                          <span className="font-mono font-medium text-ink">{formatCurrency(o.Total_price)}</span>
                        </div>
                      ))}
                    </>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-dashed border-line-2">
                    <span className="font-mono text-[11px] uppercase tracking-widest text-ink-3">Total</span>
                    <span className="font-display text-[20px] font-medium text-ink">
                      {formatCurrency(
                        batchClient.tabs.reduce((s, t) => s + t.Value, 0) +
                        batchOrders.reduce((s, o) => s + o.Total_price, 0)
                      )}
                    </span>
                  </div>
                </div>
              )}
              <div className="font-mono text-[11px] uppercase tracking-widest text-ink-3 mb-2.5">Método de pagamento</div>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {PAY_METHODS.map((m) => (
                  <button key={m.id} onClick={() => setBatchMethod(m.id)}
                    className={`px-3 py-3 rounded-[10px] border flex flex-col items-center gap-1.5 text-[13px] cursor-pointer transition-colors
                      ${batchMethod === m.id ? 'bg-ink text-bg border-ink' : 'bg-surface border-line hover:border-ink-3'}`}>
                    <Icon name={m.icon} size={18} />
                    {m.label}
                  </button>
                ))}
              </div>
              <Button variant="primary" className="w-full justify-center" onClick={handleFecharConta} disabled={batchPaying || batchOrdersLoading}>
                <Icon name="check" size={14} />
                {batchPaying ? 'Fechando...' : batchOrdersLoading ? 'Carregando...' : `Fechar conta · ${formatCurrency(
                  batchClient.tabs.reduce((s, t) => s + t.Value, 0) +
                  batchOrders.reduce((s, o) => s + o.Total_price, 0)
                )}`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {loading ? <PageSpinner /> : tabs.length === 0 ? (
        <EmptyState icon="receipt" title="Nenhuma comanda" description="Nenhuma comanda encontrada." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4">

          {/* Lista */}
          <div data-tour="comanda-lista" className="bg-surface border border-line rounded-[14px] overflow-hidden h-fit">
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
            <div data-tour="comanda-painel" className="bg-surface border border-line rounded-[14px] h-fit lg:sticky top-6">
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

// ─── Sub-aba Pedidos de Produtos (Admin) ─────────────────────────────────────

function TabPedidosProdutos() {
  const { addToast } = useToast()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [payMethod, setPayMethod] = useState('pix')
  const [paying, setPaying] = useState(false)
  const [products, setProducts] = useState([])
  const [clients, setClients] = useState([])
  const [newDrawer, setNewDrawer] = useState(false)
  const [orderForm, setOrderForm] = useState(EMPTY_ORDER)
  const [savingOrder, setSavingOrder] = useState(false)
  const [cancelModal, setCancelModal] = useState(null)
  const [canceling, setCanceling] = useState(false)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const params = {}
      if (filterStatus) params.status = filterStatus
      const { data } = await api.get('/product-order', { params })
      setOrders(data.data ?? [])
    } catch { setOrders([]) }
    finally { if (!silent) setLoading(false) }
  }, [filterStatus])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    Promise.all([api.get('/product'), api.get('/users', { params: { Role: 'Usuario' } })])
      .then(([pRes, cRes]) => {
        setProducts((pRes.data.data ?? []).filter(p => p.Active))
        setClients(cRes.data.data ?? [])
      }).catch(() => {})
  }, [])

  useEffect(() => {
    if (orders.length === 0) return
    if (!selectedId) setSelectedId(orders[0].UUID)
  }, [orders])

  const filtered = filterStatus ? orders.filter(o => o.Status === filterStatus) : orders
  const selected = orders.find(o => o.UUID === selectedId)
  const encomendadoCount = orders.filter(o => o.Status === 'encomendado').length

  async function handlePay() {
    if (!selected) return
    setPaying(true)
    try {
      await api.patch(`/product-order/${selected.UUID}`, { Status: 'pago', Payment_method: payMethod })
      addToast('Pagamento registrado', 'success')
      load(true)
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao registrar pagamento', 'error')
    } finally {
      setPaying(false)
    }
  }

  async function handleCancel() {
    setCanceling(true)
    try {
      await api.patch(`/product-order/${cancelModal.UUID}`, { Status: 'cancelado' })
      addToast('Pedido cancelado', 'success')
      setCancelModal(null)
      load(true)
    } catch (err) { addToast(err.response?.data?.error || 'Erro', 'error') }
    finally { setCanceling(false) }
  }

  async function handleSaveOrder(e) {
    e.preventDefault()
    if (!orderForm.Product_id) { addToast('Selecione um produto', 'warning'); return }
    if (!orderForm.Client_id)  { addToast('Selecione um cliente', 'warning'); return }
    setSavingOrder(true)
    try {
      await api.post('/product-order', {
        Product_id: orderForm.Product_id,
        Client_id: orderForm.Client_id,
        Quantity: Number(orderForm.Quantity),
        Payment_method: orderForm.Payment_method || null,
        Notes: orderForm.Notes || null,
      })
      addToast('Pedido criado com sucesso', 'success')
      setNewDrawer(false)
      setOrderForm(EMPTY_ORDER)
      load()
    } catch (err) { addToast(err.response?.data?.error || 'Erro ao criar pedido', 'error') }
    finally { setSavingOrder(false) }
  }

  const selProd = products.find(p => p.UUID === orderForm.Product_id)
  const estTotal = selProd ? formatCurrency(selProd.Price * Number(orderForm.Quantity || 1)) : null

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <p className="text-[12px] md:text-[13px] text-ink-3">
          {encomendadoCount} encomendado{encomendadoCount !== 1 ? 's' : ''}
        </p>
        <Button size="sm" onClick={() => { setOrderForm(EMPTY_ORDER); setNewDrawer(true) }}>
          <Icon name="plus" size={14} />Novo pedido
        </Button>
      </div>

      <div className="flex gap-1.5 mb-5">
        {[['', 'Todos'], ['encomendado', 'Encomendados'], ['pago', 'Pagos'], ['cancelado', 'Cancelados']].map(([val, label]) => (
          <button key={val} onClick={() => setFilterStatus(val)}
            className={`inline-flex items-center px-2.5 py-[4px] rounded-full text-xs font-medium border cursor-pointer transition-colors
              ${filterStatus === val ? 'bg-ink text-bg border-ink' : 'bg-surface-2 text-ink-2 border-line hover:border-ink-3'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? <PageSpinner /> : orders.length === 0 ? (
        <EmptyState icon="package" title="Nenhum pedido encontrado"
          description={filterStatus ? 'Tente outro filtro.' : 'Registre o primeiro pedido de produto.'}
          action={filterStatus ? undefined : () => { setOrderForm(EMPTY_ORDER); setNewDrawer(true) }}
          actionLabel="Novo pedido" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4">
          {/* Lista */}
          <div className="bg-surface border border-line rounded-[14px] overflow-hidden h-fit">
            <div className="px-5 py-3.5 border-b border-line flex justify-between items-center">
              <div className="font-display font-medium text-[16px]">Pedidos</div>
              <span className="font-mono text-[11px] text-ink-3">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
            </div>
            {filtered.length === 0 ? (
              <div className="px-5 py-8 text-center text-ink-3 text-[13px]">Nenhum pedido neste filtro</div>
            ) : filtered.map((o, idx) => (
              <button key={o.UUID} onClick={() => setSelectedId(o.UUID)}
                className={`w-full flex items-center gap-3 px-4 md:px-5 py-3.5 md:py-4 border-b border-line-2 last:border-0 cursor-pointer transition-colors text-left
                  ${o.UUID === selectedId ? 'bg-brand-soft' : 'hover:bg-surface-2'}`}>
                <Avatar name={o.Client?.Name ?? '?'} index={idx} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] md:text-[13.5px] font-medium truncate">{o.Client?.Name ?? '—'}</div>
                  <div className="font-mono text-[11px] text-ink-3 mt-0.5 truncate">
                    {o.Product?.Name} · {formatDate(o.Created_at)} · Qtd {o.Quantity}
                  </div>
                </div>
                <div className="font-mono text-[12px] md:text-[13px] font-medium shrink-0">
                  {formatCurrency(o.Total_price)}
                </div>
                <span className={`font-mono text-[10.5px] uppercase tracking-widest px-2 py-0.5 rounded shrink-0 ${PROD_STATUS_COLORS[o.Status]}`}>
                  {PROD_STATUS_LABELS[o.Status]}
                </span>
              </button>
            ))}
          </div>

          {/* Painel de pagamento */}
          {selected && (
            <div className="bg-surface border border-line rounded-[14px] h-fit lg:sticky top-6">
              <div className="px-6 py-5 border-b border-line">
                <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">Pedido selecionado</span>
                <h4 className="font-display font-medium text-[19px] tracking-tight mt-1.5">
                  {selected.Client?.Name ?? '—'}
                </h4>
                <div className="font-mono text-[11.5px] text-ink-3 mt-1">
                  {selected.Product?.Name} · {formatDate(selected.Created_at)} · Qtd {selected.Quantity}
                  {selected.SoldBy?.Name && ` · ${selected.SoldBy.Name}`}
                </div>
              </div>

              <div className="px-6 py-5">
                <div className="flex justify-between items-center py-3.5 border-b border-dashed border-line-2">
                  <span className="font-mono text-[11px] uppercase tracking-widest text-ink-3">Valor</span>
                  <span className="font-display text-[22px] font-medium">{formatCurrency(selected.Total_price)}</span>
                </div>

                <div className="flex justify-between items-center py-3.5 border-b border-dashed border-line-2 mb-4">
                  <span className="font-mono text-[11px] uppercase tracking-widest text-ink-3">Status</span>
                  <span className={`font-mono text-[10.5px] uppercase tracking-widest px-2.5 py-1 rounded ${PROD_STATUS_COLORS[selected.Status]}`}>
                    {PROD_STATUS_LABELS[selected.Status]}
                  </span>
                </div>

                {selected.Status === 'encomendado' ? (
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
                    <Button variant="primary" className="w-full justify-center mb-2" onClick={handlePay} disabled={paying}>
                      <Icon name="check" size={14} />
                      {paying ? 'Registrando...' : 'Registrar pagamento'}
                    </Button>
                    <Button variant="ghost" className="w-full justify-center text-danger hover:text-danger" onClick={() => setCancelModal(selected)}>
                      Cancelar pedido
                    </Button>
                  </>
                ) : (
                  <div className={`rounded-lg px-4 py-3 text-[13px] text-center
                    ${selected.Status === 'pago' ? 'bg-success-soft text-success' : 'bg-surface-2 text-ink-3'}`}>
                    {selected.Status === 'pago' ? 'Pedido pago' : 'Pedido cancelado'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {newDrawer && (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-ink/30" onClick={() => setNewDrawer(false)} />
          <div className="w-full md:w-[420px] bg-surface border-l border-line h-full overflow-y-auto p-5 md:p-7 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-display font-medium text-[20px] tracking-tight">Novo pedido</h4>
              <button onClick={() => setNewDrawer(false)} className="text-ink-3 hover:text-ink cursor-pointer transition-colors"><Icon name="x" size={18} /></button>
            </div>
            <form onSubmit={handleSaveOrder} className="flex flex-col gap-4 flex-1">
              <FieldProd label="Produto">
                <select required value={orderForm.Product_id} onChange={e => setOrderForm(f => ({ ...f, Product_id: e.target.value }))} className={inputClsProd}>
                  <option value="">Selecione...</option>
                  {products.map(p => <option key={p.UUID} value={p.UUID}>{p.Name} — {formatCurrency(p.Price)} (estoque: {p.Stock})</option>)}
                </select>
              </FieldProd>
              <FieldProd label="Cliente">
                <select required value={orderForm.Client_id} onChange={e => setOrderForm(f => ({ ...f, Client_id: e.target.value }))} className={inputClsProd}>
                  <option value="">Selecione...</option>
                  {clients.map(c => <option key={c.UUID} value={c.UUID}>{c.Name}</option>)}
                </select>
              </FieldProd>
              <FieldProd label="Quantidade">
                <input required type="number" min="1" value={orderForm.Quantity} onChange={e => setOrderForm(f => ({ ...f, Quantity: e.target.value }))} className={inputClsProd} />
              </FieldProd>
              {estTotal && (
                <div className="bg-brand-soft rounded-lg px-4 py-2.5 flex justify-between items-center">
                  <span className="text-[12px] text-ink-3">Total estimado</span>
                  <span className="font-display font-medium text-[16px] text-brand">{estTotal}</span>
                </div>
              )}
              <FieldProd label="Método de pagamento (opcional)">
                <select value={orderForm.Payment_method} onChange={e => setOrderForm(f => ({ ...f, Payment_method: e.target.value }))} className={inputClsProd}>
                  <option value="">A definir</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="pix">Pix</option>
                  <option value="cartao_credito">Cartão de crédito</option>
                  <option value="cartao_debito">Cartão de débito</option>
                </select>
              </FieldProd>
              <FieldProd label="Observações (opcional)">
                <textarea value={orderForm.Notes} onChange={e => setOrderForm(f => ({ ...f, Notes: e.target.value }))}
                  placeholder="Alguma observação sobre o pedido..." rows={3}
                  className={`${inputClsProd} h-auto py-2.5 resize-none`} />
              </FieldProd>
              <div className="flex gap-2 mt-auto pt-4">
                <Button type="button" variant="ghost" className="flex-1 justify-center" onClick={() => setNewDrawer(false)}>Cancelar</Button>
                <Button type="submit" variant="primary" className="flex-1 justify-center" disabled={savingOrder}>
                  {savingOrder ? 'Salvando...' : 'Criar pedido'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Modal isOpen={!!cancelModal} onClose={() => setCancelModal(null)} onConfirm={handleCancel}
        title="Cancelar pedido"
        message={`Cancelar o pedido de "${cancelModal?.Product?.Name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Cancelar pedido" loading={canceling} />
    </>
  )
}

// ─── Aba Comissões ────────────────────────────────────────────────────────────

function groupByProfessional(transactions) {
  const map = {}
  transactions.forEach(tx => {
    const id = tx.professional_id
    if (!map[id]) map[id] = { professional_id: id, name: tx.professional_name, rows: [] }
    map[id].rows.push(tx)
  })
  return Object.values(map)
}

function TabComissoes() {
  const { addToast } = useToast()
  const now = new Date()
  const [selMonth, setSelMonth] = useState(now.getMonth())
  const [selYear, setSelYear] = useState(now.getFullYear())
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  useTour('admin_caixa_comissoes', adminCaixaComissoesSteps, !loading)
  const [markingPaid, setMarkingPaid] = useState(null)

  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i)
  const monthKey = `${selYear}-${String(selMonth + 1).padStart(2, '0')}`

  function load(silent = false) {
    if (!silent) setLoading(true)
    api.get(`/transaction/all-commissions?month=${monthKey}`)
      .then(res => setTransactions(res.data.data ?? []))
      .catch(() => setTransactions([]))
      .finally(() => { if (!silent) setLoading(false) })
  }

  useEffect(() => { load() }, [monthKey])

  async function handleMarcarRepassado(txUuid) {
    setMarkingPaid(txUuid)
    try {
      await api.patch(`/transaction/${txUuid}`, { Commission_paid: true })
      addToast('Comissão marcada como repassada', 'success')
      load(true)
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao marcar comissão', 'error')
    } finally {
      setMarkingPaid(null)
    }
  }

  const pendentes = transactions.filter(tx => !tx.commission_paid)
  const repassadas = transactions.filter(tx => tx.commission_paid)
  const totalPendente = pendentes.reduce((s, tx) => s + tx.commission_amount, 0)
  const totalReceita = transactions.reduce((s, tx) => s + tx.gross_amount, 0)

  const groupsPendentes = groupByProfessional(pendentes)
  const groupsRepassadas = groupByProfessional(repassadas)

  return (
    <>
      {/* Cabeçalho com seletor */}
      <div data-tour="comissoes-filtro" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <p className="text-[13px] text-ink-3">
          {loading ? '...' : transactions.length === 0
            ? 'Nenhum atendimento registrado neste período'
            : `${pendentes.length} a repassar · ${formatCurrency(totalPendente)}`}
        </p>
        <div className="flex items-center gap-2">
          <select value={selMonth} onChange={e => setSelMonth(Number(e.target.value))}
            className="h-[38px] px-3 rounded-lg border border-line bg-surface text-ink-2 text-[13px] font-body focus:outline-none focus:border-brand cursor-pointer">
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select value={selYear} onChange={e => setSelYear(Number(e.target.value))}
            className="h-[38px] px-3 rounded-lg border border-line bg-surface text-ink-2 text-[13px] font-body focus:outline-none focus:border-brand cursor-pointer">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading ? <PageSpinner /> : transactions.length === 0 ? (
        <EmptyState icon="cash" title="Sem comissões" description="Nenhuma transação paga registrada neste período." />
      ) : (
        <>
          {/* Totalizadores */}
          <div data-tour="comissoes-lista" className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-surface border border-line rounded-xl p-5 flex flex-col gap-2">
              <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-4">Receita total do período</span>
              <span className="text-[28px] font-serif font-light leading-none tracking-wide text-ink">{formatCurrency(totalReceita)}</span>
            </div>
            <div className="bg-brand border border-brand rounded-xl p-5 flex flex-col gap-2">
              <span className="font-mono text-[10.5px] uppercase tracking-widest text-white/70">Comissões a repassar</span>
              <span className="text-[28px] font-serif font-light leading-none tracking-wide text-white">{formatCurrency(totalPendente)}</span>
            </div>
          </div>

          {/* A repassar */}
          {groupsPendentes.length > 0 && (
            <CommissionSection
              title="A repassar"
              groups={groupsPendentes}
              markingPaid={markingPaid}
              onMarcarRepassado={handleMarcarRepassado}
            />
          )}

          {/* Repassadas */}
          {groupsRepassadas.length > 0 && (
            <div className={groupsPendentes.length > 0 ? 'mt-8' : ''}>
              <CommissionSection title="Repassadas" groups={groupsRepassadas} paid />
            </div>
          )}
        </>
      )}
    </>
  )
}

function CommissionSection({ title, groups, markingPaid, onMarcarRepassado, paid = false }) {
  const totalRows = groups.reduce((s, g) => s + g.rows.length, 0)
  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <span className="font-mono text-[11px] uppercase tracking-widest text-ink-3">{title}</span>
        <span className="font-mono text-[11px] text-ink-4">({totalRows})</span>
        <div className="flex-1 border-t border-line-2" />
      </div>
      <div className="space-y-5">
        {groups.map((g, gi) => (
          <div key={g.professional_id} className="bg-surface border border-line rounded-[14px] overflow-hidden">
            {/* Cabeçalho do profissional */}
            <div className="flex items-center gap-2.5 px-5 py-3 bg-surface-2 border-b border-line">
              <Avatar name={g.name} index={gi} size="sm" />
              <span className="font-medium text-[13.5px] text-ink">{g.name}</span>
              <span className="ml-auto font-mono text-[11px] text-ink-4">{g.rows.length} atendimento{g.rows.length !== 1 ? 's' : ''}</span>
              <span className={`font-mono text-[13px] font-semibold ${paid ? 'text-ink-3' : 'text-brand'}`}>
                {formatCurrency(g.rows.reduce((s, r) => s + r.commission_amount, 0))}
              </span>
            </div>

            {/* Tabela — desktop */}
            <table className="w-full text-sm hidden md:table">
              <tbody>
                {g.rows.map(tx => (
                  <tr key={tx.uuid} className="border-b border-line-2 last:border-0 hover:bg-surface-2 transition-colors">
                    <td className="px-5 py-3 text-[13px] text-ink-2">{tx.cliente}</td>
                    <td className="px-5 py-3 text-[12px] text-ink-3">{tx.servico}</td>
                    <td className="px-5 py-3 text-right font-mono text-[12px] text-ink-3">
                      {tx.data ? new Date(tx.data).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-[12px] text-ink">{formatCurrency(tx.gross_amount)}</td>
                    <td className="px-5 py-3 text-right font-mono text-[13px] font-semibold text-brand">{formatCurrency(tx.commission_amount)}</td>
                    <td className="px-5 py-3 text-right">
                      {paid ? (
                        <Chip variant="success">Repassado</Chip>
                      ) : (
                        <button
                          onClick={() => onMarcarRepassado(tx.uuid)}
                          disabled={markingPaid === tx.uuid}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-warning-soft text-warning border border-warning/30 hover:bg-warning/20 cursor-pointer transition-colors disabled:opacity-60">
                          {markingPaid === tx.uuid ? '...' : 'Marcar repassado'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Cards — mobile */}
            <div className="md:hidden divide-y divide-line-2">
              {g.rows.map(tx => (
                <div key={tx.uuid} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-ink truncate">{tx.cliente}</div>
                    <div className="text-[11px] text-ink-3 truncate">{tx.servico}</div>
                    <div className="font-mono text-[11px] text-ink-4 mt-0.5">
                      {formatCurrency(tx.gross_amount)} · comissão {formatCurrency(tx.commission_amount)}
                    </div>
                  </div>
                  {paid ? (
                    <Chip variant="success">Repassado</Chip>
                  ) : (
                    <button
                      onClick={() => onMarcarRepassado(tx.uuid)}
                      disabled={markingPaid === tx.uuid}
                      className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-warning-soft text-warning border border-warning/30 cursor-pointer transition-colors disabled:opacity-60">
                      {markingPaid === tx.uuid ? '...' : 'Repassar'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
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
                <span className="text-[22px] font-serif font-light leading-none tracking-wide text-ink">
                  {formatCurrency(totais?.[m] ?? 0)}
                </span>
              </div>
            ))}
          </div>
          <div className="bg-brand rounded-xl p-4 flex items-center justify-between mb-6">
            <span className="font-mono text-[10.5px] uppercase tracking-widest text-white/70">Total do período</span>
            <span className="text-[28px] font-serif font-light leading-none tracking-wide text-white">
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
  const [searchParams] = useSearchParams()
  const initialAppointmentId = searchParams.get('appointment')
  const [activeTab, setActiveTab] = useState('comandas')

  const sidebar = (
    <Sidebar navItems={navItems} footerUser={user?.name} footerRole="Admin">Admin</Sidebar>
  )

  return (
    <AppLayout sidebar={sidebar}>
      {/* Header + tabs */}
      <div className="mb-5 md:mb-6">
        <h3 className="font-display font-medium text-[22px] md:text-[26px] tracking-tight mb-4">Caixa</h3>
        <div data-tour="caixa-tabs" className="flex gap-1 border-b border-line">
          {[
            { id: 'comandas', label: 'Comandas', icon: 'receipt' },
            { id: 'produtos', label: 'Produtos', icon: 'package' },
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

      {activeTab === 'comandas' ? <TabComandas user={user} initialAppointmentId={initialAppointmentId} />
        : activeTab === 'produtos' ? <TabPedidosProdutos />
        : activeTab === 'comissoes' ? <TabComissoes />
        : <TabRelatorio />}
    </AppLayout>
  )
}
