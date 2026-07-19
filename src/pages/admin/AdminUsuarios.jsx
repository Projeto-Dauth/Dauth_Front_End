import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Sidebar from '@/components/layout/Sidebar'
import Button from '@/components/ui/Button'
import Chip from '@/components/ui/Chip'
import Avatar from '@/components/ui/Avatar'
import Icon from '@/components/ui/Icons'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import EmptyState from '@/components/ui/EmptyState'
import LoadMoreButton from '@/components/ui/LoadMoreButton'
import ModalFecharConta from '@/components/ui/ModalFecharConta'
import { useToast } from '@/context/ToastContext'
import useAuthStore from '@/store/authStore'
import api from '@/lib/api'
import { navItemsByRole } from '@/config/navItems'
import { useTour } from '@/hooks/useTour'
import { adminUsuariosSteps } from '@/tours/adminUsuariosTour'
import { usePaginatedList } from '@/hooks/usePaginatedList'

const navItems = navItemsByRole['Admin']

const SETTLE_METHODS = [
  { id: 'pix', icon: 'qr', label: 'Pix' },
  { id: 'dinheiro', icon: 'cash', label: 'Dinheiro' },
  { id: 'cartao_debito', icon: 'card', label: 'Débito' },
  { id: 'cartao_credito', icon: 'card', label: 'Crédito' },
]

