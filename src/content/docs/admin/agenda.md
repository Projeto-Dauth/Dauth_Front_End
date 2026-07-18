# Agenda

A Agenda é a tela principal do dia a dia — mostra os horários de todos os profissionais lado a lado, por dia.

## Navegação

- Use as **setas** no topo para ir para o dia anterior/seguinte.
- O ícone de **calendário** abre um seletor de data para pular direto para um dia específico.
- O botão **Hoje** volta para a data atual.
- No celular, a tela mostra um profissional por vez — use as setas para trocar entre eles.

## Criar um agendamento

Clique em um horário vazio na grade do profissional desejado. Um painel abre com:
- Cliente (busca por nome) e opção de cadastrar um cliente novo na hora.
- Serviço (pode adicionar mais de um serviço no mesmo agendamento — o horário do próximo é calculado automaticamente).
- Horário de início e fim (preenchido automaticamente pela duração do serviço, mas editável).
- Opção **Urgente** — marca o agendamento para ser encaixado mesmo que já exista outro no mesmo horário (útil para clientes de última hora).

## Ações em um agendamento existente

Clique com o botão direito (ou toque e segure no celular) sobre o bloco do agendamento para abrir o menu de opções:
- **Marcar como Confirmado / Concluído / Cancelado** — dependendo do status atual.
- **Editar** — abre um painel para alterar data, horários e até os serviços do agendamento (pode adicionar ou remover serviços, igual na criação). Só disponível enquanto o status for Pendente ou Confirmado — depois de Concluído ou Cancelado não dá mais para editar, para não desalinhar comandas e comissões já geradas.
- **Abrir comanda** — leva direto para o Caixa com a comanda daquele cliente selecionada.
- **Fechar comanda** — disponível só depois que o atendimento foi marcado como Concluído; abre o fechamento de conta direto pela Agenda.
- **Ver detalhes** — abre a página completa do agendamento.

![Grade da Agenda com profissionais lado a lado, blocos coloridos por status e agendamento urgente em destaque](/docs-images/admin-agenda.webp)

## Cores dos blocos

| Status | Cor |
|---|---|
| Pendente | Azul |
| Confirmado | Verde |
| Concluído | Dourado |
| Cancelado | Vermelho riscado |
| Urgente | Aparece por cima dos outros, com borda destacada |

## Folgas

O botão **+ Folga** cadastra uma folga (dia inteiro ou parcial) para um profissional. Ela aparece como um bloco vermelho na grade e bloqueia novos agendamentos naquele intervalo. Clique com o botão direito na folga para removê-la.
