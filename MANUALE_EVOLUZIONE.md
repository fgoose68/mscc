# Manuale evoluzione

## MSCC · MicroSaaS Control Center

Guida operativa per trasformare l'attuale base frontend/API in una piattaforma reale di gestione dell'infrastruttura MicroSaaS.

## 1. Come utilizzare questo manuale

Questo documento è la roadmap tecnica ufficiale di MSCC. Ogni fase deve essere completata e verificata prima di iniziare quella successiva.

Per ogni incremento del progetto:

1. creare un branch Git dedicato;
2. leggere la fase e i criteri di accettazione;
3. implementare backend, frontend, test e documentazione insieme;
4. eseguire i controlli locali;
5. verificare il comportamento nell'interfaccia;
6. aggiornare il registro di avanzamento;
7. creare un commit con un messaggio chiaro;
8. fare push su GitHub;
9. solo dopo la verifica installare l'incremento sul server.

Comandi di base:

```bash
cd /Users/fabrizio/progetti/mscc
git checkout -b feat/nome-fase
npm run build
python3 -m py_compile backend/app/main.py
git diff --check
git add .
git commit -m "feat: descrizione della fase"
git push -u origin feat/nome-fase
```

La porta applicativa prevista è `5080`.

## 2. Principi architetturali obbligatori

### 2.1 Modello multi-node

Nessun modulo deve contenere logiche speciali per “Mac mini” o “Raspberry Pi”. Tutte le funzionalità devono lavorare con un identificativo `node_id`.

### 2.2 Separazione dei livelli

La piattaforma deve mantenere separati:

- frontend React;
- API FastAPI;
- servizi di dominio;
- adapter per integrazioni esterne;
- agente installato sui nodi;
- database;
- scheduler e coda eventi.

### 2.3 Sicurezza predefinita

- nessun segreto nel repository;
- nessun Docker socket esposto pubblicamente;
- tutte le operazioni sensibili autenticate e autorizzate;
- audit log per le operazioni di modifica;
- timeout e gestione degli errori per ogni integrazione;
- accesso in sola lettura come impostazione iniziale quando possibile.

### 2.4 Osservabilità

Ogni operazione importante deve avere:

- timestamp UTC;
- livello `info`, `warning` o `critical`;
- origine;
- nodo interessato;
- risorsa interessata;
- messaggio leggibile;
- dettaglio tecnico per il debug;
- correlation ID quando attraversa più servizi.

### 2.5 Compatibilità futura

SQLite è il database iniziale. I modelli devono rimanere compatibili con PostgreSQL. Evitare SQL specifico di SQLite e usare migrazioni versionate.

## 3. Stato iniziale e obiettivo finale

### Stato iniziale

MSCC dispone attualmente di:

- interfaccia React/TypeScript/Vite;
- backend FastAPI;
- API dimostrative per nodi, salute e servizi;
- dati rappresentativi in memoria;
- moduli navigabili;
- layout responsive;
- Dockerfile e Docker Compose;
- porta `5080`;
- documentazione utente in italiano.

### Obiettivo finale

```text
Browser
  ↓ HTTPS
MSCC Control Center
  ├── API FastAPI
  ├── Database
  ├── Scheduler
  ├── Event bus / notifiche
  ├── Adapter integrazioni
  └── Plugin manager
          ↓ HTTPS autenticato
      MSCC Agent
          ↓
      Sistema operativo / Docker / servizi
```

## 4. Regole per ogni incremento

Ogni funzionalità nuova deve includere:

- modello di dominio;
- endpoint API;
- validazione input;
- gestione degli errori;
- autorizzazione;
- stato di caricamento frontend;
- stato vuoto;
- stato di errore;
- feedback dopo l'azione;
- test del caso principale;
- test degli errori principali;
- documentazione del manuale utente;
- aggiornamento di questo manuale se cambia la sequenza operativa.

Non considerare completata una funzionalità solo perché esiste il pulsante nell'interfaccia.

## 5. Fase 0 — Preparazione del progetto

### Obiettivo

