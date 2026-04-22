# ✅ Checklist de Telas — Dauth Frontend

> Documento de controle para desenvolvimento do frontend do sistema Dauth

---

## 📊 Resumo

- **Públicas:** 3 telas
- **Cliente (Usuario):** 7 telas
- **Profissional:** 11 telas
- **Admin:** 27 telas
- **Total:** ~48 telas + componentes compartilhados

---

## 🔓 Públicas (sem login)

- [x] **Login** — autenticação (`LoginPage.jsx`) — integrado com API real
- [x] **Registro de Cliente** — cadastro de Usuario (`RegisterPage.jsx`) — integrado com API real
- [x] **Aceitar Convite** — profissional completa cadastro via link do email (`AcceptInvitePage.jsx`) — lê `access_token` do hash fragment, chama `PATCH /users/perfil/me`, salva tokens e redireciona para `/profissional`
- [x] **Agendar** — stepper 5 etapas (`AgendarPage.jsx`) — integrado com `GET /public/services`, `GET /public/services/:id/professionals`, `GET /public/availability/:id`, `POST /appointment`; login/registro inline no step 3; pula auth se já logado

---

## 👤 Cliente (Usuario)

- [x] **Dashboard Cliente** — visão geral (`ClienteDashboard.jsx`) — integrado com `GET /appointment/client/:id` + `GET /users/perfil/me` + `GET /package/client/:id`; card de combos dinâmico (mostra destaque do combo ativo ou CTA promocional se não há combos)
- [x] **Meus Agendamentos** — lista com filtros de status (`MeusAgendamentos.jsx`) — integrado com `GET /appointment/client/:id`
- [x] **Detalhes do Agendamento** — visualizar informações completas (`DetalhesAgendamento.jsx`) — integrado, read-only para cliente
- [x] **Meus Combos** — pacotes comprados, sessões restantes, status (`MeusCombos.jsx`) — integrado com `GET /package/client/:id`; cards com barra de progresso por combo + breakdown de sessões por serviço; seções "Ativos" e "Histórico"
- [ ] **Minhas Comandas** — lista de comandas (em aberto, pagas)
- [x] **Meu Perfil** — editar nome, telefone, aniversário (`MeuPerfil.jsx`) — integrado com `GET/PATCH /users/perfil/me`
- [x] **Trocar Senha** — formulário com senha atual + nova senha (`TrocarSenha.jsx`) — integrado com `PATCH /users/perfil/me/password`

---

## 💇 Profissional

- [x] **Dashboard Profissional** — agenda do dia, próximos atendimentos (`ProfissionalPainel.jsx`) — integrado com `GET /appointment/my` + `GET /working-hours/professional/:id` + `GET /service`
- [x] **Minha Agenda** — lista de agendamentos com filtros de data/status (`MinhaAgenda.jsx`) — integrado com `GET /appointment/my`
- [x] **Detalhes do Agendamento** — visualizar e alterar status (`DetalhesAgendamento.jsx`) — compartilhado, integrado com `PATCH /appointment/:id`
- [x] **Meus Serviços** — vincular/desvincular serviços existentes (`ProfissionalServicos.jsx`) — integrado com `GET /service` + `GET/POST/DELETE /service/:id/professionals`
- [x] **Meus Horários de Trabalho** — definir disponibilidade semanal (`ProfissionalHorarios.jsx`) — integrado com `GET/POST/PATCH/DELETE /working-hours`
- [ ] **Comandas** — visualizar comandas dos atendimentos
- [ ] **Transações** — visualizar e registrar transações
- [x] **Meu Perfil** — editar dados pessoais (`MeuPerfil.jsx`) — compartilhado, sidebar role-aware
- [x] **Trocar Senha** (`TrocarSenha.jsx`) — compartilhado

---

## 👑 Admin

### Gestão de Usuários
- [x] **Dashboard Admin** — grade de agendamentos por profissional com navegação de dia (`AdminAgenda.jsx`) — integrado com `GET /appointment?date=YYYY-MM-DD` + `GET /users?Role=Profissional` (colunas fixas por profissional ativo)
- [x] **Gerenciar Usuários** — tabela com filtro por role, ativar/desativar (`AdminUsuarios.jsx`) — integrado com `GET /users` + `PATCH /users/:id`
- [ ] **Detalhes do Usuário** — visualizar, editar, ativar/desativar
- [x] **Convidar Profissional** — formulário de convite por email (`ConvidarProfissional.jsx`) — integrado com `POST /auth/invite`

