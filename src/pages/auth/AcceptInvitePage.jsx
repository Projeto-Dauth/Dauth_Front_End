import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import { PageSpinner } from '@/components/ui/Spinner'
import api from '@/lib/api'
import useAuthStore from '@/store/authStore'
import logo from '@/logo-dauth-agendamentos.png'

// Lê os parâmetros do hash fragment: #access_token=...&refresh_token=...&type=invite
function parseHash() {
  const hash = window.location.hash.slice(1)
  return Object.fromEntries(new URLSearchParams(hash))
}

export default function AcceptInvitePage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  const [params, setParams] = useState(null)   // { access_token, refresh_token, type }
  const [invalid, setInvalid] = useState(false)

  const [phone, setPhone] = useState('')
  const [birthday, setBirthday] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const p = parseHash()
    if (p.access_token && p.type === 'invite') {
      setParams(p)
    } else {
      setInvalid(true)
    }
  }, [])

  function validate() {
    const e = {}
    if (!phone.trim()) e.phone = 'Telefone obrigatório'
    if (!birthday) e.birthday = 'Data de nascimento obrigatória'
    if (!password || password.length < 8) e.password = 'Senha deve ter no mínimo 8 caracteres'
    if (password !== confirmPassword) e.confirmPassword = 'As senhas não coincidem'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await api.post('/auth/accept-invite', {
        access_token: params.access_token,
        refresh_token: params.refresh_token,
        phone: phone.trim(),
        birthday,
        password,
      })
      // Servidor setou os cookies — busca perfil e redireciona
      const { data: perfil } = await api.get('/users/perfil/me')
      login({ id: perfil.UUID, publicId: perfil.UUID, email: perfil.Email, name: perfil.Name, role: perfil.Role })
      navigate('/profissional', { replace: true })
    } catch (err) {
      setErrors({ api: err.response?.data?.error ?? 'Erro ao ativar conta. O link pode ter expirado.' })
    } finally {
      setLoading(false)
    }
  }

  // Link inválido ou sem token no hash
  if (invalid) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <Brand />
          <div className="bg-danger-soft border border-danger/20 rounded-xl p-6 mt-6">
            <p className="font-display font-medium text-[16px] mb-1">Link inválido</p>
            <p className="text-[13px] text-ink-2">
              O link de convite está incompleto ou expirado. Peça ao administrador que envie um novo convite.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Aguardando parsear o hash
  if (!params) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <PageSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Brand />
          <h1 className="font-display font-medium text-[28px] tracking-tight mt-4">Dauth Agendamentos</h1>
          <p className="text-ink-3 text-[13px] mt-1">Salão da Candi</p>
        </div>

        <div className="bg-surface border border-line rounded-[14px] p-5 md:p-8">
          <h3 className="font-display font-medium text-[20px] tracking-tight mb-1">
            Complete seu cadastro
          </h3>
          <p className="text-[13px] text-ink-3 mb-6">
            Você foi convidado como profissional. Preencha os dados restantes para ativar sua conta.
          </p>

          {errors.api && (
            <div className="mb-4 px-3.5 py-2.5 rounded-md bg-danger-soft border border-danger/20 text-[13px] text-danger">
              {errors.api}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col gap-1.5 mb-4">
              <label className="text-[11px] text-ink-3 font-medium uppercase tracking-wider">Telefone</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(formatPhone(e.target.value))}
                placeholder="(11) 99999-9999"
                className={`h-[42px] px-[14px] rounded-md border bg-surface text-ink-2 font-body text-md
                  placeholder:text-ink-4 focus:outline-none focus:border-brand transition-colors
                  ${errors.phone ? 'border-danger' : 'border-line'}`}
              />
              {errors.phone && <span className="text-[11px] text-danger">{errors.phone}</span>}
            </div>

            <div className="flex flex-col gap-1.5 mb-4">
              <label className="text-[11px] text-ink-3 font-medium uppercase tracking-wider">Data de nascimento</label>
              <input
                type="date"
                value={birthday}
                onChange={e => setBirthday(e.target.value)}
                className={`h-[42px] px-[14px] rounded-md border bg-surface text-ink-2 font-body text-md
                  focus:outline-none focus:border-brand transition-colors
                  ${errors.birthday ? 'border-danger' : 'border-line'}`}
              />
              {errors.birthday && <span className="text-[11px] text-danger">{errors.birthday}</span>}
            </div>

            <div className="flex flex-col gap-1.5 mb-4">
              <label className="text-[11px] text-ink-3 font-medium uppercase tracking-wider">Senha</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className={`h-[42px] w-full px-[14px] pr-10 rounded-md border bg-surface text-ink-2 font-body text-md
                    placeholder:text-ink-4 focus:outline-none focus:border-brand transition-colors
                    ${errors.password ? 'border-danger' : 'border-line'}`}
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink transition-colors cursor-pointer">
                  {showPass ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>
              {errors.password && <span className="text-[11px] text-danger">{errors.password}</span>}
            </div>

            <div className="flex flex-col gap-1.5 mb-6">
              <label className="text-[11px] text-ink-3 font-medium uppercase tracking-wider">Confirmar senha</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  className={`h-[42px] w-full px-[14px] pr-10 rounded-md border bg-surface text-ink-2 font-body text-md
                    placeholder:text-ink-4 focus:outline-none focus:border-brand transition-colors
                    ${errors.confirmPassword ? 'border-danger' : 'border-line'}`}
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink transition-colors cursor-pointer">
                  {showConfirm ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && <span className="text-[11px] text-danger">{errors.confirmPassword}</span>}
            </div>

            <Button type="submit" loading={loading} className="w-full justify-center">
              Ativar minha conta
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits.length ? `(${digits}` : ''
  if (digits.length <= 3) return `(${digits.slice(0,2)}) ${digits[2]}`
  if (digits.length <= 7) return `(${digits.slice(0,2)}) ${digits[2]} ${digits.slice(3)}`
  return `(${digits.slice(0,2)}) ${digits[2]} ${digits.slice(3,7)}-${digits.slice(7)}`
}

function Brand() {
  return (
    <img src={logo} alt="Dauth" className="w-14 h-14 rounded-xl object-cover mx-auto" />
  )
}