Stabilire convenzioni, ambienti e controlli prima di aggiungere funzionalità operative.

### Passi

1. Creare una cartella `docs` oppure mantenere i manuali nella radice.
2. Aggiungere un file `.env.example` senza valori segreti.
3. Definire `development`, `test` e `production`.
4. Aggiungere uno script di controllo unico, per esempio `make check` o script npm.
5. Definire la strategia di versionamento API `/api/v1`.
6. Definire la policy per errori, logging e date UTC.
7. Definire i branch `main`, feature branch e release tag.
8. Aggiungere una checklist pull request.
9. Configurare il backup del repository e la protezione del branch principale.
10. Stabilire che la porta esterna locale e Docker sia `5080`.

### Deliverable

- `.env.example`;
- convenzioni scritte;
- script di verifica;
- struttura API versionata;
- workflow GitHub documentato.

### Criteri di completamento

- un nuovo sviluppatore può avviare frontend e backend seguendo il README;
- nessun segreto è presente nella cronologia Git;
- build frontend e compilazione backend passano;
- una pull request contiene controlli ripetibili.

## 5.1 Architettura Manager/Worker

Per i controlli periodici MSCC utilizzerà un modello composto da:

- `mscc-manager`: API, interfaccia web e coordinamento;
- `mscc-worker`: processo indipendente per scheduler, controlli e report;
- `mscc-data`: volume persistente condiviso nella fase SQLite.

Il worker non sarà un contenitore Docker che avvia o controlla indiscriminatamente gli altri contenitori. Sarà un servizio applicativo con responsabilità limitate. Le operazioni sui Docker Engine dei nodi verranno delegate all'agente MSCC autenticato.

Flusso:

```text
Manager API
   ├── legge stato e alert dal database
   ├── espone il report alla UI
   └── riceve azioni autorizzate

Worker
   ├── heartbeat ogni 30 secondi
   ├── controlla nodi e servizi
   ├── sincronizza alert
   └── genera il report alle 11:15 Europe/Rome
```

Questa separazione evita di bloccare l'API durante controlli lunghi e consente di riavviare il worker senza fermare l'interfaccia.

## 6. Fase 1 — Database SQLite e migrazioni

### Obiettivo

Sostituire i dati in memoria con dati persistenti e preparare la migrazione futura a PostgreSQL.

### Passi

1. Scegliere SQLAlchemy 2 + Alembic oppure SQLModel.
2. Creare `backend/app/core/config.py` per la configurazione.
3. Creare `backend/app/db/session.py`.
4. Creare i modelli `Node`, `Service`, `Container`, `Domain`, `Certificate`, `Backup`, `Alert` e `ActivityLog`.
5. Aggiungere chiavi UUID o stringhe stabili.
6. Aggiungere `created_at` e `updated_at` in UTC.
7. Aggiungere vincoli di unicità, per esempio hostname e dominio.
8. Creare la prima migrazione Alembic.
9. Creare un comando per inizializzare il database.
10. Trasferire i dati dimostrativi in un seed opzionale.
11. Aggiungere repository/service layer per non usare query direttamente nei router.
12. Sostituire gli endpoint demo con query al database.
13. Montare il volume dati in Docker.
14. Documentare backup e ripristino del file SQLite.

### Schema minimo

```text
nodes
node_metrics
services
containers
container_stats
images
volumes
networks
domains
ssl_certificates
backups
health_checks
alerts
activity_logs
integrations
users
roles
```

### Criteri di completamento

- riavviando il backend i dati non scompaiono;
- gli endpoint restituiscono dati dal database;
- le migrazioni funzionano su un database vuoto;
- un backup SQLite può essere ripristinato;
- i test non dipendono dal database di sviluppo.

## 7. Fase 2 — Autenticazione, utenti e permessi

### Obiettivo

Proteggere l'applicazione prima di collegarla a server reali.

### Passi