### Agendamentos
- [x] **Gerenciar Agendamentos** — lista com filtros de data/status (`AdminAgendamentos.jsx`) — integrado com `GET /appointment`
- [ ] **Criar/Editar Agendamento** — formulário CRUD
- [x] **Detalhes do Agendamento** — visualizar e alterar status (`DetalhesAgendamento.jsx`) — integrado com `PATCH /appointment/:id`

### Serviços e Categorias
- [ ] **Gerenciar Categorias** — lista e CRUD de categorias
- [x] **Gerenciar Serviços** — abas Serviços + Categorias, CRUD completo com drawer lateral (`AdminServicos.jsx`) — integrado com `GET/POST/PATCH/DELETE /service` + `GET/POST/PATCH/DELETE /category`
- [ ] **Criar/Editar Serviço** — formulário CRUD
- [ ] **Profissionais do Serviço** — visualizar e gerenciar vínculos

### Pacotes/Combos
- [x] **Gerenciar Pacotes** — grid de cards com itens, CRUD completo, vender combo (`AdminCombos.jsx`) — integrado com `GET/POST/PATCH/DELETE /package` + `GET/POST/DELETE /package/:id/items` + `POST /package/:id/sell`
- [ ] **Criar/Editar Pacote** — formulário CRUD (nome, preço, prazo)
- [ ] **Itens do Pacote** — gerenciar serviços incluídos e quantidades
- [ ] **Vender Combo** — selecionar cliente e pacote para iniciar venda
- [ ] **Combos Ativos** — lista de combos vendidos (cliente, pacote, sessões restantes, status)
- [ ] **Detalhes do Combo** — visualizar histórico de consumo de sessões

### Financeiro
- [x] **Comandas** — lista com filtro de status + painel de pagamento (`AdminCaixa.jsx`) — integrado com `GET /tab` + `POST /transaction` + `PATCH /tab/:id`
- [ ] **Detalhes da Comanda** — visualizar itens e alterar status
- [ ] **Transações** — lista com filtros (método, data, comanda)
- [ ] **Criar Transação** — registrar pagamento de comanda

### Conta
- [x] **Meu Perfil** (`MeuPerfil.jsx`) — compartilhado
- [x] **Trocar Senha** (`TrocarSenha.jsx`) — compartilhado

### Equipe
- [ ] **Horários dos Profissionais** — visualizar/editar disponibilidade da equipe

---

## 🧩 Componentes Compartilhados

### Layout e Navegação
- [x] **Layout com Sidebar/Menu** — `AppLayout.jsx` + `Sidebar.jsx`
- [ ] **Header** — informações do usuário logado, logout
- [ ] **Breadcrumb** — navegação hierárquica

### Cards
- [x] **Card base** — `Card.jsx` (prop elevated)
- [ ] **Card de Agendamento** — exibição padronizada com status visual
- [ ] **Card de Serviço** — exibição com preço, duração, categoria
- [ ] **Card de Combo** — exibição com progresso de sessões
- [ ] **Card de Comanda** — exibição com valor e status

### Formulários e Inputs
- [x] **Input base** — `Input.jsx` (label + error + focus:border-brand)
- [x] **Button** — `Button.jsx` (variants: primary/ghost/outline · sizes: sm/md)
- [ ] **Seletor de Profissional** — dropdown com profissionais ativos
- [ ] **Seletor de Cliente** — dropdown/busca de clientes
- [ ] **Seletor de Serviço** — dropdown com serviços disponíveis
- [ ] **Formulário de Horário** — dia da semana + hora início/fim
- [ ] **Date Picker** — seletor de data
- [ ] **Time Picker** — seletor de horário

### Tabelas e Listas
- [ ] **Tabela Paginada** — componente genérico com paginação
- [ ] **Filtros Reutilizáveis** — data, status, profissional, cliente

