# CLAUDE.md — Dauth Agendamentos Frontend

Briefing técnico completo para sessões com Claude Code.

---

## Visão Geral

Frontend do **Dauth Agendamentos**, sistema de gerenciamento para o **Salão da Candi**.
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
      Button.jsx                ← variants: primary/ghost/outline · sizes: sm/md · prop `loading` (spinner inline + disabled automático) · prop `disabled` (sem spinner, só bloqueia)
      Avatar.jsx                ← gradientes por índice · sizes: sm/md/lg/xl
      Chip.jsx                  ← variants: default/brand/success/warning/danger/ghost + prop status
      Card.jsx                  ← prop elevated para shadow-sm
      Input.jsx                 ← label + error + focus:border-brand
      Icons.jsx                 ← <Icon name="..." size={14} /> — ícones SVG inline
      Modal.jsx                 ← isOpen/onClose/onConfirm/title/message/confirmLabel/loading
      ModalFecharConta.jsx      ← **Única UI de fechar conta (2026-07-18)** — antes existiam 2 versões inline duplicadas (AdminCaixa, ProfissionalComandas) além desta; agora as 6 telas usam este componente. Props: `client` = resposta direta de `GET /tab/client/:clientId/account-summary` (`{ client_id, client_name, tabs, orders, total, eligible }` — sem reshape no caller; cada `order` inclui `Quantity`, `Unit_price`, `Total_price`), `method`, `onMethodChange`, `paying`, `onClose`, `onConfirm(tabIds, orderPayments)`. **Remoção de item:** tabs têm ícone X (liga/desliga, `removedTabIds` Set); produtos têm um **stepper de quantidade** (−/+, só aparece quando `Quantity > 1`) que permite pagar só parte do pedido — ex: pediu 2 unidades, paga 1 agora, a outra fica pendente — mais o X que zera a quantidade de uma vez. State `orderQty` (`{ [orderId]: quantidade a pagar agora }`) inicializado com a `Quantity` cheia de cada pedido, resetado quando `client.client_id` muda. `onConfirm` recebe `tabIds` (array de UUID, itens não removidos) e `orderPayments` (array de `{ order_id, quantity }`, só os com quantidade > 0) — prontos pro body de `POST /tab/batch-pay { tab_ids, Method, Payment_date, order_payments }`; botão desabilitado se os dois arrays estiverem vazios. Seletor de método (4 botões 2×2 + botão "Fiado — cobrar depois" full-width separado com estilo warning); label muda para "Registrar no fiado" quando `method === 'fiado'`. Usado em AdminAgenda (context menu), MinhaAgenda (botão por card), DetalhesAgendamento (botão "Fechar comanda"), AdminUsuarios (ClientePanel), AdminCaixa e ProfissionalComandas (seção "Contas em aberto"). **Agrupamento por `Booking_group` + layout com altura máxima (2026-07-21):** tabs que compartilham `Appointment.Booking_group` (agendamento com múltiplos profissionais, ver seção "Estado atual") são agrupadas num card "Atendimento combinado" com a data do atendimento; container principal ganhou `max-h-[85vh]` + 3 blocos (header fixo, lista de itens `overflow-y-auto scrollbar-hidden`, rodapé fixo com método/botão) para comportar contas com muitos itens sem estourar a viewport. **Modal ampliado + produto embutido (2026-07-24):** pedido do usuário para caber mais conteúdo e adicionar produto sem sair do fluxo de fechamento. Container principal `max-w-[400px]→max-w-[860px]`, `max-h-[85vh]→max-h-[92vh]`; layout virou `flex flex-col md:flex-row` — coluna esquerda (itens + método + botão confirmar, inalterada) e coluna nova à direita `md:w-[300px]` "Produtos" com busca (`productSearch`) e lista de produtos ativos (`GET /product?limit=100`, fetch único no mount) com botão "+" por item. Estado do cliente deixou de vir só da prop: `clientData` (useState inicializado de `client`, resetado no mesmo `useEffect` que já reagia a `client.client_id`) é o que a UI renderiza — permite atualizar in-place sem fechar o modal. `handleAddProduct(product)` faz `POST /product-order { Product_id, Client_id: clientData.client_id, Quantity: 1 }` e, em caso de sucesso, chama `refreshSummary()` (novo `GET /tab/client/:clientId/account-summary`, resultado substitui `clientData`; `orderQty` ganha os pedidos novos com a `Quantity` cheia sem perder os ajustes já feitos nos existentes) — o total e a lista de itens à esquerda atualizam na hora, sem round-trip do componente pai. Falha no `POST` mostra toast de erro (`err.response?.data?.error`) e não mexe no estado; falha no `refreshSummary` é silenciosa (mantém o `clientData` anterior — o produto já foi criado no backend, só a exibição que não atualizou). Não precisou de nenhuma mudança nos 6 callers — o componente é autossuficiente a partir de `client.client_id`.
      Spinner.jsx               ← <Spinner size="sm|md|lg" /> + <PageSpinner /> (centered)
      EmptyState.jsx            ← icon/title/description/action/actionLabel
    layout/
      AppLayout.jsx             ← mobile-first: sidebar hidden em mobile, drawer overlay com hamburger (usa cloneElement para injetar onClose); logo + nome no header mobile; desktop: flex normal; conteúdo px-4 py-5 mobile / px-8 py-7 desktop; sino de notificações no header mobile com badge; polling fetchUnreadCount a cada 30s via useEffect
      Sidebar.jsx               ← logo-dauth-agendamentos.png + "Dauth Agendamentos"; NavLinks com navItems[], footerUser, footerRole; aceita prop onClose (fecha drawer mobile ao navegar); aside usa overflow-hidden + div interna `.nav-scroll` com overflow-y-auto e min-h-0 para manter footer (sino + logout) sempre visível sem scroll; scrollbar oculta via `.nav-scroll` em index.css; sino de notificações com badge no footer desktop (ao lado do logout); **`NavGroup`** — componente interno que renderiza itens com `children` como árvore colapsável: auto-abre quando `location.pathname` bate com o pai ou qualquer filho, linha vertical `border-l border-line-2` à esquerda dos filhos, filho ativo em `text-brand font-medium`; para adicionar sub-itens a um navItem basta incluir `children: [{ to, label }]` no `navItems.js`
      NotificationDrawer.jsx    ← bottom sheet mobile / drawer lateral 380px desktop; header com contagem + "Marcar todas como lidas"; lista com ícone por entity (cal/scissors/users/bell), timeAgo, bolinha unread; bg-brand-soft em não lidas; clicar marca como lida; Escape fecha
  pages/
    public/
      PortalPage.jsx            ← Landing page (/) — sem implementação
      AgendarPage.jsx           ← Stepper 5 etapas (serviço → profissional → data/hora → auth → confirmação); barra sticky no rodapé mobile; auth step com tabs mobile login/cadastro — login usa phone/senha, cadastro usa name/phone/birthday/senha (sem email); exibe user.name (não email) no header e nas telas de resumo. **Restore de estado pós-cadastro:** useEffect no mount lê query params (`sid`, `prof_id`, `prof_name`, `day`, `month`, `year`, `start`, `end`), restaura estado e seta step=4 se autenticado. **CRÍTICO — slots useEffect:** tem guard `if (step !== 2) return` para não apagar `selectedSlot` durante o restore (sem esse guard, `setSelectedDay` no restore disparava o effect que chamava `setSelectedSlot(null)`, quebrando a confirmação silenciosamente). Horários (`start`/`end`) são encodados com `encodeURIComponent` ao construir o `next` URL em `handleRegister`.
    auth/
      LoginPage.jsx             ← POST /auth/login (phone + senha) → GET /users/perfil/me → redireciona por role; campo telefone com máscara (11) 9 8765-4321; logo na brand section
      RegisterPage.jsx          ← POST /auth/register (name, phone, birthday, senha — sem email) → auto-login com phone → /cliente; campo email removido; logo na brand section
      AcceptInvitePage.jsx      ← POST /auth/accept-invite → GET /users/perfil/me → /profissional; logo via componente Brand; card padding p-5 md:p-8
      VerificarContaPage.jsx    ← POST /auth/verify (token da URL) → exibe "Conta verificada! → Ir para o login" (sem auto-login)
      EsqueciSenhaPage.jsx      ← POST /auth/forgot-password { phone } → tela de sucesso "Verifique seu WhatsApp"; resposta sempre neutra
      RedefinirSenhaPage.jsx    ← lê ?token= da URL; POST /auth/reset-password { token, password } → toast sucesso → redirect /login; tela de erro se token ausente na URL
    shared/
      MeuPerfil.jsx             ← GET/PATCH /users/perfil/me — sidebar role-aware via navItemsByRole[user.role], rota /perfil; InfoRow empilha em mobile (flex-col sm:flex-row); botão "Exportar meus dados" chama GET /users/perfil/me/export e dispara download via createObjectURL
      TrocarSenha.jsx           ← PATCH /users/perfil/me/password — rota /trocar-senha
      DetalhesAgendamento.jsx   ← GET /appointment/:id + PATCH Status — rota /agendamento/:id; para Admin/Profissional: card "Últimas visitas" com GET /appointment/my?client_name=X&limit=6 (filtro no backend); **botão "Fechar comanda"** visível apenas quando `Status === 'concluido'` (comanda só existe após conclusão) — fluxo idêntico ao AdminAgenda/MinhaAgenda: GET /tab → filtra por `Appointment.Client === item.Client` → GET /product-order → abre ModalFecharConta; fecha todas as comandas em aberto daquele cliente (não só a do agendamento atual)
    cliente/
      ClienteDashboard.jsx      ← ClienteSidebar local com logo; grid hero empilhado mobile / 1.3fr·1fr desktop; histórico como cards mobile (md:hidden) / tabela desktop (hidden md:block); clicar em "Ver detalhes" abre AppointmentPanel inline (não navega para /agendamento/:id) — bottom sheet no mobile (sobe de baixo, max-h 85vh, alça cinza, canto arredondado) e drawer lateral no desktop (420px, borda esquerda, altura total)
      MeusAgendamentos.jsx      ← GET /appointment/client/:id + filtro status; tabela hidden md:block / cards md:hidden
      MeusCombos.jsx            ← GET /package/client/:id — cards com barra de progresso, seções Ativos/Histórico; grid grid-cols-1 lg:grid-cols-2; aviso "Sessões são descontadas após a conclusão do atendimento" exibido apenas em pacotes com Status='ativo'
    profissional/
      ProfissionalAgenda.jsx    ← Rota raiz `/profissional`. Cópia exata do AdminAgenda adaptada para um profissional: grade de coluna única (`64px 1fr`), `GET /appointment/my?date=`, serviços filtrados por `GET /service?professional=UUID`, context menu com "Abrir comanda" (navega para `/profissional/comandas?appointment=UUID`), "Transferir data", "Ver detalhes" e ações de status; TransferirDrawer idêntico ao Admin, suporte a urgência, `load(silent)`, legenda de status; **paridade com AdminAgenda:** `ModalNovaCategoria` (z-[60]), `ModalNovoCliente` com botão `+`, `applyPhoneMask`, constantes `MODAL_CLS`/`MODAL_INNER_CLS`; **sem `ModalNovoServico`** — Profissional não tem `POST /service`; select de serviço sem botão `+`, ocupa largura total; **folgas na grade:** estado `leaves` (array); `load()` busca `GET /professional-leave/professional/${user.id}?date=`; mesmos helpers e bloco visual do AdminAgenda; **clique direito no bloco de folga** abre `LeaveContextMenu` com "Remover folga"; **`FolgaDrawer`** recebe `professionalId` fixo (sem select de profissional); botão `+ Folga` na barra de navegação; **`NovoAgendamentoDrawer`** carrega serviços com `GET /service?professional=authUser.id` (usando `useAuthStore` diretamente — nunca `professional.UUID` prop — para garantir o UUID correto do profissional logado)
      ProfissionalComandas.jsx  ← **2 sub-abas:** Serviços | Produtos. **Serviços:** idêntico ao TabComandas do AdminCaixa — carrega `GET /appointment/my?limit=500` + `GET /tab`, cruza client-side por `t.Appointment.UUID`; deep link `?appointment=UUID`; painel de pagamento individual e batch pay com suporte a fiado (`PAY_METHODS_PROD` + `PAY_METHODS_FIADO`); `handlePagar` usa `Payment: payMethod !== 'fiado'`; botão muda label para "Registrar no fiado" quando fiado selecionado; busca por cliente + filtro "Mensalistas" + linha "Expira em..." no painel — mesma UI do `TabComandas` do Admin (2026-07-25, ver "Proximos passos" abaixo). Grid sempre `lg:grid-cols-[1fr_400px]` (lista + painel), igual ao Admin — **sem painel lateral de produtos** (ver nota abaixo). **Produtos:** seletor de método com fiado (4 botões `PAY_METHODS_PROD` + botão fiado full-width); `handlePay` envia `{ Status: 'pago', Payment_method: payMethod, Payment: payMethod !== 'fiado' }`; formulário de novo pedido sem campo de método. **Constantes locais:** `PAY_METHODS_PROD` (4 métodos sem fiado), `PAY_METHODS_FIADO` (objeto `{id,icon,label}` para o botão fiado separado). **Painel lateral de produtos na aba Serviços — revertido (2026-07-25):** existiu entre 2026-07-23 e 2026-07-25 um componente `ComandaProdutosLateral` (3ª coluna do grid, `lg:grid-cols-[1fr_440px_320px]`, com busca de produto e histórico do cliente) — removido a pedido do usuário para restaurar paridade exata com o `TabComandas` do Admin (que nunca teve essa coluna); a tela de Comandas do Profissional volta a ter só lista + painel de pagamento, igual ao Admin.
      ProfissionalProdutos.jsx  ← Listagem read-only de produtos ativos (`GET /product`, filtrado `Active: true`). Sem ações de escrita — Profissional só tem GET em `/product`
      ProfissionalPedidosProdutos.jsx ← CRUD completo de pedidos de produto (Profissional tem acesso total a `/product-order`). Sem coluna "Vendido por". Baseado no AdminPedidosProdutos
      ProfissionalPainel.jsx    ← Now-card dark + próximos + grade de horários — integrado (legado, não é mais a rota raiz)
      MinhaAgenda.jsx           ← GET /appointment/my + filtros data/status; sem badge de tab_status (removido — não existe no AdminAgendamentos); **botão "Fechar" por card:** visível para agendamentos não-cancelados; mesma lógica de `AdminAgenda` (GET /tab → filtrar por client name → ModalFecharConta); card refatorado para separar área clicável de navegação (div flex-1 + chevron) do botão de fechar conta — `e.stopPropagation()` no botão evita navegar para detalhes ao clicar em "Fechar"
      ProfissionalServicos.jsx  ← Listagem read-only dos serviços do profissional — `GET /service?professional=${user.id}&limit=100` (filtro server-side; a abordagem anterior N+1 foi removida por ser lenta e frágil); sem ações de escrita — vínculos são gerenciados pelo Admin via AdminServicos
      ProfissionalHorarios.jsx  ← CRUD horários semanais — GET/POST/PATCH/DELETE /working-hours; break_start/break_end enviados no POST (não mais em PATCH separado)
      ProfissionalComissoes.jsx ← Visualização de comissões do profissional autenticado — `GET /transaction/my-commissions?month=YYYY-MM`; seletor mês/ano, 3 cards (atendimentos, receita gerada, comissão a receber em brand), tabela desktop com 7 colunas (`<thead>`: Data agend. | Data pgto. | Cliente | Serviço | Valor do serviço | Sua comissão | Repasse) + cards mobile (avatar+nome no topo, "Agend. DD/MM" e "Pgto. DD/MM" empilhados, valor e comissão no rodapé); campo `appointment_date` (data do atendimento) na primeira coluna, `data` (Payment_date) na segunda; badge "Repassado"/"A repassar" por linha via `commission_paid`; `colSpan=4` no tfoot (7 colunas: 4 texto + valor + comissão + vazio)
    admin/
      AdminAgenda.jsx           ← Grade por profissional + navegação de dia; **"Fechar comanda" no context menu:** opção adicionada para agendamentos não-cancelados; ao clicar, faz `GET /tab`, filtra tabs em aberto pelo nome do cliente (`t.Appointment?.Client === appt.Client`), extrai `clientId` de `openTabs[0].Appointment?.ClientId`, busca `GET /product-order?client_id=...&status=encomendado` e abre `ModalFecharConta`; se não há tabs em aberto, exibe toast de aviso; estados locais: `fecharContaClient`, `fecharContaMethod`, `fecharContaPaying`, `fecharContaOrders`, `fecharContaOrdersLoading`; barra de navegação: setas prev/next + ícone de calendário (abre datepicker nativo via input[type="date"] sobreposto opacity-0) + botão Hoje + **botão `+ Folga`** (abre FolgaDrawer); mobile: seletor de profissional (prev/next + contador N/total), desktop: grid completo; ambos com hidden md:grid / grid md:hidden; slots vazios clicáveis abrem NovoAgendamentoDrawer (bottom sheet mobile / drawer 420px desktop) com profissional e horário pré-preenchidos; slots passados (data anterior ou horário anterior ao atual no dia de hoje) ficam com bg-surface-2 e sem interação — função isSlotPast(date, slot); **slots "ocupados"** (coversSlot + Status !== 'cancelado') bloqueiam click para novo agendamento — cancelados não contam como ocupados, slot permanece clicável; ao salvar chama load() para recarregar a grade; **agendamentos cancelados aparecem na grade** com estilo riscado/vermelho (`STATUS_STYLE.cancelado`) — `load()` faz `setAppointments(all)` sem filtrar cancelados; **context menu (clique direito desktop / long press 500ms mobile)** em blocos de agendamento abre AppointmentContextMenu com opções dinâmicas por status: "Marcar como Confirmado" (pendente), "Marcar como Concluído" (confirmado), "Marcar como Cancelado" (pendente|confirmado), "Abrir comanda" e "Fechar comanda" apenas para `Status === 'concluido'` (antes era `!= 'cancelado'`; mudança intencional — comanda só existe após concluir); "Ver detalhes" (sempre → /agendamento/UUID), "Transferir data" (pendente|confirmado → abre TransferirDrawer); onTouchMove cancela o long press para não disparar durante scroll; menu reposiciona automaticamente próximo à borda da tela; **"Abrir comanda" coloca a comanda do agendamento primeiro na lista** — AdminCaixa ordena as tabs para que aquela cujo `Appointment.UUID === initialAppointmentId` apareça no topo (sort client-side no `filtered`); **double reload fix:** `load` useCallback tinha `professionals` como dep, causando dois carregamentos no mount (1º com array vazio, 2º após fetch de profissionais); corrigido com `professionalsRef = useRef([])` mantido em sincronia com `setProfessionals`; `load` lê `professionalsRef.current` e tem deps `[date]` apenas; useEffect condicional `if (professionals.length > 0) load()` com deps `[load, professionals.length]`; **cores de status na grade:** pendente=azul (`bg-[#dbeafe] text-[#1d4ed8]`), confirmado=success (verde), concluido=gold (`bg-[#faecd6] text-[#7a5c2e]`), cancelado=danger com line-through+opacity-60; **posicionamento de blocos:** funções `anchoredToSlot(appt, slot)` ancora o agendamento no slot de 30min que contém seu início (resolve agendamentos em horários não-múltiplos de 30min, ex: 19:45 ancora no slot 19:30); `apptTop(appt, slot, cellH)` calcula offset vertical em px dentro da célula; `apptHeight(appt, cellH)` calcula altura pela duração real em minutos — desktop cellH=64px, mobile cellH=56px; **sobreposição de agendamentos (inclui cancelados):** `computeColumns(appts)` pré-computa para cada profissional todos os agendamentos não-urgentes (incluindo cancelados) e atribui `col` e `totalCols`; agendamentos que se sobrepõem ficam lado a lado com `calc(100%/totalCols - 4px)`; `columnMap` é um Map UUID→{col,totalCols} calculado antes do render; cancelados compartilham colunas com ativos quando sobrepostos; **urgência:** `NovoAgendamentoDrawer` tem checkbox "Urgente" que seta `Is_urgent: true` no POST — agendamentos urgentes não passam por `checkConflict` no backend; na grade são renderizados POR CIMA (z-20) de todos os outros com largura total, borda `border-2 border-warning` e `shadow-md`, label "⚡ Urgente" no topo; agendamentos normais (e cancelados) ficam visíveis atrás com suas colunas proporcionais; **TransferirDrawer** permite alterar data, horário início e fim de agendamentos pendentes/confirmados via PATCH com os novos campos; **folgas na grade:** estado `leaveByProf` (Map UUID→Leave[]); `load()` busca `GET /professional-leave/professional/:id?date=` para cada profissional em `Promise.all`; helpers `leaveCoversSlot`, `leaveStartsAt`, `leaveSpans`; bloco vermelho `bg-danger-soft border-danger/30` com ícone `x` e label "Folga" — `All_day=true` ocupa toda a coluna (`TIME_SLOTS.length` slots), parcial ocupa o intervalo; slots cobertos por folga ficam sem interação; **clique direito no bloco de folga** abre `LeaveContextMenu` com opção "Remover folga" (`DELETE /professional-leave/:id` + `load(true)`); **`FolgaDrawer`** com select de profissional, data, checkbox "dia inteiro", horários condicionais e motivo; **`ModalNovaCategoria`** usa `z-[60]` (acima do overlay z-50 da ModalNovoServico)
      AdminAgendamentos.jsx     ← GET /appointment + filtro de data; **3 tabs:** Ativos (pendente+confirmado) · Concluídos · Cancelados — divisão feita no client após uma única chamada à API; cada tab exibe contador de itens (badge brand quando ativa, cinza quando inativa); chips de status removidos (tabs substituem); tabela hidden md:block / cards md:hidden; mobile usa Chip padrão de status
      AdminDashboard.jsx        ← GET /dashboard; KPIs hoje/período (grid 4 colunas: receita, ticket, comandas, cancelamentos), gráfico de área, top serviços (bar horizontal), ranking de profissionais (tabela desktop + cards mobile); bug de footerUser corrigido (sidebar footer com logout agora sempre visível). **Filtro de período (2026-07-19):** pills de preset (`Este mês` padrão · `Últimos 7 dias` · `Últimos 90 dias` · `Personalizado` com 2 inputs `type="date"`) — sem "Últimos 30 dias" porque é quase sempre redundante com "Este mês". Presets calculam `{from, to}` no cliente e mandam como query params; "Este mês" não manda nada (preserva o comportamento padrão do backend sem filtro). Bloco "Hoje" nunca muda com o filtro — é sempre o dia real. Título da seção de KPIs troca de mês fixo para `periodo.custom ? "DD/MM/AAAA — DD/MM/AAAA" : mês por extenso` (campo `periodo` novo no response). Gráfico de receita diária passa a cobrir o período inteiro (não mais fixo em 30 dias) quando um filtro está ativo.
      AdminCaixa.jsx            ← **3 abas principais:** Comandas | Produtos | Relatório (Comissões foi movida para página própria `/admin/comissoes`). **`activeTab` é URL-driven** via `?tab=produtos` / `?tab=relatorio` (default `comandas`) — os links do sidebar abrem a aba correta diretamente. **Comandas (TabComandas):** lista + painel de pagamento individual; seletor de método: 4 botões 2×2 (`PAY_METHODS`) + botão "Fiado — cobrar depois" full-width separado (`PAY_METHODS_FIADO`); `handlePagar` usa `Payment: payMethod !== 'fiado'`; seção "Contas em aberto" somente para clientes com **≥2 comandas em aberto** (clientes com apenas 1 comanda ficam na tabela normal); batch pay — mesmo padrão de seletor com fiado, label do botão muda para "Registrar no fiado"; deep link `?appointment=UUID`; ao clicar em "Abrir comanda" na Agenda, a comanda correspondente ao agendamento aparece primeiro na lista (sort client-side por `Appointment.UUID === initialAppointmentId`); `GET /tab` busca com `limit: 1000` para evitar cap de paginação esconder comandas recentes. **Produtos (TabPedidosProdutos):** lista clicável + painel sticky; seletor de método: 4 botões 2×2 (`PAY_METHODS`) + botão "Fiado — cobrar depois" full-width (`PAY_METHODS_FIADO`); `handlePay` usa `{ Status: 'pago', Payment_method: payMethod, Payment: payMethod !== 'fiado' }`; estoque verificado no backend antes do decremento (422 com mensagem amigável se insuficiente); formulário de novo pedido **não tem campo de método** — definido só na hora de pagar. `GET/POST /product-order` + `PATCH /product-order/:id`. **Relatório (TabRelatorio):** header com inputs De/Até + botão "Buscar"; GET /dashboard/payments, cards por método + total. **Sem toggle "Mensalistas" nesta aba** — a quitação de fiado pendente vive em `AdminUsuarios.jsx` (chip "Mensalistas" nos filtros de Clientes + `ModalPagarMensalidade`), não no Caixa; qualquer menção anterior a um toggle/`TabMensalista` dentro de `AdminCaixa.jsx` estava desatualizada e foi removida desta entrada. Constantes: `PAY_METHODS` (serviços+produtos com fiado), `PAY_METHODS_FIADO` (objeto do botão fiado).
      AdminComissoes.jsx        ← **Nova página standalone** em `/admin/comissoes`. **2 abas:** "Comissões" (padrão) e "Histórico de repasses". **Filtros:** barra de presets (`Todas | Dia | Semana | Quinzena | Mês` — constante `PRESETS`; `getDateRange(preset)` calcula `{from, to}` no cliente; "Todas" não envia params de data) + `SearchableSelect` de profissional (`GET /users?Role=Profissional` no mount; opção "Todos"). Query: `GET /transaction/all-commissions?from&to&professional_id`. **Listagem:** comissões exibidas em **toggle por status** — pills "A repassar" / "Repassadas" (estado `commissionTab`); exibe apenas uma seção por vez (nunca as duas simultaneamente); empty states específicos para cada aba ("Tudo repassado" / "Nenhum repasse"); `CommissionSection` tem `<thead>` com 7 colunas (Cliente | Serviço | Data agend. | Data pgto. | Valor serviço | Comissão | ação); mobile: um card por item em 2×2 grid com labels (Cliente / Serviço / "Agend. DD/MM · Pgto. DD/MM" / Valor + Comissão). **Bulk pay:** botão "Pagar todas" no cabeçalho de cada grupo "A repassar" abre `ModalPagarComissoes` — lista de itens com toggle (x=remover / +=re-adicionar, linha riscada quando removida), seletor de método (4 botões constante `PAY_METHODS`; `bg-ink` quando selecionado), total recalculado dinamicamente, confirmar desabilitado até método escolhido; `POST /transaction/commissions/bulk-pay { transaction_ids, method, professional_id, professional_name, total_amount }`. **Histórico:** `HistoricoRepasses` — selects mês/ano, `GET /transaction/commissions/history?professional_id?&from&to`; lista de registros `CommissionPayout` (paid_by_name, method via `METHOD_LABELS`, total_amount, transaction_count, paid_at). **`appointment_date`** (data do atendimento) ≠ `data` (Payment_date do fechamento da comanda) — ambos exibidos.
      AdminCombos.jsx           ← Grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 + CRUD + vender combo; drawers w-full md:w-[400-420px] com p-5 md:p-7
      AdminUsuarios.jsx         ← GET /users + PATCH /users/:id (ativar/desativar) + modal para Admin cadastrar novo usuário diretamente (POST /auth/register-admin, senha padrão 12345678, Must_change_password=true); tabela hidden md:block / cards md:hidden; **clicar em qualquer linha abre `ClientePanel`** (bottom sheet mobile / drawer 460px desktop) com KPIs do cliente (atendimentos concluídos, total gasto, ticket médio), comandas em aberto com botão "Fechar conta" (→ ModalFecharConta), e últimos 5 agendamentos (2026-07-19 — reduzido de 10 para não deixar o painel muito longo; corte só no `slice` do frontend, `GET /appointment/client/:id` continua trazendo o histórico completo); dados via `GET /appointment/client/:id` + `GET /tab/client/:id` (endpoint dedicado — sem limit hack); botão "Desativar/Ativar" usa `e.stopPropagation()` para não conflitar com abertura do panel; tag "Comanda aberta" removida das linhas (visível apenas como filtro); `GET /tab/client/:clientId` — **Admin e Profissional** — endpoint novo no backend que usa `tabModels.findByClient` (join Appointment→Client + Client_package), registrado antes de `/tab/:id` na rota. **Chip "Mensalistas":** primeiro item de `CLIENT_EXTRA_FILTERS`; `loadMensalistas()` chama `GET /transaction/fiado-pending` no mount; badge mostra contagem; `openClient(u)` faz lookup em `mensalistaClients` e seta `selectedMensalistaData`; `ClientePanel` exibe seção "Mensalidade pendente" com lista de itens e botão "Pagar mensalidade" → `ModalPagarMensalidade` (4 métodos de quitação, `POST /transaction/fiado-settle`). **Filtros server-side:** `usePaginatedList` envia todos os filtros como params (`search` debounced 300ms, `active`, `birthday_month`, `ids`); Sets de mensalistas/comanda_aberta convertidos em string estável para deps; toda filtragem client-side removida — "Carregar mais" agora funciona corretamente com qualquer filtro ativo
      AdminServicos.jsx         ← CRUD serviços + categorias; **`activeTab` URL-driven** via `?tab=categorias` (default `servicos`) — links do sidebar abrem aba correta; tabelas hidden md:block / cards md:hidden; todos os drawers w-full md:w-[360-420px] com p-5 md:p-7
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

