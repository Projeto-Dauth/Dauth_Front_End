import { createBrowserRouter, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'

// Páginas públicas
import AgendarPage from '@/pages/public/AgendarPage'
import PrivacidadePage from '@/pages/public/PrivacidadePage'
import TermosPage from '@/pages/public/TermosPage'
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
import ProfissionalAgenda from '@/pages/profissional/ProfissionalAgenda'
import MinhaAgenda from '@/pages/profissional/MinhaAgenda'
import ProfissionalHorarios from '@/pages/profissional/ProfissionalHorarios'
import ProfissionalServicos from '@/pages/profissional/ProfissionalServicos'
import ProfissionalComissoes from '@/pages/profissional/ProfissionalComissoes'
import ProfissionalComandas from '@/pages/profissional/ProfissionalComandas'
import ProfissionalProdutos from '@/pages/profissional/ProfissionalProdutos'
import ProfissionalPedidosProdutos from '@/pages/profissional/ProfissionalPedidosProdutos'

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
import AdminComissoes from '@/pages/admin/AdminComissoes'
import ConvidarProfissional from '@/pages/admin/ConvidarProfissional'

// Páginas compartilhadas
import MeuPerfil from '@/pages/shared/MeuPerfil'
import TrocarSenha from '@/pages/shared/TrocarSenha'
import DetalhesAgendamento from '@/pages/shared/DetalhesAgendamento'
import DocsPage from '@/pages/shared/DocsPage'
import { NAV_ITEM_MODULE } from '@/config/modules'

// Página de erro
import NaoAutorizado from '@/pages/NaoAutorizado'
import NotFound from '@/pages/NotFound'

const ALL_ROLES = ['Admin', 'Profissional', 'Usuario']

const router = createBrowserRouter([
  // ── Rotas públicas ───────────────────────────────────────
  // Landing pública mora em dauth.com.br (projeto "Dauth Landing"); este subdomínio é só o app
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/agendar', element: <AgendarPage /> },
  { path: '/privacidade', element: <PrivacidadePage /> },
  { path: '/termos', element: <TermosPage /> },
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
  {
    path: '/docs',
    element: (
      <ProtectedRoute allowedRoles={['Admin', 'Profissional']}>
        <DocsPage />
      </ProtectedRoute>
    ),
  },

  // ── Área do cliente ──────────────────────────────────────
  {
    path: '/cliente',
    element: (
      <ProtectedRoute allowedRoles={['Usuario', 'Admin', 'Profissional']}>
        <ClienteDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/cliente/agendamentos',
    element: (
      <ProtectedRoute allowedRoles={['Usuario', 'Admin', 'Profissional']}>
        <MeusAgendamentos />
      </ProtectedRoute>
    ),
  },
  {
    path: '/cliente/combos',
    element: (
      <ProtectedRoute allowedRoles={['Usuario', 'Admin', 'Profissional']}>
        <MeusCombos />
      </ProtectedRoute>
    ),
  },
  {
    path: '/cliente/comandas',
    element: (
      <ProtectedRoute allowedRoles={['Usuario', 'Admin', 'Profissional']}>
        <MinhasComanadas />
      </ProtectedRoute>
    ),
  },

  // ── Painel do profissional ───────────────────────────────
  {
    path: '/profissional',
    element: (
      <ProtectedRoute allowedRoles={['Profissional', 'Admin']} requiredModule={NAV_ITEM_MODULE['/profissional']}>
        <ProfissionalAgenda />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profissional/agendamentos',
    element: (
      <ProtectedRoute allowedRoles={['Profissional', 'Admin']} requiredModule={NAV_ITEM_MODULE['/profissional/agendamentos']}>
        <MinhaAgenda />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profissional/comandas',
    element: (
      <ProtectedRoute allowedRoles={['Profissional', 'Admin']} requiredModule={NAV_ITEM_MODULE['/profissional/comandas']}>
        <ProfissionalComandas />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profissional/produtos',
    element: (
      <ProtectedRoute allowedRoles={['Profissional', 'Admin']} requiredModule={NAV_ITEM_MODULE['/profissional/produtos']}>
        <ProfissionalProdutos />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profissional/pedidos-produtos',
    element: (
      <ProtectedRoute allowedRoles={['Profissional', 'Admin']} requiredModule={NAV_ITEM_MODULE['/profissional/pedidos-produtos']}>
        <ProfissionalPedidosProdutos />
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
      <ProtectedRoute allowedRoles={['Profissional', 'Admin']} requiredModule={NAV_ITEM_MODULE['/profissional/horarios']}>
        <ProfissionalHorarios />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profissional/comissoes',
    element: (
      <ProtectedRoute allowedRoles={['Profissional', 'Admin']} requiredModule={NAV_ITEM_MODULE['/profissional/comissoes']}>
        <ProfissionalComissoes />
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
    path: '/admin/comissoes',
    element: (
      <ProtectedRoute allowedRoles={['Admin']}>
        <AdminComissoes />
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
