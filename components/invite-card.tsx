import Image from "next/image"
import Link from "next/link"
import { Check, Gift, MapPin, MousePointerClick, PenLine } from "lucide-react"
import { Reveal } from "@/components/ui/reveal"
import { Ornament } from "@/components/ui/ornament"
import { WEDDING } from "@/lib/event"

const VERSE = {
  text: "Grandes coisas fez o Senhor por nós, por isso estamos alegres.",
  reference: "Salmos 126:3",
}

/** Estilo compartilhado dos botões-atalho (pill com borda, ícone + texto sublinhado). */
const BUTTON_CLASS =
  "flex items-center gap-3 w-full px-5 py-3.5 rounded-full border border-border bg-card " +
  "text-foreground shadow-sm transition-colors hover:border-primary hover:text-primary"
const BUTTON_LABEL_CLASS = "text-sm tracking-wide underline underline-offset-4 decoration-border/80"

/**
 * Convite virtual em rolagem, no formato "clique nos botões": abertura com o
 * versículo e a data, uma foto do local, os atalhos (site, RSVP, presentes,
 * localização) e fotos do casal — tudo em preto e branco. Os detalhes completos
 * (contagem, cerimônia/festa, traje) ficam no site, a um clique de distância.
 *
 * `greeting` e `children` permitem personalizar (saudação da casa + RSVP
 * embutido no convite por link). Quando `children` está presente, o botão
 * "Confirme sua presença" rola até o formulário nesta própria página; sem ele
 * (convite genérico), leva à busca por nome na home.
 */
export function InviteCard({
  greeting,
  children,
}: {
  greeting?: React.ReactNode
  children?: React.ReactNode
}) {
  const rsvpHref = children ? "#rsvp" : "/#confirmar-presenca"

  return (
    <main className="bg-background">
      {/* ---------- Foto de abertura ---------- */}
      <Reveal className="relative w-full aspect-[2/3] bg-secondary">
        <Image
          src="/images/abertura.webp"
          alt={WEDDING.couple}
          fill
          sizes="100vw"
          priority
          className="object-cover grayscale"
        />
      </Reveal>

      {/* ---------- Texto de abertura ---------- */}
      <section className="px-6 pt-16 pb-14 md:pt-24 md:pb-20 text-center">
        <Reveal>
          <p className="italic text-foreground/70 text-sm md:text-base max-w-sm mx-auto leading-relaxed text-balance">
            &ldquo;{VERSE.text}&rdquo;
          </p>
          <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground mt-2">
            {VERSE.reference}
          </p>

          <h1 className="font-[family-name:var(--font-great-vibes)] text-5xl md:text-6xl text-primary mt-10 mb-6 text-balance">
            {WEDDING.couple}
          </h1>

          {greeting && <div className="mb-6">{greeting}</div>}

          <p className="text-foreground/80 max-w-sm mx-auto leading-relaxed">
            Com a bênção de Deus e de nossos pais, convidamos você para celebrar o nosso casamento
          </p>
        </Reveal>

        {/* Selo da data */}
        <Reveal delay={120} className="mt-10 flex items-center justify-center gap-6 md:gap-10">
          <div className="text-center">
            <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground">
              {WEDDING.dayOfWeek}
            </p>
            <p className="text-sm text-foreground/70 mt-1">{WEDDING.time}</p>
          </div>
          <p className="font-[family-name:var(--font-great-vibes)] text-6xl md:text-7xl text-primary leading-none">
            {WEDDING.dayNumber}
          </p>
          <div className="text-center">
            <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground">
              {WEDDING.month}
            </p>
            <p className="text-sm text-foreground/70 mt-1">{WEDDING.year}</p>
          </div>
        </Reveal>

        <Reveal delay={
        200} className="mt-10 text-sm text-muted-foreground space-y-1">
          <p>Cerimônia na {WEDDING.ceremony.name}</p>
          <p>Festa logo em seguida, no espaço de festa {WEDDING.reception.name}</p>
        </Reveal>
      </section>

      {/* ---------- Foto do local ---------- */}
      <Reveal className="relative w-full aspect-[4/3] md:aspect-[16/9] bg-secondary">
        <Image
          src="/images/capela.webp"
          alt={WEDDING.ceremony.name}
          fill
          sizes="100vw"
          loading="lazy"
          className="object-cover grayscale"
        />
      </Reveal>

      {/* ---------- Atalhos ---------- */}
      <section className="px-6 py-14 md:py-20 text-center">
        <Reveal className="flex flex-col items-center gap-2 mb-8 text-muted-foreground">
          <p className="text-xs tracking-[0.3em] uppercase">Clique nos botões</p>
          <MousePointerClick className="w-5 h-5 animate-bounce motion-reduce:animate-none" />
        </Reveal>

        <div className="max-w-xs mx-auto space-y-3">
          <Reveal>
            <Link href="/" className={BUTTON_CLASS}>
              <PenLine className="w-4 h-4 text-primary shrink-0" />
              <span className={BUTTON_LABEL_CLASS}>Acesse o site de casamento</span>
            </Link>
          </Reveal>
          <Reveal delay={80}>
            <Link href={rsvpHref} className={BUTTON_CLASS}>
              <Check className="w-4 h-4 text-primary shrink-0" />
              <span className={BUTTON_LABEL_CLASS}>Confirme sua presença</span>
            </Link>
          </Reveal>
          <Reveal delay={160}>
            <Link href="/presentes" className={BUTTON_CLASS}>
              <Gift className="w-4 h-4 text-primary shrink-0" />
              <span className={BUTTON_LABEL_CLASS}>Lista de presentes</span>
            </Link>
          </Reveal>
          <Reveal delay={240}>
            <Link href="/#evento" className={BUTTON_CLASS}>
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <span className={BUTTON_LABEL_CLASS}>Localização</span>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ---------- Fotos do casal ---------- */}
      <div>
        <Reveal className="relative w-full aspect-[2/3] bg-secondary">
          <Image
            src="/images/hero.webp"
            alt={WEDDING.couple}
            fill
            sizes="100vw"
            loading="lazy"
            className="object-cover grayscale"
          />
        </Reveal>
        <Reveal className="relative w-full aspect-[2/3] bg-secondary">
          <Image
            src="/images/carrocel/SGF_1366.webp"
            alt={WEDDING.couple}
            fill
            sizes="100vw"
            loading="lazy"
            className="object-cover grayscale"
          />
        </Reveal>
      </div>

      {/* Bloco de RSVP (convite personalizado por link) */}
      {children && (
        <Reveal as="section" id="rsvp" className="px-6 py-16 md:py-24 scroll-mt-8">
          <div className="max-w-md mx-auto">{children}</div>
        </Reveal>
      )}

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
    </main>
  )
}
