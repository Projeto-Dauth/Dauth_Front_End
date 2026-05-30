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

export default function ModalFecharConta({ client, orders, ordersLoading, method, onMethodChange, paying, onClose, onConfirm }) {
  if (!client) return null

  const total =
    client.tabs.reduce((s, t) => s + t.Value, 0) +
    orders.reduce((s, o) => s + o.Total_price, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-surface border border-line rounded-[16px] w-full max-w-[400px] shadow-xl">
        <div className="px-6 py-5 border-b border-line flex justify-between items-center">
          <div>
            <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">Fechar conta</span>
            <h4 className="font-display font-medium text-[18px] tracking-tight mt-1">{client.name}</h4>
          </div>
          <button onClick={onClose} className="text-ink-3 hover:text-ink transition-colors cursor-pointer">
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="px-6 py-5">
          {ordersLoading ? (
            <div className="space-y-2 mb-5 animate-pulse">
              {client.tabs.map(t => (
                <div key={t.UUID} className="flex items-center justify-between">
                  <div className="h-3.5 bg-line rounded w-2/3" />
                  <div className="h-3.5 bg-line rounded w-16" />
                </div>
              ))}
              <div className="pt-2 border-t border-dashed border-line-2 space-y-2">
                <div className="h-3 bg-line rounded w-1/4" />
                <div className="flex items-center justify-between">
                  <div className="h-3.5 bg-line rounded w-1/2" />
                  <div className="h-3.5 bg-line rounded w-16" />
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-dashed border-line-2">
                <div className="h-3 bg-line rounded w-10" />
                <div className="h-6 bg-line rounded w-24" />
              </div>
            </div>
          ) : (
            <div className="space-y-2 mb-5">
              {client.tabs.map(t => (
                <div key={t.UUID} className="flex items-center justify-between text-[13px]">
                  <span className="text-ink-2">{t.Appointment?.Service} · {formatTime(t.Appointment?.Start_time)}</span>
                  <span className="font-mono font-medium text-ink">{formatCurrency(t.Value)}</span>
                </div>
              ))}
              {orders.length > 0 && (
                <>
                  <div className="pt-2 border-t border-dashed border-line-2">
                    <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">Produtos</span>
                  </div>
                  {orders.map(o => (
                    <div key={o.UUID} className="flex items-center justify-between text-[13px]">
                      <span className="text-ink-2">{o.Product?.Name} × {o.Quantity}</span>
                      <span className="font-mono font-medium text-ink">{formatCurrency(o.Total_price)}</span>
                    </div>
                  ))}
                </>
              )}
              <div className="flex items-center justify-between pt-3 border-t border-dashed border-line-2">
                <span className="font-mono text-[11px] uppercase tracking-widest text-ink-3">Total</span>
                <span className="font-display text-[20px] font-medium text-ink">{formatCurrency(total)}</span>
              </div>
            </div>
          )}
          <div className="font-mono text-[11px] uppercase tracking-widest text-ink-3 mb-2.5">Método de pagamento</div>
          <div className="grid grid-cols-2 gap-2 mb-5">
            {PAY_METHODS.map(m => (
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
          <Button
            variant="primary"
            className="w-full justify-center"
            onClick={onConfirm}
            disabled={ordersLoading}
            loading={paying}
          >
            <Icon name="check" size={14} />
            {ordersLoading ? 'Carregando...' : `Fechar conta · ${formatCurrency(total)}`}
          </Button>
        </div>
      </div>
    </div>
  )
}
