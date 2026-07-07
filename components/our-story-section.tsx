import Image from "next/image"

export function OurStorySection() {
  return (
    <section id="nossa-historia" className="py-20 md:py-32 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-[family-name:var(--font-great-vibes)] text-5xl md:text-6xl text-primary mb-4">
            Nossa História
          </h2>
          <p className="text-muted-foreground tracking-wide">
            Uma história de amor que começou há alguns anos atrás
          </p>
        </div>

        {/* Timeline */}
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div className="relative aspect-[4/5] rounded-lg overflow-hidden">
            <Image
              src="/images/couple-1.png"
              alt="Bruna e Victor"
              fill
              className="object-cover"
            />
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <span className="w-12 h-px bg-primary/40" />
              <span className="text-sm text-primary tracking-widest uppercase">O Grande Dia</span>
            </div>
            <p className="text-foreground/80 leading-relaxed text-lg">
              Quem diria que aquele encontro em 2019 nos traria até aqui? A vida tem seus próprios
              caminhos, mas hoje entendemos que, desde o início, Deus já cuidava de cada detalhe da
              nossa história. Com o passar dos anos, crescemos juntos, enfrentamos desafios,
              amadurecemos e descobrimos que o amor verdadeiro não acontece por acaso: ele é
              construído diariamente e fortalecido pela fé.
            </p>
            <p className="text-foreground/80 leading-relaxed text-lg">
              Hoje, com a certeza de que fomos preparados um para o outro, damos mais um passo
              importante rumo ao nosso {'"'}para sempre{'"'}. Estamos vivendo a realização de um
              grande sonho e mal podemos esperar para celebrar esse momento ao lado das pessoas que
              mais amamos.
            </p>
            <p className="text-foreground/80 leading-relaxed text-lg">
              Sua presença tornará esse dia ainda mais especial para nós. Esperamos você para juntos
              agradecermos a Deus e celebrarmos o início de um novo capítulo da nossa história.
            </p>
          </div>
        </div>


      </div>
    </section>
  )
}
