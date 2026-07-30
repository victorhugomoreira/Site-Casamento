/**
 * Cobranças PIX que o convidado gerou mas ainda não pagou.
 *
 * Guardamos só o `payment_id` (uuid) no localStorage — ele funciona como um
 * token de sessão: quem tem o uuid consulta aquela cobrança, e mais nada.
 * O QR Code em si vem sempre do servidor, para não haver duas versões da
 * verdade nem QR vencido preso no navegador.
 *
 * Assim o convidado pode recarregar a página, fechar a aba ou voltar depois
 * sem perder um QR que ainda vale.
 */

const KEY = "bev:pix-pendentes"

export interface PixPendente {
  payment_id: string
  gift_id: string
  gift_name: string | null
  amount: number
  /** ISO. Usado para descartar sem precisar consultar o servidor. */
  expires_at: string | null
}

function read(): PixPendente[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const list = JSON.parse(raw)
    return Array.isArray(list) ? (list as PixPendente[]) : []
  } catch {
    // localStorage bloqueado (aba anônima, cookies desativados) ou JSON
    // corrompido: seguimos sem recuperação, que é degradação aceitável.
    return []
  }
}

function write(list: PixPendente[]) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    // Sem espaço ou sem permissão — não vale quebrar o checkout por isso.
  }
}

const naoVencido = (p: PixPendente) =>
  !p.expires_at || new Date(p.expires_at).getTime() > Date.now()

/** Todas as cobranças ainda dentro do prazo. */
export function listarPendentes(): PixPendente[] {
  const validos = read().filter(naoVencido)
  if (validos.length !== read().length) write(validos)
  return validos
}

/** A cobrança em aberto deste presente, se houver. */
export function buscarPendente(giftId: string): PixPendente | null {
  return listarPendentes().find((p) => p.gift_id === giftId) ?? null
}

/** Registra a cobrança, substituindo qualquer outra do mesmo presente. */
export function salvarPendente(pendente: PixPendente) {
  write([...read().filter((p) => p.gift_id !== pendente.gift_id && naoVencido(p)), pendente])
}

/** Remove a cobrança — paga, expirada ou abandonada. */
export function removerPendente(paymentId: string) {
  write(read().filter((p) => p.payment_id !== paymentId))
}
