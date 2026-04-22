import { useState, useEffect } from 'react'
import { useNavigate, NavLink } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Icon from '@/components/ui/Icons'
import { PageSpinner } from '@/components/ui/Spinner'
import useAuthStore from '@/store/authStore'
import api from '@/lib/api'

const navItems = [
  { to: '/cliente', end: true, icon: 'cal', label: 'Início' },
  { to: '/cliente/agendamentos', icon: 'receipt', label: 'Meus agendamentos' },
  { to: '/perfil', icon: 'users', label: 'Perfil e senha' },
]

const MONTH_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const DOW_FULL = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']

const statusStyle = {
  confirmado: 'bg-success-soft text-success',
  pendente: 'bg-warning-soft text-warning',
  concluido: 'bg-surface-2 text-ink-3',
  cancelado: 'bg-danger-soft text-danger',
}
const statusLabel = {
  confirmado: 'Confirmado',
  pendente: 'Pendente',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}

function parseLocalDate(str) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function daysUntil(dateStr) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = parseLocalDate(dateStr)
  return Math.round((target - today) / 86400000)
}

function ClienteSidebar({ user, sinceYear }) {
  return (
    <aside className="flex flex-col gap-0.5 bg-surface-2 border-r border-line px-4 py-6 w-60 min-w-[240px]">
      <div className="flex items-center gap-2.5 px-2 pb-4 mb-1 border-b border-line">
        <div className="w-8 h-8 rounded-lg bg-ink text-bg flex items-center justify-center font-display font-bold text-base">d</div>
        <div className="font-display font-semibold text-base">Dauth</div>
      </div>
      <div className="text-center py-3 pb-[18px] border-b border-line mb-3">
        <Avatar name={user?.name ?? ''} index={2} size="xl" className="mx-auto mb-2" />
        <div className="font-display font-medium text-[15px]">{user?.name ?? '—'}</div>
        <div className="font-mono text-[11px] text-ink-3">
          {sinceYear ? `cliente desde ${sinceYear}` : 'cliente'}
        </div>
      </div>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-2.5 py-[9px] rounded-lg text-[13.5px] text-ink-2 hover:bg-surface-3 hover:text-ink transition-colors
            ${isActive ? 'bg-surface text-ink border border-line shadow-xs' : ''}`
          }
        >
          <Icon name={item.icon} size={16} />
          {item.label}
        </NavLink>
      ))}
      <div className="flex-1" />
      <NavLink to="/agendar">
        <button className="w-full inline-flex justify-center items-center gap-2 px-4 py-[10px] rounded-md font-medium text-md bg-brand text-white border border-brand cursor-pointer hover:bg-[#72391f] transition-colors">
          <Icon name="plus" size={14} />Novo agendamento
        </button>
      </NavLink>
    </aside>
  )
}

export default function ClienteDashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState([])
  const [sinceYear, setSinceYear] = useState(null)

  useEffect(() => {
    if (!user?.id) return
    Promise.all([
      api.get(`/appointment/client/${user.id}`),
      api.get('/users/perfil/me'),
    ])
      .then(([apptRes, perfilRes]) => {
        setAppointments(apptRes.data.data ?? [])
        if (perfilRes.data.created_at) {
          setSinceYear(new Date(perfilRes.data.created_at).getFullYear())
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user?.id])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const upcoming = appointments
    .filter((a) => {
      const d = parseLocalDate(a.Date)
      return (a.Status === 'confirmado' || a.Status === 'pendente') && d >= today
    })
    .sort((a, b) => {
      const diff = parseLocalDate(a.Date) - parseLocalDate(b.Date)
      if (diff !== 0) return diff
      return (a.Start_time ?? '').localeCompare(b.Start_time ?? '')
    })

  const next = upcoming[0] ?? null

  const recent = [...appointments]
    .sort((a, b) => {
      const diff = parseLocalDate(b.Date) - parseLocalDate(a.Date)
      if (diff !== 0) return diff
      return (b.Start_time ?? '').localeCompare(a.Start_time ?? '')
    })
    .slice(0, 5)

  const nextDate = next ? parseLocalDate(next.Date) : null
  const diff = next ? daysUntil(next.Date) : null
  const diffLabel = diff === 0 ? 'hoje' : diff === 1 ? 'amanhã' : diff != null ? `em ${diff} dias` : null

  const firstName = user?.name?.split(' ')[0] ?? ''

  return (
    <AppLayout sidebar={<ClienteSidebar user={user} sinceYear={sinceYear} />}>
      {loading ? (
        <PageSpinner />
      ) : (
        <>
          {/* Topbar */}
          <div className="flex justify-between items-end mb-7">
            <div>
              <h3 className="font-display font-medium text-[26px] tracking-tight">Olá, {firstName}</h3>
              <div className="text-[13px] text-ink-3 mt-1">
                {next
                  ? `Seu próximo atendimento é ${diffLabel}`
                  : 'Nenhum atendimento agendado'}
              </div>
            </div>
          </div>

          {/* Hero grid */}
          <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: '1.3fr 1fr' }}>
            {/* Next appointment */}
            {next ? (
              <div className="bg-surface border border-line rounded-2xl p-7 flex gap-7 items-center relative">
                <div className="text-center pr-7 border-r border-line-2">
                  <div className="font-display font-medium text-[56px] leading-none tracking-tighter">
                    {nextDate.getDate()}
                  </div>
                  <div className="font-mono text-[11px] uppercase tracking-widest text-ink-3 mt-1.5">
                    {MONTH_SHORT[nextDate.getMonth()]} · {DOW_FULL[nextDate.getDay()].slice(0, 3)}
                  </div>
                  <div className="font-mono text-[14px] mt-2.5">
                    {next.Start_time?.slice(0, 5)} → {next.End_time?.slice(0, 5)}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="font-display font-medium text-[22px] tracking-tight mb-0.5">{next.Service}</div>
                  <div className="font-mono text-[12px] text-ink-3">com {next.Professional}</div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/agendamento/${next.UUID}`)}>
                      Ver detalhes
                    </Button>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full text-xs font-medium absolute top-5 right-5 ${statusStyle[next.Status]}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {statusLabel[next.Status]}
                </span>
              </div>
            ) : (
              <div className="bg-surface border border-line border-dashed rounded-2xl p-7 flex flex-col items-center justify-center gap-3 text-center">
                <Icon name="cal" size={28} className="text-ink-4" />
                <div className="font-display font-medium text-[17px] tracking-tight">Sem agendamentos futuros</div>
                <div className="text-[13px] text-ink-3 max-w-[220px]">Agende um horário e apareça aqui.</div>
                <NavLink to="/agendar">
                  <Button size="sm"><Icon name="plus" size={13} />Agendar agora</Button>
                </NavLink>
              </div>
            )}

            {/* CTA combos */}
            <div
              className="rounded-2xl p-6 border border-line flex flex-col justify-between"
              style={{ background: 'linear-gradient(135deg, #f1e3d6 0%, #f4e9d6 100%)' }}
            >
              <div>
                <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-widest text-brand mb-2.5">
                  <Icon name="package" size={12} />Pacotes e combos
                </div>
                <h4 className="font-display font-medium text-[20px] tracking-tight mb-1.5">
                  Economize com combos
                </h4>
                <div className="text-[12.5px] text-ink-2">
                  Compre sessões em pacote e pague menos em cada atendimento.
                </div>
              </div>
              <div className="mt-5">
                <NavLink to="/agendar">
                  <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md font-medium text-[13px] bg-brand text-white cursor-pointer hover:bg-[#72391f] transition-colors">
                    <Icon name="scissors" size={13} />Agendar serviço
                  </button>
                </NavLink>
                <div className="font-mono text-[11px] text-ink-3 mt-3">
                  Converse com a equipe sobre combos disponíveis.
                </div>
              </div>
            </div>
          </div>

          {/* History header */}
          <div className="flex justify-between items-end mb-3.5">
            <h4 className="font-display font-medium text-[18px] tracking-tight">Histórico recente</h4>
            <NavLink to="/cliente/agendamentos">
              <Button variant="ghost" size="sm">Ver todos <Icon name="arrowRight" size={13} /></Button>
            </NavLink>
          </div>

          {/* History table */}
          {recent.length === 0 ? (
            <div className="flex items-center justify-center h-32 bg-surface border border-line border-dashed rounded-lg text-ink-3 text-[13px]">
              Nenhum agendamento ainda
            </div>
          ) : (
            <div className="bg-surface border border-line rounded-lg overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {['Data', 'Serviço', 'Profissional', 'Status', ''].map((h) => (
                      <th key={h} className="px-3.5 py-3 text-left font-mono text-[10.5px] uppercase tracking-widest text-ink-3 border-b border-line-2">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent.map((row) => (
                    <tr key={row.UUID} className="hover:bg-surface-2 transition-colors">
                      <td className="px-3.5 py-3 font-mono text-[12.5px] border-b border-line-2 last:border-0">
                        {row.Date ? `${row.Date.slice(8,10)}/${row.Date.slice(5,7)} · ${row.Start_time?.slice(0,5)}` : '—'}
                      </td>
                      <td className="px-3.5 py-3 text-[12.5px] border-b border-line-2">{row.Service ?? '—'}</td>
                      <td className="px-3.5 py-3 text-[12.5px] border-b border-line-2">{row.Professional ?? '—'}</td>
                      <td className="px-3.5 py-3 border-b border-line-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full text-xs font-medium ${statusStyle[row.Status] ?? ''}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {statusLabel[row.Status] ?? row.Status}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 text-right border-b border-line-2">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/agendamento/${row.UUID}`)}>
                          Detalhes
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </AppLayout>
  )
}
