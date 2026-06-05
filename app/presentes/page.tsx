"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Gift, Copy, Check } from "lucide-react"
import { useState } from "react"

const allGifts = [
  {
    id: 1,
    name: "Jogo de Panelas Tramontina",
    description: "Conjunto com 5 panelas em aço inox com fundo triplo, tampas de vidro temperado e cabos em silicone.",
    image: "/images/gifts/jogo-panelas.png",
    price: 890,
    category: "Cozinha",
  },
  {
    id: 2,
    name: "Jogo de Cama Queen",
    description: "Jogo de cama 400 fios em algodão egípcio, inclui 2 fronhas, lençol de baixo com elástico e lençol de cima.",
    image: "/images/gifts/jogo-cama.png",
    price: 450,
    category: "Quarto",
  },
  {
    id: 3,
    name: "Cafeteira Expresso Automática",
    description: "Cafeteira automática com moedor integrado, 15 bar de pressão, sistema de leite para cappuccinos.",
    image: "/images/gifts/cafeteira.png",
    price: 1200,
    category: "Cozinha",
  },
  {
    id: 4,
    name: "Robô Aspirador Inteligente",
    description: "Aspirador robô com mapeamento a laser, controle via app, autonomia de 120 minutos.",
    image: "/images/gifts/aspirador.png",
    price: 1850,
    category: "Casa",
  },
  {
    id: 5,
    name: "Liquidificador Oster",
    description: "Liquidificador de alta performance com 1400W de potência, jarra de vidro de 3,2L e 12 velocidades.",
    image: "/images/gifts/liquidificador.png",
    price: 580,
    category: "Cozinha",
  },
  {
    id: 6,
    name: "Jogo de Toalhas Buddemeyer",
    description: "Kit com 2 toalhas de banho, 2 de rosto e 2 de lavabo em algodão premium fio penteado.",
    image: "/images/gifts/jogo-toalhas.png",
    price: 320,
    category: "Banheiro",
  },
  {
    id: 7,
    name: "Air Fryer Digital 5,5L",
    description: "Fritadeira elétrica sem óleo com painel digital, 8 funções pré-programadas e cesto antiaderente.",
    image: "/images/gifts/airfryer.png",
    price: 650,
    category: "Cozinha",
  },
  {
    id: 8,
    name: "Jogo de Taças de Cristal",
    description: "Conjunto com 6 taças para vinho tinto em cristal Bohemia, 450ml cada.",
    image: "/images/gifts/jogo-tacas.png",
    price: 380,
    category: "Mesa",
  },
  {
    id: 9,
    name: "Aparelho de Jantar 42 Peças",
    description: "Aparelho de jantar em porcelana com filete dourado, inclui pratos rasos, fundos, sobremesa e xícaras.",
    image: "/images/gifts/aparelho-jantar.png",
    price: 890,
    category: "Mesa",
  },
  {
    id: 10,
    name: "Smart TV 55 Polegadas",
    description: "Smart TV 4K UHD com HDR, sistema operacional integrado, 3 entradas HDMI e controle por voz.",
    image: "/images/gifts/smart-tv.png",
    price: 2500,
    category: "Sala",
  },
  {
    id: 11,
    name: "Contribuição Lua de Mel",
    description: "Ajude-nos a realizar a viagem dos nossos sonhos! Qualquer valor será muito bem-vindo.",
    image: "/images/gifts/lua-de-mel.png",
    price: 500,
    category: "Experiência",
  },
  {
    id: 12,
    name: "Edredom King Size",
    description: "Edredom premium em pluma de ganso sintética, extra macio e antialérgico.",
    image: "/images/gifts/edredom.png",
    price: 680,
    category: "Quarto",
  },
]

const categories = ["Todos", "Cozinha", "Quarto", "Casa", "Mesa", "Sala", "Banheiro", "Experiência"]

export default function GiftsPage() {
  const [selectedCategory, setSelectedCategory] = useState("Todos")
  const [copied, setCopied] = useState(false)
  
  const pixKey = "exemplo@pix.com"
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(pixKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const filteredGifts = selectedCategory === "Todos" 
    ? allGifts 
    : allGifts.filter(gift => gift.category === selectedCategory)

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/#presentes" 
              className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </Link>
            <h1 className="font-[family-name:var(--font-great-vibes)] text-3xl text-primary">
              Bruna & Victor
            </h1>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Title */}
        <div className="text-center mb-12">
          <h2 className="font-[family-name:var(--font-great-vibes)] text-5xl md:text-6xl text-primary mb-4">
            Lista de Presentes
          </h2>
          <p className="text-muted-foreground tracking-wide max-w-2xl mx-auto">
            Escolha um presente especial para nos ajudar a começar nossa nova vida juntos
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground hover:bg-primary/20"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Gifts Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
          {filteredGifts.map((gift) => (
            <div
              key={gift.id}
              className="bg-card rounded-lg overflow-hidden shadow-sm border border-border hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="aspect-square relative bg-secondary">
                <Image
                  src={gift.image}
                  alt={gift.name}
                  fill
                  className="object-cover"
                />
                <span className="absolute top-3 left-3 bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded">
                  {gift.category}
                </span>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <h3 className="text-lg font-medium text-foreground mb-2">{gift.name}</h3>
                <p className="text-muted-foreground text-sm mb-4 flex-1 line-clamp-2">
                  {gift.description}
                </p>
                <div className="mt-auto">
                  <p className="text-primary font-semibold text-xl mb-4">
                    R$ {gift.price.toLocaleString('pt-BR')}
                  </p>
                  <button className="w-full bg-primary text-primary-foreground py-2.5 px-4 rounded-md hover:bg-accent transition-colors font-medium flex items-center justify-center gap-2">
                    <Gift className="w-4 h-4" />
                    Presentear
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* PIX Section */}
        <div className="bg-card rounded-lg p-8 text-center shadow-sm border border-border max-w-xl mx-auto">
          <Gift className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="text-2xl font-medium text-foreground mb-4">PIX</h3>
          <p className="text-muted-foreground mb-6">
            Se preferir, você também pode fazer uma transferência via PIX
          </p>
          
          <div className="flex items-center justify-center gap-3 bg-secondary rounded-lg p-4">
            <code className="text-foreground text-sm md:text-base flex-1 truncate">
              {pixKey}
            </code>
            <button
              onClick={copyToClipboard}
              className="p-2 hover:bg-background rounded-md transition-colors"
              aria-label="Copiar chave PIX"
            >
              {copied ? (
                <Check className="w-5 h-5 text-primary" />
              ) : (
                <Copy className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
          </div>
          
          {copied && (
            <p className="text-primary text-sm mt-2">Chave PIX copiada!</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="font-[family-name:var(--font-great-vibes)] text-2xl text-primary mb-2">
            Bruna & Victor
          </p>
          <p className="text-muted-foreground text-sm">10 de Outubro de 2026</p>
        </div>
      </footer>
    </main>
  )
}
