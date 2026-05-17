import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Sidebar from '@/components/layout/Sidebar'
import Button from '@/components/ui/Button'
import Chip from '@/components/ui/Chip'
import Avatar from '@/components/ui/Avatar'
import Icon from '@/components/ui/Icons'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import { PageSpinner } from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import { useToast } from '@/context/ToastContext'
import useAuthStore from '@/store/authStore'
import api from '@/lib/api'
import { navItemsByRole } from '@/config/navItems'

const navItems = navItemsByRole['Admin']

const ROLE_FILTERS = ['Todos', 'Admin', 'Profissional', 'Cliente']
const ROLE_FILTER_API = { Cliente: 'Usuario' }

const ROLE_CHIP = {
  Admin: 'brand',
  Profissional: 'warning',
  Usuario: 'default',
}

const ROLE_LABEL = {
  Admin: 'Admin',
  Profissional: 'Profissional',
  Usuario: 'Cliente',
}

function formatBirthday(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${String(d.getUTCDate()).padStart(2,'0')}/${String(d.getUTCMonth()+1).padStart(2,'0')}/${d.getUTCFullYear()}`
}

function applyPhoneMask(value) {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return `(${d}`
  if (d.length <= 7) return `(${d.slice(0,2)}) ${d.slice(2)}`
  if (d.length <= 11) return `(${d.slice(0,2)}) ${d.slice(2,3)} ${d.slice(3,7)}-${d.slice(7)}`
  return value
}

const EMPTY_FORM = { name: '', phone: '', birthday: '' }

export default function AdminUsuarios() {
  const { user } = useAuthStore()
  const { addToast } = useToast()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState('Todos')
  const [toggleTarget, setToggleTarget] = useState(null)
  const [toggling, setToggling] = useState(false)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (roleFilter !== 'Todos') params.Role = ROLE_FILTER_API[roleFilter] ?? roleFilter
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
      addToast(err.response?.data?.error || 'Erro ao atualizar cliente', 'error')
    } finally {
      setToggling(false)
    }
  }

  function validate() {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Nome é obrigatório'
    if (!/^\(\d{2}\) \d \d{4}-\d{4}$/.test(form.phone)) errs.phone = 'Telefone inválido. Ex: (11) 9 9999-9999'
    return errs
  }

  async function handleSave() {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return }
    setSaving(true)
    try {
      const body = { name: form.name.trim(), phone: form.phone }
      if (form.birthday) body.birthday = form.birthday
      await api.post('/auth/register-admin', body)
      addToast(`${form.name} cadastrado com sucesso`, 'success')
      setDrawerOpen(false)
      setForm(EMPTY_FORM)
      setFormErrors({})
      load()
    } catch (err) {
      const msg = err.response?.data?.error
      if (msg?.includes('Telefone')) {
        setFormErrors({ phone: 'Telefone já cadastrado' })
      } else {
        addToast(msg || 'Erro ao cadastrar cliente', 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  function handlePhoneChange(e) {
    setForm((f) => ({ ...f, phone: applyPhoneMask(e.target.value) }))
  }

  const sidebar = (
    <Sidebar navItems={navItems} footerUser={user?.name} footerRole="Admin">Admin</Sidebar>
  )

  return (
    <AppLayout sidebar={sidebar}>
      <div className="flex justify-between items-end mb-5 md:mb-6">
        <div>
          <h3 className="font-display font-medium text-[22px] md:text-[26px] tracking-tight">Clientes</h3>
          <p className="text-[12px] md:text-[13px] text-ink-3 mt-1">Gerencie clientes, profissionais e administradores</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => { setForm(EMPTY_FORM); setFormErrors({}); setDrawerOpen(true) }}>
          <Icon name="plus" size={14} />
          Novo cliente
        </Button>
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
        <EmptyState icon="users" title="Nenhum resultado" description="Nenhum usuário encontrado com os filtros selecionados." />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-surface border border-line rounded-lg overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Cliente', 'Role', 'Telefone', 'Nascimento', 'Status', ''].map((h) => (
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
                          <div className="font-mono text-[11px] text-ink-3">{u.Phone ?? '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3.5 py-3 border-b border-line-2">
                      <Chip variant={ROLE_CHIP[u.Role] ?? 'default'}>{ROLE_LABEL[u.Role] ?? u.Role}</Chip>
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
                    <div className="font-mono text-[11px] text-ink-3 truncate">{u.Phone ?? '—'}</div>
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

      {/* Modal ativar/desativar */}
      <Modal
        isOpen={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleToggleActive}
        title={toggleTarget?.active ? 'Desativar cliente' : 'Ativar cliente'}
        message={
          toggleTarget?.active
            ? `${toggleTarget?.Name} não conseguirá mais fazer login após ser desativado.`
            : `${toggleTarget?.Name} voltará a ter acesso ao sistema.`
        }
        confirmLabel={toggleTarget?.active ? 'Desativar' : 'Ativar'}
        loading={toggling}
      />

      {/* Drawer — cadastro manual */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-ink/20" onClick={() => setDrawerOpen(false)} />
          <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-surface shadow-xl
                          md:inset-y-0 md:right-0 md:left-auto md:w-[400px] md:rounded-none md:border-l md:border-line">

            {/* alça mobile */}
            <div className="flex justify-center pt-3 pb-1 md:hidden">
              <div className="w-10 h-1 rounded-full bg-line-2" />
            </div>

            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <span className="font-display font-medium text-[15px]">Novo cliente</span>
              <button onClick={() => setDrawerOpen(false)} className="p-1.5 rounded-md text-ink-3 hover:bg-surface-2 transition-colors">
                <Icon name="x" size={16} />
              </button>
            </div>

            <div className="p-5 md:p-7 flex flex-col gap-4">
              <Input
                label="Nome completo"
                placeholder="Maria da Silva"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                error={formErrors.name}
              />
              <Input
                label="Telefone"
                placeholder="(11) 9 9999-9999"
                value={form.phone}
                onChange={handlePhoneChange}
                error={formErrors.phone}
              />
              <Input
                label="Data de nascimento (opcional)"
                type="date"
                value={form.birthday}
                onChange={(e) => setForm((f) => ({ ...f, birthday: e.target.value }))}
              />

              <div className="bg-surface-2 border border-line rounded-lg px-4 py-3">
                <p className="text-[12px] text-ink-3 font-body">
                  A senha inicial será <span className="font-mono font-medium text-ink-2">12345678</span>. O usuário poderá alterá-la após o primeiro acesso.
                </p>
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="md" onClick={() => setDrawerOpen(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button variant="primary" size="md" onClick={handleSave} loading={saving} className="flex-1">
                  Cadastrar
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  )
}
