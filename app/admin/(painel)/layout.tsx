import type { ReactNode } from "react"
import { LogoutButton } from "@/components/admin/logout-button"
import { AdminNav } from "@/components/admin/admin-nav"

export const dynamic = "force-dynamic"

export default function PainelLayout({ children }: { children: ReactNode }) {
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
