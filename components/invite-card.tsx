import Image from "next/image"
import { Church, PartyPopper, Clock, MapPin, Calendar } from "lucide-react"
import { WEDDING } from "@/lib/event"

/**
 * Convite virtual reutilizando o design do site (fonte Great Vibes, paleta dourada).
 * `greeting` e `children` permitem personalizar (ex.: saudação da casa + bloco RSVP).
 */
export function InviteCard({
  greeting,
  children,
}: {
  greeting?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <main className="min-h-screen bg-secondary">
      {/* Cabeçalho com foto do casal */}
      <div className="relative h-[52vh] min-h-[360px] overflow-hidden">
        <Image
          src="/images/hero-wedding.png"
          alt={WEDDING.couple}
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-foreground/35" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center text-card px-4">
          <p className="text-xs md:text-sm tracking-[0.3em] uppercase mb-3">
            Com alegria, convidamos você
          </p>
          <h1 className="font-[family-name:var(--font-great-vibes)] text-6xl md:text-8xl mb-4">
            {WEDDING.couple}
          </h1>
          <div className="flex items-center justify-center gap-4">
            <span className="w-12 md:w-20 h-px bg-card/60" />
            <span className="text-base md:text-lg tracking-widest">{WEDDING.dateLabel}</span>
            <span className="w-12 md:w-20 h-px bg-card/60" />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-14 md:py-20">
        {greeting && <div className="text-center mb-10">{greeting}</div>}

        <p className="text-center text-foreground/80 text-lg leading-relaxed mb-12">
          Será uma honra celebrar ao seu lado o início da nossa história como marido e mulher.
          Confira os detalhes e não deixe de confirmar sua presença.
        </p>

        {/* Data */}
        <div className="bg-card rounded-lg shadow-sm p-6 md:p-8 mb-6 text-center">
          <Calendar className="w-6 h-6 text-primary mx-auto mb-3" />
          <p className="text-xl font-medium text-foreground">{WEDDING.dateLong}</p>
          <p className="text-muted-foreground">{WEDDING.time}</p>
        </div>

        {/* Cerimônia + Festa */}
        <div className="grid sm:grid-cols-2 gap-6 mb-12">
          <div className="bg-card rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-3">
              <Church className="w-5 h-5 text-primary" />
              <h3 className="font-medium text-foreground">Cerimônia</h3>
            </div>
            <p className="text-sm text-foreground/80 mb-1">{WEDDING.ceremony.name}</p>
            <p className="text-sm text-muted-foreground mb-3">{WEDDING.ceremony.address}</p>
            <a
              href={WEDDING.ceremony.maps}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80"
            >
              <MapPin className="w-4 h-4" /> Ver no mapa
            </a>
          </div>

          <div className="bg-card rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-3">
              <PartyPopper className="w-5 h-5 text-primary" />
              <h3 className="font-medium text-foreground">Festa</h3>
            </div>
            <p className="text-sm text-foreground/80 mb-1">{WEDDING.reception.name}</p>
            <p className="text-sm text-muted-foreground mb-3">{WEDDING.reception.address}</p>
            <a
              href={WEDDING.reception.maps}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80"
            >
              <MapPin className="w-4 h-4" /> Ver no mapa
            </a>
          </div>
        </div>

        {/* Slot de RSVP (ou CTA) */}
        {children}
      </div>

      <footer className="py-8 text-center text-sm text-muted-foreground">
        <Clock className="w-4 h-4 inline mr-1 -mt-0.5" />
        Confirme sua presença até 10 de setembro de 2026
      </footer>
    </main>
  )
}
