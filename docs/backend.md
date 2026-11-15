# City Of — Backend con Supabase

Bozza 0.1 · 14 novembre 2026 · da validare con Luigi.
Lo schema del database è in `supabase/migrations/`: `20261114000000_init.sql` (prima versione), `20261114010000_harden.sql` (indici, schema `private`, `search_path`, colonne `details` e `is_sample`) e `20261114010100_harden_policies.sql` (regole RLS riscritte dopo gli advisor di Supabase).

**Stato al 14 novembre 2026.** Caricato sul progetto Supabase `zacbchosuqcbonjrmsbv`: schema, prima correzione e dati di `seed.sql` (4 città live, 20 esperienze, 8 alberghi e case, 20 partner segnaposto, 3 pacchetti). Tutte le schede sono **contenuti d'esempio**: `is_sample = true`, `price_cents` null, partner `[PARTNER] …` con stato `lead` (quindi il nome non compare sul sito). Le foto sono collegate in `listing_photos` con il nome del file; per metterle nel bucket Storage `listings` serve `SUPABASE_SERVICE_ROLE_KEY=… node scripts/upload-photos.mjs` (finché mancano, il sito usa la copia in `public/photos/`).

### Il sito legge dal database
`src/lib/catalog.ts` carica esperienze, alberghi e case da Supabase (chiave anon, solo righe `published`) all'avvio del server o della build e le rinnova ogni minuto. `src/lib/content.ts` le usa al posto dei file; se mancano le variabili, o il database non risponde, si torna ai file in `content/`. `CATALOG_SOURCE=files` forza i file. Città, categorie, guide e landing restano file.

## 1. Cosa deve fare

- Il cliente sceglie una o più città, tour e alberghi o case, e manda una **richiesta di prenotazione dal sito**. WhatsApp resta come secondo canale.
- Ogni **tour operator** (o albergo, o host) riceve solo le righe che lo riguardano e risponde **accetto / rifiuto**.
- **Noi** vediamo tutto, gestiamo catalogo, partner, prezzi e prenotazioni, e confermiamo al cliente.
- Le **email** partono da sole a ogni passaggio, verso cliente, partner e noi.
- Il **cliente** ha una sua area con le prenotazioni passate e future.

## 2. Pezzi

| Pezzo | Cosa fa | Perché |
|---|---|---|
| Sito Next.js su Vercel (il repo di Luigi) | Pagine pubbliche, area clienti, area partner, area admin | C'è già, con la base SEO |
| Supabase · Postgres | Tutti i dati | Un database vero, con permessi per riga |
| Supabase · Auth | Login con link via email (niente password) per clienti, partner e noi | Semplice per i partner |
| Supabase · Storage | Foto di città, tour, alberghi | Caricabili anche dai partner |
| Supabase · Edge Functions | Invio email, webhook di Stripe | Girano vicino al database |
| Resend | Invio delle email | Semplice, buoni modelli in React |
| Stripe Checkout | Acconto online | **Solo in fase 2**, vedi §8 |

Le guide SEO restano file Markdown nel repo. Tour, alberghi, prezzi e disponibilità passano nel database, così si cambiano dall'admin senza toccare il codice.

## 3. Come sono divise le città

```
Area (un sito pubblico)     →  Città (sezioni)  →  Listing (cosa si prenota)
amalfi-coast                     sorrento             barca, cooking class, transfer, albergo, casa…
                                 positano
                                 amalfi
                                 capri
```

- **`areas`**: un'area è un sito pubblico, per esempio "Amalfi Coast". Più avanti si aggiungono altre aree (Napoli e isole, Cilento…) senza cambiare il modello.
- **`cities`**: ogni città ha `slug`, colore (`accent`), coordinate, testi, foto e uno **stato**:
  - `draft`: non si vede;
  - `soon`: si vede sul timone come "opening later" e non si prenota;
  - `live`: si vede e si prenota.
- **`helm_slot`** (0–5): la maniglia del timone. Al massimo 6 città per area, una per maniglia.
- Gli URL restano quelli di Luigi: `/amalfi-coast/sorrento`, `/amalfi-coast/sorrento/boat-tours/private-boat-capri`.

## 4. Città vicine e gruppi di città

- **`city_links`**: per ogni città, le città vicine con il tempo di viaggio e il mezzo ("ferry 25 min"). Servono per il "See also" e per i suggerimenti automatici ("aggiungi Capri, è a 25 minuti").
- **`city_groups`** e **`city_group_members`**: gruppi che consigliamo come un unico viaggio, per esempio:
  - *Amalfi Coast complete*: Sorrento, Positano, Amalfi, Capri;
  - *The islands*: Capri, Ischia, Procida.
  Ogni città del gruppo può essere `optional`, cioè il cliente può toglierla.
