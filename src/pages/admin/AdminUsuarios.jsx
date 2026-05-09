import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Sidebar from '@/components/layout/Sidebar'
import Button from '@/components/ui/Button'
import Chip from '@/components/ui/Chip'
import Avatar from '@/components/ui/Avatar'
import Icon from '@/components/ui/Icons'
import Modal from '@/components/ui/Modal'
import { PageSpinner } from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import { useToast } from '@/context/ToastContext'
import useAuthStore from '@/store/authStore'
import api from '@/lib/api'

const navItems = [
  { to: '/admin/dashboard', end: true, icon: 'chart', label: 'Dashboard' },
  { type: 'label', label: 'Operação' },
  { to: '/admin', end: true, icon: 'cal', label: 'Agenda' },
  { to: '/admin/agendamentos', icon: 'receipt', label: 'Agendamentos' },
  { to: '/admin/usuarios', icon: 'users', label: 'Usuários' },
  { to: '/admin/convidar-profissional', icon: 'plus', label: 'Convidar profissional' },
  { to: '/admin/servicos', icon: 'scissors', label: 'Serviços' },
  { to: '/admin/combos', icon: 'package', label: 'Pacotes' },
  { type: 'label', label: 'Financeiro' },
  { to: '/admin/caixa', icon: 'receipt', label: 'Comandas' },
  { to: '/admin/produtos', icon: 'tag', label: 'Produtos' },
  { to: '/admin/pedidos-produtos', icon: 'cash', label: 'Pedidos de Produtos' },
  { type: 'label', label: 'Conta' },
  { to: '/perfil', icon: 'users', label: 'Meu perfil' },
  { to: '/profissional/servicos', icon: 'scissors', label: 'Meus serviços' },
  { to: '/profissional/horarios', icon: 'clock', label: 'Meus horários' },
]

const ROLE_FILTERS = ['Todos', 'Admin', 'Profissional', 'Usuario', 'Cliente']

const ROLE_CHIP = {
  Admin: 'brand',
  Profissional: 'warning',
  Usuario: 'default',
  Cliente: 'default',
}

function formatBirthday(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${String(d.getUTCDate()).padStart(2,'0')}/${String(d.getUTCMonth()+1).padStart(2,'0')}/${d.getUTCFullYear()}`
}

export default function AdminUsuarios() {
  const { user } = useAuthStore()
  const { addToast } = useToast()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState('Todos')
  const [toggleTarget, setToggleTarget] = useState(null)
  const [toggling, setToggling] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (roleFilter !== 'Todos') params.Role = roleFilter
      const { data } = await api.get('/users', { params })
      setItems(data.data ?? [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [roleFilter])

  useEffect(() => { load() }, [load])

  async function handleToggleActive() {
    if (!toggleTarget) return
    setToggling(true)
    try {
      await api.patch(`/users/${toggleTarget.UUID}`, { active: !toggleTarget.active })
      addToast(
        toggleTarget.active ? `${toggleTarget.Name} desativado` : `${toggleTarget.Name} ativado`,
        'success'
      )
      setToggleTarget(null)
      load()
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao atualizar usuário', 'error')
    } finally {
      setToggling(false)
    }
  }

  const sidebar = (
    <Sidebar navItems={navItems} footerUser={user?.name} footerRole="Admin">Admin</Sidebar>
  )

  return (
    <AppLayout sidebar={sidebar}>
      <div className="flex justify-between items-end mb-5 md:mb-6">
        <div>
          <h3 className="font-display font-medium text-[22px] md:text-[26px] tracking-tight">Usuários</h3>
          <p className="text-[12px] md:text-[13px] text-ink-3 mt-1">Gerencie clientes, profissionais e administradores</p>
        </div>
      </div>

      {/* Filtro de role */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {ROLE_FILTERS.map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={`inline-flex items-center px-2.5 py-[4px] rounded-full text-xs font-medium border cursor-pointer transition-colors
              ${roleFilter === r ? 'bg-ink text-bg border-ink' : 'bg-surface-2 text-ink-2 border-line hover:border-ink-3'}`}
          >
            {r}
          </button>
        ))}
      </div>

      {loading ? (
        <PageSpinner />
      ) : items.length === 0 ? (
        <EmptyState icon="users" title="Nenhum usuário" description="Nenhum usuário encontrado." />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-surface border border-line rounded-lg overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Usuário', 'Role', 'Telefone', 'Nascimento', 'Status', ''].map((h) => (
                    <th key={h} className="px-3.5 py-3 text-left font-mono text-[10.5px] uppercase tracking-widest text-ink-3 border-b border-line-2">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((u, idx) => (
                  <tr key={u.UUID} className="hover:bg-surface-2 transition-colors">
                    <td className="px-3.5 py-3 border-b border-line-2">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.Name} index={idx} size="sm" />
                        <div>
                          <div className="text-[13px] font-medium">{u.Name}</div>
                          <div className="font-mono text-[11px] text-ink-3">{u.Email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3.5 py-3 border-b border-line-2">
                      <Chip variant={ROLE_CHIP[u.Role] ?? 'default'}>{u.Role}</Chip>
                    </td>
                    <td className="px-3.5 py-3 font-mono text-[12px] text-ink-2 border-b border-line-2">{u.Phone ?? '—'}</td>
                    <td className="px-3.5 py-3 font-mono text-[12px] text-ink-2 border-b border-line-2">{formatBirthday(u.Birthday)}</td>
                    <td className="px-3.5 py-3 border-b border-line-2">
                      <Chip variant={u.active ? 'success' : 'danger'}>{u.active ? 'Ativo' : 'Inativo'}</Chip>
                    </td>
                    <td className="px-3.5 py-3 text-right border-b border-line-2">
                      <Button variant="ghost" size="sm" onClick={() => setToggleTarget(u)}>
                        <Icon name={u.active ? 'lock' : 'check'} size={13} />
                        {u.active ? 'Desativar' : 'Ativar'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-2 md:hidden">
            {items.map((u, idx) => (
              <div key={u.UUID} className="bg-surface border border-line rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={u.Name} index={idx} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[14px] truncate">{u.Name}</div>
                    <div className="font-mono text-[11px] text-ink-3 truncate">{u.Email}</div>
                  </div>
                  <Chip variant={u.active ? 'success' : 'danger'}>{u.active ? 'Ativo' : 'Inativo'}</Chip>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Chip variant={ROLE_CHIP[u.Role] ?? 'default'}>{u.Role}</Chip>
                    {u.Phone && <span className="font-mono text-[11px] text-ink-3">{u.Phone}</span>}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setToggleTarget(u)}>
                    <Icon name={u.active ? 'lock' : 'check'} size={13} />
                    {u.active ? 'Desativar' : 'Ativar'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Modal
        isOpen={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleToggleActive}
        title={toggleTarget?.active ? 'Desativar usuário' : 'Ativar usuário'}
        message={
          toggleTarget?.active
            ? `${toggleTarget?.Name} não conseguirá mais fazer login após ser desativado.`
            : `${toggleTarget?.Name} voltará a ter acesso ao sistema.`
        }
        confirmLabel={toggleTarget?.active ? 'Desativar' : 'Ativar'}
        loading={toggling}
      />
    </AppLayout>
  )
}
