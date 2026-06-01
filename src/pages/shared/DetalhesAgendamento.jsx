import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import Sidebar from '@/components/layout/Sidebar'
import Button from '@/components/ui/Button'
import Chip from '@/components/ui/Chip'
import Avatar from '@/components/ui/Avatar'
import Modal from '@/components/ui/Modal'
import ModalFecharConta from '@/components/ui/ModalFecharConta'
import Icon from '@/components/ui/Icons'
import { PageSpinner } from '@/components/ui/Spinner'
import { useToast } from '@/context/ToastContext'
import useAuthStore from '@/store/authStore'
import api from '@/lib/api'

import { navItemsByRole } from '@/config/navItems'

const STATUS_LABELS = { pendente: 'Pendente', confirmado: 'Confirmado', concluido: 'Concluído', cancelado: 'Cancelado' }

const STATUS_TRANSITIONS = {
  Admin: { pendente: ['confirmado', 'cancelado'], confirmado: ['concluido', 'cancelado'], concluido: [], cancelado: [] },
  Profissional: { pendente: ['confirmado', 'cancelado'], confirmado: ['concluido', 'cancelado'], concluido: [], cancelado: [] },
  Usuario: {},
}

function formatDate(str) {
  if (!str) return '—'
  const [y, m, d] = str.split('-')
  return `${d}/${m}/${y}`
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start gap-4 py-3.5 border-b border-line-2 last:border-0">
      <div className="w-36 text-[12px] text-ink-3 font-medium shrink-0">{label}</div>
      <div className="text-[13.5px] text-ink-2">{value ?? '—'}</div>
    </div>
  )
}