## Button

```jsx
import Button from '@/components/ui/Button'

// Padrão — use loading= para ações assíncronas
<Button loading={saving}>Salvar</Button>

// Com ícone — spinner aparece antes do ícone
<Button loading={paying}><Icon name="check" size={14} />Registrar pagamento</Button>

// Só desabilitar (sem spinner) — use disabled= para estados de bloqueio não-async
<Button disabled={!canContinue}>Continuar</Button>
```

**Regra crítica:** use sempre `loading={estadoBooleano}` em botões que aguardam API. Nunca use `disabled={x} + {x ? 'Carregando...' : 'Texto'}` — o padrão `loading=` já aplica `disabled`, `opacity-60`, `cursor-not-allowed` e um spinner circular animado automaticamente. O texto dos filhos permanece visível ao lado do spinner.

**`disabled=` puro** é reservado para bloqueios não-async: botão fora de condição de uso (ex: `disabled={!canContinue}`, `disabled={mobileProfIdx === 0}`).

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
- **`dauth_cookies_accepted`** — salvo no localStorage com timestamp ISO 8601 (`new Date().toISOString()`) ao aceitar o banner de cookies. Antes armazenava a string `'true'`; a mudança para timestamp permite auditoria da data/hora do consentimento (LGPD). `CookieBanner.jsx` verifica a existência da chave com `localStorage.getItem(KEY)` — qualquer valor truthy é tratado como aceito

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