1. Definire utenti, ruoli e permessi.
2. Implementare password con algoritmo di hashing moderno, mai in chiaro.
3. Implementare login e logout.
4. Scegliere cookie di sessione sicuri oppure access/refresh token.
5. Proteggere tutte le API tranne health check e login.
6. Aggiungere scadenza sessione e revoca.
7. Aggiungere rate limit sul login.
8. Aggiungere protezione CSRF se si usano cookie.
9. Implementare `Administrator`, `Operator` e `Viewer`.
10. Collegare l'utente al registro attività.
11. Aggiungere pagina Settings per utenti e profilo.
12. Creare un utente amministratore iniziale tramite comando sicuro.
13. Aggiungere test per accesso autorizzato e negato.

### Matrice iniziale

| Operazione | Administrator | Operator | Viewer |
| --- | --- | --- | --- |
| Visualizzare dati | Sì | Sì | Sì |
| Riavviare container | Sì | Sì | No |
| Gestire nodi | Sì | Limitato | No |
| Gestire integrazioni | Sì | No | No |
| Gestire utenti | Sì | No | No |
| Visualizzare audit log | Sì | Sì | No |

### Criteri di completamento

- una pagina non autenticata non espone dati infrastrutturali;
- ogni endpoint verifica il ruolo;
- le password non sono recuperabili;
- le operazioni di modifica registrano l'utente;
- i test coprono accesso, logout e permessi.

## 8. Fase 3 — Agente MSCC e registrazione nodi

### Obiettivo

Installare un agente leggero su ogni server e collegare il primo nodo reale.

### Passi

1. Creare un package separato `agent`.
2. Definire il contratto di registrazione nodo.
3. Generare un enrollment token monouso dal Control Center.
4. Installare l'agente con uno script o pacchetto.
5. Salvare il token in un file protetto sul nodo.
6. Inviare heartbeat autenticati a intervallo configurabile.
7. Inviare informazioni statiche: hostname, OS, architettura, Docker.
8. Inviare metriche dinamiche: CPU, RAM, disco, temperatura, uptime.
9. Gestire `online`, `offline` e `maintenance`.
10. Aggiungere retry con backoff.
11. Aggiungere clock skew tolerance.
12. Aggiungere revoca e rotazione delle credenziali.
13. Aggiungere pagina di enrollment in Nodes.
14. Installare prima su un ambiente di test.
15. Collegare il Mac mini Ubuntu.
16. Collegare il Raspberry Pi.

### Contratto heartbeat

```text
POST /api/v1/agents/heartbeat
Authorization: Bearer <agent-token>
{
  node_id,
  sent_at,
  system,
  resources,
  docker,
  services
}
```

### Criteri di completamento

- un nodo può essere registrato senza modifiche manuali al database;
- il nodo appare online entro il primo heartbeat;
- spegnendo l'agente passa offline dopo una soglia configurata;
- il token revocato non è più accettato;
- il Control Center non necessita di esporre Docker socket.

## 9. Fase 4 — Metriche e salute infrastrutturale

### Obiettivo

Conservare serie temporali utili e calcolare lo stato dell'infrastruttura.

### Passi

1. Definire frequenza raccolta metrica.
2. Salvare campioni con timestamp e `node_id`.
3. Separare metriche correnti e storico aggregato.
4. Definire soglie configurabili per CPU, RAM, disco e temperatura.
5. Creare il servizio di health evaluation.
6. Generare alert solo dopo N campioni consecutivi oltre soglia.
7. Chiudere automaticamente l'alert quando il valore rientra.
8. Visualizzare dati correnti nella Overview.
9. Aggiungere grafici storici nella pagina nodo.
10. Aggiungere retention per evitare crescita illimitata di SQLite.

### Criteri di completamento

- i valori della Overview arrivano dall'agente;
- gli alert non oscillano a ogni campione;
- ogni alert ha apertura, aggiornamento e risoluzione;
- il frontend gestisce dati mancanti senza rompersi;
- lo storico può essere filtrato per nodo e periodo.

## 10. Fase 5 — Docker management

### Obiettivo

Gestire in sicurezza container e risorse Docker sui nodi.

### Passi

