import { Heart } from "lucide-react"
import { WEDDING } from "@/lib/event"

export function Footer() {
  return (
    <footer className="py-12 bg-primary text-primary-foreground">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-[family-name:var(--font-great-vibes)] text-4xl md:text-5xl mb-4">
          {WEDDING.couple}
        </h2>

        <p className="text-primary-foreground/80 mb-6">
          {WEDDING.dateShort} | {WEDDING.city}
        </p>

        <div className="flex items-center justify-center gap-2 text-sm text-primary-foreground/60">
          <span>Feito com</span>
          <Heart className="w-4 h-4 fill-current" />
          <span>pelos noivos</span>
        </div>

        <div className="mt-8 pt-8 border-t border-primary-foreground/20">
          <p className="text-xs text-primary-foreground/50">{WEDDING.hashtag}</p>
        </div>
      </div>
    </footer>
  )
}