**Fix — refresh concorrente derrubava sessão (2026-07-13):** o `refresh_token` do Supabase é rotativo e de uso único. Antes, cada request que recebia 401 disparava seu próprio `POST /auth/refresh` — se duas ou mais requisições expirassem quase ao mesmo tempo (comum em telas que disparam vários GETs em paralelo, ex: `AdminAgenda.load()`), cada uma lia o mesmo cookie `refresh_token` e tentava consumi-lo; a segunda chegava ao backend com um token já rotacionado pela primeira, recebia 401 de novo e o interceptor derrubava a sessão inteira (`logout()` + redirect `/login`) mesmo com a sessão sendo válida segundos antes.

`src/lib/api.js` agora deduplica: uma variável de módulo `refreshPromise` guarda a promise do refresh em andamento; qualquer 401 concorrente reusa essa mesma promise em vez de disparar uma chamada nova, e ela é limpa (`.finally`) assim que o refresh termina.

```js
let refreshPromise = null
function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${import.meta.env.VITE_API_URL}/auth/refresh`, {}, { withCredentials: true })
      .finally(() => { refreshPromise = null })
  }
  return refreshPromise
}
```

Relacionado ao fix espelhado no backend: `authModels.refreshSession` usava o client singleton `supabase` (que mantém `currentSession` global do processo Node, compartilhado por todos os usuários/dispositivos) em vez de `createTempClient()` — mesmo problema de fundo (corrida em torno de refresh tokens rotativos), duas causas diferentes. Ver `Dauth_Back_end/docs/claude/decisions.md`.

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
// Auto-redirect: se a sessão for válida e o usuário estiver em / ou /login,
// redireciona para o dashboard do role via window.location.replace() antes de montar o React.
// O return impede o createRoot de rodar na página antiga — o browser carrega a nova URL
// e o bootstrap roda novamente já no caminho correto.
try {
  const { data } = await api.get('/users/perfil/me')
  restoreSession({ id: data.UUID, publicId: data.UUID, email: data.Email, name: data.Name, role: data.Role, must_change_password: data.Must_change_password })
  const path = window.location.pathname
  if (path === '/' || path === '/login') {
    const dest = data.Role === 'Admin' ? '/admin' : data.Role === 'Profissional' ? '/profissional' : '/cliente'
    window.location.replace(dest)
    return  // não monta React nesta navegação
  }
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

### GET /users/perfil/me/export
```json
{
  "exported_at": "ISO8601",
  "profile": { "UUID", "Name", "Phone", "Birthday", "Role", "created_at" },
  "appointments": [{ "UUID", "Date", "Start_time", "End_time", "Status", "Service": { "Name" }, "Professional": { "Name" }, "created_at" }]
}
```
- Disponível para todos os roles (Admin, Profissional, Usuario)
- Responde com header `Content-Disposition: attachment; filename="meus-dados-dauth.json"` — browser baixa automaticamente
- No frontend, `MeuPerfil.jsx` usa `URL.createObjectURL` para disparar o download via elemento `<a>` temporário
- Transações não incluídas — sem FK direta de `Transaction` para `Client`
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
| `/profissional` | ProfissionalAgenda | Profissional, Admin |
| `/profissional/agendamentos` | MinhaAgenda | Profissional, Admin |
| `/profissional/comandas` | ProfissionalComandas | Profissional, Admin |
| `/profissional/produtos` | ProfissionalProdutos | Profissional, Admin |
| `/profissional/pedidos-produtos` | ProfissionalPedidosProdutos | Profissional, Admin |
| `/profissional/servicos` | ProfissionalServicos | Profissional, Admin |
| `/profissional/horarios` | ProfissionalHorarios | Profissional, Admin |
| `/profissional/comissoes` | ProfissionalComissoes | Profissional, Admin |
| `/admin` | AdminAgenda | Admin |
| `/admin/agendamentos` | AdminAgendamentos | Admin |
| `/admin/caixa` | AdminCaixa | Admin |
| `/admin/comissoes` | AdminComissoes | Admin |
| `/admin/combos` | AdminCombos | Admin |
| `/admin/usuarios` | AdminUsuarios | Admin |
| `/admin/servicos` | AdminServicos | Admin |
| `/admin/convidar-profissional` | ConvidarProfissional | Admin |
| `/docs` | DocsPage | Admin, Profissional |

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
- **Fix — aviso de conflito de horário não disparava no `/agendar` (2026-07-26)** — bug real no fix abaixo: os dois botões de "Confirmar" (`AgendarPage.jsx`, desktop e barra sticky mobile) chamavam `onClick={handleConfirm}` direto — o React injeta o `SyntheticEvent` do clique como primeiro argumento, que caía em `skipConflictCheck` (sempre truthy como objeto), pulando a checagem de conflito em 100% dos cliques. Corrigido para `onClick={() => handleConfirm()}` nos dois lugares.
- **Aviso de conflito de horário em dia diferente de profissional (2026-07-26)** — usuário reportou que uma cliente conseguia agendar dois serviços no mesmo dia/horário com profissionais diferentes sem nenhum aviso (ex: 31/07 às 9h com a profissional A, depois 31/07 às 9h com a profissional B). Decisão: não bloquear (existe o caso legítimo de atendimento em paralelo, ex.: cabelo + unha ao mesmo tempo — o próprio sistema já suporta isso via `Booking_group` para agendamentos feitos pelo Admin), só avisar. `AgendarPage.jsx` → `handleConfirm(skipConflictCheck = false)`: antes do `POST /appointment`, busca `GET /appointment/client/:id?date=<data>` e procura um agendamento não-cancelado da cliente no mesmo dia que se sobreponha no horário (`Start_time < novo.end_time && End_time > novo.start_time`) com um **profissional diferente** do selecionado. Se encontrar, abre um `Modal` ("Você já tem um agendamento nesse horário... Deseja continuar mesmo assim?") em vez de criar direto; confirmando o modal chama `handleConfirm(true)`, pulando a checagem. Se a checagem em si falhar (erro de rede), não bloqueia o fluxo — segue para o POST normalmente.
- **Fix — "Voltar ao início" na tela de sucesso do agendamento (2026-07-26)** — `AgendarPage.jsx`: o botão "Voltar ao início" (tela de sucesso após confirmar) navegava sempre para `/` (landing pública, sem implementação) em vez da tela inicial do usuário logado. Corrigido para usar o mesmo cálculo de destino por role que o botão "Ver minha conta" já usava (`/admin` | `/profissional` | `/cliente`).
- **Ordenação de agendamentos — mais recente primeiro (2026-07-26, backend)** — `appointmentModels.find`/`findByProfessional`/`findByClient` não tinham nenhum `.order()`, retornando em ordem arbitrária do banco. Adicionado `.order('Date', { ascending: false }).order('Start_time', { ascending: false })` nos três — cobre `GET /appointment` (`AdminAgendamentos`), `GET /appointment/my` (Minha Agenda do Profissional, "Últimas visitas" em `DetalhesAgendamento`) e `GET /appointment/client/:id` (Meus Agendamentos do cliente). `ClienteDashboard.jsx` já ordenava client-side corretamente (próximo agendamento com data mais próxima primeiro em `upcoming`, mais recente primeiro em `recent`) e não precisou de mudança.
- **`ClienteDashboard` — "cliente desde" com mês (2026-07-26)** — mostrava só o ano (`cliente desde 2026`); trocado `sinceYear` (número) por `sinceLabel` (string `"Maio 2026"`), formatado com `toLocaleDateString('pt-BR', { month: 'long' })` + capitalização manual da primeira letra. Prop renomeada na função local `ClienteSidebar` deste arquivo (não é a mesma que o componente compartilhado `@/components/layout/ClienteSidebar`, ver abaixo).
- **`DetalhesAgendamento.jsx` — sidebar do Cliente inconsistente (2026-07-26)** — tela usava sempre o `Sidebar` genérico (Admin/Profissional), sem o cabeçalho de avatar/nome nem os itens específicos do Cliente, mesmo quando `role === 'Usuario'`. Fix: importa `ClienteSidebar` de `@/components/layout/ClienteSidebar` (componente compartilhado já usado por `MeuPerfil.jsx`, com `navItemsByRole['Usuario']` — diferente das 4 cópias locais de `ClienteSidebar` hardcoded em `ClienteDashboard`/`MeusAgendamentos`/`MeusCombos`/`MinhasComanadas`, que continuam como estavam) e escolhe entre os dois com `role === 'Usuario' ? <ClienteSidebar user={user} /> : <Sidebar .../>`, mesmo padrão já usado em `MeuPerfil.jsx`.
- **Agenda (Admin) — colunas de profissional padronizadas + paginação em blocos de 5 (2026-07-26)** — dois problemas na grade desktop do `AdminAgenda.jsx`: (1) a largura de cada coluna variava com o tamanho do nome do profissional (CSS Grid com `1fr` sem mínimo travado expande a coluna até caber o `min-content` do conteúdo) — corrigido trocando `repeat(N, 1fr)` por `repeat(N, minmax(0, 1fr))` + `min-w-0` no nome truncado, forçando divisão igual independente do texto. (2) Com muitas profissionais, as colunas ficavam espremidas/exigiam scroll lateral — implementado paginação desktop em blocos de até `DESK_PAGE_SIZE = 5` profissionais por vez, com setas ◀▶ e contador ("Profissionais 1–5 de 8") acima da grade, mesmo princípio do seletor mobile já existente (1 profissional por vez) só que em grupos de 5. Com 5 ou menos profissionais, nada muda (sem paginação).
- **Agendamentos do Profissional replicado da tela do Admin (2026-07-26)** — `MinhaAgenda.jsx` (rota `/profissional/agendamentos`) estava com layout/filtros diferentes de `AdminAgendamentos.jsx` (paginação client-side, sem tabs de status, com botão "Fechar comanda" por card). Reescrito para ser idêntico ao Admin: header, busca por cliente + filtro de data, tabs "Ativos/Concluídos/Cancelados" com contadores, tabela desktop + cards mobile, paginação server-side (`usePaginatedList`) — só trocando o endpoint para `/appointment/my`. Por decisão do usuário, o botão "Fechar comanda" que existia antes foi removido (fechar conta continua disponível na aba Comandas). **Backend necessário:** `appointmentModels.findByProfessional` não suportava `status` como lista separada por vírgula (só `.eq()` exato) — corrigido para `.in()` quando há mais de um valor, mesmo padrão já usado em `find()`; `appointmentController.getMy` validava `status` contra um único valor de `VALID_STATUSES` — corrigido para validar cada item de uma lista separada por vírgula. Sem os dois fixes, a aba "Ativos" (`status=pendente,confirmado`) retornava 422.
- **Dashboard — filtro de período trocado (2026-07-26)** — pills "Este mês / 7 dias / 90 dias" trocadas por "7 dias / 30 dias / 60 dias / 90 dias" (`AdminDashboard.jsx`, `PRESETS`); preset "mes" removido por completo (não existe mais o comportamento "sem filtro = mês corrente" do backend sendo usado por essa tela — todo preset agora envia `from`/`to` explícito); padrão ao carregar a página passou de "Este mês" para "7 dias".
- **Fonte global unificada em uma única variável (2026-07-26)** — sistema usava 4 fontes (Space Grotesk/display, Inter/body, JetBrains Mono/mono, Cormorant Garamond/serif) via Google Fonts. Padronizado para **Inter** em tudo, mas através de uma constante única (`FONT_FAMILY` no topo de `tailwind.config.js`, nos dois projetos — Frontend e `Dauth Landing`) que alimenta os 4 tokens Tailwind (`display`/`body`/`mono`/`serif`) — trocar 1 valor e todo o sistema muda, sem tocar nos ~600 usos de `font-*` nos componentes. `index.html` (nos 2 projetos): `<link>` do Google Fonts reduzido para importar só Inter. `src/index.css` (só Frontend): os 4 hardcodes de `font-family` (Shepherd Tour + `.prose-dauth code`) trocados para `theme('fontFamily.xxx')`, puxando do mesmo Tailwind config em vez de repetir o nome da fonte. `hifi/tokens.css` (referência de design, não usado pelo build) ficou de fora por não afetar o app.
- **Permissionamento por módulo para Profissionais (2026-07-25, backend + frontend, migration em DEV, código não commitado)** — admin agora consegue restringir, profissional a profissional, o que cada um vê/gerencia em 5 módulos (Caixa, Agenda, Clientes, Comissões, Produtos), cada um com flags `Can_view`/`Can_manage` independentes. `AdminUsuarios.jsx` → `ClientePanel`: nova seção "Permissões" (só quando `client.Role === 'Profissional'`) com checkboxes por módulo (`Gerenciar` desabilitado se `Visualizar` estiver desmarcado) + botão "Salvar permissões" → `PUT /professional/:id/permissions`. Novo `src/config/modules.js` (5 módulos + `NAV_ITEM_MODULE`, mapa `to → module` dos itens de menu do Profissional) e `src/hooks/usePermission.js` (`can(module, 'view'|'manage')`, sempre `true` para Admin/Usuario ou quando não há registro — default liberado, espelha o backend). `Sidebar.jsx` filtra itens do menu sem `Can_view`; `router/ProtectedRoute.jsx` ganhou prop `requiredModule` para bloquear acesso direto por URL (redireciona `/nao-autorizado`), aplicada nas 6 rotas de Profissional com módulo mapeado. `main.jsx`/`LoginPage.jsx` buscam `GET /professional/:id/permissions` e guardam em `user.permissions` no `authStore`, só para role Profissional. Ver `Dauth_Back_end/docs/claude/decisions.md`, seção "Permissionamento por módulo para Profissionais", para o detalhamento completo do backend. Telefone de cliente removido do único lugar em que era exibido pro Profissional (`ProfissionalPedidosProdutos.jsx`, drawer de detalhes do pedido) a pedido explícito da admin — decisão final foi resolver só a exibição na UI, sem sanitizar o payload no backend (`GET /users`/`GET /product-order` ainda trazem `Phone`, só não é mais renderizado). `GET /tab` também não filtra comandas por profissional (Profissional vê comandas de todos os colegas) — decisão consciente de manter assim, não é bug pendente.
- **Fix — Comandas do Profissional fora de paridade com o Admin (2026-07-25)** — `ProfissionalComandas.jsx` (sub-aba Serviços) estava faltando 3 recursos que o `TabComandas` do `AdminCaixa.jsx` já tinha: busca por nome de cliente, filtro "Mensalistas" e a linha "Expira em..." no painel de detalhe — adicionados para igualar ao Admin. Na mesma sessão, o usuário reportou que a tela do Profissional tinha um painel lateral de produtos (3ª coluna, `ComandaProdutosLateral`, adicionado em 2026-07-23) que **não deveria existir ali** — removido por completo (componente e a coluna extra do grid) para restaurar a paridade exata com o Admin: a tela volta a ter só lista de comandas + painel de pagamento.
- **Urgente na criação — fusão automática + fix visual de sobreposição (2026-07-25)** — `AdminAgenda.jsx`/`ProfissionalAgenda.jsx`: agendamentos urgentes deixaram de renderizar por cima de tudo em largura total (`inset-x-[3px] z-20`, escondendo o agendamento por baixo) — `computeColumns` agora inclui urgentes no cálculo de divisão de largura junto com os normais; a diferença visual virou só borda/sombra/label "⚡ Urgente", nunca mais cobre outro bloco. Backend: criar um agendamento urgente que se sobrepõe a outro da MESMA profissional + MESMA cliente (`POST /appointment/batch`) agora funde automaticamente como serviço adicional no Appointment existente (`Add_services`/`findOverlapping`, novo helper) em vez de criar um segundo registro — cobre o caso real "coloração + manicure em paralelo enquanto o produto age". Ver `Dauth_Back_end/docs/claude/decisions.md`. **Fix lateral:** unificar os `.map()` de normal/urgente quebrou o alinhamento do nome da cliente (truncate sem largura pra calcular, depois descentralizado) — corrigido com `w-full min-w-0 justify-center` na linha do nome, nos 3 blocos de render.
- **`ModalFecharConta` — comanda unificada numa lista só, produtos por último (2026-07-25)** — o card especial "Atendimento combinado" (Booking_group) foi removido; agora TODOS os itens de TODAS as Tabs abertas da cliente entram numa única lista com a mesma grid Serviço|Profissional|Dia|Hora|Valor (decisão confirmada com o usuário: só unifica a aparência, não funde Tabs de verdade no banco — preserva comissão por profissional). Produtos (`Tab_items.Item_type === 'product'`) são ordenados sempre por último (`.sort()` estável) com Profissional/Dia/Hora mostrando `—`, e ganham um header "Produtos" inserido dinamicamente antes da primeira linha de produto. Ver `Dauth_Back_end/docs/claude/decisions.md`.
- **Horário individual por serviço em bloco fundido + fix de Tab duplicada (2026-07-25)** — 2 bugs reais achados a partir de um caso de produção (cliente com atendimento combinado): (1) `POST /tab` criava uma Tab presa direto ao `Appointment` mesmo quando ele tinha `Booking_group`, gerando 2 Tabs pro mesmo atendimento combinado em vez de 1 — corrigido no backend (`tabController.insert`), ver `Dauth_Back_end/docs/claude/decisions.md`. (2) Serviços fundidos no mesmo `Appointment` (mesma profissional) mostravam todos o mesmo horário — `Appointment_services` só guardava `Service_id`/`Order`, sem horário por item. Migration nova (`Appointment_services`/`Tab_items` ganharam `Start_time`/`End_time`) + RPC `create_appointment_batch` (v3) + `addServiceToAppointment` + Tab_items da conclusão passaram a gravar o horário individual de cada serviço. **Frontend:** `ModalFecharConta.jsx` usa `it.Start_time` (do item) em vez de `t.Appointment?.Start_time` (do bloco inteiro) por linha; `DetalhesAgendamento.jsx` (`GroupMemberRow`) expande `member.Services` em sub-linhas com horário próprio quando há mais de 1 serviço, em vez de juntar nomes numa string com 1 horário só. Dados antigos (antes da migration) ficam `NULL` e caem no fallback do horário do bloco inteiro — sem forma confiável de reconstruir a divisão original.
- **Tela de detalhes unificada para atendimento combinado multi-profissional (2026-07-25, versão final após feedback)** — `DetalhesAgendamento.jsx`: um agendamento com N serviços em N profissionais diferentes (mesmo `Booking_group`) mostra todos juntos ao clicar em "ver detalhes" de qualquer um deles. `GET /appointment/:id` ganhou `Group: [...] | null` (backend, ver `Dauth_Back_end/docs/claude/decisions.md`). `GroupMemberRow` (serviço(s) · profissional · horário · `Chip` de status, sem ação inline) virou o formato **padrão** do card "Informações" — mesmo agendamento solo agora renderiza como lista de 1 item (antes eram `InfoRow`s separadas de "Horário"/"Serviço"); o card "Profissional" da coluna direita foi removido de vez (redundante em qualquer caso). **Status em lote:** os botões `Marcar como Confirmado/Concluído/Cancelado` do rodapé afetam **todos** os membros do grupo de uma vez (pedido explícito do usuário — antes era por linha, com botão de status em cada `GroupMemberRow`, removido) — `changeStatus()` calcula `targetIds` (todo `item.Group` ou só `[id]` se solo) e dispara 1 `PATCH` por membro via `Promise.all`, sem atomicidade (mesmo padrão de risco já aceito em outros fluxos multi-item), depois rebusca a página inteira. Clicar num membro que não é o atual navega pra `/agendamento/:uuid` dele. **Fora de escopo:** "Editar"/"Excluir"/"Fechar comanda" continuam operando só sobre o item atualmente carregado — editar outro membro exige navegar até ele primeiro.
- **Fundir serviços adicionados na edição de agendamento no bloco original (2026-07-25)** — nos 3 fluxos de edição (`DetalhesAgendamento.jsx`, `TransferirDrawer` em `AdminAgenda.jsx` e em `ProfissionalAgenda.jsx`), adicionar um serviço novo (`+ Adicionar serviço`) durante a edição agora **funde de verdade** no `Appointment` original — 1 card só na Agenda, 1 Tab só ao concluir — em vez de criar um `Appointment` separado (comportamento antigo) ou só compartilhar `Booking_group` (primeira tentativa desta sessão, descartada por não fundir o bloco na grade). Como a edição sempre usa a mesma profissional (sem seletor por item), a fusão real faz sentido — mesmo padrão de `Appointment_services` que `POST /appointment/batch` já usa na criação. `handleSaveEdit`/`handleSalvar` passaram de um loop `PATCH original + POST por item novo` para **1 único `PATCH`**: o item original manda seus campos normais + `Add_services: [{ Service, Start_time, End_time }]` para cada item novo. Backend: `PATCH /appointment/:id` ganhou o campo `Add_services` (reaproveitando o endpoint existente, sem rota/schema/permissão novos) — ver `Dauth_Back_end/docs/claude/decisions.md`, seção "Fundir serviços adicionados na edição de agendamento no bloco original".
- **`ModalFecharConta` virou tela cheia deslizante + grid alinhado + fix de busca de cliente + Agenda com serviços em linhas separadas (2026-07-25)** — 4 mudanças na mesma sessão:
  1. **`ModalFecharConta.jsx` deixou de ser modal centralizado e virou uma "tela nova"** que sobe de baixo e ocupa toda a área de conteúdo (mantendo a sidebar visível ao lado, não é mais `fixed inset-0` cobrindo tudo). Wrapper externo trocou de `flex items-center justify-center` + `max-w-[860px]` para `fixed inset-y-0 left-0 right-0 md:left-[240px]` (240px = largura fixa da `Sidebar`, ver `Sidebar.jsx:58`) com `h-full` e animação `translate-y-full → translate-y-0` (`useState visible` + `requestAnimationFrame` no mount; sem animação de saída, fecha instantâneo como os outros modais do app). Sem overlay/backdrop escurecido — é uma troca de tela opaca (`bg-surface`), não um diálogo sobre o conteúdo. **Decisão restrita a este componente** — outros modais de caixa/comanda (painel de pagamento individual em AdminCaixa/ProfissionalComandas) continuam como estavam, por escolha explícita do usuário.
  2. **Total fixo + método de pagamento compacto:** "Total" saiu da lista rolável e foi para o rodapé fixo (nunca rola para fora de vista); seletor de método trocou da grade 2×2 de botões grandes (ícone empilhado + label, `py-3`) para uma linha de pills pequenas (`rounded-full px-2.5 py-1.5`, ícone+label inline) — inclui o botão "Mensalista" (antes full-width separado).
  3. **Cada item da comanda ganhou colunas alinhadas Serviço | Profissional | Dia | Hora | Valor**, com header explicando cada coluna. Depois de 3 iterações (texto com `·` truncando em 1 linha → `flex justify-between` que quebrava em 5 linhas em telas estreitas) a solução final é **1 grid único** (`grid-cols-[1.3fr_1fr_0.85fr_0.6fr_5rem_24px]`) compartilhado entre o header e cada linha de item — é o que garante alinhamento de verdade entre colunas (flex com larguras variáveis por conteúdo não alinha, grid com template fixo sim). Aplica-se à linha de item único/sem-Appointment/combo; a linha do card "Atendimento combinado" (múltiplos itens) usa `col-span-4` no nome (itemização real fica nas sub-linhas abaixo, que já tinham profissional).
  4. **Fix — dropdown de cliente travava mostrando só nomes até a letra C:** `SearchableSelect.jsx` tinha `minChars = 0`, então ao abrir qualquer dropdown de cliente (8 telas, via `searchClients.js`) ele disparava `GET /users?Role=Usuario&limit=20` **sem termo de busca**, e o usuário via só os 20 primeiros nomes em ordem alfabética — parecia uma lista truncada/sem scroll, mas na verdade nunca existiu uma "lista completa" para rolar (design intencional de busca remota, ver seção "Escalabilidade de dropdowns" abaixo). Fix: `minChars` default subiu para `1` — dropdown mostra "Digite para buscar…" até o usuário digitar, results sempre vêm do `?search=` real no backend, cobrindo todos os clientes.
  5. **Agenda — múltiplos serviços de um bloco combinado exibidos em 1 linha por serviço:** `serviceLabel(appt)` (helper que junta `Services[].map(Name).join(' + ')` numa única string truncada) ganhou uma irmã, `serviceNames(appt)`, que retorna o array em vez de string juntada. Os 4 blocos de agendamento em `AdminAgenda.jsx` (desktop/mobile × normal/urgente) e os 2 em `ProfissionalAgenda.jsx` passaram a mapear `serviceNames(a)` em uma `<div className="truncate">` por serviço, em vez de 1 linha só com `+` que cortava a informação. O card do agendamento (`button`) já tinha `overflow-hidden` — múltiplas linhas de serviço são cortadas na borda do card automaticamente, sem estourar layout. `serviceLabel` continua em uso nos lugares que precisam de string única (menu de contexto, ver `AdminAgenda.jsx:63`).
- **Editar valor de item na comanda + fix de performance (2026-07-24, em andamento, não commitado)** — `ModalFecharConta.jsx`: o valor de cada item de uma comanda (serviço ou produto já lançado, via `Tab_items`) agora é clicável e vira um input inline (Enter confirma, Esc cancela sem salvar) que chama `PATCH /tab/:tabId/items/:itemId { Unit_price }` (backend novo, ver `Dauth_Back_end/docs/claude/decisions.md`, seção "Edição de preço de item da comanda"). Funciona tanto no card "Atendimento combinado" (cada item da lista) quanto na comanda de item único (o próprio valor do cabeçalho da linha vira editável). Comandas sem `Tab_items` (legado ou sessão de combo) continuam com valor fixo, sem edição. **Fix de performance no mesmo dia:** a primeira versão chamava `refreshSummary()` (refaz `GET /tab/client/:clientId/account-summary` inteiro) depois de cada edição — isso levava ~10-15s porque esse GET encadeia várias queries sequenciais no Supabase (`findTabIdsByClient` sozinho já faz 4). Trocado por atualização otimista do estado local: o `PATCH` já devolve o item atualizado, e `Tab.Value` é recalculado no cliente somando `Unit_price × Quantity` dos itens — a mesma soma que o trigger `recalc_tab_value` já faz no banco — então não há mais round-trip nenhum além do próprio `PATCH`. Backend também paralelizou (`Promise.all`) as duas queries de validação do endpoint (buscar a Tab + buscar o item), que antes rodavam em série.
- **Agendamento multi-profissional + `Booking_group` (2026-07-21)** — `NovoAgendamentoDrawer` (`AdminAgenda.jsx`): cada item de serviço agora tem seu próprio `SearchableSelect` de **profissional**, posicionado **antes** do select de Serviço (que fica desabilitado até escolher o profissional — a lista de serviços é filtrada por profissional via `servicosByProf`, cache `{ [profUUID]: servico[] }`). Trocar o profissional de um item limpa o `servicoId` selecionado. Ao salvar um agendamento com mais de 1 item, gera-se `crypto.randomUUID()` uma única vez e envia-se o mesmo `Booking_group` em cada `POST /appointment` do lote (backend: campo novo, `docs/migrations/appointment_booking_group.sql`, aplicado só em **DEV** por decisão do usuário — pendente produção). `ModalFecharConta.jsx` agrupa client-side as tabs com o mesmo `Booking_group` num card "Atendimento combinado" (serviço · profissional · horário de cada item + data do atendimento no canto, vinda de `tabs[0]?.Appointment?.Date`); pagamento continua via `batch-pay` já existente, sem mudança de mecânica financeira — o agrupamento é só visual. `ModalFecharConta.jsx` também ganhou `max-h-[85vh]` com 3 blocos (header fixo, lista de itens rolável com `.scrollbar-hidden`, rodapé fixo com método + botão) para não estourar a viewport com muitos itens. **Pendência aberta:** usuário reportou uma linha estranha (`"· · —"` + valor igual ao Total) na comanda com muitos itens — não reproduzida/diagnosticada ainda, aguardando screenshot; suspeita é uma tab com `Appointment` null (ex: tab de combo) sem fallback tratado em `renderTab`. Ver `Dauth_Back_end/docs/claude/decisions.md`, seção "Agendamento multi-profissional — `Booking_group`", para o racional completo (por que não virou 1 Tab de verdade) e o fix lateral de `Is_urgent` ausente em `appointmentModels.find`.
- **AdminAgenda — grade: header fixo, horário 6h–00h, agrupamento por UUID (2026-07-21)** — header de profissionais (linha com avatar+nome) ganhou `sticky top-0 z-30`; grade desktop e mobile passaram a ter `overflow-y-auto` com altura máxima (`max-h-[70vh]` desktop, `max-h-[65vh]` mobile) e scrollbar oculta via nova classe `.scrollbar-hidden` em `index.css` (generalização do padrão já usado na sidebar). `TIME_SLOTS` ampliado de 08:00–22:00 para **06:00–00:00** (`AdminAgenda.jsx` e `ProfissionalAgenda.jsx`). **Fix de bug real:** a grade agrupava agendamentos por **nome** do profissional (`a.Professional === prof`) em vez de UUID — profissionais com o mesmo nome tinham agendamentos duplicados/trocados entre colunas; corrigido para `a.Professional_id === profObj.UUID` em todos os filtros (`columnMap`, blocos desktop e mobile) — campo que o backend já retornava, só não era consumido. Blocos de agendamento no grid mobile (antes `text-left`) passaram a `text-center` + `flex flex-col justify-center items-center`, paridade com desktop.
- **ConvidarProfissional — aviso de expiração do convite (2026-07-21)** — bloco `bg-warning-soft` informando que o profissional tem 1 hora para aceitar o convite antes do link expirar (TTL real do magic link do Supabase Auth, confirmado via teste prático pelo usuário — não documentado em nenhum lugar do código, que usa `inviteUserByEmail` sem TTL customizado explícito).
- **Método de pagamento visível na comanda + tag Mensalista (2026-07-19)** — `GET /tab` passou a incluir `Transaction(Method, Payment, Payment_date)` (array; embed adicionado em `tabModels.find` no backend). Em `AdminCaixa.jsx` e `ProfissionalComandas.jsx` (componentes duplicados por arquivo, padrão local): `TabPaymentInfo({ tab })` substitui o bloco estático do painel para comandas não-abertas — mostra "Pagamento confirmado" + método e data (`Pix · 19/07/2026`); fiado pendente exibe "Registrada como mensalidade · aguardando quitação" (warning); combo (`Value === 0`, sem transação) exibe "Sessão de combo"; fallback "Sem transação registrada" indica **backend desatualizado** (sem o embed). `isFiadoTab(t)` troca o chip "Paga" por chip warning **"Mensalista"** nas linhas da lista quando a transação é fiado — a tag persiste após quitação (identifica "foi mensalista"). `PAYMENT_LABELS_PROD` ganhou `fiado: 'Mensalista (fiado)'` nos dois arquivos. **Bug relacionado resolvido no mesmo dia (sem código):** mensalistas não apareciam em Clientes porque produção não tinha as migrations do fiado (`Transaction.Client_id`, `FiadoSettlement`, check de `ProductOrder`) — aplicadas via MCP; ver `Dauth_Back_end/docs/claude/decisions.md`, seção "mensalista invisível em Clientes".
- **Fechar conta — lógica movida pro backend + remoção de itens (2026-07-18)** — supersede todas as menções abaixo a "GET /tab → filtra em aberto → GET /product-order" nas 6 telas de fechar conta (AdminAgenda, MinhaAgenda, DetalhesAgendamento, AdminUsuarios, AdminCaixa, ProfissionalComandas). Fluxo atual: abrir modal chama `GET /tab/client/:clientId/account-summary` (retorna `{ client_id, client_name, tabs, orders, total, eligible }` pronto, sem fetch duplo nem filtro client-side); se `!eligible`, toast de aviso. Seção "Contas em aberto" (AdminCaixa e ProfissionalComandas) usa `GET /tab/open-accounts`, que já aplica a regra `≥2 itens` no backend — as duas telas têm o mesmo comportamento agora (antes só a AdminCaixa tinha o piso). `ModalFecharConta` (ver descrição em `components/ui/`) ganhou botão X por tab e **stepper de quantidade por produto** (permite pagar só parte de um pedido, ex: 1 de 2 unidades, resto fica pendente); `onConfirm(tabIds, orderPayments)` monta `POST /tab/batch-pay { tab_ids, Method, Payment_date, order_payments }` — **campo evoluiu de `client_id` → `order_ids` → `order_payments`** (array de `{ order_id, quantity }`) no mesmo dia, qualquer código novo que chame esse endpoint deve usar o formato atual. Ver `Dauth_Back_end/docs/claude/decisions.md`, seção "Fechar conta — lógica movida pro backend + seleção de itens" (e o follow-up de quantidade parcial logo abaixo dela), para detalhes do backend (migrations da RPC `batch_pay_tabs`, endpoints novos). **Migration da quantidade parcial (`batch_pay_tabs_partial_quantity.sql`) ainda pendente de aplicar em DEV** — sem ela, `POST /tab/batch-pay` quebra (RPC no banco ainda espera a assinatura antiga).
- **Editar cliente (AdminUsuarios, 2026-07-12)** — `ClientePanel` ganhou modo de edição: ícone de lápis no header (mobile) / botão "Editar cliente" abaixo de "Últimos agendamentos" (desktop) abrem um form com Nome, Telefone e Data de nascimento (resolve o caso de clientes cadastrados sem aniversário); `PATCH /users/:id` com `{ Name, Phone, Birthday }` (endpoint já existia, só faltava UI).
- **Editar agendamento (2026-07-12)** — Admin, Profissional e Cliente agora podem editar um agendamento já criado, restrito a status `pendente`/`confirmado` (bloqueado em `concluido`/`cancelado` para não dessincronizar Tab/Transaction/combo já gerados):
  - `DetalhesAgendamento.jsx`: botão "Editar" na barra de ações, ao lado de "Excluir" (visível para os 3 roles quando `canReschedule`). Abre um form inline no card "Informações" com Data + lista de itens de Serviço/Início/Fim.
  - `AdminAgenda.jsx` e `ProfissionalAgenda.jsx`: item "Editar" no menu de contexto (renomeado de "Transferir data") abre o `TransferirDrawer` — mesmo form, como drawer lateral (bottom sheet mobile).
  - **Múltiplos serviços na edição** — ambos os locais têm botão "+ Adicionar serviço" (mesmo padrão do `NovoAgendamentoDrawer`): trocar o serviço de um item recalcula o horário de término pela duração e encadeia o início do item seguinte. O item original (com `id`) é salvo via `PATCH /appointment/:id`; itens novos adicionados na edição são criados via `POST /appointment` — loop sequencial sem atomicidade, mesmo risco já aceito em `NovoAgendamentoDrawer`. Itens novos podem ser removidos (botão "x"); o item original não pode.
  - **Checkbox "Agendamento urgente"** — visível só para Admin/Profissional (mesmo visual do `NovoAgendamentoDrawer`); permite sobrepor horários ocupados nos itens da edição. **Não aparece para o Cliente** — backend bloqueia `Is_urgent` para role `Usuario` em `POST` e `PATCH /appointment` (403).
  - Conflito de horário (409) mostra toast dedicado: para Admin/Profissional, menciona a opção de marcar como urgente; para Cliente, mensagem neutra sem essa opção.
  - `formatAppointment` (backend) agora expõe `Service_id`, `Professional_id` e `Client_id` além dos nomes — necessário para popular o form de edição e criar itens extras via POST.
- Login (`POST /auth/login` com **phone** — campo email removido, máscara de telefone)
- Register (`POST /auth/register` com name/phone/birthday/senha — **sem email** — + auto-login com phone)
- Logout (`POST /auth/logout` via `authStore.logout()` async)
- Session restore (`GET /users/perfil/me` no bootstrap — sem verificação de localStorage)
- Auth guard ativo (`DEV_BYPASS = false`)
- Meu Perfil (`GET/PATCH /users/perfil/me`) + botão "Exportar meus dados" (`GET /users/perfil/me/export` → download JSON)
- Trocar Senha (`PATCH /users/perfil/me/password`)
- Meus Agendamentos — cliente (`GET /appointment/client/:id`)
- Minha Agenda — profissional (`GET /appointment/my`)
- Gerenciar Agendamentos — admin (`GET /appointment`)
- Detalhes do Agendamento (`GET /appointment/:id` + `PATCH /appointment/:id` com `{ Status }`)
- Convidar Profissional (`POST /auth/invite`)
- Aceitar Convite (`POST /auth/accept-invite` → GET /users/perfil/me → /profissional direto)
- Agendar — stepper público (`GET /public/services` · `GET /public/services/:id/professionals` · `GET /public/availability/:id` · `POST /appointment`)
- Gerenciar Usuários (`GET /users` + `PATCH /users/:id` para ativar/desativar) + **painel de detalhes do cliente** ao clicar em qualquer linha: `GET /appointment/client/:id` + `GET /tab/client/:id` → KPIs (atendimentos, total gasto, ticket médio) + comandas em aberto com "Fechar conta" (ModalFecharConta) + últimos agendamentos; tag "Comanda aberta" removida das linhas, mantida como filtro
- Gerenciar Serviços + Categorias — CRUD completo com drawer (`GET/POST/PATCH/DELETE /service` · `GET/POST/PATCH/DELETE /category`)
- Comandas (`GET /tab` + `POST /transaction` + `PATCH /tab/:id`)
- **Troca de senha obrigatória no primeiro acesso** — Admin cadastra usuário via `POST /auth/register-admin` (senha padrão `12345678`, `Must_change_password=true`); `LoginPage` verifica `perfil.Must_change_password` após login e redireciona para `/trocar-senha`; `ProtectedRoute` bloqueia toda navegação exceto `/trocar-senha` enquanto `user.must_change_password === true`; `TrocarSenha` exibe aviso de primeiro acesso, sem botão Cancelar, redireciona para dashboard do role após sucesso
- **Mensalista / Fiado (2026-06-14)** — novo método `'fiado'` em todos os seletores de pagamento de serviços (AdminCaixa painel individual + batch pay, ProfissionalComandas painel individual + batch pay, ModalFecharConta); quando selecionado, cria Transaction com `Payment=false` e Tab `"Paga"`. Check constraint `Transaction_Method_check` atualizado no banco para incluir `'fiado'` (migration `add_fiado_to_transaction_method`). **Correção (2026-07-19):** a listagem/quitação de fiado pendente (`GET /transaction/fiado-pending` + `POST /transaction/fiado-settle`) não fica em uma aba/toggle dentro do Relatório do AdminCaixa — vive em `AdminUsuarios.jsx` via chip "Mensalistas" nos filtros de Clientes + `ModalPagarMensalidade`; a entrada anterior descrevendo um toggle "Mensalista/Relatório mutuamente exclusivo" no AdminCaixa estava desatualizada.
- **Comissões — filtros, bulk pay, histórico e toggle de status (2026-06-14)** — `AdminComissoes`: presets de período (Todas/Dia/Semana/Quinzena/Mês) calculados no cliente → `?from&to`; filtro de profissional via `SearchableSelect`; cabeçalho de tabela com 7 colunas; `appointment_date` (data do atendimento) separada de `data` (data do fechamento); mobile 2×2 grid por item; bulk pay via `ModalPagarComissoes` (toggle de itens, seletor de método, `POST /transaction/commissions/bulk-pay`); aba "Histórico de repasses" com filtro mês/ano → `GET /transaction/commissions/history` (registros `CommissionPayout`); **toggle pills "A repassar"/"Repassadas"** — exibe apenas uma seção por vez (nunca as duas simultaneamente), com empty states próprios. `ProfissionalComissoes`: idem para colunas e `appointment_date`; labels "Repassado"/"A repassar" via `commission_paid`.
- **Fixes de agenda e caixa (2026-06-14)** — "Abrir comanda" e "Fechar comanda" no context menu do `AdminAgenda` agora aparecem **apenas para `Status === 'concluido'`** (antes: qualquer não-cancelado); ao clicar "Abrir comanda", a comanda do agendamento aparece **primeira na lista** do Caixa (sort client-side por `Appointment.UUID`); seção "Contas em aberto" exige **≥2 comandas em aberto** por cliente (antes: ≥1; clientes com apenas 1 comanda ficam na tabela normal); `GET /tab` usa `limit: 1000` para evitar cap de paginação; `AdminAgenda` não faz mais double reload no mount (fix via `professionalsRef`). Backend: `parsePagination` teto elevado de 100 → 1000.
- **Mensalistas em AdminUsuarios + filtros server-side (2026-06-14 continuação)** — chip "Mensalistas" adicionado aos filtros extras de Clientes; ao ativar, filtra via `GET /users?ids=uuid1,uuid2,...` passando os IDs pré-buscados de `GET /transaction/fiado-pending`; `ClientePanel` exibe seção "Mensalidade pendente" com lista de itens e `ModalPagarMensalidade` (4 métodos → `POST /transaction/fiado-settle`). **Performance:** todos os filtros de `AdminUsuarios` agora são server-side — `search` (debounced 300ms → `?search=`), `ativo/inativo` (`?active=`), `aniversariante` (`?birthday_month=`), `mensalista`/`comanda_aberta` (`?ids=`); "Carregar mais" funciona corretamente porque página 2 usa os mesmos params que a página 1. Backend: `userModels.find` aceita os novos params; `birthday_month` usa query prévia de UUIDs + filtro JS (PostgREST não suporta EXTRACT em filtros — erro `operator does not exist: date ~~* unknown`); `ids` vazio retorna `{ data: [], total: 0 }` sem hit no banco.
- **Fechar conta por cliente (batch pay) + produtos** — `AdminCaixa` (aba Comandas): detecta clientes com **≥1 comanda em aberto** (antes era ≥2); botão "Fechar conta" abre modal que busca imediatamente `GET /product-order?client_id=...&status=encomendado`; enquanto carrega exibe **skeleton** (`animate-pulse`) com linhas para cada comanda + bloco de produtos + total; ao carregar exibe seção "Produtos" (se houver) com nome × quantidade e valor; total = serviços + produtos; botão desabilitado com "Carregando..." durante fetch; chama `POST /tab/batch-pay { tab_ids, Method, Payment_date, client_id }` — backend paga as tabs E os pedidos de produto em uma só operação
- **Fix AgendarPage — redirect pós-agendamento por role** — botão "Ver minha conta" na tela de sucesso agora redireciona para `/admin`, `/profissional` ou `/cliente` conforme `user.role`; antes ia sempre para `/cliente`
- **Fix AgendarPage — intervalo do profissional respeitado** — `GET /public/availability` agora inclui `Break_start`/`Break_end` do `WorkingHours` como bloco ocupado ao calcular slots disponíveis
- **"Fechar comanda" em DetalhesAgendamento (2026-06-01)** — botão visível apenas quando `Status === 'concluido'` (comanda só é criada após conclusão do atendimento); fluxo idêntico ao AdminAgenda/MinhaAgenda: `GET /tab` → filtra `Status === 'Em aberto' && Appointment.Client === item.Client` → `GET /product-order?client_id=...&status=encomendado` → abre `ModalFecharConta`; fecha **todas** as comandas em aberto do cliente (não só a do agendamento atual); estados locais: `fecharConta`, `fecharMethod`, `fecharPaying`, `fecharOrders`, `fecharOrdersLoading`
- **AdminComissoes — página standalone (2026-06-01)** — Comissões extraída da aba do AdminCaixa para página própria `/admin/comissoes`; navItem "Comissões" (ícone `chart`) adicionado ao navItems Admin sob Financeiro; AdminCaixa passou de 4 para 3 abas (Comandas | Produtos | Relatório)
- **Tabs URL-driven em AdminCaixa e AdminServicos (2026-06-01)** — `activeTab` derivado de `searchParams.get('tab')` em vez de `useState`; links do sidebar abrem a aba correta diretamente; AdminCaixa: `?tab=produtos` / `?tab=relatorio`; AdminServicos: `?tab=categorias`; navegação via `navigate(..., { replace: true })`
- **NavGroup — árvore colapsável no Sidebar (2026-06-01)** — navItems com `children: [{ to, label }]` renderizam como grupo expansível com linha vertical à esquerda; auto-abre quando na rota do pai ou de qualquer filho; filho ativo em `text-brand font-medium`; implementado em `Sidebar.jsx` via componente interno `NavGroup`; Admin tem sub-itens em "Caixa" (Comandas/Produtos/Relatório) e "Serviços" (Serviços/Categorias)
- **Fix ProfissionalServicos — serviços não renderizavam (2026-06-01)** — a abordagem N+1 anterior (`GET /service` + `GET /service/:id/professionals` por serviço + filtro client-side) foi substituída por `GET /service?professional=${user.id}&limit=100`; mesmo filtro server-side já usado por `ProfissionalAgenda`
- **Fix ProfissionalAgenda — NovoAgendamentoDrawer mostrava todos os serviços (2026-06-01)** — drawer passou a usar `useAuthStore` diretamente (`authUser.id`) em vez de `professional.UUID` prop para garantir o UUID correto na chamada `GET /service?professional=authUser.id`
- **Fix sidebar MinhasComanadas (2026-05-30)** — `MinhasComanadas.jsx` não tinha o bloco de Avatar (foto + nome + label "cliente") no `ClienteSidebar`, enquanto todas as outras páginas cliente (`ClienteDashboard`, `MeusAgendamentos`, `MeusCombos`) tinham. Isso fazia o sidebar encolher visualmente ao navegar para essa aba. Corrigido adicionando import de `Avatar` e o bloco `<div className="text-center py-3 pb-[18px] border-b border-line mb-3">` idêntico ao das demais páginas.
- **Fix sobreposição serviço/status nos cards mobile do cliente (2026-05-24)** — `ClienteDashboard` (card "Próximo atendimento"): o badge de status usava `absolute top-4 right-4` e ficava sobreposto ao nome do serviço em mobile. Corrigido movendo o badge para dentro de um flex row com `justify-between` junto ao nome; nome usa `flex-1 min-w-0 truncate` e badge usa `shrink-0`. `MeusAgendamentos` (cards mobile): nome do serviço tinha `flex-1 min-w-0` mas sem `truncate`, permitindo overflow visual sobre o badge; adicionado `truncate`.
- **Auto-redirect pós-restore de sessão (2026-05-24)** — `main.jsx`: ao restaurar sessão válida, se o usuário estiver em `/` ou `/login`, redireciona imediatamente para o dashboard do role via `window.location.replace()` antes de montar o React. O `return` previne o `createRoot` de rodar na página antiga. Também passa `must_change_password: data.Must_change_password` no `restoreSession` (antes ausente no bootstrap).
- **Fix AgendarPage — confirmação falhava silenciosamente no fluxo de novo usuário (2026-05-24)** — slots useEffect tinha `[selectedDay, calYear, calMonth]` como deps e chamava `setSelectedSlot(null)` incondicionalmente. Quando o restore effect (pós-verificação+login) setava essas três deps simultaneamente, o effect disparava e apagava o slot restaurado. `handleConfirm` encontrava `selectedSlot === null`, lançava TypeError capturado pelo try/catch sem requisição de rede, exibindo toast genérico. Fix: `if (step !== 2) return` no início do effect + `step` nas dependências. Horários também passaram a ser encodados com `encodeURIComponent` no `next` URL de `handleRegister`.; slots que sobrepõem o intervalo são bloqueados (inclui slots que iniciam antes do intervalo mas terminam durante ele, dependendo da duração do serviço)
- **AdminDashboard ampliado** — KPI de taxa de cancelamento (% agendamentos cancelados no mês); tabela de ranking de profissionais (top 5 por receita: avatar, nome, atendimentos, receita gerada, comissão); bug corrigido: `footerUser={user?.name}` agora passado ao Sidebar (ícone de logout e footer do sidebar estavam ausentes na página de dashboard)
- **Comissões por profissional** (`GET /dashboard/commissions?month=YYYY-MM`) — aba "Comissões" dentro de AdminCaixa; seletor de mês+ano independente; cards totalizadores; tabela com % média de comissão e linha de totais no rodapé; cards mobile com todos os campos
- Pacotes — grid + CRUD + vender combo (`GET/POST/PATCH/DELETE /package` · `GET/POST/DELETE /package/:id/items` · `POST /package/:id/sell`)
- Agenda Admin — grade por profissional com navegação de dia (`GET /appointment?date=YYYY-MM-DD` + `GET /users?Role=Profissional` para colunas fixas)
- Dashboard Profissional (`GET /appointment/my?date=` + `GET /working-hours/professional/:id` + `GET /service`)
- **Serviços do Profissional** — listagem via `GET /service?professional=${user.id}&limit=100` (filtro server-side); vínculos gerenciados pelo Admin em AdminServicos
- Horários do Profissional — CRUD semanal (`GET/POST/PATCH/DELETE /working-hours`)
- **Comissões do Profissional** (`GET /transaction/my-commissions?month=YYYY-MM`) — nova página `ProfissionalComissoes` acessível em `/profissional/comissoes`; item "Minhas comissões" (ícone `cash`) adicionado ao `navItems` de todas as páginas do role Profissional
- **ProfissionalPainel — KPIs do dia** — 3 mini-cards (total hoje, concluídos, a atender) renderizados a partir dos appointments já carregados, sem custo extra de API
- **MinhaAgenda** — badge `tab_status` removido (não existe no AdminAgendamentos; campo ainda existe no backend mas não é exibido na lista de agendamentos do profissional)
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
- **NovoAgendamentoDrawer — múltiplos serviços por agendamento (2026-06-23)** — `AdminAgenda` e `ProfissionalAgenda`: state `servicoId/startTime/endTime` únicos substituídos por `itens` (array `{ servicoId, startTime, endTime }`); botão "Adicionar serviço" (`addItem`) insere nova linha com `startTime` = `endTime` do item anterior; `handleServico(index, id)` recalcula o `endTime` do item pela `Duration` do serviço e encadeia automaticamente o `startTime` do item seguinte; editar manualmente `endTime` de um item (`handleItemEndTime`) também encadeia o próximo; `removeItem(index)` remove uma linha (mínimo 1); Cliente/Profissional/Urgência continuam compartilhados entre todos os itens. **`handleSalvar` faz loop sequencial de `POST /appointment`** — um request por item, todos com o mesmo `Is_urgent` (urgente pula `checkConflict` no backend para cada item igualmente). **Sem atomicidade** — se o N-ésimo POST falhar (ex: conflito de horário), os anteriores já foram criados; mesmo padrão de risco aceito já documentado para `batchPay` (sem transação no backend). Backend não foi alterado — cada serviço continua sendo uma linha independente em `Appointment`, a grade já suportava múltiplos agendamentos sobrepostos via `computeColumns`.
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
- **Cores de status de agendamento** — padronizadas em `AdminAgenda.jsx`, `AdminAgendamentos.jsx` e `Chip.jsx`: pendente=azul (`#dbeafe`/`#1d4ed8`), confirmado=success (verde), concluido=gold (`#faecd6`/`#7a5c2e`), cancelado=danger; `Chip.jsx` ganhou variantes `gold` e `blue`; `statusMap` atualizado para pendente→'blue', concluido→'gold'
- **AdminAgendamentos — tabs por categoria** — 3 tabs: Ativos (pendente+confirmado), Concluídos, Cancelados; tab ativa com underline brand e badge `bg-brand text-bg`
- **AdminAgendamentos — busca por cliente + paginação server-side (2026-07-19)** — migrado de fetch único `limit:100` + filtro client-side para `usePaginatedList` (`LoadMoreButton`, 30/página); resolve truncamento em 100 registros quando nenhuma data era selecionada (o array não representava "todos os agendamentos", só os 100 primeiros do banco). Campo de busca por cliente (`search`, debounce 300ms → `client_name`) enviado como param server-side, junto com `date` e `status` (a tab ativa manda `statuses.join(',')` — backend aceita lista separada por vírgula). Badges de contagem por tab vêm de 3 requests paralelos leves (`limit:1`, só para ler `pagination.total`) em vez de contar o array já filtrado — nenhuma agregação acontece no frontend. Backend: `GET /appointment` ganhou `?client_name=` (ilike, mesmo padrão de `findByProfessional`) e `?status=` passou a aceitar múltiplos valores separados por vírgula (`appointmentModels.find` usa `.in()` quando há mais de um); `validateAppointmentQuery` atualizado.
- **Fix: cancelados visíveis na AdminAgenda com sobreposição** — `load()` agora faz `setAppointments(all)` sem filtrar cancelados; `computeColumns` inclui cancelados no cálculo de colunas (removido filtro `a.Status !== 'cancelado'`); loop de render unificado — cancelados entram em `normalAppts` junto com ativos e recebem layout proporcional via `columnMap`; bloco separado `isCancelado` removido (era bug: só renderizava `appts[0]`, invisível quando havia ativos sobrepostos); célula do slot permanece clicável para novo agendamento pois `occupied` continua excluindo cancelados
- **Urgência em agendamentos** — campo `Is_urgent` (boolean) no backend (schema Joi + `formatAppointment` + insert/update no controller); frontend: checkbox "Urgente" no `NovoAgendamentoDrawer` em `AdminAgenda`; agendamentos urgentes pulam `checkConflict` no backend; na grade aparecem sobrepostos acima de todos os outros (z-20, largura total, borda warning, shadow) com label "⚡ Urgente"; agendamentos normais ficam visíveis atrás
- **Grade de agendamentos com sobreposição real** — `anchoredToSlot(appt, slot)` substitui `isStart` e ancora qualquer horário (ex: 19:45) no slot de 30min correspondente (19:30); `apptTop` e `apptHeight` calculam posição e altura pela duração real em minutos; `computeColumns(appts)` detecta sobreposições temporais entre agendamentos do mesmo profissional e distribui largura proporcional: 2 sobrepostos = 50% cada, 3 = 33% cada; `columnMap` (Map UUID→{col,totalCols}) é pré-computado no render do componente antes dos loops de slot; funciona em desktop (64px/slot) e mobile (56px/slot)
- **Transferir agendamento** — opção "Transferir data" no context menu (pendente|confirmado); abre `TransferirDrawer` (bottom sheet mobile / 400px desktop) com campos data, início, fim pré-preenchidos; envia PATCH com os campos alterados
- **UI/UX "Fechar conta por cliente"** — seção "Contas em aberto" com cards individuais por cliente antes dos filtros em `AdminCaixa`; design limpo com avatar, info e botão "Fechar conta"; substituiu botões embutidos no header que ficavam estranhos
- **Telas do Profissional refatoradas (cópia fiel das telas Admin)** — `ProfissionalAgenda` (grade idêntica ao AdminAgenda, coluna única, `GET /appointment/my`, serviços filtrados por profissional), `ProfissionalComandas` (idêntica ao TabComandas do AdminCaixa), `ProfissionalProdutos` (read-only), `ProfissionalPedidosProdutos` (CRUD completo); rota `/profissional` agora aponta para `ProfissionalAgenda`; navItems do role Profissional atualizado com 3 seções (Agenda/Agendamentos/Comandas, Produtos, Conta)
- **Fix — notificações duplicadas ao criar horário com intervalo** — `ProfissionalHorarios` agora envia `break_start`/`break_end` no POST único; backend (`schemas.js` + `workingHoursController.insert`) aceita e persiste esses campos no CREATE
- **ProfissionalComandas — pagamento e fechar conta** — painel de pagamento individual (método + POST /transaction + PATCH /tab/:id), seção "Contas em aberto" + modal batch pay com skeleton e produtos (`POST /tab/batch-pay`); deep link `?appointment=UUID` seleciona comanda automaticamente; **bug crítico corrigido:** cruzamento agendamentos×tabs usava `apptUUIDs.has(t.Appointment)` mas `t.Appointment` é objeto — corrigido para `t.Appointment.UUID`
- **AdminCaixa — aba Produtos** — `TabPedidosProdutos` adicionado como 4ª aba principal (Comandas | Produtos | Comissões | Relatório); layout idêntico ao TabComandas (lista clicável + painel sticky); painel direito com seletor de método de pagamento inline (sem modal/drawer de detalhes); PATCH inclui `Payment_method`; constantes e helpers (`FieldProd`, `InfoRowProd`, `inputClsProd`, `PROD_STATUS_*`, `EMPTY_ORDER`) definidos localmente no arquivo antes de `TabPedidosProdutos`
- **ProfissionalComandas — sub-abas Serviços | Produtos** — switcher de sub-abas no topo da página; aba Produtos usa `TabPedidosProdutos` inline sem campo "Vendido por"; constante `PAY_METHODS_PROD` definida antes de `TabPedidosProdutos` (aba Serviços também usa essa mesma constante para batch pay e painel individual — `PAY_METHODS` não existe neste arquivo)
- **ProfissionalAgenda — context menu "Abrir comanda"** — opção adicionada para status não-cancelado; navega para `/profissional/comandas?appointment=UUID` (mesmo padrão de deep link do AdminCaixa)
- **MinhaAgenda — badge tab_status removido** — exibição de "Em aberto"/"Paga" ao lado do chip de status foi removida para paridade com `AdminAgendamentos`
- **Tour/Onboarding guiado (react-shepherd)** — dispara automaticamente na primeira vez que cada role acessa sua tela principal; persiste via `localStorage` (cache rápido) + backend `Tours_completed` JSONB (fonte da verdade). Detalhes: ver seção "Tour/Onboarding" abaixo.