1. Definire il modello normalizzato dei container.
2. Far raccogliere all'agente container, immagini, volumi e reti.
3. Salvare lo snapshot e rimuovere risorse non più presenti.
4. Implementare endpoint di sola lettura.
5. Aggiungere log container con paginazione e limite di righe.
6. Implementare start, stop e restart tramite comando autorizzato.
7. Aggiungere `dry-run` per le operazioni rischiose.
8. Salvare ogni comando nell'audit log.
9. Gestire timeout, exit code e output troncato.
10. Creare pagina Docker con filtri per nodo e stato.
11. Aggiungere dettaglio container con statistiche.
12. Aggiungere immagini con tag, digest e data di aggiornamento.
13. Aggiungere volumi con dimensione e utilizzo.
14. Aggiungere reti e container collegati.

### Criteri di completamento

- i dati mostrati coincidono con Docker del nodo;
- un restart autorizzato produce un evento verificabile;
- un errore Docker è mostrato senza stack trace all'utente;
- i log non possono saturare memoria o database;
- Viewer non può eseguire azioni.

## 11. Fase 6 — Servizi pubblici e health check

### Obiettivo

Monitorare le applicazioni pubblicate indipendentemente dal container che le esegue.

### Passi

1. Separare il modello `Service` dal modello `Container`.
2. Aggiungere endpoint, porta, protocollo e dominio.
3. Implementare health check HTTP/HTTPS.
4. Misurare response time.
5. Controllare status code e timeout.
6. Supportare health check con header o percorso configurabile.
7. Definire stato `healthy`, `degraded`, `stopped` e `unknown`.
8. Configurare intervallo e soglie per ogni servizio.
9. Collegare la tabella Public services agli endpoint reali.
10. Aggiungere storico delle verifiche.
11. Generare alert per timeout e status code errati.

### Criteri di completamento

- un servizio può essere monitorato anche se non è Docker;
- la differenza tra container healthy e URL healthy è visibile;
- i tempi di risposta sono persistiti;
- il cambio di stato produce un solo alert per transizione.

## 12. Fase 7 — Backup reali e ripristino

### Obiettivo

Rendere verificabile la continuità operativa.

### Passi

1. Definire provider di backup e destinazione.
2. Creare modello di job, esecuzione, artefatto e retention.
3. Implementare adapter locale, rsync o S3.
4. Configurare credenziali tramite secret.
5. Eseguire un backup manuale.
6. Registrare dimensione, durata, file e checksum.
7. Implementare scheduler.
8. Implementare retention e pulizia.
9. Implementare verifica di integrità.
10. Aggiungere procedura di restore in ambiente separato.
11. Aggiornare Backup status e storico.
12. Alertare backup falliti o troppo vecchi.

### Criteri di completamento

- un backup può essere avviato manualmente;
- il job sopravvive al riavvio del backend;
- il file può essere verificato;
- il restore è stato provato;
- un errore invia un alert senza perdere lo storico.

## 13. Fase 8 — Reverse Proxy e SSL

### Obiettivo

Collegare MSCC a Nginx Proxy Manager e monitorare i domini pubblici.

### Passi

1. Creare un adapter Nginx Proxy Manager.
2. Configurare URL e credenziali fuori dal codice.
3. Importare proxy host e certificati.
4. Sincronizzare periodicamente i dati.
5. Verificare certificati via API e via connessione TLS.
6. Salvare scadenza, issuer, hostname e stato.
7. Definire soglie a 30, 14, 7 e 3 giorni.
8. Collegare Domains & SSL e Reverse Proxy.
9. Implementare creazione/modifica solo dopo aver completato la lettura.
10. Richiedere conferma per eliminazione e rinnovo.
11. Salvare audit log di ogni modifica.

### Criteri di completamento

- certificato scaduto o non valido genera alert;
- la scadenza mostrata coincide con quella reale;
- un proxy host può essere ricondotto a nodo e servizio;
- le credenziali non compaiono nei log.

## 14. Fase 9 — OVH DNS e DynHost

### Obiettivo

