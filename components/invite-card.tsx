import Image from "next/image"
import { Church, PartyPopper, MapPin, Calendar, Clock, ChevronDown } from "lucide-react"
import { Reveal } from "@/components/ui/reveal"
import { Ornament } from "@/components/ui/ornament"
import { Countdown } from "@/components/countdown"
import { WEDDING } from "@/lib/event"

/**
 * Convite virtual em rolagem.
 *
 * A foto do casal fica fixa no fundo e o conteúdo desliza por cima dela, com
 * cada bloco surgindo em fade conforme entra na tela. Reaproveita a paleta e a
 * fonte Great Vibes do site.
 *
 * `greeting` e `children` permitem personalizar (saudação da casa + bloco RSVP).
 */
export function InviteCard({
  greeting,
  children,
}: {
  greeting?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <main>
      {/*
        Foto fixa: o conteúdo rola por cima dela.
        Fica em z-0 (e não em z negativo) porque o body tem fundo opaco — com
        z-index negativo a foto seria pintada atrás dele e sumiria.
      */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/images/hero.webp"
          alt={WEDDING.couple}
          fill
          sizes="100vw"
          priority
          fetchPriority="high"
          className="object-cover object-[50%_25%]"
        />
        <div className="absolute inset-0 bg-foreground/45" />
      </div>

      {/* ---------- Abertura em tela cheia (deixa a foto aparecer) ---------- */}
      <section className="relative z-10 h-[100svh] flex flex-col items-center justify-center text-center text-card px-6">
        <Reveal>
          <p className="text-[0.7rem] md:text-sm tracking-[0.35em] uppercase mb-6 text-card/80">
            Com alegria, convidamos você
          </p>
          <h1 className="font-[family-name:var(--font-great-vibes)] text-6xl md:text-8xl lg:text-9xl mb-6 text-balance">
            {WEDDING.couple}
          </h1>
          <Ornament tone="light" className="mb-6" />
          <p className="text-base md:text-xl tracking-[0.3em]">{WEDDING.dateLabel}</p>
        </Reveal>

        {/* Convite a rolar */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-card/70">
          <span className="text-[0.6rem] tracking-[0.25em] uppercase">Role para ver</span>
          <ChevronDown className="w-5 h-5 animate-bounce motion-reduce:animate-none" />
        </div>
      </section>

      {/* ---------- Conteúdo que desliza sobre a foto ---------- */}
      <div className="relative z-10 bg-background rounded-t-[2.5rem] md:rounded-t-[4rem] shadow-[0_-20px_60px_rgba(0,0,0,0.25)]">
        <div className="max-w-2xl mx-auto px-6 sm:px-8 py-16 md:py-24 space-y-20 md:space-y-28">
          {/* Saudação personalizada (convite por link) */}
          {greeting && (
            <Reveal className="text-center">{greeting}</Reveal>
          )}

          {/* Texto do convite */}
          <Reveal as="section" className="text-center">
            <Ornament className="mb-8" />
            <p className="text-foreground/80 text-lg md:text-xl leading-relaxed">
              Será uma honra celebrar ao seu lado o início da nossa história como marido e mulher.
            </p>
            <p className="text-muted-foreground mt-4 leading-relaxed">
              Confira os detalhes abaixo e não deixe de confirmar sua presença.
            </p>
          </Reveal>

          {/* Contagem regressiva */}
          <Reveal as="section" className="text-center">
            <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-6">
              Faltam
            </p>
            <Countdown />
          </Reveal>

          {/* Data */}
          <Reveal as="section">
            <div className="bg-card rounded-2xl shadow-sm border border-border p-8 md:p-10 text-center">
              <Calendar className="w-6 h-6 text-primary mx-auto mb-4" />
              <p className="font-[family-name:var(--font-great-vibes)] text-4xl md:text-5xl text-primary mb-3">
                {WEDDING.dateShort}
              </p>
              <p className="inline-flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4 text-primary/70" />
                {WEDDING.time}
              </p>
            </div>
          </Reveal>

          {/* Cerimônia e Festa */}
          <section className="space-y-6">
            <Reveal className="text-center">
              <h2 className="font-[family-name:var(--font-great-vibes)] text-4xl md:text-5xl text-primary">
                Onde
              </h2>
            </Reveal>

            {[
              { icon: Church, titulo: "Cerimônia", local: WEDDING.ceremony },
              { icon: PartyPopper, titulo: "Festa", local: WEDDING.reception },
            ].map(({ icon: Icone, titulo, local }, i) => (
              <Reveal key={titulo} delay={i * 120}>
                <div className="bg-card rounded-2xl shadow-sm border border-border p-7 md:p-8 transition-shadow hover:shadow-md">
                  <div className="flex items-center gap-3 mb-4">
                    <Icone className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-medium text-foreground">{titulo}</h3>
                  </div>
                  <p className="text-foreground/85 mb-1">{local.name}</p>
                  {local.addressLines.map((linha) => (
                    <p key={linha} className="text-sm text-muted-foreground">
                      {linha}
                    </p>
                  ))}
                  <a
                    href={local.maps}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-5 text-sm text-primary hover:text-accent transition-colors"
                  >
                    <MapPin className="w-4 h-4" />
                    Ver no mapa
                  </a>
                </div>
              </Reveal>
            ))}
          </section>

          {/* Traje */}
          <Reveal as="section" className="text-center">
            <Ornament className="mb-8" />
            <h2 className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">
              Traje
            </h2>
            <p className="text-2xl text-foreground mb-3">Esporte Fino</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Como tradição, pedimos apenas que evitem branco, off-white, creme e tons muito
              claros, reservados para a noiva.
            </p>
          </Reveal>

          {/* Bloco de RSVP (ou CTA) */}
          {children && (
            <Reveal as="section" id="rsvp" className="scroll-mt-8">
              {children}
            </Reveal>
          )}
        </div>

        {/* Rodapé */}
        <footer className="border-t border-border py-12 text-center px-6">
          <p className="font-[family-name:var(--font-great-vibes)] text-3xl md:text-4xl text-primary mb-3">
            {WEDDING.couple}
          </p>
          <Ornament className="mb-4" />
          <p className="text-sm text-muted-foreground">
            Confirme sua presença até {WEDDING.rsvpDeadline}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-6">{WEDDING.hashtag}</p>
        </footer>
      </div>
    </main>
  )
}