- **SearchableSelect** — `src/components/ui/SearchableSelect.jsx`; combobox com busca por digitação, design discreto (sem bg colorido no dropdown, sem destaque no item selecionado — só `font-medium text-ink`); usado em: select de Categoria e Profissional em `AdminServicos`, selects de Cliente e Serviço no `NovoAgendamentoDrawer` de `AdminAgenda` e `ProfissionalAgenda`
- **Botão `+` de categoria inline** — padrão: botão quadrado `h-[42px] w-[42px]` à esquerda do SearchableSelect de categoria, `text-ink-3 hover:text-brand hover:border-brand`; ao criar nova categoria, auto-seleciona a nova opção; aplicado em `AdminServicos` e `ModalNovoServico` de `AdminAgenda`
- **Paridade ProfissionalAgenda ↔ AdminAgenda** — `ProfissionalAgenda.jsx` ganhou `ModalNovaCategoria` (z-[60]), `ModalNovoCliente`, botão `+` no select de cliente; fix de z-index: `ModalNovaCategoria` usa `z-[60]` em ambas as páginas para sobrepor o overlay `z-50` da modal pai; **`ModalNovoServico` NÃO existe na ProfissionalAgenda** — Profissional tem apenas `GET /service`, sem permissão de criar serviços; select de serviço ocupa largura total sem botão `+`
- **Fechar comanda pela Agenda (AdminAgenda + MinhaAgenda)** — `ModalFecharConta` (`src/components/ui/ModalFecharConta.jsx`) extraído como componente reutilizável; `AdminAgenda`: opção "Fechar comanda" (verde) no context menu (clique direito / long press) para agendamentos não-cancelados; `MinhaAgenda`: botão "Fechar" por card com `e.stopPropagation()` para não conflitar com navegação para detalhes; fluxo: `GET /tab` → filtra `Status === 'Em aberto' && Appointment.Client === appt.Client` → extrai `clientId` → `GET /product-order?client_id=...&status=encomendado` → abre modal com skeleton → `POST /tab/batch-pay`; toast de aviso se cliente não tem comandas em aberto

