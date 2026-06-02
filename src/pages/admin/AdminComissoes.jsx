import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Sidebar from '@/components/layout/Sidebar'
import Avatar from '@/components/ui/Avatar'
import Chip from '@/components/ui/Chip'
import Icon from '@/components/ui/Icons'
import { PageSpinner } from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import { useToast } from '@/context/ToastContext'
import useAuthStore from '@/store/authStore'
import api from '@/lib/api'
import { navItemsByRole } from '@/config/navItems'
import { useTour } from '@/hooks/useTour'
import { adminCaixaComissoesSteps } from '@/tours/adminCaixaComissoes'

const navItems = navItemsByRole['Admin']

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function formatCurrency(v) {
  return `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function groupByProfessional(transactions) {
  const map = {}
  transactions.forEach(tx => {
    const id = tx.professional_id
    if (!map[id]) map[id] = { professional_id: id, name: tx.professional_name, rows: [] }
    map[id].rows.push(tx)
  })
  return Object.values(map)
}

function CommissionSection({ title, groups, markingPaid, onMarcarRepassado, paid = false }) {
  const totalRows = groups.reduce((s, g) => s + g.rows.length, 0)
  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <span className="font-mono text-[11px] uppercase tracking-widest text-ink-3">{title}</span>
        <span className="font-mono text-[11px] text-ink-4">({totalRows})</span>
        <div className="flex-1 border-t border-line-2" />
      </div>
      <div className="space-y-5">
        {groups.map((g, gi) => (
          <div key={g.professional_id} className="bg-surface border border-line rounded-[14px] overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3 bg-surface-2 border-b border-line">
              <Avatar name={g.name} index={gi} size="sm" />
              <span className="font-medium text-[13.5px] text-ink">{g.name}</span>
              <span className="ml-auto font-mono text-[11px] text-ink-4">{g.rows.length} atendimento{g.rows.length !== 1 ? 's' : ''}</span>
              <span className={`font-mono text-[13px] font-semibold ${paid ? 'text-ink-3' : 'text-brand'}`}>
                {formatCurrency(g.rows.reduce((s, r) => s + r.commission_amount, 0))}
              </span>
            </div>

            <table className="w-full text-sm hidden md:table">
              <tbody>
                {g.rows.map(tx => (
                  <tr key={tx.uuid} className="border-b border-line-2 last:border-0 hover:bg-surface-2 transition-colors">
                    <td className="px-5 py-3 text-[13px] text-ink-2">{tx.cliente}</td>
                    <td className="px-5 py-3 text-[12px] text-ink-3">{tx.servico}</td>
                    <td className="px-5 py-3 text-right font-mono text-[12px] text-ink-3">
                      {tx.data ? new Date(tx.data).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-[12px] text-ink">{formatCurrency(tx.gross_amount)}</td>
                    <td className="px-5 py-3 text-right font-mono text-[13px] font-semibold text-brand">{formatCurrency(tx.commission_amount)}</td>
                    <td className="px-5 py-3 text-right">
                      {paid ? (
                        <Chip variant="success">Repassado</Chip>
                      ) : (
                        <button
                          onClick={() => onMarcarRepassado(tx.uuid)}
                          disabled={markingPaid === tx.uuid}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-warning-soft text-warning border border-warning/30 hover:bg-warning/20 cursor-pointer transition-colors disabled:opacity-60">
                          {markingPaid === tx.uuid ? '...' : 'Marcar repassado'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="md:hidden divide-y divide-line-2">
              {g.rows.map(tx => (
                <div key={tx.uuid} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-ink truncate">{tx.cliente}</div>
                    <div className="text-[11px] text-ink-3 truncate">{tx.servico}</div>
                    <div className="font-mono text-[11px] text-ink-4 mt-0.5">
                      {formatCurrency(tx.gross_amount)} · comissão {formatCurrency(tx.commission_amount)}
                    </div>
                  </div>
                  {paid ? (
                    <Chip variant="success">Repassado</Chip>
                  ) : (
                    <button
                      onClick={() => onMarcarRepassado(tx.uuid)}
                      disabled={markingPaid === tx.uuid}
                      className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-warning-soft text-warning border border-warning/30 cursor-pointer transition-colors disabled:opacity-60">
                      {markingPaid === tx.uuid ? '...' : 'Repassar'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

export default function AdminComissoes() {
  const { user } = useAuthStore()
  const { addToast } = useToast()
  const now = new Date()
  const [selMonth, setSelMonth] = useState(now.getMonth())
  const [selYear, setSelYear] = useState(now.getFullYear())
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [markingPaid, setMarkingPaid] = useState(null)

  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i)
  const monthKey = `${selYear}-${String(selMonth + 1).padStart(2, '0')}`

  const { restartTour } = useTour('admin_caixa_comissoes', adminCaixaComissoesSteps, !loading)

  function load(silent = false) {
    if (!silent) setLoading(true)
    api.get(`/transaction/all-commissions?month=${monthKey}`)
      .then(res => setTransactions(res.data.data ?? []))
      .catch(() => setTransactions([]))
      .finally(() => { if (!silent) setLoading(false) })
  }

  useEffect(() => { load() }, [monthKey])

  async function handleMarcarRepassado(txUuid) {
    setMarkingPaid(txUuid)
    try {
      await api.patch(`/transaction/${txUuid}`, { Commission_paid: true })
      addToast('Comissão marcada como repassada', 'success')
      load(true)
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao marcar comissão', 'error')
    } finally {
      setMarkingPaid(null)
    }
  }

  const pendentes = transactions.filter(tx => !tx.commission_paid)
  const repassadas = transactions.filter(tx => tx.commission_paid)
  const totalPendente = pendentes.reduce((s, tx) => s + tx.commission_amount, 0)
  const totalReceita = transactions.reduce((s, tx) => s + tx.gross_amount, 0)

  const groupsPendentes = groupByProfessional(pendentes)
  const groupsRepassadas = groupByProfessional(repassadas)

  const sidebar = (
    <Sidebar navItems={navItems} footerUser={user?.name} footerRole="Admin">Admin</Sidebar>
  )

  return (
    <AppLayout sidebar={sidebar}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 mb-5 md:mb-6">
        <div>
          <h3 className="font-display font-medium text-[22px] md:text-[26px] tracking-tight">Comissões</h3>
          <p className="text-[12px] md:text-[13px] text-ink-3 mt-1">Acompanhe e repasse comissões dos profissionais</p>
          <button onClick={restartTour} className="inline-flex items-center gap-1 text-[11px] text-ink-4 hover:text-brand transition-colors mt-1.5" title="Repetir tour guiado">
            <Icon name="helpCircle" size={12} />
            Ver tour
          </button>
        </div>
        <div className="flex items-center gap-2">
          <select value={selMonth} onChange={e => setSelMonth(Number(e.target.value))}
            className="h-[38px] px-3 rounded-lg border border-line bg-surface text-ink-2 text-[13px] font-body focus:outline-none focus:border-brand cursor-pointer">
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select value={selYear} onChange={e => setSelYear(Number(e.target.value))}
            className="h-[38px] px-3 rounded-lg border border-line bg-surface text-ink-2 text-[13px] font-body focus:outline-none focus:border-brand cursor-pointer">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading ? <PageSpinner /> : transactions.length === 0 ? (
        <EmptyState icon="cash" title="Sem comissões" description="Nenhuma transação paga registrada neste período." />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-surface border border-line rounded-xl p-5 flex flex-col gap-2">
              <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-4">Receita total do período</span>
              <span className="text-[28px] font-serif font-light leading-none tracking-wide text-ink">{formatCurrency(totalReceita)}</span>
            </div>
            <div className="bg-brand border border-brand rounded-xl p-5 flex flex-col gap-2">
              <span className="font-mono text-[10.5px] uppercase tracking-widest text-white/70">Comissões a repassar</span>
              <span className="text-[28px] font-serif font-light leading-none tracking-wide text-white">{formatCurrency(totalPendente)}</span>
            </div>
          </div>

          {groupsPendentes.length > 0 && (
            <CommissionSection
              title="A repassar"
              groups={groupsPendentes}
              markingPaid={markingPaid}
              onMarcarRepassado={handleMarcarRepassado}
            />
          )}

          {groupsRepassadas.length > 0 && (
            <div className={groupsPendentes.length > 0 ? 'mt-8' : ''}>
              <CommissionSection title="Repassadas" groups={groupsRepassadas} paid />
            </div>
          )}
        </>
      )}
    </AppLayout>
  )
}
