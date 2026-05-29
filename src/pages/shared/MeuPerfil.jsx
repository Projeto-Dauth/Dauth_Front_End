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

import { navItemsByRole } from '@/config/navItems'

function formatDate(str) {
  if (!str) return '—'
  const [y, m, d] = str.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4 py-3 md:py-3.5 border-b border-line-2 last:border-0">
      <div className="text-[11px] sm:text-[12px] text-ink-3 font-medium sm:w-40 sm:shrink-0">{label}</div>
      <div className="text-[13px] md:text-[13.5px] text-ink-2">{value || '—'}</div>
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
  const [exporting, setExporting] = useState(false)

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

  async function handleExport() {
    setExporting(true)
    try {
      const { data } = await api.get('/users/perfil/me/export')
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'meus-dados-dauth.json'
      a.click()
      URL.revokeObjectURL(url)
      addToast('Dados exportados com sucesso')
    } catch {
      addToast('Erro ao exportar dados', 'error')
    } finally {
      setExporting(false)
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      const payload = { Name: name.trim() }
      if (phone.trim()) payload.Phone = phone.trim()
      if (birthday) payload.Birthday = birthday
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
    return (
      <AppLayout sidebar={sidebar}>
        <div className="max-w-lg">
          <div className="flex justify-between items-start mb-7">
            <div className="flex flex-col gap-2">
              <div className="h-7 w-32 bg-surface-2 rounded-lg animate-pulse" />
              <div className="h-4 w-24 bg-surface-2 rounded animate-pulse" />
            </div>
            <div className="h-8 w-20 bg-surface-2 rounded-lg animate-pulse" />
          </div>
          <div className="flex items-center gap-4 mb-5 p-5 bg-surface border border-line rounded-xl">
            <div className="w-12 h-12 rounded-full bg-surface-2 animate-pulse shrink-0" />
            <div className="flex flex-col gap-2">
              <div className="h-4 w-36 bg-surface-2 rounded animate-pulse" />
              <div className="h-3.5 w-44 bg-surface-2 rounded animate-pulse" />
              <div className="h-3 w-16 bg-surface-2 rounded animate-pulse" />
            </div>
          </div>
          <div className="bg-surface border border-line rounded-xl px-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3.5 border-b border-line-2 last:border-0">
                <div className="w-40 h-3.5 bg-surface-2 rounded animate-pulse shrink-0" />
                <div className="h-3.5 bg-surface-2 rounded animate-pulse" style={{ width: `${[120, 160, 100, 90][i]}px` }} />
              </div>
            ))}
          </div>
        </div>
      </AppLayout>
    )
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
        <div className="flex justify-between items-start mb-5 md:mb-7">
          <div>
            <h3 className="font-display font-medium text-[22px] md:text-[26px] tracking-tight">Meu perfil</h3>
            <p className="text-[12px] md:text-[13px] text-ink-3 mt-1">Seus dados pessoais</p>
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
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/trocar-senha')}>
                <Icon name="lock" size={13} />Trocar senha
              </Button>
              <Button variant="ghost" size="sm" onClick={handleExport} loading={exporting}>
                <Icon name="receipt" size={13} />Exportar meus dados
              </Button>
            </div>
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
              <Button type="submit" loading={saving}>
                Salvar alterações
              </Button>
              <Button type="button" variant="ghost" onClick={cancelEdit} disabled={saving}>Cancelar</Button>
            </div>
          </form>
        )}
      </div>
    </AppLayout>
  )
}
