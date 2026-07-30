-- Bruna & Victor Hugo — quem é admin de verdade
-- Rode no SQL Editor DEPOIS do 0004_payments.sql.
--
-- Até aqui, toda policy do painel dizia apenas `to authenticated`: qualquer
-- pessoa com uma conta no projeto entrava no /admin, via a lista de convidados
-- e mexia nos presentes. Com o cadastro público aberto, isso significava
-- qualquer um. O cadastro foi desligado, mas "estar logado" continua sendo
-- fraco demais para autorizar — então passamos a exigir estar nesta tabela.

-- ============================================================
-- Tabela de admins
-- ============================================================
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);

-- Semeia com quem já tem conta hoje (cadastro público está desligado, então
-- essas contas são as legítimas dos noivos).
insert into public.admin_users (user_id, email)
select id, email from auth.users
on conflict (user_id) do nothing;

-- Trava de segurança: se a semeadura falhar, aborta antes de trocar as
-- policies — caso contrário o painel ficaria inacessível para todo mundo.
do $$
begin
  if not exists (select 1 from public.admin_users) then
    raise exception 'admin_users vazia — abortado para nao trancar o painel';
  end if;
end $$;

-- ============================================================
-- Função usada por todas as policies
-- ============================================================
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- A própria lista de admins: cada um enxerga só o próprio registro, e ninguém
-- se promove pelo client. Incluir admin é operação de service_role.
alter table public.admin_users enable row level security;

drop policy if exists "admin_users self read" on public.admin_users;
create policy "admin_users self read"
  on public.admin_users for select
  to authenticated
  using (user_id = auth.uid());

-- ============================================================
-- Policies existentes: de "logado" para "admin"
-- ============================================================
drop policy if exists "admin full access" on public.households;
create policy "admin full access"
  on public.households for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "gifts admin write" on public.gifts;
create policy "gifts admin write"
  on public.gifts for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "gallery admin write" on public.gallery_photos;
create policy "gallery admin write"
  on public.gallery_photos for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "payments admin read" on public.payments;
create policy "payments admin read"
  on public.payments for select
  to authenticated
  using (public.is_admin());

-- Storage: imagens continuam públicas para leitura, mas só admin envia/apaga.
drop policy if exists "gift-images admin insert" on storage.objects;
create policy "gift-images admin insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'gift-images' and public.is_admin());

drop policy if exists "gift-images admin update" on storage.objects;
create policy "gift-images admin update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'gift-images' and public.is_admin());

drop policy if exists "gift-images admin delete" on storage.objects;
create policy "gift-images admin delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'gift-images' and public.is_admin());

drop policy if exists "gallery-images admin insert" on storage.objects;
create policy "gallery-images admin insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'gallery-images' and public.is_admin());

drop policy if exists "gallery-images admin update" on storage.objects;
create policy "gallery-images admin update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'gallery-images' and public.is_admin());

drop policy if exists "gallery-images admin delete" on storage.objects;
create policy "gallery-images admin delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'gallery-images' and public.is_admin());

-- ============================================================
-- Rastro de quem estornou
-- ============================================================
alter table public.payments
  add column if not exists refunded_by uuid references auth.users(id),
  add column if not exists refunded_at timestamptz;
