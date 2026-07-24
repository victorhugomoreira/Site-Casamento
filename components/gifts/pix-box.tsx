"use client"

import { Gift, Copy, Check } from "lucide-react"
import { useState } from "react"

export function PixBox() {
  const [copied, setCopied] = useState(false)

  const pixKey = "7f25dbc2-5f36-4e71-ba8f-d2796d09e787"

  const copyToClipboard = () => {
    navigator.clipboard.writeText(pixKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-card rounded-lg p-8 text-center shadow-sm border border-border max-w-xl mx-auto">
      <Gift className="w-12 h-12 text-primary mx-auto mb-4" />
      <h3 className="text-2xl font-medium text-foreground mb-4">PIX</h3>
      <p className="text-muted-foreground mb-6">
        Se preferir, você pode fazer uma transferência via PIX
      </p>

      <div className="flex items-center justify-center gap-3 bg-secondary rounded-lg p-4">
        <code className="text-foreground text-sm md:text-base flex-1 truncate">{pixKey}</code>
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

      {copied && <p className="text-primary text-sm mt-2">Chave PIX copiada!</p>}

      <div className="mt-6 text-sm text-muted-foreground">
        <p className="text-foreground font-medium">Bruna Rejane Andrea da Silva</p>
        <p>Mercado Pago</p>
      </div>
    </div>
  )
}
