# City Of

Sito di agenzia con un sotto-sito per ogni città. Oggi: **City of Sorrento**.

## Struttura
- `brand/` — brand kit completo (loghi, favicon, colori, font, 3D, video, social, pitch). Parti da `brand/LEGGIMI.md`; le regole sono in `brand/brand-guidelines.md`.
- `brand/brand-identity-canvas/` — la brand identity visiva: link al canvas di Claude (https://claude.ai/artifact/G57vPzyRGQrKaY2taratDq) e copia d'archivio delle tavole.
- `public/` — file già pronti per il sito: favicon e icone di City of Sorrento, anteprime dei link, loghi SVG, intro e timone in loop.
- `styles/tokens.css` — colori, font e curve di movimento come variabili CSS. Il colore città si cambia con `data-city="sorrento"`.

## Il sito
Next.js con TypeScript e Tailwind. I contenuti sono file in `content/`.

```bash
npm install
```
```bash
npm run dev
```

- `src/app/` — pagine: home City Of con il timone, area, città, categorie e landing, schede esperienza, guide.
- `content/` — città, categorie, esperienze, landing e guide. Aggiungere un file aggiunge una pagina.
- `docs/` — `brief.md` (decisioni), `metodo.md` (come si scrive), `contenuti.md` (piano SEO e GEO).
- Variabili: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_INDEXABLE` (`true` solo al lancio).

## Note sul brand kit
1. Importa `styles/tokens.css`.
2. Incolla nel `<head>` le righe di `brand/02-favicon-app/head-snippet.html`.
3. Logo in linea e codice dei video: `brand/09-web/`.

Nuova città: `brand/01-logo/nuove-citta/LEGGIMI.txt`.
