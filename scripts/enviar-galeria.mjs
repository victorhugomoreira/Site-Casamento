/**
 * Envia as fotos que já estão no código (public/images/carrocel) para o
 * Supabase, criando a galeria inicial que a noiva vai editar no /admin/galeria.
 *
 * Rode UMA vez, depois de aplicar `supabase/migrations/0003_galeria.sql`:
 *   npm run enviar-galeria
 *
 * Se a galeria já tiver fotos, o script não faz nada (use --forcar para
 * adicionar mesmo assim, no fim da lista).
 */
import { createClient } from "@supabase/supabase-js"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const AQUI = path.dirname(fileURLToPath(import.meta.url))
const PASTA = path.join(AQUI, "..", "public", "images", "carrocel")
const BUCKET = "gallery-images"

/** Mesma ordem do fallback em `lib/gallery.ts`. */
const FOTOS = [
  "SGF_2190", "SGF_1181", "SGF_1366", "SGF_1398", "SGF_1538",
  "SGF_1548", "SGF_1586", "SGF_1915", "SGF_1925", "SGF_1944",
  "SGF_2031", "SGF_2057", "SGF_2232",
]

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error(
    "Faltam as variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Confira o .env.local (o npm script já o carrega).",
  )
  process.exit(1)
}

const forcar = process.argv.includes("--forcar")
const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const { data: existentes, error: erroConsulta } = await supabase
  .from("gallery_photos")
  .select("sort_order")
  .order("sort_order", { ascending: false })
  .limit(1)

if (erroConsulta) {
  console.error(
    `Não consegui ler a tabela gallery_photos: ${erroConsulta.message}\n` +
      "Aplicou o supabase/migrations/0003_galeria.sql no SQL Editor?",
  )
  process.exit(1)
}

if (existentes.length && !forcar) {
  console.log(
    "A galeria já tem fotos no Supabase — nada a fazer.\n" +
      "Use `npm run enviar-galeria -- --forcar` para adicionar estas no fim da lista.",
  )
  process.exit(0)
}

let ordem = existentes.length ? existentes[0].sort_order + 1 : 0
let enviadas = 0

for (const nome of FOTOS) {
  const arquivo = `${nome}.webp`
  const conteudo = await readFile(path.join(PASTA, arquivo))
  const caminho = `carrocel/${arquivo}`

  const { error: erroUpload } = await supabase.storage
    .from(BUCKET)
    .upload(caminho, conteudo, {
      contentType: "image/webp",
      cacheControl: "31536000",
      upsert: true,
    })
  if (erroUpload) {
    console.error(`Erro ao enviar ${arquivo}: ${erroUpload.message}`)
    process.exit(1)
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(caminho)

  const { error: erroInsert } = await supabase
    .from("gallery_photos")
    .insert({ image_url: publicUrl, caption: null, sort_order: ordem })
  if (erroInsert) {
    console.error(`Erro ao cadastrar ${arquivo}: ${erroInsert.message}`)
    process.exit(1)
  }

  console.log(`${String(ordem + 1).padStart(2, " ")}. ${arquivo}`)
  ordem += 1
  enviadas += 1
}

console.log(
  `\nPronto: ${enviadas} fotos na galeria. Edite em /admin/galeria — a home já mostra a ordem definida lá.`,
)
