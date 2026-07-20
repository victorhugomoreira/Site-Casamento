import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { PublicHousehold } from "@/lib/supabase/types"

export const runtime = "nodejs"

/**
 * Busca pública por nome. Passa pela service_role (RLS trancada) e devolve
 * apenas dados mínimos da casa — sem telefone e sem expor a lista inteira.
 */
export async function POST(request: Request) {
  let query = ""
  try {
    const body = await request.json()
    query = String(body?.query ?? "").trim()
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 })
  }

  if (query.length < 3) {
    return NextResponse.json(
      { error: "Digite pelo menos 3 letras do nome." },
      { status: 400 },
    )
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("households")
    .select("id, host_name, companions, children, max_seats, rsvp_status, confirmed_seats")
    .ilike("host_name", `%${query}%`)
    .order("host_name")
    .limit(10)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const results: PublicHousehold[] = (data ?? []) as PublicHousehold[]
  return NextResponse.json({ results })
}