Monitorare e aggiornare in modo controllato DNS e IP pubblico.

### Passi

1. Creare adapter OVH con API key e consumer key.
2. Salvare solo riferimenti a secret, non i valori nel database in chiaro.
3. Importare zone e record autorizzati.
4. Rilevare l'IP pubblico dal nodo o da un endpoint configurato.
5. Confrontare IP corrente e record DynHost.
6. Aggiornare il record solo se la policy lo consente.
7. Salvare valore precedente e nuovo valore.
8. Implementare cooldown e idempotenza.
9. Aggiungere sincronizzazione manuale.
10. Generare evento per ogni cambio IP.

### Criteri di completamento

- un cambio IP non genera aggiornamenti duplicati;
- una sincronizzazione fallita non sovrascrive il valore noto;
- l'utente vede sempre data dell'ultimo tentativo e risultato;
- ogni modifica DNS è auditabile.

## 15. Fase 10 — Tailscale, SSH e firewall

### Obiettivo

Mostrare lo stato della connettività privata e dei controlli di sicurezza.

### Passi

1. Definire le fonti autorizzate per Tailscale.
2. Importare nodi, IP privati e ultimo contatto.
3. Rilevare stato tailnet.
4. Distinguere nodo offline da nodo non raggiungibile pubblicamente.
5. Implementare controllo SSH senza memorizzare password.
6. Raccogliere stato firewall dal nodo.
7. Aggiungere controlli HTTPS.
8. Creare Security posture con timestamp della scansione.
9. Definire alert per nodo VPN offline e porta esposta inattesa.
10. Documentare tutte le porte necessarie.

### Criteri di completamento

- lo stato mostrato è aggiornato e datato;
- il fallimento di Tailscale non rende inutilizzabile la dashboard;
- i controlli non modificano firewall o SSH senza conferma esplicita;
- nessuna chiave privata viene inviata al Control Center.

## 16. Fase 11 — Notifiche Pushover

### Obiettivo

Centralizzare gli eventi e inviare notifiche utili senza rumore.

### Passi

1. Creare il modello `NotificationRule`.
2. Creare il modello `NotificationDelivery`.
3. Definire un event dispatcher interno.
4. Creare adapter Pushover.
5. Configurare token e user key tramite secret.
6. Implementare priorità.
7. Implementare cooldown e deduplicazione.
8. Implementare retry limitati.
9. Salvare esito e risposta senza segreti.
10. Creare Settings per abilitare gli eventi.
11. Aggiungere test con adapter finto.
12. Inviare prima notifiche a un canale di test.

### Eventi iniziali

- `node.offline`;
- `container.stopped`;
- `container.restarted`;
- `backup.completed`;
- `backup.failed`;
- `public_ip.changed`;
- `ssl.expiring`;
- `docker.update_available`;
- `health_check.failed`;
- `morning_report.ready`.

### Criteri di completamento

- un evento produce al massimo una notifica nel cooldown;
- un errore Pushover non blocca l'operazione principale;
- l'amministratore può disattivare una regola;
- ogni consegna ha esito visibile.

## 17. Fase 12 — Scheduler e morning report

### Obiettivo

Generare ogni mattina un report completo e affidabile.

### Passi

1. Scegliere scheduler persistente.
2. Salvare timezone e orario per workspace.
3. Creare job idempotente.
4. Raccogliere nodi, Docker, servizi, SSL, DNS, backup e alert.
5. Calcolare stato sintetico.
6. Generare un documento testuale strutturato.
7. Salvare report e metadati.
8. Inviare tramite Pushover.
9. Permettere generazione manuale.
10. Gestire giorni senza dati o integrazioni offline.
11. Aggiungere pagina Reports con storico.

### Criteri di completamento

- il job sopravvive a un riavvio;
- non crea report duplicati;
- il fuso orario è rispettato;
- un'integrazione offline è segnalata nel report;
- il report manuale e quello pianificato usano lo stesso servizio.

## 18. Fase 13 — Plugin system

### Obiettivo

Permettere l'aggiunta di moduli senza modificare il nucleo della piattaforma.

