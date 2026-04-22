import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import Sidebar from '@/components/layout/Sidebar'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Avatar from '@/components/ui/Avatar'
import Icon from '@/components/ui/Icons'
import { PageSpinner } from '@/components/ui/Spinner'
import { useToast } from '@/context/ToastContext'
import useAuthStore from '@/store/authStore'
import api from '@/lib/api'

const navItemsByRole = {
  Admin: [
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
  ],
  Profissional: [
    { to: '/profissional', end: true, icon: 'cal', label: 'Minha agenda' },
    { to: '/profissional/agendamentos', icon: 'receipt', label: 'Agendamentos' },
    { to: '/profissional/servicos', icon: 'scissors', label: 'Meus serviços' },
    { to: '/profissional/horarios', icon: 'clock', label: 'Meus horários' },
    { type: 'label', label: 'Conta' },
    { to: '/perfil', icon: 'users', label: 'Meu perfil' },
  ],
  Usuario: [
    { to: '/cliente', end: true, icon: 'cal', label: 'Início' },
    { to: '/cliente/agendamentos', icon: 'receipt', label: 'Meus agendamentos' },
    { to: '/cliente/combos', icon: 'package', label: 'Meus combos' },
    { to: '/perfil', icon: 'users', label: 'Perfil e senha' },
  ],
}

function formatDate(str) {
  if (!str) return '—'
  const [y, m, d] = str.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center gap-4 py-3.5 border-b border-line-2 last:border-0">
      <div className="w-40 text-[12px] text-ink-3 font-medium shrink-0">{label}</div>
      <div className="text-[13.5px] text-ink-2">{value || '—'}</div>
    </div>
  )
}

export default function MeuPerfil() {
  const { user, restoreSession } = useAuthStore()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [birthday, setBirthday] = useState('')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    api.get('/users/perfil/me')
      .then(({ data }) => {
        // API retorna PascalCase: UUID, Name, Email, Role, Phone, Birthday
        const normalized = {
          id: data.UUID,
          name: data.Name,
          email: data.Email,
          role: data.Role,
          phone: data.Phone,
          birthday: data.Birthday,
          active: data.active,
        }
        setProfile(normalized)
        setName(normalized.name ?? '')
        setPhone(normalized.phone ?? '')
        setBirthday(normalized.birthday ? normalized.birthday.slice(0, 10) : '')
      })
      .catch((err) => {
        const msg = err.response?.data?.error ?? `Erro ${err.response?.status ?? 'de conexão'} ao carregar perfil`
        setLoadError(msg)
        console.error('[MeuPerfil] GET /users/perfil/me falhou:', err.response?.status, err.response?.data)
        console.log('[MeuPerfil] access_token no localStorage:', localStorage.getItem('access_token'))
      })
      .finally(() => setLoading(false))
  }, [])

  function startEdit() {
    // Garante que os campos refletem o estado atual antes de abrir o form
    setName(profile.name ?? '')
    setPhone(profile.phone ?? '')
    setBirthday(profile.birthday ? profile.birthday.slice(0, 10) : '')
    setErrors({})
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setErrors({})
  }

  function validate() {
    const e = {}
    if (!name.trim()) e.name = 'Nome obrigatório'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      const payload = { name: name.trim() }
      if (phone.trim()) payload.phone = phone.trim()
      if (birthday) payload.birthday = birthday
      await api.patch('/users/perfil/me', payload)
      const updated = { ...profile, name: name.trim(), phone: phone.trim(), birthday }
      setProfile(updated)
      restoreSession({ ...user, name: name.trim() })
      setEditing(false)
      addToast('Perfil atualizado com sucesso')
    } catch (err) {
      addToast(err.response?.data?.error ?? 'Erro ao salvar', 'error')
    } finally {
      setSaving(false)
    }
  }

  const navItems = navItemsByRole[user?.role] ?? []
  const sidebar = (
    <Sidebar navItems={navItems} footerUser={user?.name} footerRole={user?.role}>
      {user?.role}
    </Sidebar>
  )

  if (loading) {
    return <AppLayout sidebar={sidebar}><PageSpinner /></AppLayout>
  }

  if (loadError) {
    return (
      <AppLayout sidebar={sidebar}>
        <div className="max-w-lg">
          <h3 className="font-display font-medium text-[26px] tracking-tight mb-7">Meu perfil</h3>
          <div className="bg-danger-soft border border-danger/20 rounded-xl p-5">
            <p className="text-[13.5px] text-danger font-medium mb-1">Não foi possível carregar o perfil</p>
            <p className="text-[12.5px] text-danger/80">{loadError}</p>
            <p className="text-[12px] text-ink-3 mt-3">Verifique o console do navegador (F12) para mais detalhes.</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout sidebar={sidebar}>
      <div className="max-w-lg">
        {/* Header */}
        <div className="flex justify-between items-start mb-7">
          <div>
            <h3 className="font-display font-medium text-[26px] tracking-tight">Meu perfil</h3>
            <p className="text-[13px] text-ink-3 mt-1">Seus dados pessoais</p>
          </div>
          {!editing && (
            <Button variant="outline" size="sm" onClick={startEdit}>
              <Icon name="edit" size={13} />Editar
            </Button>
          )}
        </div>

        {/* Avatar card */}
        <div className="flex items-center gap-4 mb-5 p-5 bg-surface border border-line rounded-xl">
          <Avatar name={profile?.name ?? ''} index={0} size="lg" />
          <div>
            <div className="font-display font-medium text-[18px]">{profile?.name}</div>
            <div className="text-[13px] text-ink-3 mt-0.5">{profile?.email}</div>
            <div className="font-mono text-[10.5px] text-ink-4 mt-1.5 uppercase tracking-widest">{profile?.role}</div>
          </div>
        </div>

        {/* View mode */}
        {!editing && (
          <>
            <div className="bg-surface border border-line rounded-xl px-5 mb-4">
              <InfoRow label="Nome completo" value={profile?.name} />
              <InfoRow label="E-mail" value={profile?.email} />
              <InfoRow label="Telefone" value={profile?.phone} />
              <InfoRow label="Data de nascimento" value={formatDate(profile?.birthday)} />
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/trocar-senha')}>
              <Icon name="lock" size={13} />Trocar senha
            </Button>
          </>
        )}

        {/* Edit mode */}
        {editing && (
          <form onSubmit={handleSave} className="bg-surface border border-line rounded-xl p-5">
            <Input
              label="Nome completo"
              value={name}
              onChange={e => setName(e.target.value)}
              error={errors.name}
            />
            <Input
              label="Telefone"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="(11) 99999-9999"
              type="tel"
            />
            <Input
              label="Data de nascimento"
              value={birthday}
              onChange={e => setBirthday(e.target.value)}
              type="date"
            />
            <p className="text-[12px] text-ink-3 mb-4">E-mail não pode ser alterado por aqui.</p>
            <div className="flex gap-2.5">
              <Button type="submit" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </Button>
              <Button type="button" variant="ghost" onClick={cancelEdit} disabled={saving}>
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </div>
    </AppLayout>
  )
}
