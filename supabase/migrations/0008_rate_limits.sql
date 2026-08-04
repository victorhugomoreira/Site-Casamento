-- Bruna & Victor Hugo — limite de chamadas por IP
-- Rode no SQL Editor DEPOIS do 0007_admin_2fa.sql.
--
-- As rotas de convidado são abertas de propósito (quem confirma presença ou
-- gera um PIX não tem login). Ninguém consegue roubar dinheiro por elas — o
-- valor sempre vem da tabela `gifts` —, mas dá para chamá-las em looping e
-- fazer bagunça: encher a conta do Mercado Pago de cobranças pendentes, poluir
-- `payments` e raspar a lista de convidados pela busca por nome.
--
-- O contador precisa ser compartilhado: as rotas do site rodam na Vercel e as
-- Edge Functions no Supabase, então memória de processo não serve.

create table if not exists public.rate_limits (
  bucket       text        not null,
  window_start timestamptz not null,
  hits         int         not null default 1,
  primary key (bucket, window_start)
);

-- Só a service_role escreve aqui (as rotas usam ela). Sem policy nenhuma,
-- ninguém lê pelo browser — senão dava para descobrir quem está sendo limitado.
alter table public.rate_limits enable row level security;

/**
 * Conta uma chamada e diz se ela pode passar.
 *
 * Janela fixa: divide o tempo em blocos de `p_window_seconds` e conta quantas
 * chamadas o mesmo `p_bucket` fez no bloco atual. Devolve false quando estourou.
 *
 * Fica em `security definer` porque a tabela tem RLS sem policy — só assim a
 * função consegue escrever nela.
 */
create or replace function public.rate_limit_hit(
  p_bucket         text,
  p_limit          int,
  p_window_seconds int
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window timestamptz;
  v_hits   int;
begin
  v_window := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.rate_limits (bucket, window_start, hits)
  values (p_bucket, v_window, 1)
  on conflict (bucket, window_start)
  do update set hits = rate_limits.hits + 1
  returning hits into v_hits;

  -- Janelas velhas deste mesmo bucket não servem mais: apagar aqui evita que a
  -- tabela cresça para sempre e dispensa uma rotina de limpeza.
  delete from public.rate_limits
  where bucket = p_bucket and window_start < v_window;

  return v_hits <= p_limit;
end;
$$;

-- Nem anon nem usuário logado chamam isso direto — quem chama são as rotas do
-- servidor, com a service_role.
revoke all on function public.rate_limit_hit(text, int, int) from public;

comment on table public.rate_limits is
  'Contador de chamadas por IP das rotas publicas. Limpa sozinho: cada hit apaga as janelas anteriores do mesmo bucket.';
