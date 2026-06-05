import { Heart } from "lucide-react"

export function Footer() {
  return (
    <footer className="py-12 bg-primary text-primary-foreground">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-[family-name:var(--font-great-vibes)] text-4xl md:text-5xl mb-4">
          Bruna & Victor Hugo
        </h2>
        
        <p className="text-primary-foreground/80 mb-6">
          10 de Outubro de 2026 | Campo Grande - MS
        </p>

        <div className="flex items-center justify-center gap-2 text-sm text-primary-foreground/60">
          <span>Feito com</span>
          <Heart className="w-4 h-4 fill-current" />
          <span>pelos noivos</span>
        </div>

        <div className="mt-8 pt-8 border-t border-primary-foreground/20">
          <p className="text-xs text-primary-foreground/50">
            #BrunaeVictor2026
          </p>
        </div>
      </div>
    </footer>
  )
}
