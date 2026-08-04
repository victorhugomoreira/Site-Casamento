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

## Passo 1 — SMTP próprio (faça primeiro: destrava os outros dois)

Em **03/06/2026** o Supabase passou a proibir editar template de e-mail em
projeto free no SMTP embutido (havia gente reescrevendo o template de auth com
phishing e disparando pela infra deles). Projetos criados antes daquela data
foram poupados; **este é de 20/07/2026**, então a regra vale.

Consequência prática: sem SMTP próprio o template fica travado no padrão, que
manda **só um link e nenhum código** — e aí a etapa 2 é impossível de concluir.

Com uma conta no [Resend](https://resend.com) (3.000 e-mails/mês no free), pegue
uma API key e preencha em **Project Settings → Authentication → SMTP Settings**:

| Campo | Valor |
| --- | --- |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | a API key (`re_...`) |
| Sender email | `onboarding@resend.dev` |
| Sender name | `Bruna & Victor Hugo` |

> Sem domínio verificado, o Resend só entrega para o e-mail da própria conta.
> Como o código só vai para o admin, isso não atrapalha — mas se um dia outra
> pessoa também for receber código, verifique um domínio antes.

## Passo 2 — Fazer o e-mail mostrar o código

Painel do Supabase → **Authentication → Emails → Magic Link**:

```html
<h2>Seu código de acesso</h2>
<p>Use este código para entrar no painel:</p>
<p style="font-size:28px;letter-spacing:6px"><strong>{{ .Token }}</strong></p>
<p>Ele vale por 10 minutos. Se não foi você que pediu, ignore este e-mail.</p>
```

**Não deixe o `{{ .ConfirmationURL }}` no template.** Aquele link entra no painel
sozinho, sem passar pela senha — ou seja, anula a verificação em duas etapas.
Dá para conferir no token que ele gera: vem com `"amr":[{"method":"otp"}]`,
sem rastro da etapa da senha. O que queremos é só o `{{ .Token }}`.

## Passo 3 — Deixar o código com 8 dígitos

Na mesma tela, campo **OTP Length**: troque `6` por **`8`** e salve (aceita de
6 a 10). O campo da tela de login aceita os dois tamanhos, então isso é só para
ficar como foi pedido.

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
