# CLAUDE.md — Dauth Agendamentos Frontend

Briefing técnico completo para sessões com Claude Code.

---

## Visão Geral

Frontend do **Dauth Agendamentos**, sistema de gerenciamento para o Salão Bela Arte.
SPA React com 3 perfis de usuário: `Admin`, `Profissional`, `Usuario`.

- **Backend:** Express.js + Supabase
  - Dev: `http://localhost:3000`
  - Produção: `https://back.dauth.com.br`
- **Frontend em produção:** `https://dauth.com.br`
- **Documentação da API:** `API-Documentation.md` (shapes exatos de request/response)
- **JavaScript puro — sem TypeScript**

---

## Stack

| Camada | Tecnologia |
|---|---|
| Bundler | Vite 5 |
| UI | React 18 (JS, sem TS) |
| Estilo | Tailwind CSS v3 com design tokens customizados |
| Roteamento | React Router v6 (`createBrowserRouter`) |
| HTTP | Axios com `withCredentials: true` e interceptor de refresh automático |
| Estado global | Zustand (`useAuthStore`) |
| Formulários | React Hook Form |
| Fontes | Space Grotesk (display) · Inter (body) · JetBrains Mono (mono) · Cormorant Garamond (serif — KPIs e headings editoriais) |

---

## Alias de importação

`@` aponta para `./src` — use sempre `@/components/...`, `@/pages/...`, etc.

---

## Navegação (navItems)

**FONTE ÚNICA:** `src/config/navItems.js` exporta `navItemsByRole` com os 3 roles (`Admin`, `Profissional`, `Usuario`).

```js
import { navItemsByRole } from '@/config/navItems'
```

**Nunca** definir `navItemsByRole` hardcoded dentro de páginas — isso causa o bug de itens sumindo ao navegar para páginas compartilhadas (`MeuPerfil`, `TrocarSenha`, `DetalhesAgendamento`). Todas as páginas admin e profissional importam de `@/config/navItems` usando `const navItems = navItemsByRole['Admin']` ou `navItemsByRole['Profissional']`.

---

## Design System (Tailwind)

**Paleta:**
- `bg` → `#fbf7f4` (fundo da página)
- `surface` / `surface-2` / `surface-3` → fundos de cards
- `ink` / `ink-2` / `ink-3` / `ink-4` → textos (do mais escuro ao mais claro)
- `line` / `line-2` / `line-3` → bordas
- `brand` → `#8b4a2b` (terracota — cor primária)
- `brand-soft` → fundo suave de destaque
- `gold` → `#c9a57b` (dourado — acentos)
- `success` / `warning` / `danger` com variante `-soft`

**Tipografia:**
- Títulos de UI: `font-display font-medium tracking-tight` (Space Grotesk)
- **Valores de KPI / números em destaque:** `font-serif font-light leading-none tracking-wide` (Cormorant Garamond) — usado em KpiCard, AdminCaixa, ProfissionalComissoes, ProfissionalPainel
- Corpo: `font-body` (padrão)
- Códigos/labels: `font-mono text-[10.5px] uppercase tracking-widest`

**Padrão de input:**
```
h-[42px] px-[14px] rounded-md border bg-surface text-ink-2 font-body text-md
placeholder:text-ink-4 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/12 transition-colors
border-line  (normal) | border-danger (com erro)
```

**Sidebar — active state:**
```
bg-brand-soft text-brand border border-brand/20 font-medium
```
(não usar `bg-surface border-line shadow-xs` — contraste insuficiente)

**Scrollbar da sidebar:** suprimida visualmente via `aside::-webkit-scrollbar { display: none }` + `aside { scrollbar-width: none }` em `index.css`. Scroll ainda funciona normalmente.

---

## Estrutura de Arquivos

