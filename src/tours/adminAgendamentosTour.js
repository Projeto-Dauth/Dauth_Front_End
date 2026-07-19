export const adminAgendamentosSteps = [
  {
    id: 'tabs',
    title: 'Três visões dos agendamentos',
    text: '"Ativos" reúne pendentes e confirmados — os que ainda vão acontecer. "Concluídos" e "Cancelados" são o histórico de atendimentos finalizados.',
    attachTo: { element: '[data-tour="agendamentos-tabs"]', on: 'bottom' },
  },
  {
    id: 'filtro-data',
    title: 'Buscar e filtrar',
    text: 'Digite o nome do cliente para ver só os agendamentos dele, ou escolha uma data para ver os de um dia específico.',
    attachTo: { element: '[data-tour="agendamentos-filtro"]', on: 'bottom' },
  },
  {
    id: 'novo',
    title: 'Criar agendamento',
    text: 'Prefira criar agendamentos pela Agenda principal — lá você vê visualmente os horários disponíveis de cada profissional.',
    attachTo: { element: '[data-tour="agendamentos-novo"]', on: 'left' },
    buttons: [
      { text: 'Entendido!', action() { this.complete() }, classes: 'shepherd-btn-primary' },
    ],
  },
]
