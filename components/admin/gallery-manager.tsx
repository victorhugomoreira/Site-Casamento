"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Crop,
  GripVertical,
  Images,
  Loader2,
  Pencil,
  Trash2,
  Upload,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { revalidateGallery } from "@/app/actions"
import { ImageCropper } from "@/components/admin/image-cropper"
import type { GalleryPhoto } from "@/lib/supabase/types"

const BUCKET = "gallery-images"

/** Maior lado da foto salva. O carrossel nunca passa de 1600px de largura. */
const MAX_SIDE = 1600
const QUALITY = 0.82

/** Formato do recorte opcional: retrato 2:3, igual às fotos que já estão no site. */
const CROP_ASPECT = 2 / 3
const CROP_OUTPUT_WIDTH = 1200

/** Extrai o caminho do arquivo dentro do bucket a partir da URL pública. */
function bucketPath(imageUrl: string): string | null {
  if (!imageUrl.includes(`/${BUCKET}/`)) return null
  return imageUrl.split(`/${BUCKET}/`)[1] || null
}

/** Gera o arquivo final a partir do canvas, preferindo WebP (bem mais leve). */
async function canvasParaArquivo(canvas: HTMLCanvasElement): Promise<File> {
  const tentar = (type: string) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, QUALITY))

  let blob = await tentar("image/webp")
  // Navegadores sem WebP no canvas devolvem PNG silenciosamente.
  if (!blob || blob.type !== "image/webp") blob = await tentar("image/jpeg")
  if (!blob) throw new Error("Não consegui processar a imagem neste navegador.")

  const ext = blob.type === "image/webp" ? "webp" : "jpg"
  return new File([blob], `${crypto.randomUUID()}.${ext}`, { type: blob.type })
}

/**
 * Reduz a foto antes do upload mantendo a proporção original.
 * Fotos de celular têm 4-8 MB; sem isso o convidado baixaria tudo isso.
 */
async function prepararFoto(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
  const escala = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * escala)
  const h = Math.round(bitmap.height * escala)

  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas indisponível neste navegador.")
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()

  return canvasParaArquivo(canvas)
}