```
src/
  config/
    navItems.js                 ← FONTE ÚNICA de navItemsByRole (Admin/Profissional/Usuario) — importar em todas as páginas shared e role-aware
  lib/api.js                    ← Axios: withCredentials: true, interceptor de refresh no 401
  store/authStore.js            ← Zustand: { user, isAuthenticated, login, logout, restoreSession }
  store/notificationStore.js    ← Zustand: { unreadCount, notifications, drawerOpen, fetchUnreadCount, fetchNotifications, openDrawer, closeDrawer, markRead, markAllRead }
  context/
    ToastContext.jsx             ← ToastProvider + useToast() — wraps app em main.jsx
  router/
    index.jsx                   ← Todas as rotas
    ProtectedRoute.jsx          ← Guard por role (DEV_BYPASS = false — auth real ativa)
  components/
    ui/
      Button.jsx                ← variants: primary/ghost/outline · sizes: sm/md
      Avatar.jsx                ← gradientes por índice · sizes: sm/md/lg/xl
      Chip.jsx                  ← variants: default/brand/success/warning/danger/ghost + prop status
      Card.jsx                  ← prop elevated para shadow-sm
      Input.jsx                 ← label + error + focus:border-brand
      Icons.jsx                 ← <Icon name="..." size={14} /> — ícones SVG inline
      Modal.jsx                 ← isOpen/onClose/onConfirm/title/message/confirmLabel/loading
      Spinner.jsx               ← <Spinner size="sm|md|lg" /> + <PageSpinner /> (centered)
      EmptyState.jsx            ← icon/title/description/action/actionLabel
    layout/
      AppLayout.jsx             ← mobile-first: sidebar hidden em mobile, drawer overlay com hamburger (usa cloneElement para injetar onClose); logo + nome no header mobile; desktop: flex normal; conteúdo px-4 py-5 mobile / px-8 py-7 desktop; sino de notificações no header mobile com badge; polling fetchUnreadCount a cada 30s via useEffect
      Sidebar.jsx               ← logo-dauth-agendamentos.png + "Dauth Agendamentos"; NavLinks com navItems[], footerUser, footerRole; aceita prop onClose (fecha drawer mobile ao navegar); aside usa overflow-hidden + div interna `.nav-scroll` com overflow-y-auto e min-h-0 para manter footer (sino + logout) sempre visível sem scroll; scrollbar oculta via `.nav-scroll` em index.css; sino de notificações com badge no footer desktop (ao lado do logout)
      NotificationDrawer.jsx    ← bottom sheet mobile / drawer lateral 380px desktop; header com contagem + "Marcar todas como lidas"; lista com ícone por entity (cal/scissors/users/bell), timeAgo, bolinha unread; bg-brand-soft em não lidas; clicar marca como lida; Escape fecha
  pages/
    public/
      PortalPage.jsx            ← Landing page (/) — sem implementação
      AgendarPage.jsx           ← Stepper 5 etapas (serviço → profissional → data/hora → auth → confirmação); barra sticky no rodapé mobile; auth step com tabs mobile login/cadastro — login usa phone/senha, cadastro usa name/phone/birthday/senha (sem email); exibe user.name (não email) no header e nas telas de resumo
    auth/
      LoginPage.jsx             ← POST /auth/login (phone + senha) → GET /users/perfil/me → redireciona por role; campo telefone com máscara (11) 9 8765-4321; logo na brand section
      RegisterPage.jsx          ← POST /auth/register (name, phone, birthday, senha — sem email) → auto-login com phone → /cliente; campo email removido; logo na brand section
      AcceptInvitePage.jsx      ← POST /auth/accept-invite → GET /users/perfil/me → /profissional; logo via componente Brand; card padding p-5 md:p-8
      VerificarContaPage.jsx    ← POST /auth/verify (token da URL) → exibe "Conta verificada! → Ir para o login" (sem auto-login)
      EsqueciSenhaPage.jsx      ← POST /auth/forgot-password { phone } → tela de sucesso "Verifique seu WhatsApp"; resposta sempre neutra
      RedefinirSenhaPage.jsx    ← lê ?token= da URL; POST /auth/reset-password { token, password } → toast sucesso → redirect /login; tela de erro se token ausente na URL
    shared/
      MeuPerfil.jsx             ← GET/PATCH /users/perfil/me — sidebar role-aware via navItemsByRole[user.role], rota /perfil; InfoRow empilha em mobile (flex-col sm:flex-row)
      TrocarSenha.jsx           ← PATCH /users/perfil/me/password — rota /trocar-senha
      DetalhesAgendamento.jsx   ← GET /appointment/:id + PATCH Status — rota /agendamento/:id; para Admin/Profissional: card "Últimas visitas" com GET /appointment/my?client_name=X&limit=6 (filtro no backend)
    cliente/
      ClienteDashboard.jsx      ← ClienteSidebar local com logo; grid hero empilhado mobile / 1.3fr·1fr desktop; histórico como cards mobile (md:hidden) / tabela desktop (hidden md:block); clicar em "Ver detalhes" abre AppointmentPanel inline (não navega para /agendamento/:id) — bottom sheet no mobile (sobe de baixo, max-h 85vh, alça cinza, canto arredondado) e drawer lateral no desktop (420px, borda esquerda, altura total)
      MeusAgendamentos.jsx      ← GET /appointment/client/:id + filtro status; tabela hidden md:block / cards md:hidden
      MeusCombos.jsx            ← GET /package/client/:id — cards com barra de progresso, seções Ativos/Histórico; grid grid-cols-1 lg:grid-cols-2; aviso "Sessões são descontadas após a conclusão do atendimento" exibido apenas em pacotes com Status='ativo'
    profissional/
      ProfissionalPainel.jsx    ← Now-card dark + próximos + grade de horários — integrado
      MinhaAgenda.jsx           ← GET /appointment/my + filtros data/status; badge de status da comanda (Paga/Em aberto) via campo `tab_status` retornado diretamente no appointment — sem chamada extra ao /tab
      ProfissionalServicos.jsx  ← Vincular/desvincular serviços — GET /service + GET/POST /service/:id/professionals + DELETE /service/professionals/:linkId
      ProfissionalHorarios.jsx  ← CRUD horários semanais — GET/POST/PATCH/DELETE /working-hours
      ProfissionalComissoes.jsx ← Visualização de comissões do profissional autenticado — GET /transaction/my-commissions?month=YYYY-MM; seletor mês/ano, 3 cards (atendimentos, receita gerada, comissão a receber em brand), tabela desktop + cards mobile; badge "Repassado"/"A repassar" por linha via campo commission_paid
      ProfissionalPainel.jsx    ← 3 KPI mini-cards (total hoje, concluídos, a atender) calculados dos appointments já carregados — sem nova chamada API; grid Agora + A seguir + Horários + Serviços
    admin/
      AdminAgenda.jsx           ← Grade por profissional + navegação de dia; barra de navegação: setas prev/next + ícone de calendário (abre datepicker nativo via input[type="date"] sobreposto opacity-0) + botão Hoje; mobile: seletor de profissional (prev/next + contador N/total), desktop: grid completo; ambos com hidden md:grid / grid md:hidden; agendamentos renderizados como bloco único com altura calculada por duração (spanSlots × cellHeight); slots vazios clicáveis abrem NovoAgendamentoDrawer (bottom sheet mobile / drawer 420px desktop) com profissional e horário pré-preenchidos; slots passados (data anterior ou horário anterior ao atual no dia de hoje) ficam com bg-surface-2 e sem interação — função isSlotPast(date, slot); slots ocupados (coversSlot) também bloqueados; ao salvar chama load() para recarregar a grade; **agendamentos cancelados são filtrados no load() e não aparecem na grade** — ficam visíveis apenas em AdminAgendamentos; **context menu (clique direito desktop / long press 500ms mobile)** em blocos de agendamento abre AppointmentContextMenu com opções dinâmicas por status: "Marcar como Confirmado" (pendente), "Marcar como Concluído" (confirmado), "Marcar como Cancelado" (pendente|confirmado), "Abrir comanda" (não cancelado → /admin/caixa?appointment=UUID), "Ver detalhes" (sempre → /agendamento/UUID); onTouchMove cancela o long press para não disparar durante scroll; menu reposiciona automaticamente próximo à borda da tela
      AdminAgendamentos.jsx     ← GET /appointment + filtros data/status; tabela hidden md:block / cards md:hidden
      AdminDashboard.jsx        ← GET /dashboard; KPIs hoje/mês (grid 4 colunas no mês: receita, ticket, comandas, cancelamentos), gráfico de área 30d, top serviços (bar horizontal), ranking de profissionais (tabela desktop + cards mobile); bug de footerUser corrigido (sidebar footer com logout agora sempre visível)
      AdminCaixa.jsx            ← Tab switcher "Comandas | Comissões | Relatório"; Comandas: lista + painel de pagamento + botão "Fechar conta · {nome}" (≥2 comandas em aberto, chama POST /tab/batch-pay); **deep link via ?appointment=UUID** — lê useSearchParams, passa initialAppointmentId para TabComandas que após load() faz tabs.find(t => t.Appointment?.UUID === id) e seta selectedId automaticamente (se não encontrar, seleciona a primeira tab); Comissões: GET /transaction/all-commissions?month=YYYY-MM — transações individuais agrupadas por profissional, duas seções ("A repassar" / "Repassadas"), botão "Marcar repassado" por linha (PATCH /transaction/:id { Commission_paid: true }), totalizadores receita + comissões pendentes; Relatório: GET /dashboard/payments, filtro De/Até, cards por método + total
      AdminCombos.jsx           ← Grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 + CRUD + vender combo; drawers w-full md:w-[400-420px] com p-5 md:p-7
      AdminUsuarios.jsx         ← GET /users + PATCH /users/:id (ativar/desativar) + modal para Admin cadastrar novo usuário diretamente (POST /auth/register-admin, senha padrão 12345678, Must_change_password=true); tabela hidden md:block / cards md:hidden
      AdminServicos.jsx         ← CRUD serviços + categorias; tabelas hidden md:block / cards md:hidden; todos os drawers w-full md:w-[360-420px] com p-5 md:p-7
      ConvidarProfissional.jsx  ← POST /auth/invite — max-w-md, já responsivo
    NaoAutorizado.jsx
    NotFound.jsx
```