export default function DetalhesAgendamento() {
  const { id } = useParams()
  const { user } = useAuthStore()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const [item, setItem] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ open: false, status: '' })
  const [saving, setSaving] = useState(false)
  const [fecharConta, setFecharConta] = useState(null) // { name, clientId, tabs }
  const [fecharMethod, setFecharMethod] = useState('Pix')
  const [fecharPaying, setFecharPaying] = useState(false)
  const [fecharOrders, setFecharOrders] = useState([])
  const [fecharOrdersLoading, setFecharOrdersLoading] = useState(false)

  useEffect(() => {
    api.get(`/appointment/${id}`)
      .then(({ data }) => {
        const appt = data.data ?? data
        setItem(appt)
        if ((role === 'Profissional' || role === 'Admin') && appt.Client) {
          api.get('/appointment/my', { params: { client_name: appt.Client, limit: 6 } })
            .then(({ data: all }) => {
              const past = (all.data ?? [])
                .filter(a => a.UUID !== appt.UUID && a.Status !== 'cancelado')
                .sort((a, b) => (b.Date > a.Date ? 1 : -1))
                .slice(0, 5)
              setHistory(past)
            })
            .catch(() => {})
        }
      })
      .catch(() => addToast('Agendamento não encontrado', 'error'))
      .finally(() => setLoading(false))
  }, [id])

  async function changeStatus() {
    setSaving(true)
    try {
      await api.patch(`/appointment/${id}`, { Status: modal.status })
      setItem(prev => ({ ...prev, Status: modal.status }))
      addToast(`Status atualizado para "${STATUS_LABELS[modal.status]}"`)
      setModal({ open: false, status: '' })
    } catch (err) {
      addToast(err.response?.data?.error ?? 'Erro ao atualizar', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setSaving(true)
    try {
      await api.delete(`/appointment/${id}`)
      addToast('Agendamento removido')
      navigate(-1)
    } catch (err) {
      addToast(err.response?.data?.error ?? 'Erro ao remover', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleFecharConta() {
    try {
      const { data: tabData } = await api.get('/tab')
      const tabs = (tabData.data ?? tabData).filter(
        t => t.Status === 'Em aberto' && t.Appointment?.Client === item.Client
      )
      if (!tabs.length) {
        addToast('Nenhuma comanda em aberto para este cliente', 'warning')
        return
      }
      const clientId = tabs[0].Appointment?.ClientId
      setFecharConta({ name: item.Client, clientId, tabs })
      setFecharMethod('Pix')
      setFecharOrdersLoading(true)
      setFecharOrders([])
      api.get('/product-order', { params: { client_id: clientId, status: 'encomendado' } })
        .then(({ data }) => setFecharOrders(data.data ?? []))
        .catch(() => setFecharOrders([]))
        .finally(() => setFecharOrdersLoading(false))
    } catch {
      addToast('Erro ao buscar comandas', 'error')
    }
  }

  async function handleConfirmFechar() {
    setFecharPaying(true)
    try {
      await api.post('/tab/batch-pay', {
        tab_ids: fecharConta.tabs.map(t => t.UUID),
        Method: fecharMethod,
        Payment_date: new Date().toISOString(),
        client_id: fecharConta.clientId,
      })
      addToast('Conta fechada com sucesso')
      setFecharConta(null)
      setItem(prev => ({ ...prev, Status: 'concluido' }))
    } catch (err) {
      addToast(err.response?.data?.error ?? 'Erro ao fechar conta', 'error')
    } finally {
      setFecharPaying(false)
    }
  }

  const role = user?.role ?? 'Usuario'
  const navItems = navItemsByRole[role] ?? []
  const allowedTransitions = STATUS_TRANSITIONS[role]?.[item?.Status] ?? []
  const canEdit = role === 'Admin' || role === 'Profissional'

  const sidebar = (
    <Sidebar navItems={navItems} footerUser={user?.name} footerRole={role}>{role}</Sidebar>
  )

  if (loading) {
    return <AppLayout sidebar={sidebar}><PageSpinner /></AppLayout>
  }

  if (!item) {
    return (
      <AppLayout sidebar={sidebar}>
        <div className="text-center py-20 text-ink-3">Agendamento não encontrado.</div>
      </AppLayout>
    )
  }

  return (
    <AppLayout sidebar={sidebar}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-7">
        <button onClick={() => navigate(-1)} className="text-ink-3 hover:text-ink transition-colors cursor-pointer">
          <Icon name="arrowLeft" size={18} />
        </button>
        <div className="flex-1">
          <h3 className="font-display font-medium text-[24px] tracking-tight">Detalhes do agendamento</h3>
          <p className="text-[12.5px] text-ink-3 mt-0.5">#{id.slice(0, 8)}</p>
        </div>
        <Chip status={item.Status} dot>{STATUS_LABELS[item.Status] ?? item.Status}</Chip>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
        {/* Main info */}
        <div className="bg-surface border border-line rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-line-2">
            <h4 className="font-medium text-[14px]">Informações</h4>
          </div>
          <div className="px-6">
            <InfoRow label="Data" value={formatDate(item.Date)} />
            <InfoRow label="Horário" value={item.Start_time ? `${item.Start_time.slice(0,5)} → ${item.End_time?.slice(0,5)}` : null} />
            <InfoRow label="Serviço" value={item.Service} />
          </div>
        </div>

        {/* People */}
        <div className="flex flex-col gap-4">
          {/* Client */}
          <div className="bg-surface border border-line rounded-xl p-5">
            <div className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3 mb-3">Cliente</div>
            <div className="flex items-center gap-3">
              <Avatar name={item.Client ?? '?'} index={0} size="md" />
              <div>
                <div className="font-medium text-[13.5px]">{item.Client ?? '—'}</div>
              </div>
            </div>
          </div>

          {/* Professional */}
          <div className="bg-surface border border-line rounded-xl p-5">
            <div className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3 mb-3">Profissional</div>
            <div className="flex items-center gap-3">
              <Avatar name={item.Professional ?? '?'} index={1} size="md" />
              <div>
                <div className="font-medium text-[13.5px]">{item.Professional ?? '—'}</div>
              </div>
            </div>
          </div>

          {/* Histórico do cliente */}
          {(role === 'Profissional' || role === 'Admin') && history.length > 0 && (
            <div className="bg-surface border border-line rounded-xl p-5">
              <div className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3 mb-3">
                Últimas visitas · {item.Client}
              </div>
              <div className="flex flex-col gap-0">
                {history.map((h, i) => (
                  <button
                    key={h.UUID}
                    onClick={() => navigate(`/agendamento/${h.UUID}`)}
                    className={`flex items-center justify-between py-2.5 text-left hover:bg-surface-2 -mx-2 px-2 rounded transition-colors cursor-pointer
                      ${i < history.length - 1 ? 'border-b border-line-2' : ''}`}
                  >
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium truncate">{h.Service}</div>
                      <div className="font-mono text-[11px] text-ink-3 mt-0.5">{formatDate(h.Date)}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <Chip status={h.Status} dot>{STATUS_LABELS[h.Status]}</Chip>
                      <Icon name="chevronRight" size={12} className="text-ink-4" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {canEdit && (
        <div className="flex gap-2.5 mt-5">
          {allowedTransitions.map(s => (
            <Button
              key={s}
              variant={s === 'cancelado' ? 'ghost' : 'primary'}
              size="sm"
              onClick={() => setModal({ open: true, status: s })}
            >
              Marcar como {STATUS_LABELS[s]}
            </Button>
          ))}
          {item.Status === 'concluido' && (
            <Button variant="ghost" size="sm" onClick={handleFecharConta}>
              <Icon name="receipt" size={13} />Fechar comanda
            </Button>
          )}
          {item.Status !== 'concluido' && item.Status !== 'cancelado' && (
            <Button variant="ghost" size="sm" onClick={() => setModal({ open: true, status: '__delete__' })}>
              <Icon name="trash" size={13} />Excluir
            </Button>
          )}
        </div>
      )}

      {/* Confirm modal */}
      <Modal
        isOpen={modal.open && modal.status !== '__delete__'}
        onClose={() => setModal({ open: false, status: '' })}
        onConfirm={changeStatus}
        title={`Marcar como ${STATUS_LABELS[modal.status] ?? ''}`}
        message={modal.status === 'concluido'
          ? 'Ao concluir, uma comanda será criada automaticamente com o valor do serviço.'
          : modal.status === 'cancelado'
          ? 'Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.'
          : `Confirmar mudança de status para "${STATUS_LABELS[modal.status]}"?`}
        confirmLabel="Confirmar"
        confirmVariant={modal.status === 'cancelado' ? 'ghost' : 'primary'}
        loading={saving}
      />

      {fecharConta && (
        <ModalFecharConta
          client={fecharConta}
          orders={fecharOrders}
          ordersLoading={fecharOrdersLoading}
          method={fecharMethod}
          onMethodChange={setFecharMethod}
          paying={fecharPaying}
          onClose={() => setFecharConta(null)}
          onConfirm={handleConfirmFechar}
        />
      )}

      <Modal
        isOpen={modal.open && modal.status === '__delete__'}
        onClose={() => setModal({ open: false, status: '' })}
        onConfirm={handleDelete}
        title="Excluir agendamento"
        message="Esta ação é irreversível. O agendamento será removido permanentemente."
        confirmLabel="Excluir"
        loading={saving}
      />
    </AppLayout>
  )
}
