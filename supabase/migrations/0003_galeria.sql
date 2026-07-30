-- Bruna & Victor Hugo — galeria de fotos dinâmica (gerenciada no admin)
-- Rode este arquivo no SQL Editor do Supabase DEPOIS do 0002_gifts.sql.
-- Ele cria a tabela `gallery_photos`, um bucket de Storage público para as fotos
-- e as policies de acesso. Enquanto a tabela estiver vazia, o site continua
-- mostrando as fotos que já vêm no código (public/images/carrocel).

-- ============================================================
-- Tabela
-- ============================================================
create table if not exists public.gallery_photos (
  id          uuid primary key default gen_random_uuid(),
  image_url   text not null,
  caption     text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists gallery_photos_sort_idx
  on public.gallery_photos (sort_order, created_at);

-- updated_at automático (função já criada no 0001_init.sql)
drop trigger if exists gallery_photos_set_updated_at on public.gallery_photos;
create trigger gallery_photos_set_updated_at
  before update on public.gallery_photos
  for each row execute function public.set_updated_at();

-- ============================================================
-- RLS: a galeria é PÚBLICA (aparece no site para todos),
-- mas só o admin autenticado pode adicionar / editar / excluir.
-- ============================================================
alter table public.gallery_photos enable row level security;

drop policy if exists "gallery public read" on public.gallery_photos;
create policy "gallery public read"
  on public.gallery_photos for select
  to anon, authenticated
  using (true);

drop policy if exists "gallery admin write" on public.gallery_photos;
create policy "gallery admin write"
  on public.gallery_photos for all
  to authenticated
  using (true)
  with check (true);

-- ============================================================
-- Storage: bucket público para as fotos da galeria.
-- Leitura liberada para todos; upload/edição/remoção só para o admin.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('gallery-images', 'gallery-images', true)
on conflict (id) do nothing;

drop policy if exists "gallery-images public read" on storage.objects;
create policy "gallery-images public read"
  on storage.objects for select
  using (bucket_id = 'gallery-images');

drop policy if exists "gallery-images admin insert" on storage.objects;
create policy "gallery-images admin insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'gallery-images');

drop policy if exists "gallery-images admin update" on storage.objects;
create policy "gallery-images admin update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'gallery-images');

drop policy if exists "gallery-images admin delete" on storage.objects;
create policy "gallery-images admin delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'gallery-images');

-- Sem seed: rode `npm run enviar-galeria` para subir as fotos que já estão em
-- public/images/carrocel, ou cadastre pelo /admin/galeria.
