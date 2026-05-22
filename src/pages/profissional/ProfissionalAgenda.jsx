import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import Sidebar from '@/components/layout/Sidebar'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Icon from '@/components/ui/Icons'
import { PageSpinner } from '@/components/ui/Spinner'
import { useToast } from '@/context/ToastContext'
import useAuthStore from '@/store/authStore'
import api from '@/lib/api'
import { navItemsByRole } from '@/config/navItems'

const navItems = navItemsByRole['Profissional']

const TIME_SLOTS = []
for (let h = 8; h < 22; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`)
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:30`)
}

const WEEK_DAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

const STATUS_STYLE = {
  pendente:  { card: 'bg-[#dbeafe] border-[#93c5fd] text-[#1d4ed8]', dot: 'bg-[#3b82f6]' },
  confirmado:{ card: 'bg-success-soft border-success/40 text-success', dot: 'bg-success' },
  concluido: { card: 'bg-[#faecd6] border-gold/50 text-[#7a5c2e]', dot: 'bg-gold' },
  cancelado: { card: 'bg-danger-soft border-danger/40 text-danger line-through opacity-60', dot: 'bg-danger' },
}

function parseTime(t) { return t.slice(0, 5) }

function toMinutes(t) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function coversSlot(appt, slot) {
  const start = toMinutes(parseTime(appt.Start_time))
  const end   = toMinutes(parseTime(appt.End_time))
  const s = toMinutes(slot)
  return s >= start && s < end
}

function anchoredToSlot(appt, slot) {
  const startMin = toMinutes(parseTime(appt.Start_time))
  const slotMin  = toMinutes(slot)
  return startMin >= slotMin && startMin < slotMin + 30
}

function spanSlots(appt) {
  const start = toMinutes(parseTime(appt.Start_time))
  const end   = toMinutes(parseTime(appt.End_time))
  return Math.max(1, Math.ceil((end - start) / 30))
}

function apptHeight(appt, cellH) {
  const startMin = toMinutes(parseTime(appt.Start_time))
  const endMin   = toMinutes(parseTime(appt.End_time))
  return Math.max(cellH / 2 - 4, ((endMin - startMin) / 30) * cellH - 4)
}

function apptTop(appt, slot, cellH) {
  const startMin = toMinutes(parseTime(appt.Start_time))
  const slotMin  = toMinutes(slot)
  return ((startMin - slotMin) / 30) * cellH + 2
}

function isSlotPast(date, slot) {
  const now   = new Date()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (date < today) return true
  if (date > today) return false
  const [h, m] = slot.split(':').map(Number)
  return now.getHours() * 60 + now.getMinutes() > h * 60 + m
}

function toDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatHeader(date) {
  const dow = WEEK_DAYS[date.getDay()]
  const d   = date.getDate()
  const mon = MONTHS[date.getMonth()]
  const year = date.getFullYear()
  return `${dow.charAt(0).toUpperCase() + dow.slice(1)}, ${d} de ${mon} de ${year}`
}