function ModalPagarMensalidade({ client, items, total, onClose, onSuccess }) {
  const { addToast } = useToast()
  const [method, setMethod] = useState(null)
  const [paying, setPaying] = useState(false)

  async function handleConfirm() {
    if (!method) return
    setPaying(true)
    try {
      await api.post('/transaction/fiado-settle', {
        client_id: client.client_id,
        client_name: client.client_name,
        transaction_ids: items.map(i => i.uuid),
        settlement_method: method,
        total_amount: total,
      })
      addToast(`Mensalidade de ${client.client_name} paga com sucesso!`, 'success')
      onSuccess()
    } catch {
      addToast('Erro ao registrar pagamento. Tente novamente.', 'error')
    } finally {
      setPaying(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm px-0 md:px-4">
      <div className="w-full md:max-w-[500px] bg-surface rounded-t-2xl md:rounded-[16px] shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-line shrink-0">
          <div className="flex-1 min-w-0">
            <h4 className="font-display font-medium text-[15px] text-ink">Pagar mensalidade</h4>
            <p className="text-[12px] text-ink-3 mt-0.5 truncate">{client.client_name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-ink-4 hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer">
            <Icon name="x" size={16} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4">
          <div className="space-y-2 mb-4">
            {items.map(item => (
              <div key={item.uuid} className="flex items-center justify-between text-[13px]">
                <div>
                  <span className="text-ink-2">{item.servico}</span>
                  <span className="font-mono text-[11px] text-ink-4 ml-2">
                    {item.appointment_date
                      ? new Date(item.appointment_date).toLocaleDateString('pt-BR')
                      : item.payment_date
                        ? new Date(item.payment_date).toLocaleDateString('pt-BR')
                        : '—'}
                  </span>
                </div>
                <span className="font-mono font-medium text-ink">{formatCurrency(item.gross_amount)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-3 border-t border-dashed border-line-2">
              <span className="font-mono text-[11px] uppercase tracking-widest text-ink-3">Total</span>
              <span className="font-display text-[20px] font-medium text-warning">{formatCurrency(total)}</span>
            </div>
          </div>

          <p className="font-mono text-[10.5px] uppercase tracking-widest text-ink-4 mb-2">Forma de pagamento</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SETTLE_METHODS.map(m => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`px-3 py-2.5 rounded-[10px] border flex flex-col items-center gap-1 text-[12px] cursor-pointer transition-colors
                  ${method === m.id ? 'bg-ink text-bg border-ink' : 'bg-surface border-line hover:border-ink-3'}`}
              >
                <Icon name={m.icon} size={16} />
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 py-4 border-t border-line shrink-0 flex gap-2">
          <button
            onClick={onClose}
            disabled={paying}
            className="flex-1 h-[42px] rounded-lg border border-line text-ink-2 text-[13px] font-medium hover:bg-surface-2 transition-colors cursor-pointer disabled:opacity-50">
            Cancelar
          </button>
          <Button loading={paying} disabled={!method} onClick={handleConfirm} className="flex-1">
            <Icon name="check" size={14} />
            Confirmar pagamento
          </Button>
        </div>
      </div>
    </div>
  )
}

const ROLE_FILTERS = ['Todos', 'Admin', 'Profissional', 'Cliente']
const ROLE_FILTER_API = { Cliente: 'Usuario' }

const ROLE_CHIP = {
  Admin: 'brand',
  Profissional: 'warning',
  Usuario: 'default',
}

const ROLE_LABEL = {
  Admin: 'Admin',
  Profissional: 'Profissional',
  Usuario: 'Cliente',
}

const CLIENT_EXTRA_FILTERS = [
  { key: 'mensalista', label: 'Mensalistas' },
  { key: 'comanda_aberta', label: 'Comanda aberta' },
  { key: 'aniversariante', label: 'Aniversariante do mês' },
  { key: 'ativo', label: 'Ativos' },
  { key: 'inativo', label: 'Inativos' },
]

function formatBirthday(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${String(d.getUTCDate()).padStart(2,'0')}/${String(d.getUTCMonth()+1).padStart(2,'0')}/${d.getUTCFullYear()}`
}

function applyPhoneMask(value) {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return `(${d}`
  if (d.length <= 7) return `(${d.slice(0,2)}) ${d.slice(2)}`
  if (d.length <= 11) return `(${d.slice(0,2)}) ${d.slice(2,3)} ${d.slice(3,7)}-${d.slice(7)}`
  return value
}

function isBirthdayThisMonth(iso) {
  if (!iso) return false
  const d = new Date(iso)
  return d.getUTCMonth() === new Date().getMonth()
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-3.5 py-3 border-b border-line-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-line-2 shrink-0" />
          <div className="flex flex-col gap-1.5">
            <div className="h-3 w-28 rounded bg-line-2" />
            <div className="h-2.5 w-20 rounded bg-line-2" />
          </div>
        </div>
      </td>
      <td className="px-3.5 py-3 border-b border-line-2"><div className="h-5 w-16 rounded-full bg-line-2" /></td>
      <td className="px-3.5 py-3 border-b border-line-2"><div className="h-3 w-28 rounded bg-line-2" /></td>
      <td className="px-3.5 py-3 border-b border-line-2"><div className="h-3 w-20 rounded bg-line-2" /></td>
      <td className="px-3.5 py-3 border-b border-line-2"><div className="h-5 w-12 rounded-full bg-line-2" /></td>
      <td className="px-3.5 py-3 border-b border-line-2" />
    </tr>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-surface border border-line rounded-xl p-4 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-line-2 shrink-0" />
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="h-3 w-32 rounded bg-line-2" />
          <div className="h-2.5 w-24 rounded bg-line-2" />
        </div>
        <div className="h-5 w-12 rounded-full bg-line-2" />
      </div>
      <div className="flex items-center justify-between">
        <div className="h-5 w-16 rounded-full bg-line-2" />
        <div className="h-7 w-20 rounded bg-line-2" />
      </div>
    </div>
  )
}

const EMPTY_FORM = { name: '', phone: '', birthday: '' }

function formatDate(str) {
  if (!str) return '—'
  const [y, m, d] = str.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

const STATUS_LABELS = { pendente: 'Pendente', confirmado: 'Confirmado', concluido: 'Concluído', cancelado: 'Cancelado' }

function formatCurrency(v) {
  return `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function toDateInputValue(iso) {
  if (!iso) return ''
  return iso.slice(0, 10)
}

function ClientePanel({ client, onClose, onReload, mensalistaData }) {
  const { addToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState([])
  const [tabs, setTabs] = useState([])
  const [mensalistaModal, setMensalistaModal] = useState(false)

  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: client.Name, phone: client.Phone ?? '', birthday: toDateInputValue(client.Birthday) })
  const [editErrors, setEditErrors] = useState({})
  const [savingEdit, setSavingEdit] = useState(false)

  function validateEdit() {
    const errs = {}
    if (!editForm.name.trim()) errs.name = 'Nome é obrigatório'
    if (!/^\(\d{2}\) \d \d{4}-\d{4}$/.test(editForm.phone)) errs.phone = 'Telefone inválido. Ex: (11) 9 9999-9999'
    return errs
  }

  async function handleSaveEdit() {
    const errs = validateEdit()
    if (Object.keys(errs).length > 0) { setEditErrors(errs); return }
    setSavingEdit(true)
    try {
      await api.patch(`/users/${client.UUID}`, {
        Name: editForm.name.trim(),
        Phone: editForm.phone,
        Birthday: editForm.birthday || null,
      })
      addToast('Cliente atualizado com sucesso', 'success')
      setEditing(false)
      onReload()
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao atualizar cliente', 'error')
    } finally {
      setSavingEdit(false)
    }
  }

  const [fecharConta, setFecharConta] = useState(null)
  const [fecharMethod, setFecharMethod] = useState('pix')
  const [fecharPaying, setFecharPaying] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get(`/appointment/client/${client.UUID}`, { params: { limit: 100 } }),
      api.get(`/tab/client/${client.UUID}`),
    ])
      .then(([apptRes, tabRes]) => {
        setAppointments(apptRes.data.data ?? [])
        setTabs(tabRes.data.data ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [client.UUID])

  const openTabs = tabs.filter(t => t.Status === 'Em aberto')
  const paidTabs = tabs.filter(t => (t.Status === 'Paga' || t.Status === 'Pago') && t.Value > 0)
  const totalGasto = paidTabs.reduce((s, t) => s + t.Value, 0)
  const concludedCount = appointments.filter(a => a.Status === 'concluido').length
  const ticketMedio = concludedCount > 0 ? totalGasto / concludedCount : 0

  async function handleOpenFecharConta() {
    setFecharMethod('pix')
    try {
      const { data } = await api.get(`/tab/client/${client.UUID}/account-summary`)
      setFecharConta(data)
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao carregar conta do cliente', 'error')
    }
  }

  async function handleFecharConta(tabIds, orderPayments) {
    setFecharPaying(true)
    try {
      await api.post('/tab/batch-pay', {
        tab_ids: tabIds,
        Method: fecharMethod,
        Payment_date: new Date().toISOString(),
        order_payments: orderPayments,
      })
      addToast('Conta fechada com sucesso', 'success')
      setFecharConta(null)
      onReload()
      onClose()
    } catch (err) {
      addToast(err.response?.data?.error ?? 'Erro ao fechar conta', 'error')
    } finally {
      setFecharPaying(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 flex flex-col justify-end md:flex-row md:justify-end">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} />
        <div className="relative z-10 w-full rounded-t-2xl md:rounded-none md:w-[460px] bg-bg md:border-l border-line flex flex-col max-h-[90vh] md:max-h-full md:h-full overflow-y-auto shadow-xl">

          {/* Alça mobile */}
          <div className="flex justify-center pt-3 pb-1 md:hidden">
            <div className="w-10 h-1 rounded-full bg-line-2" />
          </div>

          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-line sticky top-0 bg-bg z-10">
            <button onClick={onClose} className="text-ink-3 hover:text-ink transition-colors cursor-pointer">
              <Icon name="x" size={18} />
            </button>
            <Avatar name={client.Name} index={0} size="sm" />
            <div className="flex-1 min-w-0">
              <h4 className="font-display font-medium text-[15px] tracking-tight truncate">{client.Name}</h4>
              <p className="font-mono text-[11px] text-ink-3">{client.Phone ?? '—'}</p>
            </div>
            <Chip variant={client.active ? 'success' : 'danger'}>{client.active ? 'Ativo' : 'Inativo'}</Chip>
            <button
              onClick={() => setEditing((v) => !v)}
              className="md:hidden p-1.5 rounded-lg text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
              title="Editar cliente"
            >
              <Icon name="edit" size={16} />
            </button>
          </div>

          {editing ? (
            <div className="px-5 py-5 flex flex-col gap-4">
              <Input
                label="Nome completo"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                error={editErrors.name}
              />
              <Input
                label="Telefone"
                placeholder="(11) 9 9999-9999"
                value={editForm.phone}
                onChange={(e) => setEditForm((f) => ({ ...f, phone: applyPhoneMask(e.target.value) }))}
                error={editErrors.phone}
              />
              <Input
                label="Data de nascimento"
                type="date"
                value={editForm.birthday}
                onChange={(e) => setEditForm((f) => ({ ...f, birthday: e.target.value }))}
              />
              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="md" onClick={() => setEditing(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button variant="primary" size="md" onClick={handleSaveEdit} loading={savingEdit} className="flex-1">
                  Salvar
                </Button>
              </div>
            </div>
          ) : loading ? (
            <div className="px-5 py-5 flex flex-col gap-6 animate-pulse">
              {/* KPI skeleton */}
              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2].map(i => (
                  <div key={i} className="bg-surface border border-line rounded-xl p-3 flex flex-col items-center gap-2">
                    <div className="h-6 w-14 bg-line-2 rounded" />
                    <div className="h-2.5 w-16 bg-line-2 rounded" />
                  </div>
                ))}
              </div>
              {/* Rows skeleton */}
              <div className="space-y-3">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="flex justify-between items-center py-2.5 border-b border-line-2">
                    <div className="flex flex-col gap-1.5">
                      <div className="h-3 w-32 bg-line-2 rounded" />
                      <div className="h-2.5 w-24 bg-line-2 rounded" />
                    </div>
                    <div className="h-5 w-16 bg-line-2 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="px-5 py-5 flex flex-col gap-6">

              {/* KPIs */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-surface border border-line rounded-xl p-3 text-center">
                  <div className="font-serif text-[24px] font-light leading-none text-ink">{concludedCount}</div>
                  <div className="text-[11px] text-ink-3 mt-1.5">Atendimentos</div>
                </div>
                <div className="bg-surface border border-line rounded-xl p-3 text-center">
                  <div className="font-serif text-[20px] font-light leading-none text-brand truncate px-1">{formatCurrency(totalGasto)}</div>
                  <div className="text-[11px] text-ink-3 mt-1.5">Total gasto</div>
                </div>
                <div className="bg-surface border border-line rounded-xl p-3 text-center">
                  <div className="font-serif text-[20px] font-light leading-none text-ink truncate px-1">{formatCurrency(ticketMedio)}</div>
                  <div className="text-[11px] text-ink-3 mt-1.5">Ticket médio</div>
                </div>
              </div>

              {/* Mensalidade pendente */}
              {mensalistaData && mensalistaData.items.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-[13.5px]">Mensalidade pendente</h5>
                    <span className="font-mono text-[11px] text-warning">{formatCurrency(mensalistaData.total)}</span>
                  </div>
                  <div className="space-y-1.5 mb-3">
                    {mensalistaData.items.map(item => (
                      <div key={item.uuid} className="flex items-center justify-between bg-warning-soft border border-warning/20 rounded-lg px-3 py-2 text-[13px]">
                        <span className="text-ink-2 truncate">{item.servico}</span>
                        <span className="font-mono font-medium text-ink shrink-0 ml-2">{formatCurrency(item.gross_amount)}</span>
                      </div>
                    ))}
                  </div>
                  <Button variant="primary" size="sm" className="w-full justify-center" onClick={() => setMensalistaModal(true)}>
                    <Icon name="cash" size={13} />Pagar mensalidade
                  </Button>
                </div>
              )}

              {/* Comandas em aberto */}
              {openTabs.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-[13.5px]">Comandas em aberto</h5>
                    <span className="text-[11px] font-mono text-warning">{openTabs.length} aberta{openTabs.length > 1 ? 's' : ''}</span>
                  </div>
                  <div className="space-y-2 mb-3">
                    {openTabs.map(t => (
                      <div key={t.UUID} className="flex items-center justify-between bg-warning-soft border border-warning/20 rounded-lg px-3 py-2.5 text-[13px]">
                        <span className="text-ink-2">{t.Appointment?.Service ?? '—'} · {t.Appointment?.Start_time?.slice(0, 5) ?? '—'}</span>
                        <span className="font-mono font-medium text-ink">{formatCurrency(t.Value)}</span>
                      </div>
                    ))}
                  </div>
                  <Button variant="primary" size="sm" className="w-full justify-center" onClick={handleOpenFecharConta}>
                    <Icon name="cash" size={13} />Fechar conta
                  </Button>
                </div>
              )}

              {/* Últimos agendamentos */}
              <div>
                <h5 className="font-medium text-[13.5px] mb-3">Últimos agendamentos</h5>
                {appointments.length === 0 ? (
                  <p className="text-[13px] text-ink-3">Nenhum agendamento registrado.</p>
                ) : (
                  <div>
                    {appointments.slice(0, 5).map(row => (
                      <div key={row.UUID} className="flex items-center justify-between py-2.5 border-b border-line-2 last:border-0">
                        <div>
                          <div className="text-[13px] font-medium">{row.Service ?? '—'}</div>
                          <div className="text-[11.5px] text-ink-3">{formatDate(row.Date)} · {row.Professional ?? '—'}</div>
                        </div>
                        <Chip status={row.Status} dot>{STATUS_LABELS[row.Status] ?? row.Status}</Chip>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="hidden md:flex justify-center">
                <Icon name="edit" size={13} />
                Editar cliente
              </Button>

            </div>
          )}
        </div>
      </div>

      {fecharConta && (
        <ModalFecharConta
          client={fecharConta}
          method={fecharMethod}
          onMethodChange={setFecharMethod}
          paying={fecharPaying}
          onClose={() => setFecharConta(null)}
          onConfirm={handleFecharConta}
        />
      )}

      {mensalistaModal && mensalistaData && (
        <ModalPagarMensalidade
          client={{ client_id: client.UUID, client_name: client.Name }}
          items={mensalistaData.items}
          total={mensalistaData.total}
          onClose={() => setMensalistaModal(false)}
          onSuccess={() => { setMensalistaModal(false); onReload() }}
        />
      )}
    </>
  )
}

export default function AdminUsuarios() {
  const { user } = useAuthStore()
  const { addToast } = useToast()

  const [roleFilter, setRoleFilter] = useState('Todos')
  const [extraFilter, setExtraFilter] = useState(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [openTabClientIds, setOpenTabClientIds] = useState(new Set())
  const [toggleTarget, setToggleTarget] = useState(null)
  const [toggling, setToggling] = useState(false)

  const [selectedClient, setSelectedClient] = useState(null)
  const [selectedMensalistaData, setSelectedMensalistaData] = useState(null)
  const [mensalistaClients, setMensalistaClients] = useState([])
  const [mensalistaLoading, setMensalistaLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  const mensalistaClientIds = new Set(mensalistaClients.map(c => c.client_id))

  // stable dep keys for id-based filters (only computed when relevant)
  const mensalistaIdsKey = extraFilter === 'mensalista' ? [...mensalistaClientIds].sort().join(',') : ''
  const openTabIdsKey = extraFilter === 'comanda_aberta' ? [...openTabClientIds].sort().join(',') : ''

  const { items: filtered, loading, loadingMore, hasMore, reload, loadMore } = usePaginatedList(
    (page, limit) => {
      const params = { page, limit }
      if (roleFilter !== 'Todos') params.Role = ROLE_FILTER_API[roleFilter] ?? roleFilter
      if (debouncedSearch) params.search = debouncedSearch
      if (extraFilter === 'ativo') params.active = true
      if (extraFilter === 'inativo') params.active = false
      if (extraFilter === 'aniversariante') params.birthday_month = new Date().getMonth() + 1
      if (extraFilter === 'mensalista') params.ids = mensalistaIdsKey
      if (extraFilter === 'comanda_aberta') params.ids = openTabIdsKey
      return api.get('/users', { params }).then((r) => r.data)
    },
    [roleFilter, debouncedSearch, extraFilter, mensalistaIdsKey, openTabIdsKey]
  )

  const { restartTour } = useTour('admin_usuarios', adminUsuariosSteps, !loading)

  // tabs: busca única, independente da paginação de usuários
  useEffect(() => {
    api.get('/tab', { params: { limit: 1000 } })
      .then(({ data }) => {
        const tabs = data.data ?? []
        setOpenTabClientIds(new Set(
          tabs
            .filter((t) => t.Status === 'Em aberto' && t.Appointment?.ClientId)
            .map((t) => t.Appointment.ClientId)
        ))
      })
      .catch(() => {})
  }, [])

  // mensalistas: busca única no mount
  function loadMensalistas() {
    setMensalistaLoading(true)
    api.get('/transaction/fiado-pending')
      .then(({ data }) => setMensalistaClients(data.data ?? []))
      .catch(() => setMensalistaClients([]))
      .finally(() => setMensalistaLoading(false))
  }
  useEffect(() => { loadMensalistas() }, [])

  // limpa filtros ao mudar aba de role
  useEffect(() => { setExtraFilter(null); setSearch('') }, [roleFilter])

  function openClient(u) {
    setSelectedClient(u)
    const m = mensalistaClients.find(c => c.client_id === u.UUID)
    setSelectedMensalistaData(m ?? null)
  }

  async function handleToggleActive() {
    if (!toggleTarget) return
    setToggling(true)
    try {
      await api.patch(`/users/${toggleTarget.UUID}`, { active: !toggleTarget.active })
      addToast(
        toggleTarget.active ? `${toggleTarget.Name} desativado` : `${toggleTarget.Name} ativado`,
        'success'
      )
      setToggleTarget(null)
      reload()
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao atualizar cliente', 'error')
    } finally {
      setToggling(false)
    }
  }

  function validate() {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Nome é obrigatório'
    if (!/^\(\d{2}\) \d \d{4}-\d{4}$/.test(form.phone)) errs.phone = 'Telefone inválido. Ex: (11) 9 9999-9999'
    return errs
  }

  async function handleSave() {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return }
    setSaving(true)
    try {
      const body = { name: form.name.trim(), phone: form.phone }
      if (form.birthday) body.birthday = form.birthday
      await api.post('/auth/register-admin', body)
      addToast(`${form.name} cadastrado com sucesso`, 'success')
      setDrawerOpen(false)
      setForm(EMPTY_FORM)
      setFormErrors({})
      reload()
    } catch (err) {
      const msg = err.response?.data?.error
      if (msg?.includes('Telefone')) {
        setFormErrors({ phone: 'Telefone já cadastrado' })
      } else {
        addToast(msg || 'Erro ao cadastrar cliente', 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  function handlePhoneChange(e) {
    setForm((f) => ({ ...f, phone: applyPhoneMask(e.target.value) }))
  }

  const sidebar = (
    <Sidebar navItems={navItems} footerUser={user?.name} footerRole="Admin">Admin</Sidebar>
  )

  return (
    <AppLayout sidebar={sidebar}>
      <div className="flex justify-between items-end mb-5 md:mb-6">
        <div>
          <h3 className="font-display font-medium text-[22px] md:text-[26px] tracking-tight">Clientes</h3>
          <p className="text-[12px] md:text-[13px] text-ink-3 mt-1">Gerencie clientes, profissionais e administradores</p>
          <button onClick={restartTour} className="inline-flex items-center gap-1 text-[11px] text-ink-4 hover:text-brand transition-colors mt-1.5" title="Repetir tour guiado">
            <Icon name="helpCircle" size={12} />
            Ver tour
          </button>
        </div>
        <Button data-tour="usuarios-novo" variant="primary" size="sm" onClick={() => { setForm(EMPTY_FORM); setFormErrors({}); setDrawerOpen(true) }}>
          <Icon name="plus" size={14} />
          Novo cliente
        </Button>
      </div>

      {/* Filtro de role */}
      <div data-tour="usuarios-filtro" className="flex gap-1.5 mb-3 flex-wrap">
        {ROLE_FILTERS.map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={`inline-flex items-center px-2.5 py-[4px] rounded-full text-xs font-medium border cursor-pointer transition-colors
              ${roleFilter === r ? 'bg-ink text-bg border-ink' : 'bg-surface-2 text-ink-2 border-line hover:border-ink-3'}`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Busca — sempre visível */}
      <div className="relative mb-3">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4 pointer-events-none">
          <Icon name="search" size={14} />
        </span>
        <input
          type="text"
          placeholder="Buscar por nome ou telefone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-[38px] pl-8 pr-3 rounded-md border border-line bg-surface text-ink-2 font-body text-[13px]
                     placeholder:text-ink-4 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/12 transition-colors"
        />
      </div>

      {/* Filtros extras */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        {CLIENT_EXTRA_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setExtraFilter((prev) => (prev === f.key ? null : f.key))}
            className={`inline-flex items-center px-2.5 py-[4px] rounded-full text-xs font-medium border cursor-pointer transition-colors
              ${extraFilter === f.key ? 'bg-brand text-bg border-brand' : 'bg-surface-2 text-ink-2 border-line hover:border-ink-3'}`}
          >
            {f.label}
            {f.key === 'mensalista' && mensalistaClients.length > 0 && (
              <span className={`ml-1.5 text-[10px] font-mono ${extraFilter === f.key ? 'text-bg/70' : 'text-ink-4'}`}>
                {mensalistaClients.length}
              </span>
            )}
            {f.key === 'comanda_aberta' && openTabClientIds.size > 0 && (
              <span className={`ml-1.5 text-[10px] font-mono ${extraFilter === f.key ? 'text-bg/70' : 'text-ink-4'}`}>
                {openTabClientIds.size}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <>
          {/* Desktop skeleton */}
          <div className="hidden md:block bg-surface border border-line rounded-lg overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Cliente', 'Role', 'Telefone', 'Nascimento', 'Status', ''].map((h) => (
                    <th key={h} className="px-3.5 py-3 text-left font-mono text-[10.5px] uppercase tracking-widest text-ink-3 border-b border-line-2">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
              </tbody>
            </table>
          </div>
          {/* Mobile skeleton */}
          <div className="flex flex-col gap-2 md:hidden">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </>
      ) : filtered.length === 0 ? (
        <EmptyState icon="users" title="Nenhum resultado" description="Nenhum usuário encontrado com os filtros selecionados." />
      ) : (
        <>
          {/* Desktop table */}
          <div data-tour="usuarios-lista" className="hidden md:block bg-surface border border-line rounded-lg overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Cliente', 'Role', 'Telefone', 'Nascimento', 'Status', ''].map((h) => (
                    <th key={h} className="px-3.5 py-3 text-left font-mono text-[10.5px] uppercase tracking-widest text-ink-3 border-b border-line-2">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, idx) => (
                  <tr
                    key={u.UUID}
                    onClick={() => openClient(u)}
                    className="hover:bg-surface-2 transition-colors cursor-pointer"
                  >
                    <td className="px-3.5 py-3 border-b border-line-2">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.Name} index={idx} size="sm" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[13px] font-medium">{u.Name}</span>
                            {isBirthdayThisMonth(u.Birthday) && (
                              <span className="text-[12px]" title="Aniversariante do mês">🎂</span>
                            )}
                          </div>
                          <div className="font-mono text-[11px] text-ink-3">{u.Phone ?? '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3.5 py-3 border-b border-line-2">
                      <Chip variant={ROLE_CHIP[u.Role] ?? 'default'}>{ROLE_LABEL[u.Role] ?? u.Role}</Chip>
                    </td>
                    <td className="px-3.5 py-3 font-mono text-[12px] text-ink-2 border-b border-line-2">{u.Phone ?? '—'}</td>
                    <td className="px-3.5 py-3 font-mono text-[12px] text-ink-2 border-b border-line-2">{formatBirthday(u.Birthday)}</td>
                    <td className="px-3.5 py-3 border-b border-line-2">
                      <Chip variant={u.active ? 'success' : 'danger'}>{u.active ? 'Ativo' : 'Inativo'}</Chip>
                    </td>
                    <td className="px-3.5 py-3 text-right border-b border-line-2">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setToggleTarget(u) }}>
                        <Icon name={u.active ? 'lock' : 'check'} size={13} />
                        {u.active ? 'Desativar' : 'Ativar'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-2 md:hidden">
            {filtered.map((u, idx) => (
              <div
                key={u.UUID}
                onClick={() => openClient(u)}
                className="bg-surface border border-line rounded-xl p-4 cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={u.Name} index={idx} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-[14px] truncate">{u.Name}</span>
                      {isBirthdayThisMonth(u.Birthday) && (
                        <span className="text-[12px] shrink-0" title="Aniversariante do mês">🎂</span>
                      )}
                    </div>
                    <div className="font-mono text-[11px] text-ink-3 truncate">{u.Phone ?? '—'}</div>
                  </div>
                  <Chip variant={u.active ? 'success' : 'danger'}>{u.active ? 'Ativo' : 'Inativo'}</Chip>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Chip variant={ROLE_CHIP[u.Role] ?? 'default'}>{ROLE_LABEL[u.Role] ?? u.Role}</Chip>
                    {u.Phone && <span className="font-mono text-[11px] text-ink-3">{u.Phone}</span>}
                  </div>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setToggleTarget(u) }}>
                    <Icon name={u.active ? 'lock' : 'check'} size={13} />
                    {u.active ? 'Desativar' : 'Ativar'}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {hasMore && <LoadMoreButton onClick={loadMore} loading={loadingMore} />}
        </>
      )}

      {/* Painel de detalhes do cliente */}
      {selectedClient && (
        <ClientePanel
          client={selectedClient}
          onClose={() => { setSelectedClient(null); setSelectedMensalistaData(null) }}
          onReload={() => { reload(); loadMensalistas() }}
          mensalistaData={selectedMensalistaData}
        />
      )}

      {/* Modal ativar/desativar */}
      <Modal
        isOpen={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleToggleActive}
        title={toggleTarget?.active ? 'Desativar cliente' : 'Ativar cliente'}
        message={
          toggleTarget?.active
            ? `${toggleTarget?.Name} não conseguirá mais fazer login após ser desativado.`
            : `${toggleTarget?.Name} voltará a ter acesso ao sistema.`
        }
        confirmLabel={toggleTarget?.active ? 'Desativar' : 'Ativar'}
        loading={toggling}
      />

      {/* Drawer — cadastro manual */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-ink/20" onClick={() => setDrawerOpen(false)} />
          <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-surface shadow-xl
                          md:inset-y-0 md:right-0 md:left-auto md:w-[400px] md:rounded-none md:border-l md:border-line">

            {/* alça mobile */}
            <div className="flex justify-center pt-3 pb-1 md:hidden">
              <div className="w-10 h-1 rounded-full bg-line-2" />
            </div>

            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <span className="font-display font-medium text-[15px]">Novo cliente</span>
              <button onClick={() => setDrawerOpen(false)} className="p-1.5 rounded-md text-ink-3 hover:bg-surface-2 transition-colors">
                <Icon name="x" size={16} />
              </button>
            </div>

            <div className="p-5 md:p-7 flex flex-col gap-4">
              <Input
                label="Nome completo"
                placeholder="Maria da Silva"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                error={formErrors.name}
              />
              <Input
                label="Telefone"
                placeholder="(11) 9 9999-9999"
                value={form.phone}
                onChange={handlePhoneChange}
                error={formErrors.phone}
              />
              <Input
                label="Data de nascimento (opcional)"
                type="date"
                value={form.birthday}
                onChange={(e) => setForm((f) => ({ ...f, birthday: e.target.value }))}
              />

              <div className="bg-surface-2 border border-line rounded-lg px-4 py-3">
                <p className="text-[12px] text-ink-3 font-body">
                  A senha inicial será <span className="font-mono font-medium text-ink-2">12345678</span>. O usuário poderá alterá-la após o primeiro acesso.
                </p>
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="md" onClick={() => setDrawerOpen(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button variant="primary" size="md" onClick={handleSave} loading={saving} className="flex-1">
                  Cadastrar
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  )
}
