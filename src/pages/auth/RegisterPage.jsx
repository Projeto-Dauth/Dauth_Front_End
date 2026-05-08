import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import Button from '@/components/ui/Button'
import api from '@/lib/api'
import logo from '@/logo-dauth-agendamentos.png'

export default function RegisterPage() {
  const [showPass, setShowPass] = useState(false)
  const [apiError, setApiError] = useState('')
  const [registered, setRegistered] = useState(false)

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
        phone: data.phone,
        birthday: data.birthday,
        password: data.password,
      })
      setRegistered(true)
    } catch (err) {
      setApiError(err.response?.data?.error ?? 'Erro ao criar conta. Tente novamente.')
    }
  }

  if (registered) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-8">
            <img src={logo} alt="Dauth" className="w-12 h-12 rounded-xl object-cover mb-4" />
            <h1 className="font-display font-medium text-[28px] tracking-tight">Dauth Agendamentos</h1>
            <p className="text-ink-3 text-[13px] mt-1">Salão Bela Arte</p>
          </div>
          <div className="bg-surface border border-line rounded-[14px] p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-5">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4a6b3e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.58 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l1.62-1.62a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <h3 className="font-display font-medium text-[20px] tracking-tight mb-2">
              Verifique seu WhatsApp
            </h3>
            <p className="text-[13px] text-ink-3 mb-6">
              Enviamos uma mensagem com o link para ativar sua conta. Clique no link para continuar.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center h-[42px] px-6 rounded-md bg-brand text-white font-medium text-[14px] hover:bg-brand/90 transition-colors w-full"
            >
              Ir para o login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="Dauth" className="w-12 h-12 rounded-xl object-cover mb-4" />
          <h1 className="font-display font-medium text-[28px] tracking-tight">Dauth Agendamentos</h1>
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
