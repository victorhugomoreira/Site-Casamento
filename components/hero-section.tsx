"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { ChevronDown } from "lucide-react"

export function HeroSection() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    const weddingDate = new Date("2026-10-10T11:00:00")
    
    const timer = setInterval(() => {
      const now = new Date()
      const difference = weddingDate.getTime() - now.getTime()
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        })
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/images/SGF_1392.jpg"
          alt="Bruna e Victor Hugo"
          fill
          className="object-cover object-center md:object-[50%_22%]"
          priority
        />
        <div className="absolute inset-0 bg-foreground/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center text-card px-4">
        <p className="text-sm md:text-base tracking-[0.3em] uppercase mb-4 animate-fade-in">
          Vamos nos casar
        </p>
        
        <h1 className="font-[family-name:var(--font-great-vibes)] text-6xl md:text-8xl lg:text-9xl mb-6 text-balance">
          Bruna & Victor Hugo
        </h1>
        
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className="w-16 md:w-24 h-px bg-card/60" />
          <span className="text-lg md:text-xl tracking-widest">10 . 10 . 2026</span>
          <span className="w-16 md:w-24 h-px bg-card/60" />
        </div>

        {/* Countdown */}
        <div className="flex justify-center gap-4 md:gap-8 mb-12">
          {[
            { value: timeLeft.days, label: "Dias" },
            { value: timeLeft.hours, label: "Horas" },
            { value: timeLeft.minutes, label: "Min" },
            { value: timeLeft.seconds, label: "Seg" },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className="text-3xl md:text-5xl font-light mb-1">
                {String(item.value).padStart(2, "0")}
              </div>
              <div className="text-xs md:text-sm tracking-wider uppercase opacity-80">
                {item.label}
              </div>
            </div>
          ))}
        </div>

        <a
          href="#confirmar-presenca"
          className="inline-block bg-card text-foreground px-8 py-3 text-sm tracking-widest uppercase hover:bg-card/90 transition-colors"
        >
          Confirmar Presença
        </a>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-8 h-8 text-card/80" />
      </div>
    </section>
  )
}
