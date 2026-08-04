import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  COOKIE_DESAFIO,
  MAX_TENTATIVAS,
  bloquearAgora,
  idDaSessao,
  limparBloqueio,
  manterSomenteEstaSessao,
} from "@/lib/admin-login"

export const runtime = "nodejs"

/**
 * Etapa 2 do login do admin: confere o código que chegou por e-mail.
 *
 * Só roda se existir um desafio em aberto (cookie httpOnly criado na etapa 1),
 * ou seja: sem ter acertado a senha antes, não há o que verificar. É aqui que
 * a sessão do painel finalmente é criada, nos cookies.
 */
export async function POST(request: Request) {
  const jar = await cookies()
  const desafioId = jar.get(COOKIE_DESAFIO)?.value

  if (!desafioId) {
    return NextResponse.json(
      { error: "Sessão de verificação expirada. Faça o login de novo.", reiniciar: true },
      { status: 400 },
    )
  }

  let codigo = ""
  try {
    const body = await request.json()
    codigo = String(body?.code ?? "").replace(/\D/g, "")
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 })
  }

  if (!codigo) {
    return NextResponse.json({ error: "Digite o código recebido." }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: desafio } = await admin
    .from("admin_login_challenges")
    .select("id, email, otp_fails, expires_at, consumed_at")
    .eq("id", desafioId)
    .maybeSingle()

  const expirou = desafio && new Date(desafio.expires_at).getTime() <= Date.now()
  if (!desafio || desafio.consumed_at || expirou) {
    jar.delete(COOKIE_DESAFIO)
    return NextResponse.json(
      { error: "Código expirado. Faça o login de novo.", reiniciar: true },
      { status: 400 },
    )
  }

  // Confere o código no Supabase pelo client de sessão: se der certo, os
  // cookies do painel já saem gravados nesta resposta.
  const supabase = await createClient()
  const { data: sessaoNova, error: erroOtp } = await supabase.auth.verifyOtp({
    email: desafio.email,
    token: codigo,
    type: "email",
  })

  if (erroOtp) {
    const falhas = Number(desafio.otp_fails ?? 0) + 1
    const estourou = falhas >= MAX_TENTATIVAS

    await admin
      .from("admin_login_challenges")
      .update({
        otp_fails: falhas,
        // Estourou: queima o desafio para não dar para continuar chutando.
        consumed_at: estourou ? new Date().toISOString() : null,
      })
      .eq("id", desafio.id)

    if (estourou) {
      await bloquearAgora(desafio.email)
      jar.delete(COOKIE_DESAFIO)
      return NextResponse.json(
        {
          error: "Muitas tentativas. Acesso bloqueado por 15 minutos.",
          reiniciar: true,
        },
        { status: 429 },
      )
    }

    return NextResponse.json(
      { error: `Código inválido. Restam ${MAX_TENTATIVAS - falhas} tentativas.` },
      { status: 401 },
    )
  }

  await admin
    .from("admin_login_challenges")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", desafio.id)

  // Só a sessão recém-criada vale: derruba as anteriores. Assim, um token que
  // tenha vazado antes para de funcionar assim que o dono entra de novo.
  const token = sessaoNova?.session?.access_token
  const userId = sessaoNova?.user?.id
  const sessionId = token ? idDaSessao(token) : null
  if (userId && sessionId) {
    await manterSomenteEstaSessao(userId, sessionId)
  }

  await limparBloqueio(desafio.email)
  jar.delete(COOKIE_DESAFIO)

  return NextResponse.json({ ok: true })
}
