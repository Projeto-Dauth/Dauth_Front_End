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
import Input from '@/components/ui/Input'
import SearchableSelect from '@/components/ui/SearchableSelect'
import { PageSpinner } from '@/components/ui/Spinner'
import { useToast } from '@/context/ToastContext'
import useAuthStore from '@/store/authStore'
import api from '@/lib/api'

import { navItemsByRole } from '@/config/navItems'

function addMinutes(timeStr, mins) {
  const [h, m] = timeStr.split(':').map(Number)
  const total = h * 60 + m + mins
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

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
  const [fecharConta, setFecharConta] = useState(null)
  const [fecharMethod, setFecharMethod] = useState('pix')
  const [fecharPaying, setFecharPaying] = useState(false)

  const [editing, setEditing] = useState(false)
  const [services, setServices] = useState([])
  const [loadingServices, setLoadingServices] = useState(false)
  const [editDate, setEditDate] = useState('')
  const [editItens, setEditItens] = useState([])
  const [editIsUrgent, setEditIsUrgent] = useState(false)
  const [editNotes, setEditNotes] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

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
    setFecharMethod('pix')
    try {
      const { data } = await api.get(`/tab/client/${item.Client_id}/account-summary`)
      if (!data.eligible) {
        addToast('Nenhuma comanda em aberto para este cliente', 'warning')
        return
      }
      setFecharConta(data)
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao buscar comandas', 'error')
    }
  }

  async function handleConfirmFechar(tabIds, orderPayments) {
    setFecharPaying(true)
    try {
      await api.post('/tab/batch-pay', {
        tab_ids: tabIds,
        Method: fecharMethod,
        Payment_date: new Date().toISOString(),
        order_payments: orderPayments,
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

  function openEdit() {
    setEditDate(item.Date)
    setEditIsUrgent(false)
    setEditNotes(item.Notes ?? '')
    setEditItens([{
      id: item.UUID,
      serviceId: item.Service_id ?? '',
      startTime: item.Start_time?.slice(0, 5) ?? '',
      endTime: item.End_time?.slice(0, 5) ?? '',
    }])
    setEditing(true)
    if (services.length === 0 && item.Professional_id) {
      setLoadingServices(true)
      api.get('/service', { params: { professional: item.Professional_id, limit: 100 } })
        .then(({ data }) => setServices(data.data ?? []))
        .catch(() => setServices([]))
        .finally(() => setLoadingServices(false))
    }
  }

  function handleEditService(index, serviceId) {
    setEditItens(prev => {
      const next = [...prev]
      const it = { ...next[index], serviceId }
      const svc = services.find(s => s.UUID === serviceId)
      if (svc?.Duration) {
        const [h, m] = svc.Duration.split(':').map(Number)
        it.endTime = addMinutes(it.startTime, h * 60 + m)
      }
      next[index] = it
      if (next[index + 1]) next[index + 1] = { ...next[index + 1], startTime: it.endTime }
      return next
    })
  }

  function handleEditStartTime(index, startTime) {
    setEditItens(prev => {
      const next = [...prev]
      next[index] = { ...next[index], startTime }
      return next
    })
  }

  function handleEditEndTime(index, endTime) {
    setEditItens(prev => {
      const next = [...prev]
      next[index] = { ...next[index], endTime }
      if (next[index + 1]) next[index + 1] = { ...next[index + 1], startTime: endTime }
      return next
    })
  }

  function addEditItem() {
    setEditItens(prev => {
      const last = prev[prev.length - 1]
      return [...prev, { id: null, serviceId: '', startTime: last.endTime, endTime: addMinutes(last.endTime, 60) }]
    })
  }

  function removeEditItem(index) {
    setEditItens(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSaveEdit() {
    if (editItens.some(it => !it.serviceId)) return addToast('Selecione o serviço em todos os itens', 'warning')
    setSavingEdit(true)
    try {
      for (const it of editItens) {
        if (it.id) {
          await api.patch(`/appointment/${it.id}`, {
            Service: it.serviceId,
            Date: editDate,
            Start_time: it.startTime,
            End_time: it.endTime,
            Notes: editNotes.trim() || null,
            ...(canEdit ? { Is_urgent: editIsUrgent } : {}),
          })
        } else {
          await api.post('/appointment', {
            Client: item.Client_id,
            Professional: item.Professional_id,
            Service: it.serviceId,
            Date: editDate,
            Start_time: it.startTime,
            End_time: it.endTime,
            Notes: editNotes.trim() || undefined,
            ...(canEdit ? { Is_urgent: editIsUrgent } : {}),
          })
        }
      }
      const { data } = await api.get(`/appointment/${id}`)
      setItem(data.data ?? data)
      addToast('Agendamento atualizado com sucesso')
      setEditing(false)
    } catch (err) {
      if (err.response?.status === 409) {
        addToast(
          canEdit
            ? 'Já existe um agendamento nesse horário. Marque "Agendamento urgente" para sobrepor.'
            : 'Já existe um agendamento nesse horário para este profissional.',
          'error'
        )
      } else {
        addToast(err.response?.data?.error ?? 'Erro ao atualizar agendamento', 'error')
      }
    } finally {
      setSavingEdit(false)
    }
  }

  const role = user?.role ?? 'Usuario'
  const navItems = navItemsByRole[role] ?? []
  const allowedTransitions = STATUS_TRANSITIONS[role]?.[item?.Status] ?? []
  const canEdit = role === 'Admin' || role === 'Profissional'
  const canReschedule = ['pendente', 'confirmado'].includes(item?.Status)

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
          <div className="px-6 py-4 border-b border-line-2 flex items-center justify-between">
            <h4 className="font-medium text-[14px]">Informações</h4>
          </div>
          {editing ? (
            <div className="px-6 py-5 flex flex-col gap-4">
              <Input
                label="Data"
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
              />

              {editItens.map((it, i) => (
                <div key={i} className="flex flex-col gap-3 pb-4 border-b border-line-2 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] text-ink-3 font-medium">
                      {editItens.length > 1 ? `Serviço ${i + 1}` : 'Serviço'}
                    </label>
                    {editItens.length > 1 && !it.id && (
                      <button type="button" onClick={() => removeEditItem(i)} className="text-ink-3 hover:text-danger transition-colors cursor-pointer">
                        <Icon name="x" size={14} />
                      </button>
                    )}
                  </div>
                  <SearchableSelect
                    options={services.map(s => ({ value: s.UUID, label: s.Name }))}
                    value={it.serviceId}
                    onChange={(sid) => handleEditService(i, sid)}
                    disabled={loadingServices || services.length === 0}
                    placeholder={loadingServices ? 'Carregando…' : 'Selecione o serviço'}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Início"
                      type="time"
                      value={it.startTime}
                      onChange={(e) => handleEditStartTime(i, e.target.value)}
                    />
                    <Input
                      label="Fim"
                      type="time"
                      value={it.endTime}
                      onChange={(e) => handleEditEndTime(i, e.target.value)}
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addEditItem}
                className="flex items-center justify-center gap-1.5 w-full h-[38px] rounded-md border border-dashed border-line text-[13px] font-medium text-ink-3 hover:text-brand hover:border-brand/30 transition-colors cursor-pointer"
              >
                <Icon name="plus" size={14} />
                Adicionar serviço
              </button>

              {canEdit && (
                <button
                  type="button"
                  onClick={() => setEditIsUrgent(v => !v)}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-[10px] border transition-colors cursor-pointer text-left
                    ${editIsUrgent ? 'bg-warning-soft border-warning/40' : 'bg-surface border-line hover:border-ink-3'}`}
                >
                  <div className={`w-4 h-4 rounded flex items-center justify-center border flex-shrink-0 transition-colors
                    ${editIsUrgent ? 'bg-warning border-warning' : 'border-line-2'}`}>
                    {editIsUrgent && <Icon name="check" size={10} className="text-white" />}
                  </div>
                  <div>
                    <div className={`text-[13px] font-medium ${editIsUrgent ? 'text-warning' : 'text-ink-2'}`}>Agendamento urgente</div>
                    <div className="text-[11px] text-ink-3">Permite sobrepor horários já ocupados</div>
                  </div>
                </button>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-ink-2">Observação <span className="text-ink-4 font-normal">(opcional)</span></label>
                <textarea
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  placeholder="Ex: cliente prefere água morna, trouxe produto próprio…"
                  rows={2}
                  maxLength={1000}
                  className="w-full px-[14px] py-[10px] rounded-md border border-line bg-surface text-ink-2 font-body text-md placeholder:text-ink-4 focus:outline-none focus:border-brand transition-colors resize-none"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="md" onClick={() => setEditing(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button variant="primary" size="md" onClick={handleSaveEdit} loading={savingEdit} className="flex-1">
                  Salvar
                </Button>
              </div>
            </div>
          ) : (
            <div className="px-6">
              <InfoRow label="Data" value={formatDate(item.Date)} />
              <InfoRow label="Horário" value={item.Start_time ? `${item.Start_time.slice(0,5)} → ${item.End_time?.slice(0,5)}` : null} />
              <InfoRow
                label={item.Services?.length > 1 ? 'Serviços' : 'Serviço'}
                value={
                  (item.Services?.length > 0 || item.Tab?.Products?.length > 0) ? (
                    <div className="space-y-1">
                      {(item.Services?.length > 0 ? item.Services : [{ UUID: 'fallback', Name: item.Service }]).map(s => (
                        <div key={s.UUID}>{s.Name}</div>
                      ))}
                      {item.Tab?.Products?.map(p => (
                        <div key={p.UUID} className="text-ink-3">
                          + {p.Name}{p.Quantity > 1 ? ` ×${p.Quantity}` : ''}
                          <span className="text-[11px] text-ink-4"> (produto)</span>
                        </div>
                      ))}
                    </div>
                  ) : item.Service
                }
              />
              {item.Notes && <InfoRow label="Observação" value={item.Notes} />}
            </div>
          )}
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
      {(canEdit || canReschedule) && (
        <div className="flex gap-2.5 mt-5">
          {canEdit && allowedTransitions.map(s => (
            <Button
              key={s}
              variant={s === 'cancelado' ? 'ghost' : 'primary'}
              size="sm"
              onClick={() => setModal({ open: true, status: s })}
            >
              Marcar como {STATUS_LABELS[s]}
            </Button>
          ))}
          {canEdit && item.Status === 'concluido' && (
            <Button variant="ghost" size="sm" onClick={handleFecharConta}>
              <Icon name="receipt" size={13} />Fechar comanda
            </Button>
          )}
          {canReschedule && !editing && (
            <Button variant="ghost" size="sm" onClick={openEdit}>
              <Icon name="edit" size={13} />Editar
            </Button>
          )}
          {canEdit && item.Status !== 'concluido' && item.Status !== 'cancelado' && (
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
