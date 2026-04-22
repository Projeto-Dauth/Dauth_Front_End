import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Sidebar from '@/components/layout/Sidebar'
import Button from '@/components/ui/Button'
import Icon from '@/components/ui/Icons'
import Modal from '@/components/ui/Modal'
import { PageSpinner } from '@/components/ui/Spinner'
import { useToast } from '@/context/ToastContext'
import useAuthStore from '@/store/authStore'
import api from '@/lib/api'

const navItems = [
  { to: '/profissional', end: true, icon: 'cal', label: 'Minha agenda' },
  { to: '/profissional/agendamentos', icon: 'receipt', label: 'Agendamentos' },
  { to: '/profissional/servicos', icon: 'scissors', label: 'Meus serviços' },
  { to: '/profissional/horarios', icon: 'clock', label: 'Meus horários' },
  { type: 'label', label: 'Conta' },
  { to: '/perfil', icon: 'users', label: 'Meu perfil' },
]

const DOW_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const DOW_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const EMPTY_FORM = { start_time: '09:00', end_time: '18:00' }

function inputCls(err) {
  return `w-full h-[42px] px-[14px] rounded-md border bg-surface text-ink-2 font-body text-md placeholder:text-ink-4 focus:outline-none focus:border-brand transition-colors ${err ? 'border-danger' : 'border-line'}`
}

export default function ProfissionalHorarios() {
  const { user } = useAuthStore()
  const { addToast } = useToast()

  const [workingHours, setWorkingHours] = useState([])
  const [loading, setLoading] = useState(true)

  // Drawer
  const [drawer, setDrawer] = useState(null) // { mode: 'add'|'edit', weekday, wh? }
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  // Modal de exclusão
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    load()
  }, [user?.id])

  function load() {
    setLoading(true)
    api.get(`/working-hours/professional/${user.id}`)
      .then(({ data }) => setWorkingHours(data.data ?? []))
      .catch(() => addToast('Erro ao carregar horários', 'error'))
      .finally(() => setLoading(false))
  }

  // Indexado por weekday para acesso O(1)
  const whByDay = Object.fromEntries(workingHours.map((w) => [w.Weekday, w]))

  function openAdd(weekday) {
    setForm(EMPTY_FORM)
    setErrors({})
    setDrawer({ mode: 'add', weekday })
  }

  function openEdit(wh) {
    setForm({
      start_time: wh.Start_time.slice(0, 5),
      end_time: wh.End_time.slice(0, 5),
    })
    setErrors({})
    setDrawer({ mode: 'edit', weekday: wh.Weekday, wh })
  }

  function validate() {
    const e = {}
    if (!form.start_time) e.start_time = 'Obrigatório'
    if (!form.end_time) e.end_time = 'Obrigatório'
    if (form.start_time && form.end_time && form.end_time <= form.start_time)
      e.end_time = 'Horário de fim deve ser após o início'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)
    try {
      if (drawer.mode === 'add') {
        await api.post('/working-hours', {
          professional_id: user.id,
          weekday: drawer.weekday,
          start_time: form.start_time,
          end_time: form.end_time,
        })
        addToast('Horário adicionado')
      } else {
        await api.patch(`/working-hours/${drawer.wh.UUID}`, {
          start_time: form.start_time,
          end_time: form.end_time,
        })
        addToast('Horário atualizado')
      }
      setDrawer(null)
      load()
    } catch (err) {
      addToast(err.response?.data?.error ?? 'Erro ao salvar horário', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/working-hours/${deleteTarget.UUID}`)
      addToast('Horário removido')
      setDeleteTarget(null)
      load()
    } catch (err) {
      addToast(err.response?.data?.error ?? 'Erro ao remover horário', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const sidebar = (
    <Sidebar navItems={navItems} footerUser={user?.name} footerRole="Profissional" />
  )

  if (loading) return <AppLayout sidebar={sidebar}><PageSpinner /></AppLayout>

  return (
    <AppLayout sidebar={sidebar}>
      <div className="flex justify-between items-end mb-7">
        <div>
          <h3 className="font-display font-medium text-[26px] tracking-tight">Meus horários</h3>
          <p className="text-[13px] text-ink-3 mt-1">
            {workingHours.length} dia{workingHours.length !== 1 ? 's' : ''} configurado{workingHours.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Grade dos 7 dias */}
      <div className="grid gap-3">
        {DOW_LABELS.map((label, idx) => {
          const wh = whByDay[idx]
          return (
            <div
              key={idx}
              className="flex items-center gap-5 p-5 bg-surface border border-line rounded-xl"
            >
              {/* Dia */}
              <div className="w-28 shrink-0">
                <div className="font-display font-medium text-[15px]">{label}</div>
                <div className="font-mono text-[10.5px] text-ink-4 uppercase tracking-widest">{DOW_SHORT[idx]}</div>
              </div>

              {/* Status */}
              {wh ? (
                <>
                  <div className="flex-1 flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-success shrink-0" />
                    <span className="font-mono text-[13.5px] text-ink-2 font-medium">
                      {wh.Start_time.slice(0, 5)} – {wh.End_time.slice(0, 5)}
                    </span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => openEdit(wh)}
                      className="p-2 rounded-lg border border-line hover:border-brand hover:text-brand transition-colors text-ink-3"
                    >
                      <Icon name="edit" size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(wh)}
                      className="p-2 rounded-lg border border-line hover:border-danger hover:text-danger transition-colors text-ink-3"
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex-1 flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-line shrink-0" />
                    <span className="text-[13px] text-ink-4">Folga</span>
                  </div>
                  <button
                    onClick={() => openAdd(idx)}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-[12.5px] text-ink-3 hover:border-brand hover:text-brand transition-colors"
                  >
                    <Icon name="plus" size={12} />Adicionar
                  </button>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Drawer */}
      {drawer && (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-black/30" onClick={() => !saving && setDrawer(null)} />
          <div className="w-80 bg-surface border-l border-line h-full flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-line">
              <h4 className="font-display font-medium text-[17px]">
                {drawer.mode === 'add' ? 'Adicionar horário' : 'Editar horário'}
              </h4>
              <button onClick={() => setDrawer(null)} className="text-ink-3 hover:text-ink transition-colors">
                <Icon name="x" size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4">
              <div>
                <p className="text-[13px] font-medium text-ink-2 mb-3">
                  {DOW_LABELS[drawer.weekday]}
                </p>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-ink-3 mb-1.5">Início</label>
                <input
                  type="time"
                  className={inputCls(errors.start_time)}
                  value={form.start_time}
                  onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
                />
                {errors.start_time && <p className="text-[11px] text-danger mt-1">{errors.start_time}</p>}
              </div>

              <div>
                <label className="block text-[12px] font-medium text-ink-3 mb-1.5">Fim</label>
                <input
                  type="time"
                  className={inputCls(errors.end_time)}
                  value={form.end_time}
                  onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
                />
                {errors.end_time && <p className="text-[11px] text-danger mt-1">{errors.end_time}</p>}
              </div>
            </div>

            <div className="px-6 py-5 border-t border-line flex gap-2.5">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button variant="ghost" onClick={() => setDrawer(null)} disabled={saving}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remover horário"
        message={`Remover horário de ${deleteTarget ? DOW_LABELS[deleteTarget.Weekday] : ''}? Os agendamentos existentes não serão afetados.`}
        confirmLabel="Remover"
        loading={deleting}
      />
    </AppLayout>
  )
}
