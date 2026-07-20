"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Upload } from "lucide-react"

export function ImportForm() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)

  async function handleFile(file: File) {
    setLoading(true)
    setMessage(null)
    setIsError(false)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/admin/import", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) {
        setIsError(true)
        setMessage(data.error ?? "Falha ao importar.")
        return
      }
      setMessage(
        `Importação concluída: ${data.inserted} nova(s), ${data.updated} atualizada(s).`,
      )
      router.refresh()
    } catch {
      setIsError(true)
      setMessage("Erro de rede ao importar.")
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
        }}
      />
      <button
        type="button"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-md hover:bg-primary/90 transition-colors text-sm disabled:opacity-60"
      >
        <Upload className="w-4 h-4" />
        {loading ? "Importando..." : "Importar planilha (.xlsx)"}
      </button>
      {message && (
        <p className={`text-sm ${isError ? "text-destructive" : "text-muted-foreground"}`}>
          {message}
        </p>
      )}
    </div>
  )
}