function addMinutes(timeStr, mins) {
  const [h, m] = timeStr.split(':').map(Number)
  const total  = h * 60 + m + mins
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function isBreakStart(wh, slot) {
  return wh?.Break_start && wh.Break_start.slice(0, 5) === slot
}

function coversBreak(wh, slot) {
  if (!wh?.Break_start || !wh?.Break_end) return false
  const s = toMinutes(slot)
  return s >= toMinutes(wh.Break_start.slice(0, 5)) && s < toMinutes(wh.Break_end.slice(0, 5))
}

function spanBreak(wh) {
  if (!wh?.Break_start || !wh?.Break_end) return 0
  return Math.max(1, Math.ceil((toMinutes(wh.Break_end.slice(0, 5)) - toMinutes(wh.Break_start.slice(0, 5))) / 30))
}

function computeColumns(appts) {
  const sorted  = [...appts].sort((a, b) => toMinutes(parseTime(a.Start_time)) - toMinutes(parseTime(b.Start_time)))
  const colEnds = []
  const colMap  = new Map()
  sorted.forEach(appt => {
    const start = toMinutes(parseTime(appt.Start_time))
    const end   = toMinutes(parseTime(appt.End_time))
    let col = colEnds.findIndex(e => e <= start)
    if (col === -1) { col = colEnds.length; colEnds.push(end) } else colEnds[col] = end
    colMap.set(appt.UUID, { col, start, end })
  })
  const result = new Map()
  colMap.forEach((data, uuid) => {
    let maxCol = data.col
    colMap.forEach((other, otherUuid) => {
      if (uuid !== otherUuid && other.start < data.end && other.end > data.start) {
        maxCol = Math.max(maxCol, other.col)
      }
    })
    result.set(uuid, { col: data.col, totalCols: maxCol + 1 })
  })
  return result
}

const INPUT_CLS = 'w-full h-[42px] px-[14px] rounded-md border border-line bg-surface text-ink-2 font-body text-md placeholder:text-ink-4 focus:outline-none focus:border-brand transition-colors'

function AppointmentContextMenu({ appt, x, y, onClose, onStatusChange, onNavigate, onTransfer, onOpenComanda }) {
  const menuRef = useRef(null)

  useEffect(() => {
    function handleKey(e)   { if (e.key === 'Escape') onClose() }
    function handleClick(e) { if (menuRef.current && !menuRef.current.contains(e.target)) onClose() }
    document.addEventListener('keydown', handleKey)
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('touchstart', handleClick)
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('touchstart', handleClick)
    }
  }, [onClose])

  const menuW = 200, menuH = 210
  const adjustedX = x + menuW > window.innerWidth  ? x - menuW : x
  const adjustedY = y + menuH > window.innerHeight ? y - menuH : y

  const actions = []
  if (appt.Status === 'pendente')   actions.push({ label: 'Marcar como Confirmado', icon: 'check', status: 'confirmado', color: 'text-success' })
  if (appt.Status === 'confirmado') actions.push({ label: 'Marcar como Concluído',  icon: 'check', status: 'concluido',  color: 'text-ink-2' })
  if (appt.Status === 'pendente' || appt.Status === 'confirmado')
    actions.push({ label: 'Marcar como Cancelado', icon: 'x', status: 'cancelado', color: 'text-danger' })

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-surface border border-line rounded-xl shadow-lg py-1.5 min-w-[200px]"
      style={{ left: adjustedX, top: adjustedY }}
    >
      <div className="px-3.5 py-2 border-b border-line mb-1">
        <div className="font-medium text-[12.5px] truncate">{appt.Client}</div>
        <div className="font-mono text-[10.5px] text-ink-3 truncate">{appt.Service} · {parseTime(appt.Start_time)}</div>
      </div>
      {actions.map(({ label, icon, status, color }) => (
        <button key={status} onClick={() => { onStatusChange(appt, status); onClose() }}
          className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] hover:bg-surface-2 transition-colors cursor-pointer ${color}`}>
          <Icon name={icon} size={13} />{label}
        </button>
      ))}
      {actions.length > 0 && <div className="border-t border-line my-1" />}
      {(appt.Status === 'pendente' || appt.Status === 'confirmado') && (
        <button onClick={() => { onTransfer(appt); onClose() }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-ink-2 hover:bg-surface-2 transition-colors cursor-pointer">
          <Icon name="cal" size={13} />Transferir data
        </button>
      )}
      {appt.Status !== 'cancelado' && (
        <button onClick={() => { onOpenComanda(appt); onClose() }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-ink-2 hover:bg-surface-2 transition-colors cursor-pointer">
          <Icon name="receipt" size={13} />Abrir comanda
        </button>
      )}
      <button onClick={() => { onNavigate(appt); onClose() }}
        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-ink-3 hover:bg-surface-2 transition-colors cursor-pointer">
        <Icon name="arrowRight" size={13} />Ver detalhes
      </button>
    </div>
  )
}

function NovoAgendamentoDrawer({ slot, professional, date, onClose, onSaved }) {
  const { addToast } = useToast()
  const [clientes, setClientes]     = useState([])
  const [servicos, setServicos]     = useState([])
  const [clienteId, setClienteId]   = useState('')
  const [servicoId, setServicoId]   = useState('')
  const [startTime, setStartTime]   = useState(slot)
  const [endTime, setEndTime]       = useState(addMinutes(slot, 60))
  const [isUrgent, setIsUrgent]     = useState(false)
  const [saving, setSaving]         = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    setLoadingData(true)
    Promise.all([
      api.get('/users', { params: { Role: 'Usuario', limit: 200 } }),
      // Somente serviços vinculados ao profissional logado
      api.get('/service', { params: { professional: professional.UUID, limit: 200 } }),
    ]).then(([cRes, sRes]) => {
      setClientes(cRes.data.data ?? [])
      setServicos(sRes.data.data ?? [])
    }).catch(() => {})
      .finally(() => setLoadingData(false))
  }, [professional.UUID])

  function handleServico(id) {
    setServicoId(id)
    const svc = servicos.find(s => s.UUID === id)
    if (svc?.Duration) {
      const [h, m] = svc.Duration.split(':').map(Number)
      setEndTime(addMinutes(startTime, h * 60 + m))
    }
  }

  async function handleSalvar() {
    if (!clienteId || !servicoId) return addToast('Preencha cliente e serviço', 'warning')
    setSaving(true)
    try {
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      await api.post('/appointment', {
        Client: clienteId,
        Professional: professional.UUID,
        Service: servicoId,
        Date: dateStr,
        Start_time: startTime,
        End_time: endTime,
        Is_urgent: isUrgent,
      })
      addToast('Agendamento criado!')
      onSaved()
      onClose()
    } catch (err) {
      addToast(err.response?.data?.error ?? 'Erro ao criar agendamento', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end md:flex-row md:justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 w-full rounded-t-2xl md:rounded-none md:w-[420px] bg-bg md:border-l border-line flex flex-col max-h-[90vh] md:max-h-full md:h-full overflow-y-auto shadow-xl">
        {/* Handle mobile */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 rounded-full bg-line-2" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-line sticky top-0 bg-bg z-10">
          <button onClick={onClose} className="text-ink-3 hover:text-ink transition-colors cursor-pointer">
            <Icon name="x" size={18} />
          </button>
          <div className="flex-1">
            <h4 className="font-display font-medium text-[15px] tracking-tight">Novo agendamento</h4>
            <p className="text-[11px] text-ink-3 font-mono">{professional.Name} · {slot}</p>
          </div>
        </div>

        <div className="px-5 py-5 flex flex-col gap-4">
          {/* Cliente */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-ink-2">Cliente</label>
            <select value={clienteId} onChange={e => setClienteId(e.target.value)} className={INPUT_CLS}>
              <option value="">Selecionar cliente…</option>
              {clientes.map(c => <option key={c.UUID} value={c.UUID}>{c.Name}</option>)}
            </select>
          </div>

          {/* Serviço — filtrado pelo profissional */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-ink-2">Serviço</label>
            <select
              value={servicoId}
              onChange={e => handleServico(e.target.value)}
              disabled={loadingData || servicos.length === 0}
              className={INPUT_CLS}
            >
              {loadingData
                ? <option value="">Carregando…</option>
                : servicos.length === 0
                  ? <option value="">Nenhum serviço vinculado a você</option>
                  : <>
                    <option value="">Selecionar serviço…</option>
                    {servicos.map(s => <option key={s.UUID} value={s.UUID}>{s.Name}</option>)}
                  </>
              }
            </select>
          </div>

          {/* Horários */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Início</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className={INPUT_CLS} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Fim</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className={INPUT_CLS} />
            </div>
          </div>

          {/* Profissional read-only */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-ink-2">Profissional</label>
            <div className="flex items-center gap-2.5 h-[42px] px-[14px] rounded-md border border-line bg-surface-2 text-ink-3 text-md">
              <Avatar name={professional.Name} index={0} size="sm" />
              {professional.Name}
            </div>
          </div>

          {/* Urgência */}
          <button
            type="button"
            onClick={() => setIsUrgent(v => !v)}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-[10px] border transition-colors cursor-pointer text-left
              ${isUrgent ? 'bg-warning-soft border-warning/40' : 'bg-surface border-line hover:border-ink-3'}`}
          >
            <div className={`w-4 h-4 rounded flex items-center justify-center border flex-shrink-0 transition-colors
              ${isUrgent ? 'bg-warning border-warning' : 'border-line-2'}`}>
              {isUrgent && <Icon name="check" size={10} className="text-white" />}
            </div>
            <div>
              <div className={`text-[13px] font-medium ${isUrgent ? 'text-warning' : 'text-ink-2'}`}>Agendamento urgente</div>
              <div className="text-[11px] text-ink-3">Permite sobrepor horários já ocupados</div>
            </div>
          </button>

          <Button onClick={handleSalvar} loading={saving} className="w-full mt-2">
            Confirmar agendamento
          </Button>
        </div>
      </div>
    </div>
  )
}

