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
import { navItemsByRole } from '@/config/navItems'

const navItems = navItemsByRole['Admin']

function formatDuration(d) {
  const [h, m] = d.split(':').map(Number)
  if (h > 0 && m > 0) return `${h}h ${m}min`
  if (h > 0) return `${h}h`
  return `${m} min`
}

function formatPrice(p) {
  if (!p && p !== 0) return '—'
  return `R$ ${Number(p).toFixed(2).replace('.', ',')}`
}

const EMPTY_SERVICE = { Name: '', Duration: '01:00', Commission: '', Price: '', Category: '' }
const EMPTY_CATEGORY = { Name: '' }

export default function AdminServicos() {
  const { user } = useAuthStore()
  const { addToast } = useToast()

  const [tab, setTab] = useState('servicos') // 'servicos' | 'categorias'

  // ── Serviços
  const [services, setServices] = useState([])
  const [loadingServices, setLoadingServices] = useState(true)
  const [categories, setCategories] = useState([])

  // ── Categorias
  const [loadingCats, setLoadingCats] = useState(true)

  // ── Formulário serviço
  const [svcForm, setSvcForm] = useState(EMPTY_SERVICE)
  const [svcDrawer, setSvcDrawer] = useState(false)   // false | 'create' | uuid (edit)
  const [savingSvc, setSavingSvc] = useState(false)
  const [deleteSvc, setDeleteSvc] = useState(null)    // { UUID, Name }
  const [deletingSvc, setDeletingSvc] = useState(false)

  // ── Formulário categoria
  const [catForm, setCatForm] = useState(EMPTY_CATEGORY)
  const [catDrawer, setCatDrawer] = useState(false)   // false | 'create' | uuid (edit)
  const [savingCat, setSavingCat] = useState(false)
  const [deleteCat, setDeleteCat] = useState(null)    // { UUID, Name }
  const [deletingCat, setDeletingCat] = useState(false)

  // ── Drawer profissionais do serviço
  const [profsDrawer, setProfsDrawer] = useState(null)  // null | { UUID, Name }
  const [linkedProfs, setLinkedProfs] = useState([])
  const [loadingProfs, setLoadingProfs] = useState(false)
  const [allProfessionals, setAllProfessionals] = useState([])
  const [selectedProfId, setSelectedProfId] = useState('')
  const [linkingProf, setLinkingProf] = useState(false)
  const [unlinkProf, setUnlinkProf] = useState(null)    // { linkId, name }
  const [unlinkingProf, setUnlinkingProf] = useState(false)

  const loadServices = useCallback(async () => {
    setLoadingServices(true)
    try {
      const { data } = await api.get('/service')
      setServices(data.data ?? [])
    } catch {
      setServices([])
    } finally {
      setLoadingServices(false)
    }
  }, [])

  const loadCategories = useCallback(async () => {
    setLoadingCats(true)
    try {
      const { data } = await api.get('/category')
      setCategories(data.data ?? [])
    } catch {
      setCategories([])
    } finally {
      setLoadingCats(false)
    }
  }, [])

  useEffect(() => {
    loadServices()
    loadCategories()
    Promise.all([
      api.get('/users', { params: { Role: 'Profissional' } }),
      api.get('/users', { params: { Role: 'Admin' } }),
    ])
      .then(([profRes, adminRes]) => {
        setAllProfessionals([...(profRes.data.data ?? []), ...(adminRes.data.data ?? [])])
      })
      .catch(() => {})
  }, [])

  // ─── Serviço — handlers ───────────────────────────────────────────────────

  function openCreateSvc() {
    setSvcForm(EMPTY_SERVICE)
    setSvcDrawer('create')
  }

  function openEditSvc(svc) {
    setSvcForm({
      Name: svc.Name,
      Duration: svc.Duration.slice(0, 5), // "01:00:00" → "01:00"
      Commission: svc.Commission,
      Price: svc.Price,
      Category: categories.find((c) => c.Name === svc.Category)?.UUID ?? '',
    })
    setSvcDrawer(svc.UUID)
  }

  async function handleSaveSvc(e) {
    e.preventDefault()
    if (!svcForm.Category) { addToast('Selecione uma categoria', 'warning'); return }
    setSavingSvc(true)
    const duration = svcForm.Duration.length === 5 ? `${svcForm.Duration}:00` : svcForm.Duration
    const body = {
      Name: svcForm.Name,
      Duration: duration,
      Commission: Number(svcForm.Commission),
      Price: Number(svcForm.Price),
      Category: svcForm.Category,
    }
    try {
      if (svcDrawer === 'create') {
        await api.post('/service', body)
        addToast('Serviço criado', 'success')
      } else {
        await api.patch(`/service/${svcDrawer}`, body)
        addToast('Serviço atualizado', 'success')
      }
      setSvcDrawer(false)
      loadServices()
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao salvar serviço', 'error')
    } finally {
      setSavingSvc(false)
    }
  }

  async function handleDeleteSvc() {
    if (!deleteSvc) return
    setDeletingSvc(true)
    try {
      await api.delete(`/service/${deleteSvc.UUID}`)
      addToast('Serviço excluído', 'success')
      setDeleteSvc(null)
      loadServices()
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao excluir serviço', 'error')
    } finally {
      setDeletingSvc(false)
    }
  }

  // ─── Profissionais do serviço — handlers ─────────────────────────────────

  async function openProfsDrawer(svc) {
    setProfsDrawer(svc)
    setSelectedProfId('')
    setLoadingProfs(true)
    try {
      const { data } = await api.get(`/service/${svc.UUID}/professionals`)
      setLinkedProfs(data.data ?? [])
    } catch {
      setLinkedProfs([])
    } finally {
      setLoadingProfs(false)
    }
  }

  async function handleLinkProf() {
    if (!selectedProfId) { addToast('Selecione uma profissional', 'warning'); return }
    setLinkingProf(true)
    try {
      await api.post(`/service/${profsDrawer.UUID}/professionals`, { professional_id: selectedProfId })
      addToast('Profissional vinculada', 'success')
      setSelectedProfId('')
      const { data } = await api.get(`/service/${profsDrawer.UUID}/professionals`)
      setLinkedProfs(data.data ?? [])
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao vincular profissional', 'error')
    } finally {
      setLinkingProf(false)
    }
  }

  async function handleUnlinkProf() {
    if (!unlinkProf) return
    setUnlinkingProf(true)
    try {
      await api.delete(`/service/professionals/${unlinkProf.linkId}`)
      addToast('Vínculo removido', 'success')
      setUnlinkProf(null)
      const { data } = await api.get(`/service/${profsDrawer.UUID}/professionals`)
      setLinkedProfs(data.data ?? [])
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao remover vínculo', 'error')
    } finally {
      setUnlinkingProf(false)
    }
  }

  // ─── Categoria — handlers ─────────────────────────────────────────────────

  function openCreateCat() {
    setCatForm(EMPTY_CATEGORY)
    setCatDrawer('create')
  }

  function openEditCat(cat) {
    setCatForm({ Name: cat.Name })
    setCatDrawer(cat.UUID)
  }

  async function handleSaveCat(e) {
    e.preventDefault()
    setSavingCat(true)
    try {
      if (catDrawer === 'create') {
        await api.post('/category', catForm)
        addToast('Categoria criada', 'success')
      } else {
        await api.patch(`/category/${catDrawer}`, catForm)
        addToast('Categoria atualizada', 'success')
      }
      setCatDrawer(false)
      loadCategories()
      loadServices()
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao salvar categoria', 'error')
    } finally {
      setSavingCat(false)
    }
  }

  async function handleDeleteCat() {
    if (!deleteCat) return
    setDeletingCat(true)
    try {
      await api.delete(`/category/${deleteCat.UUID}`)
      addToast('Categoria excluída', 'success')
      setDeleteCat(null)
      loadCategories()
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao excluir categoria', 'error')
    } finally {
      setDeletingCat(false)
    }
  }

  const sidebar = (
    <Sidebar navItems={navItems} footerUser={user?.name} footerRole="Admin">Admin</Sidebar>
  )

  return (
    <AppLayout sidebar={sidebar}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 mb-5 md:mb-6">
        <div>
          <h3 className="font-display font-medium text-[22px] md:text-[26px] tracking-tight">Serviços</h3>
          <p className="text-[12px] md:text-[13px] text-ink-3 mt-1">Gerencie os serviços e categorias do salão</p>
        </div>
        <Button size="sm" onClick={tab === 'servicos' ? openCreateSvc : openCreateCat}>
          <Icon name="plus" size={14} />
          {tab === 'servicos' ? 'Novo serviço' : 'Nova categoria'}
        </Button>
      </div>

      {/* Abas */}
      <div className="flex gap-1 mb-5 p-1 bg-surface-2 border border-line rounded-lg w-fit">
        {[['servicos', 'scissors', 'Serviços'], ['categorias', 'tag', 'Categorias']].map(([key, icon, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-[6px] text-[13px] font-medium transition-colors cursor-pointer
              ${tab === key ? 'bg-surface border border-line shadow-sm text-ink' : 'text-ink-3 hover:text-ink-2'}`}
          >
            <Icon name={icon} size={14} />{label}
          </button>
        ))}
      </div>

      {/* ── TAB SERVIÇOS ─────────────────────────────────────────────── */}
      {tab === 'servicos' && (
        loadingServices ? <PageSpinner /> : services.length === 0 ? (
          <EmptyState icon="scissors" title="Nenhum serviço" description="Crie o primeiro serviço do salão." action={openCreateSvc} actionLabel="Novo serviço" />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block bg-surface border border-line rounded-lg overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {['Serviço', 'Categoria', 'Duração', 'Preço', 'Comissão', 'Profissionais', ''].map((h) => (
                      <th key={h} className="px-3.5 py-3 text-left font-mono text-[10.5px] uppercase tracking-widest text-ink-3 border-b border-line-2">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {services.map((svc) => (
                    <tr key={svc.UUID} className="hover:bg-surface-2 transition-colors">
                      <td className="px-3.5 py-3 text-[13px] font-medium border-b border-line-2">{svc.Name}</td>
                      <td className="px-3.5 py-3 border-b border-line-2">
                        <span className="font-mono text-[10.5px] uppercase tracking-widest text-brand bg-brand-soft px-2 py-0.5 rounded">{svc.Category}</span>
                      </td>
                      <td className="px-3.5 py-3 font-mono text-[12px] text-ink-2 border-b border-line-2">{formatDuration(svc.Duration)}</td>
                      <td className="px-3.5 py-3 font-mono text-[12px] text-ink-2 border-b border-line-2">{formatPrice(svc.Price)}</td>
                      <td className="px-3.5 py-3 font-mono text-[12px] text-ink-2 border-b border-line-2">{svc.Commission}%</td>
                      <td className="px-3.5 py-3 border-b border-line-2">
                        <button onClick={() => openProfsDrawer(svc)} className="flex items-center gap-1.5 font-mono text-[11px] text-ink-3 hover:text-brand transition-colors cursor-pointer">
                          <Icon name="users" size={13} />Gerenciar
                        </button>
                      </td>
                      <td className="px-3.5 py-3 text-right border-b border-line-2">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => openEditSvc(svc)}><Icon name="edit" size={13} /></Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteSvc(svc)}><Icon name="trash" size={13} /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="flex flex-col gap-2 md:hidden">
              {services.map((svc) => (
                <div key={svc.UUID} className="bg-surface border border-line rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="font-medium text-[14px]">{svc.Name}</div>
                      <span className="font-mono text-[10px] uppercase tracking-widest text-brand bg-brand-soft px-2 py-0.5 rounded mt-1 inline-block">{svc.Category}</span>
                    </div>
                    <div className="font-display text-[16px] font-medium shrink-0">{formatPrice(svc.Price)}</div>
                  </div>
                  <div className="flex items-center gap-3 text-[12px] text-ink-3 mb-3">
                    <span>{formatDuration(svc.Duration)}</span>
                    <span>·</span>
                    <span>Comissão {svc.Commission}%</span>
                  </div>
                  <div className="flex items-center gap-2 pt-3 border-t border-line-2">
                    <button onClick={() => openProfsDrawer(svc)} className="flex items-center gap-1.5 font-mono text-[11px] text-ink-3 hover:text-brand transition-colors cursor-pointer flex-1">
                      <Icon name="users" size={13} />Profissionais
                    </button>
                    <Button variant="ghost" size="sm" onClick={() => openEditSvc(svc)}><Icon name="edit" size={13} /></Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteSvc(svc)}><Icon name="trash" size={13} /></Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )
      )}

      {/* ── TAB CATEGORIAS ───────────────────────────────────────────── */}
      {tab === 'categorias' && (
        loadingCats ? <PageSpinner /> : categories.length === 0 ? (
          <EmptyState icon="tag" title="Nenhuma categoria" description="Crie a primeira categoria." action={openCreateCat} actionLabel="Nova categoria" />
        ) : (
          <>
            <div className="hidden md:block bg-surface border border-line rounded-lg overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {['Categoria', ''].map((h) => (
                      <th key={h} className="px-3.5 py-3 text-left font-mono text-[10.5px] uppercase tracking-widest text-ink-3 border-b border-line-2">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat.UUID} className="hover:bg-surface-2 transition-colors">
                      <td className="px-3.5 py-3 text-[13px] font-medium border-b border-line-2">{cat.Name}</td>
                      <td className="px-3.5 py-3 text-right border-b border-line-2">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => openEditCat(cat)}>
                            <Icon name="edit" size={13} />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteCat(cat)}>
                            <Icon name="trash" size={13} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-2 md:hidden">
              {categories.map((cat) => (
                <div key={cat.UUID} className="bg-surface border border-line rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                  <div className="font-medium text-[14px]">{cat.Name}</div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => openEditCat(cat)}><Icon name="edit" size={13} /></Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteCat(cat)}><Icon name="trash" size={13} /></Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )
      )}

      {/* ── DRAWER — Serviço ─────────────────────────────────────────── */}
      {svcDrawer && (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-ink/30" onClick={() => setSvcDrawer(false)} />
          <div className="w-full md:w-[420px] bg-surface border-l border-line h-full overflow-y-auto p-5 md:p-7 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-display font-medium text-[20px] tracking-tight">
                {svcDrawer === 'create' ? 'Novo serviço' : 'Editar serviço'}
              </h4>
              <button onClick={() => setSvcDrawer(false)} className="text-ink-3 hover:text-ink cursor-pointer transition-colors">
                <Icon name="x" size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveSvc} className="flex flex-col gap-4 flex-1">
              <Field label="Nome do serviço">
                <input
                  required
                  value={svcForm.Name}
                  onChange={(e) => setSvcForm((f) => ({ ...f, Name: e.target.value }))}
                  placeholder="Ex: Corte feminino"
                  className={inputCls}
                />
              </Field>
              <Field label="Categoria">
                <select
                  required
                  value={svcForm.Category}
                  onChange={(e) => setSvcForm((f) => ({ ...f, Category: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">Selecione...</option>
                  {categories.map((c) => (
                    <option key={c.UUID} value={c.UUID}>{c.Name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Duração (HH:MM)">
                <input
                  required
                  type="time"
                  value={svcForm.Duration}
                  onChange={(e) => setSvcForm((f) => ({ ...f, Duration: e.target.value }))}
                  className={inputCls}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Preço (R$)">
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={svcForm.Price}
                    onChange={(e) => setSvcForm((f) => ({ ...f, Price: e.target.value }))}
                    placeholder="0,00"
                    className={inputCls}
                  />
                </Field>
                <Field label="Comissão (%)">
                  <input
                    required
                    type="number"
                    min="0"
                    max="100"
                    value={svcForm.Commission}
                    onChange={(e) => setSvcForm((f) => ({ ...f, Commission: e.target.value }))}
                    placeholder="0"
                    className={inputCls}
                  />
                </Field>
              </div>
              <div className="flex gap-2 mt-auto pt-4">
                <Button type="button" variant="ghost" className="flex-1 justify-center" onClick={() => setSvcDrawer(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" className="flex-1 justify-center" disabled={savingSvc}>
                  {savingSvc ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DRAWER — Categoria ───────────────────────────────────────── */}
      {catDrawer && (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-ink/30" onClick={() => setCatDrawer(false)} />
          <div className="w-full md:w-[360px] bg-surface border-l border-line h-full overflow-y-auto p-5 md:p-7 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-display font-medium text-[20px] tracking-tight">
                {catDrawer === 'create' ? 'Nova categoria' : 'Editar categoria'}
              </h4>
              <button onClick={() => setCatDrawer(false)} className="text-ink-3 hover:text-ink cursor-pointer transition-colors">
                <Icon name="x" size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveCat} className="flex flex-col gap-4 flex-1">
              <Field label="Nome da categoria">
                <input
                  required
                  value={catForm.Name}
                  onChange={(e) => setCatForm({ Name: e.target.value })}
                  placeholder="Ex: Cabelo"
                  className={inputCls}
                />
              </Field>
              <div className="flex gap-2 mt-auto pt-4">
                <Button type="button" variant="ghost" className="flex-1 justify-center" onClick={() => setCatDrawer(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" className="flex-1 justify-center" disabled={savingCat}>
                  {savingCat ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DRAWER — Profissionais do serviço ───────────────────────── */}
      {profsDrawer && (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-ink/30" onClick={() => setProfsDrawer(null)} />
          <div className="w-full md:w-[420px] bg-surface border-l border-line h-full overflow-y-auto p-5 md:p-7 flex flex-col">
            <div className="flex justify-between items-center mb-1">
              <h4 className="font-display font-medium text-[20px] tracking-tight">Profissionais</h4>
              <button onClick={() => setProfsDrawer(null)} className="text-ink-3 hover:text-ink cursor-pointer transition-colors">
                <Icon name="x" size={18} />
              </button>
            </div>
            <div className="font-mono text-[11px] text-ink-3 mb-6">{profsDrawer.Name}</div>

            {/* Lista vinculadas */}
            <div className="mb-5">
              {loadingProfs ? (
                <div className="text-[13px] text-ink-3">Carregando...</div>
              ) : linkedProfs.length === 0 ? (
                <div className="text-[13px] text-ink-3 italic">Nenhuma profissional vinculada</div>
              ) : linkedProfs.map((prof) => (
                <div key={prof.id} className="flex justify-between items-center py-2.5 border-b border-line-2 last:border-0">
                  <div>
                    <div className="text-[13px] font-medium">{prof.name}</div>
                    {prof.phone && <div className="font-mono text-[11px] text-ink-3">{prof.phone}</div>}
                  </div>
                  <button
                    onClick={() => setUnlinkProf({ linkId: prof.id, name: prof.name })}
                    className="text-ink-3 hover:text-danger transition-colors cursor-pointer p-1"
                  >
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Vincular nova */}
            <div className="border-t border-line pt-5 flex flex-col gap-3">
              <div className="font-mono text-[11px] uppercase tracking-widest text-ink-3">Vincular profissional</div>
              <Field label="Profissional">
                <select
                  value={selectedProfId}
                  onChange={(e) => setSelectedProfId(e.target.value)}
                  className={inputCls}
                >
                  <option value="">Selecione...</option>
                  {allProfessionals
                    .filter((p) => !linkedProfs.some((l) => l.professional_id === p.UUID))
                    .map((p) => (
                      <option key={p.UUID} value={p.UUID}>{p.Name}</option>
                    ))}
                </select>
              </Field>
              <Button variant="primary" className="w-full justify-center" onClick={handleLinkProf} disabled={linkingProf}>
                <Icon name="plus" size={14} />
                {linkingProf ? 'Vinculando...' : 'Vincular'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAIS DE CONFIRMAÇÃO ────────────────────────────────────── */}
      <Modal
        isOpen={!!unlinkProf}
        onClose={() => setUnlinkProf(null)}
        onConfirm={handleUnlinkProf}
        title="Remover vínculo"
        message={`"${unlinkProf?.name}" será desvinculada deste serviço.`}
        confirmLabel="Remover"
        loading={unlinkingProf}
      />
      <Modal
        isOpen={!!deleteSvc}
        onClose={() => setDeleteSvc(null)}
        onConfirm={handleDeleteSvc}
        title="Excluir serviço"
        message={`"${deleteSvc?.Name}" será removido permanentemente.`}
        confirmLabel="Excluir"
        loading={deletingSvc}
      />
      <Modal
        isOpen={!!deleteCat}
        onClose={() => setDeleteCat(null)}
        onConfirm={handleDeleteCat}
        title="Excluir categoria"
        message={`"${deleteCat?.Name}" será removida permanentemente.`}
        confirmLabel="Excluir"
        loading={deletingCat}
      />
    </AppLayout>
  )
}

const inputCls = `h-[42px] px-[14px] rounded-md border border-line bg-surface text-ink-2 font-body text-md
  placeholder:text-ink-4 focus:outline-none focus:border-brand transition-colors w-full`

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] text-ink-3 font-medium uppercase tracking-wider">{label}</label>
      {children}
    </div>
  )
}
