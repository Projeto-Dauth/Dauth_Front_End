import { useState, useEffect } from 'react'
import Icon from '@/components/ui/Icons'
import Button from '@/components/ui/Button'
import api from '@/lib/api'
import { useToast } from '@/context/ToastContext'

const PAY_METHODS = [
  { id: 'pix', icon: 'qr', label: 'Pix' },
  { id: 'dinheiro', icon: 'cash', label: 'Dinheiro' },
  { id: 'cartao_debito', icon: 'card', label: 'Débito' },
  { id: 'cartao_credito', icon: 'card', label: 'Crédito' },
]

const inputClsAddProd = 'h-[38px] px-3 rounded-md border border-line bg-surface text-ink-2 text-[13px] placeholder:text-ink-4 focus:outline-none focus:border-brand transition-colors w-full'

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
  const { addToast } = useToast()
  const [removedTabIds, setRemovedTabIds] = useState(new Set())
  const [orderQty, setOrderQty] = useState({}) // { [orderId]: quantidade a pagar agora }
  const [clientData, setClientData] = useState(client)
  const [products, setProducts] = useState([])
  const [productSearch, setProductSearch] = useState('')
  const [addingProductId, setAddingProductId] = useState(null)
  const [editingItemId, setEditingItemId] = useState(null)
  const [updatingItemId, setUpdatingItemId] = useState(null)

  useEffect(() => {
    setClientData(client)
    setRemovedTabIds(new Set())
    setOrderQty(Object.fromEntries((client?.orders ?? []).map(o => [o.UUID, o.Quantity])))
  }, [client?.client_id])

  useEffect(() => {
    api.get('/product', { params: { limit: 100 } })
      .then(({ data }) => setProducts((data.data ?? []).filter(p => p.Active)))
      .catch(() => {})
  }, [])

  if (!clientData) return null

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

  const refreshSummary = async () => {
    try {
      const { data } = await api.get(`/tab/client/${clientData.client_id}/account-summary`)
      setClientData(data)
      setOrderQty(prev => {
        const next = { ...prev }
        for (const o of data.orders ?? []) {
          if (!(o.UUID in next)) next[o.UUID] = o.Quantity
        }
        return next
      })
    } catch { /* mantém o estado anterior se o refresh falhar */ }
  }

  const handleAddProduct = async (product) => {
    setAddingProductId(product.UUID)
    try {
      await api.post('/product-order', { Product_id: product.UUID, Client_id: clientData.client_id, Quantity: 1 })
      addToast(`${product.Name} adicionado à conta`, 'success')
      await refreshSummary()
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao adicionar produto', 'error')
    } finally {
      setAddingProductId(null)
    }
  }

  // Edita o Unit_price de um item específico da comanda (Tab_items) — o backend
  // (PATCH /tab/:id/items/:itemId) recalcula Tab.Value automaticamente via trigger, então
  // basta rebuscar o resumo da conta pra refletir o novo total, sem somar nada aqui.
  const handleUpdateItemPrice = async (tabId, item, rawValue) => {
    setEditingItemId(null)
    const newPrice = parseFloat(String(rawValue).replace(',', '.'))
    if (!Number.isFinite(newPrice) || newPrice < 0 || newPrice === item.Unit_price) return
    setUpdatingItemId(item.UUID)
    try {
      const { data: updatedItem } = await api.patch(`/tab/${tabId}/items/${item.UUID}`, { Unit_price: newPrice })
      // Atualiza o estado local em vez de rebuscar /account-summary inteiro — esse GET
      // encadeia várias queries sequenciais no Supabase (findTabIdsByClient sozinho já faz
      // 4) e deixava a edição de preço lenta. Tab.Value aqui é só a mesma soma que o
      // trigger recalc_tab_value já faz no banco, então recalcular no cliente é seguro.
      setClientData(prev => ({
        ...prev,
        tabs: prev.tabs.map(t => {
          if (t.UUID !== tabId) return t
          const items = (t.Items ?? []).map(i =>
            i.UUID === updatedItem.UUID ? { ...i, Unit_price: updatedItem.Unit_price, Quantity: updatedItem.Quantity } : i
          )
          return { ...t, Items: items, Value: items.reduce((s, i) => s + i.Unit_price * i.Quantity, 0) }
        })
      }))
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao atualizar valor do item', 'error')
    } finally {
      setUpdatingItemId(null)
    }
  }

  const renderItemPrice = (tabId, item, displayClassName = 'font-mono shrink-0') => {
    if (editingItemId === item.UUID) {
      return (
        <input
          autoFocus
          type="number"
          step="0.01"
          min="0"
          defaultValue={item.Unit_price}
          onBlur={e => handleUpdateItemPrice(tabId, item, e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') e.target.blur()
            if (e.key === 'Escape') { e.target.value = item.Unit_price; e.target.blur() }
          }}
          onClick={e => e.stopPropagation()}
          className="w-20 h-6 px-1.5 rounded border border-brand bg-surface text-ink text-[12.5px] font-mono text-right focus:outline-none shrink-0"
        />
      )
    }
    const isUpdating = updatingItemId === item.UUID
    return (
      <button
        type="button"
        onClick={e => { e.stopPropagation(); setEditingItemId(item.UUID) }}
        disabled={isUpdating}
        title="Editar valor do item"
        className={`${displayClassName} text-left hover:text-brand hover:underline decoration-dotted underline-offset-2 cursor-pointer disabled:opacity-50 disabled:cursor-wait transition-colors`}
      >
        {formatCurrency(item.Unit_price * item.Quantity)}
      </button>
    )
  }

  const filteredProducts = productSearch
    ? products.filter(p => p.Name.toLowerCase().includes(productSearch.toLowerCase()))
    : products

  const remainingTabIds = clientData.tabs.filter(t => !removedTabIds.has(t.UUID)).map(t => t.UUID)
  const orderPayments = clientData.orders
    .filter(o => (orderQty[o.UUID] ?? 0) > 0)
    .map(o => ({ order_id: o.UUID, quantity: orderQty[o.UUID] }))

  const total =
    clientData.tabs.filter(t => !removedTabIds.has(t.UUID)).reduce((s, t) => s + t.Value, 0) +
    clientData.orders.reduce((s, o) => s + (orderQty[o.UUID] ?? 0) * o.Unit_price, 0)

  const canConfirm = remainingTabIds.length + orderPayments.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-surface border border-line rounded-[16px] w-full max-w-[860px] max-h-[92vh] shadow-xl flex flex-col">
        <div className="px-6 py-5 border-b border-line flex justify-between items-center shrink-0">
          <div>
            <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">Fechar conta</span>
            <h4 className="font-display font-medium text-[18px] tracking-tight mt-1">{clientData.client_name}</h4>
          </div>
          <button onClick={onClose} className="text-ink-3 hover:text-ink transition-colors cursor-pointer">
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="flex flex-col md:flex-row flex-1 min-h-0">
        <div className="flex-1 min-w-0 flex flex-col md:border-r border-line">
        <div className="px-6 pt-5 overflow-y-auto flex-1 min-h-0 scrollbar-hidden">
          <div className="space-y-1.5 mb-5">
            {clientData.tabs.map(t => {
              const ativo = !removedTabIds.has(t.UUID)
              const items = t.Items ?? []
              const isCombo = items.length === 0 && t.Value === 0
              const singleItem = items.length === 1 ? items[0] : null
              return (
                <div key={t.UUID} className={`${items.length > 1 ? 'border border-line-2 rounded-lg p-2 space-y-1' : ''} transition-opacity ${ativo ? '' : 'opacity-40'}`}>
                  {items.length > 1 && (
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[9.5px] uppercase tracking-widest text-ink-4">Atendimento combinado</span>
                      <span className="font-mono text-[9.5px] text-ink-4">{formatDate(t.Appointment?.Date)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[13px]">
                    <span className={`flex-1 min-w-0 truncate text-ink-2 ${ativo ? '' : 'line-through'}`}>
                      {isCombo
                        ? 'Sessão de combo'
                        : items.length > 0
                          ? items.map(i => i.Item_type === 'product' && i.Quantity > 1 ? `${i.Name} ×${i.Quantity}` : i.Name).join(' + ')
                          : `Comanda · ${formatTime(t.Appointment?.Start_time)}`}
                    </span>
                    {singleItem
                      ? renderItemPrice(t.UUID, singleItem, 'font-mono font-medium text-ink shrink-0')
                      : <span className="font-mono font-medium text-ink shrink-0">{formatCurrency(t.Value)}</span>}
                    <button
                      onClick={() => toggleTab(t.UUID)}
                      className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-full border transition-colors cursor-pointer ${
                        ativo ? 'border-danger/40 text-danger hover:bg-danger-soft' : 'border-success/40 text-success hover:bg-success/10'
                      }`}>
                      <Icon name={ativo ? 'x' : 'plus'} size={11} />
                    </button>
                  </div>
                  {items.length > 1 && (
                    <div className="pl-2 space-y-0.5">
                      {items.map(i => (
                        <div key={i.UUID} className="flex items-center justify-between gap-2 text-[11.5px] text-ink-3">
                          <span className="truncate">
                            {i.Name}{i.Professional ? ` · ${i.Professional}` : ''}{i.Quantity > 1 ? ` ×${i.Quantity}` : ''}
                          </span>
                          {renderItemPrice(t.UUID, i)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
            {clientData.orders.length > 0 && (
              <>
                <div className="pt-2 border-t border-dashed border-line-2">
                  <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">Produtos</span>
                </div>
                {clientData.orders.map(o => {
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

        <div className="w-full md:w-[300px] shrink-0 flex flex-col border-t md:border-t-0 border-line">
          <div className="px-5 py-4 border-b border-line shrink-0">
            <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">Produtos</span>
            <h5 className="font-display font-medium text-[14px] tracking-tight mt-1">Adicionar à conta</h5>
          </div>
          <div className="px-5 py-3 border-b border-line shrink-0">
            <input
              value={productSearch}
              onChange={e => setProductSearch(e.target.value)}
              placeholder="Buscar produto..."
              className={inputClsAddProd}
            />
          </div>
          <div className="overflow-y-auto flex-1 min-h-0 scrollbar-hidden max-h-[240px] md:max-h-none">
            {filteredProducts.length === 0 ? (
              <div className="px-5 py-6 text-center text-ink-3 text-[12.5px]">Nenhum produto encontrado</div>
            ) : filteredProducts.map(p => (
              <div key={p.UUID} className="flex items-center justify-between gap-2 px-5 py-2.5 border-b border-line-2 last:border-0">
                <div className="min-w-0">
                  <div className="text-[12.5px] font-medium truncate">{p.Name}</div>
                  <div className="font-mono text-[11px] text-ink-3">{formatCurrency(p.Price)} · estoque {p.Stock}</div>
                </div>
                <button
                  onClick={() => handleAddProduct(p)}
                  disabled={addingProductId === p.UUID}
                  title="Adicionar à conta"
                  className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-brand text-white hover:bg-brand/90 disabled:opacity-50 transition-colors cursor-pointer">
                  <Icon name="plus" size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
