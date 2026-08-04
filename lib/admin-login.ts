import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"

/** Quantos erros cada etapa aceita antes de travar. */
export const MAX_TENTATIVAS = 5
/** Por quanto tempo o e-mail fica bloqueado depois de estourar as tentativas. */
export const BLOQUEIO_MINUTOS = 15
/** Validade do desafio: tempo para digitar o código depois de acertar a senha. */
export const DESAFIO_MINUTOS = 10
/** Cookie httpOnly que liga a etapa 1 (senha) à etapa 2 (código). */
export const COOKIE_DESAFIO = "admin_2fa"

/** O e-mail é a chave do bloqueio — normaliza para "Joao@X" e "joao@x" contarem junto. */
export const normalizarEmail = (email: string) => email.trim().toLowerCase()

type Bloqueio = { bloqueado: boolean; liberaEm: Date | null; restantes: number }

/**
 * Situação atual do e-mail: bloqueado ou quantas tentativas de senha ainda tem.
 * Bloqueio vencido é tratado como liberado (a limpeza acontece no próximo erro).
 */
export async function consultarBloqueio(email: string): Promise<Bloqueio> {
  const admin = createAdminClient()
  const { data } = await admin
    .from("admin_login_lockouts")
    .select("password_fails, locked_until")
    .eq("email", normalizarEmail(email))
    .maybeSingle()

  if (!data) return { bloqueado: false, liberaEm: null, restantes: MAX_TENTATIVAS }

  const liberaEm = data.locked_until ? new Date(data.locked_until) : null
  if (liberaEm && liberaEm.getTime() > Date.now()) {
    return { bloqueado: true, liberaEm, restantes: 0 }
  }
  return {
    bloqueado: false,
    liberaEm: null,
    restantes: Math.max(0, MAX_TENTATIVAS - Number(data.password_fails ?? 0)),
  }
}

/**
 * Conta mais um erro de senha e bloqueia ao chegar no limite.
 * Devolve quantas tentativas sobraram (0 = acabou de bloquear).
 */
export async function registrarErroDeSenha(email: string): Promise<number> {
  const admin = createAdminClient()
  const chave = normalizarEmail(email)

  const { data: atual } = await admin
    .from("admin_login_lockouts")
    .select("password_fails, locked_until")
    .eq("email", chave)
    .maybeSingle()

  // Bloqueio já vencido zera a contagem — senão o próximo erro travaria na hora.
  const venceu =
    atual?.locked_until && new Date(atual.locked_until).getTime() <= Date.now()
  const anteriores = venceu ? 0 : Number(atual?.password_fails ?? 0)
  const falhas = anteriores + 1
  const estourou = falhas >= MAX_TENTATIVAS

  await admin.from("admin_login_lockouts").upsert(
    {
      email: chave,
      password_fails: estourou ? 0 : falhas,
      locked_until: estourou
        ? new Date(Date.now() + BLOQUEIO_MINUTOS * 60_000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "email" },
  )

  return estourou ? 0 : MAX_TENTATIVAS - falhas
}

/** Login completo: zera o histórico de erros daquele e-mail. */
export async function limparBloqueio(email: string) {
  const admin = createAdminClient()
  await admin
    .from("admin_login_lockouts")
    .upsert(
      {
        email: normalizarEmail(email),
        password_fails: 0,
        locked_until: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" },
    )
}

/** Trava o e-mail direto, sem passar pela contagem (usado quando o código estoura). */
export async function bloquearAgora(email: string) {
  const admin = createAdminClient()
  await admin.from("admin_login_lockouts").upsert(
    {
      email: normalizarEmail(email),
      password_fails: 0,
      locked_until: new Date(Date.now() + BLOQUEIO_MINUTOS * 60_000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "email" },
  )
}

/** Minutos que faltam para destravar — só para a mensagem na tela. */
export function minutosRestantes(liberaEm: Date) {
  return Math.max(1, Math.ceil((liberaEm.getTime() - Date.now()) / 60_000))
}
