import * as XLSX from "xlsx"
import type { Child } from "@/lib/supabase/types"

export interface ParsedHousehold {
  host_name: string
  phone: string | null
  companions: string[]
  children: Child[]
  max_seats: number
  paying_count: number | null
}

/** Divide uma célula com nomes separados por vírgula / quebra de linha. */
function splitNames(value: unknown): string[] {
  if (value == null) return []
  return String(value)
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

function toInt(value: unknown): number | null {
  if (value == null || value === "") return null
  const n = Number(value)
  return Number.isFinite(n) ? Math.round(n) : null
}

/**
 * Parseia a planilha "Modelo de lista de convidados" (aba Plan1).
 * Colunas: A=Anfitrião, B=Acompanhantes(7+), C=Crianças(0-6),
 * D=Fone, E=Quant. pagantes, F=Total lugares, G=RSVP.
 * Linhas 1-2 são cabeçalho/instruções — dados começam na linha 3.
 */
export function parseGuestWorkbook(buffer: ArrayBuffer): ParsedHousehold[] {
  const wb = XLSX.read(buffer, { type: "array" })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    blankrows: false,
    defval: null,
  })

  const result: ParsedHousehold[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const host = row?.[0] != null ? String(row[0]).trim() : ""

    // pula cabeçalho e instruções
    if (!host) continue
    const lower = host.toLowerCase()
    if (
      lower === "convidado" ||
      lower.startsWith("inserir nome do anfitri")
    ) {
      continue
    }

    const companions = splitNames(row[1])
    const children = splitNames(row[2]).map(parseChild)
    const phone = row[3] != null ? String(row[3]).trim() || null : null
    const paying = toInt(row[4])
    const totalSeats = toInt(row[5])

    // total de lugares = coluna F; se vazio, estima pelo anfitrião + acompanhantes + crianças
    const maxSeats =
      totalSeats && totalSeats > 0
        ? totalSeats
        : 1 + companions.length + children.length

    result.push({
      host_name: host,
      phone,
      companions,
      children,
      max_seats: maxSeats,
      paying_count: paying,
    })
  }

  return result
}
