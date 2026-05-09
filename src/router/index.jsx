import { createBrowserRouter } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'

// Páginas públicas
import PortalPage from '@/pages/public/PortalPage'
import AgendarPage from '@/pages/public/AgendarPage'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import AcceptInvitePage from '@/pages/auth/AcceptInvitePage'
import VerificarContaPage from '@/pages/auth/VerificarContaPage'
import EsqueciSenhaPage from '@/pages/auth/EsqueciSenhaPage'
import RedefinirSenhaPage from '@/pages/auth/RedefinirSenhaPage'

// Páginas do cliente (Usuario)
import ClienteDashboard from '@/pages/cliente/ClienteDashboard'
import MeusAgendamentos from '@/pages/cliente/MeusAgendamentos'
import MeusCombos from '@/pages/cliente/MeusCombos'
import MinhasComanadas from '@/pages/cliente/MinhasComanadas'

// Páginas do profissional
import ProfissionalPainel from '@/pages/profissional/ProfissionalPainel'
import MinhaAgenda from '@/pages/profissional/MinhaAgenda'
import ProfissionalHorarios from '@/pages/profissional/ProfissionalHorarios'
import ProfissionalServicos from '@/pages/profissional/ProfissionalServicos'

// Páginas do admin
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminAgenda from '@/pages/admin/AdminAgenda'
import AdminAgendamentos from '@/pages/admin/AdminAgendamentos'
import AdminCaixa from '@/pages/admin/AdminCaixa'
import AdminCombos from '@/pages/admin/AdminCombos'
import AdminUsuarios from '@/pages/admin/AdminUsuarios'
import AdminServicos from '@/pages/admin/AdminServicos'
import AdminProdutos from '@/pages/admin/AdminProdutos'
import AdminPedidosProdutos from '@/pages/admin/AdminPedidosProdutos'
import ConvidarProfissional from '@/pages/admin/ConvidarProfissional'

// Páginas compartilhadas
import MeuPerfil from '@/pages/shared/MeuPerfil'
import TrocarSenha from '@/pages/shared/TrocarSenha'
import DetalhesAgendamento from '@/pages/shared/DetalhesAgendamento'

// Página de erro
import NaoAutorizado from '@/pages/NaoAutorizado'
import NotFound from '@/pages/NotFound'

const ALL_ROLES = ['Admin', 'Profissional', 'Usuario']

const router = createBrowserRouter([
  // ── Rotas públicas ───────────────────────────────────────
  { path: '/', element: <PortalPage /> },
  { path: '/agendar', element: <AgendarPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/auth/accept-invite', element: <AcceptInvitePage /> },
  { path: '/verify', element: <VerificarContaPage /> },
  { path: '/esqueci-senha', element: <EsqueciSenhaPage /> },
  { path: '/redefinir-senha', element: <RedefinirSenhaPage /> },

  // ── Conta (compartilhado todos os roles) ─────────────────
  {
    path: '/perfil',
    element: (
      <ProtectedRoute allowedRoles={ALL_ROLES}>
        <MeuPerfil />
      </ProtectedRoute>
    ),
  },
  {
    path: '/trocar-senha',
    element: (
      <ProtectedRoute allowedRoles={ALL_ROLES}>
        <TrocarSenha />
      </ProtectedRoute>
    ),
  },
  {
    path: '/agendamento/:id',
    element: (
      <ProtectedRoute allowedRoles={ALL_ROLES}>
        <DetalhesAgendamento />
      </ProtectedRoute>
    ),
  },

  // ── Área do cliente ──────────────────────────────────────
  {
    path: '/cliente',
    element: (
      <ProtectedRoute allowedRoles={['Usuario', 'Admin']}>
        <ClienteDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/cliente/agendamentos',
    element: (
      <ProtectedRoute allowedRoles={['Usuario', 'Admin']}>
        <MeusAgendamentos />
      </ProtectedRoute>
    ),
  },
  {
    path: '/cliente/combos',
    element: (
      <ProtectedRoute allowedRoles={['Usuario', 'Admin']}>
        <MeusCombos />
      </ProtectedRoute>
    ),
  },
  {
    path: '/cliente/comandas',
    element: (
      <ProtectedRoute allowedRoles={['Usuario', 'Admin']}>
        <MinhasComanadas />
      </ProtectedRoute>
    ),
  },

  // ── Painel do profissional ───────────────────────────────
  {
    path: '/profissional',
    element: (
      <ProtectedRoute allowedRoles={['Profissional', 'Admin']}>
        <ProfissionalPainel />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profissional/agendamentos',
    element: (
      <ProtectedRoute allowedRoles={['Profissional', 'Admin']}>
        <MinhaAgenda />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profissional/servicos',
    element: (
      <ProtectedRoute allowedRoles={['Profissional', 'Admin']}>
        <ProfissionalServicos />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profissional/horarios',
    element: (
      <ProtectedRoute allowedRoles={['Profissional', 'Admin']}>
        <ProfissionalHorarios />
      </ProtectedRoute>
    ),
  },

  // ── Painel admin ─────────────────────────────────────────
  {
    path: '/admin/dashboard',
    element: (
      <ProtectedRoute allowedRoles={['Admin']}>
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={['Admin']}>
        <AdminAgenda />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/agendamentos',
    element: (
      <ProtectedRoute allowedRoles={['Admin']}>
        <AdminAgendamentos />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/caixa',
    element: (
      <ProtectedRoute allowedRoles={['Admin']}>
        <AdminCaixa />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/combos',
    element: (
      <ProtectedRoute allowedRoles={['Admin']}>
        <AdminCombos />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/usuarios',
    element: (
      <ProtectedRoute allowedRoles={['Admin']}>
        <AdminUsuarios />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/servicos',
    element: (
      <ProtectedRoute allowedRoles={['Admin']}>
        <AdminServicos />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/convidar-profissional',
    element: (
      <ProtectedRoute allowedRoles={['Admin']}>
        <ConvidarProfissional />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/produtos',
    element: (
      <ProtectedRoute allowedRoles={['Admin']}>
        <AdminProdutos />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/pedidos-produtos',
    element: (
      <ProtectedRoute allowedRoles={['Admin']}>
        <AdminPedidosProdutos />
      </ProtectedRoute>
    ),
  },

  // ── Erros ────────────────────────────────────────────────
  { path: '/nao-autorizado', element: <NaoAutorizado /> },

  // Rota curinga para capturar links de convite com path duplo (config errada no backend)
  { path: '/auth/accept-invite/*', element: <AcceptInvitePage /> },

  { path: '*', element: <NotFound /> },
])

export default router
