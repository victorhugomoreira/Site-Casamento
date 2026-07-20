import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { parseGuestWorkbook } from "@/lib/guest-import"

export const runtime = "nodejs"

function normalize(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ")
}

export async function POST(request: Request) {
  // 1) Exige admin autenticado
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
  }

  // 2) Lê o arquivo enviado
  const formData = await request.formData()
  const file = formData.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Envie um arquivo .xlsx." }, { status: 400 })
  }

  let parsed
  try {
    const buffer = await file.arrayBuffer()
    parsed = parseGuestWorkbook(buffer)
  } catch {
    return NextResponse.json(
      { error: "Não consegui ler a planilha. Confira se é o modelo correto." },
      { status: 400 },
    )
  }

  if (parsed.length === 0) {
    return NextResponse.json(
      { error: "Nenhum convidado encontrado na planilha." },
      { status: 400 },
    )
  }

  // 3) Upsert por nome do anfitrião (preserva RSVP já respondido)
  const admin = createAdminClient()
  const { data: existing, error: fetchErr } = await admin
    .from("households")
    .select("id, host_name")

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  }

  const byName = new Map<string, string>()
  for (const h of existing ?? []) byName.set(normalize(h.host_name), h.id)

  const toInsert: Record<string, unknown>[] = []
  let updated = 0

  for (const h of parsed) {
    const id = byName.get(normalize(h.host_name))
    if (id) {
      // Atualiza dados da casa mas NÃO mexe no RSVP já registrado
      const { error } = await admin
        .from("households")
        .update({
          phone: h.phone,
          companions: h.companions,
          children: h.children,
          max_seats: h.max_seats,
          paying_count: h.paying_count,
        })
        .eq("id", id)
      if (!error) updated++
    } else {
      toInsert.push(h)
    }
  }

  let inserted = 0
  if (toInsert.length > 0) {
    const { data, error } = await admin
      .from("households")
      .insert(toInsert)
      .select("id")
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    inserted = data?.length ?? 0
  }

  return NextResponse.json({ inserted, updated, total: parsed.length })
}
