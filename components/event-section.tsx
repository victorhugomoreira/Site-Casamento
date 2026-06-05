import Image from "next/image"
import { MapPin, Clock, Church, PartyPopper } from "lucide-react"

export function EventSection() {
  return (
    <section id="evento" className="py-20 md:py-32 bg-secondary">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-[family-name:var(--font-great-vibes)] text-5xl md:text-6xl text-primary mb-4">
            O Evento
          </h2>
          <p className="text-muted-foreground tracking-wide">
            Junte-se a nós neste dia especial
          </p>
        </div>

        {/* Events Grid */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Ceremony Card */}
          <div className="bg-card rounded-lg overflow-hidden shadow-sm">
            <div className="relative aspect-[16/10]">
              <Image
                src="/images/ceremony.png"
                alt="Local da Cerimônia"
                fill
                className="object-cover"
              />
            </div>
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <Church className="w-6 h-6 text-primary" />
                <h3 className="text-2xl font-medium text-foreground">Cerimônia</h3>
              </div>
              
              <div className="space-y-4 text-foreground/80">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-primary/60 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">11:00 da manhã</p>
                    <p className="text-sm text-muted-foreground">Sábado, 10 de Outubro de 2026</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary/60 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Capela Salesiana São Francisco de Sales</p>
                    <p className="text-sm text-muted-foreground">
                      Av. Eliseu Ramos de Mendonça, 8000
                    </p>
                    <p className="text-sm text-muted-foreground">Campo Grande - MS</p>
                  </div>
                </div>
              </div>

              <a
                href="https://maps.google.com/?q=Capela+Salesiana+São+Francisco+de+Sales+Campo+Grande"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-6 text-sm text-primary hover:text-primary/80 transition-colors"
              >
                <MapPin className="w-4 h-4" />
                Ver no Google Maps
              </a>
            </div>
          </div>

          {/* Reception Card */}
          <div className="bg-card rounded-lg overflow-hidden shadow-sm">
            <div className="relative aspect-[16/10]">
              <Image
                src="/images/reception.png"
                alt="Local da Festa"
                fill
                className="object-cover"
              />
            </div>
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <PartyPopper className="w-6 h-6 text-primary" />
                <h3 className="text-2xl font-medium text-foreground">Festa</h3>
              </div>
              
              <div className="space-y-4 text-foreground/80">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-primary/60 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Após a cerimônia</p>
                    <p className="text-sm text-muted-foreground">Recepção e celebração</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary/60 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Arya Eventos</p>
                    <p className="text-sm text-muted-foreground">
                      R. Martin Afonso de Souza, 362 - Nova Lima
                    </p>
                    <p className="text-sm text-muted-foreground">Campo Grande - MS, 79017-032</p>
                  </div>
                </div>
              </div>

              <a
                href="https://maps.google.com/?q=Arya+Eventos+Campo+Grande"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-6 text-sm text-primary hover:text-primary/80 transition-colors"
              >
                <MapPin className="w-4 h-4" />
                Ver no Google Maps
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
