import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import Sidebar from '@/components/layout/Sidebar'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Icon from '@/components/ui/Icons'
import { PageSpinner } from '@/components/ui/Spinner'
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

// Slots de 30 em 30 min das 08:00 às 18:00
const TIME_SLOTS = []
for (let h = 8; h < 18; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`)
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:30`)
}

const WEEK_DAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
const MONTHS = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']

const STATUS_STYLE = {
  pendente:   { card: 'bg-warning-soft border-warning/30 text-warning',   dot: 'bg-warning' },
  confirmado: { card: 'bg-success-soft border-success/30 text-success',   dot: 'bg-success' },
  concluido:  { card: 'bg-surface-2 border-line text-ink-3',              dot: 'bg-ink-3' },
  cancelado:  { card: 'bg-danger-soft border-danger/30 text-danger',      dot: 'bg-danger' },
}

function parseTime(t) {
  // "09:00:00+00" | "09:00:00-03" → "09:00"
  return t.slice(0, 5)
}

function toMinutes(t) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function coversSlot(appt, slot) {
  const start = toMinutes(parseTime(appt.Start_time))
  const end   = toMinutes(parseTime(appt.End_time))
  const s     = toMinutes(slot)
  return s >= start && s < end
}

function isStart(appt, slot) {
  return parseTime(appt.Start_time) === slot
}

function toDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatHeader(date) {
  const dow  = WEEK_DAYS[date.getDay()]
  const d    = date.getDate()
  const mon  = MONTHS[date.getMonth()]
  const year = date.getFullYear()
  return `${dow.charAt(0).toUpperCase() + dow.slice(1)}, ${d} de ${mon} de ${year}`
}

