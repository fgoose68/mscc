# Manuale utente

## MSCC · MicroSaaS Control Center

Versione iniziale del prodotto

## 1. Scopo della piattaforma

MSCC è il centro di controllo dell'infrastruttura MicroSaaS. L'applicazione è stata progettata per gestire più server, chiamati **nodi**, senza assumere che l'infrastruttura sia composta soltanto da un Mac mini e da un Raspberry Pi.

Un nodo può essere, per esempio:

- Mac mini Ubuntu;
- Raspberry Pi;
- VPS;
- NAS;
- Mini PC;
- server cloud;
- qualsiasi altro server Linux compatibile con il futuro agente MSCC.

La versione attuale costituisce la base operativa e visiva della piattaforma. L'interfaccia contiene dati dimostrativi rappresentativi: le integrazioni con i server reali, Docker, Nginx Proxy Manager, OVH, Tailscale, Pushover e SQLite saranno collegate progressivamente.

## 2. Avvio dell'applicazione

### Avvio frontend in sviluppo

Dalla cartella del progetto:

```bash
cd /Users/fabrizio/progetti/mscc
npm install
npm run dev
```

L'applicazione sarà disponibile all'indirizzo:

[http://localhost:5080](http://localhost:5080)

### Avvio tramite Docker

```bash
cd /Users/fabrizio/progetti/mscc
docker compose up --build
```

In questo caso l'applicazione sarà esposta sulla porta `5080` del computer che esegue Docker.

Per avviare il servizio in background:

```bash
docker compose up --build -d
```

Per arrestarlo:

```bash
docker compose down
```

## 3. Struttura dell'interfaccia

L'interfaccia è composta da:

1. **Barra laterale**, con i moduli della piattaforma.
2. **Barra superiore**, con il percorso della pagina, la ricerca globale, lo stato generale, le notifiche e il profilo.
3. **Area principale**, che mostra dashboard, tabelle, schede e dettagli.
4. **Pannelli interattivi**, come il dettaglio dei nodi, la command palette e i messaggi di conferma.

Il tema è scuro, ottimizzato per l'uso prolungato e responsive su desktop, tablet e dispositivi mobili.

## 4. Dashboard Overview

La voce **Overview** è la pagina iniziale e offre una panoramica dell'intera infrastruttura.

### Intestazione

Nella parte superiore sono disponibili:

- messaggio di benvenuto;
- descrizione dello stato corrente dell'infrastruttura;
- pulsante **Morning report** per simulare la generazione del report mattutino;
- pulsante **Add node** per accedere al modulo di gestione dei nodi.

### Avvisi

Il riquadro arancione mostra gli elementi che richiedono attenzione. Nella versione attuale segnala:

- un servizio in stato degradato;
- un certificato SSL in scadenza entro 14 giorni.

Il pulsante **Review alerts** apre il modulo **Domains & SSL**. L'icona a destra consente di simulare il rinvio dell'avviso.

### Indicatori principali

Le quattro schede sintetiche mostrano:

- **CPU usage**: utilizzo medio dei processori;
- **Memory**: memoria utilizzata rispetto alla memoria disponibile;
- **Storage**: spazio occupato rispetto allo spazio totale;
- **Temperature**: temperatura media rilevata.

Ogni scheda mostra anche una variazione percentuale o un'indicazione di stabilità.

## 5. Gestione dei nodi

La sezione **Nodes** mostra i server registrati nella piattaforma.

Per ogni nodo sono visualizzati:

- nome;
- descrizione;
- hostname;
- architettura;
- stato operativo;
- uptime;
- numero di container;
- utilizzo CPU;
- utilizzo RAM;
- utilizzo disco.

Gli stati previsti dalla piattaforma sono:

- **Online**: il nodo risponde correttamente;
- **Offline**: il nodo non è raggiungibile;
- **Maintenance**: il nodo è in manutenzione;
- **Attention**: il nodo è operativo ma presenta un avviso.

### Dettaglio di un nodo

Selezionando una scheda nodo si apre un pannello laterale con:

- stato e hostname;
- sistema operativo;
- architettura;
- uptime;
- temperatura;
- grafici di utilizzo CPU, RAM e disco;
- versione Docker Engine;
- versione Docker Compose.

Dal pannello è possibile simulare:

- attivazione della modalità manutenzione;
- aggiornamento dei dati del nodo;
- chiusura del pannello.

### Collegamento di un nuovo nodo

Il riquadro **Connect a new node** rappresenta il punto di accesso futuro alla procedura di registrazione di:

- NAS;
- VPS;
- Mini PC;
- server cloud;
- ulteriori macchine Linux.

Nella versione attuale il pulsante apre un messaggio dimostrativo.

## 6. Public services

La sezione **Public services** elenca le applicazioni pubblicate su Internet.

Per ogni servizio sono riportati:

- nome dell'applicazione;
- nome del container;
- nodo su cui gira;
- stato applicativo;
- dominio;
- tempo di risposta;
- giorni rimanenti alla scadenza SSL;
- pulsante **Open**.

Gli stati dei servizi sono:

- **Healthy**: servizio operativo;
- **Degraded**: servizio raggiungibile ma con prestazioni o controlli non ottimali;
- **Stopped**: servizio arrestato.

### Filtro dei servizi

Il campo **Filter services...** permette di filtrare l'elenco per:

- nome del servizio;
- dominio;
- nodo;
- nome del container.

Il pulsante di aggiornamento simula il ricaricamento dei dati.

## 7. Recent activity

Il pannello **Recent activity** mostra gli eventi più recenti dell'infrastruttura, tra cui:

- completamento di un backup;
- riavvio di un container;
- rilevamento di un nuovo IP pubblico;
- disponibilità di un aggiornamento Docker.

Il pulsante **View activity log** apre il modulo **Logs**.

## 8. Backup status

Il pannello **Backup status** mostra:

- data e ora dell'ultimo backup;
- dimensione del backup;
- durata dell'operazione;
- percentuale di avanzamento rappresentata;
- tempo stimato al prossimo backup;
- stato generale;
- collegamento al modulo **Backups**.

Nella versione attuale il backup visualizzato è un dato dimostrativo.

## 9. Security posture

Il pannello **Security posture** sintetizza i controlli di sicurezza:

- HTTPS;
- firewall;
- Tailscale;
- numero di rilevazioni critiche;
- data dell'ultima scansione.

Il collegamento **View checks** apre **Health checks**.

## 10. Network & DNS

Il pannello **Network & DNS** mostra lo stato della sincronizzazione DynHost e include:

- IP pubblico;
- momento dell'ultimo aggiornamento;
- numero di record DNS in stato corretto;
- collegamento a **DNS & DynHost**.

## 11. Moduli disponibili

### Nodes

Gestione della flotta di server e accesso ai dettagli di ciascun nodo.

### Services

Catalogo delle applicazioni pubblicate, con stato, dominio, SSL e risposta.

### Docker

Area predisposta per la gestione di:

- container;
- immagini;
- volumi;
- reti;
- statistiche di utilizzo;
- log dei container;
- avvio, arresto e riavvio.

La pagina attuale mostra una tabella riepilogativa dei nodi e dei container.

### Networks

Modulo predisposto per la consultazione e gestione delle reti Docker e dei workload collegati.

### Volumes

Modulo predisposto per il controllo dello storage persistente e dell'utilizzo disco.

### Images

Modulo predisposto per la gestione delle immagini Docker, delle versioni e degli aggiornamenti disponibili.

### Reverse Proxy

Modulo predisposto per il monitoraggio di Nginx Proxy Manager:

- proxy host;
- certificati SSL;
- redirect;
- errori;
- stato degli instradamenti.

### Domains & SSL

Modulo per il controllo di domini e certificati. La tabella visualizza:

- dominio;
- provider DNS;
- stato del certificato;
- giorni alla scadenza.

Gli stati possono essere **Valid** o **Expiring**.

### DNS & DynHost

Modulo predisposto per:

- IP pubblico;
- record DNS OVH;
- sincronizzazione DynHost;
- rilevamento dei cambi di IP;
- stato dei domini.

### Backups

Modulo predisposto per:

- ultimo backup;
- dimensione;
- durata;
- storico;
- retention;
- esecuzione manuale.

### Logs

Modulo predisposto per la consultazione centralizzata dei log di attività e runtime provenienti da tutti i nodi.

### Health checks

Modulo predisposto per definire e monitorare controlli relativi a:

- nodi;
- servizi;
- connettività;
- HTTPS;
- firewall;
- Tailscale;
- Docker.

### Reports

Modulo predisposto per generare report infrastrutturali e report mattutini.

Il report mattutino dovrà includere:

- stato dei nodi;
- Docker;
- container;
- CPU;
- RAM;
- disco;
- SSL;
- IP pubblico;
- DynHost;
- DNS;
- backup;
- avvisi.

### Settings

Modulo predisposto per configurare:

- integrazioni;
- notifiche;
- utenti;
- preferenze della piattaforma;
- orario del report mattutino;
- collegamenti con i nodi.

## 12. Barra superiore

### Ricerca globale

Il pulsante **Search anything** apre la command palette. È possibile aprirla anche con:

```text
⌘ K
```

La command palette permette di raggiungere rapidamente:

- Overview;
- Nodes;
- Services;
- Docker;
- Domains & SSL;
- Backups;
- Logs;
- Health checks;
- Settings.

Per chiuderla è possibile:

- premere `ESC`;
- fare clic fuori dal pannello.

### Stato generale

La dicitura **All systems operational** rappresenta lo stato generale corrente dell'infrastruttura.

### Notifiche

L'icona a campanella apre il messaggio di stato delle notifiche. Il sistema Pushover sarà collegato in una fase successiva.

### Profilo

L'avatar in alto a destra identifica l'utente amministratore corrente.

## 13. Barra laterale

La barra laterale contiene:

- selettore del workspace;
- moduli operativi;
- collegamento ai report;
- impostazioni;
- accesso futuro all'AI Assistant;
- profilo utente.

Il pulsante in basso consente di comprimere la barra laterale. Su schermi piccoli la barra si apre tramite il pulsante menu nella barra superiore.

## 14. Messaggi e azioni dimostrative

Quando si esegue un'azione non ancora collegata a un'integrazione reale, MSCC mostra un messaggio temporaneo nella parte inferiore destra.

Questi messaggi confermano azioni come:

- report generato;
- dati aggiornati;
- servizio aperto;
- nodo messo in manutenzione;
- alert rinviato;
- operazione accodata.

Il messaggio scompare automaticamente.

## 15. API attualmente disponibili

Il backend FastAPI espone questi endpoint:

| Endpoint | Funzione |
| --- | --- |
| `GET /api/health` | Verifica che l'API sia attiva |
| `GET /api/nodes` | Elenco dei nodi |
| `GET /api/nodes/{node_id}` | Dettaglio di un nodo |
| `GET /api/health/summary` | Riepilogo della salute dell'infrastruttura |
| `GET /api/services` | Elenco dei servizi pubblici |

L'API è pronta per essere collegata all'interfaccia al posto dei dati dimostrativi.

## 16. Funzionalità non ancora operative

Sono già rappresentate nell'interfaccia ma richiedono le integrazioni backend:

- raccolta dati reale dai nodi;
- autenticazione e registrazione dei nodi;
- persistenza SQLite;
- migrazione PostgreSQL;
- gestione reale dei container Docker;
- log Docker;
- Nginx Proxy Manager;
- OVH DNS e DynHost;
- certificati SSL reali;
- Tailscale;
- Pushover;
- backup reali e retention;
- scheduler del report mattutino;
- sistema plugin;
- AI Assistant;
- utenti e permessi avanzati.

## 17. Aggiornamento del progetto da GitHub

Per recuperare l'ultima versione del progetto:

```bash
cd /Users/fabrizio/progetti/mscc
git pull origin main
```

Dopo un aggiornamento del codice, se si usa Docker:

```bash
docker compose up --build -d
```

## 18. Prossime evoluzioni consigliate

L'ordine consigliato per trasformare la base attuale in una piattaforma operativa è:

1. agente MSCC per i nodi;
2. database SQLite e modelli persistenti;
3. autenticazione e autorizzazioni;
4. integrazione Docker;
5. integrazione backup e notifiche;
6. integrazione Nginx Proxy Manager, OVH e Tailscale;
7. report automatici;
8. sistema plugin;
9. AI Assistant.