---

## Icons disponíveis

`cal · users · scissors · tag · package · receipt · chart · settings · plus · arrowLeft · arrowRight · check · filter · clock · phone · bell · search · cash · card · qr · x · lock · eye · eyeOff · logout · chevronRight · alertCircle · edit · trash`

---

## Toast

```jsx
import { useToast } from '@/context/ToastContext'
const { addToast } = useToast()
addToast('Mensagem', 'success' | 'error' | 'warning')
```

Provider já está em `main.jsx` — não precisa adicionar em cada página.

---

## Modal

```jsx
import Modal from '@/components/ui/Modal'
<Modal
  isOpen={modal}
  onClose={() => setModal(false)}
  onConfirm={handleConfirm}
  title="Confirmar ação"
  message="Esta ação é irreversível."
  confirmLabel="Confirmar"
  loading={saving}
/>
```

---

## Spinner / EmptyState

```jsx
import { PageSpinner } from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
// loading state: return <AppLayout sidebar={sidebar}><PageSpinner /></AppLayout>
// empty state: <EmptyState icon="cal" title="Sem dados" description="..." action={fn} actionLabel="Criar" />
```

---

## Autenticação

O backend usa **httpOnly cookies** para sessão. Os tokens nunca aparecem no corpo das respostas nem no localStorage — o navegador os gerencia automaticamente.

### Modelo de sessão

- Cookies `access_token` e `refresh_token` são httpOnly — JS não consegue lê-los
- `withCredentials: true` em toda requisição axios garante que o navegador os envie
- O estado da aplicação (`useAuthStore`) só guarda dados do usuário, nunca tokens
- Nenhum token é persistido no localStorage
- **Exceção intencional:** `auth_public_id` é salvo no localStorage — é o UUID do Supabase Auth (`res.user.id`), necessário para `POST /appointment { Client }`. Não é dado sensível (é só um identificador), mas não existe no retorno de `GET /users/perfil/me`, então precisa sobreviver a reloads

### Fluxo de login
```js
// POST /auth/login recebe { phone, password } — NÃO usa email
// Formato obrigatório do phone: "(11) 9 8765-4321" (máscara aplicada no input)
// Retorna: { expires_in, user: { id, phone, role } } — tokens chegam via Set-Cookie httpOnly
// Após o login, sempre buscar GET /users/perfil/me para obter UUID correto:
const { data: res } = await api.post('/auth/login', { phone, password })
const { data: perfil } = await api.get('/users/perfil/me')
login({ id: perfil.UUID, publicId: perfil.UUID, email: perfil.Email, name: perfil.Name, role: perfil.Role })
// Redireciona por role (usar perfil.Role, não res.user.role):
Admin → /admin | Profissional → /profissional | Usuario → /cliente
```

### Fluxo de register
```js
// POST /auth/register recebe { name, phone, birthday, password } — SEM email
// Retorna { message } — conta criada com active=false, aguarda verificação via WhatsApp
// Sem auto-login: exibe tela "Verifique seu WhatsApp" e aguarda o usuário clicar no link
await api.post('/auth/register', { name, phone, birthday, password })
// → setRegistered(true) → tela de instrução com botão "Ir para o login"
// O usuário só consegue logar após clicar no link do WhatsApp e verificar a conta
```

### Fluxo de logout
```js
// authStore.logout() apenas limpa o estado local — NÃO chama a API
// Quem dispara o logout deve chamar POST /auth/logout explicitamente antes:
import api from '@/lib/api'
import useAuthStore from '@/store/authStore'

async function handleLogout() {
  try { await api.post('/auth/logout') } catch {}
  useAuthStore.getState().logout()
  navigate('/login')
}
// NÃO basta limpar estado local — o endpoint é obrigatório para o servidor apagar os cookies
// O interceptor de 401 também chama logout() ao detectar sessão expirada (sem chamar a API,
// pois já sabemos que o servidor rejeitou)
```

### Fluxo de refresh silencioso
```js
// 401 em qualquer rota não-/auth/* → interceptor chama POST /auth/refresh (sem body)
// Servidor lê o cookie refresh_token e responde { expires_in } + novos cookies via Set-Cookie
// Se refresh falhar → window.location.href = '/login'
```

### Fluxo de convite de profissional
```js
// 1. Admin chama POST /auth/invite → { message }
//    body: { email, name }
// 2. Supabase envia email com link:
//    https://project.supabase.co/auth/v1/verify?token=OTP&type=invite&redirect_to=http://localhost:5173/auth/accept-invite
// 3. Supabase verifica o OTP internamente e redireciona para:
//    http://localhost:5173/auth/accept-invite#access_token=JWT&refresh_token=RT&type=invite
// 4. AcceptInvitePage lê access_token e refresh_token do HASH FRAGMENT (window.location.hash)
// 5. Profissional preenche phone, birthday e password
// 6. POST /auth/accept-invite { access_token, refresh_token, phone, birthday, password }
//    Servidor valida via supabase.auth.getUser(access_token), atualiza perfil e seta cookies
// 7. Frontend busca GET /users/perfil/me (cookies já válidos) e redireciona para /profissional
```

