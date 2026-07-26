"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, Loader2, X, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Child, Household } from "@/lib/supabase/types"

const STATUS_LABEL: Record<Household["rsvp_status"], string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  declined: "Não vai",
}

const STATUS_CLASS: Record<Household["rsvp_status"], string> = {
  pending: "bg-muted text-muted-foreground",
  confirmed: "bg-primary/15 text-accent",
  declined: "bg-destructive/10 text-destructive",
}

const INPUT_CLASS =
  "w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"

/** Divide uma célula com nomes separados por vírgula / quebra de linha. */
function splitNames(value: string): string[] {
  return value
    .split(/[,\n;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

/** "Arthur Moreira (6 anos)" -> { name: "Arthur Moreira", age: 6 } */
function parseChild(entry: string): Child {
  const match = entry.match(/\((\d+)\s*anos?\)/i)
  const age = match ? parseInt(match[1], 10) : null
  const name = entry.replace(/\s*\(.*?\)\s*/g, " ").trim()
  return { name: name || entry.trim(), age }
}

function childrenToText(children: Child[]): string {
  return children.map((c) => (c.age != null ? `${c.name} (${c.age} anos)` : c.name)).join(", ")
}

interface FormState {
  host_name: string
  phone: string
  companions: string
  children: string
  max_seats: string
  paying_count: string
  rsvp_status: Household["rsvp_status"]
  confirmed_seats: string
}

const EMPTY_FORM: FormState = {
  host_name: "",
  phone: "",
  companions: "",
  children: "",
  max_seats: "",
  paying_count: "",
  rsvp_status: "pending",
  confirmed_seats: "",
}

function toForm(h: Household): FormState {
  return {
    host_name: h.host_name,
    phone: h.phone ?? "",
    companions: h.companions.join(", "),
    children: childrenToText(h.children),
    max_seats: String(h.max_seats),
    paying_count: h.paying_count != null ? String(h.paying_count) : "",
    rsvp_status: h.rsvp_status,
    confirmed_seats: h.confirmed_seats != null ? String(h.confirmed_seats) : "",
  }
}

export function HouseholdTable({ households }: { households: Household[] }) {
  const router = useRouter()
  const supabase = createClient()

  const [q, setQ] = useState("")
  const [filter, setFilter] = useState<"all" | Household["rsvp_status"]>("all")

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Household | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return households.filter((h) => {
      if (filter !== "all" && h.rsvp_status !== filter) return false
      if (!query) return true
      return h.host_name.toLowerCase().includes(query)
    })
  }, [households, q, filter])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function openCreate() {
    setError(null)
    setEditing(null)
    setForm(EMPTY_FORM)
    setOpen(true)
  }

  function openEdit(h: Household) {
    setError(null)
    setEditing(h)
    setForm(toForm(h))
    setOpen(true)
  }

  function closeForm() {
    if (saving) return
    setOpen(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const host_name = form.host_name.trim()
    if (!host_name) {
      setError("Informe o nome do anfitrião.")
      return
    }

    const companions = splitNames(form.companions)
    const children = splitNames(form.children).map(parseChild)

    // se não informado, estima pelo anfitrião + acompanhantes + crianças
    const maxSeats = form.max_seats
      ? Number(form.max_seats)
      : 1 + companions.length + children.length
    if (!Number.isFinite(maxSeats) || maxSeats < 1) {
      setError("O total de lugares precisa ser pelo menos 1.")
      return
    }

    // pendente = sem resposta; recusado = 0 lugares (mesma regra do fluxo público de RSVP)
    let confirmedSeats: number | null = null
    if (form.rsvp_status === "confirmed") {
      confirmedSeats = form.confirmed_seats ? Math.round(Number(form.confirmed_seats)) : 0
      if (!Number.isFinite(confirmedSeats) || confirmedSeats < 0 || confirmedSeats > maxSeats) {
        setError(`Os lugares confirmados devem ficar entre 0 e ${maxSeats}.`)
        return
      }
    } else if (form.rsvp_status === "declined") {
      confirmedSeats = 0
    }

    const statusChanged = editing?.rsvp_status !== form.rsvp_status
    const confirmedAt =
      form.rsvp_status === "pending"
        ? null
        : statusChanged
          ? new Date().toISOString()
          : (editing?.confirmed_at ?? new Date().toISOString())

    const payload = {
      host_name,
      phone: form.phone.trim() || null,
      companions,
      children,
      max_seats: Math.round(maxSeats),
      paying_count: form.paying_count ? Math.round(Number(form.paying_count)) : null,
      rsvp_status: form.rsvp_status,
      confirmed_seats: confirmedSeats,
      confirmed_at: confirmedAt,
    }

    setSaving(true)
    try {
      if (editing) {
        const { error: updErr } = await supabase
          .from("households")
          .update(payload)
          .eq("id", editing.id)
        if (updErr) throw updErr
      } else {
        const { error: insErr } = await supabase.from("households").insert(payload)
        if (insErr) throw insErr
      }
      setOpen(false)
      setEditing(null)
      setForm(EMPTY_FORM)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar o convidado.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(h: Household) {
    if (!window.confirm(`Remover "${h.host_name}" da lista de convidados?`)) return

    setError(null)
    setDeletingId(h.id)
    try {
      const { error: delErr } = await supabase.from("households").delete().eq("id", h.id)
      if (delErr) throw delErr
      if (editing?.id === h.id) closeForm()
      router.refresh()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Erro ao remover o convidado.")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="bg-card rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between border-b border-border">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar anfitrião..."
          className="px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-full sm:w-64"
        />
        <div className="flex flex-wrap items-center gap-1 text-sm">
          {(["all", "confirmed", "pending", "declined"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {f === "all" ? "Todos" : STATUS_LABEL[f]}
            </button>
          ))}
          <button
            onClick={openCreate}
            className="ml-1 inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Novo convidado
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground border-b border-border">
              <th className="px-4 py-3 font-medium">Anfitrião</th>
              <th className="px-4 py-3 font-medium">Telefone</th>
              <th className="px-4 py-3 font-medium text-center">Lugares</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((h) => (
              <tr key={h.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{h.host_name}</div>
                  {(h.companions.length > 0 || h.children.length > 0) && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {[
                        ...h.companions,
                        ...h.children.map((c) => `${c.name}${c.age != null ? ` (${c.age})` : ""}`),
                      ].join(", ")}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {h.phone ?? "—"}
                </td>
                <td className="px-4 py-3 text-center whitespace-nowrap">
                  <span className="text-foreground font-medium">
                    {h.rsvp_status === "confirmed" ? (h.confirmed_seats ?? 0) : "—"}
                  </span>
                  <span className="text-muted-foreground"> / {h.max_seats}</span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_CLASS[h.rsvp_status]}`}
                  >
                    {STATUS_LABEL[h.rsvp_status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end">
                    <button
                      onClick={() => openEdit(h)}
                      className="p-2 text-muted-foreground hover:text-primary transition-colors"
                      aria-label={`Editar ${h.host_name}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(h)}
                      disabled={deletingId === h.id}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                      aria-label={`Remover ${h.host_name}`}
                    >
                      {deletingId === h.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  Nenhum convidado encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Formulário (criar ou editar) */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-foreground/40 flex items-start sm:items-center justify-center p-4 overflow-y-auto"
          onClick={closeForm}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
            className="bg-card rounded-lg shadow-lg w-full max-w-lg my-8"
          >
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-medium text-foreground">
                {editing ? "Editar convidado" : "Novo convidado"}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm text-foreground mb-1">Anfitrião *</label>
                <input
                  value={form.host_name}
                  onChange={(e) => set("host_name", e.target.value)}
                  placeholder="Ex.: Maria Silva"
                  className={INPUT_CLASS}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm text-foreground mb-1">Telefone</label>
                <input
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="(00) 00000-0000"
                  className={INPUT_CLASS}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm text-foreground mb-1">
                  Acompanhantes (7+ anos)
                </label>
                <textarea
                  value={form.companions}
                  onChange={(e) => set("companions", e.target.value)}
                  rows={2}
                  placeholder="Separe por vírgula: João Silva, Ana Silva"
                  className={`${INPUT_CLASS} resize-y`}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm text-foreground mb-1">Crianças (0-6 anos)</label>
                <textarea
                  value={form.children}
                  onChange={(e) => set("children", e.target.value)}
                  rows={2}
                  placeholder="Separe por vírgula: Arthur (6 anos), Lia (3 anos)"
                  className={`${INPUT_CLASS} resize-y`}
                />
              </div>

              <div>
                <label className="block text-sm text-foreground mb-1">Total de lugares</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.max_seats}
                  onChange={(e) => set("max_seats", e.target.value)}
                  placeholder="Automático"
                  className={INPUT_CLASS}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Em branco = anfitrião + acompanhantes + crianças.
                </p>
              </div>

              <div>
                <label className="block text-sm text-foreground mb-1">Quant. pagantes</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.paying_count}
                  onChange={(e) => set("paying_count", e.target.value)}
                  placeholder="Opcional"
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className="block text-sm text-foreground mb-1">Status do RSVP</label>
                <select
                  value={form.rsvp_status}
                  onChange={(e) =>
                    set("rsvp_status", e.target.value as Household["rsvp_status"])
                  }
                  className={INPUT_CLASS}
                >
                  <option value="pending">Pendente</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="declined">Não vai</option>
                </select>
              </div>

              {form.rsvp_status === "confirmed" && (
                <div>
                  <label className="block text-sm text-foreground mb-1">Lugares confirmados</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.confirmed_seats}
                    onChange={(e) => set("confirmed_seats", e.target.value)}
                    placeholder="0"
                    className={INPUT_CLASS}
                  />
                </div>
              )}

              {error && <p className="sm:col-span-2 text-sm text-destructive">{error}</p>}
            </div>

            <div className="flex items-center gap-3 p-5 border-t border-border">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-md hover:bg-primary/90 transition-colors text-sm disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editing ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {saving ? "Salvando..." : editing ? "Salvar alterações" : "Adicionar convidado"}
              </button>
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-60"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
