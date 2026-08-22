# MSCC · MicroSaaS Control Center

MSCC è il control plane modulare dell'infrastruttura MicroSaaS multi-nodo. È progettato per sostituire progressivamente BoltUbuntu Dashboard e RaspyDashboard con un'unica piattaforma scalabile per server, workload Docker, servizi pubblici, rete, sicurezza e operazioni.

## Fondamenta attuali

- Frontend React + TypeScript + Vite
- Backend FastAPI con risorse tipizzate per nodi, salute e servizi
- Struttura container pronta per SQLite
- Interfaccia enterprise scura e responsive
- Modello di navigazione basato sui nodi, non vincolato a due sole macchine
- Schermate predisposte per Docker, reti, volumi, immagini, reverse proxy, domini, DNS, backup, log, health check, report e impostazioni
- Command palette interattiva, pannello dettaglio nodo, azioni sugli alert e filtro dei servizi
- Fondamenta Manager/Worker con report giornalieri persistenti alle 11:15 Europe/Rome e monitoraggio degli alert attivi

L'interfaccia utilizza attualmente dati rappresentativi mentre i livelli dell'agente e della persistenza SQLite vengono collegati. Il contratto API in `backend/app/main.py` costituisce il punto di partenza per queste integrazioni.

## Sviluppo locale

```bash
npm install
npm run dev
```

Il frontend è disponibile sulla porta `5080`. Il backend può essere avviato separatamente:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload --port 8000
```

## Docker

```bash
docker compose up --build
```

L'applicazione è esposta sulla porta `5080`. Il backend rimane disponibile all'interno del container sulla porta `8000`.

## Manuale utente

La guida completa per l'utilizzo è disponibile in [MANUALE_UTENTE.md](MANUALE_UTENTE.md).

La roadmap passo-passo per lo sviluppo delle funzionalità è disponibile in [MANUALE_EVOLUZIONE.md](MANUALE_EVOLUZIONE.md).

La mappa funzionale con il confronto tra funzionalità attuali e finali è disponibile in [MANUALE_FUNZIONALITA.md](MANUALE_FUNZIONALITA.md).

## Livelli di integrazione previsti

1. Agente MSCC per la registrazione sicura dei nodi e la raccolta delle metriche.
2. Persistenza SQLModel/SQLite con migrazioni compatibili con PostgreSQL.
3. Adapter per Docker Engine, Nginx Proxy Manager, OVH DNS, Tailscale e Pushover.
4. Regole di notifica e report mattutini pianificati.
5. Registro dei plugin con manifest e permessi limitati alle capacità necessarie.
6. AI Assistant per l'analisi delle anomalie e le raccomandazioni sull'infrastruttura.

Lo stack Docker Compose attuale contiene `mscc-manager` per API e interfaccia web e `mscc-worker` per i controlli periodici e i report giornalieri. Il worker è intenzionalmente separato dal Manager, così i controlli di lunga durata non bloccano l'applicazione web.