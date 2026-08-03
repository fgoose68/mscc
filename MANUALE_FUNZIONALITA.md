# Manuale delle funzionalità

## MSCC · MicroSaaS Control Center

Documento di riferimento funzionale per capire cosa fa MSCC oggi, come funzionerà a regime e quali moduli verranno progressivamente collegati all'infrastruttura reale.

## 1. Scopo di MSCC

MSCC è il **control plane centrale** dell'infrastruttura MicroSaaS. Il suo compito non è sostituire fisicamente Docker, Nginx Proxy Manager, OVH, Tailscale o Pushover, ma coordinarli e renderli consultabili da un'unica piattaforma.

MSCC dovrà permettere di:

- osservare tutti i server da un unico punto;
- collegare nodi diversi senza modificare l'architettura;
- correlare nodi, container, servizi, domini, certificati e backup;
- rilevare problemi prima che diventino critici;
- ricevere notifiche utili;
- eseguire operazioni autorizzate;
- conservare storico e audit;
- automatizzare attività ricorrenti;
- aggiungere moduli futuri tramite plugin.

Il modello operativo è:

```text
Browser
  ↓ HTTPS
MSCC Control Center
  ├── Frontend React
  ├── API FastAPI
  ├── Database
  ├── Scheduler
  ├── Eventi e notifiche
  └── Adapter esterni
          ↓ HTTPS autenticato
      MSCC Agent
          ↓
      Sistema operativo / Docker / servizi
```

## 2. Come deve funzionare a regime

Su ogni server viene installato un **MSCC Agent**. L'agente raccoglie informazioni dal nodo e le invia al Control Center tramite una connessione autenticata e cifrata.

Il Control Center:

1. riceve heartbeat e metriche;
2. salva i dati nel database;
3. valuta soglie e health check;
4. aggiorna dashboard e moduli;
5. crea eventi e alert;
6. invia notifiche secondo le regole;
7. permette operazioni autorizzate;
8. registra il risultato nell'audit log.

Esempio: se un servizio Docker risponde lentamente, MSCC distingue il problema del servizio da quello del nodo, visualizza lo stato `Degraded`, registra il tempo di risposta, invia un alert e permette di verificare o riavviare il container.

## 3. Stato funzionale attuale

La versione presente nel repository è una **base funzionante di interfaccia e architettura**, con dati dimostrativi.

### Funzionalità già presenti

- applicazione React/TypeScript/Vite;
- tema scuro responsive;
- navigazione modulare;
- modello concettuale multi-node;
- dashboard Overview;
- schede nodi con metriche rappresentative;
- pannello dettaglio nodo;
- elenco servizi pubblici;
- filtro servizi;
- alert banner;
- riepilogo backup;
- riepilogo sicurezza;
- riepilogo rete e DNS;
- attività recenti;
- command palette `⌘ K`;
- toast di conferma;
- pagine base per tutti i moduli;
- API FastAPI iniziali;
- API health check;
- API elenco e dettaglio nodi;
- API riepilogo salute;
- API elenco servizi;
- configurazione Docker;
- porta applicativa `5080`;
- documentazione utente ed evolutiva.

### Limiti attuali

I seguenti elementi non sono ancora collegati a dati reali:

- nodi reali;
- Docker Engine;
- database persistente;
- autenticazione;
- agente MSCC;
- backup;
- Nginx Proxy Manager;
- OVH;
- DNS e DynHost;
- SSL reale;
- Tailscale;
- Pushover;
- scheduler;
- plugin;
- AI Assistant.

Le azioni visibili nell'interfaccia generano attualmente feedback dimostrativi e non modificano ancora l'infrastruttura.

## 4. Schema sintetico: oggi e a regime

| Area | Presente oggi | Evoluzione prevista |
| --- | --- | --- |
| Dashboard | UI completa con dati dimostrativi | Dati live, storico e correlazione eventi |
| Nodi | Schede di esempio e drawer dettagli | Enrollment, heartbeat, metriche e azioni reali |
| CPU/RAM/disco | Valori rappresentativi | Raccolta periodica dagli agenti |
| Temperatura | Valore rappresentativo | Sensori reali con soglie configurabili |
| Docker | Modulo visuale e tabella | Container, log, start/stop/restart, stats |
| Servizi | Elenco e filtro | Health check HTTP/HTTPS e risposta reale |
| Networks | Pagina predisposta | Reti Docker e workload collegati |
| Volumes | Pagina predisposta | Storage, utilizzo, retention e alert |
| Images | Pagina predisposta | Tag, digest, versioni e aggiornamenti |
| Reverse Proxy | Pagina predisposta | Nginx Proxy Manager reale |
| Domains & SSL | Tabella dimostrativa | Certificati, scadenze e stato TLS reale |
| DNS & DynHost | Riepilogo dimostrativo | OVH, sincronizzazione IP e audit DNS |
| Backups | Stato e storico dimostrativi | Job reali, destinazioni, retention e restore |
| Security | Indicatori rappresentativi | HTTPS, firewall, SSH e Tailscale reali |
| Tailscale | Riepilogo predisposto | Nodi privati, tailnet e dispositivi collegati |
| Notifications | Toast locale | Pushover, regole, priorità e cooldown |
| Reports | Pagina predisposta | Morning Report pianificato e storico |
| Logs | Modulo navigabile | Audit log e log runtime centralizzati |
| Health checks | Modulo navigabile | Check configurabili e alert di transizione |
| Authentication | Profilo grafico | Login, sessioni, ruoli e permessi |
| Database | API demo in memoria | SQLite con migrazioni, poi PostgreSQL |
| Plugin | Navigazione modulare | Plugin firmati e capability-scoped |
| AI Assistant | Voce “Coming soon” | Analisi read-only e raccomandazioni |