export default function AdminAgenda() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [date, setDate] = useState(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  })
  const [appointments, setAppointments] = useState([])
  const [professionals, setProfessionals] = useState([])
  const [loading, setLoading] = useState(true)

  // Carrega profissionais uma vez ao montar
  useEffect(() => {
    api.get('/users', { params: { Role: 'Profissional' } })
      .then(({ data }) => setProfessionals(data.data ?? []))
      .catch(() => setProfessionals([]))
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/appointment', { params: { date: toDateStr(date) } })
      setAppointments(data.data ?? [])
    } catch {
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => { load() }, [load])

  function prevDay() {
    setDate((d) => { const n = new Date(d); n.setDate(n.getDate() - 1); return n })
  }
  function nextDay() {
    setDate((d) => { const n = new Date(d); n.setDate(n.getDate() + 1); return n })
  }

  // Nomes dos profissionais ativos — coluna sempre visível mesmo sem agendamentos
  const profNames = professionals.map((p) => p.Name)

  const sidebar = (
    <Sidebar navItems={navItems} footerUser={user?.name} footerRole="Admin">Admin</Sidebar>
  )

  return (
    <AppLayout sidebar={sidebar}>
      <div className="flex justify-between items-end mb-6">
        <div>
          <h3 className="font-display font-medium text-[26px] tracking-tight">Agenda</h3>
          <p className="text-[13px] text-ink-3 mt-1">
            {appointments.length} atendimento{appointments.length !== 1 ? 's' : ''} · {formatHeader(date)}
          </p>
        </div>
        <Button size="sm" onClick={() => navigate('/admin/agendamentos')}>
          <Icon name="receipt" size={14} />Ver todos
        </Button>
      </div>

      {/* Navegação de dia */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={prevDay}
          className="w-[34px] h-[34px] rounded-lg border border-line bg-surface text-ink-2 flex items-center justify-center hover:border-ink-3 transition-colors">
          <Icon name="arrowLeft" size={14} />
        </button>
        <div className="font-display font-medium text-[17px]">{formatHeader(date)}</div>
        <button onClick={nextDay}
          className="w-[34px] h-[34px] rounded-lg border border-line bg-surface text-ink-2 flex items-center justify-center hover:border-ink-3 transition-colors">
          <Icon name="arrowRight" size={14} />
        </button>
        <button
          onClick={() => { const d = new Date(); d.setHours(0,0,0,0); setDate(d) }}
          className="ml-1 px-3 py-1.5 rounded-lg border border-line bg-surface text-[12.5px] text-ink-2 hover:border-ink-3 transition-colors cursor-pointer"
        >
          Hoje
        </button>
      </div>

      {loading ? <PageSpinner /> : profNames.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-surface border border-line border-dashed rounded-[14px] gap-2">
          <Icon name="cal" size={28} />
          <div className="font-display font-medium text-[16px]">Nenhum profissional cadastrado</div>
          <div className="text-[13px] text-ink-3">Convide profissionais para ver a agenda</div>
        </div>
      ) : (
        <>
          {/* Grade */}
          <div
            className="bg-surface border border-line rounded-lg overflow-hidden"
            style={{ display: 'grid', gridTemplateColumns: `64px repeat(${profNames.length}, 1fr)` }}
          >
            {/* Header */}
            <div className="px-3 py-3 border-b border-r border-line bg-surface-2" />
            {profNames.map((name, idx) => (
              <div key={name} className="px-4 py-3 border-b border-r last:border-r-0 border-line bg-surface-2 flex items-center gap-2.5">
                <Avatar name={name} index={idx} size="sm" />
                <div className="font-medium text-[13px] truncate">{name}</div>
              </div>
            ))}

            {/* Slots */}
            {TIME_SLOTS.map((slot, si) => {
              const isHour = slot.endsWith(':00')
              return [
                // Célula de hora
                <div key={`t-${slot}`}
                  className={`px-2.5 py-1.5 text-right font-mono text-[10.5px] text-ink-3 border-r border-line
                    ${isHour ? 'border-b border-b-line' : 'border-b border-b-line-2 border-dashed'}`}>
                  {isHour ? slot : ''}
                </div>,
                // Células por profissional
                ...profNames.map((prof, pi) => {
                  const appt = appointments.find((a) => a.Professional === prof && coversSlot(a, slot))
                  const isApptStart = appt && isStart(appt, slot)
                  const style = appt ? (STATUS_STYLE[appt.Status] ?? STATUS_STYLE.pendente) : null

                  return (
                    <div key={`${slot}-${prof}-${pi}`}
                      className={`relative h-16 border-r last:border-r-0 border-line-2
                        ${isHour ? 'border-b border-b-line' : 'border-b border-b-line-2'}`}>
                      {isApptStart && (
                        <button
                          onClick={() => navigate(`/agendamento/${appt.UUID}`)}
                          className={`absolute inset-x-[3px] top-[2px] bottom-[2px] rounded-md px-2 py-1 text-left border cursor-pointer
                            hover:opacity-80 transition-opacity overflow-hidden ${style.card}`}
                        >
                          <div className="flex items-center gap-1.5 leading-none">
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${style.dot}`} />
                            <span className="font-semibold text-[11px] truncate">{appt.Client}</span>
                          </div>
                          <div className="font-mono text-[10px] opacity-75 truncate mt-0.5">{appt.Service}</div>
                        </button>
                      )}
                      {appt && !isApptStart && (
                        <div className={`absolute inset-x-[3px] top-0 bottom-0 opacity-30 rounded-sm ${style.card}`} />
                      )}
                    </div>
                  )
                }),
              ]
            })}
          </div>

          {/* Legenda */}
          <div className="flex gap-4 mt-3">
            {Object.entries(STATUS_STYLE).map(([status, { dot }]) => (
              <span key={status} className="inline-flex items-center gap-1.5 font-mono text-[11px] text-ink-3">
                <i className={`w-2 h-2 rounded-full ${dot}`} />
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            ))}
          </div>
        </>
      )}
    </AppLayout>
  )
}
