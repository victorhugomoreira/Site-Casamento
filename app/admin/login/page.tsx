"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Lock, MailCheck, ArrowLeft } from "lucide-react"

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get("next") || "/admin"

  /** "senha" = etapa 1; "codigo" = etapa 2 (verificação em duas etapas). */
  const [etapa, setEtapa] = useState<"senha" | "codigo">("senha")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [codigo, setCodigo] = useState("")
  const [error, setError] = useState<string | null>(
    // Chega assim quando o painel encerra a sessão por tempo (ou porque outro
    // login a derrubou), para não parecer que o site deslogou sozinho.
    params.get("expirada")
      ? "Sua sessão expirou por segurança. Entre novamente."
      : null,
  )
  const [loading, setLoading] = useState(false)

  function voltarParaSenha(mensagem?: string) {
    setEtapa("senha")
    setCodigo("")
    setPassword("")
    setError(mensagem ?? null)
  }

  async function enviarSenha(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/admin/login/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error ?? "Não foi possível entrar.")
        return
      }
      setEtapa("codigo")
      setPassword("")
    } catch {
      setError("Não foi possível conectar. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  async function enviarCodigo(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/admin/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codigo }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (data?.reiniciar) voltarParaSenha(data?.error)
        else setError(data?.error ?? "Código inválido.")
        return
      }
      router.replace(next)
      router.refresh()
    } catch {
      setError("Não foi possível conectar. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-secondary px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-[family-name:var(--font-great-vibes)] text-5xl text-primary mb-1">
            Bruna &amp; Victor Hugo
          </h1>
          <p className="text-muted-foreground tracking-wide text-sm">Área dos noivos</p>
        </div>

        {etapa === "senha" ? (
          <form
            onSubmit={enviarSenha}
            className="bg-card rounded-lg p-6 md:p-8 shadow-sm space-y-5"
          >
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                placeholder="voce@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Senha
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-3.5 rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 text-sm tracking-widest uppercase disabled:opacity-60"
            >
              <Lock className="w-4 h-4" />
              {loading ? "Verificando..." : "Continuar"}
            </button>
          </form>
        ) : (
          <form
            onSubmit={enviarCodigo}
            className="bg-card rounded-lg p-6 md:p-8 shadow-sm space-y-5"
          >
            <div className="flex flex-col items-center text-center gap-2">
              <MailCheck className="w-8 h-8 text-primary" />
              <p className="text-sm text-muted-foreground">
                Enviamos um código para <span className="text-foreground">{email}</span>.
                Ele vale por 10 minutos.
              </p>
            </div>

            <div>
              <label htmlFor="codigo" className="block text-sm font-medium text-foreground mb-2">
                Código de verificação
              </label>
              <input
                id="codigo"
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={8}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                className="w-full px-4 py-3 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-center text-2xl tracking-[0.4em]"
                placeholder="········"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={loading || codigo.length < 6}
              className="w-full bg-primary text-primary-foreground py-3.5 rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 text-sm tracking-widest uppercase disabled:opacity-60"
            >
              <Lock className="w-4 h-4" />
              {loading ? "Conferindo..." : "Entrar"}
            </button>

            <button
              type="button"
              onClick={() => voltarParaSenha()}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center justify-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              Usar outro e-mail
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