## 5. Funzionalità della dashboard

### 5.1 Overview

È il punto di ingresso operativo. Deve rispondere rapidamente a tre domande:

1. L'infrastruttura è sana?
2. Cosa richiede attenzione?
3. Dove devo intervenire?

La Overview finale mostrerà:

- stato globale;
- nodi online/offline/manutenzione;
- CPU, RAM, disco e temperatura;
- container attivi e arrestati;
- warning e alert critici;
- servizi pubblici;
- SSL;
- backup;
- sicurezza;
- DNS e IP pubblico;
- attività recenti.

### 5.2 Alert banner

Raccoglie i problemi che richiedono attenzione. A regime ogni alert avrà:

- severità;
- origine;
- nodo;
- risorsa;
- data apertura;
- ultimo aggiornamento;
- stato aperto/risolto;
- azione consigliata;
- eventuale notifica inviata.

### 5.3 Stato globale

Lo stato `All systems operational` dovrà essere calcolato e non scritto staticamente. Le regole potranno essere:

- verde: nessun problema aperto;
- giallo: warning o servizi degradati;
- rosso: alert critici o nodi offline;
- blu: sistema in manutenzione.

## 6. Funzionalità di gestione nodi

### 6.1 Anagrafica nodo

Ogni nodo dovrà contenere:

- nome;
- descrizione;
- hostname;
- sistema operativo;
- versione OS;
- architettura;
- CPU;
- RAM;
- disco;
- temperatura;
- Docker Engine;
- Docker Compose;
- uptime;
- IP locali;
- IP Tailscale;
- stato;
- ultimo heartbeat;
- versione agente.

### 6.2 Stati

- **Online**: heartbeat regolare;
- **Offline**: heartbeat assente oltre soglia;
- **Maintenance**: escluso temporaneamente dagli alert;
- **Warning**: nodo raggiungibile ma con una condizione anomala.

### 6.3 Enrollment

Il futuro flusso sarà:

1. amministratore sceglie **Connect a new node**;
2. MSCC genera un token monouso;
3. l'utente installa l'agente sul server;
4. l'agente usa il token per registrarsi;
5. MSCC verifica e associa il nodo;
6. il token viene revocato o sostituito;
7. il nodo passa online al primo heartbeat.

## 7. Docker Management

Il modulo Docker sarà il livello operativo per i workload containerizzati.

### Consultazione

- elenco container per nodo;
- stato;
- immagine;
- porte;
- rete;
- volume;
- uptime;
- health status;
- utilizzo CPU e RAM;
- restart count;
- log;
- data ultimo aggiornamento.

### Azioni

- start;
- stop;
- restart;
- visualizzazione log;
- ispezione;
- aggiornamento immagine;
- visualizzazione statistiche.

Le azioni saranno disponibili solo in base al ruolo e richiederanno conferma quando possono causare interruzioni.

### Immagini, volumi e reti

Il modulo dovrà collegare:

```text
Nodo → Container → Immagine
              ├── Volumi
              └── Networks
```

Questo consentirà di capire l'impatto di una pulizia o di un aggiornamento.

## 8. Servizi pubblici e health check

Un servizio pubblico è un'applicazione raggiungibile tramite dominio o endpoint. Non coincide necessariamente con un singolo container.

MSCC dovrà controllare:

- URL;
- HTTPS;
- status code;
- response time;
- timeout;
- certificato;
- container collegato;
- nodo;
- proxy host.

Stati:

- `Healthy`;
- `Degraded`;
- `Stopped`;
- `Unknown`.

Un servizio sarà `Degraded` quando il nodo è online ma il controllo applicativo fallisce o supera le soglie.

## 9. Reverse Proxy, domini e SSL

### Reverse Proxy

Il modulo leggerà da Nginx Proxy Manager:

