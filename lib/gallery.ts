import { unstable_cache } from "next/cache"
import { createPublicClient } from "@/lib/supabase/public"
import type { GalleryPhoto } from "@/lib/supabase/types"

export const GALLERY_TAG = "gallery"
/** Revalida a galeria a cada 5 min; edições no admin invalidam na hora via revalidateTag. */
const REVALIDATE_SECONDS = 300

export interface GalleryImage {
  src: string
  alt: string
}

/**
 * Fotos que acompanham o código. Servem de rede de segurança: se o Supabase
 * ainda não foi configurado (ou a galeria está vazia), o carrossel continua
 * mostrando estas em vez de sumir da home.
 */
const FOTOS_PADRAO = [
  "SGF_2190", "SGF_1181", "SGF_1366", "SGF_1398", "SGF_1538",
  "SGF_1548", "SGF_1586", "SGF_1915", "SGF_1925", "SGF_1944",
  "SGF_2031", "SGF_2057", "SGF_2232",
].map((name, i) => ({
  src: `/images/carrocel/${name}.webp`,
  alt: `Bruna e Victor Hugo - Foto ${i + 1}`,
}))

/**
 * Busca a galeria uma vez e reaproveita o resultado entre visitantes.
 * A ordem é a que a noiva definiu no painel (`sort_order`).
 */
export const getGalleryImages = unstable_cache(
  async (): Promise<GalleryImage[]> => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return FOTOS_PADRAO

    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from("gallery_photos")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })

    // Erro (ex.: tabela ainda não criada) ou galeria vazia: mantém as fotos do código.
    if (error || !data?.length) return FOTOS_PADRAO

    return (data as GalleryPhoto[]).map((photo, i) => ({
      src: photo.image_url,
      alt: photo.caption?.trim() || `Bruna e Victor Hugo - Foto ${i + 1}`,
    }))
  },
  ["gallery-list"],
  { revalidate: REVALIDATE_SECONDS, tags: [GALLERY_TAG] },
)
