import { useEffect, useRef } from 'react'
import Shepherd from 'shepherd.js'
import 'shepherd.js/dist/css/shepherd.css'
import api from '@/lib/api'

const KEYS = {
  admin:                    'dauth_tour_admin',
  profissional:             'dauth_tour_profissional',
  cliente:                  'dauth_tour_cliente',
  admin_caixa_comandas:     'dauth_tour_admin_caixa_comandas',
  admin_caixa_comissoes:    'dauth_tour_admin_caixa_comissoes',
  admin_agendamentos:       'dauth_tour_admin_agendamentos',
  admin_usuarios:           'dauth_tour_admin_usuarios',
  profissional_comandas:    'dauth_tour_profissional_comandas',
  cliente_agendamentos:     'dauth_tour_cliente_agendamentos',
  cliente_combos:           'dauth_tour_cliente_combos',
}

export function useTour(role, steps, ready = true) {
  const tourRef = useRef(null)

  useEffect(() => {
    if (!ready) return
    const key = KEYS[role]
    if (!key || localStorage.getItem(key) === 'done') return

    const tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        cancelIcon: { enabled: true },
        scrollTo: { behavior: 'smooth', block: 'center' },
        classes: 'dauth-shepherd',
      },
    })

    steps.forEach(step => tour.addStep({
      ...step,
      buttons: step.buttons ?? [
        { text: 'Pular', action: () => tour.cancel(), classes: 'shepherd-btn-skip' },
        { text: 'Próximo →', action: () => tour.next(), classes: 'shepherd-btn-primary' },
      ],
    }))

    function markDone() {
      localStorage.setItem(key, 'done')
      api.patch('/users/perfil/me', { Tours_completed: { [role]: true } }).catch(() => {})
    }
    tour.on('complete', markDone)
    tour.on('cancel',   markDone)

    tourRef.current = tour
    tour.start()

    return () => { tourRef.current?.cancel() }
  }, [role, ready])
}
