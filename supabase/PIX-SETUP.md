# PIX via Mercado Pago — o que colar no Supabase

Toda a lógica de pagamento roda dentro do Supabase. O front só manda o `gift_id`
e recebe o QR Code — ele nunca decide o valor e nunca marca nada como pago.

```
navegador                Supabase Edge Functions            Mercado Pago
   |                                |                            |
   |-- gift_id ------------------->  create-pix-payment           |
   |                                |-- lê preço em `gifts`       |
   |                                |-- grava em `payments`       |
   |                                |-- cria cobrança ----------> |
   |<-- QR Code --------------------|                             |
   |                                |                             |
   |-- payment_id (a cada 5s) ----> pix-payment-status            |
   |                                |                             |
   |                                mercadopago-webhook <-------- | pagamento aprovado
   |                                |-- reconsulta o MP e grava   |
   |<-- "pago!" --------------------|                             |
```

---

## Passo 1 — Criar as tabelas

SQL Editor do Supabase → cole e rode o conteúdo de
[`migrations/0004_payments.sql`](./migrations/0004_payments.sql).

Cria a tabela `payments` (com RLS: só a service_role escreve, o admin logado lê)
e a view `gifts_with_payments`, que mostra quanto já entrou por presente.

Depois rode [`migrations/0005_admin_guard.sql`](./migrations/0005_admin_guard.sql),
que cria `admin_users` e a função `is_admin()`. Sem ele, "estar logado" autoriza
tudo no painel — e o estorno recusa qualquer chamada, porque não acha ninguém em
`admin_users`.

> Ele se semeia com as contas que já existem em `auth.users`. Confira depois:
> ```sql
> select email from public.admin_users;
> ```
> Para incluir alguém mais tarde — como o cadastro público fica desligado, crie
> o usuário antes em Authentication → Users:
> ```sql
> insert into public.admin_users (user_id, email)
> select id, email from auth.users where email = 'novo@exemplo.com';
> ```

## Passo 2 — Cadastrar as secrets

Painel do Supabase → **Project Settings → Edge Functions → Secrets** → *Add new secret*:

| Nome | Valor |
| --- | --- |
| `MERCADO_PAGO_ACCESS_TOKEN` | o Access Token da sua aplicação no Mercado Pago |
| `MERCADO_PAGO_WEBHOOK_SECRET` | a "assinatura secreta" do Passo 4 (volte aqui depois) |

`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` já são injetadas automaticamente —
não precisa cadastrar.

## Passo 3 — Publicar as quatro funções

Painel do Supabase → **Edge Functions → Deploy a new function** → cole o conteúdo
de cada arquivo:

| Nome da função | Arquivo | Verify JWT |
| --- | --- | --- |
| `create-pix-payment` | [`functions/create-pix-payment/index.ts`](./functions/create-pix-payment/index.ts) | **desligado** — convidado usa sem login |
| `pix-payment-status` | [`functions/pix-payment-status/index.ts`](./functions/pix-payment-status/index.ts) | **desligado** — idem |
| `mercadopago-webhook` | [`functions/mercadopago-webhook/index.ts`](./functions/mercadopago-webhook/index.ts) | **desligado** (obrigatório — o Mercado Pago não manda JWT) |
| `refund-payment` | [`functions/refund-payment/index.ts`](./functions/refund-payment/index.ts) | **ligado** — mexe com dinheiro |

O nome precisa ser exatamente esse: o front chama pelo nome e o webhook é
montado a partir dele.

As três primeiras são abertas de propósito: quem gera o QR é um convidado sem
conta. A segurança delas não está no login e sim no que fazem — o valor vem do
banco, e o webhook confere assinatura e reconsulta o pagamento na origem.

`refund-payment` é o oposto: além do JWT, ela verifica dentro da própria função
se o usuário está em `admin_users`. Só a sessão não basta, e a chave publicável
do projeto não serve de senha.