### Feedback e UI
- [x] **Badge de Status** — `Chip.jsx` (variants: default/brand/success/warning/danger/ghost + prop status)
- [x] **Avatar** — `Avatar.jsx` (gradientes por índice · sizes: sm/md/lg/xl)
- [x] **Icons** — `Icons.jsx` (`<Icon name="..." size={14} />`) — adicionados: x, lock, eye, eyeOff, logout, chevronRight, alertCircle, edit, trash
- [x] **Modal de Confirmação** — `Modal.jsx` — para ações críticas (deletar, cancelar)
- [x] **Loading/Spinner** — `Spinner.jsx` + `PageSpinner` — feedback de carregamento
- [x] **Toast/Notificação** — `ToastContext.jsx` + `useToast()` — feedback de sucesso/erro (provider em main.jsx)
- [x] **Empty State** — `EmptyState.jsx` — quando não há dados para exibir
- [ ] **Error Boundary** — tratamento de erros

---

## 🎨 Observações de Design

### Status Visuais

**Agendamentos:**
- `pendente` — amarelo/laranja
- `confirmado` — azul
- `cancelado` — vermelho
- `concluido` — verde

**Comandas:**
- `Em aberto` — amarelo
- `Paga` — verde
- `Cancelada` — vermelho

**Combos:**
- `pendente` — amarelo (aguardando pagamento)
- `ativo` — verde (disponível para uso)
- `concluido` — cinza (todas sessões consumidas)

### Métodos de Pagamento
- `dinheiro` — 💵
- `pix` — 📱
- `cartao_credito` — 💳
- `cartao_debito` — 💳

---

## 🔐 Controle de Acesso por Rota

| Tela | Admin | Profissional | Usuario |
|---|:---:|:---:|:---:|
| Dashboard próprio | ✅ | ✅ | ✅ |
| Meu perfil | ✅ | ✅ | ✅ |
| Trocar senha | ✅ | ✅ | ✅ |
| Meus agendamentos | ✅ | ✅ | ✅ |
| Gerenciar usuários | ✅ | ❌ | ❌ |
| Convidar profissional | ✅ | ❌ | ❌ |
| Gerenciar todos agendamentos | ✅ | ✅ | ❌ |
| Gerenciar serviços | ✅ | ✅ | ❌ |
| Gerenciar categorias | ✅ | ✅ | ❌ |
| Gerenciar pacotes | ✅ | ✅ | ❌ |
| Vender combo | ✅ | ❌ | ❌ |
| Ver combos ativos | ✅ | ✅ | ✅ (próprios) |
| Gerenciar comandas | ✅ | ✅ | ❌ |
| Gerenciar transações | ✅ | ✅ | ❌ |
| Horários de trabalho | ✅ | ✅ (próprio) | ❌ |

---

## 📝 Notas de Implementação

### Próximos Passos (Bloco 4)

**Bloco 4 — Integrar telas existentes com dados mockados:**
1. `AdminCaixa` → `GET /tab` + `POST /transaction` + `PATCH /tab/:id`
2. `AdminCombos` → `GET /package` + `POST /package/:id/sell`
3. `ClienteDashboard` → `GET /appointment/client/:id` (próximo + histórico)
4. `ProfissionalPainel` → `GET /appointment/my` (agenda do dia)

**Bloco 5 — Serviços e Categorias:**
1. `AdminServicos` real — `GET /service` + `GET /category` + CRUD
2. `AdminCategorias` — CRUD de categorias

**Bloco 6 — Gestão de Usuários:**
1. `AdminUsuarios` real — `GET /users` + filtros
2. `ConvidarProfissional` — `POST /auth/invite`
3. `AcceptInvitePage` — `POST /auth/accept-invite`

**Bloco 7 — Combos e Financeiro:**
1. `AdminCombos` com CRUD + vender combo
2. `AdminTransacoes` — lista de transações
3. `MeusCombos` (cliente)
4. `MinhasComandasCliente`

**Bloco 8 — Horários de Trabalho:**
1. `HorariosProfissional` — `GET/POST/PATCH/DELETE /working-hours`

---

## 🚀 Rotas Registradas

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

---

## ✅ Como Usar Este Checklist

1. Marque `[x]` quando uma tela estiver **100% funcional**
2. Adicione comentários sobre dependências ou bloqueios
3. Atualize o documento conforme o projeto evolui
4. Use como base para sprint planning e estimativas

---

**Última atualização:** 2026-04-22 — Meus Combos implementado e integrado (`GET /package/client/:id`). ClienteDashboard atualizado com card dinâmico de combos. Rota `/cliente/combos` registrada. Permissão de `Usuario` para `GET /package/client/:id` confirmada no backend.
