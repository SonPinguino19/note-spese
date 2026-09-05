# Note Spese

Prima implementazione dell'app per spese personali e condivise. Interfaccia italiana responsive, React e Vite, backend Supabase facoltativo. Nessun dato reale incluso.

## Implementato

- Dashboard con entrate, spese nette, risparmio, investimenti e tasso di risparmio.
- Filtri per anno, intervallo inclusivo, ultimi 30/90/365 giorni, da inizio anno, persona, conto, categoria e ambito.
- Andamento mensile, categorie cliccabili e confronto con intervallo precedente di uguale durata.
- Inserimento, eliminazione e backup JSON dei movimenti.
- Import .xlsx con selezione foglio, associazione colonne, anteprima, errori per riga, selezione dei possibili duplicati e annullamento lotto.
- Login email/password e persistenza Supabase con RLS per nucleo.
- Senza configurazione: modalità dimostrativa in memoria, esplicitamente segnalata. Ricaricando si perdono le modifiche.

## Build e verifiche solo cloud

Pubblicare il contenuto di questa directory nella repository. GitHub Actions installa le dipendenze sul runner, esegue i test e produce l'artefatto `app-build`. Nessuna installazione locale necessaria. La pipeline non è ancora stata eseguita. Non è ancora configurato un deploy.

Le versioni dirette sono fissate. Prima del rilascio, generare e commettere package-lock.json da un runner cloud e sostituire npm install con npm ci per bloccare anche le dipendenze transitive.

## Supabase

1. In un progetto dedicato, eseguire `supabase/schema.sql` nel SQL Editor.
2. Creare gli utenti da Authentication, quindi aggiungere le due membership con lo stesso household_id tramite il pannello amministrativo. La registrazione pubblica non è esposta dall'app.
3. Impostare nelle variabili dell'ambiente di build `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. Sono configurazioni pubbliche del client; non usare mai service_role o secret key nel frontend.
4. Ricostruire e pubblicare `dist` sul provider scelto. Configurare le URL consentite in Supabase.

La prima policy condivide tutti i movimenti nel nucleo. Prima di dati reali, confermare se le spese personali devono invece restare private. Verificare accesso anonimo negato e isolamento con un terzo utente di un altro nucleo.

## Verifica sul deploy

- Testare login con utenti autorizzati e non associati.
- Inserire un movimento, ricaricare e verificarlo dal secondo account.
- Importare un file sintetico con date italiane, rimborsi e importi decimali.
- Reimportarlo: candidati duplicati deselezionati; due acquisti uguali possono essere inclusi manualmente.
- Annullare un lotto senza eliminare movimenti preesistenti.
- Verificare filtri inclusivi, tasso non disponibile senza entrate, esclusione dei trasferimenti dai consumi.
- Provare layout mobile e uso da tastiera.

## Prossime fasi

- Modifica movimenti e assegnazione categorie in blocco; regole automatiche e formati import salvati.
- Quote di coppia, conguagli e riconciliazione spese manuali/importate.
- Trimestre/semestre/mese, confronto stesso periodo anno precedente, grafico mensile completo anche per mesi vuoti.
- Import PDF su file campione, poi OCR opzionale. .xls non supportato: esportare .xlsx.
- Budget, copertura importazioni, ripristino backup e PWA installabile.
- Migrazione storico verificata: il mapper iniziale corrisponde al foglio 2026, ma le categorie Saldi e Investimenti devono essere controllate prima della conferma. I positivi sono proposti come entrate, quindi eventuali rimborsi richiedono classificazione dedicata nella prossima iterazione.

Non usare ancora come unico archivio: build, deploy e verifiche end-to-end sono da completare. Nessun test eseguito sul PC per rispettare il flusso richiesto.
