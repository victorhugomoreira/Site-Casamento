"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { GIFTS_TAG } from "@/lib/gifts"

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
