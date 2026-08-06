import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
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

// O rate limiter do backend responde { erro }, os controllers respondem { error }
// (string ou array de erros de validação) — normaliza os dois formatos.
function loginErrorMessage(err) {
  if (err.code === 'ECONNABORTED') {
    return 'A conexão demorou demais. Verifique sua internet e tente novamente.'
  }
  if (!err.response) {
    return 'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.'
  }

  const { status, data } = err.response
  const msg = data?.error ?? data?.erro
  // onSubmit encadeia 3 requisições (login → perfil → permissões) e qualquer 401 cai
  // no mesmo catch. O middleware de autorização responde { message }, chave que não é
  // lida acima — sem distinguir a origem, um cookie de sessão recusado pelo navegador
  // aparecia como "telefone ou senha inválidos".
  const isLoginRequest = err.config?.url?.includes('/auth/login')

  if (status === 429) {
    return 'Muitas tentativas de login. Aguarde 15 minutos antes de tentar novamente.'
  }
  if (status >= 500) {
    return 'O servidor está indisponível no momento. Tente novamente em alguns instantes.'
  }
  if (Array.isArray(msg)) return msg.join(' ')
  if (msg) return msg
  if (status === 401) {
    return isLoginRequest
      ? 'Telefone ou senha inválidos.'
      : 'Suas credenciais foram aceitas, mas o navegador não guardou a sessão. Se estiver em uma aba anônima ou com bloqueio de cookies, tente em uma aba normal.'
  }
  if (status === 403) return 'Acesso negado. Sua conta pode estar desativada ou aguardando verificação.'

  return 'Erro ao entrar. Tente novamente.'
}

export default function LoginPage() {
  const [showPass, setShowPass] = useState(false)
  const [apiError, setApiError] = useState('')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
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
      let permissions = null
      if (perfil.Role === 'Profissional') {
        permissions = await api.get(`/professional/${perfil.UUID}/permissions`).then(r => r.data.data).catch(() => null)
      }
      login({ id: perfil.UUID, publicId: perfil.UUID, email: perfil.Email, name: perfil.Name, role: perfil.Role, must_change_password: perfil.Must_change_password ?? false, permissions })
      if (perfil.Must_change_password) {
        navigate('/trocar-senha', { replace: true })
      } else {
        const redirect = searchParams.get('redirect')
        const dest = redirect?.startsWith('/') ? redirect : ROLE_REDIRECT[perfil.Role] ?? '/'
        navigate(dest, { replace: true })
      }
    } catch (err) {
      setApiError(loginErrorMessage(err))
    }
  }

  return (
    <div className="min-h-screen bg-bg flex">

      {/* Brand section — desktop only */}
      <div className="hidden md:flex flex-col justify-between w-[420px] shrink-0 bg-brand px-12 py-14 grain">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Dauth" className="w-11 h-11 rounded-lg object-cover" />
          <span className="font-display font-semibold text-[14px] text-white/90">Dauth Agendamentos</span>
        </div>
        <div>
          <p className="font-serif text-[46px] font-light leading-[1.15] text-white tracking-wide mb-6">
            Beleza com<br />excelência.
          </p>
          <p className="text-[13.5px] text-white/60 leading-relaxed max-w-[280px]">
            Gerencie agendamentos, profissionais e caixa do Salão da Candi em um só lugar.
          </p>
        </div>
        <p className="text-[11px] text-white/30 font-mono tracking-widest uppercase">Salão da Candi</p>
      </div>

      {/* Form side */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">

          {/* Brand — mobile only */}
          <div className="flex flex-col items-center mb-8 md:hidden">
            <img src={logo} alt="Dauth" className="w-14 h-14 rounded-xl object-cover mb-4" />
            <h1 className="font-display font-medium text-[28px] tracking-tight">Dauth Agendamentos</h1>
            <p className="text-ink-3 text-[13px] mt-1">Salão da Candi</p>
          </div>

          {/* Card */}
          <div className="bg-surface border border-line rounded-[14px] p-8">
            <h3 className="font-display font-medium text-[20px] tracking-tight mb-1">
              Entrar na sua conta
            </h3>
            <p className="text-[13px] text-ink-3 mb-6">Bem-vindo de volta.</p>

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
                    placeholder:text-ink-4 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/12 transition-colors
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
                      placeholder:text-ink-4 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/12 transition-colors
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
                loading={isSubmitting}
              >
                Entrar
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

          <div className="flex justify-center gap-4 mt-5 px-1">
            <Link to="/privacidade" className="text-[11.5px] text-ink-4 hover:text-ink-2 transition-colors">
              Privacidade
            </Link>
            <Link to="/termos" className="text-[11.5px] text-ink-4 hover:text-ink-2 transition-colors">
              Termos de Uso
            </Link>
          </div>

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