- **`packages`** e **`package_items`**: un pacchetto è un gruppo con dei listing proposti di default (`is_default`). Nel sito il cliente accende e spegne città e tour, esattamente come nel prototipo. Quando invia, la richiesta diventa **una prenotazione con più righe**.

## 5. Cosa si prenota: esperienze e alberghi/case

Una sola tabella, **`listings`**, con `kind`:

- `experience`: barche, cooking class, guide, transfer, autisti. Hanno durata, capienza, punto d'incontro, cosa è incluso, cosa è escluso e cosa si paga sul posto.
- `stay`: alberghi e case. Hanno notti minime, orari di check-in e check-out, e `details` (camere, posti letto, servizi; per le esperienze formato, durata, gruppo, FAQ).

Il prezzo ha sempre un'unità: `per_person`, `per_group`, `per_boat`, `per_car`, `per_night`.

**`slots`** è il calendario: per un tour una riga per data e orario, con i posti; per una casa o un albergo una riga per notte, con le unità libere.

**Alberghi e case** sono un ramo a parte: categorie proprie (`hotels`, `houses`), partner di tipo `hotel` o `house`, pagina "Where to stay" in ogni città. All'inizio è piccolo e curato: pochi posti per città, solo quelli che conosciamo.

## 6. Le tre aree riservate

| | Cliente · `/account` | Tour operator / albergo · `/partner` | Noi · `/admin` |
|---|---|---|---|
| Accesso | Link via email, con la stessa email usata nella richiesta | Link via email; lo invitiamo noi | Link via email; ruolo `admin` |
| Vede | Le sue prenotazioni (future e passate), i dettagli di ogni tour, chi lo gestisce, i pagamenti | Le sue schede, il suo calendario, **solo le righe di prenotazione che lo riguardano** (con persone, data, nome del cliente) | Tutto |
| Fa | Chiede modifiche o cancellazione, lascia una recensione dopo il tour | Accetta o rifiuta una richiesta, apre e chiude date, propone nuove schede o modifiche (le pubblichiamo noi), carica foto | Crea aree, città, gruppi, pacchetti, partner, schede; pubblica; conferma, cancella, rimborsa; vede le email partite |
| Non può | Vedere altri clienti | Vedere altri partner, cambiare prezzi o persone di una prenotazione, pubblicare da solo | — |

I permessi sono **nel database** (Row Level Security), non solo nel sito: anche chi usa le API direttamente vede solo ciò che gli spetta. Le regole sono in fondo al file SQL.

Nel sito pubblico i contatti del partner (telefono, email) **non compaiono mai**, solo nome e tipo, tramite la vista `public_partners` (e solo per i partner con stato `active`: anon può leggere soltanto `id, kind, name, status`). È la lezione di Sorrento Insider: se il cliente vede il WhatsApp dell'operatore, ci scavalca.

## 7. Flusso di una prenotazione

```
richiesta dal sito ──► requested ──(ogni partner accetta la sua riga)──► partner_confirmed
                                                                              │
                                   fase 1: confermiamo noi a mano ◄───────────┤
                                   fase 2: link di acconto (deposit_pending) ─┘
                                                                              ▼
                                                                         confirmed ──► completed
uscite: declined · cancelled_customer · cancelled_weather · cancelled_partner
```

- Il sito chiama la funzione **`request_booking`**. I prezzi li calcola il database, non il browser: il cliente non può cambiarli. La funzione crea anche la riga cliente, se non esiste.
- Ogni riga (`booking_items`) appartiene a un partner e ha uno stato suo: `pending`, `accepted` o `declined`. Quando sono tutte accettate, la prenotazione passa da sola a `partner_confirmed`.
- La commissione si calcola riga per riga (`commission_pct` del partner) e diventa l'**acconto** (`deposit_cents`), come da brief.

### Email automatiche

Ogni cambio di stato scrive una riga in **`notifications`**: è una coda di uscita. Una Edge Function (`notify`) la legge, manda l'email con Resend e segna `sent_at`. Se Resend non risponde, il messaggio resta in coda e riparte.

| Momento | Cliente | Partner | Noi |
|---|---|---|---|
| Richiesta inviata | "Abbiamo ricevuto la richiesta" + riepilogo | "Nuova richiesta" con link per accettare o rifiutare | Avviso |
| Partner accetta / rifiuta | — | — | Avviso, con la riga |
| Tutti hanno accettato | "Confermato dai partner, ecco i prossimi passi" | — | Avviso |
| Confermato | Voucher: orari, punto d'incontro, chi lo gestisce, cosa si paga sul posto | Conferma definitiva | — |
| Giorno prima | Promemoria | Promemoria con i dati del gruppo | — |
| Maltempo | "Annullato per maltempo, ti rimborsiamo l'acconto" | Avviso | Avviso + rimborso da fare |
| Dopo il tour | Richiesta di recensione | — | — |

