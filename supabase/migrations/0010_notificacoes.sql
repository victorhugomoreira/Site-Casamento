-- Bruna & Victor Hugo — avisar a noiva por e-mail
-- Rode no SQL Editor DEPOIS do 0009_admin_sessao.sql.
--
-- Avisa quando alguém responde o RSVP ou quando um presente é pago.
--
-- Por que gatilho no banco, e não uma chamada no código do site: o mesmo dado
-- muda por caminhos diferentes (o convidado pelo site, os noivos pelo painel,
-- o webhook do Mercado Pago numa Edge Function). Amarrando no banco, o aviso
-- sai em qualquer um deles e não existe rota pública servindo de disparador.
--
-- O envio é assíncrono (pg_net): a confirmação de presença não fica esperando
-- o e-mail sair, e um problema no Resend não derruba o RSVP do convidado.

create extension if not exists pg_net with schema extensions;

-- ============================================================
-- Configuração (URL e segredo do notificador)
-- ============================================================
-- Fica em tabela, e não escrito aqui, porque este arquivo vai para o Git —
-- segredo em migration é segredo publicado. Os valores entram depois, por
-- comando à parte (veja supabase/NOTIFICACOES.md).
create table if not exists public.app_config (
  chave text primary key,
  valor text not null
);

-- RLS sem policy: nem anon nem usuário logado leem. Só a service_role e as
-- funções `security definer` daqui de baixo.
alter table public.app_config enable row level security;

-- ============================================================
-- Disparo
-- ============================================================
create or replace function public.notificar(p_payload jsonb)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_url    text;
  v_segredo text;
begin
  select valor into v_url     from public.app_config where chave = 'notify_url';
  select valor into v_segredo from public.app_config where chave = 'notify_secret';

  -- Sem configuração, não faz nada — nunca quebra a operação que disparou.
  if v_url is null or v_segredo is null then
    return;
  end if;

  perform net.http_post(
    url     := v_url,
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'x-notify-secret', v_segredo
               ),
    body    := p_payload
  );
end;
$$;

-- ============================================================
-- RSVP: só quando a resposta muda de fato
-- ============================================================
create or replace function public.trg_notificar_rsvp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Reconfirmar com o mesmo status não gera e-mail novo.
  if new.rsvp_status is distinct from old.rsvp_status
     and new.rsvp_status in ('confirmed', 'declined') then
    perform public.notificar(jsonb_build_object(
      'tipo',      'rsvp',
      'casa',      new.host_name,
      'status',    new.rsvp_status,
      'lugares',   new.confirmed_seats,
      'respondeu', new.responder_name,
      'recado',    new.rsvp_message
    ));
  end if;
  return new;
end;
$$;

drop trigger if exists households_notificar_rsvp on public.households;
create trigger households_notificar_rsvp
  after update on public.households
  for each row execute function public.trg_notificar_rsvp();

-- ============================================================
-- Presentes: só quando o pagamento vira aprovado
-- ============================================================
create or replace function public.trg_notificar_presente()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- `is distinct from` evita reenviar quando o webhook do Mercado Pago repete
  -- a notificação de um pagamento que já estava aprovado.
  if new.status in ('approved', 'authorized')
     and old.status is distinct from new.status then
    perform public.notificar(jsonb_build_object(
      'tipo',     'presente',
      'presente', new.gift_name,
      'valor',    new.amount,
      'de',       new.payer_name,
      'metodo',   new.payment_method,
      'recado',   new.message
    ));
  end if;
  return new;
end;
$$;

drop trigger if exists payments_notificar_presente on public.payments;
create trigger payments_notificar_presente
  after update on public.payments
  for each row execute function public.trg_notificar_presente();

revoke all on function public.notificar(jsonb) from public;

comment on table public.app_config is
  'Configuracao do notificador (URL e segredo). Preenchida fora do Git — ver supabase/NOTIFICACOES.md.';