- **Folgas na grade da Agenda** — bloco vermelho `bg-danger-soft border-danger/30` com ícone `x` e label "Folga" renderizado sobre os slots; `All_day=true` ocupa toda a coluna; folga parcial ocupa o intervalo `Start_time→End_time`; slots cobertos por folga bloqueiam abertura de novo agendamento; clique direito abre `LeaveContextMenu` com opção "Remover folga" (`DELETE /professional-leave/:id` + reload silencioso); `FolgaDrawer` acessível pelo botão `+ Folga` na barra de navegação de ambas as agendas; backend: `GET /professional-leave/professional/:id?date=` buscado no `load()` junto com os agendamentos

- **Aba Docs — documentação de funcionalidades (2026-07-11)** — nova página `/docs` (`src/pages/shared/DocsPage.jsx`), acessível a Admin e Profissional via item "Docs" no `navItemsByRole` (ícone `book`, seção Conta). **Isolada do app principal** — não usa `AppLayout`/`Sidebar`; tem header próprio (logo, "Voltar ao app") e navegação lateral estilo wiki. Conteúdo em markdown estático por role: `src/content/docs/{admin,profissional}/*.md` + `index.json` (título + ordem de cada tópico). Renderizado com `react-markdown` + `remark-gfm` (instalados nesta sessão); estilos em `.docs-content` no final de `index.css`. **Carregamento dos `.md`:** `import.meta.glob('../../content/docs/{role}/*.md', { query: '?raw', import: 'default', eager: true })` — **importante:** o glob do Vite não resolve o alias `@/`, precisa ser caminho relativo, senão retorna objeto vazio silenciosamente (bug já visto e corrigido nesta sessão). Conteúdo cobre 12 tópicos Admin + 7 Profissional (Dashboard, Agenda, Agendamentos, Clientes, Serviços, Pacotes, Convidar profissional, Caixa, Comissões, Produtos, Meus serviços/horários, Perfil — Profissional sem Dashboard/Clientes/Pacotes/Convite). Imagens: pontos de inserção já marcados nos `.md` (`![alt](/docs-images/nome.webp)`), prompts de geração em `prompts/docs/admin/*.md` (12 arquivos, um por tela) — imagens ainda não geradas, ficam quebradas até salvar os `.webp` em `public/docs-images/`.
- **Paginação client-side em listas (2026-07-11)** — `usePagination` (`src/hooks/usePagination.js`) + `PaginationControls` (`src/components/ui/PaginationControls.jsx`), 20 itens por página. Aplicado em listas que buscam tudo de uma vez e filtram no cliente: `MinhaAgenda` (Próximos/Histórico), `AdminCaixa` → `TabComandas`, `ProfissionalComandas` → sub-aba Serviços. `AdminAgendamentos` migrou para `usePaginatedList` em 2026-07-19 (ver entrada acima). Cada tela reseta `page` para 1 via `useEffect` quando seus filtros mudam. Ver seção "Paginação" para detalhes.

