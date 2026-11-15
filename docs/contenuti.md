# City Of — Piano dei contenuti (SEO e GEO)

Come sono organizzati i contenuti del sito e cosa va scritto. Le regole di scrittura sono in `metodo.md`.
I volumi di ricerca non sono ancora stati verificati: l'ordine qui sotto è per intenzione d'acquisto, da confermare con la skill `keyword-deep-dive` prima di scrivere.

## Tipi di pagina

| Tipo | Indirizzo | Scopo | File |
|---|---|---|---|
| Home City Of | `/` | Marchio e scelta della città | `src/app/page.tsx` |
| Area | `/amalfi-coast` | Porta alle città della costa | `src/app/amalfi-coast/page.tsx` |
| Città | `/amalfi-coast/sorrento` | Categorie, scelti da noi, guide | `content/cities.json` |
| Categoria | `/amalfi-coast/sorrento/boat-tours` | Elenco di una categoria | `content/categories.json` |
| Landing | `/amalfi-coast/sorrento/private-boat-tours` | Pagina d'arrivo di annunci e ricerche mirate | `content/landings/<città>/` |
| Esperienza | `/amalfi-coast/sorrento/boat-tours/private-boat-capri` | Scheda prenotabile | `content/experiences/<città>/` |
| Guida | `/amalfi-coast/sorrento/guides/…` | Pillar, pagine locali, informazioni pratiche | `content/guides/<città>/` |

Per aggiungere una pagina basta aggiungere un file: sitemap, collegamenti nel piè di pagina, dati strutturati e `llms.txt` si aggiornano da soli.

## Tre famiglie di guide

- **Pillar** (`type: pillar`): guide lunghe che rispondono a una domanda d'acquisto. Ogni pillar punta a una landing e alle esperienze della sua categoria.
- **Locali** (`type: local`): una pagina per luogo (marine, spiagge, frazioni, belvedere). Sono il contenuto che un portale generalista non scrive bene e che dimostra che siamo del posto.
- **Pratiche** (`type: practical`): orari, collegamenti, come arrivare. Portano traffico tutto l'anno, come su Sorrento Insider, e rimandano a transfer e barche.

## Sorrento: cosa scrivere

**Scritte (14 novembre 2026), da fonti pubbliche verificate:**
1. Quanto costa davvero una barca privata da Sorrento
2. Barca privata o condivisa: come scegliere
3. Da Sorrento a Capri in barca: traghetto, tour condiviso o barca privata
4. Marina Piccola
5. Marina Grande
6. Dall'aeroporto di Napoli a Sorrento

Come sono state fatte: due agenti hanno raccolto i fatti con fonte e grado di affidabilità, un terzo ha riletto ogni guida riga per riga contro quei fatti. Limiti: nessuna fonte ufficiale era raggiungibile (compagnie di traghetti, Comune, Curreri, EAV), quindi i numeri vengono da listini pubblici e pagine di Sorrento Insider; dove le fonti non concordano la guida dà un intervallo e lo dice. Manca ancora ciò che solo chi vive a Sorrento sa: tempi a piedi, dettagli dei luoghi, prezzi reali dei partner. Vanno riviste da Luigi prima del lancio.

Ogni guida ha: risposta breve in apertura, punti chiave, indice, tabelle, fonti con data di controllo, domande frequenti, collegamenti a landing e ad altre guide, schede prenotabili in fondo.

**Da aggiungere dopo:**
- Pillar: Capri o Costiera Amalfitana in barca; cosa aspettarsi da una cooking class; un giorno a Sorrento da crociera; Sorrento mese per mese (12 pagine).
- Locali: Bagni della Regina Giovanna, Punta Campanella, Sant'Agnello, Massa Lubrense, Nerano e Marina del Cantone, i belvedere.
- Pratiche: traghetti Sorrento–Capri, bus Sorrento–Positano, Circumvesuviana, parcheggi, Sorrento–Pompei.

## Regole per farsi trovare e citare

- **Risposta subito.** Ogni guida apre con la risposta in due o tre frasi, poi il dettaglio. È ciò che i motori e gli assistenti AI riportano.
- **Numeri e tabelle.** Prezzi, durate, orari in tabella, con la data dell'ultimo controllo. Niente cifre non verificate.
- **Domande vere.** Le domande frequenti si prendono da WhatsApp e dalle recensioni dei concorrenti, con le parole del cliente.
- **Chi scrive.** Ogni guida mostra autore e data di aggiornamento. Quando ci saranno, nomi e volti di chi vive a Sorrento.
- **Un dettaglio locale per pagina.** Qualcosa che un portale non sa.
- **Collegamenti interni.** Guida → landing → esperienza, e ritorno. Ogni guida ha una categoria collegata (`related`).
- **Dati strutturati solo veri.** Prezzo e partner entrano nei dati strutturati quando sono reali; nessuna recensione finché non esiste.
- **`llms.txt`** riassume il sito per gli assistenti AI e si genera dai contenuti.

## Prima del lancio

- Mettere `NEXT_PUBLIC_INDEXABLE=true` (oggi il sito chiede di non essere indicizzato perché i contenuti sono segnaposto).
- Sostituire ogni `[SEGNAPOSTO]` e togliere `draft: true` solo alle guide scritte e verificate.
- Impostare `NEXT_PUBLIC_SITE_URL` e `NEXT_PUBLIC_WHATSAPP_NUMBER`.