### Passi

1. Definire manifest e versione API plugin.
2. Definire lifecycle install, enable, disable, update e uninstall.
3. Definire capability e permessi.
4. Separare UI plugin e backend adapter.
5. Validare firma, origine e compatibilità.
6. Impedire accesso indiscriminato a filesystem e rete.
7. Creare catalogo plugin locale.
8. Installare prima plugin ufficiali firmati.
9. Registrare tutte le operazioni nel log.
10. Creare un plugin di esempio in sola lettura.

### Criteri di completamento

- un plugin incompatibile non viene attivato;
- i permessi sono espliciti;
- il plugin può essere disabilitato senza corrompere MSCC;
- una versione plugin può essere aggiornata o ripristinata.

## 19. Fase 14 — AI Assistant

### Obiettivo

Fornire analisi dell'infrastruttura senza concedere inizialmente capacità operative autonome.

### Passi

1. Stabilire quali dati possono essere inviati al modello.
2. Eliminare segreti, token e dati sensibili dal contesto.
3. Creare un servizio di aggregazione dati.
4. Creare prompt versionati e testabili.
5. Implementare analisi read-only.
6. Mostrare fonti e metriche usate nella risposta.
7. Implementare anomaly detection deterministica prima dell'AI generativa.
8. Aggiungere suggerimenti per storage, aggiornamenti e workload.
9. Registrare richieste e costi senza dati sensibili.
10. Richiedere conferma umana per ogni eventuale azione futura.

### Funzioni iniziali

- riassunto salute infrastruttura;
- rilevamento anomalie;
- previsione consumo storage;
- servizi instabili;
- suggerimenti di aggiornamento;
- individuazione workload candidati allo spostamento.

### Criteri di completamento

- l'AI non esegue comandi;
- ogni suggerimento è distinguibile da un fatto;
- i dati sensibili sono filtrati;
- una risposta non disponibile non blocca MSCC;
- l'amministratore può disabilitare il modulo.

## 20. Fase 15 — PostgreSQL, scalabilità e produzione

### Obiettivo

Preparare MSCC a workload più grandi e installazioni professionali.

### Passi

1. Verificare le migrazioni da SQLite.
2. Avviare PostgreSQL in ambiente di test.
3. Eseguire test di compatibilità.
4. Spostare metriche storiche su storage adeguato se necessario.
5. Separare worker, API e scheduler.
6. Aggiungere health check dei componenti.
7. Configurare backup del database.
8. Configurare reverse proxy HTTPS.
9. Gestire secret tramite environment o secret manager.
10. Aggiungere rate limit e limiti payload.
11. Definire log rotation.
12. Definire procedura di rollback.

### Criteri di completamento

- il database può essere migrato senza perdita;
- il deploy può essere ripetuto;
- esiste un rollback documentato;
- i servizi hanno health check;
- l'applicazione non dipende da file temporanei locali.

## 21. Fase 16 — Installazione sul Mac mini Ubuntu

Questa fase va eseguita solo dopo autenticazione, database, agente e backup di base.

### Passi

1. Aggiornare Ubuntu.
2. Installare Git, Docker e Docker Compose.
3. Configurare accesso SSH a GitHub per il repository privato.
4. Clonare il repository in una directory di servizio.
5. Creare il file `.env` sul server senza inserirlo in Git.
6. Verificare che la porta `5080` sia libera.
7. Avviare `docker compose up --build -d`.
8. Verificare `http://localhost:5080`.
9. Configurare firewall per consentire solo il traffico necessario.
10. Configurare accesso HTTPS tramite reverse proxy.
11. Registrare il Mac mini come primo nodo tramite agente.
12. Verificare heartbeat, metriche e Docker.
13. Creare il primo backup.
14. Documentare IP, porte, volumi e procedura di ripristino.

### Criteri di completamento

- MSCC si riavvia automaticamente;
- il servizio è raggiungibile solo tramite porte previste;
- il nodo Mac mini appare online;
- è possibile aggiornare con `git pull` e ricostruire il container;
- il backup e il restore sono stati provati.

