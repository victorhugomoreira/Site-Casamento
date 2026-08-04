-- Bruna & Victor Hugo — distingue PIX de cartão em `payments`
-- Rode no SQL Editor do Supabase DEPOIS do 0005_admin_guard.sql.
--
-- Sem isso não dava pra saber, na aba Recebidos, se um pagamento veio do
-- QR Code PIX ou do Checkout Pro (cartão) — as duas Edge Functions gravam na
-- mesma tabela `payments`.

alter table public.payments
  add column if not exists payment_method text;

comment on column public.payments.payment_method is
  'pix ou card — preenchido pela Edge Function que criou a cobranca (create-pix-payment / create-checkout-preference). Pagamentos antigos ficam null.';