Il promemoria del giorno prima richiede un job programmato (Supabase Cron), da aggiungere.

## 8. Pagamenti

**Fase 1, senza pagamento online.** La richiesta si conferma a mano e l'acconto si gestisce come oggi. Il brief (punto 3.1) dice chiaramente che finché il commercialista non conferma il modello non si incassa.

**Fase 2, con Stripe Checkout per l'acconto.** Il webhook di Stripe scrive in `payments` e porta la prenotazione a `confirmed`. Il saldo il cliente lo paga al partner sul posto, come da brief, quindi non serve Stripe Connect.

## 9. Fasi

1. **Base:** progetto Supabase, schema, caricamento dei dati del prototipo (4 città, tour, alberghi e case), pagine pubbliche che leggono dal database, richiesta di prenotazione, email cliente/partner/admin, admin minimo (prenotazioni e schede).
2. **Area partner:** login, accetta/rifiuta, calendario, proposta di schede, foto.
3. **Area clienti:** prenotazioni, voucher, recensioni.
4. **Pacchetti e gruppi** dal database, con suggerimenti automatici delle città vicine.
5. **Acconto online** con Stripe, dopo il parere legale.
6. **Agente su WhatsApp** che legge e scrive le stesse prenotazioni (le conversazioni annotate in fase 1 servono a questo).

## 10. Da decidere

- **Commissione:** nello schema è al 20% di default solo come segnaposto. Va fissata per partner.
- **Cancellazione da parte del cliente:** regole e tempi.
- **Prenotazione istantanea:** per ora tutto passa dal partner. Più avanti, alcuni listing con calendario affidabile potrebbero confermarsi da soli.
- **Lingue:** i testi del database sono solo in inglese. Se servono altre lingue, va aggiunta una tabella di traduzioni.
- **Protezione del modulo:** limite di richieste e un captcha leggero (Cloudflare Turnstile) su `request_booking`, per evitare spam.
- **Dominio e indirizzo email di invio:** servono per Resend (record DNS).

## 11. Come si avvia

1. Creare un progetto su supabase.com (regione EU, Francoforte).
2. Con la CLI di Supabase, collegare il progetto ed eseguire `supabase db push`, che carica `supabase/migrations/`.
3. Nel sito Next.js aggiungere `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`. La `service_role` key va solo nelle Edge Functions, mai nel browser.
4. Il proprio utente si promuove admin una volta sola, dal pannello SQL: `update profiles set role = 'admin' where id = '<uuid>';`

## 12. Nel sito (ramo `sito-completo`)

| Dove | Cosa fa |
|---|---|
| `src/app/request/` | Richiesta di prenotazione (da scheda, albergo/casa o pacchetto). Chiama `request_booking`; senza Supabase propone WhatsApp |
| `src/app/login/`, `src/app/auth/` | Accesso con link via email, uscita |
| `src/app/account/` | Area clienti: prenotazioni future e passate, righe e stato |
| `src/app/partner/` | Area tour operator e alberghi: accetta o rifiuta, elenco delle proprie schede |
| `src/app/admin/` | Area nostra: prenotazioni e stato, schede (pubblica/archivia), partner, email in coda |
| `src/lib/supabase.ts` | Collegamento; se mancano le variabili il sito funziona lo stesso |
| `supabase/migrations/` | Schema e permessi |
| `supabase/seed.sql` | Dati iniziali generati da `content/` con `node scripts/seed-from-content.mjs` |
| `supabase/functions/notify/` | Invio delle email dalla coda, con Resend |

Per accenderlo:
1. Creare il progetto Supabase (EU) e caricare `supabase/migrations/20261114000000_init.sql`, poi `supabase/seed.sql`.
2. Su Vercel (e in `.env.local`) mettere `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` (vedi `.env.example`).
3. In Supabase → Authentication → URL configuration, aggiungere `<indirizzo del sito>/auth/callback` tra i redirect.
4. Fare il primo accesso da `/login` con la propria email, poi dal pannello SQL: `update profiles set role = 'admin' where id = (select id from auth.users where email = '<email>');`
5. Per ogni partner vero: crearlo in `partners`, poi collegare la sua email con una riga in `partner_members` dopo il suo primo accesso.
6. Email: pubblicare la funzione `notify`, impostare `RESEND_API_KEY`, `MAIL_FROM`, `ADMIN_EMAIL`, `SITE_URL`, e farla girare ogni minuto (Supabase Cron).
