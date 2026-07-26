/** Dados do casamento — fonte única reutilizada no site, no convite e no RSVP. */
export const WEDDING = {
  couple: "Bruna & Victor Hugo",
  hashtag: "#BrunaeVictorHugo2026",
  dateISO: "2026-10-10T11:00:00",
  dateLabel: "10 . 10 . 2026",
  dateLong: "Sábado, 10 de Outubro de 2026",
  dateShort: "10 de Outubro de 2026",
  time: "11:00 da manhã",
  city: "Campo Grande - MS",
  rsvpDeadline: "10 de setembro de 2026",
  ceremony: {
    name: "Capela Salesiana São Francisco de Sales",
    address: "Av. Eliseu Ramos de Mendonça, 8000 — Campo Grande - MS",
    addressLines: ["Av. Eliseu Ramos de Mendonça, 8000", "Campo Grande - MS"],
    maps: "https://maps.google.com/?q=Capela+Salesiana+São+Francisco+de+Sales+Campo+Grande",
  },
  reception: {
    name: "Arya Eventos",
    address: "R. Martin Afonso de Souza, 362 - Nova Lima, Campo Grande - MS",
    addressLines: ["R. Martin Afonso de Souza, 362 - Nova Lima", "Campo Grande - MS, 79017-032"],
    maps: "https://maps.google.com/?q=Arya+Eventos+Campo+Grande",
  },
} as const

/** Dados do PIX — estavam duplicados na home, na lista de presentes e no checkout. */
export const PIX = {
  key: "7f25dbc2-5f36-4e71-ba8f-d2796d09e787",
  owner: "Bruna Rejane Andrea da Silva",
  bank: "Mercado Pago",
} as const

/** Texto de abertura da lista de presentes — usado na home e na página /presentes. */
export const GIFTS_INTRO =
  "Já construímos nosso lar com muito carinho e, felizmente, temos a maior parte do que " +
  "precisamos. Por isso, nossa lista foi pensada de uma forma um pouco diferente! Reunimos " +
  "alguns presentes divertidos, que representam sonhos, experiências e projetos do casal, " +
  "além de algumas sugestões para quem prefere presentear de forma mais tradicional. " +
  "Independentemente da sua escolha, o mais importante para nós é celebrar esse momento ao " +
  "seu lado. 🤍"