function TransferirDrawer({ appt, onClose, onSaved }) {
  const { addToast } = useToast()

  const durationMin = (() => {
    const [sh, sm] = appt.Start_time.slice(0, 5).split(':').map(Number)
    const [eh, em] = appt.End_time.slice(0, 5).split(':').map(Number)
    return (eh * 60 + em) - (sh * 60 + sm)
  })()

  const [newDate, setNewDate]     = useState(appt.Date)
  const [startTime, setStartTime] = useState(appt.Start_time.slice(0, 5))
  const [saving, setSaving]       = useState(false)

  const endTime = (() => {
    const [h, m] = startTime.split(':').map(Number)
    const total  = h * 60 + m + durationMin
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
  })()

  async function handleSalvar() {
    setSaving(true)
    try {
      await api.patch(`/appointment/${appt.UUID}`, {
        Date: newDate, Start_time: startTime, End_time: endTime,
      })
      addToast('Agendamento transferido com sucesso', 'success')
      onSaved()
      onClose()
    } catch (err) {
      addToast(err.response?.data?.error ?? 'Erro ao transferir agendamento', 'error')
    } finally {
      setSaving(false)
    }
  }

  const inputClass = 'h-[42px] px-[14px] rounded-md border border-line bg-surface text-ink-2 font-body text-md focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/12 transition-colors w-full'

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 md:inset-y-0 md:right-0 md:left-auto md:w-[400px] flex flex-col bg-surface border-t border-line md:border-t-0 md:border-l rounded-t-2xl md:rounded-none shadow-xl">
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 rounded-full bg-line-2" />
        </div>
        <div className="flex items-start justify-between px-5 md:px-7 py-4 md:py-6 border-b border-line">
          <div>
            <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">Transferir agendamento</span>
            <h4 className="font-display font-medium text-[18px] tracking-tight mt-0.5">{appt.Client}</h4>
            <p className="text-[12.5px] text-ink-3 mt-0.5">{appt.Service} · {appt.Start_time.slice(0, 5)}</p>
          </div>
          <button onClick={onClose} className="text-ink-3 hover:text-ink transition-colors cursor-pointer mt-1">
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 md:px-7 py-5 space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-ink-2">Nova data</label>
            <input type="date" value={newDate} min={new Date().toISOString().slice(0, 10)}
              onChange={e => setNewDate(e.target.value)} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Novo horário</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Término (automático)</label>
              <div className="h-[42px] px-[14px] flex items-center rounded-md border border-line bg-surface-2 text-ink-3 text-md">{endTime}</div>
            </div>
          </div>
          <div className="bg-surface-2 border border-line rounded-[10px] px-4 py-3 text-[12.5px] text-ink-3">
            Duração mantida: <span className="font-medium text-ink-2">{durationMin} min</span>
          </div>
        </div>
        <div className="px-5 md:px-7 py-4 md:py-5 border-t border-line">
          <Button onClick={handleSalvar} loading={saving} className="w-full justify-center">
            <Icon name="cal" size={14} />Confirmar transferência
          </Button>
        </div>
      </div>
    </>
  )
}

