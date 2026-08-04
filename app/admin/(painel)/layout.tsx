import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { LogoutButton } from "@/components/admin/logout-button"
import { AdminNav } from "@/components/admin/admin-nav"
import { createClient } from "@/lib/supabase/server"
import { idDaSessao, sessaoVencida } from "@/lib/admin-login"

export const dynamic = "force-dynamic"

export default async function PainelLayout({ children }: { children: ReactNode }) {
  // O proxy.ts já barrou quem não está logado. Falta o degrau de cima:
  // estar logado não é ser admin. Sem isto, qualquer conta do projeto abriria
  // o painel (as tabelas voltariam vazias pela RLS, mas a casca carregava).
  const supabase = await createClient()
  const { data: ehAdmin } = await supabase.rpc("is_admin")
  if (!ehAdmin) redirect("/admin/login")

  // Validade da sessão: 5 horas depois do login, entra de novo. Vale também
  // para sessão derrubada por outro login — nesse caso ela nem existe mais.
  // Limita a janela de uso de um token que tenha vazado.
  const { data: sessaoAtual } = await supabase.auth.getSession()
  const token = sessaoAtual?.session?.access_token
  const sessionId = token ? idDaSessao(token) : null
  if (sessionId && (await sessaoVencida(sessionId))) {
    await supabase.auth.signOut()
    redirect("/admin/login?expirada=1")
  }

  return (
    <main className="min-h-screen bg-secondary">
      <header className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-baseline gap-3">
              <span className="font-[family-name:var(--font-great-vibes)] text-3xl text-primary">
                B &amp; V
              </span>
              <span className="text-sm text-muted-foreground">Painel dos noivos</span>
            </div>
            <LogoutButton />
          </div>
          <div className="pb-3">
            <AdminNav />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {children}
      </div>
    </main>
  )
}
