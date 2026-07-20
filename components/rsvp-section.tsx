"use client"

import { useState } from "react"
import { Search, ArrowLeft } from "lucide-react"
import type { PublicHousehold } from "@/lib/supabase/types"
import { RsvpConfirmForm } from "@/components/rsvp-confirm-form"

export function RSVPSection() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<PublicHousehold[] | null>(null)
  const [selected, setSelected] = useState<PublicHousehold | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function search(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResults(null)
    try {
      const res = await fetch("/api/rsvp/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Não foi possível buscar.")
        return
      }
      setResults(data.results)
    } catch {
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="confirmar-presenca" className="py-20 md:py-32 bg-secondary">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-[family-name:var(--font-great-vibes)] text-5xl md:text-6xl text-primary mb-4">
            Confirmar Presença
          </h2>
          <p className="text-muted-foreground tracking-wide">
            Por favor, confirme sua presença até 10 de setembro de 2026
          </p>
        </div>

        {selected ? (
          <div className="space-y-4">
            <button
              onClick={() => setSelected(null)}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" /> Buscar outro nome
            </button>
            <RsvpConfirmForm household={selected} />
          </div>
        ) : (
          <>
            <form onSubmit={search} className="bg-card rounded-lg p-6 md:p-8 shadow-sm">
              <label htmlFor="rsvp-search" className="block text-sm font-medium text-foreground mb-2">
                Digite o nome do convidado principal (anfitrião do convite)
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  id="rsvp-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 px-4 py-3 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                  placeholder="Ex.: Maria Silva"
                />
                <button
                  type="submit"
                  disabled={loading || query.trim().length < 3}
                  className="bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 text-sm tracking-widest uppercase disabled:opacity-60"
                >
                  <Search className="w-4 h-4" />
                  {loading ? "Buscando..." : "Buscar"}
                </button>
              </div>
              {error && <p className="text-sm text-destructive mt-3">{error}</p>}
            </form>

            {results && (
              <div className="mt-6 space-y-2">
                {results.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6">
                    Nenhum convite encontrado com esse nome. Confira a grafia ou fale com os noivos.
                  </p>
                ) : (
                  results.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => setSelected(h)}
                      className="w-full text-left bg-card rounded-lg p-4 shadow-sm hover:ring-2 hover:ring-primary/40 transition-all flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-foreground">{h.host_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {h.max_seats} {h.max_seats === 1 ? "lugar" : "lugares"} ·{" "}
                          {h.rsvp_status === "confirmed"
                            ? "confirmado"
                            : h.rsvp_status === "declined"
                              ? "recusado"
                              : "pendente"}
                        </p>
                      </div>
                      <span className="text-sm text-primary">Selecionar →</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
