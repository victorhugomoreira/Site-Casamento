"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

const faqs = [
  {
    question: "Posso levar acompanhante?",
    answer: "Os convites são individuais e nominais. Caso você tenha sido convidado com acompanhante, isso estará indicado no seu convite. Em caso de dúvidas, entre em contato conosco."
  },
  {
    question: "Até quando devo confirmar presença?",
    answer: "Pedimos que confirme sua presença até 10 de setembro de 2026, para que possamos organizar todos os detalhes com carinho."
  },
  {
    question: "Haverá estacionamento no local?",
    answer: "A capela dispõe de estacionamento próprio para os convidados. Para a recepção, o salão de festas não possui estacionamento privativo, mas é possível estacionar nas ruas ao redor. No site, você encontrará o endereço com acesso direto pelo Google Maps para facilitar sua chegada."
  },
  {
    question: "Qual o horário da cerimônia e da festa?",
    answer: "A cerimônia religiosa começará às 11h na Capela Salesiana São Francisco de Sales. Logo após, seguiremos para a festa no Arya Eventos."
  },
]

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section id="faq" className="py-20 md:py-32 bg-secondary">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-[family-name:var(--font-great-vibes)] text-5xl md:text-6xl text-primary mb-4">
            Dúvidas Frequentes
          </h2>
          <p className="text-muted-foreground tracking-wide">
            Respondemos às perguntas mais comuns sobre o nosso grande dia
          </p>
        </div>

        {/* Dress Code Card */}
        <div className="bg-card rounded-lg p-8 mb-8 shadow-sm border border-border">
          <div className="text-center">
            <h3 className="text-2xl font-semibold text-foreground mb-4">Dress Code</h3>
            <div className="w-16 h-0.5 bg-primary mx-auto mb-6" />
            <p className="text-lg text-foreground mb-4">Esporte Fino</p>
            <div className="text-muted-foreground text-sm max-w-xl mx-auto space-y-3 leading-relaxed">
              <p>
                Mais do que qualquer traje, queremos a presença de pessoas queridas celebrando esse
                momento conosco. Sintam-se à vontade para escolher um look elegante e confortável,
                ideal para uma cerimônia e recepção durante o dia.
              </p>
              <p>
                Como tradição, pedimos apenas que evitem roupas em branco, off-white, creme e tons
                muito claros, reservadas para a noiva.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-card rounded-lg overflow-hidden shadow-sm border border-border"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-secondary/50 transition-colors"
                aria-expanded={openIndex === index}
              >
                <span className="font-medium text-foreground">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-primary shrink-0 transition-transform duration-300 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? "max-h-96" : "max-h-0"
                }`}
              >
                <p className="px-6 pb-4 text-foreground/80 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
