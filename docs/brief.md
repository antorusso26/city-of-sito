# City Of — Brief di impostazione

Versione 0.8 · 13 novembre 2026 · bozza da validare con il co-founder.
Questo è il documento di riferimento: ogni sessione di lavoro parte da qui.

## 1. L'idea in una frase

City Of è un'agenzia di marketing e vendita per servizi turistici locali premium e semi-premium. Porta il cliente (annunci, ricerca, outbound), chiude la prenotazione su WhatsApp e trattiene un acconto che coincide con la sua commissione. Il servizio lo eroga un partner locale dichiarato.

Lungo termine: agenti AI che trovano i partner in ogni città, parlano con i clienti su WhatsApp e fanno outbound. Breve termine: due città, lavoro strategico fatto da noi, operatività esternalizzata ad agenti dove possibile.

## 2. Decisioni prese

| Tema | Decisione |
|---|---|
| Città di lancio | City of Sorrento, poi City of Positano |
| Posizionamento | Ogni City of è la guida pratica e prenotabile della città: prende il posto di Sorrento Insider. Un GetYourGuide e un Airbnb Experiences migliore e davvero locale. Non solo barche: tutte le esperienze e i servizi turistici della città |
| Categoria di partenza | Tour in barca privati e semi-privati sono la prima categoria da riempire e da spingere con gli annunci, non l'unica |
| Categorie al lancio | Barche private e semi-private (con landing dedicate), cooking class, transfer |
| Prenotazione al lancio | Richiesta su WhatsApp da ogni scheda, acconto gestito da noi. Pagamento online in un secondo momento |
| SEO e GEO | Priorità alta: pillar e pagine locali per ogni città. Sei guide di Sorrento scritte da fonti pubbliche verificate, da rivedere con conoscenza locale. Piano in `docs/contenuti.md` |
| Home | Apertura sul modello di bigstars.com: titolo enorme a sinistra, timone a destra su un disco nel colore della città, barra a pillola. Sotto, catalogo a schede sul modello di Sorrento Insider (ricerca, "Plan your day", una fila di schede per categoria, guide) |
| Stile del sito | Un solo carattere, Bricolage Grotesque: titoli stretti e pesanti, testo regolare. Blu pieno per i titoli, crema e bianco per i fondi. Sostituisce Instrument Serif e Archivo sul sito; il brand kit in `brand/` non è stato modificato e va riallineato se questa direzione viene confermata |
| Modello di incasso | Il cliente paga a City Of un acconto pari alla commissione (esempio: 400 € su 1.400 €); il saldo lo paga direttamente al partner. City Of non deve nulla al partner |
| Team | Luigi e il co-founder, presenti in zona |
| Budget di test | 600–800 € su Meta Ads |
| Outbound | Solo B2B: partner locali e agenzie/intermediari. Niente email a freddo a privati |
| Maltempo | Se il tour è annullato per maltempo, City Of restituisce l'acconto al cliente |
| Società | Partita IVA da aprire prima di incassare |
| Visione di rete | Ogni City Of è un nodo: i siti delle città si collegano tra loro, come fa la rete BluBlu. È il vantaggio di lungo periodo e va progettato nel sito fin dall'inizio |
| Struttura dei siti | Un sito City Of generico (marchio madre, porta d'ingresso alla rete) più un sito per area geografica, che contiene le città come sezioni. Primo sito d'area: Amalfi Coast (nome pubblico), con Sorrento, Positano e poi Capri |
| Comunicazione | "Siamo del posto" si racconta come storytelling |
| Domini | Nessuno registrato per ora. Mockup pubblicato su Vercel: https://city-of.vercel.app (progetto `city-of`, team Spill, collegato al repo) |
| Tecnologia del sito | TypeScript con Next.js (React), stili con Tailwind CSS sui token del brand, contenuti in file Markdown nel repo |
| Contratto partner | Nessuna esclusiva |
| Sito | Next.js su Vercel, in inglese (come da brand kit) |
| Brand | Già definito: vedi `brand/brand-guidelines.md` |

## 3. Questioni aperte (bloccanti prima del lancio)

1. **Inquadramento legale.** Incassare un acconto dal turista per un servizio turistico è intermediazione nella vendita. Va chiesto a un commercialista o legale se il modello regge come procacciamento d'affari/marketing o se richiede i requisiti di agenzia di viaggi (SCIA, direttore tecnico, polizza, fondo di garanzia). Non è verificato: finché non lo è, non si incassa.
2. **Costo del maltempo.** L'acconto si restituisce, ma l'annuncio è già pagato: nei conti va messa una quota di prenotazioni annullate. Da decidere anche cosa succede se è il cliente a cancellare.
3. **Forma della società e tempi.** La partita IVA arriva "a tempo debito": serve comunque prima del primo incasso e per aprire l'account pubblicitario.
4. **Domini.** Il nome pubblico del sito d'area è Amalfi Coast. Resta da decidere quali domini registrare e se il sito d'area sta sullo stesso dominio del generico o su uno suo.
5. **Contratto partner.** Senza esclusiva. Restano da definire: commissione, tempi di risposta, cosa succede se il cliente torna direttamente dal partner.
6. **Criterio di successo del test Meta.** Da costruire più avanti, prima di spendere.

Rimandati alla fine, per scelta: commissione reale, regole di cancellazione del cliente, obiettivi con numeri e date, verifica con il commercialista.

## 4. Cosa insegna Sorrento Insider

Analisi fatta il 13 novembre 2026 su sitemap e dieci pagine campione della versione italiana.

**Chi sono.** Sorrento Insider è di Capri On Line Srl (sede a Sorrento e Anacapri, una web agency con sette persone in organico sul sito). Fa parte di una rete di sette guide, marchio "BluBlu": capri.it, positano.com, sorrentoinsider.com, ischiainsider.com, naplesinsider.com, procidainsider.com, visitpompeiivesuvius.com. Caprionline.it è solo il sito aziendale. Le prenotazioni passano da una loro piattaforma (Onda), su cui gli operatori si iscrivono da soli.

**Struttura del sito** (circa 400 URL per lingua, italiano e inglese soltanto):

| Tipo di pagina | Quante | A cosa serve |
|---|---|---|
| Scheda servizio (`/s/`) | 194 | Prodotto prenotabile, con dati strutturati di prodotto, prezzo e recensioni |
| Scheda partner (`/c/`) | 98 | Hotel, charter, noleggi; dati strutturati di attività locale |
| Guide (`/e/`) | circa 50 | Spiagge, cosa vedere in un giorno, parcheggi, quanto costa, quando andare |
| Pagine di categoria (`/l/`) | 22 | "Tour privati in barca", "Tour Sorrento Capri", "Wedding" |
| Pagine per mese (`/m/`) | 12 | "Sorrento a maggio" |
| Tratte e orari (`/t/` e simili) | circa 10 | Traghetti, bus, Circumvesuviana, con prezzi |

**Cosa funziona.**
- Le pagine di utilità (orari di traghetti e bus, come arrivare) portano traffico tutto l'anno e lo indirizzano verso tour e transfer.
- Ogni guida rimanda a un prodotto prenotabile.
- I titoli portano l'anno e la parola "prezzi".
- La rete di sette siti si collega a vicenda: è il loro vantaggio vero, e non è replicabile a breve.

**Dove sono deboli.**
- Le guide sono corte (800–1.400 parole compresi menu e piè di pagina) e quasi senza sottotitoli.
- Solo due lingue.
- È un mercato, non una selezione: 70 tour privati in barca, difficili da distinguere.
- Fuori stagione i prezzi spariscono ("Prezzi 2027 presto disponibili").
- Le recensioni recenti di un charter molto venduto lamentano costi imprevisti all'imbarco e contratti solo in italiano.
- Il tono è quello che il nostro brand vieta ("indimenticabile", "mozzafiato").
- Le schede partner espongono sito e WhatsApp dell'operatore: il cliente può scavalcarli.

**Cosa ne ricaviamo.**
- Non si batte la rete sulle ricerche generiche nel primo anno. La ricerca organica è un investimento a 6–12 mesi; la prima stagione la fanno Meta, outbound e WhatsApp.
- Lo spazio è su ricerche in inglese ad alta intenzione e sulla trasparenza: quanto costa davvero una barca privata, cosa è incluso, carburante, tasse di sbarco, privata contro semi-privata, quale barca per quante persone.
- Pochi pillar profondi (2.500+ parole, struttura chiara, domande frequenti) invece di molte guide corte.
- "Il prezzo detto prima" è una risposta diretta alla lamentela più frequente dei loro clienti.
- Pochi partner scelti, non un catalogo.

Da fare in seguito: stessa analisi su positano.com (stessa rete) e sulla versione inglese.

## 5. Perimetro del primo test

- **Offerta:** 3–5 partner barca, 4–6 prodotti con prezzo completo dichiarato (privato giornata intera, privato mezza giornata, tramonto, semi-privato Capri, semi-privato Costiera).
- **Sito:** home City Of con il timone, pagina City of Sorrento, una pagina per prodotto, pulsante WhatsApp ovunque. City of Positano come seconda pagina sulla stessa offerta.
- **Vendita:** WhatsApp gestito da noi. Si annotano le conversazioni: sono la base per l'agente AI futuro.
- **Annunci:** con 600–800 € si compra un segnale, non un profitto. Si misura il costo per conversazione WhatsApp e quante diventano prenotazioni. Da spendere quando la domanda c'è (indicativamente da febbraio-marzo), non adesso.
- **Criterio di successo:** da fissare insieme prima di spendere (ipotesi: costo per prenotazione sotto la commissione media).

## 6. Filoni di lavoro e strumenti

| Filone | Chi | Strumenti già disponibili | Da valutare |
|---|---|---|---|
| Strategia, legale, contratti partner | Noi | — | Commercialista/legale |
| Posizionamento e messaggi | Noi + agente | `gtm-skills:positioning-and-messaging`, `gtm-skills:gtm-motion-picker` | — |
| Sito | Agente | Brand kit e token nel repo, Vercel | — |
| Contenuti e ricerca organica | Agente, revisione nostra | Skill nel repo: keyword-deep-dive, topic-cluster-planning, content-brief, write-content, improve-content, page-audit, eeat-audit, semantic-gap-analysis, featured-snippet-optimizer, linkbuilding, schema, site-architecture, programmatic-seo, copywriting | `agricidaniel/claude-seo` (scartato per ora: 200 script e hook, troppo pesante) |
| Acquisizione partner e agenzie (outbound B2B) | Agente scrive, noi inviamo | Skill nel repo: cold-email, prospecting. Più `gtm-skills:sales-sequences`, `sales:draft-outreach`, HubSpot | — |
| Meta Ads | Noi approviamo, agente prepara | Skill nel repo: ads, ad-creative | Collegamento all'account: connettore Pipeboard (`https://meta-ads.mcp.pipeboard.co/`), da aggiungere da Luigi quando esiste l'account pubblicitario |
| WhatsApp | Noi (fase 1), agente (fase 2) | — | API ufficiale WhatsApp Business via Twilio o simili; n8n |
| Numeri e previsioni | Agente | `revops:funnel-math`, `revops:revenue-plan` | — |

Note sugli strumenti da valutare:
- Le skill nel repo (`.claude/skills/`) sono state lette prima di copiarle: solo testo, nessuno script. Gli altri strumenti non sono installati né verificati. Stelle e numeri di installazione vengono da directory di terze parti e non concordano: vanno controllati su GitHub, leggendo i file prima di installare.
- `morluto/rea` serve soprattutto ad analizzare binari e applicazioni. Per studiare siti concorrenti non è servito: sono bastate sitemap e lettura delle pagine. Non installato.
- Per WhatsApp vanno evitate le librerie non ufficiali (rischio di blocco del numero).

## 7. Come lavorare senza sprecare crediti

- Questo file, `docs/metodo.md` e `CLAUDE.md` sono il contesto di partenza: non far rileggere il resto.
- Modello più capace solo per brief e decisioni; sito, testi e operatività con un modello più leggero.
- Una sessione per filone, chiusa con un aggiornamento di questo file.
- Sub-agenti solo per ricerche ampie e parallele.
- Mai far leggere `brand/brand-identity-canvas/sorgente/` (400 KB): bastano `brand/brand-guidelines.md` e `brand/09-web/tokens.css`.

## 8. Prossimi passi

1. Luigi e co-founder: validare le sezioni 2 e 3, sentire il commercialista sul punto 3.1.
2. Decidere regola maltempo e bozza di condizioni partner.
3. Lista dei primi 15 operatori barca da contattare (i charter presenti su Sorrento Insider sono un buon punto di partenza).
4. Posizionamento e messaggi in inglese.
5. Struttura del sito e primo rilascio su Vercel.
6. Piano dei pillar (5–6 articoli) dalle ricerche ad alta intenzione.
