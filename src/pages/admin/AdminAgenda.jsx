import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import Sidebar from '@/components/layout/Sidebar'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Icon from '@/components/ui/Icons'
import { PageSpinner } from '@/components/ui/Spinner'
import SearchableSelect from '@/components/ui/SearchableSelect'
import { useToast } from '@/context/ToastContext'
import useAuthStore from '@/store/authStore'
import api from '@/lib/api'
import { navItemsByRole } from '@/config/navItems'
import { useTour } from '@/hooks/useTour'
import { adminSteps } from '@/tours/adminTour'
import ModalFecharConta from '@/components/ui/ModalFecharConta'

// Tinha algum const bugado

function AppointmentContextMenu({ appt, x, y, onClose, onStatusChange, onOpenComanda, onFecharConta, onNavigate, onTransfer }) {
  const menuRef = useRef(null)

  useEffect(() => {
    function handleKey(e) { if (e.key === 'Escape') onClose() }
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

  // Ajusta posição para não sair da tela
  const menuW = 200
  const menuH = 180
  const adjustedX = x + menuW > window.innerWidth ? x - menuW : x
  const adjustedY = y + menuH > window.innerHeight ? y - menuH : y

  const actions = []
  if (appt.Status === 'pendente') {
    actions.push({ label: 'Marcar como Confirmado', icon: 'check', status: 'confirmado', color: 'text-success' })
  }
  if (appt.Status === 'confirmado') {
    actions.push({ label: 'Marcar como Concluído', icon: 'check', status: 'concluido', color: 'text-ink-2' })
  }
  if (appt.Status === 'pendente' || appt.Status === 'confirmado') {
    actions.push({ label: 'Marcar como Cancelado', icon: 'x', status: 'cancelado', color: 'text-danger' })
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-surface border border-line rounded-xl shadow-lg py-1.5 min-w-[200px]"
      style={{ left: adjustedX, top: adjustedY }}
    >
      {/* Header do agendamento */}
      <div className="px-3.5 py-2 border-b border-line mb-1">
        <div className="font-medium text-[12.5px] truncate">{appt.Client}</div>
        <div className="font-mono text-[10.5px] text-ink-3 truncate">{appt.Service} · {parseTime(appt.Start_time)}</div>
      </div>

      {actions.map(({ label, icon, status, color }) => (
        <button
          key={status}
          onClick={() => { onStatusChange(appt, status); onClose() }}
          className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] hover:bg-surface-2 transition-colors cursor-pointer ${color}`}
        >
          <Icon name={icon} size={13} />
          {label}
        </button>
      ))}

      {actions.length > 0 && <div className="border-t border-line my-1" />}

      {(appt.Status === 'pendente' || appt.Status === 'confirmado') && (
        <button
          onClick={() => { onTransfer(appt); onClose() }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-ink-2 hover:bg-surface-2 transition-colors cursor-pointer"
        >
          <Icon name="cal" size={13} />
          Transferir data
        </button>
      )}

      {appt.Status !== 'cancelado' && (
        <>
          <button
            onClick={() => { onOpenComanda(appt); onClose() }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-ink-2 hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <Icon name="receipt" size={13} />
            Abrir comanda
          </button>
          <button
            onClick={() => { onFecharConta(appt); onClose() }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-success hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <Icon name="cash" size={13} />
            Fechar comanda
          </button>
        </>
      )}

      <button
        onClick={() => { onNavigate(appt); onClose() }}
        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-ink-3 hover:bg-surface-2 transition-colors cursor-pointer"
      >
        <Icon name="arrowRight" size={13} />
        Ver detalhes
      </button>
    </div>
  )
}

const navItems = navItemsByRole['Admin']

// Slots de 30 em 30 min das 08:00 às 18:00
const TIME_SLOTS = []
for (let h = 8; h < 22; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`)
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:30`)
}

const WEEK_DAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

const STATUS_STYLE = {
  pendente: { card: 'bg-[#dbeafe] border-[#93c5fd] text-[#1d4ed8]', dot: 'bg-[#3b82f6]' },
  confirmado: { card: 'bg-success-soft border-success/40 text-success', dot: 'bg-success' },
  concluido: { card: 'bg-[#faecd6] border-gold/50 text-[#7a5c2e]', dot: 'bg-gold' },
  cancelado: { card: 'bg-danger-soft border-danger/40 text-danger line-through opacity-60', dot: 'bg-danger' },
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
  const end = toMinutes(parseTime(appt.End_time))
  const s = toMinutes(slot)
  return s >= start && s < end
}

function anchoredToSlot(appt, slot) {
  const startMin = toMinutes(parseTime(appt.Start_time))
  const slotMin = toMinutes(slot)
  return startMin >= slotMin && startMin < slotMin + 30
}

function spanSlots(appt) {
  const start = toMinutes(parseTime(appt.Start_time))
  const end = toMinutes(parseTime(appt.End_time))
  return Math.max(1, Math.ceil((end - start) / 30))
}

function apptHeight(appt, cellH) {
  const startMin = toMinutes(parseTime(appt.Start_time))
  const endMin = toMinutes(parseTime(appt.End_time))
  return Math.max(cellH / 2 - 4, ((endMin - startMin) / 30) * cellH - 4)
}

function apptTop(appt, slot, cellH) {
  const startMin = toMinutes(parseTime(appt.Start_time))
  const slotMin = toMinutes(slot)
  return ((startMin - slotMin) / 30) * cellH + 2
}

function isSlotPast(date, slot) {
  const now = new Date()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (date < today) return true
  if (date > today) return false
  // mesmo dia — compara horário
  const [h, m] = slot.split(':').map(Number)
  return now.getHours() * 60 + now.getMinutes() > h * 60 + m
}

function toDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatHeader(date) {
  const dow = WEEK_DAYS[date.getDay()]
  const d = date.getDate()
  const mon = MONTHS[date.getMonth()]
  const year = date.getFullYear()
  return `${dow.charAt(0).toUpperCase() + dow.slice(1)}, ${d} de ${mon} de ${year}`
}

function addMinutes(timeStr, mins) {
  const [h, m] = timeStr.split(':').map(Number)
  const total = h * 60 + m + mins
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

// Helpers para folgas
function leaveCoversSlot(leaves, slot) {
  if (!leaves?.length) return false
  return leaves.some(l => {
    if (l.All_day) return true
    if (!l.Start_time || !l.End_time) return false
    const s = toMinutes(slot)
    return s >= toMinutes(l.Start_time.slice(0, 5)) && s < toMinutes(l.End_time.slice(0, 5))
  })
}
function leaveStartsAt(leaves, slot) {
  if (!leaves?.length) return null
  if (leaves.some(l => l.All_day) && slot === TIME_SLOTS[0]) return leaves.find(l => l.All_day)
  return leaves.find(l => !l.All_day && l.Start_time?.slice(0, 5) === slot) ?? null
}
function leaveSpans(leave) {
  if (leave.All_day) return TIME_SLOTS.length
  if (!leave.Start_time || !leave.End_time) return 1
  return Math.max(1, Math.ceil((toMinutes(leave.End_time.slice(0, 5)) - toMinutes(leave.Start_time.slice(0, 5))) / 30))
}

// Calcula coluna e total de colunas para agendamentos sobrepostos de um profissional
function computeColumns(appts) {
  const sorted = [...appts].sort((a, b) =>
    toMinutes(parseTime(a.Start_time)) - toMinutes(parseTime(b.Start_time))
  )
  const colEnds = [] // minuto de fim do último agendamento em cada coluna
  const colMap = new Map() // UUID → { col, start, end }

  sorted.forEach(appt => {
    const start = toMinutes(parseTime(appt.Start_time))
    const end = toMinutes(parseTime(appt.End_time))
    let col = colEnds.findIndex(e => e <= start)
    if (col === -1) { col = colEnds.length; colEnds.push(end) }
    else colEnds[col] = end
    colMap.set(appt.UUID, { col, start, end })
  })

  // totalCols = maior índice de coluna entre todos os sobrepostos + 1
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

function applyPhoneMask(value) {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return `(${d}`
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 11) return `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3, 7)}-${d.slice(7)}`
  return value
}

const MODAL_CLS = 'fixed inset-0 z-50 flex items-center justify-center p-4'
const MODAL_INNER_CLS = 'w-full max-w-[380px] bg-bg border border-line rounded-2xl shadow-xl flex flex-col'
const INPUT_CLS = 'w-full h-[42px] px-[14px] rounded-md border border-line bg-surface text-ink-2 font-body text-md placeholder:text-ink-4 focus:outline-none focus:border-brand transition-colors'

function ModalNovaCategoria({ onClose, onCreated }) {
  const { addToast } = useToast()
  const [nome, setNome] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave(e) {
    e.preventDefault()
    if (!nome.trim()) return
    setSaving(true)
    try {
      const { data } = await api.post('/category', { Name: nome.trim() })
      addToast('Categoria criada', 'success')
      onCreated(data.data ?? data)
      onClose()
    } catch (err) {
      addToast(err.response?.data?.error ?? 'Erro ao criar categoria', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative ${MODAL_INNER_CLS}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h4 className="font-display font-medium text-[15px] tracking-tight">Nova categoria</h4>
          <button onClick={onClose} className="text-ink-3 hover:text-ink transition-colors cursor-pointer"><Icon name="x" size={16} /></button>
        </div>
        <form onSubmit={handleSave} className="px-5 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-ink-2">Nome da categoria</label>
            <input
              required
              autoFocus
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: Cabelo"
              className={INPUT_CLS}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="ghost" className="flex-1 justify-center" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="flex-1 justify-center" loading={saving}>Criar</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ModalNovoServico({ onClose, onCreated }) {
  const { addToast } = useToast()
  const [form, setForm] = useState({ Name: '', Duration: '01:00', Commission: '', Price: '', Category: '' })
  const [categories, setCategories] = useState([])
  const [loadingCats, setLoadingCats] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalCat, setModalCat] = useState(false)

  useEffect(() => {
    api.get('/category', { params: { limit: 50 } })
      .then(({ data }) => setCategories(data.data ?? []))
      .catch(() => { })
      .finally(() => setLoadingCats(false))
  }, [])

  function handleCategoryCriada(cat) {
    setCategories(prev => [...prev, cat])
    setForm(f => ({ ...f, Category: cat.UUID }))
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.Category) { addToast('Selecione uma categoria', 'warning'); return }
    setSaving(true)
    const duration = form.Duration.length === 5 ? `${form.Duration}:00` : form.Duration
    try {
      const { data } = await api.post('/service', {
        Name: form.Name,
        Duration: duration,
        Commission: Number(form.Commission),
        Price: Number(form.Price),
        Category: form.Category,
      })
      addToast('Serviço criado', 'success')
      onCreated(data.data ?? data)
      onClose()
    } catch (err) {
      addToast(err.response?.data?.error ?? 'Erro ao criar serviço', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {modalCat && <ModalNovaCategoria onClose={() => setModalCat(false)} onCreated={handleCategoryCriada} />}
      <div className={MODAL_CLS}>
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className={`relative ${MODAL_INNER_CLS}`}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-line">
            <h4 className="font-display font-medium text-[15px] tracking-tight">Novo serviço</h4>
            <button onClick={onClose} className="text-ink-3 hover:text-ink transition-colors cursor-pointer"><Icon name="x" size={16} /></button>
          </div>
          <form onSubmit={handleSave} className="px-5 py-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Nome do serviço</label>
              <input
                required
                autoFocus
                value={form.Name}
                onChange={e => setForm(f => ({ ...f, Name: e.target.value }))}
                placeholder="Ex: Corte feminino"
                className={INPUT_CLS}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Categoria</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  title="Nova categoria"
                  onClick={() => setModalCat(true)}
                  className="h-[42px] w-[42px] shrink-0 flex items-center justify-center rounded-md border border-line bg-surface text-ink-3 hover:text-brand hover:border-brand transition-colors cursor-pointer"
                >
                  <Icon name="plus" size={16} />
                </button>
                <SearchableSelect
                  required
                  value={form.Category}
                  onChange={val => setForm(f => ({ ...f, Category: val }))}
                  options={categories.map(c => ({ value: c.UUID, label: c.Name }))}
                  placeholder={loadingCats ? 'Carregando…' : 'Selecione…'}
                  disabled={loadingCats}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Duração (HH:MM)</label>
              <input
                required
                type="time"
                value={form.Duration}
                onChange={e => setForm(f => ({ ...f, Duration: e.target.value }))}
                className={INPUT_CLS}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-ink-2">Preço (R$)</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.Price}
                  onChange={e => setForm(f => ({ ...f, Price: e.target.value }))}
                  placeholder="0,00"
                  className={INPUT_CLS}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-ink-2">Comissão (%)</label>
                <input
                  required
                  type="number"
                  min="0"
                  max="100"
                  value={form.Commission}
                  onChange={e => setForm(f => ({ ...f, Commission: e.target.value }))}
                  placeholder="0"
                  className={INPUT_CLS}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="ghost" className="flex-1 justify-center" onClick={onClose}>Cancelar</Button>
              <Button type="submit" className="flex-1 justify-center" loading={saving}>Criar</Button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

function ModalNovoCliente({ onClose, onCreated }) {
  const { addToast } = useToast()
  const [form, setForm] = useState({ name: '', phone: '', birthday: '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  function validate() {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Nome é obrigatório'
    if (!/^\(\d{2}\) \d \d{4}-\d{4}$/.test(form.phone)) errs.phone = 'Ex: (11) 9 9999-9999'
    return errs
  }

  async function handleSave(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSaving(true)
    try {
      const body = { name: form.name.trim(), phone: form.phone }
      if (form.birthday) body.birthday = form.birthday
      await api.post('/auth/register-admin', body)
      addToast(`${form.name} cadastrado com sucesso`, 'success')
      // Busca o usuário criado para obter o UUID
      const { data: usersRes } = await api.get('/users', { params: { Role: 'Usuario', limit: 100 } })
      const criado = (usersRes.data ?? []).find(u => u.Phone === form.phone)
      onCreated(criado ?? { Name: form.name.trim(), Phone: form.phone })
      onClose()
    } catch (err) {
      const msg = err.response?.data?.error
      if (msg?.includes('Telefone') || msg?.includes('telefone')) {
        setErrors({ phone: 'Telefone já cadastrado' })
      } else {
        addToast(msg ?? 'Erro ao cadastrar cliente', 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={MODAL_CLS}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative ${MODAL_INNER_CLS}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h4 className="font-display font-medium text-[15px] tracking-tight">Novo cliente</h4>
          <button onClick={onClose} className="text-ink-3 hover:text-ink transition-colors cursor-pointer"><Icon name="x" size={16} /></button>
        </div>
        <form onSubmit={handleSave} className="px-5 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-ink-2">Nome</label>
            <input
              required
              autoFocus
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Nome completo"
              className={`${INPUT_CLS} ${errors.name ? 'border-danger' : ''}`}
            />
            {errors.name && <span className="text-[11px] text-danger">{errors.name}</span>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-ink-2">Telefone</label>
            <input
              required
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: applyPhoneMask(e.target.value) }))}
              placeholder="(11) 9 9999-9999"
              className={`${INPUT_CLS} ${errors.phone ? 'border-danger' : ''}`}
            />
            {errors.phone && <span className="text-[11px] text-danger">{errors.phone}</span>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-ink-2">Nascimento <span className="text-ink-4 font-normal">(opcional)</span></label>
            <input
              type="date"
              value={form.birthday}
              onChange={e => setForm(f => ({ ...f, birthday: e.target.value }))}
              className={INPUT_CLS}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="ghost" className="flex-1 justify-center" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="flex-1 justify-center" loading={saving}>Criar</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function FolgaDrawer({ date, professionals, onClose, onSaved }) {
  const { addToast } = useToast()
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  const [form, setForm] = useState({ professional_id: professionals[0]?.UUID ?? '', date: dateStr, all_day: true, start_time: '08:00', end_time: '12:00', reason: '' })
  const [saving, setSaving] = useState(false)

  async function handleSalvar(e) {
    e.preventDefault()
    if (!form.professional_id) return addToast('Selecione um profissional', 'warning')
    setSaving(true)
    try {
      const body = { professional_id: form.professional_id, date: form.date, all_day: form.all_day, reason: form.reason || null }
      if (!form.all_day) { body.start_time = form.start_time; body.end_time = form.end_time }
      await api.post('/professional-leave', body)
      addToast('Folga registrada', 'success')
      onSaved()
      onClose()
    } catch (err) {
      addToast(err.response?.data?.error ?? 'Erro ao registrar folga', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end md:flex-row md:justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 w-full rounded-t-2xl md:rounded-none md:w-[420px] bg-bg md:border-l border-line flex flex-col max-h-[90vh] md:max-h-full md:h-full overflow-y-auto shadow-xl">
        <div className="flex justify-center pt-3 pb-1 md:hidden"><div className="w-10 h-1 rounded-full bg-line-2" /></div>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-line sticky top-0 bg-bg z-10">
          <button onClick={onClose} className="text-ink-3 hover:text-ink transition-colors cursor-pointer"><Icon name="x" size={18} /></button>
          <h4 className="font-display font-medium text-[15px] tracking-tight">Registrar folga</h4>
        </div>
        <form onSubmit={handleSalvar} className="px-5 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-ink-2">Profissional</label>
            <select
              required
              value={form.professional_id}
              onChange={e => setForm(f => ({ ...f, professional_id: e.target.value }))}
              className={INPUT_CLS}
            >
              <option value="">Selecione…</option>
              {professionals.map(p => <option key={p.UUID} value={p.UUID}>{p.Name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-ink-2">Data</label>
            <input type="date" required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={INPUT_CLS} />
          </div>
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, all_day: !f.all_day }))}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-[10px] border transition-colors cursor-pointer text-left
              ${form.all_day ? 'bg-brand-soft border-brand/30' : 'bg-surface border-line hover:border-ink-3'}`}
          >
            <div className={`w-4 h-4 rounded flex items-center justify-center border flex-shrink-0 transition-colors
              ${form.all_day ? 'bg-brand border-brand' : 'border-line-2'}`}>
              {form.all_day && <Icon name="check" size={10} className="text-white" />}
            </div>
            <div>
              <div className={`text-[13px] font-medium ${form.all_day ? 'text-brand' : 'text-ink-2'}`}>Ocupa o dia inteiro</div>
              <div className="text-[11px] text-ink-3">Bloqueia toda a agenda do dia</div>
            </div>
          </button>
          {!form.all_day && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-ink-2">Início</label>
                <input type="time" required value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} className={INPUT_CLS} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-ink-2">Fim</label>
                <input type="time" required value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} className={INPUT_CLS} />
              </div>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-ink-2">Motivo <span className="text-ink-4 font-normal">(opcional)</span></label>
            <textarea
              value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              placeholder="Ex: Consulta médica"
              rows={2}
              className="w-full px-[14px] py-[10px] rounded-md border border-line bg-surface text-ink-2 font-body text-md placeholder:text-ink-4 focus:outline-none focus:border-brand transition-colors resize-none"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="ghost" className="flex-1 justify-center" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="flex-1 justify-center" loading={saving}>Registrar</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function LeaveContextMenu({ leave, x, y, onClose, onRemove }) {
  const menuRef = useRef(null)
  useEffect(() => {
    function handle(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose()
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handle)
    document.addEventListener('keydown', handle)
    return () => { document.removeEventListener('mousedown', handle); document.removeEventListener('keydown', handle) }
  }, [onClose])
  const menuW = 180, menuH = 80
  const adjX = x + menuW > window.innerWidth ? x - menuW : x
  const adjY = y + menuH > window.innerHeight ? y - menuH : y
  return (
    <div ref={menuRef} className="fixed z-50 bg-surface border border-line rounded-xl shadow-lg py-1.5 min-w-[180px]" style={{ left: adjX, top: adjY }}>
      <div className="px-3.5 py-2 border-b border-line mb-1">
        <div className="font-medium text-[12.5px]">Folga</div>
        {leave.Reason && <div className="text-[11px] text-ink-3 truncate">{leave.Reason}</div>}
      </div>
      <button
        onClick={() => { onRemove(leave); onClose() }}
        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-danger hover:bg-surface-2 transition-colors cursor-pointer"
      >
        <Icon name="trash" size={13} />
        Remover folga
      </button>
    </div>
  )
}

function NovoAgendamentoDrawer({ slot, professional, date, onClose, onSaved }) {
  const { addToast } = useToast()
  const [clientes, setClientes] = useState([])
  const [servicos, setServicos] = useState([])
  const [clienteId, setClienteId] = useState('')
  const [servicoId, setServicoId] = useState('')
  const [startTime, setStartTime] = useState(slot)
  const [endTime, setEndTime] = useState(addMinutes(slot, 60))
  const [isUrgent, setIsUrgent] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [modalCliente, setModalCliente] = useState(false)
  const [modalServico, setModalServico] = useState(false)

  useEffect(() => {
    setLoadingData(true)
    Promise.all([
      api.get('/users', { params: { Role: 'Usuario', limit: 100 } }),
      api.get('/service', { params: { professional: professional.UUID, limit: 100 } }),
    ]).then(([cRes, sRes]) => {
      setClientes(cRes.data.data ?? [])
      setServicos(sRes.data.data ?? [])
    }).catch(() => { })
      .finally(() => setLoadingData(false))
  }, [professional.UUID])

  function handleClienteCriado(cliente) {
    setClientes(prev => [...prev, cliente])
    setClienteId(cliente.UUID)
  }

  function handleServicoCriado(servico) {
    setServicos(prev => [...prev, servico])
    handleServico(servico.UUID, [...servicos, servico])
    // Vincula automaticamente o serviço criado ao profissional da agenda
    api.post(`/service/${servico.UUID}/professionals`, { professional_id: professional.UUID }).catch(() => { })
  }

  // Quando serviço muda, ajusta end_time pela duração
  function handleServico(id, lista) {
    setServicoId(id)
    const svc = (lista ?? servicos).find(s => s.UUID === id)
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

  const inputClass = 'w-full h-[42px] px-[14px] rounded-md border border-line bg-surface text-ink-2 font-body text-md placeholder:text-ink-4 focus:outline-none focus:border-brand transition-colors'

  return (
    <>
      {modalCliente && (
        <ModalNovoCliente onClose={() => setModalCliente(false)} onCreated={handleClienteCriado} />
      )}
      {modalServico && (
        <ModalNovoServico onClose={() => setModalServico(false)} onCreated={handleServicoCriado} />
      )}
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
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalCliente(true)}
                  className="flex-shrink-0 w-[42px] h-[42px] flex items-center justify-center rounded-md border border-line bg-surface text-brand hover:bg-brand-soft hover:border-brand/30 transition-colors cursor-pointer"
                >
                  <Icon name="plus" size={16} />
                </button>
                <SearchableSelect
                  value={clienteId}
                  onChange={setClienteId}
                  options={clientes.map(c => ({ value: c.UUID, label: c.Name }))}
                  placeholder="Selecionar cliente…"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Serviço */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Serviço</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalServico(true)}
                  className="flex-shrink-0 w-[42px] h-[42px] flex items-center justify-center rounded-md border border-line bg-surface text-brand hover:bg-brand-soft hover:border-brand/30 transition-colors cursor-pointer"
                >
                  <Icon name="plus" size={16} />
                </button>
                <SearchableSelect
                  value={servicoId}
                  onChange={handleServico}
                  disabled={loadingData || servicos.length === 0}
                  options={servicos.map(s => ({ value: s.UUID, label: s.Name }))}
                  placeholder={loadingData ? 'Carregando…' : servicos.length === 0 ? 'Nenhum serviço vinculado' : 'Selecionar serviço…'}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Horários */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-ink-2">Início</label>
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className={inputClass} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-ink-2">Fim</label>
                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className={inputClass} />
              </div>
            </div>

            {/* Profissional (read-only) */}
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
    </>
  )
}

function TransferirDrawer({ appt, onClose, onSaved }) {
  const { addToast } = useToast()

  // Calcula duração em minutos do agendamento original
  const durationMin = (() => {
    const [sh, sm] = appt.Start_time.slice(0, 5).split(':').map(Number)
    const [eh, em] = appt.End_time.slice(0, 5).split(':').map(Number)
    return (eh * 60 + em) - (sh * 60 + sm)
  })()

  const [newDate, setNewDate] = useState(appt.Date)
  const [startTime, setStartTime] = useState(appt.Start_time.slice(0, 5))
  const [saving, setSaving] = useState(false)

  // Calcula end_time automaticamente pela duração
  const endTime = (() => {
    const [h, m] = startTime.split(':').map(Number)
    const total = h * 60 + m + durationMin
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
  })()

  async function handleSalvar() {
    setSaving(true)
    try {
      await api.patch(`/appointment/${appt.UUID}`, {
        Date: newDate,
        Start_time: startTime,
        End_time: endTime,
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
        {/* Alça mobile */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 rounded-full bg-line-2" />
        </div>

        {/* Header */}
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

        {/* Formulário */}
        <div className="flex-1 overflow-y-auto px-5 md:px-7 py-5 space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-ink-2">Nova data</label>
            <input
              type="date"
              value={newDate}
              min={new Date().toISOString().slice(0, 10)}
              onChange={e => setNewDate(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Novo horário</label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Término (automático)</label>
              <div className="h-[42px] px-[14px] flex items-center rounded-md border border-line bg-surface-2 text-ink-3 text-md">
                {endTime}
              </div>
            </div>
          </div>

          <div className="bg-surface-2 border border-line rounded-[10px] px-4 py-3 text-[12.5px] text-ink-3">
            Duração mantida: <span className="font-medium text-ink-2">{durationMin} min</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 md:px-7 py-4 md:py-5 border-t border-line">
          <Button onClick={handleSalvar} loading={saving} className="w-full justify-center">
            <Icon name="cal" size={14} />
            Confirmar transferência
          </Button>
        </div>
      </div>
    </>
  )
}

export default function AdminAgenda() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [date, setDate] = useState(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  })
  const [appointments, setAppointments] = useState([])
  const [professionals, setProfessionals] = useState([])
  const [breakByProf, setBreakByProf] = useState({})
  const [leaveByProf, setLeaveByProf] = useState({})
  const [loading, setLoading] = useState(true)
  const { restartTour } = useTour('admin', adminSteps, !loading)
  const [mobileProfIdx, setMobileProfIdx] = useState(0)
  const [newSlot, setNewSlot] = useState(null)
  const [contextMenu, setContextMenu] = useState(null) // { appt, x, y }
  const [leaveMenu, setLeaveMenu] = useState(null) // { leave, x, y }
  const [transferAppt, setTransferAppt] = useState(null)
  const [folgaDrawer, setFolgaDrawer] = useState(false)
  const [fecharContaClient, setFecharContaClient] = useState(null)
  const [fecharContaMethod, setFecharContaMethod] = useState('pix')
  const [fecharContaPaying, setFecharContaPaying] = useState(false)
  const [fecharContaOrders, setFecharContaOrders] = useState([])
  const [fecharContaOrdersLoading, setFecharContaOrdersLoading] = useState(false)
  const longPressTimer = useRef(null)
  const dateInputRef = useRef(null)

  function openContextMenu(e, appt) {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ appt, x: e.clientX, y: e.clientY })
  }

  function openLeaveMenu(e, leave) {
    e.preventDefault()
    e.stopPropagation()
    setLeaveMenu({ leave, x: e.clientX, y: e.clientY })
  }

  async function handleRemoveLeave(leave) {
    try {
      await api.delete(`/professional-leave/${leave.UUID}`)
      addToast('Folga removida', 'success')
      load(true)
    } catch (err) {
      addToast(err.response?.data?.error ?? 'Erro ao remover folga', 'error')
    }
  }

  function handleLongPressStart(e, appt) {
    const touch = e.touches[0]
    longPressTimer.current = setTimeout(() => {
      setContextMenu({ appt, x: touch.clientX, y: touch.clientY })
    }, 500)
  }

  function handleLongPressEnd() {
    clearTimeout(longPressTimer.current)
  }

  async function handleAbrirFecharConta(appt) {
    setFecharContaOrdersLoading(true)
    setFecharContaMethod('pix')
    setFecharContaOrders([])
    try {
      const { data } = await api.get('/tab')
      const allTabs = data.data ?? []
      const openTabs = allTabs.filter(t => t.Status === 'Em aberto' && t.Appointment?.Client === appt.Client)
      if (openTabs.length === 0) {
        addToast('Nenhuma comanda em aberto para este cliente', 'warning')
        setFecharContaOrdersLoading(false)
        return
      }
      const clientId = openTabs[0].Appointment?.ClientId
      setFecharContaClient({ name: appt.Client, clientId, tabs: openTabs })
      const { data: ordersData } = await api.get(`/product-order?client_id=${clientId}&status=encomendado`)
      setFecharContaOrders(ordersData.data ?? [])
    } catch {
      setFecharContaOrders([])
    } finally {
      setFecharContaOrdersLoading(false)
    }
  }

  async function handleFecharConta() {
    if (!fecharContaClient) return
    setFecharContaPaying(true)
    try {
      await api.post('/tab/batch-pay', {
        tab_ids: fecharContaClient.tabs.map(t => t.UUID),
        Method: fecharContaMethod,
        Payment_date: new Date().toISOString(),
        client_id: fecharContaClient.clientId,
      })
      addToast(`Conta de ${fecharContaClient.name} fechada com sucesso`, 'success')
      setFecharContaClient(null)
      setFecharContaOrders([])
      load(true)
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao fechar conta', 'error')
    } finally {
      setFecharContaPaying(false)
    }
  }

  async function handleStatusChange(appt, status) {
    try {
      await api.patch(`/appointment/${appt.UUID}`, { Status: status })
      addToast(`Agendamento marcado como ${status}`)
      load(true)
    } catch (err) {
      addToast(err.response?.data?.error ?? 'Erro ao atualizar status', 'error')
    }
  }

  // Carrega profissionais uma vez ao montar
  useEffect(() => {
    Promise.all([
      api.get('/users', { params: { Role: 'Profissional' } }),
      api.get('/users', { params: { Role: 'Admin' } }),
    ])
      .then(([profRes, adminRes]) => {
        setProfessionals([...(profRes.data.data ?? []), ...(adminRes.data.data ?? [])])
      })
      .catch(() => setProfessionals([]))
  }, [])

  // Carrega working hours dos profissionais quando a data muda
  useEffect(() => {
    if (professionals.length === 0) return
    const weekday = date.getDay()
    Promise.all(
      professionals.map((p) =>
        api.get(`/working-hours/professional/${p.UUID}`)
          .then(({ data }) => {
            const wh = (data.data ?? []).find((w) => w.Weekday === weekday)
            return { uuid: p.UUID, wh: wh ?? null }
          })
          .catch(() => ({ uuid: p.UUID, wh: null }))
      )
    ).then((results) => {
      setBreakByProf(Object.fromEntries(results.map(({ uuid, wh }) => [uuid, wh])))
    })
  }, [professionals, date])

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [apptRes, ...leaveResults] = await Promise.all([
        api.get('/appointment', { params: { date: toDateStr(date) } }),
        ...professionals.map(p =>
          api.get(`/professional-leave/professional/${p.UUID}`, { params: { date: toDateStr(date) } })
            .then(r => ({ uuid: p.UUID, leaves: (r.data.data ?? []).filter(l => l.Date === toDateStr(date)) }))
            .catch(() => ({ uuid: p.UUID, leaves: [] }))
        )
      ])
      setAppointments(apptRes.data.data ?? [])
      setLeaveByProf(Object.fromEntries(leaveResults.map(({ uuid, leaves }) => [uuid, leaves])))
    } catch {
      setAppointments([])
      setLeaveByProf({})
    } finally {
      if (!silent) setLoading(false)
    }
  }, [date, professionals])

  useEffect(() => { load() }, [load])

  function prevDay() {
    setDate((d) => { const n = new Date(d); n.setDate(n.getDate() - 1); return n })
  }
  function nextDay() {
    setDate((d) => { const n = new Date(d); n.setDate(n.getDate() + 1); return n })
  }

  // Profissionais ativos — coluna sempre visível mesmo sem agendamentos
  const profNames = professionals.map((p) => p.Name)
  const profObjects = professionals

  // Pré-computa layout de colunas para agendamentos sobrepostos (exceto urgentes)
  const columnMap = new Map()
  profObjects.forEach(profObj => {
    const profAppts = appointments.filter(
      a => a.Professional === profObj.Name && !a.Is_urgent
    )
    computeColumns(profAppts).forEach((data, uuid) => columnMap.set(uuid, data))
  })

  const sidebar = (
    <Sidebar navItems={navItems} footerUser={user?.name} footerRole="Admin">Admin</Sidebar>
  )

  return (
    <AppLayout sidebar={sidebar}>
      {leaveMenu && (
        <LeaveContextMenu
          leave={leaveMenu.leave}
          x={leaveMenu.x}
          y={leaveMenu.y}
          onClose={() => setLeaveMenu(null)}
          onRemove={handleRemoveLeave}
        />
      )}
      {contextMenu && (
        <AppointmentContextMenu
          appt={contextMenu.appt}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onStatusChange={handleStatusChange}
          onOpenComanda={(appt) => navigate(`/admin/caixa?appointment=${appt.UUID}`)}
          onFecharConta={handleAbrirFecharConta}
          onNavigate={(appt) => navigate(`/agendamento/${appt.UUID}`)}
          onTransfer={(appt) => setTransferAppt(appt)}
        />
      )}
      {fecharContaClient && (
        <ModalFecharConta
          client={fecharContaClient}
          orders={fecharContaOrders}
          ordersLoading={fecharContaOrdersLoading}
          method={fecharContaMethod}
          onMethodChange={setFecharContaMethod}
          paying={fecharContaPaying}
          onClose={() => { setFecharContaClient(null); setFecharContaOrders([]) }}
          onConfirm={handleFecharConta}
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
          professional={newSlot.professional}
          date={date}
          onClose={() => setNewSlot(null)}
          onSaved={load}
        />
      )}
      {folgaDrawer && (
        <FolgaDrawer
          date={date}
          professionals={professionals}
          onClose={() => setFolgaDrawer(false)}
          onSaved={() => load(true)}
        />
      )}
      <div className="flex justify-between items-end mb-5 md:mb-6">
        <div>
          <h3 className="font-display font-medium text-[22px] md:text-[26px] tracking-tight">Agenda</h3>
          <p className="text-[12px] md:text-[13px] text-ink-3 mt-1">
            {appointments.length} atendimento{appointments.length !== 1 ? 's' : ''} · {formatHeader(date)}
          </p>
          <button onClick={restartTour} className="inline-flex items-center gap-1 text-[11px] text-ink-4 hover:text-brand transition-colors mt-1.5" title="Repetir tour guiado">
            <Icon name="helpCircle" size={12} />
            Ver tour
          </button>
        </div>
        <Button size="sm" onClick={() => navigate('/admin/agendamentos')}>
          <Icon name="receipt" size={14} /><span className="hidden sm:inline">Ver todos</span>
        </Button>
      </div>

      {/* Navegação de dia */}
      <div data-tour="day-nav" className="flex items-center gap-2 md:gap-3 mb-5 overflow-x-auto">
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
            onChange={(e) => {
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
        <button
          onClick={() => setFolgaDrawer(true)}
          className="ml-auto px-3 py-1.5 shrink-0 rounded-lg border border-line bg-surface text-[12.5px] text-ink-2 hover:border-danger hover:text-danger transition-colors cursor-pointer"
        >
          + Folga
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
          {/* Mobile: seletor de profissional */}
          {profNames.length > 1 && (
            <div className="flex items-center gap-2 mb-4 md:hidden">
              <button
                onClick={() => setMobileProfIdx((i) => Math.max(0, i - 1))}
                disabled={mobileProfIdx === 0}
                className="w-[32px] h-[32px] rounded-lg border border-line bg-surface text-ink-2 flex items-center justify-center disabled:opacity-30 transition-colors"
              >
                <Icon name="arrowLeft" size={13} />
              </button>
              <div className="flex-1 flex items-center gap-2 bg-surface border border-line rounded-lg px-3 py-2">
                <Avatar name={profNames[mobileProfIdx]} index={mobileProfIdx} size="sm" />
                <div className="font-medium text-[13px] truncate">{profNames[mobileProfIdx]}</div>
                <div className="font-mono text-[10.5px] text-ink-3 ml-auto shrink-0">{mobileProfIdx + 1}/{profNames.length}</div>
              </div>
              <button
                onClick={() => setMobileProfIdx((i) => Math.min(profNames.length - 1, i + 1))}
                disabled={mobileProfIdx === profNames.length - 1}
                className="w-[32px] h-[32px] rounded-lg border border-line bg-surface text-ink-2 flex items-center justify-center disabled:opacity-30 transition-colors"
              >
                <Icon name="arrowRight" size={13} />
              </button>
            </div>
          )}

          {/* Grade — desktop: todos profissionais · mobile: profissional selecionado */}
          <div data-tour="schedule-grid" className="bg-surface border border-line rounded-lg overflow-hidden">
            {/* Desktop */}
            <div
              className="hidden md:grid"
              style={{ gridTemplateColumns: `64px repeat(${profNames.length}, 1fr)` }}
            >
              <div className="px-3 py-3 border-b border-r border-line bg-surface-2" />
              {profNames.map((name, idx) => (
                <div key={name} className="px-4 py-3 border-b border-r last:border-r-0 border-line bg-surface-2 flex items-center gap-2.5">
                  <Avatar name={name} index={idx} size="sm" />
                  <div className="font-medium text-[13px] truncate">{name}</div>
                </div>
              ))}
              {TIME_SLOTS.map((slot) => {
                const isHour = slot.endsWith(':00')
                return [
                  <div key={`t-${slot}`}
                    className={`px-2.5 py-1.5 text-right font-mono text-[10.5px] text-ink-3 border-r border-line
                      ${isHour ? 'border-b border-b-line' : 'border-b border-b-line-2 border-dashed'}`}>
                    {isHour ? slot : ''}
                  </div>,
                  ...profNames.map((prof, pi) => {
                    const profObj = profObjects[pi]
                    const wh = breakByProf[profObj?.UUID] ?? null
                    const leaves = leaveByProf[profObj?.UUID] ?? []
                    const appts = appointments.filter((a) => a.Professional === prof && anchoredToSlot(a, slot))
                    const occupied = appointments.some((a) => a.Professional === prof && coversSlot(a, slot) && a.Status !== 'cancelado')
                    const onBreak = coversBreak(wh, slot)
                    const onLeave = leaveCoversSlot(leaves, slot)
                    const leaveBlock = leaveStartsAt(leaves, slot)
                    const lSpans = leaveBlock ? leaveSpans(leaveBlock) : 0
                    const breakStart = isBreakStart(wh, slot)
                    const breakSpans = breakStart ? spanBreak(wh) : 0
                    const past = isSlotPast(date, slot)
                    const clickable = !occupied && !past && !onBreak && !onLeave
                    return (
                      <div key={`${slot}-${prof}-${pi}`}
                        onClick={clickable ? () => setNewSlot({ slot, professional: profObj }) : undefined}
                        className={`relative h-16 border-r last:border-r-0 border-line-2 overflow-visible
                          ${isHour ? 'border-b border-b-line' : 'border-b border-b-line-2'}
                          ${past || onBreak || onLeave ? 'bg-surface-2' : ''}
                          ${clickable ? 'hover:bg-brand-soft cursor-pointer transition-colors' : ''}`}>
                        {(() => {
                          const normalAppts = appts.filter(a => !a.Is_urgent)
                          const urgentAppts = appts.filter(a => a.Is_urgent)
                          return <>
                            {normalAppts.map((a) => {
                              const s = STATUS_STYLE[a.Status] ?? STATUS_STYLE.pendente
                              const { col = 0, totalCols = 1 } = columnMap.get(a.UUID) ?? {}
                              const w = totalCols > 1 ? `calc(${100 / totalCols}% - 4px)` : undefined
                              const left = totalCols > 1 ? `calc(${(col * 100) / totalCols}% + 2px)` : '3px'
                              const right = totalCols > 1 ? undefined : '3px'
                              return (
                                <button
                                  key={a.UUID}
                                  onClick={e => { e.stopPropagation(); navigate(`/agendamento/${a.UUID}`) }}
                                  onContextMenu={e => openContextMenu(e, a)}
                                  onTouchStart={e => handleLongPressStart(e, a)}
                                  onTouchEnd={handleLongPressEnd}
                                  onTouchMove={handleLongPressEnd}
                                  style={{ height: apptHeight(a, 64), top: apptTop(a, slot, 64), width: w, left, right }}
                                  className={`absolute z-10 rounded-md px-2 py-1.5 text-center border cursor-pointer flex flex-col justify-center items-center
                                    hover:opacity-80 transition-opacity overflow-hidden ${s.card}`}
                                >
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
                            {urgentAppts.map((a) => {
                              const s = STATUS_STYLE[a.Status] ?? STATUS_STYLE.pendente
                              return (
                                <button
                                  key={a.UUID}
                                  onClick={e => { e.stopPropagation(); navigate(`/agendamento/${a.UUID}`) }}
                                  onContextMenu={e => openContextMenu(e, a)}
                                  onTouchStart={e => handleLongPressStart(e, a)}
                                  onTouchEnd={handleLongPressEnd}
                                  onTouchMove={handleLongPressEnd}
                                  style={{ height: apptHeight(a, 64), top: apptTop(a, slot, 64) }}
                                  className={`absolute inset-x-[3px] z-20 rounded-md px-2 py-1.5 text-center border-2 border-warning cursor-pointer flex flex-col justify-center items-center
                                    hover:opacity-90 transition-opacity overflow-hidden ${s.card} shadow-md`}
                                >
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
                              {wh.Break_start.slice(0, 5)} – {wh.Break_end.slice(0, 5)}
                            </span>
                          </div>
                        )}
                        {leaveBlock && (
                          <div
                            style={{ height: lSpans * 64 - 4 }}
                            onContextMenu={e => openLeaveMenu(e, leaveBlock)}
                            className="absolute inset-x-[3px] top-[2px] z-10 rounded-md border border-danger/30 bg-danger-soft flex flex-col items-center justify-center gap-0.5 overflow-hidden cursor-context-menu"
                          >
                            <Icon name="x" size={11} className="text-danger" />
                            <span className="font-mono text-[9.5px] text-danger font-medium">Folga</span>
                            {leaveBlock.Reason && (
                              <span className="font-mono text-[9px] text-danger opacity-70 truncate px-1">{leaveBlock.Reason}</span>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  }),
                ]
              })}
            </div>

            {/* Mobile: 1 profissional por vez */}
            <div className="grid md:hidden" style={{ gridTemplateColumns: '56px 1fr' }}>
              {TIME_SLOTS.map((slot) => {
                const prof = profNames[mobileProfIdx]
                const profObj = profObjects[mobileProfIdx]
                const wh = breakByProf[profObj?.UUID] ?? null
                const isHour = slot.endsWith(':00')
                const leaves = leaveByProf[profObj?.UUID] ?? []
                const appts = prof ? appointments.filter((a) => a.Professional === prof && anchoredToSlot(a, slot)) : []
                const occupied = prof ? appointments.some((a) => a.Professional === prof && coversSlot(a, slot) && a.Status !== 'cancelado') : false
                const onBreak = coversBreak(wh, slot)
                const onLeave = leaveCoversSlot(leaves, slot)
                const leaveBlock = leaveStartsAt(leaves, slot)
                const lSpans = leaveBlock ? leaveSpans(leaveBlock) : 0
                const breakStart = isBreakStart(wh, slot)
                const breakSpans = breakStart ? spanBreak(wh) : 0
                const past = isSlotPast(date, slot)
                const clickable = !occupied && !past && !onBreak && !onLeave
                return [
                  <div key={`mt-${slot}`}
                    className={`px-2 py-1.5 text-right font-mono text-[10.5px] border-r border-line
                      ${past ? 'text-ink-4' : 'text-ink-3'}
                      ${isHour ? 'border-b border-b-line' : 'border-b border-b-line-2 border-dashed'}`}>
                    {isHour ? slot : ''}
                  </div>,
                  <div key={`mc-${slot}`}
                    onClick={clickable ? () => setNewSlot({ slot, professional: profObj }) : undefined}
                    className={`relative h-14 overflow-visible border-line-2
                      ${isHour ? 'border-b border-b-line' : 'border-b border-b-line-2'}
                      ${past || onBreak || onLeave ? 'bg-surface-2' : ''}
                      ${clickable ? 'hover:bg-brand-soft cursor-pointer transition-colors' : ''}`}>
                    {(() => {
                      const normalAppts = appts.filter(a => !a.Is_urgent)
                      const urgentAppts = appts.filter(a => a.Is_urgent)
                      return <>
                        {normalAppts.map((a) => {
                          const s = STATUS_STYLE[a.Status] ?? STATUS_STYLE.pendente
                          const { col = 0, totalCols = 1 } = columnMap.get(a.UUID) ?? {}
                          const w = totalCols > 1 ? `calc(${100 / totalCols}% - 4px)` : undefined
                          const left = totalCols > 1 ? `calc(${(col * 100) / totalCols}% + 2px)` : '3px'
                          const right = totalCols > 1 ? undefined : '3px'
                          return (
                            <button
                              key={a.UUID}
                              onClick={e => { e.stopPropagation(); navigate(`/agendamento/${a.UUID}`) }}
                              onContextMenu={e => openContextMenu(e, a)}
                              onTouchStart={e => handleLongPressStart(e, a)}
                              onTouchEnd={handleLongPressEnd}
                              onTouchMove={handleLongPressEnd}
                              style={{ height: apptHeight(a, 56), top: apptTop(a, slot, 56), width: w, left, right }}
                              className={`absolute z-10 rounded-md px-2 py-1.5 text-left border cursor-pointer
                                hover:opacity-80 transition-opacity overflow-hidden ${s.card}`}
                            >
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
                        {urgentAppts.map((a) => {
                          const s = STATUS_STYLE[a.Status] ?? STATUS_STYLE.pendente
                          return (
                            <button
                              key={a.UUID}
                              onClick={e => { e.stopPropagation(); navigate(`/agendamento/${a.UUID}`) }}
                              onContextMenu={e => openContextMenu(e, a)}
                              onTouchStart={e => handleLongPressStart(e, a)}
                              onTouchEnd={handleLongPressEnd}
                              onTouchMove={handleLongPressEnd}
                              style={{ height: apptHeight(a, 56), top: apptTop(a, slot, 56) }}
                              className={`absolute inset-x-[3px] z-20 rounded-md px-2 py-1.5 text-left border-2 border-warning cursor-pointer
                                hover:opacity-90 transition-opacity overflow-hidden ${s.card} shadow-md`}
                            >
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
                        style={{ height: breakSpans * 56 - 4 }}
                        className="absolute inset-x-[3px] top-[2px] z-10 rounded-md border border-line-2 bg-surface-3 flex flex-col items-center justify-center gap-0.5 pointer-events-none overflow-hidden"
                      >
                        <Icon name="clock" size={11} className="text-ink-4" />
                        <span className="font-mono text-[9.5px] text-ink-4">Intervalo</span>
                      </div>
                    )}
                    {leaveBlock && (
                      <div
                        style={{ height: lSpans * 56 - 4 }}
                        className="absolute inset-x-[3px] top-[2px] z-10 rounded-md border border-danger/30 bg-danger-soft flex flex-col items-center justify-center gap-0.5 pointer-events-none overflow-hidden"
                      >
                        <Icon name="x" size={11} className="text-danger" />
                        <span className="font-mono text-[9.5px] text-danger font-medium">Folga</span>
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