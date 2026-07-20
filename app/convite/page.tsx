import Link from "next/link"
import { Heart } from "lucide-react"
import { InviteCard } from "@/components/invite-card"

export default function ConvitePage() {
  return (
    <InviteCard>
      <div className="bg-card rounded-lg shadow-sm p-8 text-center">
        <Heart className="w-6 h-6 text-primary mx-auto mb-3" />
        <h3 className="text-xl font-medium text-foreground mb-2">Confirme sua presença</h3>
        <p className="text-muted-foreground mb-6">
          Busque seu nome e confirme quantas pessoas irão comparecer.
        </p>
        <Link
          href="/#confirmar-presenca"
          className="inline-flex items-center justify-center bg-primary text-primary-foreground px-8 py-3.5 rounded-md hover:bg-primary/90 transition-colors text-sm tracking-widest uppercase"
        >
          Confirmar presença
        </Link>
      </div>
    </InviteCard>
  )
}
