import { useState, useEffect } from 'react'
import Icon from '@/components/ui/Icons'
import Button from '@/components/ui/Button'

const PAY_METHODS = [
  { id: 'pix', icon: 'qr', label: 'Pix' },
  { id: 'dinheiro', icon: 'cash', label: 'Dinheiro' },
  { id: 'cartao_debito', icon: 'card', label: 'Débito' },
  { id: 'cartao_credito', icon: 'card', label: 'Crédito' },
]

function formatCurrency(v) {
  return `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatTime(t) {
  if (!t) return '—'
  return t.slice(0, 5)
}

function formatDate(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

export default function ModalFecharConta({ client, method, onMethodChange, paying, onClose, onConfirm }) {
  const [removedTabIds, setRemovedTabIds] = useState(new Set())
  const [orderQty, setOrderQty] = useState({}) // { [orderId]: quantidade a pagar agora }

  useEffect(() => {
    setRemovedTabIds(new Set())
    setOrderQty(Object.fromEntries((client?.orders ?? []).map(o => [o.UUID, o.Quantity])))
  }, [client?.client_id])

  if (!client) return null

  const toggleTab = (id) => {
    setRemovedTabIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  const setQty = (o, qty) => {
    setOrderQty(prev => ({ ...prev, [o.UUID]: Math.max(0, Math.min(o.Quantity, qty)) }))
  }

  const remainingTabIds = client.tabs.filter(t => !removedTabIds.has(t.UUID)).map(t => t.UUID)
  const orderPayments = client.orders
    .filter(o => (orderQty[o.UUID] ?? 0) > 0)
    .map(o => ({ order_id: o.UUID, quantity: orderQty[o.UUID] }))

  const total =
    client.tabs.filter(t => !removedTabIds.has(t.UUID)).reduce((s, t) => s + t.Value, 0) +
    client.orders.reduce((s, o) => s + (orderQty[o.UUID] ?? 0) * o.Unit_price, 0)

  const canConfirm = remainingTabIds.length + orderPayments.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-surface border border-line rounded-[16px] w-full max-w-[400px] max-h-[85vh] shadow-xl flex flex-col">
        <div className="px-6 py-5 border-b border-line flex justify-between items-center shrink-0">
          <div>
            <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">Fechar conta</span>
            <h4 className="font-display font-medium text-[18px] tracking-tight mt-1">{client.client_name}</h4>
          </div>
          <button onClick={onClose} className="text-ink-3 hover:text-ink transition-colors cursor-pointer">
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="px-6 pt-5 overflow-y-auto flex-1 min-h-0 scrollbar-hidden">
          <div className="space-y-1.5 mb-5">
            {(() => {
              const groups = new Map() // Booking_group -> tabs[]
              const solo = []
              client.tabs.forEach(t => {
                const g = t.Appointment?.Booking_group
                if (!g) { solo.push(t); return }
                if (!groups.has(g)) groups.set(g, [])
                groups.get(g).push(t)
              })

              const renderTab = (t) => {
                const ativo = !removedTabIds.has(t.UUID)
                return (
                  <div key={t.UUID} className={`flex items-center gap-2 text-[13px] transition-opacity ${ativo ? '' : 'opacity-40'}`}>
                    <span className={`flex-1 min-w-0 truncate text-ink-2 ${ativo ? '' : 'line-through'}`}>
                      {t.Appointment?.Service} · {t.Appointment?.Professional} · {formatTime(t.Appointment?.Start_time)}
                    </span>
                    <span className="font-mono font-medium text-ink shrink-0">{formatCurrency(t.Value)}</span>
                    <button
                      onClick={() => toggleTab(t.UUID)}
                      className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-full border transition-colors cursor-pointer ${
                        ativo ? 'border-danger/40 text-danger hover:bg-danger-soft' : 'border-success/40 text-success hover:bg-success/10'
                      }`}>
                      <Icon name={ativo ? 'x' : 'plus'} size={11} />
                    </button>
                  </div>
                )
              }

              return <>
                {[...groups.entries()].map(([groupId, tabs]) => (
                  <div key={groupId} className="border border-line-2 rounded-lg p-2 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[9.5px] uppercase tracking-widest text-ink-4">Atendimento combinado</span>
                      <span className="font-mono text-[9.5px] text-ink-4">{formatDate(tabs[0]?.Appointment?.Date)}</span>
                    </div>
                    {tabs.map(renderTab)}
                  </div>
                ))}
                {solo.map(renderTab)}
              </>
            })()}
            {client.orders.length > 0 && (
              <>
                <div className="pt-2 border-t border-dashed border-line-2">
                  <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">Produtos</span>
                </div>
                {client.orders.map(o => {
                  const qty = orderQty[o.UUID] ?? 0
                  const ativo = qty > 0
                  return (
                    <div key={o.UUID} className={`flex items-center gap-2 text-[13px] transition-opacity ${ativo ? '' : 'opacity-40'}`}>
                      <span className={`flex-1 min-w-0 truncate text-ink-2 ${ativo ? '' : 'line-through'}`}>
                        {o.Product?.Name}
                      </span>
                      {o.Quantity > 1 && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setQty(o, qty - 1)}
                            disabled={qty <= 0}
                            className="w-5 h-5 flex items-center justify-center rounded-full border border-line text-ink-3 hover:border-ink-3 hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors">
                            −
                          </button>
                          <span className="font-mono text-[11.5px] text-ink-2 w-4 text-center">{qty}</span>
                          <button
                            onClick={() => setQty(o, qty + 1)}
                            disabled={qty >= o.Quantity}
                            className="w-5 h-5 flex items-center justify-center rounded-full border border-line text-ink-3 hover:border-ink-3 hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors">
                            +
                          </button>
                        </div>
                      )}
                      <span className="font-mono font-medium text-ink shrink-0 w-16 text-right">{formatCurrency(qty * o.Unit_price)}</span>
                      <button
                        onClick={() => setQty(o, ativo ? 0 : o.Quantity)}
                        className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-full border transition-colors cursor-pointer ${
                          ativo ? 'border-danger/40 text-danger hover:bg-danger-soft' : 'border-success/40 text-success hover:bg-success/10'
                        }`}>
                        <Icon name={ativo ? 'x' : 'plus'} size={11} />
                      </button>
                    </div>
                  )
                })}
              </>
            )}
            <div className="flex items-center justify-between pt-3 border-t border-dashed border-line-2">
              <span className="font-mono text-[11px] uppercase tracking-widest text-ink-3">Total</span>
              <span className="font-display text-[20px] font-medium text-ink">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
        <div className="px-6 pb-6 pt-4 border-t border-line shrink-0">
          <div className="font-mono text-[11px] uppercase tracking-widest text-ink-3 mb-2.5">Método de pagamento</div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {PAY_METHODS.map((m) => (
              <button
                key={m.id}
                onClick={() => onMethodChange(m.id)}
                className={`px-3 py-3 rounded-[10px] border flex flex-col items-center gap-1.5 text-[13px] cursor-pointer transition-colors
                  ${method === m.id ? 'bg-ink text-bg border-ink' : 'bg-surface border-line hover:border-ink-3'}`}
              >
                <Icon name={m.icon} size={18} />
                {m.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => onMethodChange('fiado')}
            className={`w-full px-3 py-3 rounded-[10px] border flex items-center justify-center gap-2 text-[13px] cursor-pointer transition-colors mb-5
              ${method === 'fiado' ? 'bg-warning/10 text-warning border-warning' : 'bg-surface border-line hover:border-warning/50 text-ink-2'}`}
          >
            <Icon name="clock" size={16} />
            Mensalista — cobrar depois
          </button>
          <Button
            variant="primary"
            className="w-full justify-center"
            onClick={() => onConfirm(remainingTabIds, orderPayments)}
            disabled={!canConfirm}
            loading={paying}
          >
            <Icon name="check" size={14} />
            {method === 'fiado' ? `Registrar mensalidade · ${formatCurrency(total)}` : `Fechar conta · ${formatCurrency(total)}`}
          </Button>
        </div>
      </div>
    </div>
  )
}