- proxy host;
- dominio;
- destinazione;
- porta;
- SSL;
- redirect;
- errori;
- stato.

### Domini e certificati

MSCC dovrà controllare:

- validità certificato;
- issuer;
- hostname;
- scadenza;
- catena TLS;
- HTTPS;
- giorni rimanenti.

Soglie consigliate:

- warning a 30 giorni;
- attenzione a 14 giorni;
- critico a 3 giorni;
- errore dopo scadenza.

## 10. OVH, DNS, DynHost e IP pubblico

Il modulo collegherà l'IP rilevato a:

- dominio;
- zona DNS;
- record;
- DynHost;
- nodo;
- data ultima sincronizzazione.

In caso di cambio IP:

1. MSCC lo rileva;
2. confronta il record corrente;
3. applica la policy;
4. aggiorna DynHost se autorizzato;
5. registra valore precedente e nuovo;
6. invia la notifica;
7. verifica la propagazione.

## 11. Backup e continuità operativa

Il modulo Backup dovrà offrire:

- configurazione destinazioni;
- esecuzione manuale;
- pianificazione;
- storico;
- dimensione;
- durata;
- checksum;
- retention;
- verifica integrità;
- restore in ambiente controllato.

Un backup non sarà considerato “sano” solo perché il comando è terminato: dovrà essere verificabile e possibilmente testato con un restore.

## 12. Sicurezza e connettività privata

### Security posture

La pagina riunirà:

- HTTPS;
- certificati;
- firewall;
- SSH;
- Tailscale;
- porte esposte;
- alert sicurezza;
- data ultima scansione.

### Tailscale

MSCC dovrà mostrare:

- stato tailnet;
- nodi privati;
- IP Tailscale;
- dispositivi connessi;
- ultimo contatto;
- nodo offline;
- differenza tra problema pubblico e problema VPN.

## 13. Notifiche e Morning Report

### Eventi notificabili

- nodo offline;
- container fermo;
- container riavviato;
- backup completato;
- backup fallito;
- IP cambiato;
- SSL in scadenza;
- aggiornamento Docker;
- health check fallito;
- morning report pronto.

Le regole dovranno avere:

- abilitazione;
- priorità;
- destinatario;
- cooldown;
- deduplicazione;
- orari di silenzio;
- storico consegne.

### Morning Report

Il report finale dovrà includere:

- stato nodi;
- Docker;
- container;
- CPU, RAM e disco;
- temperatura;
- servizi;
- SSL;
- IP;
- DynHost;
- DNS;
- backup;
- warning;
- criticità;
- aggiornamenti.

## 14. Logs, audit e Health Checks

### Logs

Il sistema distinguerà:

- log applicativi;
- log agente;
- log Docker;
- audit log;
- log integrazioni;
- eventi notifiche.

Ogni evento importante dovrà avere timestamp, livello, origine, nodo e risorsa.

### Audit

L'audit log registrerà:

- chi ha eseguito l'azione;
- cosa è stato richiesto;
- su quale nodo;
- risultato;
- errore;
- data;
- correlation ID.

### Health Checks

I controlli saranno configurabili per:

- nodo;
- servizio;
- URL;
- porta;
- certificato;
- Docker;
- backup;
- DNS;
- Tailscale.

## 15. Autenticazione, ruoli e permessi

Ruoli iniziali:

- **Administrator**: accesso totale;
- **Operator**: gestione operativa;
- **Viewer**: sola lettura.

Prima di attivare operazioni reali, MSCC dovrà proteggere:

- API;
- sessioni;
- password;
- integrazioni;
- azioni Docker;
- DNS;
- backup;
- plugin.

## 16. Database e persistenza

La transizione sarà:

```text
dati demo in memoria
        ↓
SQLite con migrazioni
        ↓
PostgreSQL per produzione/scalabilità
```

Le entità principali saranno:

- `nodes`;
- `node_metrics`;
- `services`;
- `containers`;
- `images`;
- `volumes`;
- `networks`;
- `domains`;
- `ssl_certificates`;
- `backups`;
- `health_checks`;
- `alerts`;
- `activity_logs`;
- `integrations`;
- `users`;
- `roles`.

## 17. Plugin e AI Assistant

### Plugin

Ogni plugin dovrà definire:

- nome;
- versione;
- compatibilità;
- permessi;
- moduli;
- endpoint;
- configurazione;
- lifecycle.

Esempi: Proxmox, TrueNAS, Cloudflare, Hetzner, Kubernetes.

### AI Assistant

La prima versione sarà read-only e potrà:

- riassumere la salute;
- rilevare anomalie;
- prevedere storage;
- individuare workload instabili;
- consigliare aggiornamenti;
- suggerire spostamenti.

Non dovrà eseguire azioni automaticamente senza approvazione esplicita.

