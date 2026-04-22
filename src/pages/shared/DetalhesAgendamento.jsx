import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import Sidebar from '@/components/layout/Sidebar'
import Button from '@/components/ui/Button'
import Chip from '@/components/ui/Chip'
import Avatar from '@/components/ui/Avatar'
import Modal from '@/components/ui/Modal'
import Icon from '@/components/ui/Icons'
import { PageSpinner } from '@/components/ui/Spinner'
import { useToast } from '@/context/ToastContext'
import useAuthStore from '@/store/authStore'
import api from '@/lib/api'

const navItemsByRole = {
  Admin: [
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
  ],
  Profissional: [
    { to: '/profissional', end: true, icon: 'cal', label: 'Minha agenda' },
    { to: '/profissional/agendamentos', icon: 'receipt', label: 'Agendamentos' },
    { to: '/profissional/servicos', icon: 'scissors', label: 'Meus serviços' },
    { to: '/profissional/horarios', icon: 'clock', label: 'Meus horários' },
    { type: 'label', label: 'Conta' },
    { to: '/perfil', icon: 'users', label: 'Meu perfil' },
  ],
  Usuario: [
    { to: '/cliente', end: true, icon: 'cal', label: 'Início' },
    { to: '/cliente/agendamentos', icon: 'receipt', label: 'Meus agendamentos' },
    { to: '/cliente/combos', icon: 'package', label: 'Meus combos' },
    { to: '/perfil', icon: 'users', label: 'Perfil e senha' },
  ],
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
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ open: false, status: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get(`/appointment/${id}`)
      .then(({ data }) => {
        // API retorna PascalCase: UUID, Date, Start_time, End_time, Status, Client, Professional, Service (strings)
        setItem(data.data ?? data)
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

      <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 340px' }}>
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