> Se preferir a CLI, depois de `npx supabase login`:
> ```bash
> npx supabase functions deploy create-pix-payment  --no-verify-jwt --project-ref ssbszqgtqdyblrvxguij
> npx supabase functions deploy pix-payment-status  --no-verify-jwt --project-ref ssbszqgtqdyblrvxguij
> npx supabase functions deploy mercadopago-webhook --no-verify-jwt --project-ref ssbszqgtqdyblrvxguij
> npx supabase functions deploy refund-payment      --project-ref ssbszqgtqdyblrvxguij
> ```

## Passo 4 — Configurar o webhook no Mercado Pago

Painel do Mercado Pago → **Suas integrações → (sua aplicação) → Webhooks →
Configurar notificações**:

- **URL:**
  ```
  https://ssbszqgtqdyblrvxguij.supabase.co/functions/v1/mercadopago-webhook
  ```
- **Evento:** marque apenas **Pagamentos**
- Salve. O painel mostra a **assinatura secreta** — copie e cadastre como
  `MERCADO_PAGO_WEBHOOK_SECRET` no Passo 2.

Sem essa secret o webhook rejeita tudo com `500 not configured` — é proposital,
para ninguém conseguir marcar presente como pago chamando a URL na mão.

## Passo 5 — Testar

1. Abra `/presentes`, escolha um presente, clique em **Gerar QR Code PIX**.
2. O QR aparece e a tela fica "Aguardando o pagamento".
3. Pague pelo app do banco (ou pela conta de teste do Mercado Pago).
4. Em até ~5s a tela vira **Pagamento confirmado**.

Para acompanhar do lado de cá:

```sql
select created_at, gift_name, amount, payer_name, status, paid_at
from public.payments
order by created_at desc
limit 20;
```

Se algo falhar, os logs ficam em **Edge Functions → (função) → Logs**.

---

## Detalhes que valem saber

- **O valor vem do banco.** `create-pix-payment` lê `gifts.price` com a
  service_role. Mesmo que alguém adultere a chamada, o valor cobrado é o
  cadastrado no admin.
- **O webhook não confia no corpo da requisição.** Ele valida o HMAC do header
  `x-signature` e, ainda assim, reconsulta o pagamento na API do Mercado Pago
  antes de gravar `status`.
- **`pix-payment-status` tem um plano B.** Se o webhook ainda não chegou, ele
  pergunta direto ao Mercado Pago. Por isso o fluxo funciona em `localhost`
  mesmo antes do Passo 4 — mas configure o webhook mesmo assim, senão um
  pagamento feito com a aba fechada nunca é registrado.
- **O QR expira em 30 minutos** (`EXPIRES_IN_MINUTES` em
  `create-pix-payment/index.ts`). Depois disso a tela oferece gerar outro.
- **`payments` não é legível pelo browser.** Nenhuma policy para `anon`; o
  status sai só pela Edge Function, e só para quem tem o `payment_id` (uuid).
- **O convidado não perde o QR se recarregar.** O `payment_id` fica no
  localStorage e serve de token daquela cobrança; o QR em si continua vindo do
  servidor, então não existe QR vencido preso no navegador.
- **Estorno fica em `/admin/recebidos`**, com confirmação. A chave de
  idempotência é amarrada ao pagamento, então clique duplo não estorna duas
  vezes. Fica registrado em `refunded_by` / `refunded_at`.

## Configuração de autenticação

Feita via painel (Authentication → Providers / Sessions), fora das migrations:

| Ajuste | Valor | Por quê |
| --- | --- | --- |
| Allow new users to sign up | **desligado** | com ele ligado, qualquer um criava conta e entrava no `/admin` |
| Access token expiry | **900s** (15 min) | janela curta caso um token vaze |
| Refresh token rotation | ligado | o refresh muda a cada uso |
| Reuse interval | 10s | tolera corrida de requisições sem abrir brecha |

`Sessions → Inactivity timeout` encerraria sessão parada, mas exige plano Pro.
