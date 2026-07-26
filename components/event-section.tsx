import Image from "next/image"
import { MapPin, Clock, Church, PartyPopper } from "lucide-react"
import { SectionHeader } from "@/components/ui/section-header"
import { WEDDING } from "@/lib/event"

export function EventSection() {
  return (
    <section id="evento" className="py-20 md:py-32 bg-secondary">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="O Evento"
          subtitle={
            <>
              Gostaríamos muito de contar com a presença de todos vocês no momento em que nossa
              união será abençoada diante de Deus!
              <br />
              Por favor, chegue com alguns minutos de antecedência. A cerimônia começará
              pontualmente.
            </>
          }
        />

        {/* Events Grid */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Ceremony Card */}
          <div className="bg-card rounded-lg overflow-hidden shadow-sm">
            <div className="relative aspect-[16/10]">
              <Image
                src="/images/capela.webp"
                alt="Capela Salesiana São Francisco de Sales"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                loading="lazy"
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
                    <p className="font-medium">{WEDDING.time}</p>
                    <p className="text-sm text-muted-foreground">{WEDDING.dateLong}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary/60 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">{WEDDING.ceremony.name}</p>
                    {WEDDING.ceremony.addressLines.map((line) => (
                      <p key={line} className="text-sm text-muted-foreground">{line}</p>
                    ))}
                  </div>
                </div>
              </div>

              <a
                href={WEDDING.ceremony.maps}
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
                src="/images/arya-eventos.webp"
                alt="Arya Eventos"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                loading="lazy"
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
                    <p className="font-medium">Logo após a cerimônia religiosa</p>
                    <p className="text-sm text-muted-foreground">Recepção e celebração</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary/60 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">{WEDDING.reception.name}</p>
                    {WEDDING.reception.addressLines.map((line) => (
                      <p key={line} className="text-sm text-muted-foreground">{line}</p>
                    ))}
                  </div>
                </div>
              </div>

              <a
                href={WEDDING.reception.maps}
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
