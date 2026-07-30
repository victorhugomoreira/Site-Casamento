# Site-Casamento

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

## Built with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below -- start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` will automatically deploy.

[Continue working on v0 →](https://v0.app/chat/projects/prj_siXpFDZxcICDGx4mTHPmqqqNCE8e)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Fotos do site

**Nunca coloque uma foto direto da câmera em `public/images/`.** Uma foto de 4 MB é
baixada inteira pelo celular do convidado e derruba o carregamento do site.

O fluxo correto:

1. Coloque os arquivos originais em `../_originais-fotos/`, seguindo a estrutura:
   - raiz → `hero`, `nossa-historia`, cards de local
   - `carrocel/` → fotos iniciais da galeria (hoje a galeria é editada no
     `/admin/galeria`; estas ficam como reserva — ver README-ADMIN.md)
   - `gifts/` → imagens de presentes
2. Rode `npm run otimizar-imagens`

O script gera versões WebP no tamanho que o site realmente usa (`public/images/`).
Na prática isso levou as fotos de **68 MB para 2,4 MB**, sem diferença visível.

> O script usa o `sharp`, que vem junto com o Next. Se você instalar as dependências
> com `pnpm` e der erro de módulo não encontrado, rode `pnpm add -D sharp` — o pnpm
> não expõe dependências indiretas por padrão. Isso não afeta o build nem o deploy.

`_originais-fotos/` fica fora do Git e fora do deploy — é só o seu backup local.
Imagens que não são usadas no site ficam em `_originais-fotos/_nao-usadas/`.

### Cache

- Imagens: 7 dias "fresco" + 30 dias servindo do cache enquanto revalida
  (`next.config.mjs`). Quem já visitou o site recarrega instantaneamente.
- Home e `/presentes`: páginas estáticas revalidadas a cada 5 min. Ao editar a lista
  de presentes ou a galeria no admin, o cache é derrubado na hora (`app/actions.ts`),
  sem esperar os 5 min.

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.
