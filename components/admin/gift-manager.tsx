"use client"

import Image from "next/image"
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Gift as GiftIcon, Plus, Trash2, Loader2, ImagePlus, Pencil, X, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Gift } from "@/lib/supabase/types"

function formatPrice(price: number) {
  return Number(price).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

/** Extrai o caminho do arquivo dentro do bucket a partir da URL pública. */
function bucketPath(imageUrl: string | null): string | null {
  if (!imageUrl || !imageUrl.includes("/gift-images/")) return null
  return imageUrl.split("/gift-images/")[1] || null
}

export function GiftManager({ gifts }: { gifts: Gift[] }) {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [category, setCategory] = useState("")
  const [file, setFile] = useState<File | null>(null)

  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isEditing = editingId !== null

  function resetForm() {
    setEditingId(null)
    setCurrentImageUrl(null)
    setName("")
    setDescription("")
    setPrice("")
    setCategory("")
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function startEdit(gift: Gift) {
    setError(null)
    setEditingId(gift.id)
    setCurrentImageUrl(gift.image_url)
    setName(gift.name)
    setDescription(gift.description ?? "")
    setPrice(gift.price != null ? String(gift.price) : "")
    setCategory(gift.category ?? "")
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  /** Faz upload de um arquivo e devolve a URL pública. */
  async function uploadImage(f: File): Promise<string> {
    const ext = f.name.split(".").pop()?.toLowerCase() || "jpg"
    const path = `${crypto.randomUUID()}.${ext}`
    const { error: upErr } = await supabase.storage
      .from("gift-images")
      .upload(path, f, { cacheControl: "3600", upsert: false })
    if (upErr) throw upErr
    const { data: pub } = supabase.storage.from("gift-images").getPublicUrl(path)
    return pub.publicUrl
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError("Informe o nome do presente.")
      return
    }

    setSaving(true)
    try {
      if (isEditing) {
        // --- ATUALIZAR ---
        let image_url = currentImageUrl
        if (file) {
          image_url = await uploadImage(file)
          // remove a imagem antiga do bucket, se havia uma nossa
          const oldPath = bucketPath(currentImageUrl)
          if (oldPath) await supabase.storage.from("gift-images").remove([oldPath])
        }

        const { error: updErr } = await supabase
          .from("gifts")
          .update({
            name: name.trim(),
            description: description.trim() || null,
            price: price ? Number(price) : 0,
            category: category.trim() || null,
            image_url,
          })
          .eq("id", editingId)
        if (updErr) throw updErr
      } else {
        // --- CRIAR ---
        let image_url: string | null = null
        if (file) image_url = await uploadImage(file)

        const nextOrder = gifts.reduce((max, g) => Math.max(max, g.sort_order), 0) + 1

        const { error: insErr } = await supabase.from("gifts").insert({
          name: name.trim(),
          description: description.trim() || null,
          price: price ? Number(price) : 0,
          category: category.trim() || null,
          image_url,
          sort_order: nextOrder,
        })
        if (insErr) throw insErr
      }

      resetForm()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar o presente.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(gift: Gift) {
    if (!window.confirm(`Remover "${gift.name}" da lista de presentes?`)) return

    setError(null)
    setDeletingId(gift.id)
    try {
      const path = bucketPath(gift.image_url)
      if (path) await supabase.storage.from("gift-images").remove([path])

      const { error: delErr } = await supabase.from("gifts").delete().eq("id", gift.id)
      if (delErr) throw delErr

      // se estava editando esse item, limpa o formulário
      if (editingId === gift.id) resetForm()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover o presente.")
    } finally {
      setDeletingId(null)
    }
  }

  const previewUrl = file ? URL.createObjectURL(file) : currentImageUrl

  return (
    <section className="bg-card rounded-lg shadow-sm overflow-hidden">
      <div className="p-5 border-b border-border">
        <h2 className="font-medium text-foreground flex items-center gap-2">
          <GiftIcon className="w-4 h-4 text-primary" />
          Lista de presentes
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Cadastre, edite ou remova presentes. Eles aparecem automaticamente na página
          pública de presentes.
        </p>
      </div>

      {/* Formulário (criar ou editar) */}
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="p-5 grid gap-4 sm:grid-cols-2 border-b border-border scroll-mt-24"
      >
        <div className="sm:col-span-2 flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">
            {isEditing ? "Editar presente" : "Novo presente"}
          </h3>
          {isEditing && (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3" /> Cancelar edição
            </button>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm text-foreground mb-1">Nome *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Jogo de Panelas"
            className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm text-foreground mb-1">Descrição</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Detalhes do presente (opcional)"
            className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
          />
        </div>

        <div>
          <label className="block text-sm text-foreground mb-1">Valor (R$)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0,00"
            className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div>
          <label className="block text-sm text-foreground mb-1">Categoria</label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Ex.: Cozinha"
            className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm text-foreground mb-1">
            Imagem {isEditing && "(deixe em branco para manter a atual)"}
          </label>
          <div className="flex items-center gap-3">
            {previewUrl && (
              <div className="relative w-16 h-16 shrink-0 rounded-md overflow-hidden bg-secondary border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Prévia" className="w-full h-full object-cover" />
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:bg-secondary file:text-foreground hover:file:bg-primary/20 file:cursor-pointer"
            />
          </div>
          {file && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <ImagePlus className="w-3 h-3" /> {file.name}
            </p>
          )}
        </div>

        {error && <p className="sm:col-span-2 text-sm text-destructive">{error}</p>}

        <div className="sm:col-span-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-md hover:bg-primary/90 transition-colors text-sm disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isEditing ? (
              <Check className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {saving
              ? "Salvando..."
              : isEditing
                ? "Salvar alterações"
                : "Adicionar presente"}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={resetForm}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* Lista de presentes cadastrados */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-foreground">
            Cadastrados <span className="text-muted-foreground">({gifts.length})</span>
          </h3>
        </div>

        {gifts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum presente cadastrado ainda.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {gifts.map((gift) => (
              <li
                key={gift.id}
                className={`flex items-center gap-3 bg-background border rounded-lg p-3 ${
                  editingId === gift.id ? "border-primary" : "border-border"
                }`}
              >
                <div className="relative w-14 h-14 shrink-0 rounded-md overflow-hidden bg-secondary">
                  {gift.image_url ? (
                    <Image src={gift.image_url} alt={gift.name} fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <GiftIcon className="w-5 h-5 text-primary/40" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{gift.name}</p>
                  <p className="text-xs text-muted-foreground">
                    R$ {formatPrice(gift.price)}
                    {gift.category ? ` · ${gift.category}` : ""}
                  </p>
                </div>
                <div className="flex items-center">
                  <button
                    onClick={() => startEdit(gift)}
                    className="p-2 text-muted-foreground hover:text-primary transition-colors"
                    aria-label={`Editar ${gift.name}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(gift)}
                    disabled={deletingId === gift.id}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                    aria-label={`Remover ${gift.name}`}
                  >
                    {deletingId === gift.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