export function GalleryManager({ photos }: { photos: GalleryPhoto[] }) {
  const router = useRouter()
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const trocarInputRef = useRef<HTMLInputElement>(null)

  /** Ordem mostrada na tela — muda na hora ao arrastar e depois é salva. */
  const [items, setItems] = useState<GalleryPhoto[]>(photos)
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const [uploading, setUploading] = useState<{ feito: number; total: number } | null>(null)
  const [savingOrder, setSavingOrder] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [captionDraft, setCaptionDraft] = useState("")
  const [savingCaption, setSavingCaption] = useState(false)

  /** Foto aguardando recorte: o arquivo escolhido e a foto que ele vai substituir. */
  const [cropping, setCropping] = useState<{ file: File; alvo: GalleryPhoto } | null>(null)
  const [preparando, setPreparando] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  // Depois de salvar, o server component manda a lista nova
  useEffect(() => setItems(photos), [photos])

  async function atualizarSite() {
    await revalidateGallery()
    router.refresh()
  }

  /** Faz upload de um arquivo já processado e devolve a URL pública. */
  async function uploadFoto(f: File): Promise<string> {
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(f.name, f, { cacheControl: "31536000", upsert: false })
    if (upErr) throw upErr
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(f.name)
    return data.publicUrl
  }

  async function removerDoBucket(imageUrl: string) {
    const path = bucketPath(imageUrl)
    if (path) await supabase.storage.from(BUCKET).remove([path])
  }

  // ---------------------------------------------------------------- adicionar

  async function handleFiles(files: File[]) {
    if (!files.length) return
    setError(null)
    setAviso(null)
    setUploading({ feito: 0, total: files.length })

    let proximaOrdem = items.reduce((max, p) => Math.max(max, p.sort_order), -1) + 1
    let enviadas = 0

    try {
      for (const original of files) {
        const pronta = await prepararFoto(original)
        const image_url = await uploadFoto(pronta)

        const { error: insErr } = await supabase.from("gallery_photos").insert({
          image_url,
          caption: null,
          sort_order: proximaOrdem,
        })
        if (insErr) {
          // não deixa arquivo órfão no Storage se o insert falhar
          await removerDoBucket(image_url)
          throw insErr
        }

        proximaOrdem += 1
        enviadas += 1
        setUploading({ feito: enviadas, total: files.length })
      }

      setAviso(
        enviadas === 1 ? "1 foto adicionada." : `${enviadas} fotos adicionadas.`,
      )
      await atualizarSite()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar as fotos.")
      if (enviadas > 0) await atualizarSite()
    } finally {
      setUploading(null)
    }
  }

  // ------------------------------------------------------------------- ordem

  /** Salva a ordem atual da tela no banco. */
  async function salvarOrdem(lista: GalleryPhoto[]) {
    setError(null)
    setSavingOrder(true)
    try {
      const rows = lista.map((p, i) => ({
        id: p.id,
        image_url: p.image_url,
        sort_order: i,
      }))
      const { error: upErr } = await supabase.from("gallery_photos").upsert(rows)
      if (upErr) throw upErr
      await atualizarSite()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar a nova ordem.")
      setItems(photos) // volta para a ordem que está no banco
    } finally {
      setSavingOrder(false)
    }
  }

  function mover(de: number, para: number) {
    if (para < 0 || para >= items.length || de === para) return
    const lista = [...items]
    const [foto] = lista.splice(de, 1)
    lista.splice(para, 0, foto)
    setItems(lista)
    void salvarOrdem(lista)
  }

  /** Arrastar: reordena na tela enquanto passa por cima dos outros cards. */
  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    if (dragIndex === null || dragIndex === index) return
    const lista = [...items]
    const [foto] = lista.splice(dragIndex, 1)
    lista.splice(index, 0, foto)
    setItems(lista)
    setDragIndex(index)
  }

  function handleDragEnd() {
    if (dragIndex === null) return
    setDragIndex(null)
    // a ordem na tela já é a desejada; só falta gravar
    const mudou = items.some((p, i) => p.sort_order !== i)
    if (mudou) void salvarOrdem(items)
  }

  // ----------------------------------------------------------------- legenda

  function startEdit(photo: GalleryPhoto) {
    setError(null)
    setAviso(null)
    setEditingId(photo.id)
    setCaptionDraft(photo.caption ?? "")
  }

  async function salvarLegenda(photo: GalleryPhoto) {
    setSavingCaption(true)
    setError(null)
    try {
      const { error: updErr } = await supabase
        .from("gallery_photos")
        .update({ caption: captionDraft.trim() || null })
        .eq("id", photo.id)
      if (updErr) throw updErr
      setEditingId(null)
      await atualizarSite()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar a legenda.")
    } finally {
      setSavingCaption(false)
    }
  }

  // ------------------------------------------------------------------ recorte

  /** Baixa a foto atual para poder reenquadrá-la no cropper. */
  async function ajustarRecorte(photo: GalleryPhoto) {
    setError(null)
    setPreparando(true)
    try {
      const resp = await fetch(photo.image_url)
      if (!resp.ok) throw new Error("Não consegui baixar a foto para recortar.")
      const blob = await resp.blob()
      setCropping({
        file: new File([blob], "foto.jpg", { type: blob.type || "image/jpeg" }),
        alvo: photo,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao abrir o recorte.")
    } finally {
      setPreparando(false)
    }
  }

  /** Troca o arquivo de uma foto já cadastrada, mantendo posição e legenda. */
  async function substituirArquivo(photo: GalleryPhoto, novo: File) {
    setError(null)
    setPreparando(true)
    try {
      const pronta = await prepararFoto(novo)
      const image_url = await uploadFoto(pronta)

      const { error: updErr } = await supabase
        .from("gallery_photos")
        .update({ image_url })
        .eq("id", photo.id)
      if (updErr) {
        await removerDoBucket(image_url)
        throw updErr
      }

      await removerDoBucket(photo.image_url)
      setAviso("Foto atualizada.")
      await atualizarSite()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao trocar a foto.")
    } finally {
      setPreparando(false)
    }
  }

  // ------------------------------------------------------------------ excluir

  async function excluir(photo: GalleryPhoto, posicao: number) {
    if (!window.confirm(`Remover a foto ${posicao + 1} da galeria?`)) return

    setError(null)
    setAviso(null)
    setDeletingId(photo.id)
    try {
      const { error: delErr } = await supabase
        .from("gallery_photos")
        .delete()
        .eq("id", photo.id)
      if (delErr) throw delErr

      await removerDoBucket(photo.image_url)
      if (editingId === photo.id) setEditingId(null)
      await atualizarSite()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover a foto.")
    } finally {
      setDeletingId(null)
    }
  }

  const ocupado = uploading !== null || savingOrder || preparando

  return (
    <section className="bg-card rounded-lg shadow-sm overflow-hidden">
      {cropping && (
        <ImageCropper
          file={cropping.file}
          aspect={CROP_ASPECT}
          outputWidth={CROP_OUTPUT_WIDTH}
          onCancel={() => setCropping(null)}
          onConfirm={(recortada) => {
            const alvo = cropping.alvo
            setCropping(null)
            void substituirArquivo(alvo, recortada)
          }}
        />
      )}

      {/* input escondido usado pelo botão "Trocar foto" de cada card */}
      <input
        ref={trocarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const escolhido = e.target.files?.[0]
          const alvo = items.find((p) => p.id === editingId)
          e.target.value = ""
          if (escolhido && alvo) void substituirArquivo(alvo, escolhido)
        }}
      />

      <div className="p-5 border-b border-border">
        <h2 className="font-medium text-foreground flex items-center gap-2">
          <Images className="w-4 h-4 text-primary" />
          Galeria de fotos
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Estas são as fotos do carrossel da página inicial. Arraste (ou use as setas)
          para mudar a ordem — a primeira da lista é a que aparece primeiro no site.
        </p>
      </div>

      {/* Enviar novas fotos */}
      <div className="p-5 border-b border-border">
        <label className="block text-sm text-foreground mb-1">Adicionar fotos</label>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          disabled={ocupado}
          onChange={(e) => {
            const escolhidas = Array.from(e.target.files ?? [])
            e.target.value = ""
            void handleFiles(escolhidas)
          }}
          className="block w-full text-sm text-muted-foreground file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:bg-secondary file:text-foreground hover:file:bg-primary/20 file:cursor-pointer disabled:opacity-60"
        />
        <p className="text-xs text-muted-foreground mt-1.5">
          Pode escolher várias de uma vez. Cada foto é reduzida para no máximo{" "}
          {MAX_SIDE}px mantendo o formato original — o recorte dá para ajustar depois.
        </p>

        {uploading && (
          <p className="mt-2 text-sm text-foreground flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            Enviando {Math.min(uploading.feito + 1, uploading.total)} de{" "}
            {uploading.total}...
          </p>
        )}
        {preparando && !uploading && (
          <p className="mt-2 text-sm text-foreground flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" /> Processando foto...
          </p>
        )}
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        {aviso && !error && <p className="mt-2 text-sm text-primary">{aviso}</p>}
      </div>

      {/* Fotos cadastradas */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-foreground">
            Na galeria <span className="text-muted-foreground">({items.length})</span>
          </h3>
          {savingOrder && (
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" /> Salvando ordem...
            </span>
          )}
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma foto na galeria ainda. Enquanto estiver vazia, o site mostra as fotos
            que já vêm no código.
          </p>
        ) : (
          <ul className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((photo, index) => {
              const editando = editingId === photo.id
              return (
                <li
                  key={photo.id}
                  draggable={!ocupado && !editando}
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => e.preventDefault()}
                  className={`bg-background border rounded-lg overflow-hidden ${
                    dragIndex === index ? "border-primary opacity-60" : "border-border"
                  } ${editando ? "border-primary" : ""}`}
                >
                  <div className="relative aspect-[3/4] bg-secondary">
                    <Image
                      src={photo.image_url}
                      alt={photo.caption ?? `Foto ${index + 1}`}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover pointer-events-none"
                    />
                    <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-foreground/70 text-background text-xs">
                      <GripVertical className="w-3 h-3" />
                      {index + 1}
                    </span>
                  </div>

                  {editando ? (
                    <div className="p-2 space-y-2">
                      <input
                        value={captionDraft}
                        onChange={(e) => setCaptionDraft(e.target.value)}
                        placeholder="Legenda (opcional)"
                        className="w-full px-2 py-1.5 bg-card border border-border rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => salvarLegenda(photo)}
                          disabled={savingCaption}
                          className="inline-flex items-center gap-1 bg-primary text-primary-foreground px-2 py-1 rounded text-xs disabled:opacity-60"
                        >
                          {savingCaption ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                          Salvar
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          Cancelar
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1 border-t border-border">
                        <button
                          type="button"
                          onClick={() => ajustarRecorte(photo)}
                          disabled={preparando}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary disabled:opacity-60"
                        >
                          <Crop className="w-3 h-3" /> Ajustar recorte
                        </button>
                        <button
                          type="button"
                          onClick={() => trocarInputRef.current?.click()}
                          disabled={preparando}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary disabled:opacity-60"
                        >
                          <Upload className="w-3 h-3" /> Trocar foto
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-1.5 flex items-center justify-between">
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => mover(index, index - 1)}
                          disabled={index === 0 || ocupado}
                          className="p-1.5 text-muted-foreground hover:text-primary disabled:opacity-30"
                          aria-label={`Mover a foto ${index + 1} para trás`}
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => mover(index, index + 1)}
                          disabled={index === items.length - 1 || ocupado}
                          className="p-1.5 text-muted-foreground hover:text-primary disabled:opacity-30"
                          aria-label={`Mover a foto ${index + 1} para frente`}
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => startEdit(photo)}
                          className="p-1.5 text-muted-foreground hover:text-primary"
                          aria-label={`Editar a foto ${index + 1}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => excluir(photo, index)}
                          disabled={deletingId === photo.id}
                          className="p-1.5 text-muted-foreground hover:text-destructive disabled:opacity-50"
                          aria-label={`Remover a foto ${index + 1}`}
                        >
                          {deletingId === photo.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        {items.length > 0 && (
          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
            <GripVertical className="w-3 h-3" />
            Dica: no celular use as setas — arrastar funciona melhor no computador.
          </p>
        )}
      </div>
    </section>
  )
}
