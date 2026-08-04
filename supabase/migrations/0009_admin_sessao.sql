-- Bruna & Victor Hugo — validade e exclusividade da sessão do admin
-- Rode no SQL Editor DEPOIS do 0008_rate_limits.sql.
--
-- O 2FA protege a ENTRADA, mas depois de entrar a sessão valia por tempo
-- indeterminado e várias podiam coexistir. Se um token vazasse (um notebook
-- esquecido aberto, um link colado no lugar errado), ele continuaria servindo.
--
-- Duas travas:
--   1. a sessão morre 5 horas depois de criada, mesmo em uso;
--   2. entrar de novo derruba as sessões anteriores — só a atual vale.
--
-- Estas funções mexem em `auth.sessions`, que a API não expõe: por isso são
-- `security definer` e ficam em `public`, chamadas só pelas rotas do servidor.

/**
 * Derruba todas as outras sessões do usuário, preservando a informada.
 * Chamada logo depois de um login completo (senha + código).
 */
create or replace function public.admin_manter_somente_sessao(
  p_user_id    uuid,
  p_session_id uuid
) returns int
language plpgsql
security definer
set search_path = auth, public
as $$
declare
  v_removidas int;
begin
  delete from auth.sessions
  where user_id = p_user_id and id <> p_session_id;

  get diagnostics v_removidas = row_count;
  return v_removidas;
end;
$$;

/**
 * Há quantos minutos a sessão existe. Devolve null se ela já não existe
 * (foi derrubada por outro login ou por expiração).
 */
create or replace function public.admin_idade_sessao_minutos(p_session_id uuid)
returns int
language sql
security definer
set search_path = auth, public
as $$
  select (extract(epoch from (now() - created_at)) / 60)::int
  from auth.sessions
  where id = p_session_id;
$$;

/** Apaga a sessão informada — usado quando ela passa da validade. */
create or replace function public.admin_encerrar_sessao(p_session_id uuid)
returns void
language sql
security definer
set search_path = auth, public
as $$
  delete from auth.sessions where id = p_session_id;
$$;

-- Quem chama é o servidor, com a service_role. Nem anon nem usuário logado
-- podem tocar nisso — senão daria para derrubar a sessão de outra pessoa.
revoke all on function public.admin_manter_somente_sessao(uuid, uuid) from public;
revoke all on function public.admin_idade_sessao_minutos(uuid)        from public;
revoke all on function public.admin_encerrar_sessao(uuid)             from public;
