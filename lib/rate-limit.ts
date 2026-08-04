import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * IP de quem chamou. Atrás da Vercel o IP do socket é o do proxy, então o que
 * vale é o primeiro endereço do `x-forwarded-for` (a cadeia é
 * "cliente, proxy1, proxy2...").
 */
export function ipDeQuemChamou(request: Request) {
  const encaminhado = request.headers.get("x-forwarded-for")
  if (encaminhado) return encaminhado.split(",")[0].trim()
  return request.headers.get("x-real-ip") ?? "desconhecido"
}

/**
 * Conta a chamada e devolve `true` se ela pode passar.
 *
 * Se o banco falhar, deixa passar de propósito: um contador com problema não
 * pode derrubar a confirmação de presença no dia do casamento. O limite existe
 * para conter abuso, não é a defesa principal — quem garante que ninguém rouba
 * dinheiro é o preço vir do banco e o webhook conferir a assinatura.
 */
export async function dentroDoLimite(
  balde: string,
  limite: number,
  janelaSegundos: number,
) {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.rpc("rate_limit_hit", {
      p_bucket: balde,
      p_limit: limite,
      p_window_seconds: janelaSegundos,
    })
    if (error) return true
    return data !== false
  } catch {
    return true
  }
}