## 22. Strategia di test

### Test backend

- unit test per servizi e adapter;
- test API con database temporaneo;
- test autorizzazioni;
- test errori e timeout;
- test idempotenza;
- test migrazioni.

### Test agent

- raccolta metriche;
- retry;
- token invalido;
- backend non raggiungibile;
- payload incompleto;
- compatibilità x86_64 e ARM64.

### Test frontend

- caricamento dashboard;
- stati loading, empty ed error;
- filtri;
- azioni autorizzate;
- conferme operazioni rischiose;
- responsive layout.

### Test integrazione

- Docker mock;
- Nginx Proxy Manager mock;
- OVH mock;
- Pushover mock;
- Tailscale mock;
- backup su destinazione temporanea.

## 23. Deploy e rollback per ogni fase

### Prima del deploy

1. verificare branch e commit;
2. creare backup del database;
3. leggere le migrazioni;
4. controllare variabili d'ambiente;
5. eseguire build;
6. verificare changelog.

### Deploy

```bash
git pull origin main
docker compose up --build -d
docker compose ps
curl http://localhost:5080/api/health
```

### Rollback

1. fermare il deploy se il health check fallisce;
2. conservare i log;
3. ripristinare il commit precedente;
4. ripristinare il database se la migrazione non è compatibile;
5. ricostruire l'immagine;
6. verificare l'health check;
7. registrare l'incidente.

## 24. Registro avanzamento

Usare questa tabella per tenere traccia delle fasi:

| Fase | Stato | Commit/PR | Data | Note |
| --- | --- | --- | --- | --- |
| 0. Preparazione | Da fare |  |  |  |
| 1. Database | Da fare |  |  |  |
| 2. Auth e permessi | Da fare |  |  |  |
| 3. Agente e nodi | Da fare |  |  |  |
| 4. Metriche e salute | Da fare |  |  |  |
| 5. Docker | Da fare |  |  |  |
| 6. Servizi pubblici | Da fare |  |  |  |
| 7. Backup | Da fare |  |  |  |
| 8. Reverse proxy e SSL | Da fare |  |  |  |
| 9. OVH e DNS | Da fare |  |  |  |
| 10. Tailscale e sicurezza | Da fare |  |  |  |
| 11. Pushover | Da fare |  |  |  |
| 12. Morning report | Da fare |  |  |  |
| 13. Plugin | Da fare |  |  |  |
| 14. AI Assistant | Da fare |  |  |  |
| 15. Produzione | Da fare |  |  |  |
| 16. Installazione Mac mini | Da fare |  |  |  |

## 25. Definizione di “completato”

Una fase è completata solo quando:

- il codice è presente nel branch principale;
- i dati non sono più simulati per quella funzionalità;
- esistono test proporzionati;
- gli errori sono gestiti;
- i permessi sono applicati;
- esiste almeno una procedura di rollback;
- il manuale utente è aggiornato;
- il manuale evoluzione è aggiornato;
- il comportamento è stato verificato in Docker;
- il commit è stato pubblicato su GitHub.

## 26. Sequenza consigliata per il lavoro futuro

La sequenza pratica consigliata è:

1. Fase 0, preparazione;
2. Fase 1, database;
3. Fase 2, autenticazione;
4. Fase 3, agente;
5. Fase 4, metriche;
6. Fase 5, Docker;
7. Fase 6, servizi;
8. Fase 7, backup;
9. Fase 8, reverse proxy e SSL;
10. Fase 9, DNS e DynHost;
11. Fase 10, Tailscale e sicurezza;
12. Fase 11, Pushover;
13. Fase 12, report;
14. Fase 13, plugin;
15. Fase 14, AI;
16. Fase 15, produzione;
17. Fase 16, installazione definitiva sul Mac mini Ubuntu.

Questa sequenza mantiene il sistema utilizzabile durante l'evoluzione e riduce il rischio di collegare integrazioni reali prima che autenticazione, persistenza, audit e rollback siano pronti.