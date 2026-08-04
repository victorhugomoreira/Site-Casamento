import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { dentroDoLimite, ipDeQuemChamou } from "@/lib/rate-limit"

export const runtime = "nodejs"

/**
 * Confirmações por IP a cada 10 min. Uma casa confirma uma vez e às vezes
 * corrige — 15 cobre a família inteira mexendo do mesmo wi-fi.
 */
const LIMITE = 15
const JANELA_SEGUNDOS = 600

/**
 * Confirma (ou recusa) presença de uma casa. Aceita householdId OU token.
 * Valida no servidor que confirmed_seats está entre 0 e max_seats.
 * Idempotente — a casa pode reconfirmar/alterar depois.
 */
export async function POST(request: Request) {
  const ip = ipDeQuemChamou(request)
  if (!(await dentroDoLimite(`rsvp-confirma:${ip}`, LIMITE, JANELA_SEGUNDOS))) {
    return NextResponse.json(
      { error: "Muitas confirmações seguidas. Aguarde alguns minutos." },
      { status: 429 },
    )
  }

  let body: {
    householdId?: string
    token?: string
    attending?: boolean
    confirmedSeats?: number
    responderName?: string
    message?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 })
  }

  const { householdId, token, attending, responderName, message } = body

  if (!householdId && !token) {
    return NextResponse.json({ error: "Convite não identificado." }, { status: 400 })
  }
  if (typeof attending !== "boolean") {
    return NextResponse.json({ error: "Informe se vai comparecer." }, { status: 400 })
  }

  const admin = createAdminClient()

  const query = admin.from("households").select("id, max_seats")
  const { data: household, error: findErr } = householdId
    ? await query.eq("id", householdId).maybeSingle()
    : await query.eq("invite_token", token!).maybeSingle()

  if (findErr) {
    return NextResponse.json({ error: findErr.message }, { status: 500 })
  }
  if (!household) {
    return NextResponse.json({ error: "Convite não encontrado." }, { status: 404 })
  }

  let confirmedSeats = 0
  if (attending) {
    confirmedSeats = Math.round(Number(body.confirmedSeats ?? 0))
    if (!Number.isFinite(confirmedSeats) || confirmedSeats < 1) {
      return NextResponse.json(
        { error: "Informe quantas pessoas vão comparecer." },
        { status: 400 },
      )
    }
    if (confirmedSeats > household.max_seats) {
      return NextResponse.json(
        {
          error: `Este convite permite no máximo ${household.max_seats} ${
            household.max_seats === 1 ? "lugar" : "lugares"
          }.`,
        },
        { status: 400 },
      )
    }
  }

  const { error: updErr } = await admin
    .from("households")
    .update({
      rsvp_status: attending ? "confirmed" : "declined",
      confirmed_seats: attending ? confirmedSeats : 0,
      responder_name: responderName?.trim() || null,
      rsvp_message: message?.trim() || null,
      confirmed_at: new Date().toISOString(),
    })
    .eq("id", household.id)

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, attending, confirmedSeats })
}
