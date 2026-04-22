import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Sidebar from '@/components/layout/Sidebar'
import Icon from '@/components/ui/Icons'
import Modal from '@/components/ui/Modal'
import { PageSpinner } from '@/components/ui/Spinner'
import { useToast } from '@/context/ToastContext'
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

function formatDuration(d) {
  if (!d) return ''
  const [h, m] = d.split(':').map(Number)
  if (h > 0 && m > 0) return `${h}h${m}min`
  if (h > 0) return `${h}h`
  return `${m}min`
}

export default function ProfissionalServicos() {
  const { user } = useAuthStore()
  const { addToast } = useToast()

  // services com campo extra: linked (bool) e linkId (UUID do vínculo)
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(null) // UUID do serviço em operação
  const [permissionError, setPermissionError] = useState(null)

  // Modal de desvinculação
  const [unlinkTarget, setUnlinkTarget] = useState(null)
  const [unlinking, setUnlinking] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    load()
  }, [user?.id])

  async function load() {
    setLoading(true)
    try {
      const { data: svcRes } = await api.get('/service', { params: { limit: 100 } })
      const allServices = svcRes.data ?? []

      // Busca profissionais de cada serviço em paralelo
      const profsPerService = await Promise.all(
        allServices.map((s) =>
          api.get(`/service/${s.UUID}/professionals`)
            .then(({ data }) => data.data ?? [])
            .catch(() => [])
        )
      )

      const enriched = allServices.map((s, i) => {
        const link = profsPerService[i].find((p) => p.professional_id === user.id)
        return {
          ...s,
          linked: !!link,
          linkId: link?.id ?? null,
        }
      })

      setServices(enriched)
    } catch {
      addToast('Erro ao carregar serviços', 'error')
    } finally {
      setLoading(false)
    }
  }

  function isPermissionError(err) {
    return err.response?.status === 403 || err.response?.status === 401
  }

  async function handleLink(service) {
    setActing(service.UUID)
    setPermissionError(null)
    try {
      await api.post(`/service/${service.UUID}/professionals`, {
        professional_id: user.id,
      })
      addToast(`Vinculado a ${service.Name}`)
      load()
    } catch (err) {
      if (isPermissionError(err)) {
        setPermissionError('vincular')
      } else {
        addToast(err.response?.data?.error ?? 'Erro ao vincular serviço', 'error')
      }
    } finally {
      setActing(null)
    }
  }

  async function handleUnlink() {
    if (!unlinkTarget) return
    setUnlinking(true)
    setPermissionError(null)
    try {
      await api.delete(`/service/${unlinkTarget.UUID}/professionals/${unlinkTarget.linkId}`)
      addToast(`Desvinculado de ${unlinkTarget.Name}`)
      setUnlinkTarget(null)
      load()
    } catch (err) {
      setUnlinkTarget(null)
      if (isPermissionError(err)) {
        setPermissionError('desvincular')
      } else {
        addToast(err.response?.data?.error ?? 'Erro ao desvincular serviço', 'error')
      }
    } finally {
      setUnlinking(false)
    }
  }

  const linked   = services.filter((s) => s.linked)
  const available = services.filter((s) => !s.linked)

  const sidebar = (
    <Sidebar navItems={navItems} footerUser={user?.name} footerRole="Profissional" />
  )

  if (loading) return <AppLayout sidebar={sidebar}><PageSpinner /></AppLayout>

  return (
    <AppLayout sidebar={sidebar}>
      <div className="flex justify-between items-end mb-7">
        <div>
          <h3 className="font-display font-medium text-[26px] tracking-tight">Meus serviços</h3>
          <p className="text-[13px] text-ink-3 mt-1">
            {linked.length} serviço{linked.length !== 1 ? 's' : ''} vinculado{linked.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Banner de permissão negada */}
      {permissionError && (
        <div className="flex items-start gap-3 mb-6 px-4 py-3.5 bg-warning-soft border border-warning/30 rounded-xl">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-warning shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <p className="text-[13px] font-medium text-warning">Você não tem permissão para {permissionError} serviços.</p>
            <p className="text-[12px] text-warning/80 mt-0.5">Entre em contato com o administrador do salão para realizar essa ação.</p>
          </div>
          <button onClick={() => setPermissionError(null)} className="ml-auto text-warning/60 hover:text-warning transition-colors shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      )}

      {/* Serviços vinculados */}
      <section className="mb-8">
        <h4 className="font-display font-medium text-[15px] mb-3">Vinculados</h4>
        {linked.length === 0 ? (
          <div className="text-[13px] text-ink-3 py-6 text-center bg-surface border border-line border-dashed rounded-xl">
            Você ainda não está vinculado a nenhum serviço. Adicione abaixo.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {linked.map((s) => (
              <ServiceRow
                key={s.UUID}
                service={s}
                isLinked
                acting={acting === s.UUID}
                onAction={() => setUnlinkTarget(s)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Serviços disponíveis para vincular */}
      {available.length > 0 && (
        <section>
          <h4 className="font-display font-medium text-[15px] mb-3 text-ink-3">Disponíveis para vincular</h4>
          <div className="flex flex-col gap-2.5">
            {available.map((s) => (
              <ServiceRow
                key={s.UUID}
                service={s}
                isLinked={false}
                acting={acting === s.UUID}
                onAction={() => handleLink(s)}
              />
            ))}
          </div>
        </section>
      )}

      <Modal
        isOpen={!!unlinkTarget}
        onClose={() => setUnlinkTarget(null)}
        onConfirm={handleUnlink}
        title="Desvincular serviço"
        message={`Remover "${unlinkTarget?.Name}" dos seus serviços? Agendamentos existentes não serão afetados.`}
        confirmLabel="Desvincular"
        loading={unlinking}
      />
    </AppLayout>
  )
}

function ServiceRow({ service, isLinked, acting, onAction }) {
  return (
    <div className="flex items-center gap-4 px-5 py-4 bg-surface border border-line rounded-xl">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5">
          <span className="font-medium text-[14px] truncate">{service.Name}</span>
          {service.Category && (
            <span className="font-mono text-[10.5px] text-ink-4 uppercase tracking-widest">{service.Category}</span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1">
          {service.Duration && (
            <span className="font-mono text-[11.5px] text-ink-3">
              <Icon name="clock" size={11} className="inline mr-1" />
              {formatDuration(service.Duration)}
            </span>
          )}
          <span className="font-mono text-[11.5px] text-ink-3">
            {Number(service.Price) > 0
              ? `R$ ${Number(service.Price).toFixed(0)}`
              : 'Consultar'}
          </span>
        </div>
      </div>

      {isLinked ? (
        <button
          onClick={onAction}
          disabled={acting}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-danger/30 text-[12.5px] text-danger hover:bg-danger-soft transition-colors disabled:opacity-50"
        >
          <Icon name="x" size={12} />
          {acting ? 'Aguarde...' : 'Desvincular'}
        </button>
      ) : (
        <button
          onClick={onAction}
          disabled={acting}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-[12.5px] text-ink-2 hover:border-brand hover:text-brand transition-colors disabled:opacity-50"
        >
          <Icon name="plus" size={12} />
          {acting ? 'Vinculando...' : 'Vincular'}
        </button>
      )}
    </div>
  )
}
