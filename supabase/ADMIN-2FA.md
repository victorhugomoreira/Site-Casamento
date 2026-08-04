# Login do admin em duas etapas

O `/admin` deixou de entrar só com e-mail e senha. Agora são duas etapas:

```
1) e-mail + senha  ──> conferidos NO SERVIDOR (a sessão não vai para o browser)
                       5 erros = e-mail bloqueado por 15 min
                          │
                          ▼
2) código enviado por e-mail ──> 5 erros = bloqueado por 15 min
                          │
                          ▼
                   sessão criada, painel liberado
```

O ponto que faz isso ser 2FA de verdade: a etapa 1 valida a senha com um client
descartável e **joga a sessão fora**. Quem sabe só a senha não recebe cookie
nenhum. A sessão só nasce na etapa 2, depois do código.

O que liga uma etapa à outra é um cookie `httpOnly` com o id de um registro em
`admin_login_challenges` — o browser não lê nem forja.

---

## Passo 1 — Deixar o código com 8 dígitos

Painel do Supabase → **Authentication → Emails** → campo **OTP Length**: troque
de `6` para **`8`** e salve. (O Supabase aceita de 6 a 10.)

Sem isso o login continua funcionando, só que com 6 dígitos — o campo da tela
aceita os dois.

## Passo 2 — Fazer o e-mail mostrar o código (obrigatório)

Por padrão o e-mail de "Magic Link" do Supabase manda **só um link**, sem o
código. Assim a etapa 2 fica impossível de concluir.

Painel do Supabase → **Authentication → Emails → Magic Link** e garanta que o
template tem `{{ .Token }}`. Por exemplo:

```html
<h2>Seu código de acesso</h2>
<p>Use este código para entrar no painel:</p>
<p style="font-size:28px;letter-spacing:6px"><strong>{{ .Token }}</strong></p>
<p>Ele vale por 10 minutos. Se não foi você que pediu, ignore este e-mail.</p>
```

> Deixe o `{{ .Token }}` — é ele que vira o código. Pode remover o link.

## Passo 3 — SMTP próprio (antes de usar de verdade)

O SMTP embutido do Supabase é só para desenvolvimento: poucos e-mails por hora
e sem garantia de entrega. Painel → **Project Settings → Authentication → SMTP
Settings** e aponte para um provedor seu.

Enquanto isso não for feito, um bloqueio de 15 minutos somado ao limite de
e-mails pode deixar você sem conseguir entrar.

---

## Destravar um e-mail bloqueado

O bloqueio some sozinho em 15 minutos. Para liberar na hora, no SQL Editor:

```sql
delete from public.admin_login_lockouts where email = 'seu@email.com';
```

## Trocar quem é admin

Só `service_role` mexe em `admin_users` (ninguém se promove pelo painel).
Crie o usuário antes em **Authentication → Users** e depois:

```sql
insert into public.admin_users (user_id, email)
select id, email from auth.users where email = 'novo@exemplo.com';
```

Para tirar o acesso de alguém, além de remover de `admin_users`, derrube as
sessões que já estão abertas — senão a pessoa continua dentro até o token vencer:

```sql
delete from auth.sessions where user_id = '<uuid>';
```