### Ainda com dados mockados / não implementado
- `PortalPage` — landing page pública, sem implementação

---

## Tour/Onboarding

**Biblioteca:** `shepherd.js` importado direto (dependência transitiva de `react-shepherd`) — sem `ShepherdTour` provider, sem wrapping de rotas.

**Hook:** `src/hooks/useTour.js` — `const { restartTour } = useTour(role, steps, ready)`
- `role`: chave string que identifica o tour (ver KEYS abaixo)
- `steps`: array de steps Shepherd importado de `src/tours/`
- `ready`: boolean — espera página carregar antes de iniciar (usar `!loading`)
- Verifica `localStorage.getItem(key) === 'done'` antes de iniciar — não mostra se já visto
- No complete/cancel: grava `localStorage` e faz `PATCH /users/perfil/me { Tours_completed: { [role]: true } }` silenciosamente (`.catch(() => {})`)
- Retorna `{ restartTour }` — função que limpa localStorage, envia `PATCH { Tours_completed: { [role]: false } }` ao banco, cancela o tour ativo (se houver) e reinicia o tour do zero

**Botão "Ver tour":** todas as 10 páginas com tour têm um botão discreto para o usuário repetir o onboarding. Estilo padrão:
```jsx
<button onClick={restartTour} className="inline-flex items-center gap-1 text-[11px] text-ink-4 hover:text-brand transition-colors mt-1.5" title="Repetir tour guiado">
  <Icon name="helpCircle" size={12} />
  Ver tour
</button>
```
Posicionamento: abaixo da descrição do header em páginas com h3+p padrão; inline com o título em `ProfissionalComandas`; lado direito do header de status em `TabComandas`; dentro do flex de selects em `TabComissoes`. `helpCircle` é ícone adicionado em `Icons.jsx`.

