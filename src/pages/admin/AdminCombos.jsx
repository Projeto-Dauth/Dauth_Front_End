import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Sidebar from '@/components/layout/Sidebar'
import Button from '@/components/ui/Button'
import Icon from '@/components/ui/Icons'
import Modal from '@/components/ui/Modal'
import { PageSpinner } from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import { useToast } from '@/context/ToastContext'
import useAuthStore from '@/store/authStore'
import api from '@/lib/api'

const navItems = [
  { to: '/admin', end: true, icon: 'cal', label: 'Agenda' },
  { to: '/admin/agendamentos', icon: 'receipt', label: 'Agendamentos' },
  { to: '/admin/usuarios', icon: 'users', label: 'Usuários' },
  { to: '/admin/convidar-profissional', icon: 'plus', label: 'Convidar profissional' },
  { to: '/admin/servicos', icon: 'scissors', label: 'Serviços' },
  { to: '/admin/combos', icon: 'package', label: 'Pacotes' },
  { type: 'label', label: 'Financeiro' },
  { to: '/admin/caixa', icon: 'receipt', label: 'Comandas' },
  { type: 'label', label: 'Conta' },
  { to: '/perfil', icon: 'users', label: 'Meu perfil' },
]

const EMPTY_PKG = { Name: '', Price: '', Available_until: '' }

function formatCurrency(v) {
  return `R$ ${Number(v).toFixed(2).replace('.', ',')}`
}

function formatDate(iso) {
  if (!iso) return null
  const [y, m, d] = iso.split('T')[0].split('-')
  return `${d}/${m}/${y}`
}