## 18. Schema per moduli: presente, intermedio e finale

| Modulo | Presente adesso | Prossimo aggiornamento | Funzionalità finale |
| --- | --- | --- | --- |
| Overview | Layout e dati demo | API + database | Control center live |
| Nodes | Schede e dettaglio | Agente + enrollment | Fleet management |
| Docker | Pagina base | Read-only reale | Gestione completa |
| Containers | Riepilogo demo | Snapshot agente | Log, stats e azioni |
| Networks | Schermata base | Inventario reti | Gestione e correlazione |
| Volumes | Schermata base | Inventario storage | Utilizzo e lifecycle |
| Images | Schermata base | Tag/digest | Update e cleanup controllato |
| Services | Lista e filtro | Health check reale | Monitoraggio end-to-end |
| Reverse Proxy | Schermata base | Adapter NPM read-only | Gestione proxy |
| Domains | Tabella demo | Import domini | Monitoraggio completo |
| SSL | Giorni demo | Verifica TLS | Alert e rinnovo controllato |
| DNS | Riepilogo demo | Adapter OVH read-only | Sync e aggiornamento |
| DynHost | Riepilogo IP | Rilevazione cambio | Sync automatizzata |
| Backups | Stato demo | Job e storico | Backup verificato e restore |
| Notifications | Toast locale | Event dispatcher | Pushover configurabile |
| Reports | Pagina base | Scheduler | Morning Report automatico |
| Logs | Navigazione | Eventi persistenti | Log centralizzati e audit |
| Health | Riquadro sicurezza | Check engine | Soglie e alert |
| Security | Indicatori demo | Controlli reali | Postura sicurezza completa |
| Tailscale | Schermata predisposta | Adapter read-only | Stato VPN e tailnet |
| Auth | Profilo grafico | Login e RBAC | Sicurezza completa |
| Database | In-memory | SQLite/Alembic | PostgreSQL ready |
| Plugin | Modulo concettuale | Manifest/plugin demo | Ecosistema estendibile |
| AI | Coming soon | Analisi dati | Assistente read-only |

## 19. Roadmap funzionale di aggiornamento

### Milestone A — Base operativa

- database SQLite;
- migrazioni;
- autenticazione;
- ruoli;
- API reali;
- audit log.

**Risultato:** applicazione persistente e protetta.

### Milestone B — Primo nodo reale

- agente;
- enrollment;
- heartbeat;
- metriche;
- stato online/offline;
- installazione Mac mini Ubuntu.

**Risultato:** MSCC controlla almeno un server reale.

### Milestone C — Docker e servizi

- container reali;
- logs;
- stats;
- health check;
- public services live.

**Risultato:** MSCC rileva e diagnostica workload reali.

### Milestone D — Operazioni e continuità

- restart/start/stop autorizzati;
- backup;
- restore;
- notifiche;
- alert.

**Risultato:** MSCC può reagire a problemi controllati.

### Milestone E — Edge e sicurezza

- Nginx Proxy Manager;
- SSL;
- OVH;
- DNS;
- DynHost;
- Tailscale;
- firewall e SSH.

**Risultato:** tutta la superficie infrastrutturale è collegata.

### Milestone F — Automazione

- scheduler;
- Morning Report;
- retention;
- regole notifiche;
- controlli periodici.

**Risultato:** MSCC lavora anche senza intervento manuale.

### Milestone G — Estensione

- plugin;
- PostgreSQL;
- installazione production;
- AI Assistant.

**Risultato:** piattaforma scalabile e ampliabile.

## 20. Cosa significa “funzionalità completata”

Una funzione sarà considerata completata solo se:

- usa dati reali o lo stato è dichiarato esplicitamente;
- ha endpoint e modello coerenti;
- gestisce loading, vuoto ed errore;
- applica autenticazione e permessi;
- registra le operazioni sensibili;
- ha test;
- ha timeout e retry dove necessari;
- non espone segreti;
- è documentata;
- è verificata in Docker;
- dispone di procedura di rollback;
- è stata pubblicata su GitHub.

## 21. Come MSCC sarà efficace nella pratica

MSCC sarà efficace quando ridurrà:

- il numero di pannelli da controllare;
- il tempo di diagnosi;
- i problemi scoperti in ritardo;
- i certificati dimenticati;
- i backup non verificati;
- le operazioni manuali ripetitive;
- il rischio di modifiche non tracciate.

Il risultato atteso è:

```text
Problema rilevato
  ↓
Alert contestualizzato
  ↓
Nodo e servizio identificati
  ↓
Azione autorizzata
  ↓
Verifica risultato
  ↓
Audit e report
```

## 22. Riferimenti

- [Manuale utente](MANUALE_UTENTE.md)
- [Manuale evoluzione](MANUALE_EVOLUZIONE.md)
- [README](README.md)
