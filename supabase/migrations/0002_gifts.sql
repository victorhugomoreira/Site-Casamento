-- Bruna & Victor Hugo — lista de presentes dinâmica (gerenciada no admin)
-- Rode este arquivo no SQL Editor do Supabase DEPOIS do 0001_init.sql.
-- Ele cria a tabela `gifts`, um bucket de Storage público para as imagens
-- e as policies de acesso. A lista começa vazia (cadastro pelo /admin).

-- ============================================================
-- Tabela
-- ============================================================
create table if not exists public.gifts (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  price       numeric(10,2) not null default 0,
  category    text,
  image_url   text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists gifts_sort_idx on public.gifts (sort_order, created_at);

-- updated_at automático (função já criada no 0001_init.sql)
drop trigger if exists gifts_set_updated_at on public.gifts;
create trigger gifts_set_updated_at
  before update on public.gifts
  for each row execute function public.set_updated_at();

-- ============================================================
-- RLS: a lista de presentes é PÚBLICA (aparece no site para todos),
-- mas só o admin autenticado pode criar / editar / excluir.
-- ============================================================
alter table public.gifts enable row level security;

drop policy if exists "gifts public read" on public.gifts;
create policy "gifts public read"
  on public.gifts for select
  to anon, authenticated
  using (true);

drop policy if exists "gifts admin write" on public.gifts;
create policy "gifts admin write"
  on public.gifts for all
  to authenticated
  using (true)
  with check (true);

-- ============================================================
-- Storage: bucket público para as imagens dos presentes.
-- Leitura liberada para todos; upload/edição/remoção só para o admin.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('gift-images', 'gift-images', true)
on conflict (id) do nothing;

drop policy if exists "gift-images public read" on storage.objects;
create policy "gift-images public read"
  on storage.objects for select
  using (bucket_id = 'gift-images');

drop policy if exists "gift-images admin insert" on storage.objects;
create policy "gift-images admin insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'gift-images');

drop policy if exists "gift-images admin update" on storage.objects;
create policy "gift-images admin update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'gift-images');

drop policy if exists "gift-images admin delete" on storage.objects;
create policy "gift-images admin delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'gift-images');

-- Sem seed: a lista começa vazia. Cadastre os presentes pelo /admin.