> **Atenção:** o Supabase consome o OTP antes de redirecionar — o `access_token` no hash é um **JWT de sessão**, não o token hash original. O backend NÃO deve usar `verifyOtp` — deve usar `supabase.auth.getUser(access_token)`.
>
> Se vier com path duplo (bug de concatenação), a rota `/auth/accept-invite/*` no router captura e ainda funciona.

### Session restore (main.jsx)
```js
// No bootstrap, sem verificação de localStorage — sempre tenta GET /users/perfil/me
// Se 200 → sessão válida, popula store via restoreSession()
// Se 401 → sem sessão, renderiza app sem autenticação (ProtectedRoute redireciona se necessário)
try {
  const { data } = await api.get('/users/perfil/me')
  restoreSession({ id: data.UUID, publicId: data.UUID, email: data.Email, name: data.Name, role: data.Role })
} catch {
  // sem sessão — continua
}
```

### Erros da API
A API retorna sempre `{ error: "mensagem" }` — usar `err.response?.data?.error`

### authStore shape
```js
{ user: { id, email, name, role, publicId }, isAuthenticated: boolean }
// login(user)          → seta estado + salva publicId em localStorage('auth_public_id')
// logout()             → limpa estado + remove auth_public_id — quem chamar deve POST /auth/logout antes
// restoreSession(user) → seta estado restaurando publicId do localStorage
```
- `id` → `perfil.UUID` (UUID da tabela `Users` — usado em URLs como `/appointment/client/:id`)
- `publicId` → `perfil.UUID` atualmente (idealmente seria `res.user.id` do Supabase Auth, mas ambos apontam para o mesmo usuário)
- `email` → `perfil.Email` que é o email sintético `{ddd+numero}@dauth.internal` — **não exibir para o usuário**; usar `user.name` ou `user.phone` nas UIs
- Tokens nunca vão para o localStorage — só `auth_public_id`, que não é dado sensível

### CORS
Cookies com `credentials` **não funcionam** com `Access-Control-Allow-Origin: *`.
O backend precisa ter `CORS_ORIGIN=http://localhost:5173` (ou a URL exata do frontend).

---

## Shapes reais da API (confirmados em produção)

### POST /auth/login
```json
// Request:
{ "phone": "(11) 9 8765-4321", "password": "string" }
// Response:
{ "expires_in": 3600, "user": { "id": "supabase-auth-uuid", "phone": "string", "role": "string" } }
```
- Identificador de login é **telefone** (não email) — formato `(DDD) 9 DDDD-DDDD`
- Tokens chegam via `Set-Cookie` httpOnly — não estão no body
- 401 → telefone ou senha inválidos; 403 → conta não verificada ou desativada

### POST /auth/register
```json
// Request:
{ "name": "string", "phone": "(11) 9 8765-4321", "birthday": "YYYY-MM-DD", "password": "string" }
// Response:
{ "message": "Cadastro iniciado. Verifique seu WhatsApp para ativar a conta." }
```
- **Sem campo email** — o backend gera email sintético internamente (`{ddd+numero}@dauth.internal`)
- Conta criada com `active=false` — só ativa após verificação via WhatsApp (`POST /auth/verify`)
- 409 → telefone já cadastrado

### POST /auth/verify
```json
// Request:
{ "token": "hex-64-chars" }
// Response:
{ "message": "Conta verificada com sucesso. Faça login para continuar." }
```
- Sem auto-login — sempre exibe tela de sucesso com botão "Ir para o login"
- 400 → token inválido ou expirado; 422 → formato inválido

### POST /auth/resend-verification
```json
// Request:
{ "phone": "(11) 9 8765-4321" }
// Response:
{ "message": "Se o número estiver cadastrado e aguardando verificação, um novo link foi enviado." }
```
- Resposta sempre 200 e neutra — não revela se o número existe
- Chamado na tela pós-cadastro pelo botão "Não recebi o link — reenviar"

### POST /auth/forgot-password
```json
// Request:
{ "phone": "(11) 9 8765-4321" }
// Response:
{ "message": "Se o número estiver cadastrado, você receberá um link pelo WhatsApp." }
```
- Resposta sempre 200 e neutra
- Link enviado para APP_URL/redefinir-senha?token=... (TTL 1h)

### POST /auth/reset-password
```json
// Request:
{ "token": "hex-64-chars", "password": "novasenha123" }
// Response:
{ "message": "Senha redefinida com sucesso. Faça login para continuar." }
```
- Sem auto-login — após sucesso redirecionar para /login com toast
- 400 → token inválido ou expirado; 422 → formato inválido

### POST /auth/refresh
- Sem body — servidor lê o cookie `refresh_token` automaticamente
- Responde `{ "expires_in": 3600 }` + novos cookies via `Set-Cookie`

### POST /auth/logout
- Sem body — invalida sessão no Supabase e apaga cookies
- Responde `{ "message": "..." }`

### POST /auth/accept-invite
```json
{ "access_token": "jwt", "refresh_token": "rt", "phone": "string", "birthday": "YYYY-MM-DD", "password": "string" }
```
- Responde `{ "message": "..." }` — cookies setados automaticamente pelo servidor

### GET /users/perfil/me
```json
{ "UUID", "Name", "Email", "Role", "Phone", "Birthday", "active", "created_at" }
```
Campos PascalCase. Normalizar ao receber: `UUID → id`, `Name → name`, etc.
- `created_at` em lowercase — usar `new Date(created_at).getFullYear()` para exibir ano de cadastro

### GET/PATCH /appointment (e variantes)
```json
{
  "data": [{ "UUID", "Date", "Start_time", "End_time", "Status", "Client", "Professional", "Service" }],
  "pagination": { "page", "limit", "total" }
}
```
- `Client`, `Professional`, `Service` são **strings** (nomes diretos, não objetos)
- Paginação usa chave `pagination`, não `meta`
- **PATCH envia PascalCase no body:** `{ Status: 'confirmado' }`, não `{ status: 'confirmado' }`
- Status válidos: `pendente` | `confirmado` | `cancelado` | `concluido`

