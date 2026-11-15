# City Of

Guida pratica e prenotabile delle città di mare: un GetYourGuide migliore e davvero locale. Lancio: City of Sorrento (sito d'area Amalfi Coast), poi City of Positano. Categorie al lancio: barche private e semi-private, cooking class, transfer.

## Da leggere prima di lavorare
- `docs/brief.md` — idea, decisioni, questioni aperte, filoni di lavoro. È la fonte di verità: aggiornalo a fine sessione.
- `docs/contenuti.md` — tipi di pagina, piano di pillar e pagine locali, regole SEO e GEO.
- `docs/metodo.md` — come si scrivono pagine, articoli, email e automazioni per City Of.
- `brand/brand-guidelines.md` — regole di marca.
- `src/app/globals.css` — colori e carattere del sito (Bricolage Grotesque). Il sito non segue più i caratteri del brand kit; `brand/` resta come archivio di loghi e colori città.

## Da non leggere
- `brand/brand-identity-canvas/sorgente/` — archivio pesante (400 KB). Aprire solo `Home-Timone` o `Intro-Animazione` quando si rifanno in codice.

## Regole
- Nome: "City Of" (marchio madre), "City of Sorrento" (città). Mai CityOf o City-Of.
- I testi del sito sono in inglese. Niente punti esclamativi, "luxury", "unforgettable", "hidden gem", urgenze finte. Prezzo sempre dichiarato prima.
- Il partner che eroga il servizio è sempre dichiarato.
- Sito: Next.js (TypeScript, Tailwind), pubblicazione su Vercel. Pagine in `src/app/`, contenuti in `content/` (un file = una pagina). Asset pronti in `public/`.
- Mai inventare prezzi, partner, orari o recensioni: finché non sono confermati si usa un segnaposto tra parentesi quadre.
- Verifica prima di chiudere: `npx tsc --noEmit` e `npx next build`.
- Con Luigi si parla in italiano.
