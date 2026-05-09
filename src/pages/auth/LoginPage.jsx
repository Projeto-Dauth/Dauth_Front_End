import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import Button from '@/components/ui/Button'
import Icon from '@/components/ui/Icons'
import api from '@/lib/api'
import useAuthStore from '@/store/authStore'
import { useToast } from '@/context/ToastContext'
import logo from '@/logo-dauth-agendamentos.png'

const ROLE_REDIRECT = {
  Admin: '/admin',
  Profissional: '/profissional',
  Usuario: '/cliente',
}

export default function LoginPage() {
  const [showPass, setShowPass] = useState(false)
  const [apiError, setApiError] = useState('')
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const { addToast } = useToast()

  useEffect(() => {
    if (sessionStorage.getItem('session_expired')) {
      sessionStorage.removeItem('session_expired')
      addToast('Sua sessão expirou. Faça login novamente.', 'warning')
    }
  }, [])

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm()

  const onSubmit = async (data) => {
    setApiError('')
    try {
      const { data: res } = await api.post('/auth/login', {
        phone: data.phone,
        password: data.password,
      })
      const { data: perfil } = await api.get('/users/perfil/me')
      login({ id: perfil.UUID, publicId: perfil.UUID, email: perfil.Email, name: perfil.Name, role: perfil.Role })
      navigate(ROLE_REDIRECT[perfil.Role] ?? '/', { replace: true })
    } catch (err) {
      setApiError(err.response?.data?.error ?? 'Erro ao entrar. Tente novamente.')
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="Dauth" className="w-12 h-12 rounded-xl object-cover mb-4" />
          <h1 className="font-display font-medium text-[28px] tracking-tight">Dauth Agendamentos</h1>
          <p className="text-ink-3 text-[13px] mt-1">Salão Bela Arte</p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-line rounded-[14px] p-8">
          <h3 className="font-display font-medium text-[20px] tracking-tight mb-5">
            Entrar na sua conta
          </h3>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>

            {/* Telefone */}
            <div className="flex flex-col gap-1.5 mb-4">
              <label className="text-[11px] text-ink-3 font-medium uppercase tracking-wider">
                Telefone
              </label>
              <input
                type="tel"
                autoComplete='new-password'
                placeholder="(11) 9 8765-4321"
                className={`h-[42px] px-[14px] rounded-md border bg-surface text-ink-2 font-body text-md
                  placeholder:text-ink-4 focus:outline-none focus:border-brand transition-colors
                  ${errors.phone ? 'border-danger' : 'border-line'}`}
                {...register('phone', { required: 'Telefone obrigatório' })}
                onChange={e => setValue('phone', formatPhone(e.target.value), { shouldValidate: true })}
              />
              {errors.phone && (
                <span className="text-[11px] text-danger">{errors.phone.message}</span>
              )}
            </div>

            {/* Senha */}
            <div className="flex flex-col gap-1.5 mb-6">
              <label className="text-[11px] text-ink-3 font-medium uppercase tracking-wider">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  autoComplete='new-password'
                  placeholder="Mínimo 8 caracteres"
                  className={`h-[42px] w-full pl-[14px] pr-10 rounded-md border bg-surface text-ink-2 font-body text-md
                    placeholder:text-ink-4 focus:outline-none focus:border-brand transition-colors
                    ${errors.password ? 'border-danger' : 'border-line'}`}
                  {...register('password', { required: 'Senha obrigatória' })}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink-2 transition-colors"
                  tabIndex={-1}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    {showPass
                      ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><path d="M1 1l22 22" /></>
                      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
                    }
                  </svg>
                </button>
              </div>
              {errors.password && (
                <span className="text-[11px] text-danger">{errors.password.message}</span>
              )}
            </div>

            {/* Erro da API */}
            {apiError && (
              <div className="mb-4 px-3.5 py-2.5 rounded-md bg-danger-soft border border-danger/20 text-[13px] text-danger">
                {apiError}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>
        </div>

        {/* Footer links */}
        <div className="flex justify-between items-center mt-5 px-1">
          <Link
            to="/register"
            className="text-[13px] text-ink-3 hover:text-ink transition-colors"
          >
            Criar conta
          </Link>
          <Link
            to="/esqueci-senha"
            className="text-[13px] text-ink-3 hover:text-ink transition-colors"
          >
            Esqueci a senha
          </Link>
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
