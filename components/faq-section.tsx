"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

const faqs = [
  {
    question: "Qual é o dress code do casamento?",
    answer: "O traje é Esporte Fino. Pedimos gentilmente que evitem branco, creme e tons muito claros, pois são reservados para a noiva."
  },
  {
    question: "Posso levar acompanhante?",
    answer: "Os convites são individuais e nominais. Caso você tenha sido convidado com acompanhante, isso estará indicado no seu convite. Em caso de dúvidas, entre em contato conosco."
  },
  {
    question: "Crianças são bem-vindas?",
    answer: "Adoramos crianças! Se seu convite incluir seus filhos, eles serão muito bem-vindos. Caso contrário, pedimos a compreensão de que esta será uma celebração apenas para adultos."
  },
  {
    question: "Até quando devo confirmar presença?",
    answer: "Pedimos que confirme sua presença até 10 de setembro de 2026, para que possamos organizar todos os detalhes com carinho."
  },
  {
    question: "Haverá estacionamento no local?",
    answer: "Sim! Tanto a capela quanto o salão de festas possuem estacionamento próprio e gratuito para os convidados."
  },
  {
    question: "Posso tirar fotos durante a cerimônia?",
    answer: "Durante a cerimônia religiosa, pedimos que evitem o uso de celulares e câmeras para que todos possam viver o momento presente. Teremos fotógrafos profissionais registrando cada detalhe. Na festa, sintam-se à vontade para tirar muitas fotos!"
  },
  {
    question: "Qual o horário da cerimônia e da festa?",
    answer: "A cerimônia religiosa começará às 11h na Capela Salesiana São Francisco de Sales. Logo após, seguiremos para a festa no Arya Eventos."
  },
  {
    question: "Como posso entrar em contato com os noivos?",
    answer: "Você pode nos enviar uma mensagem através do formulário de confirmação de presença ou pelo WhatsApp dos padrinhos."
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

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-card rounded-lg overflow-hidden shadow-sm"
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
