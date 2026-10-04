# CDW: front da loja (cdwloja.com)

Redesign da loja do servidor da CDW na identidade "gelo líquido": azul do líquido da logo, fundo gelo e superfícies prateadas. Mesma stack do front anterior (Vite, React 19, React Router 7, Tailwind 4, motion) e a mesma API: catálogo, Pix (QR, copia e cola e status por SSE), conta, vínculo do Discord e admin continuam no backend atual.

## Rodar

```bash
npm install
npm run dev:mock      # API simulada, sem tocar em produção (http://localhost:5173)
npm run dev           # repassa /api para https://cdwloja.com (use só para ver dados públicos)
npm run build         # gera dist/
npm run preview:mock  # serve dist/ com a API simulada (http://localhost:4173)
npm test              # regras portadas do front anterior (validações, rótulos, busca)
```

`CDW_API_TARGET=https://outro-endereco npm run dev` troca o destino do proxy.

Para abrir no celular ou mandar o link, um túnel do Cloudflare funciona direto (`cloudflared tunnel --url http://localhost:4173`): os servidores aceitam qualquer `*.trycloudflare.com`. Outros túneis entram em `CDW_ALLOWED_HOSTS`, separados por vírgula (ex.: `CDW_ALLOWED_HOSTS=.ngrok-free.app`). Qualquer outro host continua bloqueado.

### API simulada (`dev/mock-api.ts`, `dev/mock-admin.ts`)

Só existe em desenvolvimento; não entra no build. Contas de teste, todas com a senha `cdw12345`:

| Conta | Situação |
|---|---|
| `membro` | Discord vinculado, sem VIP |
| `novato` | sem Discord |
| `vip` | VIP God ativo |
| `admin` | administrador |

O código do Discord é `123456`. O Pix é confirmado sozinho em 9 segundos (`MOCK_PAY_AFTER_MS`, `0` desliga) ou na hora com `POST /api/__mock/pay/:id`. Os números de receita do admin são fictícios.

## Publicar

1. `npm run build`.
2. Troque os arquivos estáticos que o backend serve hoje pelo conteúdo de `dist/` (inclui `assets/`, `brand/`, `intros/cards/`, `og.jpg` e os favicons).
3. O backend precisa continuar devolvendo o `index.html` para rotas desconhecidas (já faz isso hoje). Há duas rotas públicas novas: `/planos` e `/planos/:planKey`.

Compatível com o CSP atual: nenhum script inline, fontes auto-hospedadas, imagens só de `self`, `data:` e CDN do Discord, Turnstile do Cloudflare como antes.

## Onde está cada coisa

| Pasta | Conteúdo |
|---|---|
| `src/pages` | loja pública: início, catálogo, página do plano, divulgação, ranking, login, senha, 404 |
| `src/painel` | área do membro: VIP, tag, call, planos, checkout Pix, compras, divulgações, perfil |
| `src/admin` | administração: visão geral, pedidos, receita, divulgações, usuários, VIPs, planos |
| `src/components` | header, rodapé, busca, cards de plano, prévias do Discord, seletor de cor |
| `src/lib` | cliente da API, autenticação, hooks, formatação, regras de catálogo e divulgação |
| `src/content/copy.ts` | textos reais da loja (dúvidas, passos) |
| `public/brand` | GIF da marca convertido em vídeo (WebM 208 KB, MP4 265 KB) e pôster estático |

## Decisões

- **Sem carrinho**: a loja vende um plano ou pacote por pedido. O header leva a "Minhas compras" e avisa quando há Pix aberto.
- **Busca** (Ctrl K ou `/`): planos, pacotes, páginas e dúvidas, sem chamada extra à API.
- **Líquido como assinatura**: aparece só onde algo enche ou esvazia (dias de VIP, prazo do Pix, ranking) e na palavra "VIP" da abertura.
- **Rostos em call na abertura**: a API pública conta quem está em call (`/stats`), mas não diz quem é, e o widget do Discord está desligado. Os avatares em volta do medalhão vêm do ranking semanal de tempo em call (`/ranking?period=week&metric=voice`), com a legenda "Quem mais fica em call esta semana". Para mostrar quem está em call agora, o backend precisa expor essa lista.
- **Movimento reduzido**: sem vídeo (pôster estático), sem ondas nem flutuação.
- **GSAP removido**: as animações usam CSS e motion; nada depende da rolagem.
- **Rodapé só com links reais**: a loja não tem páginas de política nem contato próprio; o suporte é a staff no servidor.
