"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { GIFTS_TAG } from "@/lib/gifts"
import { GALLERY_TAG } from "@/lib/gallery"

/**
 * Derruba o cache da lista de presentes.
 * Chamado pelo admin depois de criar/editar/excluir, para que a home e a página
 * /presentes mostrem a mudança na hora em vez de esperar a revalidação de 5 min.
 */
export async function revalidateGifts() {
  revalidateTag(GIFTS_TAG, "max")
  revalidatePath("/")
  revalidatePath("/presentes")
}

/**
 * Derruba o cache da galeria.
 * Chamado pelo admin depois de adicionar/editar/reordenar/excluir fotos, para
 * que a home mostre a mudança na hora em vez de esperar a revalidação de 5 min.
 */
export async function revalidateGallery() {
  revalidateTag(GALLERY_TAG, "max")
  revalidatePath("/")
}