**`restartTour` — limpeza dupla (localStorage + banco):** o merge do backend (`{ ...current, ...novo }`) seta o campo do role para `false`. O bootstrap em `main.jsx` só restaura `localStorage` quando o valor é `true` (`if (done)`), então `false` no banco equivale a "não completado" na próxima sessão.

**Mobile:** o tour funciona apenas no desktop. Tentativas de adaptar para mobile (detecção de visibilidade de elementos, redirecionamento de `attachTo`, CSS responsivo) foram revertidas por causar duplicação do tour. Não tentar adaptar o Shepherd para mobile sem resolver a causa raiz: a sidebar é renderizada duas vezes via `cloneElement` no `AppLayout` (desktop + drawer mobile com `-translate-x-full`), o que faz `querySelectorAll` retornar elementos off-screen que parecem visíveis para o Shepherd.

**Persistência dual:**
- `localStorage` — cache local instantâneo, sem round-trip
- Backend `Users.Tours_completed JSONB` — fonte da verdade; populado no bootstrap em `main.jsx` após `GET /users/perfil/me`; protege contra Safari 7-day expiry, modo privado e troca de dispositivo

**Bootstrap (`main.jsx`):** após `restoreSession`, itera `data.Tours_completed ?? {}` e seta cada chave completada no localStorage com `localStorage.setItem('dauth_tour_${key}', 'done')`.

