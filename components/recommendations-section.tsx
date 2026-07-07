"use client"

import { useState } from "react"
import { ChevronDown, MapPin, Phone, AtSign, ExternalLink, Info } from "lucide-react"

type Place = {
  name: string
  description?: string
  address?: string
  phone?: string
  instagram?: string
  mapsUrl?: string
  bookingUrl?: string
}

type Category = {
  title: string
  intro?: string[]
  note?: string
  places: Place[]
}

const categories: Category[] = [
  {
    title: "Hospedagem",
    intro: [
      "Para proporcionar uma experiência ainda melhor, firmamos uma parceria com hotéis próximos ao evento. Todos os hotéis abaixo oferecem desconto exclusivo para nossos convidados.",
      "Basta entrar em contato diretamente com o hotel (por telefone, WhatsApp ou outro canal de atendimento) e informar que deseja utilizar o cupom VIDA DE NOIVA no momento da reserva. O desconto está sujeito às regras de cada hotel.",
    ],
    note: "Importante: Para obter o desconto, entre em contato diretamente com o hotel e informe o cupom VIDA DE NOIVA antes de finalizar a reserva. Recomendamos realizar a reserva com antecedência, pois a disponibilidade e as condições promocionais podem variar conforme o período.",
    places: [
      {
        name: "WR Confort Hotel Campo Grande",
        address: "Av. Ministro João Arinos, 3387, Campo Grande - MS, CEP 79045-005",
        mapsUrl: "https://maps.google.com/?q=WR+Confort+Hotel+Campo+Grande",
        bookingUrl: "https://www.booking.com/hotel/br/wr-confort.pt-br.html",
      },
      {
        name: "ibis budget Campo Grande",
        address: "Av. Mato Grosso, 5617, Carandá Bosque, Campo Grande - MS, CEP 79031-000",
        mapsUrl: "https://maps.google.com/?q=ibis+budget+Campo+Grande",
        bookingUrl: "https://www.booking.com/hotel/br/ibis-budget-campo-grande.pt-br.html",
      },
      {
        name: "ibis Campo Grande",
        address: "Av. Mato Grosso, 5513, Campo Grande - MS, CEP 79031-000",
        mapsUrl: "https://maps.google.com/?q=ibis+Campo+Grande",
        bookingUrl: "https://www.booking.com/hotel/br/ibis-campo-grande.pt-br.html",
      },
      {
        name: "Novotel Campo Grande",
        address: "Av. Mato Grosso, 5555, Jardim Copacabana, Campo Grande - MS, CEP 79031-000",
        mapsUrl: "https://maps.google.com/?q=Novotel+Campo+Grande",
        bookingUrl: "https://www.booking.com/hotel/br/campo-grande.pt-br.html",
      },
    ],
  },
  {
    title: "Salões de Beleza",
    places: [
      {
        name: "Studio Bella Hair",
        description: "Especialistas em penteados e maquiagem para madrinhas e convidadas. Agende com antecedência.",
        address: "R. Antônio Maria Coelho, 3200 - Cabreúva, Campo Grande - MS",
        phone: "+55 67 99999-1234",
        instagram: "studiobellahair",
        mapsUrl: "https://maps.google.com/?q=Studio+Bella+Hair+Campo+Grande",
      },
      {
        name: "Espaço Glamour",
        description: "Salão completo com serviços de cabelo, maquiagem e unhas para o dia especial.",
        address: "Av. Afonso Pena, 2100 - Centro, Campo Grande - MS",
        phone: "+55 67 99888-4321",
        instagram: "espacoglamourcg",
        mapsUrl: "https://maps.google.com/?q=Espaco+Glamour+Campo+Grande",
      },
    ],
  },
  {
    title: "Aluguel de Vestidos e Ternos",
    places: [
      {
        name: "Atelier Elegance",
        description: "Vestidos de festa e madrinhas para aluguel, com ajustes personalizados.",
        address: "R. Dom Aquino, 1500 - Centro, Campo Grande - MS",
        phone: "+55 67 99777-5678",
        instagram: "atelierelegance",
        mapsUrl: "https://maps.google.com/?q=Atelier+Elegance+Campo+Grande",
      },
      {
        name: "Homem Elegante Ternos",
        description: "Aluguel e venda de ternos e trajes sociais masculinos com ótimo caimento.",
        address: "Av. Afonso Pena, 3000 - Jardim dos Estados, Campo Grande - MS",
        phone: "+55 67 99666-8765",
        instagram: "homemeleganteternos",
        mapsUrl: "https://maps.google.com/?q=Ternos+Campo+Grande",
      },
    ],
  },
  {
    title: "Comportamento",
    places: [
      {
        name: "Chegue com Antecedência",
        description:
          "Pedimos que cheguem com pelo menos 30 minutos de antecedência para a cerimônia, garantindo que tudo comece no horário previsto.",
      },
      {
        name: "Durante a Cerimônia",
        description:
          "É um momento de recolhimento e emoção. Pedimos silêncio, celulares no modo silencioso e que evitem fotos durante a celebração religiosa.",
      },
      {
        name: "Na Festa",
        description:
          "Aproveitem, dancem e celebrem conosco! Sintam-se em casa para registrar todos os momentos e compartilhar a alegria da noite.",
      },
    ],
  },
]

