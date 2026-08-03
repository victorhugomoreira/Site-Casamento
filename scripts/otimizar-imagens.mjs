/**
 * Otimiza as fotos do site.
 *
 * Lê os arquivos originais (direto da câmera) e gera versões WebP no tamanho que
 * o site realmente usa. Sem isso, uma foto de 4 MB é enviada inteira para o
 * celular do convidado.
 *
 * Uso:
 *   1. Coloque os originais em ../_originais-fotos/  (mesma estrutura de pastas
 *      de public/images: solta, carrocel/, gifts/)
 *   2. npm run otimizar-imagens
 *
 * Só regrava o que mudou; rodar de novo é seguro.
 */
import sharp from "sharp"
import { readdir, stat, mkdir, access } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const AQUI = path.dirname(fileURLToPath(import.meta.url))
const DESTINO = path.join(AQUI, "..", "public", "images")
const ORIGEM = path.join(AQUI, "..", "..", "_originais-fotos")

sharp.cache(false)

/** Fotos grandes: hero, nossa história e carrossel (retrato da câmera). */
const FOTO = { width: 1600, height: 2400, quality: 78 }
/** Cards de local no bloco "O Evento" (exibidos em 16/10 numa coluna). */
const CARD = { width: 1400, height: 1400, quality: 80 }
/** Presentes: quadrados exibidos a ~300px. */
const PRESENTE = { width: 800, height: 800, quality: 78 }

/** Renomeações fixas — o resto mantém o nome, trocando só a extensão. */
const RENOMEAR = {
  "SGF_1392.jpg": "hero.webp",
  "SGF_2158.jpg": "nossa-historia.webp",
  "unnamed.webp": "capela.webp",
  "arya-eventos.jpg": "arya-eventos.webp",
  "SGF_2194 (1).jpg": "abertura.webp",
}

const PERFIL_POR_PASTA = { "": CARD, carrocel: FOTO, gifts: PRESENTE }
/** Na raiz, essas fotos são grandes e não cards. */
const FOTOS_NA_RAIZ = new Set(["hero.webp", "nossa-historia.webp", "abertura.webp"])

const existe = async (p) => access(p).then(() => true).catch(() => false)

async function processarPasta(subpasta) {
  const dirOrigem = path.join(ORIGEM, subpasta)
  const dirDestino = path.join(DESTINO, subpasta)
  if (!(await existe(dirOrigem))) return []

  await mkdir(dirDestino, { recursive: true })
  const resultados = []

  for (const arquivo of await readdir(dirOrigem)) {
    if (!/\.(jpe?g|png|webp)$/i.test(arquivo)) continue

    const saida = RENOMEAR[arquivo] ?? arquivo.replace(/\.[^.]+$/, ".webp")
    const perfil = FOTOS_NA_RAIZ.has(saida) ? FOTO : PERFIL_POR_PASTA[subpasta]

    const entradaPath = path.join(dirOrigem, arquivo)
    const saidaPath = path.join(dirDestino, saida)

    // Pula se a versão otimizada já é mais nova que o original.
    if (await existe(saidaPath)) {
      const [o, d] = await Promise.all([stat(entradaPath), stat(saidaPath)])
      if (d.mtimeMs >= o.mtimeMs) continue
    }

    const antes = (await stat(entradaPath)).size
    await sharp(entradaPath)
      .rotate() // respeita a orientação EXIF da câmera
      .resize({ ...perfil, fit: "inside", withoutEnlargement: true })
      .webp({ quality: perfil.quality, effort: 6 })
      .toFile(saidaPath)
    const depois = (await stat(saidaPath)).size

    resultados.push({ arquivo: path.join(subpasta, saida), antes, depois })
  }

  return resultados
}

const todos = [
  ...(await processarPasta("")),
  ...(await processarPasta("carrocel")),
  ...(await processarPasta("gifts")),
]

if (todos.length === 0) {
  console.log("Nada novo para otimizar.")
} else {
  let a = 0, d = 0
  for (const r of todos) {
    a += r.antes
    d += r.depois
    console.log(
      r.arquivo.padEnd(34),
      (r.antes / 1048576).toFixed(2).padStart(6) + "MB ->",
      (r.depois / 1024).toFixed(0).padStart(5) + "KB",
    )
  }
  console.log(
    `\n${todos.length} imagens:`,
    (a / 1048576).toFixed(1) + "MB ->",
    (d / 1048576).toFixed(2) + "MB",
    `(-${(100 - (d / a) * 100).toFixed(1)}%)`,
  )
}
