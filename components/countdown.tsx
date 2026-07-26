"use client"

import { useEffect, useState } from "react"
import { WEDDING } from "@/lib/event"

const UNITS = [
  { key: "days", label: "Dias" },
  { key: "hours", label: "Horas" },
  { key: "minutes", label: "Min" },
  { key: "seconds", label: "Seg" },
] as const

function diff(target: number) {
  const ms = target - Date.now()
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  return {
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor(ms / 3_600_000) % 24,
    minutes: Math.floor(ms / 60_000) % 60,
    seconds: Math.floor(ms / 1000) % 60,
  }
}

/**
 * Contagem regressiva para o casamento.
 * Começa zerada para o HTML do servidor bater com o do cliente (evita erro de
 * hidratação) e passa a contar assim que monta no navegador.
 */
export function Countdown({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const target = new Date(WEDDING.dateISO).getTime()
    setTime(diff(target))
    const id = setInterval(() => setTime(diff(target)), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex justify-center gap-5 md:gap-10">
      {UNITS.map(({ key, label }) => (
        <div key={key} className="text-center">
          <div
            className={`text-3xl md:text-5xl font-light tabular-nums mb-1 ${
              tone === "light" ? "text-card" : "text-primary"
            }`}
          >
            {String(time[key]).padStart(2, "0")}
          </div>
          <div
            className={`text-[0.65rem] md:text-xs tracking-[0.2em] uppercase ${
              tone === "light" ? "text-card/70" : "text-muted-foreground"
            }`}
          >
            {label}
          </div>
        </div>
      ))}
    </div>
  )
}
