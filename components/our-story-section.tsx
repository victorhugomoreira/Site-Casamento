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

          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="w-12 h-px bg-primary/40" />
                <span className="text-sm text-primary tracking-widest uppercase">O Início</span>
              </div>
              <p className="text-foreground/80 leading-relaxed text-lg">
                Nos conhecemos em um momento especial de nossas vidas. Desde o primeiro instante, 
                soubemos que algo único estava nascendo entre nós. O que começou como uma amizade 
                se transformou em um amor profundo e verdadeiro.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="w-12 h-px bg-primary/40" />
                <span className="text-sm text-primary tracking-widest uppercase">O Pedido</span>
              </div>
              <p className="text-foreground/80 leading-relaxed text-lg">
                Após anos de companheirismo, risadas e sonhos compartilhados, decidimos dar o 
                próximo passo em nossa jornada juntos. O pedido de casamento foi um momento 
                mágico que guardaremos para sempre em nossos corações.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="w-12 h-px bg-primary/40" />
                <span className="text-sm text-primary tracking-widest uppercase">O Grande Dia</span>
              </div>
              <p className="text-foreground/80 leading-relaxed text-lg">
                E agora, em 10 de outubro de 2026, vamos celebrar nosso amor cercados por 
                todos aqueles que nos são queridos. Será o dia mais especial de nossas vidas, 
                e queremos muito que você faça parte dele.
              </p>
            </div>
          </div>
        </div>


      </div>
    </section>
  )
}
