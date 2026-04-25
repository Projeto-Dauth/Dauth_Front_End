# CLAUDE.md — Dauth Frontend

Briefing técnico completo para sessões com Claude Code.

---

## Visão Geral

Frontend do **Dauth**, sistema de gerenciamento para o Salão Bela Arte.
SPA React com 3 perfis de usuário: `Admin`, `Profissional`, `Usuario`.

- **Backend:** Express.js + Supabase, rodando em `http://localhost:3000`
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
| HTTP | Axios com interceptors de token e refresh automático |
| Estado global | Zustand (`useAuthStore`) |
| Formulários | React Hook Form |
| Fontes | Space Grotesk (display) · Inter (body) · JetBrains Mono (mono) |

---

## Alias de importação

`@` aponta para `./src` — use sempre `@/components/...`, `@/pages/...`, etc.

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
- Títulos: `font-display font-medium tracking-tight`
- Corpo: `font-body` (padrão)
- Códigos/labels: `font-mono text-[10.5px] uppercase tracking-widest`

**Padrão de input:**
```
h-[42px] px-[14px] rounded-md border bg-surface text-ink-2 font-body text-md
placeholder:text-ink-4 focus:outline-none focus:border-brand transition-colors
border-line  (normal) | border-danger (com erro)
```

---

## Estrutura de Arquivos