export default function ProfissionalAgenda() {
  const { user } = useAuthStore()
  const navigate  = useNavigate()
  const { addToast } = useToast()

  const [date, setDate] = useState(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  })
  const [appointments, setAppointments] = useState([])
  const [workingHour, setWorkingHour]   = useState(null)
  const [loading, setLoading]           = useState(true)
  const [newSlot, setNewSlot]           = useState(null)
  const [contextMenu, setContextMenu]   = useState(null)
  const [transferAppt, setTransferAppt] = useState(null)
  const longPressTimer = useRef(null)
  const dateInputRef   = useRef(null)

  // Profissional como objeto para passar ao drawer
  const professional = { UUID: user?.publicId, Name: user?.name }

  // Carrega working hours do profissional quando a data muda
  useEffect(() => {
    if (!user?.publicId) return
    const weekday = date.getDay()
    api.get(`/working-hours/professional/${user.publicId}`)
      .then(({ data }) => {
        const wh = (data.data ?? []).find(w => w.Weekday === weekday) ?? null
        setWorkingHour(wh)
      })
      .catch(() => setWorkingHour(null))
  }, [user?.publicId, date])

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const { data } = await api.get('/appointment/my', { params: { date: toDateStr(date) } })
      setAppointments(data.data ?? [])
    } catch {
      setAppointments([])
    } finally {
      if (!silent) setLoading(false)
    }
  }, [date])

  useEffect(() => { load() }, [load])

  function prevDay() { setDate(d => { const n = new Date(d); n.setDate(n.getDate() - 1); return n }) }
  function nextDay() { setDate(d => { const n = new Date(d); n.setDate(n.getDate() + 1); return n }) }

  function openContextMenu(e, appt) {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ appt, x: e.clientX, y: e.clientY })
  }
  function handleLongPressStart(e, appt) {
    const touch = e.touches[0]
    longPressTimer.current = setTimeout(() => {
      setContextMenu({ appt, x: touch.clientX, y: touch.clientY })
    }, 500)
  }
  function handleLongPressEnd() { clearTimeout(longPressTimer.current) }

  async function handleStatusChange(appt, status) {
    try {
      await api.patch(`/appointment/${appt.UUID}`, { Status: status })
      addToast(`Agendamento marcado como ${status}`)
      load(true)
    } catch (err) {
      addToast(err.response?.data?.error ?? 'Erro ao atualizar status', 'error')
    }
  }

  // Pré-computa colunas para sobreposição (apenas não-urgentes)
  const columnMap = computeColumns(appointments.filter(a => !a.Is_urgent))

  const sidebar = (
    <Sidebar navItems={navItems} footerUser={user?.name} footerRole="Profissional" />
  )

  return (
    <AppLayout sidebar={sidebar}>
      {contextMenu && (
        <AppointmentContextMenu
          appt={contextMenu.appt}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onStatusChange={handleStatusChange}
          onNavigate={appt => navigate(`/agendamento/${appt.UUID}`)}
          onTransfer={appt => setTransferAppt(appt)}
          onOpenComanda={appt => navigate(`/profissional/comandas?appointment=${appt.UUID}`)}
        />
      )}
      {transferAppt && (
        <TransferirDrawer
          appt={transferAppt}
          onClose={() => setTransferAppt(null)}
          onSaved={() => load(true)}
        />
      )}
      {newSlot && (
        <NovoAgendamentoDrawer
          slot={newSlot.slot}
          professional={professional}
          date={date}
          onClose={() => setNewSlot(null)}
          onSaved={load}
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-end mb-5 md:mb-6">
        <div>
          <h3 className="font-display font-medium text-[22px] md:text-[26px] tracking-tight">Agenda</h3>
          <p className="text-[12px] md:text-[13px] text-ink-3 mt-1">
            {appointments.length} atendimento{appointments.length !== 1 ? 's' : ''} · {formatHeader(date)}
          </p>
        </div>
        <Button size="sm" onClick={() => navigate('/profissional/agendamentos')}>
          <Icon name="receipt" size={14} /><span className="hidden sm:inline">Ver todos</span>
        </Button>
      </div>

      {/* Navegação de dia */}
      <div className="flex items-center gap-2 md:gap-3 mb-5 overflow-x-auto">
        <button onClick={prevDay}
          className="w-[34px] h-[34px] shrink-0 rounded-lg border border-line bg-surface text-ink-2 flex items-center justify-center hover:border-ink-3 transition-colors">
          <Icon name="arrowLeft" size={14} />
        </button>
        <div className="font-display font-medium text-[14px] md:text-[17px] truncate">{formatHeader(date)}</div>
        <button onClick={nextDay}
          className="w-[34px] h-[34px] shrink-0 rounded-lg border border-line bg-surface text-ink-2 flex items-center justify-center hover:border-ink-3 transition-colors">
          <Icon name="arrowRight" size={14} />
        </button>
        <div className="relative shrink-0 ml-1">
          <button
            onClick={() => dateInputRef.current?.showPicker?.() ?? dateInputRef.current?.click()}
            className="w-[34px] h-[34px] rounded-lg border border-line bg-surface text-ink-2 flex items-center justify-center hover:border-brand hover:text-brand transition-colors cursor-pointer"
            title="Ir para uma data"
          >
            <Icon name="cal" size={14} />
          </button>
          <input
            ref={dateInputRef}
            type="date"
            value={toDateStr(date)}
            onChange={e => {
              if (!e.target.value) return
              const [y, m, d] = e.target.value.split('-').map(Number)
              const nd = new Date(y, m - 1, d)
              nd.setHours(0, 0, 0, 0)
              setDate(nd)
            }}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            tabIndex={-1}
          />
        </div>
        <button
          onClick={() => { const d = new Date(); d.setHours(0, 0, 0, 0); setDate(d) }}
          className="px-3 py-1.5 shrink-0 rounded-lg border border-line bg-surface text-[12.5px] text-ink-2 hover:border-ink-3 transition-colors cursor-pointer"
        >
          Hoje
        </button>
      </div>

      {loading ? <PageSpinner /> : (
        <>
          {/* Grade — desktop: col de hora + col do profissional */}
          <div className="bg-surface border border-line rounded-lg overflow-hidden">
            <div className="grid" style={{ gridTemplateColumns: '64px 1fr' }}>
              {/* Cabeçalho */}
              <div className="px-3 py-3 border-b border-r border-line bg-surface-2" />
              <div className="px-4 py-3 border-b border-line bg-surface-2 flex items-center gap-2.5">
                <Avatar name={user?.name ?? ''} index={0} size="sm" />
                <div className="font-medium text-[13px] truncate">{user?.name}</div>
              </div>

              {/* Slots */}
              {TIME_SLOTS.map(slot => {
                const isHour    = slot.endsWith(':00')
                const appts     = appointments.filter(a => anchoredToSlot(a, slot))
                const occupied  = appointments.some(a => coversSlot(a, slot) && a.Status !== 'cancelado')
                const onBreak   = coversBreak(workingHour, slot)
                const breakStart = isBreakStart(workingHour, slot)
                const breakSpans = breakStart ? spanBreak(workingHour) : 0
                const past      = isSlotPast(date, slot)
                const clickable = !occupied && !past && !onBreak

                return [
                  // Coluna de hora
                  <div key={`t-${slot}`}
                    className={`px-2.5 py-1.5 text-right font-mono text-[10.5px] text-ink-3 border-r border-line
                      ${isHour ? 'border-b border-b-line' : 'border-b border-b-line-2 border-dashed'}`}>
                    {isHour ? slot : ''}
                  </div>,

                  // Coluna do profissional
                  <div key={`c-${slot}`}
                    onClick={clickable ? () => setNewSlot({ slot, professional }) : undefined}
                    className={`relative h-16 border-line-2 overflow-visible
                      ${isHour ? 'border-b border-b-line' : 'border-b border-b-line-2'}
                      ${past || onBreak ? 'bg-surface-2' : ''}
                      ${clickable ? 'hover:bg-brand-soft cursor-pointer transition-colors' : ''}`}>
                    {(() => {
                      const normalAppts  = appts.filter(a => !a.Is_urgent)
                      const urgentAppts  = appts.filter(a => a.Is_urgent)
                      return <>
                        {normalAppts.map(a => {
                          const s = STATUS_STYLE[a.Status] ?? STATUS_STYLE.pendente
                          const { col = 0, totalCols = 1 } = columnMap.get(a.UUID) ?? {}
                          const w     = totalCols > 1 ? `calc(${100 / totalCols}% - 4px)` : undefined
                          const left  = totalCols > 1 ? `calc(${(col * 100) / totalCols}% + 2px)` : '3px'
                          const right = totalCols > 1 ? undefined : '3px'
                          return (
                            <button key={a.UUID}
                              onClick={e => { e.stopPropagation(); navigate(`/agendamento/${a.UUID}`) }}
                              onContextMenu={e => openContextMenu(e, a)}
                              onTouchStart={e => handleLongPressStart(e, a)}
                              onTouchEnd={handleLongPressEnd}
                              onTouchMove={handleLongPressEnd}
                              style={{ height: apptHeight(a, 64), top: apptTop(a, slot, 64), width: w, left, right }}
                              className={`absolute z-10 rounded-md px-2 py-1.5 text-center border cursor-pointer flex flex-col justify-center items-center
                                hover:opacity-80 transition-opacity overflow-hidden ${s.card}`}>
                              <div className="flex items-center gap-1.5 leading-none">
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
                                <span className="font-semibold text-[11px] truncate">{a.Client}</span>
                              </div>
                              <div className="font-mono text-[10px] opacity-75 truncate mt-0.5">{a.Service}</div>
                              <div className="font-mono text-[10px] opacity-60 truncate mt-0.5">
                                {parseTime(a.Start_time)} → {parseTime(a.End_time)}
                              </div>
                            </button>
                          )
                        })}
                        {urgentAppts.map(a => {
                          const s = STATUS_STYLE[a.Status] ?? STATUS_STYLE.pendente
                          return (
                            <button key={a.UUID}
                              onClick={e => { e.stopPropagation(); navigate(`/agendamento/${a.UUID}`) }}
                              onContextMenu={e => openContextMenu(e, a)}
                              onTouchStart={e => handleLongPressStart(e, a)}
                              onTouchEnd={handleLongPressEnd}
                              onTouchMove={handleLongPressEnd}
                              style={{ height: apptHeight(a, 64), top: apptTop(a, slot, 64) }}
                              className={`absolute inset-x-[3px] z-20 rounded-md px-2 py-1.5 text-center border-2 border-warning cursor-pointer flex flex-col justify-center items-center
                                hover:opacity-90 transition-opacity overflow-hidden ${s.card} shadow-md`}>
                              <div className="font-mono text-[9px] uppercase tracking-widest opacity-75 mb-0.5">⚡ Urgente</div>
                              <div className="flex items-center gap-1.5 leading-none">
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
                                <span className="font-semibold text-[11px] truncate">{a.Client}</span>
                              </div>
                              <div className="font-mono text-[10px] opacity-75 truncate mt-0.5">{a.Service}</div>
                              <div className="font-mono text-[10px] opacity-60 truncate mt-0.5">
                                {parseTime(a.Start_time)} → {parseTime(a.End_time)}
                              </div>
                            </button>
                          )
                        })}
                      </>
                    })()}
                    {breakStart && (
                      <div
                        style={{ height: breakSpans * 64 - 4 }}
                        className="absolute inset-x-[3px] top-[2px] z-10 rounded-md border border-line-2 bg-surface-3 flex flex-col items-center justify-center gap-0.5 pointer-events-none overflow-hidden"
                      >
                        <Icon name="clock" size={11} className="text-ink-4" />
                        <span className="font-mono text-[9.5px] text-ink-4">Intervalo</span>
                        <span className="font-mono text-[9px] text-ink-4 opacity-70">
                          {workingHour.Break_start.slice(0, 5)} – {workingHour.Break_end.slice(0, 5)}
                        </span>
                      </div>
                    )}
                  </div>,
                ]
              })}
            </div>
          </div>

          {/* Legenda */}
          <div className="flex gap-4 mt-3 flex-wrap">
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
