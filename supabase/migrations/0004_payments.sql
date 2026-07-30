-- Bruna & Victor Hugo — pagamentos PIX via Mercado Pago
-- Rode no SQL Editor do Supabase DEPOIS do 0002_gifts.sql.
-- Passo a passo completo da integração: supabase/PIX-SETUP.md
--
-- Guarda cada cobrança PIX gerada. O valor NUNCA vem do cliente: as Edge
-- Functions leem o preço da tabela `gifts` e gravam aqui. O webhook do
-- Mercado Pago atualiza o status quando o pagamento é aprovado.

-- ============================================================
-- Tabela
-- ============================================================
create table if not exists public.payments (
  id             uuid primary key default gen_random_uuid(),
  gift_id        uuid references public.gifts(id) on delete set null,
  gift_name      text,
  mp_payment_id  text unique,
  status         text not null default 'pending',
  status_detail  text,
  amount         numeric(10,2) not null,
  payer_name     text,
  payer_email    text,
  message        text,
  qr_code        text,
  qr_code_base64 text,
  ticket_url     text,
  expires_at     timestamptz,
  paid_at        timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists payments_status_idx  on public.payments (status, created_at desc);
create index if not exists payments_gift_idx    on public.payments (gift_id);
create index if not exists payments_mp_id_idx   on public.payments (mp_payment_id);

-- updated_at automático (função criada no 0001_init.sql)
drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- ============================================================
-- RLS: ninguém acessa direto pelo browser.
-- As Edge Functions usam a service_role (que ignora RLS) e o admin
-- autenticado pode apenas LER para acompanhar quem presenteou.
-- ============================================================
alter table public.payments enable row level security;

drop policy if exists "payments admin read" on public.payments;
create policy "payments admin read"
  on public.payments for select
  to authenticated
  using (true);

-- Sem policy de insert/update/delete: escrita só via service_role.

-- ============================================================
-- Visão para o admin: presentes com o total já recebido.
-- ============================================================
create or replace view public.gifts_with_payments
with (security_invoker = true)
as
select
  g.*,
  coalesce(p.paid_count, 0)  as paid_count,
  coalesce(p.paid_total, 0)  as paid_total
from public.gifts g
left join (
  select gift_id,
         count(*)      as paid_count,
         sum(amount)   as paid_total
  from public.payments
  where status = 'approved'
  group by gift_id
) p on p.gift_id = g.id;
