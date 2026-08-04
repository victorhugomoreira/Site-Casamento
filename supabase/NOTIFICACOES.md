# Avisos por e-mail para a noiva

A noiva recebe um e-mail quando:

- alguém **confirma** presença ou avisa que **não vai** (`households.rsvp_status` muda);
- um **presente é pago** (`payments.status` vira `approved` / `authorized`).

```
convidado confirma / paga
        │
        ▼
  gatilho no banco  ──(pg_net, assíncrono)──▶  notificar-noiva  ──▶  Resend ──▶ e-mail
```

## Por que gatilho no banco, e não uma chamada no código

O mesmo dado muda por caminhos diferentes: o convidado pelo site, os noivos
pelo painel, e o webhook do Mercado Pago dentro de uma Edge Function. Amarrando
no banco, o aviso sai em qualquer um deles — e não sobra nenhuma rota pública
que dê para usar como disparador de spam.

O envio é **assíncrono** (`pg_net`): a confirmação de presença não fica
esperando o e-mail sair, e um problema no Resend nunca derruba o RSVP de um
convidado.

## Onde fica cada configuração

| Item | Onde | Para quê |
| --- | --- | --- |
| `RESEND_API_KEY` | Secret da Edge Function | autenticar no Resend |
| `NOTIFY_SECRET` | Secret da Edge Function | o gatilho prova que é ele chamando |
| `NOTIFY_TO` | Secret da Edge Function | para quem avisar |
| `NOTIFY_FROM` | Secret (opcional) | remetente; padrão `nao-responda@moreiraprodutosgraficos.pro` |
| `notify_url` / `notify_secret` | tabela `public.app_config` | o que o gatilho usa para chamar |

> `NOTIFY_SECRET` (na função) e `app_config.notify_secret` (no banco) precisam
> ter **o mesmo valor** — é o que a função confere antes de enviar. Se ficarem
> diferentes, todo aviso passa a voltar `401` e nenhum e-mail sai.
>
> O segredo não está em nenhuma migration de propósito: este repositório vai
> para o Git, e segredo em migration é segredo publicado.

## Trocar quem recebe

```bash
npx supabase secrets set NOTIFY_TO=outro@email.com --project-ref ssbszqgtqdyblrvxguij
```

Para avisar mais de uma pessoa, é preciso ajustar a função — hoje o campo `to`
manda para um destinatário só.

## Conferir se um aviso saiu

Todo disparo fica registrado. `status_code` 200 quer dizer que o Resend aceitou:

```sql
select id, status_code, left(content, 120) as resposta, error_msg
from net._http_response
order by id desc
limit 10;
```

Se aparecer `401`, os dois segredos estão diferentes (veja a tabela acima).
Se aparecer `502`, o Resend recusou — o motivo fica no log da função, em
**Edge Functions → notificar-noiva → Logs**.

## O que NÃO gera aviso

- Cobrança **criada** mas ainda não paga (só `approved`/`authorized` avisam).
- Webhook do Mercado Pago repetindo um pagamento **já aprovado** — o gatilho
  compara com o status anterior, então não manda o mesmo aviso duas vezes.
- Convidado reconfirmando com **a mesma resposta** de antes.
- Pagamento **estornado** (`refunded`).
