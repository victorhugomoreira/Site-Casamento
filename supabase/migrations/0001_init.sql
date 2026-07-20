-- Bruna & Victor — schema inicial
-- Rode este arquivo no SQL Editor do Supabase (ou via `supabase db push`).

-- Extensão para gen_random_bytes / gen_random_uuid
create extension if not exists pgcrypto;

-- Gera um token curto url-safe para o link do convite
create or replace function public.gen_invite_token()
returns text
language sql
volatile
as $$
  select replace(replace(replace(encode(gen_random_bytes(9), 'base64'), '+', '-'), '/', '_'), '=', '');
$$;

-- Uma linha por "casa" / convite (o anfitrião + acompanhantes + crianças)
create table if not exists public.households (
  id             uuid primary key default gen_random_uuid(),
  host_name      text not null,
  phone          text,
  companions     jsonb not null default '[]'::jsonb,  -- ["Nome 1", "Nome 2"]
  children       jsonb not null default '[]'::jsonb,  -- [{"name":"...","age":6}]
  max_seats      int  not null default 1,             -- limite de lugares (validação do RSVP)
  paying_count   int,
  invite_token   text not null unique default public.gen_invite_token(),
  rsvp_status    text not null default 'pending' check (rsvp_status in ('pending','confirmed','declined')),
  confirmed_seats int,
  rsvp_message   text,
  responder_name text,
  confirmed_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint confirmed_seats_within_max check (confirmed_seats is null or (confirmed_seats >= 0 and confirmed_seats <= max_seats))
);

create index if not exists households_host_name_idx on public.households using gin (to_tsvector('simple', host_name));
create index if not exists households_status_idx on public.households (rsvp_status);

-- updated_at automático
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists households_set_updated_at on public.households;
create trigger households_set_updated_at
  before update on public.households
  for each row execute function public.set_updated_at();

-- ============================================================
-- RLS: a lista de convidados NÃO é pública.
-- Só usuários autenticados (admin/noiva) leem e escrevem pelo client.
-- O RSVP público passa por route handlers server-side usando a
-- service_role key (que ignora RLS), então não precisa de policy anônima.
-- ============================================================
alter table public.households enable row level security;

drop policy if exists "admin full access" on public.households;
create policy "admin full access"
  on public.households
  for all
  to authenticated
  using (true)
  with check (true);
