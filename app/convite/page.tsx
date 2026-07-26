import Link from "next/link"
import { Heart } from "lucide-react"
import { InviteCard } from "@/components/invite-card"

export default function ConvitePage() {
  return (
    <InviteCard>
      <div className="bg-card rounded-2xl shadow-sm border border-border p-8 md:p-10 text-center">
        <Heart className="w-6 h-6 text-primary mx-auto mb-4" />
        <h3 className="font-[family-name:var(--font-great-vibes)] text-3xl md:text-4xl text-primary mb-3">
          Confirme sua presença
        </h3>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Busque seu nome e nos diga quantas pessoas irão comparecer.
        </p>
        <Link
          href="/#confirmar-presenca"
          className="inline-flex items-center justify-center bg-primary text-primary-foreground px-10 py-4 rounded-md hover:bg-accent transition-colors text-sm tracking-[0.2em] uppercase"
        >
          Confirmar presença
        </Link>
      </div>
    </InviteCard>
  )
}
