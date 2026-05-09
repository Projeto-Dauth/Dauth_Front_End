import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import Sidebar from '@/components/layout/Sidebar'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Icon from '@/components/ui/Icons'
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
  { type: 'label', label: 'Conta' },
  { to: '/perfil', icon: 'users', label: 'Meu perfil' },
  { to: '/profissional/servicos', icon: 'scissors', label: 'Meus serviços' },
  { to: '/profissional/horarios', icon: 'clock', label: 'Meus horários' },
]

export default function ConvidarProfissional() {
  const { user } = useAuthStore()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')

  function validate() {
    const e = {}
    if (!name.trim()) e.name = 'Nome obrigatório'
    if (!email.trim()) e.email = 'E-mail obrigatório'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'E-mail inválido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await api.post('/auth/invite', { email: email.trim(), name: name.trim() })
      setSentEmail(email.trim())
      setSent(true)
      addToast(`Convite enviado para ${email.trim()}`)
    } catch (err) {
      addToast(err.response?.data?.error ?? 'Erro ao enviar convite', 'error')
    } finally {
      setLoading(false)
    }
  }

  function handleNovo() {
    setName('')
    setEmail('')
    setErrors({})
    setSent(false)
    setSentEmail('')
  }

  const sidebar = (
    <Sidebar navItems={navItems} footerUser={user?.name} footerRole="Admin">Admin</Sidebar>
  )

  return (
    <AppLayout sidebar={sidebar}>
      <div className="max-w-md">
        {/* Header */}
        <div className="flex items-center gap-3 mb-7">
          <button onClick={() => navigate('/admin/usuarios')} className="text-ink-3 hover:text-ink transition-colors cursor-pointer">
            <Icon name="arrowLeft" size={18} />
          </button>
          <div>
            <h3 className="font-display font-medium text-[26px] tracking-tight">Convidar profissional</h3>
            <p className="text-[13px] text-ink-3 mt-1">
              Um e-mail de ativação será enviado automaticamente
            </p>
          </div>
        </div>

        {/* Sucesso */}
        {sent ? (
          <div className="bg-success-soft border border-success/20 rounded-xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <Icon name="check" size={22} className="text-success" />
            </div>
            <h4 className="font-display font-medium text-[17px] mb-1">Convite enviado!</h4>
            <p className="text-[13px] text-ink-2 mb-1">
              Um e-mail foi enviado para
            </p>
            <p className="font-mono text-[13px] font-medium text-success mb-5">{sentEmail}</p>
            <p className="text-[12px] text-ink-3 mb-6">
              O profissional receberá um link para completar o cadastro informando telefone e data de nascimento.
            </p>
            <div className="flex gap-2.5 justify-center">
              <Button size="sm" onClick={handleNovo}>
                <Icon name="plus" size={13} />Convidar outro
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin/usuarios')}>
                Ver usuários
              </Button>
            </div>
          </div>
        ) : (
          /* Formulário */
          <form onSubmit={handleSubmit} className="bg-surface border border-line rounded-xl p-6">
            <Input
              label="Nome completo"
              value={name}
              onChange={e => setName(e.target.value)}
              error={errors.name}
              placeholder="Ex: Maria Oliveira"
              autoFocus
            />
            <Input
              label="E-mail profissional"
              value={email}
              onChange={e => setEmail(e.target.value)}
              error={errors.email}
              placeholder="maria@salao.com"
              type="email"
            />

            <div className="mt-1 p-3.5 bg-surface-2 rounded-lg border border-line-2 mb-5">
              <p className="text-[12px] text-ink-3 leading-relaxed">
                O Supabase enviará um e-mail com um link de ativação. Ao clicar no link, o profissional será direcionado para completar o cadastro com telefone e data de nascimento.
              </p>
            </div>

            <Button type="submit" disabled={loading} className="w-full justify-center">
              {loading ? 'Enviando...' : 'Enviar convite'}
            </Button>
          </form>
        )}
      </div>
    </AppLayout>
  )
}