```
src/
  lib/api.js                    ← Axios: injeta Bearer token, auto-refresh no 401
  store/authStore.js            ← Zustand: { user, isAuthenticated, login, logout, restoreSession }
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
      AppLayout.jsx             ← flex: sidebar + main (bg-bg px-8 py-7)
      Sidebar.jsx               ← NavLinks com navItems[], footerUser, footerRole
  pages/
    public/
      PortalPage.jsx            ← Landing page (/)
      AgendarPage.jsx           ← Stepper 5 etapas (serviço → profissional → data/hora → auth → confirmação)
    auth/
      LoginPage.jsx             ← POST /auth/login → redireciona por role
      RegisterPage.jsx          ← POST /auth/register + auto-login → /cliente
      AcceptInvitePage.jsx      ← POST /auth/accept-invite — lê access_token do hash fragment, envia { access_token, refresh_token, phone, birthday, password }
    shared/
      MeuPerfil.jsx             ← GET/PATCH /users/perfil/me — sidebar role-aware via navItemsByRole[user.role], rota /perfil
      TrocarSenha.jsx           ← PATCH /users/perfil/me/password — rota /trocar-senha
      DetalhesAgendamento.jsx   ← GET /appointment/:id + PATCH Status — rota /agendamento/:id
    cliente/
      ClienteDashboard.jsx      ← Sidebar com avatar XL + card dinâmico de combo + histórico
      MeusAgendamentos.jsx      ← GET /appointment/client/:id + filtro status
      MeusCombos.jsx            ← GET /package/client/:id — cards com barra de progresso, seções Ativos/Histórico
    profissional/
      ProfissionalPainel.jsx    ← Now-card dark + próximos + grade de horários — integrado
      MinhaAgenda.jsx           ← GET /appointment/my + filtros data/status
      ProfissionalServicos.jsx  ← Vincular/desvincular serviços — GET /service + GET/POST/DELETE /service/:id/professionals
      ProfissionalHorarios.jsx  ← CRUD horários semanais — GET/POST/PATCH/DELETE /working-hours
    admin/
      AdminAgenda.jsx           ← Grade por profissional com navegação de dia — integrado
      AdminAgendamentos.jsx     ← GET /appointment + filtros data/status
      AdminCaixa.jsx            ← Lista de comandas + painel de pagamento — integrado
      AdminCombos.jsx           ← Grid de pacotes + CRUD + vender combo — integrado
      AdminUsuarios.jsx         ← GET /users + PATCH /users/:id (ativar/desativar)
      AdminServicos.jsx         ← CRUD serviços + categorias com drawer — integrado
      ConvidarProfissional.jsx  ← POST /auth/invite — rota /admin/convidar-profissional
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

### Fluxo de login
```js
// POST /auth/login retorna:
{ access_token, refresh_token, user: { id, email, role } }
// IMPORTANTE: o `id` do payload pode divergir do UUID do banco.
// Após o login, sempre buscar GET /users/perfil/me e sobrescrever o store:
login({ id: perfil.UUID, publicId: res.user.id, email: perfil.Email, name: perfil.Name, role: perfil.Role }, access_token, refresh_token)
// publicId = res.user.id = Supabase Auth UUID → obrigatório para POST /appointment { Client }
// Redireciona por role (usar perfil.Role, não res.user.role):
Admin → /admin | Profissional → /profissional | Usuario → /cliente
```

### Fluxo de register
```js
// POST /auth/register retorna apenas { message, user: { id, email, name } } — SEM tokens
// Por isso RegisterPage faz login automático em seguida
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
//    Backend valida via supabase.auth.getUser(access_token), atualiza senha e perfil
// 7. Profissional redirecionado para /profissional
```

> **Atenção:** o Supabase consome o OTP antes de redirecionar — o `access_token` no hash é um **JWT de sessão**, não o token hash original. O backend NÃO deve usar `verifyOtp` — deve usar `supabase.auth.getUser(access_token)`.
>
> Se vier com path duplo (bug de concatenação), a rota `/auth/accept-invite/*` no router captura e ainda funciona.

### Session restore (main.jsx)
```js
// No bootstrap, se access_token existe no localStorage:
GET /users/perfil/me → { UUID, Name, Email, Role, Phone, Birthday, active }
// Mapeia para: restoreSession({ id: UUID, publicId: localStorage.get('public_id'), email: Email, name: Name, role: Role })
```

### Erros da API
A API retorna sempre `{ error: "mensagem" }` — usar `err.response?.data?.error`

### authStore shape
```js
{ user: { id, email, name, role, publicId }, isAuthenticated: boolean }
```
- `id` → `perfil.UUID` (UUID da tabela `Users` — usado em URLs como `/appointment/client/:id`)
- `publicId` → `data.user.id` da resposta de login (UUID do Supabase Auth — usado no body de `POST /appointment` como `Client`, pois o backend compara com `req.user.publicId` que vem do JWT)
- Ambos são persistidos no localStorage: `access_token`, `refresh_token`, `public_id`

---

## Shapes reais da API (confirmados em produção)

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
- `Client` deve ser o **`publicId`** do usuário (`user.publicId` no store), não o `user.id` — o backend compara com o Supabase Auth UUID via `req.user.publicId`

### GET /public/services
```json
{ "data": [{ "UUID", "Name", "Duration", "Commission", "Price", "Category", "Created_at", "Updated_at" }], "pagination": {...} }
```
- `Duration` no formato `"HH:MM:SS"` — converter para exibição (`"01:00:00"` → `"1h"`)
- `Price` pode ser `0` — exibir como `"Consultar"`

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

### DELETE /service/:id/professionals/:linkId
- `linkId` é o `id` retornado pelo GET acima

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
| `/admin` | AdminAgenda | Admin |
| `/admin/agendamentos` | AdminAgendamentos | Admin |
| `/admin/caixa` | AdminCaixa | Admin |
| `/admin/combos` | AdminCombos | Admin |
| `/admin/usuarios` | AdminUsuarios | Admin |
| `/admin/servicos` | AdminServicos | Admin |
| `/admin/convidar-profissional` | ConvidarProfissional | Admin |

---

## API

- **Base URL:** `import.meta.env.VITE_API_URL` → `.env`: `VITE_API_URL=http://localhost:3000/api/v1`
- **Auth:** Bearer token injetado automaticamente pelo interceptor de `api.js`
- **Refresh:** 401 → tenta `POST /auth/refresh` → repete requisição → se falhar, redireciona `/login`
- **Atenção:** o interceptor de 401 **ignora endpoints `/auth/*`** — sem isso, um login com credencial errada (que retorna 401) disparava o redirect para `/login` antes de exibir o erro
- **Shapes completos:** ver `API-Documentation.md`

---

## Estado atual

### Integrado com API real
- Login (`POST /auth/login`)
- Register (`POST /auth/register` + auto-login)
- Session restore (`GET /users/perfil/me` no bootstrap)
- Auth guard ativo (`DEV_BYPASS = false`)
- Meu Perfil (`GET/PATCH /users/perfil/me`)
- Trocar Senha (`PATCH /users/perfil/me/password`)
- Meus Agendamentos — cliente (`GET /appointment/client/:id`)
- Minha Agenda — profissional (`GET /appointment/my`)
- Gerenciar Agendamentos — admin (`GET /appointment`)
- Detalhes do Agendamento (`GET /appointment/:id` + `PATCH /appointment/:id` com `{ Status }`)
- Convidar Profissional (`POST /auth/invite`)
- Aceitar Convite (`POST /auth/accept-invite`)
- Agendar — stepper público (`GET /public/services` · `GET /public/services/:id/professionals` · `GET /public/availability/:id` · `POST /appointment`)
- Gerenciar Usuários (`GET /users` + `PATCH /users/:id` para ativar/desativar)
- Gerenciar Serviços + Categorias — CRUD completo com drawer (`GET/POST/PATCH/DELETE /service` · `GET/POST/PATCH/DELETE /category`)
- Comandas (`GET /tab` + `POST /transaction` + `PATCH /tab/:id`)
- Pacotes — grid + CRUD + vender combo (`GET/POST/PATCH/DELETE /package` · `GET/POST/DELETE /package/:id/items` · `POST /package/:id/sell`)
- Agenda Admin — grade por profissional com navegação de dia (`GET /appointment?date=YYYY-MM-DD` + `GET /users?Role=Profissional` para colunas fixas)
- Dashboard Profissional (`GET /appointment/my?date=` + `GET /working-hours/professional/:id` + `GET /service`)
- Serviços do Profissional — vincular/desvincular (`GET /service` + `GET/POST/DELETE /service/:id/professionals`)
- Horários do Profissional — CRUD semanal (`GET/POST/PATCH/DELETE /working-hours`)
- Aceitar Convite — fluxo corrigido: JWT do hash → `POST /auth/accept-invite { access_token, refresh_token, phone, birthday, password }`
- Dashboard Cliente — próximo agendamento real (`GET /appointment/client/:id` filtrado por data/status) + histórico recente + "cliente desde YYYY" via `created_at` + card dinâmico de combo (`GET /package/client/:id`)
- Meus Combos — cliente (`GET /package/client/:id`) — cards com barra de progresso + breakdown por serviço + seções Ativos/Histórico
- Máscara de telefone no stepper de agendamento (campo registro)
- Normalização do store após login — todos os fluxos (`LoginPage`, `RegisterPage`, `AgendarPage`) buscam `GET /users/perfil/me` após login para garantir `UUID` e `name` corretos no store

### Ainda com dados mockados / não implementado
- `PortalPage` — landing page pública, sem implementação

---

## Convenções

- **Sem TypeScript** — JS puro em todos os arquivos
- **Sem comentários** salvo quando o porquê não é óbvio
- **Sem abstrações prematuras** — componentes locais ficam no próprio arquivo
- Tailwind inline — sem CSS modules ou styled-components
- Dados de mock ficam em constantes no topo do arquivo enquanto a integração não está pronta
- `navItems` de cada página é definido localmente no arquivo (sem contexto global de nav)
- Páginas compartilhadas entre roles ficam em `src/pages/shared/` e detectam o role via `useAuthStore`
- **API usa PascalCase** tanto na leitura quanto na escrita — sempre verificar o shape real antes de integrar
- Exceção confirmada: `PATCH /users/:id` aceita `{ active: bool }` lowercase. **Todos os demais endpoints** exigem PascalCase no body — sempre verificar o schema Joi antes de integrar.
- **Ownership server-side para `Usuario`:** `GET /appointment/client/:id`, `GET /package/client/:id`, `GET /tab`, `GET /transaction` ignoram o parâmetro e retornam apenas dados do próprio usuário autenticado. `POST /appointment` com `Client` diferente do token retorna 403. O frontend não precisa filtrar no lado cliente — passar `user.id` na URL por convenção.
- `POST /transaction` sempre exige `Payment_date: new Date().toISOString()`. Tabs com `Value === 0` (uso de combo) não geram transação — só atualizar status da comanda.
- Schemas PascalCase confirmados: `POST /package` → `Name, Price, Available_until` · `POST /package/:id/items` → `Service_id, Quantity` · `POST /package/:id/sell` → `Client_id`
- Exceções lowercase confirmadas: `PATCH /users/:id` → `{ active }` · `POST /working-hours` → `{ professional_id, weekday, start_time, end_time }` · `PATCH /working-hours/:id` → `{ start_time, end_time }` · `POST /service/:id/professionals` → `{ professional_id }`
