import { Accordion } from "@/components/ui/accordion"
import { SectionHeader } from "@/components/ui/section-header"
import { WEDDING } from "@/lib/event"

const faqs = [
  {
    question: "Posso levar acompanhante?",
    answer:
      "Os convites são individuais e nominais. Caso você tenha sido convidado com acompanhante, isso estará indicado no seu convite. Em caso de dúvidas, entre em contato conosco.",
  },
  {
    question: "Até quando devo confirmar presença?",
    answer: `Pedimos que confirme sua presença até ${WEDDING.rsvpDeadline}, para que possamos organizar todos os detalhes com carinho.`,
  },
  {
    question: "Haverá estacionamento no local?",
    answer:
      "A capela dispõe de estacionamento próprio para os convidados. Para a recepção, o salão de festas não possui estacionamento privativo, mas é possível estacionar nas ruas ao redor. No site, você encontrará o endereço com acesso direto pelo Google Maps para facilitar sua chegada.",
  },
  {
    question: "Qual o horário da cerimônia e da festa?",
    answer: `A cerimônia religiosa começará às 11h na ${WEDDING.ceremony.name}. Logo após, seguiremos para a festa no ${WEDDING.reception.name}.`,
  },
]

export function FAQSection() {
  return (
    <section id="faq" className="py-20 md:py-32 bg-secondary">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Dúvidas Frequentes"
          subtitle="Respondemos às perguntas mais comuns sobre o nosso grande dia"
          className="mb-12"
        />

        {/* Dress Code */}
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

        <Accordion
          items={faqs.map((faq) => ({
            id: faq.question,
            header: faq.question,
            content: <p className="px-6 pb-4 text-foreground/80 leading-relaxed">{faq.answer}</p>,
          }))}
        />
      </div>
    </section>
  )
}