function PlaceCard({ place }: { place: Place }) {
  return (
    <div className="bg-card rounded-lg p-6 shadow-sm border border-border transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      <h4 className="text-lg font-semibold text-foreground mb-2">{place.name}</h4>
      {place.description && (
        <p className="text-sm text-foreground/80 leading-relaxed mb-4">{place.description}</p>
      )}

      <div className="space-y-2">
        {place.address && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>{place.address}</span>
          </div>
        )}
        {place.phone && (
          <a
            href={`tel:${place.phone.replace(/[^+\d]/g, "")}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <Phone className="w-4 h-4 text-primary shrink-0" />
            <span>{place.phone}</span>
          </a>
        )}
        {place.instagram && (
          <a
            href={`https://instagram.com/${place.instagram}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <AtSign className="w-4 h-4 text-primary shrink-0" />
            <span>@{place.instagram}</span>
          </a>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 mt-4">
        {place.mapsUrl && (
          <a
            href={place.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-accent transition-colors"
          >
            <MapPin className="w-4 h-4" />
            Ver no Maps
          </a>
        )}
        {place.bookingUrl && (
          <a
            href={place.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-accent transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Reservar
          </a>
        )}
      </div>
    </div>
  )
}

export function RecommendationsSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section id="indicacoes" className="py-20 md:py-32 bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-[family-name:var(--font-great-vibes)] text-5xl md:text-6xl text-primary mb-4">
            Indicações
          </h2>
          <p className="text-muted-foreground tracking-wide">
            Sugestões cuidadosamente selecionadas para tornar a sua experiência ainda mais especial
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-4">
          {categories.map((category, index) => (
            <div
              key={index}
              className={`rounded-lg overflow-hidden shadow-sm border transition-colors ${
                openIndex === index ? "border-primary bg-secondary/40" : "border-border bg-card"
              }`}
            >
              <button
                onClick={() => toggle(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-secondary/50 transition-colors"
                aria-expanded={openIndex === index}
              >
                <span className="font-medium text-foreground text-lg">{category.title}</span>
                <ChevronDown
                  className={`w-5 h-5 text-primary shrink-0 transition-transform duration-300 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div
                className={`grid transition-all duration-500 ease-in-out ${
                  openIndex === index ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  {category.intro && (
                    <div className="px-6 pt-2 space-y-3">
                      {category.intro.map((paragraph, p) => (
                        <p key={p} className="text-sm text-foreground/80 leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  )}
                  <div className="px-6 pb-6 pt-4 grid gap-4 sm:grid-cols-2">
                    {category.places.map((place, i) => (
                      <PlaceCard key={i} place={place} />
                    ))}
                  </div>
                  {category.note && (
                    <div className="px-6 pb-6">
                      <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-secondary/60 p-4">
                        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <p className="text-sm text-foreground/80 leading-relaxed">{category.note}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
