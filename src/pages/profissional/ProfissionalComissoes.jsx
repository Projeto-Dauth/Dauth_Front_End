import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Sidebar from '@/components/layout/Sidebar'
import Avatar from '@/components/ui/Avatar'
import Chip from '@/components/ui/Chip'
import Icon from '@/components/ui/Icons'
import { PageSpinner } from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import useAuthStore from '@/store/authStore'
import api from '@/lib/api'

const navItems = [
  { to: '/profissional', end: true, icon: 'cal', label: 'Minha agenda' },
  { to: '/profissional/agendamentos', icon: 'receipt', label: 'Agendamentos' },
  { to: '/profissional/comissoes', icon: 'cash', label: 'Minhas comissões' },
  { to: '/profissional/servicos', icon: 'scissors', label: 'Meus serviços' },
  { to: '/profissional/horarios', icon: 'clock', label: 'Meus horários' },
  { type: 'label', label: 'Conta' },
  { to: '/perfil', icon: 'users', label: 'Meu perfil' },
]

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function formatCurrency(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0)
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR')
}

export default function ProfissionalComissoes() {
  const { user } = useAuthStore()
  const now = new Date()
  const [selMonth, setSelMonth] = useState(now.getMonth())
  const [selYear, setSelYear] = useState(now.getFullYear())
  const [data, setData] = useState([])
  const [totais, setTotais] = useState(null)
  const [loading, setLoading] = useState(true)

  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i)
  const monthKey = `${selYear}-${String(selMonth + 1).padStart(2, '0')}`

  useEffect(() => {
    setLoading(true)
    api.get(`/transaction/my-commissions?month=${monthKey}`)
      .then(res => {
        setData(res.data.data ?? [])
        setTotais(res.data.totais ?? null)
      })
      .catch(() => { setData([]); setTotais(null) })
      .finally(() => setLoading(false))
  }, [monthKey])

  const sidebar = (
    <Sidebar navItems={navItems} footerUser={user?.name} footerRole="Profissional">Profissional</Sidebar>
  )

  return (
    <AppLayout sidebar={sidebar}>
      <div className="flex justify-between items-end mb-5 md:mb-6">
        <div>
          <h3 className="font-display font-medium text-[22px] md:text-[26px] tracking-tight">Minhas comissões</h3>
          <p className="text-[12px] md:text-[13px] text-ink-3 mt-1">
            Acompanhe o que você vai receber por período
          </p>
        </div>
      </div>

      {/* Seletor de mês */}
      <div className="flex items-center gap-2 mb-6">
        <select
          value={selMonth}
          onChange={e => setSelMonth(Number(e.target.value))}
          className="h-[38px] px-3 rounded-lg border border-line bg-surface text-ink-2 text-[13px] font-body focus:outline-none focus:border-brand cursor-pointer"
        >
          {MONTHS.map((m, i) => (
            <option key={i} value={i}>{m}</option>
          ))}
        </select>
        <select
          value={selYear}
          onChange={e => setSelYear(Number(e.target.value))}
          className="h-[38px] px-3 rounded-lg border border-line bg-surface text-ink-2 text-[13px] font-body focus:outline-none focus:border-brand cursor-pointer"
        >
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {loading ? <PageSpinner /> : (
        <>
          {/* Cards de totais */}
          {totais && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-surface border border-line rounded-xl p-5 flex flex-col gap-1.5">
                <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-4">Atendimentos</span>
                <span className="text-[26px] font-serif font-light leading-none tracking-wide text-ink">{totais.atendimentos}</span>
              </div>
              <div className="bg-surface border border-line rounded-xl p-5 flex flex-col gap-1.5">
                <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-4">Receita gerada</span>
                <span className="text-[22px] font-serif font-light leading-none tracking-wide text-ink">{formatCurrency(totais.gross_amount)}</span>
              </div>
              <div className="bg-brand border border-brand rounded-xl p-5 flex flex-col gap-1.5">
                <span className="font-mono text-[10.5px] uppercase tracking-widest text-white/70">Comissão a receber</span>
                <span className="text-[22px] font-serif font-light leading-none tracking-wide text-white">{formatCurrency(totais.commission_amount)}</span>
              </div>
            </div>
          )}

          {data.length === 0 ? (
            <EmptyState icon="cash" title="Sem comissões" description="Nenhum atendimento pago registrado neste período." />
          ) : (
            <>
              {/* Tabela — desktop */}
              <div className="bg-surface border border-line rounded-[14px] overflow-hidden hidden md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line bg-surface-2">
                      <th className="text-left px-5 py-3.5 font-mono text-[10.5px] uppercase tracking-widest text-ink-4 font-normal">Data</th>
                      <th className="text-left px-5 py-3.5 font-mono text-[10.5px] uppercase tracking-widest text-ink-4 font-normal">Cliente</th>
                      <th className="text-left px-5 py-3.5 font-mono text-[10.5px] uppercase tracking-widest text-ink-4 font-normal">Serviço</th>
                      <th className="text-right px-5 py-3.5 font-mono text-[10.5px] uppercase tracking-widest text-ink-4 font-normal">Valor do serviço</th>
                      <th className="text-right px-5 py-3.5 font-mono text-[10.5px] uppercase tracking-widest text-ink-4 font-normal">Sua comissão</th>
                      <th className="text-right px-5 py-3.5 font-mono text-[10.5px] uppercase tracking-widest text-ink-4 font-normal">Repasse</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map(row => (
                      <tr key={row.uuid} className="border-b border-line-2 last:border-0 hover:bg-surface-2 transition-colors">
                        <td className="px-5 py-4 font-mono text-[12px] text-ink-3">{formatDate(row.data)}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <Avatar name={row.cliente} index={0} size="sm" />
                            <span className="font-medium text-[13.5px] text-ink">{row.cliente}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-[13px] text-ink-2">{row.servico}</td>
                        <td className="px-5 py-4 text-right font-mono text-[12.5px] text-ink-2">{formatCurrency(row.gross_amount)}</td>
                        <td className="px-5 py-4 text-right">
                          <span className="font-mono text-[13px] font-semibold text-brand">{formatCurrency(row.commission_amount)}</span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Chip variant={row.commission_paid ? 'success' : 'warning'}>
                            {row.commission_paid ? 'Repassado' : 'A repassar'}
                          </Chip>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-line bg-surface-2">
                      <td colSpan={3} className="px-5 py-3.5 font-mono text-[11px] uppercase tracking-widest text-ink-3">
                        Total · {totais?.atendimentos} atendimento{totais?.atendimentos !== 1 ? 's' : ''}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-[12.5px] font-semibold text-ink">{formatCurrency(totais?.gross_amount)}</td>
                      <td className="px-5 py-3.5 text-right font-mono text-[13px] font-semibold text-brand">{formatCurrency(totais?.commission_amount)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Cards — mobile */}
              <div className="md:hidden space-y-3">
                {data.map(row => (
                  <div key={row.uuid} className="bg-surface border border-line rounded-[14px] px-4 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={row.cliente} index={0} size="sm" />
                        <span className="font-medium text-[14px] text-ink">{row.cliente}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-ink-4">{formatDate(row.data)}</span>
                        <Chip variant={row.commission_paid ? 'success' : 'warning'}>
                          {row.commission_paid ? 'Repassado' : 'A repassar'}
                        </Chip>
                      </div>
                    </div>
                    <div className="text-[13px] text-ink-2 mb-3">{row.servico}</div>
                    <div className="flex items-center justify-between pt-3 border-t border-line-2">
                      <div>
                        <div className="font-mono text-[10px] uppercase tracking-widest text-ink-4 mb-0.5">Valor do serviço</div>
                        <div className="font-mono text-[13px] text-ink-2">{formatCurrency(row.gross_amount)}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-[10px] uppercase tracking-widest text-ink-4 mb-0.5">Sua comissão</div>
                        <div className="font-mono text-[14px] font-semibold text-brand">{formatCurrency(row.commission_amount)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </AppLayout>
  )
}
