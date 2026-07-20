"use client"

import { useMemo, useState } from "react"
import type { Household } from "@/lib/supabase/types"
import { CopyLinkButton } from "./copy-link-button"

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

export function HouseholdTable({ households }: { households: Household[] }) {
  const [q, setQ] = useState("")
  const [filter, setFilter] = useState<"all" | Household["rsvp_status"]>("all")

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return households.filter((h) => {
      if (filter !== "all" && h.rsvp_status !== filter) return false
      if (!query) return true
      return h.host_name.toLowerCase().includes(query)
    })
  }, [households, q, filter])

  return (
    <div className="bg-card rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between border-b border-border">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar anfitrião..."
          className="px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-full sm:w-64"
        />
        <div className="flex gap-1 text-sm">
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
              <th className="px-4 py-3 font-medium">Link do convite</th>
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
                  <CopyLinkButton path={`/convite/${h.invite_token}`} label="Copiar" />
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
    </div>
  )
}
