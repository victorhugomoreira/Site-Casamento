"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { Check, Loader2, Move, RotateCcw, X, ZoomIn } from "lucide-react"

interface ImageCropperProps {
  /** Arquivo original escolhido pelo admin. */
  file: File
  /** Proporção do recorte (largura / altura). 1 = quadrado, igual à vitrine de presentes. */
  aspect?: number
  /** Largura final da imagem gerada, em pixels. A altura sai de `aspect`. */
  outputWidth?: number
  onCancel: () => void
  onConfirm: (cropped: File) => void
}

const MAX_ZOOM = 5

/**
 * Recorta a imagem num formato fixo antes do upload: o admin arrasta para
 * escolher o enquadramento e usa o zoom para aproximar. O que fica dentro da
 * moldura é exatamente o que vai para o site — sempre no mesmo tamanho, então
 * fotos gigantes de celular não quebram o layout nem pesam no carregamento.
 */
export function ImageCropper({
  file,
  aspect = 1,
  outputWidth = 1000,
  onCancel,
  onConfirm,
}: ImageCropperProps) {
  const boxRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)
  const pinchRef = useRef<{ dist: number; zoom: number } | null>(null)

  const [url, setUrl] = useState<string | null>(null)
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null)
  const [box, setBox] = useState({ w: 0, h: 0 })
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // URL temporária do arquivo escolhido
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file)
    setUrl(objectUrl)
    setNatural(null)
    setZoom(1)
    setOffset({ x: 0, y: 0 })
    return () => URL.revokeObjectURL(objectUrl)
  }, [file])

  // Tamanho real da moldura na tela (ela é responsiva)
  useLayoutEffect(() => {
    const el = boxRef.current
    if (!el) return
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Escala mínima ("cover"): no zoom 1 a imagem já preenche a moldura inteira
  const baseScale =
    natural && box.w && box.h ? Math.max(box.w / natural.w, box.h / natural.h) : 1
  const scale = baseScale * zoom

  /** Impede que sobre borda vazia dentro da moldura. */
  const clampOffset = useCallback(
    (o: { x: number; y: number }, s: number) => {
      if (!natural || !box.w) return o
      const maxX = Math.max(0, (natural.w * s - box.w) / 2)
      const maxY = Math.max(0, (natural.h * s - box.h) / 2)
      return {
        x: Math.min(maxX, Math.max(-maxX, o.x)),
        y: Math.min(maxY, Math.max(-maxY, o.y)),
      }
    },
    [natural, box.w],
  )

  const applyZoom = useCallback(
    (next: number) => {
      const z = Math.min(MAX_ZOOM, Math.max(1, next))
      setZoom(z)
      setOffset((o) => clampOffset(o, baseScale * z))
    },
    [baseScale, clampOffset],
  )

  // Zoom pela rodinha do mouse (listener nativo para poder cancelar o scroll)
  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      applyZoom(zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12))
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [applyZoom, zoom])

  // Esc fecha
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !working) onCancel()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onCancel, working])

  function pointerDistance() {
    const [a, b] = Array.from(pointers.current.values())
    return Math.hypot(a.x - b.x, a.y - b.y)
  }

  function handlePointerDown(e: React.PointerEvent) {
    ;(e.target as Element).setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointers.current.size === 1) {
      dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
    } else if (pointers.current.size === 2) {
      dragRef.current = null
      pinchRef.current = { dist: pointerDistance(), zoom }
    }
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointers.current.size >= 2 && pinchRef.current) {
      const dist = pointerDistance()
      if (pinchRef.current.dist > 0) {
        applyZoom((pinchRef.current.zoom * dist) / pinchRef.current.dist)
      }
      return
    }

    const drag = dragRef.current
    if (!drag) return
    setOffset(
      clampOffset(
        { x: drag.ox + (e.clientX - drag.x), y: drag.oy + (e.clientY - drag.y) },
        scale,
      ),
    )
  }

  function handlePointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinchRef.current = null
    if (pointers.current.size === 0) dragRef.current = null
  }

  function reset() {
    setZoom(1)
    setOffset({ x: 0, y: 0 })
  }

  async function handleConfirm() {
    const img = imgRef.current
    if (!img || !natural || !box.w) return

    setError(null)
    setWorking(true)
    try {
      const outW = Math.round(outputWidth)
      const outH = Math.round(outputWidth / aspect)

      const canvas = document.createElement("canvas")
      canvas.width = outW
      canvas.height = outH
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Canvas indisponível neste navegador.")
      ctx.imageSmoothingQuality = "high"
      // fundo branco: o JPEG não guarda transparência
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, outW, outH)

      // canto superior esquerdo da imagem dentro da moldura
      const left = box.w / 2 + offset.x - (natural.w * scale) / 2
      const top = box.h / 2 + offset.y - (natural.h * scale) / 2

      // região da imagem original que aparece na moldura
      const sx = Math.max(0, -left / scale)
      const sy = Math.max(0, -top / scale)
      const sw = Math.min(natural.w - sx, box.w / scale)
      const sh = Math.min(natural.h - sy, box.h / scale)

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH)

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.9),
      )
      if (!blob) throw new Error("Não consegui gerar a imagem recortada.")

      const baseName = file.name.replace(/\.[^.]+$/, "") || "imagem"
      onConfirm(new File([blob], `${baseName}.jpg`, { type: "image/jpeg" }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao recortar a imagem.")
    } finally {
      setWorking(false)
    }
  }

  const ready = Boolean(url && natural && box.w)

  return (
    <div className="fixed inset-0 z-50 bg-foreground/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-md my-8">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="font-medium text-foreground">Ajustar imagem</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Arraste para posicionar e use o zoom. O que estiver dentro da moldura é o
              que aparece no site.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={working}
            className="text-muted-foreground hover:text-foreground disabled:opacity-60"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div
            ref={boxRef}
            style={{ aspectRatio: String(aspect), touchAction: "none" }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="relative w-full overflow-hidden rounded-md bg-secondary select-none cursor-grab active:cursor-grabbing"
          >
            {url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                ref={imgRef}
                src={url}
                alt="Imagem para recortar"
                draggable={false}
                onLoad={(e) => {
                  const el = e.currentTarget
                  setNatural({ w: el.naturalWidth, h: el.naturalHeight })
                }}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: natural ? natural.w * scale : undefined,
                  maxWidth: "none",
                  transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`,
                  visibility: ready ? "visible" : "hidden",
                }}
              />
            )}

            {/* guias do recorte */}
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-border">
              <div className="absolute inset-y-0 left-1/3 w-px bg-white/40" />
              <div className="absolute inset-y-0 left-2/3 w-px bg-white/40" />
              <div className="absolute inset-x-0 top-1/3 h-px bg-white/40" />
              <div className="absolute inset-x-0 top-2/3 h-px bg-white/40" />
            </div>

            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>

          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Move className="w-3 h-3" /> Arraste a imagem para escolher o enquadramento
          </p>

          <div className="flex items-center gap-3">
            <ZoomIn className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="range"
              min={1}
              max={MAX_ZOOM}
              step={0.01}
              value={zoom}
              onChange={(e) => applyZoom(Number(e.target.value))}
              className="w-full accent-[var(--color-primary)]"
              aria-label="Zoom"
            />
            <button
              type="button"
              onClick={reset}
              className="shrink-0 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-3 h-3" /> Redefinir
            </button>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="flex items-center gap-3 p-5 border-t border-border">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!ready || working}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-md hover:bg-primary/90 transition-colors text-sm disabled:opacity-60"
          >
            {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {working ? "Recortando..." : "Usar este recorte"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={working}
            className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-60"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