### POST /appointment
```json
{ "Client": "uuid", "Professional": "uuid", "Service": "uuid", "Date": "YYYY-MM-DD", "Start_time": "HH:MM", "End_time": "HH:MM" }
```
- Todos os campos **PascalCase** (incluindo `Start_time` e `End_time` com underscore)
- `Client` deve ser o **`publicId`** do usuário (`user.publicId` no store), não o `user.id` — o backend compara com o Supabase Auth UUID via cookie JWT

### GET /public/services
```json
{ "data": [{ "UUID", "Name", "Duration", "Commission", "Price", "Category", "Created_at", "Updated_at" }], "pagination": {...} }
```
- `Duration` no formato `"HH:MM:SS"` — converter para exibição (`"01:00:00"` → `"1h"`)
- `Price` pode ser `0` — exibir como `"Consultar"`
- `?has_professionals=true` — filtra só serviços com ao menos um profissional vinculado; usado em `/agendar` para evitar dead-end no passo 1

### GET /service (autenticado)
- `?professional=<UUID>` — filtra apenas serviços vinculados ao profissional; inner join com `ServiceProfessional`
- `?has_professionals=true` — filtra serviços com ao menos um profissional vinculado (comportamento anterior mantido)

### GET /public/services/:id/professionals
```json
{ "data": [{ "professional_id": "uuid", "name": "string" }] }
```

### GET /public/availability/:professionalId?date=YYYY-MM-DD&service_id=UUID
```json
{ "data": [{ "start_time": "HH:MM", "end_time": "HH:MM" }] }
```
- Retorna `{ "data": [], "message": "Profissional não trabalha neste dia." }` se sem horário cadastrado

### GET /service/:id/professionals (autenticado)
```json
{ "data": [{ "id": "linkUUID", "professional_id": "uuid", "name": "string", "phone": "string" }] }
```
- `id` é o UUID do vínculo — necessário para DELETE

### POST /service/:id/professionals
```json
{ "professional_id": "uuid" }
```
- Body em **lowercase** (exceção ao padrão PascalCase)

### DELETE /service/professionals/:linkId
- Rota **não** inclui o service ID — é `/service/professionals/:linkId`
- `linkId` é o campo `id` retornado pelo GET acima (UUID do vínculo, não o `professional_id`)

### GET /working-hours/professional/:id
```json
{ "data": [{ "UUID", "Weekday", "Start_time", "End_time" }] }
```
- `Weekday`: 0=Dom, 1=Seg, ..., 6=Sáb
- `Start_time`/`End_time` com timezone offset — usar `.slice(0,5)` para exibição

### POST /working-hours
```json
{ "professional_id": "uuid", "weekday": 1, "start_time": "HH:MM", "end_time": "HH:MM" }
```
- Body em **lowercase/camelCase** (exceção ao padrão PascalCase)

### PATCH /working-hours/:id
```json
{ "start_time": "HH:MM", "end_time": "HH:MM" }
```
- Todos os campos opcionais, também em lowercase

### GET /package/client/:clientId
```json
{
  "data": [{
    "UUID": "uuid",
    "Status": "pendente | ativo | concluido | cancelado",
    "Acquired_at": "ISO8601 | null",
    "Created_at": "ISO8601",
    "Package_id": "uuid",
    "Tab_id": "uuid",
    "Service_package": {
      "UUID": "uuid",
      "Name": "string",
      "Price": 150,
      "Available_until": "YYYY-MM-DD"
    },
    "Client_package_items": [{
      "UUID": "uuid",
      "Service_id": "uuid",
      "Service": { "UUID": "uuid", "Name": "string" },
      "Total_quantity": 1,
      "Used_quantity": 0
    }]
  }],
  "pagination": { "page", "limit", "total" }
}
```
- `Acquired_at` pode ser `null` quando o pagamento ainda não foi confirmado — usar `Created_at` como fallback para exibição
- Sessões restantes = `Total_quantity - Used_quantity` (calculado no frontend)
- Permissão: `Usuario` (próprios combos), `Admin`, `Profissional`
- **Ownership enforçado no servidor:** para `Usuario`, a API ignora o `:clientId` da URL e usa o ID do token — passar `user.id` é a convenção correta por consistência

---

## Rotas

| Path | Componente | Proteção |
|---|---|---|
| `/` | PortalPage | pública |
| `/agendar` | AgendarPage | pública |
| `/login` | LoginPage | pública |
| `/register` | RegisterPage | pública |
| `/auth/accept-invite` | AcceptInvitePage | pública |
| `/esqueci-senha` | EsqueciSenhaPage | pública |
| `/redefinir-senha` | RedefinirSenhaPage | pública |
| `/perfil` | MeuPerfil | todos os roles |
| `/trocar-senha` | TrocarSenha | todos os roles |
| `/agendamento/:id` | DetalhesAgendamento | todos os roles |
| `/cliente` | ClienteDashboard | Usuario, Admin |
| `/cliente/agendamentos` | MeusAgendamentos | Usuario, Admin |
| `/cliente/combos` | MeusCombos | Usuario, Admin |
| `/profissional` | ProfissionalPainel | Profissional, Admin |
| `/profissional/agendamentos` | MinhaAgenda | Profissional, Admin |
| `/profissional/servicos` | ProfissionalServicos | Profissional, Admin |
| `/profissional/horarios` | ProfissionalHorarios | Profissional, Admin |
| `/profissional/comissoes` | ProfissionalComissoes | Profissional, Admin |
| `/admin` | AdminAgenda | Admin |
| `/admin/agendamentos` | AdminAgendamentos | Admin |
| `/admin/caixa` | AdminCaixa | Admin |
| `/admin/combos` | AdminCombos | Admin |
| `/admin/usuarios` | AdminUsuarios | Admin |
| `/admin/servicos` | AdminServicos | Admin |
| `/admin/convidar-profissional` | ConvidarProfissional | Admin |

---

## Deploy

O frontend é uma SPA estática servida pelo **Nginx via Docker** (sem container próprio).

```
/home/dalmas/apps/nginx/docker-compose.yml
  volume: ../Dauth_Front_End/dist → /usr/share/nginx/dauth-front
```

O Nginx lê `dist/` diretamente como volume — não é necessário reiniciar nenhum container após o build.

