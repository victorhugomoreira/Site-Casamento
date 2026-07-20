"use client"

import { useState } from "react"
import { CheckCircle, Send } from "lucide-react"
import type { PublicHousehold } from "@/lib/supabase/types"

interface Props {
  household: PublicHousehold
  /** Quando presente, confirma pelo token (convite personalizado). */
  token?: string
}

export function RsvpConfirmForm({ household, token }: Props) {
  const alreadyAnswered = household.rsvp_status !== "pending"
  const [attending, setAttending] = useState(household.rsvp_status !== "declined")
  const [seats, setSeats] = useState(
    household.confirmed_seats && household.confirmed_seats > 0
      ? household.confirmed_seats
      : household.max_seats,
  )
  const [responderName, setResponderName] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<null | { attending: boolean }>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/rsvp/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          householdId: token ? undefined : household.id,
          token,
          attending,
          confirmedSeats: attending ? seats : 0,
          responderName,
          message,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Não foi possível registrar.")
        return
      }
      setDone({ attending })
    } catch {
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="bg-card rounded-lg p-8 shadow-sm text-center">
        <CheckCircle className="w-14 h-14 text-primary mx-auto mb-4" />
        <h3 className="font-[family-name:var(--font-great-vibes)] text-4xl text-primary mb-2">
          {done.attending ? "Presença confirmada!" : "Que pena!"}
        </h3>
        <p className="text-foreground/80">
          {done.attending
            ? "Obrigado! Estamos ansiosos para celebrar com você."
            : "Sentiremos sua falta. Obrigado por avisar!"}
        </p>
      </div>
    )
  }

  const seatOptions = Array.from({ length: household.max_seats }, (_, i) => i + 1)

  return (
    <form onSubmit={submit} className="bg-card rounded-lg p-6 md:p-8 shadow-sm space-y-6">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Convite de</p>
        <p className="text-lg font-medium text-foreground">{household.host_name}</p>
        <p className="text-sm text-muted-foreground mt-1">
          Lugares reservados: <span className="text-foreground font-medium">{household.max_seats}</span>
        </p>
        {alreadyAnswered && (
          <p className="text-xs text-accent mt-2">
            Você já respondeu — pode atualizar sua resposta abaixo.
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Você irá comparecer?</label>
        <div className="flex flex-col sm:flex-row gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="attending"
              checked={attending}
              onChange={() => setAttending(true)}
              className="w-4 h-4"
            />
            <span className="text-foreground">Sim, estarei presente</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="attending"
              checked={!attending}
              onChange={() => setAttending(false)}
              className="w-4 h-4"
            />
            <span className="text-foreground">Não poderei ir</span>
          </label>
        </div>
      </div>

      {attending && (
        <div>
          <label htmlFor="seats" className="block text-sm font-medium text-foreground mb-2">
            Quantas pessoas vão comparecer?
          </label>
          <select
            id="seats"
            value={seats}
            onChange={(e) => setSeats(Number(e.target.value))}
            className="w-full px-4 py-3 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
          >
            {seatOptions.map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "pessoa" : "pessoas"}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            Máximo de {household.max_seats} conforme seu convite.
          </p>
        </div>
      )}

      <div>
        <label htmlFor="responder" className="block text-sm font-medium text-foreground mb-2">
          Seu nome
        </label>
        <input
          id="responder"
          value={responderName}
          onChange={(e) => setResponderName(e.target.value)}
          className="w-full px-4 py-3 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
          placeholder="Quem está confirmando"
        />
      </div>

      <div>
        <label htmlFor="msg" className="block text-sm font-medium text-foreground mb-2">
          Mensagem para os noivos (opcional)
        </label>
        <textarea
          id="msg"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full px-4 py-3 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground resize-none"
          placeholder="Deixe uma mensagem especial..."
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-primary-foreground py-4 rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 text-sm tracking-widest uppercase disabled:opacity-60"
      >
        <Send className="w-4 h-4" />
        {loading ? "Enviando..." : "Confirmar"}
      </button>
    </form>
  )
}