export default function AdminCombos() {
  const { user } = useAuthStore()
  const { addToast } = useToast()

  const [packages, setPackages] = useState([])  // [{ ...pkg, items: [] }]
  const [services, setServices] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  // Drawer pacote
  const [pkgDrawer, setPkgDrawer] = useState(false)  // false | 'create' | uuid
  const [pkgForm, setPkgForm] = useState(EMPTY_PKG)
  const [savingPkg, setSavingPkg] = useState(false)
  const [deletePkg, setDeletePkg] = useState(null)
  const [deletingPkg, setDeletingPkg] = useState(false)

  // Drawer de itens (gerenciar serviços do pacote)
  const [itemsDrawer, setItemsDrawer] = useState(null)  // uuid do pacote
  const [newItem, setNewItem] = useState({ service_id: '', quantity: 1 })
  const [addingItem, setAddingItem] = useState(false)
  const [deleteItem, setDeleteItem] = useState(null)  // { pkgId, itemId, name }
  const [deletingItem, setDeletingItem] = useState(false)

  // Modal vender
  const [sellPkg, setSellPkg] = useState(null)  // { UUID, Name }
  const [sellClientId, setSellClientId] = useState('')
  const [selling, setSelling] = useState(false)

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const { data: pkgData } = await api.get('/package')
      const pkgs = pkgData.data ?? []

      const itemResults = await Promise.all(
        pkgs.map((p) => api.get(`/package/${p.UUID}/items`).then((r) => r.data.data ?? []).catch(() => []))
      )

      setPackages(pkgs.map((p, i) => ({ ...p, items: itemResults[i] })))
    } catch {
      setPackages([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  useEffect(() => {
    api.get('/service').then(({ data }) => setServices(data.data ?? [])).catch(() => {})
    api.get('/users', { params: { Role: 'Usuario' } }).then(({ data }) => setClients(data.data ?? [])).catch(() => {})
  }, [])

  // ── Pacote handlers ──────────────────────────────────────────────────────

  function openCreate() {
    setPkgForm(EMPTY_PKG)
    setPkgDrawer('create')
  }

  function openEdit(pkg) {
    setPkgForm({
      Name: pkg.Name,
      Price: pkg.Price,
      Available_until: pkg.Available_until ? pkg.Available_until.split('T')[0] : '',
    })
    setPkgDrawer(pkg.UUID)
  }

  async function handleSavePkg(e) {
    e.preventDefault()
    setSavingPkg(true)
    const body = {
      Name: pkgForm.Name,
      Price: Number(pkgForm.Price),
      ...(pkgForm.Available_until ? { Available_until: pkgForm.Available_until } : {}),
    }
    try {
      if (pkgDrawer === 'create') {
        await api.post('/package', body)
        addToast('Pacote criado', 'success')
      } else {
        await api.patch(`/package/${pkgDrawer}`, body)
        addToast('Pacote atualizado', 'success')
      }
      setPkgDrawer(false)
      loadAll()
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao salvar pacote', 'error')
    } finally {
      setSavingPkg(false)
    }
  }

  async function handleDeletePkg() {
    if (!deletePkg) return
    setDeletingPkg(true)
    try {
      await api.delete(`/package/${deletePkg.UUID}`)
      addToast('Pacote excluído', 'success')
      setDeletePkg(null)
      loadAll()
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao excluir pacote', 'error')
    } finally {
      setDeletingPkg(false)
    }
  }

  // ── Item handlers ────────────────────────────────────────────────────────

  function openItems(pkg) {
    setNewItem({ service_id: '', quantity: 1 })
    setItemsDrawer(pkg.UUID)
  }

  async function handleAddItem(e) {
    e.preventDefault()
    if (!newItem.service_id) { addToast('Selecione um serviço', 'warning'); return }
    setAddingItem(true)
    try {
      await api.post(`/package/${itemsDrawer}/items`, {
        Service_id: newItem.service_id,
        Quantity: Number(newItem.quantity),
      })
      addToast('Serviço adicionado', 'success')
      setNewItem({ service_id: '', quantity: 1 })
      loadAll()
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao adicionar serviço', 'error')
    } finally {
      setAddingItem(false)
    }
  }

  async function handleDeleteItem() {
    if (!deleteItem) return
    setDeletingItem(true)
    try {
      await api.delete(`/package/${deleteItem.pkgId}/items/${deleteItem.itemId}`)
      addToast('Serviço removido', 'success')
      setDeleteItem(null)
      loadAll()
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao remover serviço', 'error')
    } finally {
      setDeletingItem(false)
    }
  }

  // ── Vender handler ───────────────────────────────────────────────────────

  async function handleSell() {
    if (!sellClientId) { addToast('Selecione um cliente', 'warning'); return }
    setSelling(true)
    try {
      await api.post(`/package/${sellPkg.UUID}/sell`, { Client_id: sellClientId })
      addToast(`Combo "${sellPkg.Name}" vendido! Registre o pagamento na Caixa.`, 'success')
      setSellPkg(null)
      setSellClientId('')
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao vender combo', 'error')
    } finally {
      setSelling(false)
    }
  }

  const currentPkg = packages.find((p) => p.UUID === itemsDrawer)

  const sidebar = (
    <Sidebar navItems={navItems} footerUser={user?.name} footerRole="Admin">Admin</Sidebar>
  )

  return (
    <AppLayout sidebar={sidebar}>
      <div className="flex justify-between items-end mb-7">
        <div>
          <h3 className="font-display font-medium text-[26px] tracking-tight">Pacotes</h3>
          <p className="text-[13px] text-ink-3 mt-1">{packages.length} pacote{packages.length !== 1 ? 's' : ''} no catálogo</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Icon name="plus" size={14} />Novo pacote
        </Button>
      </div>

      {loading ? <PageSpinner /> : packages.length === 0 ? (
        <EmptyState icon="package" title="Nenhum pacote" description="Crie o primeiro combo do salão." action={openCreate} actionLabel="Novo pacote" />
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {packages.map((pkg) => (
            <div key={pkg.UUID} className="bg-surface border border-line rounded-2xl p-6 flex flex-col">
              <div className="flex justify-between items-start pb-4 border-b border-line-2 mb-4">
                <div className="flex-1 min-w-0 pr-3">
                  <div className="font-mono text-[10.5px] uppercase tracking-widest text-brand mb-1">Pacote</div>
                  <h3 className="font-display font-medium text-[18px] tracking-tight leading-snug">{pkg.Name}</h3>
                  {pkg.Available_until && (
                    <div className="font-mono text-[11px] text-ink-3 mt-1">Válido até {formatDate(pkg.Available_until)}</div>
                  )}
                </div>
                <div className="font-display font-medium text-[22px] tracking-tight flex-shrink-0">{formatCurrency(pkg.Price)}</div>
              </div>

              {/* Itens */}
              <div className="flex-1 mb-4">
                {pkg.items.length === 0 ? (
                  <div className="text-[12px] text-ink-3 italic">Nenhum serviço adicionado</div>
                ) : pkg.items.map((item) => (
                  <div key={item.UUID} className="flex justify-between items-center py-2 text-[13px] border-b border-line-2 last:border-0">
                    <span>{item.Service?.Name ?? '—'}</span>
                    <span className="font-mono text-[11.5px] px-2 py-[2px] bg-surface-2 rounded-full text-ink-2">×{item.Quantity}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-4 border-t border-line-2">
                <Button variant="primary" size="sm" className="flex-1 justify-center" onClick={() => { setSellPkg(pkg); setSellClientId('') }}>
                  Vender
                </Button>
                <Button variant="ghost" size="sm" onClick={() => openItems(pkg)}>
                  <Icon name="plus" size={13} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => openEdit(pkg)}>
                  <Icon name="edit" size={13} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDeletePkg(pkg)}>
                  <Icon name="trash" size={13} />
                </Button>
              </div>
            </div>
          ))}

          {/* Card criar */}
          <button onClick={openCreate}
            className="border border-dashed border-line rounded-2xl flex flex-col items-center justify-center gap-2.5 min-h-[200px] text-ink-3 hover:border-ink-3 transition-colors cursor-pointer bg-transparent">
            <Icon name="plus" size={26} />
            <div className="font-display text-[15px]">Criar novo pacote</div>
          </button>
        </div>
      )}

      {/* ── DRAWER — Pacote ─────────────────────────────────────────── */}
      {pkgDrawer && (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-ink/30" onClick={() => setPkgDrawer(false)} />
          <div className="w-[400px] bg-surface border-l border-line h-full overflow-y-auto p-7 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-display font-medium text-[20px] tracking-tight">
                {pkgDrawer === 'create' ? 'Novo pacote' : 'Editar pacote'}
              </h4>
              <button onClick={() => setPkgDrawer(false)} className="text-ink-3 hover:text-ink cursor-pointer transition-colors">
                <Icon name="x" size={18} />
              </button>
            </div>
            <form onSubmit={handleSavePkg} className="flex flex-col gap-4 flex-1">
              <DrawerField label="Nome do pacote">
                <input required value={pkgForm.Name}
                  onChange={(e) => setPkgForm((f) => ({ ...f, Name: e.target.value }))}
                  placeholder="Ex: Combo Noiva" className={inputCls} />
              </DrawerField>
              <DrawerField label="Preço (R$)">
                <input required type="number" min="0" step="0.01" value={pkgForm.Price}
                  onChange={(e) => setPkgForm((f) => ({ ...f, Price: e.target.value }))}
                  placeholder="0,00" className={inputCls} />
              </DrawerField>
              <DrawerField label="Válido até (opcional)">
                <input type="date" value={pkgForm.Available_until}
                  onChange={(e) => setPkgForm((f) => ({ ...f, Available_until: e.target.value }))}
                  className={inputCls} />
              </DrawerField>
              <div className="flex gap-2 mt-auto pt-4">
                <Button type="button" variant="ghost" className="flex-1 justify-center" onClick={() => setPkgDrawer(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" className="flex-1 justify-center" disabled={savingPkg}>
                  {savingPkg ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DRAWER — Itens do pacote ─────────────────────────────── */}
      {itemsDrawer && currentPkg && (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-ink/30" onClick={() => setItemsDrawer(null)} />
          <div className="w-[420px] bg-surface border-l border-line h-full overflow-y-auto p-7 flex flex-col">
            <div className="flex justify-between items-center mb-1">
              <h4 className="font-display font-medium text-[20px] tracking-tight">Serviços do pacote</h4>
              <button onClick={() => setItemsDrawer(null)} className="text-ink-3 hover:text-ink cursor-pointer transition-colors">
                <Icon name="x" size={18} />
              </button>
            </div>
            <div className="font-mono text-[11px] text-ink-3 mb-6">{currentPkg.Name}</div>

            {/* Lista atual */}
            <div className="mb-5">
              {currentPkg.items.length === 0 ? (
                <div className="text-[13px] text-ink-3 italic">Nenhum serviço ainda</div>
              ) : currentPkg.items.map((item) => (
                <div key={item.UUID} className="flex justify-between items-center py-2.5 border-b border-line-2 last:border-0">
                  <div>
                    <div className="text-[13px] font-medium">{item.Service?.Name ?? '—'}</div>
                    <div className="font-mono text-[11px] text-ink-3">×{item.Quantity}</div>
                  </div>
                  <button
                    onClick={() => setDeleteItem({ pkgId: currentPkg.UUID, itemId: item.UUID, name: item.Service?.Name })}
                    className="text-ink-3 hover:text-danger transition-colors cursor-pointer p-1"
                  >
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Adicionar serviço */}
            <div className="border-t border-line pt-5">
              <div className="font-mono text-[11px] uppercase tracking-widest text-ink-3 mb-3">Adicionar serviço</div>
              <form onSubmit={handleAddItem} className="flex flex-col gap-3">
                <DrawerField label="Serviço">
                  <select value={newItem.service_id}
                    onChange={(e) => setNewItem((f) => ({ ...f, service_id: e.target.value }))}
                    className={inputCls}>
                    <option value="">Selecione...</option>
                    {services.map((s) => (
                      <option key={s.UUID} value={s.UUID}>{s.Name}</option>
                    ))}
                  </select>
                </DrawerField>
                <DrawerField label="Quantidade">
                  <input type="number" min="1" value={newItem.quantity}
                    onChange={(e) => setNewItem((f) => ({ ...f, quantity: e.target.value }))}
                    className={inputCls} />
                </DrawerField>
                <Button type="submit" variant="primary" className="w-full justify-center" disabled={addingItem}>
                  <Icon name="plus" size={14} />
                  {addingItem ? 'Adicionando...' : 'Adicionar'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL — Vender ───────────────────────────────────────── */}
      {sellPkg && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-ink/30" onClick={() => setSellPkg(null)} />
          <div className="relative bg-surface border border-line rounded-2xl p-7 w-[400px] shadow-lg">
            <div className="flex justify-between items-center mb-5">
              <h4 className="font-display font-medium text-[20px] tracking-tight">Vender pacote</h4>
              <button onClick={() => setSellPkg(null)} className="text-ink-3 hover:text-ink cursor-pointer transition-colors">
                <Icon name="x" size={18} />
              </button>
            </div>
            <div className="bg-surface-2 border border-line rounded-lg px-4 py-3 mb-5">
              <div className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3 mb-0.5">Pacote</div>
              <div className="font-display font-medium text-[16px]">{sellPkg.Name}</div>
              <div className="font-mono text-[13px] text-brand mt-0.5">{formatCurrency(sellPkg.Price)}</div>
            </div>
            <DrawerField label="Cliente">
              <select value={sellClientId} onChange={(e) => setSellClientId(e.target.value)} className={inputCls}>
                <option value="">Selecione o cliente...</option>
                {clients.map((c) => (
                  <option key={c.UUID} value={c.UUID}>{c.Name} — {c.Email}</option>
                ))}
              </select>
            </DrawerField>
            <div className="text-[12px] text-ink-3 mt-2 mb-5">
              Uma comanda será criada automaticamente. Registre o pagamento na Caixa.
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1 justify-center" onClick={() => setSellPkg(null)}>
                Cancelar
              </Button>
              <Button variant="primary" className="flex-1 justify-center" onClick={handleSell} disabled={selling}>
                {selling ? 'Vendendo...' : 'Confirmar venda'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAIS DE CONFIRMAÇÃO ────────────────────────────────── */}
      <Modal
        isOpen={!!deletePkg}
        onClose={() => setDeletePkg(null)}
        onConfirm={handleDeletePkg}
        title="Excluir pacote"
        message={`"${deletePkg?.Name}" será removido permanentemente.`}
        confirmLabel="Excluir"
        loading={deletingPkg}
      />
      <Modal
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDeleteItem}
        title="Remover serviço"
        message={`"${deleteItem?.name}" será removido deste pacote.`}
        confirmLabel="Remover"
        loading={deletingItem}
      />
    </AppLayout>
  )
}

const inputCls = `h-[42px] px-[14px] rounded-md border border-line bg-surface text-ink-2 font-body text-md
  placeholder:text-ink-4 focus:outline-none focus:border-brand transition-colors w-full`

function DrawerField({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] text-ink-3 font-medium uppercase tracking-wider">{label}</label>
      {children}
    </div>
  )
}
