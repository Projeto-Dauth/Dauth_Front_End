import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import Icon from '@/components/ui/Icons'
import { useToast } from '@/context/ToastContext'
import useAuthStore from '@/store/authStore'
import api from '@/lib/api'

const STEPS = ['Serviço', 'Profissional', 'Data e hora', 'Seus dados', 'Confirmar']
const DOWS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function formatDuration(duration) {
  const [h, m] = duration.split(':').map(Number)
  if (h > 0 && m > 0) return `${h}h ${m}min`
  if (h > 0) return `${h}h`
  return `${m} min`
}

function formatPrice(price) {
  if (!price || price === 0) return 'Consultar'
  return `R$ ${price.toFixed(2).replace('.', ',')}`
}

function buildCalendar(year, month) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  return cells
}

export default function AgendarPage() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const { isAuthenticated, user, login } = useAuthStore()

  const [step, setStep] = useState(0)

  // Step 0 — serviços
  const [services, setServices] = useState([])
  const [categories, setCategories] = useState(['Todas'])
  const [activeCategory, setActiveCategory] = useState('Todas')
  const [loadingServices, setLoadingServices] = useState(true)

  // Step 1 — profissionais
  const [professionals, setProfessionals] = useState([])
  const [loadingProfs, setLoadingProfs] = useState(false)

  // Step 2 — calendário + slots
  const today = new Date()
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState(null)
  const [slots, setSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slotsMessage, setSlotsMessage] = useState('')

  // Step 3 — auth
  const [authMode, setAuthMode] = useState('login')
  const [authLoading, setAuthLoading] = useState(false)
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [registerData, setRegisterData] = useState({ name: '', email: '', phone: '', password: '' })

  // Seleções
  const [selectedServiceId, setSelectedServiceId] = useState(null)
  const [selectedProf, setSelectedProf] = useState(null) // { professional_id, name }
  const [selectedSlot, setSelectedSlot] = useState(null) // { start_time, end_time }

  // Step 4 — confirmar
  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const svc = services.find((s) => s.UUID === selectedServiceId)

  // Carrega serviços ao montar
  useEffect(() => {
    api.get('/public/services')
      .then(({ data }) => {
        setServices(data.data)
        const cats = ['Todas', ...new Set(data.data.map((s) => s.Category).filter(Boolean))]
        setCategories(cats)
      })
      .catch(() => addToast('Erro ao carregar serviços', 'error'))
      .finally(() => setLoadingServices(false))
  }, [])

  // Carrega profissionais ao entrar no step 1
  useEffect(() => {
    if (step !== 1 || !selectedServiceId) return
    setLoadingProfs(true)
    setProfessionals([])
    setSelectedProf(null)
    api.get(`/public/services/${selectedServiceId}/professionals`)
      .then(({ data }) => setProfessionals(data.data))
      .catch(() => addToast('Erro ao carregar profissionais', 'error'))
      .finally(() => setLoadingProfs(false))
  }, [step, selectedServiceId])

  // Busca slots ao selecionar dia
  useEffect(() => {
    if (!selectedDay || !selectedProf || !selectedServiceId) return
    setSlots([])
    setSlotsMessage('')
    setSelectedSlot(null)
    setLoadingSlots(true)
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
    api.get(`/public/availability/${selectedProf.professional_id}?date=${dateStr}&service_id=${selectedServiceId}`)
      .then(({ data }) => {
        setSlots(data.data || [])
        if (data.message) setSlotsMessage(data.message)
      })
      .catch(() => addToast('Erro ao buscar horários', 'error'))
      .finally(() => setLoadingSlots(false))
  }, [selectedDay, calYear, calMonth])

  // Pula step 3 se já autenticado
  useEffect(() => {
    if (step === 3 && isAuthenticated) setStep(4)
  }, [step, isAuthenticated])

  function isDayPast(d) {
    const cell = new Date(calYear, calMonth, d)
    cell.setHours(0, 0, 0, 0)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return cell < now
  }

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1) }
    else setCalMonth((m) => m - 1)
    setSelectedDay(null); setSlots([]); setSlotsMessage(''); setSelectedSlot(null)
  }

  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1) }
    else setCalMonth((m) => m + 1)
    setSelectedDay(null); setSlots([]); setSlotsMessage(''); setSelectedSlot(null)
  }

  const calDays = buildCalendar(calYear, calMonth)

  const canContinue = [
    selectedServiceId !== null,
    selectedProf !== null,
    selectedDay !== null && selectedSlot !== null,
    isAuthenticated,
    true,
  ][step]

  function next() { if (step < 4) setStep((s) => s + 1) }
  function back() { if (step > 0) setStep((s) => s - 1) }

  const filteredServices = activeCategory === 'Todas'
    ? services
    : services.filter((s) => s.Category === activeCategory)

  async function handleLogin(e) {
    e.preventDefault()
    setAuthLoading(true)
    try {
      const { data } = await api.post('/auth/login', loginData)
      login({ id: data.user.id, email: data.user.email, role: data.user.role }, data.access_token, data.refresh_token)
      const { data: perfil } = await api.get('/users/perfil/me')
      login({ id: perfil.UUID, email: perfil.Email, name: perfil.Name, role: perfil.Role }, data.access_token, data.refresh_token)
      setStep(4)
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao fazer login', 'error')
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    setAuthLoading(true)
    try {
      await api.post('/auth/register', registerData)
      const { data } = await api.post('/auth/login', { email: registerData.email, password: registerData.password })
      login({ id: data.user.id, email: data.user.email, role: data.user.role }, data.access_token, data.refresh_token)
      const { data: perfil } = await api.get('/users/perfil/me')
      login({ id: perfil.UUID, email: perfil.Email, name: perfil.Name, role: perfil.Role }, data.access_token, data.refresh_token)
      setStep(4)
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao criar conta', 'error')
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleConfirm() {
    if (!user) return
    setConfirming(true)
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
    try {
      await api.post('/appointment', {
        Client: user.id,
        Professional: selectedProf.professional_id,
        Service: selectedServiceId,
        Date: dateStr,
        Start_time: selectedSlot.start_time,
        End_time: selectedSlot.end_time,
      })
      setConfirmed(true)
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao confirmar agendamento', 'error')
    } finally {
      setConfirming(false)
    }
  }

  const dateLabel = selectedDay
    ? `${String(selectedDay).padStart(2, '0')}/${String(calMonth + 1).padStart(2, '0')}/${calYear}`
    : '—'

  return (
    <div className="min-h-screen bg-bg text-ink">
      {/* Top bar */}
      <div className="flex justify-between items-center px-10 py-[22px] border-b border-line bg-surface sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-ink text-bg flex items-center justify-center font-display font-bold text-base">d</div>
          <div className="font-display font-semibold text-[17px]">Dauth · Bela Arte</div>
        </div>
        {isAuthenticated ? (
          <div className="font-mono text-[12px] text-ink-3">{user?.email}</div>
        ) : (
          <Link to="/login">
            <Button variant="ghost" size="sm">Entrar</Button>
          </Link>
        )}
      </div>

      <div className="max-w-[1120px] mx-auto px-10 pt-10 pb-16">

        {/* Stepper */}
        <div className="flex gap-2 mb-9 p-3 bg-surface border border-line rounded-lg">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={`flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-[10px] text-[13px]
                ${i === step ? 'bg-ink text-bg' : i < step ? 'text-ink-2' : 'text-ink-3'}`}
            >
              <span
                className={`w-6 h-6 rounded-full inline-flex items-center justify-center font-mono text-[11.5px] font-semibold border flex-shrink-0
                  ${i === step ? 'bg-gold text-ink border-transparent'
                    : i < step ? 'bg-success-soft text-success border-transparent'
                    : 'bg-surface-2 text-ink-3 border-line'}`}
              >
                {i < step ? <Icon name="check" size={11} /> : i + 1}
              </span>
              {label}
            </div>
          ))}
        </div>

        {/* ── PASSO 0 — Serviço ───────────────────────────────────────── */}
        {step === 0 && (
          <>
            <h2 className="font-display font-medium text-[32px] tracking-tight mb-2">Qual serviço hoje?</h2>
            <p className="text-ink-2 text-[14.5px] mb-8 max-w-[560px]">
              Filtre pela categoria ou escolha entre os serviços disponíveis.
            </p>
            <div className="flex gap-2 mb-5 flex-wrap">
              {categories.map((cat) => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-2 rounded-full text-[13px] font-medium border cursor-pointer transition-colors
                    ${cat === activeCategory ? 'bg-ink text-bg border-ink' : 'bg-surface-2 text-ink-2 border-line hover:border-ink-3'}`}>
                  {cat}
                </button>
              ))}
            </div>
            {loadingServices ? (
              <div className="flex items-center justify-center h-48 text-ink-3 text-[13px]">Carregando serviços...</div>
            ) : filteredServices.length === 0 ? (
              <div className="flex items-center justify-center h-48 bg-surface border border-line border-dashed rounded-[14px] text-ink-3 text-[13px]">
                Nenhum serviço encontrado
              </div>
            ) : (
              <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                {filteredServices.map((s) => (
                  <button key={s.UUID} onClick={() => setSelectedServiceId(s.UUID)}
                    className={`bg-surface border rounded-[14px] p-[22px] text-left cursor-pointer transition-all
                      ${selectedServiceId === s.UUID ? 'border-brand shadow-[0_0_0_3px_#f1e3d6]' : 'border-line hover:border-ink-3 hover:-translate-y-0.5'}`}>
                    <div className="font-mono text-[10.5px] uppercase tracking-widest text-brand mb-2.5">{s.Category}</div>
                    <div className="font-display font-medium text-[19px] tracking-tight mb-1">{s.Name}</div>
                    <div className="flex justify-between items-center pt-3.5 border-t border-line-2 mt-4">
                      <div className="font-mono text-[12px] text-ink-3 flex items-center gap-1">
                        <Icon name="clock" size={12} />{formatDuration(s.Duration)}
                      </div>
                      <div className="font-display text-[18px] font-medium">{formatPrice(s.Price)}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── PASSO 1 — Profissional ──────────────────────────────────── */}
        {step === 1 && (
          <>
            <h2 className="font-display font-medium text-[32px] tracking-tight mb-2">Escolha o profissional</h2>
            <p className="text-ink-2 text-[14.5px] mb-8 max-w-[560px]">
              Todos os profissionais abaixo realizam <strong>{svc?.Name}</strong>.
            </p>
            {loadingProfs ? (
              <div className="flex items-center justify-center h-48 text-ink-3 text-[13px]">Carregando profissionais...</div>
            ) : professionals.length === 0 ? (
              <div className="flex items-center justify-center h-48 bg-surface border border-line border-dashed rounded-[14px] text-ink-3 text-[13px]">
                Nenhum profissional disponível para este serviço
              </div>
            ) : (
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                {professionals.map((p, idx) => (
                  <button key={p.professional_id} onClick={() => setSelectedProf(p)}
                    className={`bg-surface border rounded-[14px] p-5 flex gap-4 items-center cursor-pointer text-left transition-all
                      ${selectedProf?.professional_id === p.professional_id ? 'border-brand shadow-[0_0_0_3px_#f1e3d6]' : 'border-line hover:border-ink-3'}`}>
                    <Avatar name={p.name} index={idx} size="lg" />
                    <div className="flex-1">
                      <div className="font-display font-medium text-[17px]">{p.name}</div>
                    </div>
                    {selectedProf?.professional_id === p.professional_id && (
                      <div className="w-6 h-6 rounded-full bg-brand flex items-center justify-center flex-shrink-0">
                        <Icon name="check" size={12} className="text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── PASSO 2 — Data e hora ───────────────────────────────────── */}
        {step === 2 && (
          <>
            <h2 className="font-display font-medium text-[32px] tracking-tight mb-2">Escolha a data e horário</h2>
            <p className="text-ink-2 text-[14.5px] mb-8 max-w-[560px]">
              Disponibilidade de <strong>{selectedProf?.name}</strong> para <strong>{svc?.Name}</strong>.
            </p>
            <div className="grid gap-7" style={{ gridTemplateColumns: '1fr 1.1fr' }}>
              {/* Calendário */}
              <div className="bg-surface border border-line rounded-[14px] p-5">
                <div className="flex justify-between items-center mb-3.5">
                  <div className="font-display font-medium text-[16px]">{MONTH_NAMES[calMonth]} {calYear}</div>
                  <div className="flex gap-1">
                    <button onClick={prevMonth} className="w-[30px] h-[30px] rounded-lg border border-line bg-surface text-ink-2 flex items-center justify-center hover:border-ink-3 transition-colors">
                      <Icon name="arrowLeft" size={13} />
                    </button>
                    <button onClick={nextMonth} className="w-[30px] h-[30px] rounded-lg border border-line bg-surface text-ink-2 flex items-center justify-center hover:border-ink-3 transition-colors">
                      <Icon name="arrowRight" size={13} />
                    </button>
                  </div>
                </div>
                <div className="grid mb-1.5" style={{ gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                  {DOWS.map((d, i) => (
                    <div key={i} className="font-mono text-[10.5px] text-ink-3 text-center">{d}</div>
                  ))}
                </div>
                <div className="grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                  {calDays.map((d, i) => {
                    const past = d ? isDayPast(d) : false
                    return (
                      <button
                        key={i}
                        disabled={!d || past}
                        onClick={() => d && !past && setSelectedDay(d)}
                        className={`aspect-square flex items-center justify-center text-[13px] rounded-lg transition-colors
                          ${!d ? '' : selectedDay === d ? 'bg-ink text-bg font-semibold'
                            : past ? 'text-ink-4 cursor-not-allowed'
                            : 'text-ink hover:bg-surface-2 cursor-pointer'}`}
                      >
                        {d}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Slots */}
              <div>
                <div className="font-mono text-[11px] uppercase tracking-widest text-ink-3 mb-3">
                  {selectedDay
                    ? `Horários disponíveis · ${String(selectedDay).padStart(2,'0')}/${String(calMonth+1).padStart(2,'0')}`
                    : 'Selecione uma data'}
                </div>
                {!selectedDay ? (
                  <div className="flex items-center justify-center h-48 bg-surface border border-line border-dashed rounded-[14px] text-ink-3 text-[13px]">
                    Escolha um dia no calendário
                  </div>
                ) : loadingSlots ? (
                  <div className="flex items-center justify-center h-48 text-ink-3 text-[13px]">Buscando horários...</div>
                ) : slots.length === 0 ? (
                  <div className="flex items-center justify-center h-48 bg-surface border border-line border-dashed rounded-[14px] text-ink-3 text-[13px] text-center px-6">
                    {slotsMessage || 'Nenhum horário disponível nesta data'}
                  </div>
                ) : (
                  <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    {slots.map((slot) => (
                      <button
                        key={slot.start_time}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-3 text-center rounded-[10px] border font-mono text-[13px] transition-colors
                          ${selectedSlot?.start_time === slot.start_time
                            ? 'bg-ink text-bg border-ink'
                            : 'bg-surface border-line hover:border-ink-3 cursor-pointer'}`}
                      >
                        {slot.start_time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── PASSO 3 — Auth ──────────────────────────────────────────── */}
        {step === 3 && !isAuthenticated && (
          <>
            <h2 className="font-display font-medium text-[32px] tracking-tight mb-2">Seus dados</h2>
            <p className="text-ink-2 text-[14.5px] mb-8 max-w-[560px]">
              Entre na sua conta ou crie uma nova para finalizar o agendamento.
            </p>
            <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
              {/* Login */}
              <div
                className={`bg-surface border rounded-[14px] p-8 cursor-pointer transition-colors
                  ${authMode === 'login' ? 'border-brand shadow-[0_0_0_3px_#f1e3d6]' : 'border-line hover:border-ink-3'}`}
                onClick={() => setAuthMode('login')}
              >
                <h3 className="font-display font-medium text-[20px] tracking-tight mb-5">Já tenho conta</h3>
                <form onSubmit={handleLogin} onClick={(e) => e.stopPropagation()}>
                  <AuthField label="E-mail" type="email" placeholder="seu@email.com"
                    value={loginData.email} onChange={(v) => setLoginData((d) => ({ ...d, email: v }))} />
                  <AuthField label="Senha" type="password" placeholder="Sua senha"
                    value={loginData.password} onChange={(v) => setLoginData((d) => ({ ...d, password: v }))} />
                  <Button type="submit" variant="primary" className="w-full justify-center mt-2"
                    disabled={authLoading}>
                    {authLoading && authMode === 'login' ? 'Entrando...' : 'Entrar'}
                  </Button>
                </form>
              </div>

              {/* Register */}
              <div
                className={`bg-surface border rounded-[14px] p-8 cursor-pointer transition-colors
                  ${authMode === 'register' ? 'border-brand shadow-[0_0_0_3px_#f1e3d6]' : 'border-line hover:border-ink-3'}`}
                onClick={() => setAuthMode('register')}
              >
                <h3 className="font-display font-medium text-[20px] tracking-tight mb-5">Criar conta</h3>
                <form onSubmit={handleRegister} onClick={(e) => e.stopPropagation()}>
                  <AuthField label="Nome completo" type="text" placeholder="Seu nome"
                    value={registerData.name} onChange={(v) => setRegisterData((d) => ({ ...d, name: v }))} />
                  <AuthField label="E-mail" type="email" placeholder="seu@email.com"
                    value={registerData.email} onChange={(v) => setRegisterData((d) => ({ ...d, email: v }))} />
                  <AuthField label="Telefone" type="tel" placeholder="(11) 9 8765-4321"
                    value={registerData.phone} onChange={(v) => setRegisterData((d) => ({ ...d, phone: v }))} />
                  <AuthField label="Senha" type="password" placeholder="Mínimo 8 caracteres"
                    value={registerData.password} onChange={(v) => setRegisterData((d) => ({ ...d, password: v }))} />
                  <Button type="submit" variant="primary" className="w-full justify-center mt-2"
                    disabled={authLoading}>
                    {authLoading && authMode === 'register' ? 'Criando conta...' : 'Criar conta'}
                  </Button>
                </form>
              </div>
            </div>
          </>
        )}

        {/* ── PASSO 4 — Confirmar ─────────────────────────────────────── */}
        {step === 4 && !confirmed && (
          <>
            <h2 className="font-display font-medium text-[32px] tracking-tight mb-2">Confirmar agendamento</h2>
            <p className="text-ink-2 text-[14.5px] mb-8 max-w-[560px]">
              Revise os detalhes antes de confirmar.
            </p>
            <div className="grid gap-5" style={{ gridTemplateColumns: '1.3fr 1fr' }}>
              <div className="bg-surface border-2 border-ink rounded-2xl p-7">
                {[
                  { k: 'Serviço', v: svc?.Name ?? '—' },
                  { k: 'Duração', v: svc ? formatDuration(svc.Duration) : '—' },
                  { k: 'Profissional', v: selectedProf?.name ?? '—' },
                  { k: 'Data', v: dateLabel },
                  { k: 'Horário', v: selectedSlot?.start_time ?? '—' },
                  { k: 'Total', v: svc ? formatPrice(svc.Price) : '—', total: true },
                ].map(({ k, v, total }) => (
                  <div
                    key={k}
                    className={`flex justify-between items-center py-3.5 border-b border-dashed border-line-2 last:border-0 ${total ? 'pt-4' : ''}`}
                  >
                    <span className="font-mono text-[11px] uppercase tracking-widest text-ink-3">{k}</span>
                    <span className={total ? 'font-display text-[22px] font-medium' : 'text-[14px] font-medium'}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-4">
                <div className="bg-surface border border-line rounded-2xl p-6">
                  <div className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3 mb-3">Profissional</div>
                  <div className="flex items-center gap-3">
                    <Avatar name={selectedProf?.name ?? ''} index={0} size="lg" />
                    <div className="font-display font-medium text-[16px]">{selectedProf?.name}</div>
                  </div>
                </div>
                {user && (
                  <div className="bg-surface border border-line rounded-xl p-4 text-[13px] text-ink-2">
                    <div className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3 mb-1">Conta</div>
                    {user.email}
                  </div>
                )}
                <div className="bg-surface-2 border border-line-2 rounded-xl p-4 text-[13px] text-ink-2">
                  <Icon name="clock" size={14} className="inline mr-1.5 text-ink-3" />
                  Pagamento no local. Cancele com até 2h de antecedência.
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── SUCESSO ─────────────────────────────────────────────────── */}
        {step === 4 && confirmed && (
          <div
            className="border border-line rounded-2xl px-8 py-12 text-center"
            style={{ background: 'linear-gradient(180deg, #e3ebd9 0%, #ffffff 100%)' }}
          >
            <div className="w-16 h-16 rounded-full bg-success text-white inline-flex items-center justify-center mb-5">
              <Icon name="check" size={28} />
            </div>
            <h2 className="font-display font-medium text-[28px] tracking-tight mb-2.5">
              Agendamento confirmado!
            </h2>
            <div className="font-mono text-[14px] text-ink-2 mb-1">
              {svc?.Name} · {dateLabel} · {selectedSlot?.start_time}
            </div>
            <div className="font-mono text-[13px] text-ink-3 mb-8">
              com {selectedProf?.name}
            </div>
            <div className="flex justify-center gap-3">
              <Button variant="primary" onClick={() => navigate('/cliente')}>Ver minha conta</Button>
              <Button variant="ghost" onClick={() => navigate('/')}>Voltar ao início</Button>
            </div>
          </div>
        )}

        {/* ── Navegação ───────────────────────────────────────────────── */}
        {!(step === 4 && confirmed) && (
          <div className="flex justify-between items-center mt-8">
            <Button variant="ghost" onClick={back} disabled={step === 0}>
              <Icon name="arrowLeft" size={14} />Voltar
            </Button>
            {step < 4 ? (
              <Button variant="primary" onClick={next} disabled={!canContinue}>
                Continuar <Icon name="arrowRight" size={14} />
              </Button>
            ) : (
              <Button variant="primary" onClick={handleConfirm} disabled={confirming}>
                <Icon name="check" size={14} />{confirming ? 'Confirmando...' : 'Confirmar agendamento'}
              </Button>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

function maskPhone(v) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
}

function AuthField({ label, type, placeholder, value, onChange }) {
  function handleChange(e) {
    const raw = e.target.value
    onChange(type === 'tel' ? maskPhone(raw) : raw)
  }
  return (
    <div className="flex flex-col gap-1.5 mb-4">
      <label className="text-[11px] text-ink-3 font-medium uppercase tracking-wider">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className="h-[42px] px-[14px] rounded-md border border-line bg-surface text-ink-2 font-body text-md
          placeholder:text-ink-4 focus:outline-none focus:border-brand transition-colors"
      />
    </div>
  )
}
