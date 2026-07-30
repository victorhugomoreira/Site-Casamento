# Painel dos noivos, RSVP e convite virtual

Guia para deixar a área administrativa online. Nada disso exige mexer no código —
só criar o projeto Supabase, colar as chaves e importar a planilha.

## O que foi construído

| Rota | O que é | Acesso |
|------|---------|--------|
| `/admin/login` | Login da noiva/noivo (Supabase Auth) | público (form) |
| `/admin` | Painel: lista de convidados, resumo de RSVP, importar planilha, copiar links | só logado |
| `/admin/presentes` | Cadastro da lista de presentes | só logado |
| `/admin/galeria` | Fotos do carrossel da home: adicionar, reordenar, editar, excluir | só logado |
| `/convite` | Convite virtual **genérico** para compartilhar com todos | público |
| `/convite/{token}` | Convite **personalizado** por casa (já vinculado ao RSVP) | público (link secreto) |
| `/#confirmar-presenca` | Busca por nome + confirmação de presença | público |

A validação usa o número de **lugares (coluna "Total")** da planilha: ninguém confirma
mais pessoas do que o convite permite.

## Passo 1 — Criar o projeto Supabase

1. Acesse https://supabase.com e crie um projeto (guarde a senha do banco).
2. Em **Project Settings → API**, copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (secreta) → `SUPABASE_SERVICE_ROLE_KEY`

## Passo 2 — Criar as tabelas

No painel do Supabase, abra **SQL Editor → New query** e rode os arquivos de
[`supabase/migrations/`](supabase/migrations) **na ordem**, um por vez (cole o conteúdo
e clique em **Run**):

1. `0001_init.sql` — convidados e RSVP
2. `0002_gifts.sql` — lista de presentes
3. `0003_galeria.sql` — galeria de fotos

## Passo 3 — Criar o usuário admin (noiva/noivo)

Em **Authentication → Users → Add user**, crie um usuário com e-mail e senha.
Esse será o login usado em `/admin/login`.
> Em **Authentication → Providers → Email**, deixe "Confirm email" desligado
> (ou confirme o e-mail) para o login funcionar de imediato.

## Passo 4 — Variáveis de ambiente (local)

Copie `.env.local.example` para `.env.local` e preencha as chaves do Passo 1.

```bash
npm install
npm run dev
```

Acesse http://localhost:3000/admin/login e entre com o usuário do Passo 3.

## Passo 5 — Importar a lista de convidados

No painel `/admin`, clique em **Importar planilha (.xlsx)** e envie
`lista/Modelo de lista de convidados 2026 -Bruna e Vitor.xlsx`.

- Cada linha vira uma "casa" (anfitrião + acompanhantes + crianças).
- Reimportar **atualiza** os dados sem apagar os RSVP já respondidos.

## Passo 6 — Compartilhar os convites

No painel:
- **Copiar link do convite** (genérico) → manda no grupo/WhatsApp.
- Na tabela, **Copiar** o link de cada casa → convite personalizado com RSVP embutido.

## Passo 7 — Subir as fotos da galeria

O carrossel da home passa a vir do Supabase, para a noiva escolher as fotos sozinha.
Com o `.env.local` preenchido e o `0003_galeria.sql` já aplicado:

```bash
npm run enviar-galeria
```

Isso manda as 13 fotos de `public/images/carrocel` para o Storage e cria a galeria
inicial. Rodar de novo não duplica nada (só avisa que a galeria já tem fotos).

Depois é tudo pelo painel, em **`/admin/galeria`**:

- **Adicionar fotos** — pode selecionar várias de uma vez. Cada foto é reduzida para
  no máximo 1600px no navegador antes de subir, então dá para mandar direto do celular.
- **Ordem** — arraste os cards (computador) ou use as setas ← → (celular). A posição 1
  é a primeira que aparece no site. A ordem salva sozinha.
- **Editar** (lápis) — legenda da foto (usada no texto alternativo), **Ajustar recorte**
  (reenquadra em 3:4) e **Trocar foto**.
- **Excluir** (lixeira) — remove do site e apaga o arquivo do Storage.

Toda alteração aparece na home na hora (o cache é derrubado automaticamente).

> Enquanto a galeria estiver vazia no Supabase, o site continua mostrando as fotos
> que vêm no código — ele nunca fica sem carrossel.

## Passo 8 — Publicar na Vercel

1. Suba o repositório no GitHub (já está em git).
2. Em https://vercel.com → **New Project** → importe o repositório.
3. Em **Settings → Environment Variables**, adicione as mesmas 4 variáveis do
   `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`).
4. **Deploy**. Depois teste `/admin/login`, o RSVP e um link `/convite/{token}` em produção.

## Segurança

- A lista de convidados **não** é pública: a tabela tem RLS e só o admin logado lê pelo navegador.
- O RSVP público passa por rotas no servidor (`/api/rsvp/*`) que validam o limite de lugares.
- A `service_role` key fica **só no servidor** — nunca a coloque em variável `NEXT_PUBLIC_*`.