**Comando de deploy:**
```bash
cd /home/dalmas/apps/Dauth_Front_End
bash deploy.sh   # git pull + npm install + npm run build
```

**Build manual:**
```bash
npm run build    # gera dist/ com VITE_API_URL do .env.production
```

---

## API

- **Base URL:** `import.meta.env.VITE_API_URL`
  - Dev (`.env`): `VITE_API_URL=http://localhost:3000/api/v1`
  - Produção (`.env.production`): `VITE_API_URL=https://back.dauth.com.br/api/v1`
- **Auth:** cookies httpOnly enviados automaticamente pelo navegador (`withCredentials: true`)
- **Refresh:** 401 em rota não-`/auth/*` → interceptor chama `POST /auth/refresh` (sem body) → repete requisição → se falhar, redireciona `/login`
- **Interceptor ignora `/auth/*`** — evita redirect indevido em credencial errada no login
- **Shapes completos:** ver `API-Documentation.md`

---

## Estado atual

### Integrado com API real
- Login (`POST /auth/login` com **phone** — campo email removido, máscara de telefone)
- Register (`POST /auth/register` com name/phone/birthday/senha — **sem email** — + auto-login com phone)
- Logout (`POST /auth/logout` via `authStore.logout()` async)
- Session restore (`GET /users/perfil/me` no bootstrap — sem verificação de localStorage)
- Auth guard ativo (`DEV_BYPASS = false`)
- Meu Perfil (`GET/PATCH /users/perfil/me`)
- Trocar Senha (`PATCH /users/perfil/me/password`)
- Meus Agendamentos — cliente (`GET /appointment/client/:id`)
- Minha Agenda — profissional (`GET /appointment/my`)
- Gerenciar Agendamentos — admin (`GET /appointment`)
- Detalhes do Agendamento (`GET /appointment/:id` + `PATCH /appointment/:id` com `{ Status }`)
- Convidar Profissional (`POST /auth/invite`)
- Aceitar Convite (`POST /auth/accept-invite` → GET /users/perfil/me → /profissional direto)
- Agendar — stepper público (`GET /public/services` · `GET /public/services/:id/professionals` · `GET /public/availability/:id` · `POST /appointment`)
- Gerenciar Usuários (`GET /users` + `PATCH /users/:id` para ativar/desativar)
- Gerenciar Serviços + Categorias — CRUD completo com drawer (`GET/POST/PATCH/DELETE /service` · `GET/POST/PATCH/DELETE /category`)
- Comandas (`GET /tab` + `POST /transaction` + `PATCH /tab/:id`)
- **Troca de senha obrigatória no primeiro acesso** — Admin cadastra usuário via `POST /auth/register-admin` (senha padrão `12345678`, `Must_change_password=true`); `LoginPage` verifica `perfil.Must_change_password` após login e redireciona para `/trocar-senha`; `ProtectedRoute` bloqueia toda navegação exceto `/trocar-senha` enquanto `user.must_change_password === true`; `TrocarSenha` exibe aviso de primeiro acesso, sem botão Cancelar, redireciona para dashboard do role após sucesso
- **Comissões por transação individual** — `AdminCaixa` (aba Comissões): usa `GET /transaction/all-commissions?month=YYYY-MM`; transações agrupadas por profissional em duas seções ("A repassar" / "Repassadas"); cada linha tem botão "Marcar repassado" que faz `PATCH /transaction/:id { Commission_paid: true }`; labels de status: "Repassado"/"A repassar" (nunca "Em aberto" — evita confusão com status de comanda); `ProfissionalComissoes`: mesmos labels via `commission_paid` por linha
- **Fechar conta por cliente (batch pay)** — `AdminCaixa` (aba Comandas): detecta clientes com ≥2 comandas em aberto; botão "Fechar conta · {nome}" no topo; modal com lista de comandas, total, seletor de método; chama `POST /tab/batch-pay { tab_ids: [UUIDs], Method, Payment_date }`
- **Fix AgendarPage — redirect pós-agendamento por role** — botão "Ver minha conta" na tela de sucesso agora redireciona para `/admin`, `/profissional` ou `/cliente` conforme `user.role`; antes ia sempre para `/cliente`
- **Fix AgendarPage — intervalo do profissional respeitado** — `GET /public/availability` agora inclui `Break_start`/`Break_end` do `WorkingHours` como bloco ocupado ao calcular slots disponíveis; slots que sobrepõem o intervalo são bloqueados (inclui slots que iniciam antes do intervalo mas terminam durante ele, dependendo da duração do serviço)
- **AdminDashboard ampliado** — KPI de taxa de cancelamento (% agendamentos cancelados no mês); tabela de ranking de profissionais (top 5 por receita: avatar, nome, atendimentos, receita gerada, comissão); bug corrigido: `footerUser={user?.name}` agora passado ao Sidebar (ícone de logout e footer do sidebar estavam ausentes na página de dashboard)
- **Comissões por profissional** (`GET /dashboard/commissions?month=YYYY-MM`) — aba "Comissões" dentro de AdminCaixa; seletor de mês+ano independente; cards totalizadores; tabela com % média de comissão e linha de totais no rodapé; cards mobile com todos os campos
- Pacotes — grid + CRUD + vender combo (`GET/POST/PATCH/DELETE /package` · `GET/POST/DELETE /package/:id/items` · `POST /package/:id/sell`)
- Agenda Admin — grade por profissional com navegação de dia (`GET /appointment?date=YYYY-MM-DD` + `GET /users?Role=Profissional` para colunas fixas)
- Dashboard Profissional (`GET /appointment/my?date=` + `GET /working-hours/professional/:id` + `GET /service`)
- Serviços do Profissional — vincular/desvincular (`GET /service` + `GET/POST /service/:id/professionals` + `DELETE /service/professionals/:linkId`)
- Horários do Profissional — CRUD semanal (`GET/POST/PATCH/DELETE /working-hours`)
- **Comissões do Profissional** (`GET /transaction/my-commissions?month=YYYY-MM`) — nova página `ProfissionalComissoes` acessível em `/profissional/comissoes`; item "Minhas comissões" (ícone `cash`) adicionado ao `navItems` de todas as páginas do role Profissional
- **ProfissionalPainel — KPIs do dia** — 3 mini-cards (total hoje, concluídos, a atender) renderizados a partir dos appointments já carregados, sem custo extra de API
- **MinhaAgenda — status de comanda** — campo `tab_status` retornado pelo backend em `GET /appointment/my` (join `Tab(UUID, Status)` em `appointmentModels.findByProfessional`); badge Paga/Em aberto visível a partir de `sm`
- **DetalhesAgendamento — histórico do cliente** — card "Últimas visitas" para Admin/Profissional usando `GET /appointment/my?client_name=X&limit=6`; filtro feito no banco via `ilike`
- **navItems centralizado** — `src/config/navItems.js` é a fonte única de verdade; corrige bug de itens sumindo ao navegar para `/perfil`, `/trocar-senha` e `/agendamento/:id`
- **Backend:** `appointmentModels.findByProfessional` com join Tab e filtro `client_name`; `formatAppointment` expõe `tab_status`; `getMy` aceita `?client_name=`
- Dashboard Cliente — próximo agendamento real + histórico recente + "cliente desde YYYY" + card dinâmico de combo + **AppointmentPanel inline** (bottom sheet mobile / drawer desktop) ao clicar "Ver detalhes" — sem navegação para /agendamento/:id
- Meus Combos — cliente — cards com barra de progresso + breakdown por serviço + seções Ativos/Histórico
- **Recuperação de senha** — `EsqueciSenhaPage` (`/esqueci-senha`) + `RedefinirSenhaPage` (`/redefinir-senha?token=`); link "Esqueci a senha" ativo no `LoginPage`
- **Reenvio de verificação** — botão "Não recebi o link — reenviar" na tela pós-cadastro do `RegisterPage`; chama `POST /auth/resend-verification { phone }`
- Migração para httpOnly cookies — removido todo acesso a localStorage para tokens
- **Mobile-first completo** — todas as páginas (cliente, público, admin, profissional, shared) são responsivas (breakpoints `md:` e `lg:`)
- **Logo e nome atualizados** — `logo-dauth-agendamentos.png` + "Dauth Agendamentos" em todas as páginas (auth, cliente sidebars, AgendarPage top bar, AppLayout/Sidebar compartilhados)
- **AdminAgenda mobile** — seletor de profissional prev/next para visualizar um profissional por vez em telas pequenas
- **AdminAgenda blocos de agendamento** — bloco único por agendamento com altura calculada pela duração: `spanSlots(appt) × 64px - 4` desktop / `× 56px - 4` mobile; célula de início com `overflow: visible` e bloco com `z-10`; exibe horário início → fim dentro do bloco
- **AdminAgenda datepicker** — ícone `cal` na barra de navegação abre datepicker nativo do browser via `inputRef.current.showPicker()` (fallback `.click()`); `input[type="date"]` sobreposto com `opacity-0 absolute inset-0` é o gatilho real; onChange parseia `YYYY-MM-DD` manualmente com `new Date(y, m-1, d)` para evitar problema de timezone com `new Date(string)`
- **AdminAgenda — criar agendamento pelo calendário** — clicar em slot vazio abre `NovoAgendamentoDrawer`; profissional e horário pré-preenchidos; selects de cliente (`GET /users?Role=Usuario&limit=200`) e serviço (`GET /service?limit=200`); ao selecionar serviço, end_time calculado automaticamente pela `Duration`; horários editáveis manualmente; `POST /appointment` com campos PascalCase; ao salvar chama `load()` para recarregar sem navegar
- **AdminAgenda — slots passados** — `isSlotPast(date, slot)`: data anterior a hoje → todos passados; hoje → slots onde `horaAtual > slotInicio`; passados recebem `bg-surface-2` e texto `ink-4`, sem hover e sem onClick; agendamentos já existentes nesses slots continuam visíveis normalmente
- **navItems admin centralizado** — todos os 10 arquivos admin (`AdminAgenda`, `AdminDashboard`, `AdminAgendamentos`, `AdminCaixa`, `AdminUsuarios`, `AdminCombos`, `AdminServicos`, `ConvidarProfissional`, `AdminProdutos`, `AdminPedidosProdutos`) importam `navItemsByRole` de `@/config/navItems` e usam `const navItems = navItemsByRole['Admin']`
- **Drawers mobile** — todos os drawers (admin e profissional) usam `w-full md:w-[Xpx]` + `p-5 md:p-7` para ocupar tela cheia em mobile
- **ProfissionalPainel mobile** — grids "Agora + A seguir" e "Horários + Serviços" empilham em mobile (`grid-cols-1 md:grid-cols-[...]`); grade de horários exibe lista compacta em mobile (`md:hidden`) e grade de 7 colunas no desktop (`hidden md:grid`)
- **MinhaAgenda mobile** — data/horário exibidos abaixo do nome em mobile (`md:hidden`), coluna separada visível apenas no desktop (`hidden md:block`)
- **DetalhesAgendamento mobile** — grid `1fr 340px` empilha em mobile, aplica duas colunas a partir de `lg`
- **AdminCombos modal mobile** — modal "Vender pacote" usa `w-full max-w-[400px] mx-4` para não estourar em telas pequenas
- **Melhorias de UI/UX aplicadas** — Button com `active:scale-[0.97]` e `focus-visible:ring-2`; Input com `focus:ring-2 focus:ring-brand/12`; Chip com dot automático quando `status` está presente (sem precisar passar `dot` explicitamente); Avatar com gradiente determinístico por hash do nome; Modal com `backdrop-blur-sm` no overlay; EmptyState com animação `fade-in` de 220ms; LoginPage com split layout desktop (painel brand terracota + headline serif à esquerda, formulário à direita — mobile inalterado); background com gradiente radial sutil brand/gold
- **Fix: botão "Novo agendamento" em AdminAgendamentos** — corrigido de `/agendamento/novo` (rota inexistente) para `/agendar`

