/** Formatação de valores — fonte única para toda a lista de presentes. */

/** Ex.: 1234.5 -> "1.234,5" (sem casas forçadas, para vitrines). */
export function formatPrice(price: number) {
  return Number(price).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

/** Ex.: 1234.5 -> "1.234,50" (duas casas, para checkout/pagamento). */
export function formatPriceExact(price: number) {
  return Number(price).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
