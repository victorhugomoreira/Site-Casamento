-- Bruna & Victor Hugo — login do admin em duas etapas
-- Rode no SQL Editor do Supabase DEPOIS do 0006_payment_method.sql.
--
-- Até aqui bastava e-mail + senha para entrar no /admin, sem limite de
-- tentativas: dava para ficar chutando senha à vontade. Agora o login tem
-- duas etapas (senha e depois um código enviado por e-mail) e cada etapa
-- trava depois de 5 erros.
--
-- Estas duas tabelas são escritas SÓ pelas rotas do servidor (service_role).
-- Ninguém as acessa pelo browser — por isso têm RLS ligada e nenhuma policy.

-- ============================================================
-- Etapa 1 (senha): quantas vezes errou e até quando está bloqueado
-- ============================================================
create table if not exists public.admin_login_lockouts (
  email          text primary key,
  password_fails int not null default 0,
  locked_until   timestamptz,
  updated_at     timestamptz not null default now()
);

-- ============================================================
-- Etapa 2 (código por e-mail): um desafio em aberto por tentativa de login.
-- O id é o que vai no cookie httpOnly — é ele que prova que a senha já passou.
-- ============================================================
create table if not exists public.admin_login_challenges (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  otp_fails   int not null default 0,
  expires_at  timestamptz not null,
  consumed_at timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists admin_login_challenges_email_idx
  on public.admin_login_challenges (email, created_at desc);

-- ============================================================
-- RLS sem policy nenhuma: só a service_role enxerga.
-- Sem isso, um convidado com a chave publicável leria os bloqueios.
-- ============================================================
alter table public.admin_login_lockouts   enable row level security;
alter table public.admin_login_challenges enable row level security;

comment on table public.admin_login_lockouts is
  'Tentativas de senha do /admin. 5 erros bloqueiam o e-mail por 15 minutos.';
comment on table public.admin_login_challenges is
  'Login com a senha OK aguardando o codigo do e-mail. Expira em 10 min ou apos 5 erros.';