- **Módulo de notificações** — `GET /notification/unread-count` (polling 30s), `GET /notification?limit=30` (ao abrir drawer), `PATCH /notification/:id/read`, `PATCH /notification/read-all`; sino mobile em `AppLayout` + sino desktop em `Sidebar`; `NotificationDrawer` bottom sheet/drawer; migration SQL aplicada

### Ainda com dados mockados / não implementado
- `PortalPage` — landing page pública, sem implementação

---

## Convenções

- **Sem TypeScript** — JS puro em todos os arquivos
- **Sem comentários** salvo quando o porquê não é óbvio
- **Sem abstrações prematuras** — componentes locais ficam no próprio arquivo
- Tailwind inline — sem CSS modules ou styled-components
- **Mobile-first obrigatório** — nunca usar `style={{ gridTemplateColumns }}` inline exceto quando o número de colunas é dinâmico (ex.: grade de profissionais em AdminAgenda — nesse caso usar `hidden md:grid` no desktop e `grid md:hidden` no mobile com layout simplificado). Sempre preferir classes Tailwind com breakpoints (`grid-cols-1 md:grid-cols-2`). Breakpoints usados: `sm` (640px), `md` (768px), `lg` (1024px)
- **Sidebar em páginas internas** — `ClienteSidebar` local (páginas de cliente) e `Sidebar` compartilhado (admin/profissional/shared) devem sempre aceitar prop `onClose` e passar `h-full overflow-y-auto` para funcionar como drawer mobile via `AppLayout`. `AppLayout` injeta `onClose` via `cloneElement` — não é necessário passar manualmente
- **Tabelas em mobile** — toda tabela HTML deve ter alternativa em cards para telas menores: `hidden md:block` na tabela, `md:hidden` nos cards
- **Drawers em mobile** — todo drawer lateral usa `w-full md:w-[Xpx]` + `p-5 md:p-7` para ocupar tela cheia em mobile
- **Modais em mobile** — todo modal centralizado usa `w-full max-w-[Xpx] mx-4` (nunca `w-[Xpx]` fixo) para não estourar em telas pequenas
- **Grids de painel em mobile** — grids com proporções assimétricas (ex.: `1.4fr 1fr`, `1fr 340px`) devem usar `grid-cols-1 md:grid-cols-[...]` ou `grid-cols-1 lg:grid-cols-[...]` para empilhar em telas menores; nunca usar `style={{ gridTemplateColumns }}` com valores fixos nesses casos
- **Logo** — importar sempre com `import logo from '@/logo-dauth-agendamentos.png'`; usar `<img src={logo} alt="Dauth" className="w-8 h-8 rounded-lg object-cover" />`. Nome do sistema: **"Dauth Agendamentos"** (não "Dauth" sozinho)
- **Ícone nativo de senha suprimido** — `index.css` já contém regra global que oculta `::-ms-reveal`, `::-ms-clear` e `::-webkit-credentials-auto-fill-button` em todos os `input[type='password']`. Não adicionar CSS extra — o ícone custom dos inputs de senha já é o único visível
- **Grade de agenda (AdminAgenda)** — células de slot usam `overflow: visible` para permitir que o bloco de agendamento vaze verticalmente sobre os slots seguintes. Células com `h-16` desktop / `h-14` mobile. Função `spanSlots(appt)` calcula quantos slots de 30min o agendamento ocupa. Nunca renderizar divs de "continuação" — apenas o bloco no slot de início com `style={{ height: spans * cellPx - 4 }}`. Bloco usa `flex flex-col justify-center items-center text-center` para centralizar o conteúdo horizontal e verticalmente
- **Painel de detalhes inline (bottom sheet / drawer)** — em páginas de listagem do role `Usuario`, "Ver detalhes" abre um painel inline via `fixed inset-0 z-40` sem navegar para outra rota. Mobile: bottom sheet (`flex-col justify-end`, `rounded-t-2xl`, `max-h-[85vh]`, alça `w-10 h-1 bg-line-2`). Desktop: drawer lateral (`md:flex-row md:justify-end`, `md:w-[420px]`, `md:border-l`, `md:h-full`). Overlay `bg-black/30` cobre o fundo e fecha ao clicar. A rota `/agendamento/:id` continua existindo para Admin/Profissional.
- Dados de mock ficam em constantes no topo do arquivo enquanto a integração não está pronta
- **Silent refresh:** funções `load` que exibem spinner aceitam `load(silent = false)`. Mutações (PATCH/POST após ação do usuário) chamam `load(true)` para atualizar dados sem piscar. Primeira carga e navegação entre datas/filtros chamam `load()` normalmente com spinner. Padrão aplicado em: `AdminAgenda`, `TabComandas` (AdminCaixa), `TabComissoes` (AdminCaixa).
- **`navItemsByRole` é a fonte única de navItems** — **todas** as páginas admin e profissional usam `import { navItemsByRole } from '@/config/navItems'` e `const navItems = navItemsByRole['Admin']` (ou `'Profissional'`). Nunca hardcodar `const navItems = [...]` em páginas admin — qualquer mudança de ordem ou item deve ser feita exclusivamente em `src/config/navItems.js`.
- **`navItemsByRole` em páginas shared** (ex: `MeuPerfil`, `TrocarSenha`, `DetalhesAgendamento`) → detectar role via `useAuthStore` e usar `navItemsByRole[user.role]`. Isso evita o bug de itens sumindo ao navegar entre roles.
- Páginas compartilhadas entre roles ficam em `src/pages/shared/` e detectam o role via `useAuthStore`
- **API usa PascalCase** tanto na leitura quanto na escrita — sempre verificar o shape real antes de integrar
- Exceção confirmada: `PATCH /users/:id` aceita `{ active: bool }` lowercase. **Todos os demais endpoints** exigem PascalCase no body — sempre verificar o schema Joi antes de integrar.
- **Ownership server-side para `Usuario`:** `GET /appointment/client/:id`, `GET /package/client/:id`, `GET /tab`, `GET /transaction` ignoram o parâmetro e retornam apenas dados do próprio usuário autenticado. `POST /appointment` com `Client` diferente do token retorna 403. O frontend não precisa filtrar no lado cliente — passar `user.id` na URL por convenção.
- `POST /transaction` sempre exige `Payment_date: new Date().toISOString()`. Tabs com `Value === 0` (uso de combo) não geram transação — só atualizar status da comanda.
- Schemas PascalCase confirmados: `POST /package` → `Name, Price, Available_until` · `POST /package/:id/items` → `Service_id, Quantity` · `POST /package/:id/sell` → `Client_id`
- Exceções lowercase confirmadas: `PATCH /users/:id` → `{ active }` · `POST /working-hours` → `{ professional_id, weekday, start_time, end_time }` · `PATCH /working-hours/:id` → `{ start_time, end_time }` · `POST /service/:id/professionals` → `{ professional_id }`
