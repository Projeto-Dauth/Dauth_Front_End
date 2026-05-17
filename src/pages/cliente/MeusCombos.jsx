import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Icon from '@/components/ui/Icons'
import { PageSpinner } from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import logo from '@/logo-dauth-agendamentos.png'
import useAuthStore from '@/store/authStore'
import api from '@/lib/api'

const navItems = [
  { to: '/cliente', end: true, icon: 'cal', label: 'Início' },
  { to: '/cliente/agendamentos', icon: 'receipt', label: 'Meus agendamentos' },
  { to: '/cliente/combos', icon: 'package', label: 'Meus combos' },
  { to: '/cliente/comandas', icon: 'cash', label: 'Minhas comandas' },
  { to: '/perfil', icon: 'users', label: 'Perfil e senha' },
]

const statusStyle = {
  ativo:     'bg-success-soft text-success',
  pendente:  'bg-warning-soft text-warning',
  concluido: 'bg-surface-2 text-ink-3',
  cancelado: 'bg-danger-soft text-danger',
}
const statusLabel = {
  ativo:     'Ativo',
  pendente:  'Pendente',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}

function formatDate(str) {
  if (!str) return '—'
  const [y, m, d] = str.split('T')[0].split('-')
  return `${d}/${m}/${y}`
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function ProgressBar({ used, total }) {
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0
  return (
    <div className="h-1.5 bg-line rounded-full overflow-hidden">
      <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${pct}%` }} />
    </div>
  )
}

function ComboCard({ combo }) {
  const pkg = combo.Service_package
  const items = combo.Client_package_items ?? []
  const totalSessions = items.reduce((s, i) => s + i.Total_quantity, 0)
  const usedSessions = items.reduce((s, i) => s + i.Used_quantity, 0)
  const remaining = totalSessions - usedSessions

  return (
    <div className="bg-surface border border-line rounded-2xl p-5 md:p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-widest text-ink-3 mb-1.5">
            <Icon name="package" size={11} />Pacote
          </div>
          <h4 className="font-display font-medium text-[17px] md:text-[18px] tracking-tight">{pkg?.Name ?? '—'}</h4>
          <div className="text-[12px] md:text-[13px] text-ink-3 mt-0.5">
            {pkg?.Price != null ? formatCurrency(pkg.Price) : '—'}
            {pkg?.Available_until && (
              <span className="ml-2">· válido até {formatDate(pkg.Available_until)}</span>
            )}
          </div>
        </div>
        <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full text-xs font-medium ${statusStyle[combo.Status] ?? 'bg-surface-2 text-ink-3'}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {statusLabel[combo.Status] ?? combo.Status}
        </span>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-1.5">
          <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">Sessões</span>
          <span className="font-mono text-[11px] md:text-[12px] text-ink-2">
            {usedSessions} / {totalSessions} usadas · <span className="text-brand">{remaining} restantes</span>
          </span>
        </div>
        <ProgressBar used={usedSessions} total={totalSessions} />
      </div>

      <div className="border-t border-line pt-4 flex flex-col gap-2">
        {items.map((item) => {
          const rest = item.Total_quantity - item.Used_quantity
          return (
            <div key={item.UUID} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[13px] min-w-0">
                <Icon name="scissors" size={12} className="text-ink-4 shrink-0" />
                <span className="truncate">{item.Service?.Name ?? '—'}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-[11px] text-ink-3">
                  {item.Used_quantity}/{item.Total_quantity}
                </span>
                <span className={`font-mono text-[11px] px-2 py-0.5 rounded-full ${rest > 0 ? 'bg-success-soft text-success' : 'bg-surface-2 text-ink-4'}`}>
                  {rest > 0 ? `${rest} rest.` : 'esgotado'}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="border-t border-line pt-3 mt-4 flex flex-col gap-1.5">
        <div className="font-mono text-[10.5px] text-ink-4">
          Adquirido em {combo.Acquired_at ? formatDate(combo.Acquired_at) : formatDate(combo.Created_at)}
        </div>
        {combo.Status === 'ativo' && (
          <div className="flex items-center gap-1.5 font-mono text-[10.5px] text-ink-4">
            <Icon name="alertCircle" size={11} className="shrink-0" />
            Sessões são descontadas após a conclusão do atendimento
          </div>
        )}
      </div>
    </div>
  )
}

function ExplorarCard({ pkg }) {
  const items = pkg.items ?? []

  return (
    <div className="bg-surface border border-line rounded-2xl p-5 md:p-6 flex flex-col">
      <div className="flex justify-between items-start pb-4 border-b border-line-2 mb-4">
        <div className="flex-1 min-w-0 pr-3">
          <div className="font-mono text-[10.5px] uppercase tracking-widest text-brand mb-1">Pacote</div>
          <h4 className="font-display font-medium text-[17px] md:text-[18px] tracking-tight leading-snug">{pkg.Name}</h4>
          {pkg.Available_until && (
            <div className="font-mono text-[11px] text-ink-3 mt-1">Válido até {formatDate(pkg.Available_until)}</div>
          )}
        </div>
        <div className="font-display font-medium text-[20px] md:text-[22px] tracking-tight flex-shrink-0 text-brand">
          {formatCurrency(pkg.Price)}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-2 mb-4">
        {items.length === 0 ? (
          <div className="text-[12px] text-ink-3 italic">Nenhum serviço listado</div>
        ) : items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-[13px]">
            <div className="flex items-center gap-2 min-w-0">
              <Icon name="scissors" size={12} className="text-ink-4 shrink-0" />
              <span className="truncate">{item.Service?.Name ?? item.Name ?? '—'}</span>
            </div>
            <span className="font-mono text-[11.5px] px-2 py-[2px] bg-surface-2 rounded-full text-ink-2 shrink-0 ml-2">
              ×{item.Quantity}
            </span>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-line-2">
        <p className="text-[12px] text-ink-3">Interesse? Fale com a equipe do salão para adquirir este combo.</p>
      </div>
    </div>
  )
}

function ClienteSidebar({ user, onClose }) {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)

  async function handleLogout() {
    try { await api.post('/auth/logout') } catch {}
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="flex flex-col gap-0.5 bg-surface-2 border-r border-line px-4 py-6 w-60 min-w-[240px] h-full overflow-y-auto">
      <div className="flex items-center gap-2.5 px-2 pb-4 mb-1 border-b border-line">
        <img src={logo} alt="Dauth" className="w-11 h-11 rounded-lg object-cover shrink-0" />
        <div className="flex-1 font-display font-semibold text-[13.5px] truncate">Dauth Agendamentos</div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg text-ink-4 hover:bg-surface-3 transition-colors">
            <Icon name="x" size={16} />
          </button>
        )}
      </div>
      <div className="text-center py-3 pb-[18px] border-b border-line mb-3">
        <Avatar name={user?.name ?? ''} index={2} size="xl" className="mx-auto mb-2" />
        <div className="font-display font-medium text-[15px]">{user?.name}</div>
        <div className="font-mono text-[11px] text-ink-3">cliente</div>
      </div>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onClose}
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
      <NavLink to="/agendar" onClick={onClose}>
        <button className="w-full inline-flex justify-center items-center gap-2 px-4 py-[10px] rounded-md font-medium text-md bg-brand text-white border border-brand cursor-pointer hover:bg-[#72391f] transition-colors">
          <Icon name="plus" size={14} />Novo agendamento
        </button>
      </NavLink>
      <div className="border-t border-line mt-2.5">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-2.5 py-[9px] rounded-lg text-[13.5px] text-ink-3 hover:bg-danger-soft hover:text-danger transition-colors cursor-pointer mt-0.5"
        >
          <Icon name="logout" size={16} />
          Sair
        </button>
      </div>
    </aside>
  )
}

export default function MeusCombos() {
  const { user } = useAuthStore()
  const [tab, setTab] = useState('meus')

  const [combos, setCombos] = useState([])
  const [loadingCombos, setLoadingCombos] = useState(true)

  const [catalog, setCatalog] = useState([])
  const [loadingCatalog, setLoadingCatalog] = useState(false)
  const [catalogLoaded, setCatalogLoaded] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    api.get(`/package/client/${user.id}`)
      .then(({ data }) => setCombos(data.data ?? []))
      .catch(() => setCombos([]))
      .finally(() => setLoadingCombos(false))
  }, [user?.id])

  useEffect(() => {
    if (tab !== 'explorar' || catalogLoaded) return
    setLoadingCatalog(true)
    api.get('/package')
      .then(async ({ data }) => {
        const pkgs = data.data ?? []
        const itemResults = await Promise.all(
          pkgs.map((p) => api.get(`/package/${p.UUID}/items`).then((r) => r.data.data ?? []).catch(() => []))
        )
        setCatalog(pkgs.map((p, i) => ({ ...p, items: itemResults[i] })))
        setCatalogLoaded(true)
      })
      .catch(() => setCatalog([]))
      .finally(() => setLoadingCatalog(false))
  }, [tab, catalogLoaded])

  const ativos = combos.filter(c => c.Status === 'ativo' || c.Status === 'pendente')
  const historico = combos.filter(c => c.Status === 'concluido' || c.Status === 'cancelado')

  return (
    <AppLayout sidebar={<ClienteSidebar user={user} />}>
      <div className="flex justify-between items-end mb-5 md:mb-7">
        <div>
          <h3 className="font-display font-medium text-[22px] md:text-[26px] tracking-tight">Combos</h3>
          <p className="text-[12px] md:text-[13px] text-ink-3 mt-1">Seus pacotes e o catálogo disponível</p>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-1 mb-6 md:mb-7 border-b border-line">
        {[
          { key: 'meus', label: 'Meus combos' },
          { key: 'explorar', label: 'Explorar combos' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-3 md:px-4 py-2 md:py-2.5 text-[13px] md:text-[13.5px] font-medium border-b-2 -mb-px transition-colors cursor-pointer
              ${tab === key
                ? 'border-brand text-brand'
                : 'border-transparent text-ink-3 hover:text-ink-2'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Meus combos ── */}
      {tab === 'meus' && (
        loadingCombos ? (
          <PageSpinner />
        ) : combos.length === 0 ? (
          <EmptyState
            icon="package"
            title="Nenhum combo adquirido"
            description="Explore nossos pacotes e economize em cada atendimento."
            action={() => setTab('explorar')}
            actionLabel="Explorar combos"
          />
        ) : (
          <>
            {ativos.length > 0 && (
              <>
                <h4 className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3 mb-3">
                  Ativos · {ativos.length}
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-7 md:mb-8">
                  {ativos.map(c => <ComboCard key={c.UUID} combo={c} />)}
                </div>
              </>
            )}
            {historico.length > 0 && (
              <>
                <h4 className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3 mb-3">
                  Histórico · {historico.length}
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {historico.map(c => <ComboCard key={c.UUID} combo={c} />)}
                </div>
              </>
            )}
          </>
        )
      )}

      {/* ── Explorar combos ── */}
      {tab === 'explorar' && (
        loadingCatalog ? (
          <PageSpinner />
        ) : catalog.length === 0 ? (
          <EmptyState
            icon="package"
            title="Nenhum combo disponível"
            description="Em breve novos pacotes estarão disponíveis."
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {catalog.map(pkg => <ExplorarCard key={pkg.UUID} pkg={pkg} />)}
          </div>
        )
      )}
    </AppLayout>
  )
}
