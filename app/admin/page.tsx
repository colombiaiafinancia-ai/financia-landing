'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Power, PowerOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CodigoPromocionalDTO, CodigoPromoType } from '@/features/codigos-promocionales'

const EMPTY_FORM = {
  code: '',
  name: '',
  description: '',
  type: 'trial' as CodigoPromoType,
  trialDays: 30,
  discountValue: 10,
  discountLimited: false,
  discountMonths: 3,
  active: true,
}

export default function AdminPage() {
  const [codes, setCodes] = useState<CodigoPromocionalDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [submitting, setSubmitting] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)
  const [pageError, setPageError] = useState('')
  const [formError, setFormError] = useState('')

  async function fetchCodes() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/codigos')
      const data = await res.json()
      if (data.ok) setCodes(data.data)
      else setPageError(data.error)
    } catch {
      setPageError('Error cargando codigos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCodes() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)
    try {
      const payload = {
        ...form,
        discountMonths: form.type === 'percentage' && form.discountLimited ? form.discountMonths : null,
      }
      const res = await fetch('/api/admin/codigos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setFormError(data.error || 'Error creando codigo')
        return
      }
      setCodes((prev) => [data.data, ...prev])
      setCreateOpen(false)
      setForm({ ...EMPTY_FORM })
    } catch {
      setFormError('Error creando codigo')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggle(code: CodigoPromocionalDTO) {
    setActionId(code.id)
    try {
      const res = await fetch(`/api/admin/codigos/${code.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !code.active }),
      })
      const data = await res.json()
      if (data.ok) setCodes((prev) => prev.map((c) => (c.id === code.id ? data.data : c)))
    } finally {
      setActionId(null)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este codigo? Esta accion no se puede deshacer.')) return
    setActionId(id)
    try {
      const res = await fetch(`/api/admin/codigos/${id}`, { method: 'DELETE' })
      if (res.status === 204) {
        setCodes((prev) => prev.filter((c) => c.id !== id))
      } else {
        const data = await res.json()
        alert(data.error || 'Error eliminando codigo')
      }
    } finally {
      setActionId(null)
    }
  }

  function formatValue(code: CodigoPromocionalDTO) {
    if (code.type === 'trial') return `${code.trialDays} dias`
    const base = `${code.discountValue}%`
    return code.discountMonths ? `${base} × ${code.discountMonths} meses` : `${base} de por vida`
  }

  function formatType(type: CodigoPromoType) {
    return type === 'trial' ? 'Prueba gratis' : 'Porcentaje'
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-sm font-semibold text-foreground transition hover:bg-muted dark:border-white/15 dark:bg-white/[0.06] dark:text-slate-100 dark:hover:bg-white/[0.1]"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
            <div>
              <h1 className="font-sora text-xl font-bold text-foreground">Admin — Codigos Promocionales</h1>
              <p className="text-sm text-muted-foreground dark:text-white/60">Gestion de descuentos y meses gratis</p>
            </div>
          </div>
          <Button onClick={() => { setForm({ ...EMPTY_FORM }); setFormError(''); setCreateOpen(true) }}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Codigo
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {pageError && (
          <p className="mb-6 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {pageError}
          </p>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        ) : codes.length === 0 ? (
          <div className="rounded-lg border border-border bg-card px-6 py-12 text-center dark:border-white/15 dark:bg-[#0D1D35]">
            <p className="text-muted-foreground dark:text-white/60">No hay codigos creados todavia.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm dark:border-white/15 dark:bg-[#0D1D35]">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left dark:border-white/10">
                    <th className="px-4 py-3 font-semibold text-foreground">Codigo</th>
                    <th className="px-4 py-3 font-semibold text-foreground">Nombre</th>
                    <th className="px-4 py-3 font-semibold text-foreground">Tipo</th>
                    <th className="px-4 py-3 font-semibold text-foreground">Valor</th>
                    <th className="px-4 py-3 font-semibold text-foreground">Estado</th>
                    <th className="px-4 py-3 font-semibold text-foreground">Usos</th>
                    <th className="px-4 py-3 font-semibold text-foreground">Creado</th>
                    <th className="px-4 py-3 font-semibold text-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map((code) => (
                    <tr key={code.id} className="border-t border-border even:bg-muted/30 dark:border-white/10 dark:even:bg-white/[0.02]">
                      <td className="px-4 py-3 font-mono font-medium text-foreground">{code.code}</td>
                      <td className="px-4 py-3 text-muted-foreground dark:text-white/60">{code.name}</td>
                      <td className="px-4 py-3 text-muted-foreground dark:text-white/60">{formatType(code.type)}</td>
                      <td className="px-4 py-3 text-foreground">{formatValue(code)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          code.active
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-red-500/15 text-red-400'
                        }`}>
                          {code.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground dark:text-white/60">{code.redemptionsCount}</td>
                      <td className="px-4 py-3 text-muted-foreground dark:text-white/60">
                        {new Date(code.createdAt).toLocaleDateString('es-CO')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggle(code)}
                            disabled={actionId === code.id}
                            title={code.active ? 'Desactivar' : 'Activar'}
                            className="rounded p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50 dark:hover:bg-white/10"
                          >
                            {code.active
                              ? <PowerOff className="h-4 w-4" />
                              : <Power className="h-4 w-4 text-emerald-400" />
                            }
                          </button>
                          <button
                            onClick={() => handleDelete(code.id)}
                            disabled={actionId === code.id}
                            title="Eliminar"
                            className="rounded p-1.5 text-muted-foreground transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="border border-border bg-card dark:border-white/20 dark:bg-[#0D1D35]">
          <DialogHeader>
            <DialogTitle>Nuevo Codigo Promocional</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Codigo</Label>
              <Input
                id="code"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="ej. PROMO2026"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="ej. Descuento lanzamiento"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <select
                id="type"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as CodigoPromoType }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring dark:border-white/20 dark:bg-[#0D1D35] dark:text-white"
              >
                <option value="trial">Prueba gratis (dias)</option>
                <option value="percentage">Porcentaje de descuento</option>
              </select>
            </div>

            {form.type === 'trial' ? (
              <div className="space-y-2">
                <Label htmlFor="trialDays">Dias de prueba</Label>
                <Input
                  id="trialDays"
                  type="number"
                  min="1"
                  max="365"
                  value={form.trialDays}
                  onChange={(e) => setForm((f) => ({ ...f, trialDays: Number(e.target.value) }))}
                  required
                />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="discountValue">Porcentaje de descuento (%)</Label>
                  <Input
                    id="discountValue"
                    type="number"
                    min="1"
                    max="100"
                    value={form.discountValue}
                    onChange={(e) => setForm((f) => ({ ...f, discountValue: Number(e.target.value) }))}
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label>Duracion del descuento</Label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, discountLimited: false }))}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm transition ${!form.discountLimited ? 'border-primary bg-primary/10 text-primary dark:border-[#5ce1e6] dark:bg-[#5ce1e6]/15 dark:text-[#5ce1e6]' : 'border-border bg-muted/40 text-muted-foreground'}`}
                    >
                      De por vida
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, discountLimited: true }))}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm transition ${form.discountLimited ? 'border-primary bg-primary/10 text-primary dark:border-[#5ce1e6] dark:bg-[#5ce1e6]/15 dark:text-[#5ce1e6]' : 'border-border bg-muted/40 text-muted-foreground'}`}
                    >
                      Por tiempo limitado
                    </button>
                  </div>
                  {form.discountLimited && (
                    <div className="space-y-2">
                      <Label htmlFor="discountMonths">Numero de meses</Label>
                      <Input
                        id="discountMonths"
                        type="number"
                        min="1"
                        max="24"
                        value={form.discountMonths}
                        onChange={(e) => setForm((f) => ({ ...f, discountMonths: Number(e.target.value) }))}
                        required
                      />
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="flex items-center gap-3">
              <input
                id="active"
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="active" className="cursor-pointer">Activo al crear</Label>
            </div>

            {formError && (
              <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{formError}</p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Creando...' : 'Crear Codigo'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