**KEYS mapeadas (role → localStorage key):**
| role | localStorage key |
|---|---|
| `admin` | `dauth_tour_admin` |
| `profissional` | `dauth_tour_profissional` |
| `cliente` | `dauth_tour_cliente` |
| `admin_caixa_comandas` | `dauth_tour_admin_caixa_comandas` |
| `admin_caixa_comissoes` | `dauth_tour_admin_caixa_comissoes` |
| `admin_agendamentos` | `dauth_tour_admin_agendamentos` |
| `admin_usuarios` | `dauth_tour_admin_usuarios` |
| `profissional_comandas` | `dauth_tour_profissional_comandas` |
| `cliente_agendamentos` | `dauth_tour_cliente_agendamentos` |
| `cliente_combos` | `dauth_tour_cliente_combos` |

**Arquivos de steps (`src/tours/`):**
| Arquivo | role | Página | Steps |
|---|---|---|---|
| `adminTour.js` | `admin` | AdminAgenda | sidebar, day-nav, schedule-grid, context-menu, notifications |
| `profissionalTour.js` | `profissional` | ProfissionalAgenda | sidebar, schedule-grid, context-menu, comissoes |
| `clienteTour.js` | `cliente` | ClienteDashboard | next-appointment, agendar-btn, combos-card |
| `adminCaixaComandas.js` | `admin_caixa_comandas` | AdminCaixa (tab Comandas) | caixa-tabs, comanda-origem, comanda-pagamento, fechar-conta |
| `adminCaixaComissoes.js` | `admin_caixa_comissoes` | AdminCaixa (tab Comissões) | comissao-conceito, comissao-status, comissao-mes |
| `adminAgendamentosTour.js` | `admin_agendamentos` | AdminAgendamentos | agendamentos-tabs, agendamentos-filtro, agendamentos-novo |
| `adminUsuariosTour.js` | `admin_usuarios` | AdminUsuarios | usuarios-filtro, usuarios-novo, usuarios-lista |
| `profissionalComandasTour.js` | `profissional_comandas` | ProfissionalComandas | comanda-origem, comanda-pagamento, sub-abas |
| `clienteAgendamentosTour.js` | `cliente_agendamentos` | MeusAgendamentos | agendamentos-filtro-cliente, agendamentos-lista-cliente, agendamentos-novo-cliente |
| `clienteCombosTour.js` | `cliente_combos` | MeusCombos | combos-abas, combos-lista |

**data-tour attributes adicionados:**
- `Sidebar.jsx`: `data-tour="sidebar"` no `<aside>`, `data-tour="notifications"` no sino desktop, `data-tour="comissoes-link"` no NavLink para `/profissional/comissoes`
- `AdminAgenda.jsx`: `data-tour="day-nav"`, `data-tour="schedule-grid"`
- `ProfissionalAgenda.jsx`: `data-tour="schedule-grid"`
- `ClienteDashboard.jsx`: `data-tour="next-appointment"`, `data-tour="agendar-btn"`, `data-tour="combos-card"`
- `AdminCaixa.jsx`: `data-tour="caixa-tabs"`, `data-tour="comanda-lista"`, `data-tour="comanda-painel"`, `data-tour="comissoes-filtro"`, `data-tour="comissoes-lista"`
- `AdminAgendamentos.jsx`: `data-tour="agendamentos-tabs"`, `data-tour="agendamentos-filtro"`, `data-tour="agendamentos-novo"`
- `AdminUsuarios.jsx`: `data-tour="usuarios-filtro"`, `data-tour="usuarios-novo"`, `data-tour="usuarios-lista"`
- `ProfissionalComandas.jsx`: `data-tour="sub-abas"`, `data-tour="comanda-lista"`, `data-tour="comanda-painel"`
- `MeusAgendamentos.jsx`: `data-tour="agendamentos-novo-cliente"`, `data-tour="agendamentos-filtro-cliente"`, `data-tour="agendamentos-lista-cliente"`
- `MeusCombos.jsx`: `data-tour="combos-abas"`, `data-tour="combos-lista"`

**Estilo:** CSS overrides no final de `src/index.css` usando hex direto (Tailwind v3 não gera CSS custom properties). Classes: `.dauth-shepherd`, `.shepherd-btn-primary` (bg #8b4a2b), `.shepherd-btn-skip`.

**Último botão dos steps:** usar `action() { this.complete() }` (method shorthand) — Shepherd vincula `this` ao tour, arrow functions quebram o binding e `this.complete()` vira `undefined()`.

**Reset para testar:** `localStorage.removeItem('dauth_tour_admin')` no console do browser. Ou usar o botão "Ver tour" na própria página (limpa localStorage + banco automaticamente).

**Backend:** coluna `Tours_completed JSONB DEFAULT '{}'` na tabela `Users`. `PATCH /users/perfil/me` aceita `{ Tours_completed: { chave: true } }` — controller faz merge (`{ ...current, ...novo }`), nunca sobrescreve. `USER_FIELDS` em `userModels.js` inclui `Tours_completed`.

---

## Paginação

O backend usa `parsePagination` com **default limit=20** e **teto de 100**. O frontend trata paginação em três categorias:

### Load more (telas de lista grande)
Hook `usePaginatedList` em `src/hooks/usePaginatedList.js` + botão `LoadMoreButton` em `src/components/ui/LoadMoreButton.jsx`.

```js
import { usePaginatedList } from '@/hooks/usePaginatedList'
import LoadMoreButton from '@/components/ui/LoadMoreButton'

// fetchFn recebe (page, limit) e deve retornar { data: [], pagination: { total } }
const { items, loading, loadingMore, hasMore, reload, loadMore } = usePaginatedList(
  (page, limit) => api.get('/endpoint', { params: { page, limit, ...filtros } }).then(r => r.data),
  [filtro1, filtro2]  // deps que resetam para página 1
)

// No render, após a lista:
{hasMore && <LoadMoreButton onClick={loadMore} loading={loadingMore} />}
```

**Regras:**
- `deps` — mesmas dependências dos filtros server-side. Mudar filtro reseta para página 1 e substitui items.
- `loadMore` acumula items (append). `reload` reseta para página 1.
- Após mutações (POST/PATCH/DELETE), chamar `reload()` — nunca `load()` diretamente.
- Skeleton mostra quando `loading === true`; `loadingMore` só afeta o botão.

**Telas com load more:** `AdminUsuarios`, `AdminPedidosProdutos`, `ProfissionalPedidosProdutos`, `AdminComissoes` (2026-07-18 — substituiu fetch único + `.limit(500)` no backend; totais dos cards vêm de `response.totals`, calculados no servidor sobre o período inteiro, nunca de `reduce` sobre os itens carregados; "Pagar todas" busca via API o conjunto completo de pendentes do profissional antes de abrir o modal, em vez de depender da página exibida), `AdminAgendamentos` (2026-07-19 — substituiu fetch único `limit:100` + filtro client-side, que truncava silenciosamente quando nenhuma data era filtrada; `deps` são `[tab, date, clientName]`; badges de contagem por tab vêm de 3 requests paralelos `limit:1` só para ler `pagination.total`, não de contagem no array carregado).

### limit=100 (telas com filtro server-side que bounding data)
Telas onde o filtro já limita os resultados na prática (data, status). Passa `limit: 100` explícito para garantir que o backend não use o default de 20.

**Telas:** `MeusAgendamentos`, `MinhaAgenda`.

### limit=100 (dados bounded — dropdowns e listas de configuração)
Dados que crescem pouco por natureza (serviços, categorias, produtos, tabs abertas). Não precisam de paginação UI.

| Dado | limit |
|---|---|
| `/service` | 100 |
| `/category` | 50 |
| `/product` | 100 |
| `/tab` | 100 (1000 nas telas que já cruzam com listas grandes — ver abaixo) |

**Dropdowns de cliente — busca remota, sem limit fixo (2026-07-19):** os 8 dropdowns de cliente (`AdminAgenda`, `ProfissionalAgenda`, `AdminCombos`, `AdminCaixa`, `ProfissionalComandas`, `AdminPedidosProdutos`, `ProfissionalPedidosProdutos`) buscavam a lista inteira uma vez com `limit: 100`, ordenada por Nome — acima de 100 clientes cadastrados, qualquer nome alfabeticamente posterior ao 100º nunca era baixado, e o `SearchableSelect` só filtrava dentro do array já carregado (sem busca remota), então digitar um nome mais adiante no alfabeto não retornava nada. Um bump temporário para `limit: 1000` resolveu o sintoma, mas não escala de verdade (mesmo problema reaparece acima de 1000 clientes). **Fix definitivo:** `SearchableSelect.jsx` ganhou um modo remoto — passe `onSearch={async (query) => [...]}` em vez de `options={[...]}`; o componente debounce 300ms a digitação, chama `onSearch(query)` e renderiza só os resultados retornados, sem nunca carregar a lista inteira. Novo helper `src/lib/searchClients.js` encapsula `GET /users?Role=Usuario&search=query&limit=20` (usa o `?search=` que o backend já suporta) e é reusado pelos 8 dropdowns — nenhum deles mais faz `Promise.all` com `/users` no mount. Prop `injectOption={{ value, label }}` existe para o caso de um cliente recém-criado via modal "+" inline (`ModalNovoCliente`) precisar aparecer selecionado antes de qualquer busca — o componente cacheia esse label internamente. Query prop `minChars` (default 0) controla a partir de quantos caracteres disparar a busca, se necessário no futuro. `options`/filtro local continuam funcionando exatamente como antes para os usos estáticos (Categoria, Serviço) — modo remoto e estático são mutuamente exclusivos via presença de `onSearch`.

**`ModalNovoCliente` (AdminAgenda/ProfissionalAgenda) — mesma correção:** após `POST /auth/register-admin` (que não retorna o UUID criado), o modal buscava o cliente recém-criado varrendo até 1000 registros com `.find(u => u.Phone === form.phone)`. Trocado para `GET /users?Role=Usuario&search=telefone&limit=5` — usa o índice de busca do backend em vez de trazer a base inteira, correto independente de quantos clientes existirem.

### Paginação client-side (páginas de página — 20 por vez)
Hook `usePagination` em `src/hooks/usePagination.js` + componente `PaginationControls` em `src/components/ui/PaginationControls.jsx`. Diferente do "load more": aqui os dados já foram todos buscados (`limit: 100`/`1000`) e filtrados no cliente; a paginação só corta o array já filtrado em fatias de 20, com botões Anterior/Próxima.

```js
import { usePagination } from '@/hooks/usePagination'
import PaginationControls from '@/components/ui/PaginationControls'

const { pageItems, page, setPage, totalPages } = usePagination(filteredArray, 20)
useEffect(() => { setPage(1) }, [filtro1, filtro2]) // reseta ao mudar filtro

// render: pageItems.map(...) em vez do array completo
<PaginationControls page={page} totalPages={totalPages} onChange={setPage} />
```

**Regras:**
- `usePagination` só corta o array — quem chama é responsável por resetar `page` para 1 via `useEffect` quando um filtro muda (senão a página pode ficar "presa" além do novo total).
- `PaginationControls` não renderiza nada (`return null`) quando `totalPages <= 1`.

**Telas com essa paginação:** `MinhaAgenda` (lista de agendamentos), `AdminCaixa` → `TabComandas` (lista de comandas), `ProfissionalComandas` → sub-aba Serviços (lista de comandas).

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


## Proximos passos

**Aba Docs (2026-07-11) — feito parcialmente:**
- ✅ Página `/docs` isolada, markdown por role (Admin/Profissional — decisão: sem Cliente/Usuario), navegação wiki, conteúdo escrito para os 19 tópicos.
- ⬜ Gerar as ~12 imagens do lote Admin a partir dos prompts em `prompts/docs/admin/*.md` e salvar em `public/docs-images/`.
- ⬜ Gerar lote de prompts + imagens do Profissional (7 telas, ainda não criado).
- ⬜ Avaliar se algum passo merece GIF em vez de imagem estática (arrastado do escopo original, não abordado ainda).

**Paginação (2026-07-11) — feito:**
- ✅ `AdminAgendamentos`, `MinhaAgenda`, `AdminCaixa` (Comandas), `ProfissionalComandas` (Serviços) — 20 itens por página, client-side.
- Debate pendente: se algum outro filtro/lista crescer muito (ex: histórico de repasses em `AdminComissoes`), avaliar se merece a mesma paginação ou o padrão `usePaginatedList`/load-more.

**Escalabilidade de dropdowns — cliente resolvido, produto pendente por decisão (2026-07-19):**
- ✅ Dropdowns de cliente migrados para busca remota (`SearchableSelect` modo `onSearch` + `src/lib/searchClients.js`) — sem teto fixo, ver seção "Paginação" acima (`/users`).
- ⬜ **Dropdowns de produto** (`AdminPedidosProdutos`, `ProfissionalPedidosProdutos`, `AdminCaixa`, `ProfissionalComandas`) ainda usam `GET /product?limit=100` carregado uma vez inteiro — mesma classe de bug que existia em cliente (acima de 100 produtos cadastrados, o restante nunca é baixado e o dropdown "some" para eles). **Decisão do usuário (2026-07-19): não implementar agora** — catálogo de produtos não deve crescer muito no início do negócio. Retomar se/quando o catálogo se aproximar de 100 itens.
  - Quando for retomado, o caminho é o mesmo já usado para cliente: adicionar `?search=` em `productModels.find` (backend, hoje só filtra por `Active`/paginação, sem `ilike` em `Name`), criar um `searchProducts.js` equivalente a `searchClients.js`, e trocar o `options={products.map(...)}` por `onSearch={searchProducts}` nos 4 arquivos acima — nenhuma mudança adicional no `SearchableSelect` é necessária, o modo remoto já é genérico.
- ⬜ **Serviços** (`/service`, limit 100) e **categorias** (`/category`, limit 50) não foram mexidos — catálogo curado manualmente pelo Admin, cresce muito devagar por natureza do negócio (tipos de serviço de salão). Sem `?search=` no backend hoje. Reavaliar só se algum salão específico cadastrar centenas de serviços/categorias.