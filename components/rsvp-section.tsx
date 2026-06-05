"use client"

import { useState } from "react"
import { CheckCircle, Send } from "lucide-react"

export function RSVPSection() {
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    guests: "1",
    attendance: "yes",
    dietary: "",
    message: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically send the data to your backend
    console.log("RSVP Data:", formData)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <section id="confirmar-presenca" className="py-20 md:py-32 bg-secondary">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <CheckCircle className="w-16 h-16 text-primary mx-auto mb-6" />
          <h2 className="font-[family-name:var(--font-great-vibes)] text-5xl md:text-6xl text-primary mb-4">
            Obrigado!
          </h2>
          <p className="text-foreground/80 text-lg">
            Sua confirmação foi recebida com sucesso. Estamos ansiosos para celebrar este dia especial com você!
          </p>
        </div>
      </section>
    )
  }

  return (
    <section id="confirmar-presenca" className="py-20 md:py-32 bg-secondary">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-[family-name:var(--font-great-vibes)] text-5xl md:text-6xl text-primary mb-4">
            Confirmar Presença
          </h2>
          <p className="text-muted-foreground tracking-wide">
            Por favor, confirme sua presença até 10 de setembro de 2026
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-card rounded-lg p-6 md:p-8 shadow-sm space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                Nome Completo *
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                placeholder="Seu nome"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                E-mail *
              </label>
              <input
                type="email"
                id="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                Telefone
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                placeholder="(67) 99999-9999"
              />
            </div>

            <div>
              <label htmlFor="guests" className="block text-sm font-medium text-foreground mb-2">
                Número de Convidados *
              </label>
              <select
                id="guests"
                required
                value={formData.guests}
                onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
              >
                {[1, 2, 3, 4, 5].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? "pessoa" : "pessoas"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Você irá comparecer? *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="attendance"
                  value="yes"
                  checked={formData.attendance === "yes"}
                  onChange={(e) => setFormData({ ...formData, attendance: e.target.value })}
                  className="w-4 h-4 text-primary border-border focus:ring-primary/50"
                />
                <span className="text-foreground">Sim, estarei presente</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="attendance"
                  value="no"
                  checked={formData.attendance === "no"}
                  onChange={(e) => setFormData({ ...formData, attendance: e.target.value })}
                  className="w-4 h-4 text-primary border-border focus:ring-primary/50"
                />
                <span className="text-foreground">Infelizmente não poderei ir</span>
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="dietary" className="block text-sm font-medium text-foreground mb-2">
              Restrições Alimentares
            </label>
            <input
              type="text"
              id="dietary"
              value={formData.dietary}
              onChange={(e) => setFormData({ ...formData, dietary: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
              placeholder="Vegetariano, vegano, intolerâncias, etc."
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
              Mensagem para os Noivos
            </label>
            <textarea
              id="message"
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground resize-none"
              placeholder="Deixe uma mensagem especial..."
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground py-4 rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 text-sm tracking-widest uppercase"
          >
            <Send className="w-4 h-4" />
            Confirmar Presença
          </button>
        </form>
      </div>
    </section>
  )
}
