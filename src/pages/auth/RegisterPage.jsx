import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import Button from '@/components/ui/Button'
import api from '@/lib/api'
import useAuthStore from '@/store/authStore'

export default function RegisterPage() {
  const [showPass, setShowPass] = useState(false)
  const [apiError, setApiError] = useState('')
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm()

  const onSubmit = async (data) => {
    setApiError('')
    try {
      await api.post('/auth/register', {
        name: data.name,
        email: data.email,
        phone: data.phone,
        birthday: data.birthday,
        password: data.password,
      })
      // Register não retorna tokens — faz login automático em seguida
      const { data: loginRes } = await api.post('/auth/login', {
        email: data.email,
        password: data.password,
      })
      login({ id: loginRes.user.id, email: loginRes.user.email, role: loginRes.user.role }, loginRes.access_token, loginRes.refresh_token)
      const { data: perfil } = await api.get('/users/perfil/me')
      login({ id: perfil.UUID, email: perfil.Email, name: perfil.Name, role: perfil.Role }, loginRes.access_token, loginRes.refresh_token)
      navigate('/cliente', { replace: true })
    } catch (err) {
      setApiError(err.response?.data?.error ?? 'Erro ao criar conta. Tente novamente.')
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-11 h-11 rounded-xl bg-ink text-bg flex items-center justify-center font-display font-bold text-xl mb-4">
            d
          </div>
          <h1 className="font-display font-medium text-[28px] tracking-tight">Dauth</h1>
          <p className="text-ink-3 text-[13px] mt-1">Salão Bela Arte</p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-line rounded-[14px] p-8">
          <h3 className="font-display font-medium text-[20px] tracking-tight mb-1">
            Criar conta
          </h3>
          <p className="text-[13px] text-ink-3 mb-6">
            Crie sua conta para agendar e acompanhar seus atendimentos.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>

            {/* Nome */}
            <Field label="Nome completo" error={errors.name?.message}>
              <input
                type="text"
                autoComplete='new-password'
                placeholder="Seu nome"
                className={inputClass(errors.name)}
                {...register('name', { required: 'Nome obrigatório' })}
              />
            </Field>

            {/* E-mail */}
            <Field label="E-mail" error={errors.email?.message}>
              <input
                type="email"
                autoComplete='new-password'
                placeholder="seu@email.com"
                className={inputClass(errors.email)}
                {...register('email', {
                  required: 'E-mail obrigatório',
                  pattern: { value: /\S+@\S+\.\S+/, message: 'E-mail inválido' },
                })}
              />
            </Field>

            {/* Telefone */}
            <Field label="Telefone" error={errors.phone?.message}>
              <input
                type="tel"
                autoComplete='new-password'
                placeholder="(11) 9 8765-4321"
                className={inputClass(errors.phone)}
                {...register('phone', { required: 'Telefone obrigatório' })}
                onChange={e => setValue('phone', formatPhone(e.target.value), { shouldValidate: true })}
              />
            </Field>

            {/* Data de nascimento */}
            <Field label="Data de nascimento" error={errors.birthday?.message}>
              <input
                type="date"
                autoComplete='new-password'
                className={inputClass(errors.birthday)}
                {...register('birthday', { required: 'Data de nascimento obrigatória' })}
              />
            </Field>

            {/* Senha */}
            <Field label="Senha" error={errors.password?.message}>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete='new-password'
                  className={`${inputClass(errors.password)} pr-10`}
                  {...register('password', {
                    required: 'Senha obrigatória',
                    minLength: { value: 8, message: 'Mínimo de 8 caracteres' },
                  })}
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
            </Field>

            {/* Erro da API */}
            {apiError && (
              <div className="mb-4 px-3.5 py-2.5 rounded-md bg-danger-soft border border-danger/20 text-[13px] text-danger">
                {apiError}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Criando conta…' : 'Criar conta'}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-5">
          <span className="text-[13px] text-ink-3">Já tem conta? </span>
          <Link to="/login" className="text-[13px] text-ink hover:text-brand transition-colors font-medium">
            Entrar
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

// helpers locais
function Field({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1.5 mb-4">
      <label className="text-[11px] text-ink-3 font-medium uppercase tracking-wider">{label}</label>
      {children}
      {error && <span className="text-[11px] text-danger">{error}</span>}
    </div>
  )
}

function inputClass(error) {
  return `h-[42px] w-full px-[14px] rounded-md border bg-surface text-ink-2 font-body text-md
    placeholder:text-ink-4 focus:outline-none focus:border-brand transition-colors
    ${error ? 'border-danger' : 'border-line'}`
}
