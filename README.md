# MSCC · MicroSaaS Control Center

MSCC is the modular control plane for a multi-node MicroSaaS infrastructure. It is designed to progressively replace BoltUbuntu Dashboard and RaspyDashboard with one scalable platform for servers, Docker workloads, public services, networking, security and operations.

## Current foundation

- React + TypeScript + Vite frontend
- FastAPI backend with typed node, health and service resources
- SQLite-ready container layout
- Responsive dark enterprise UI
- Node-first navigation model that is not coupled to two machines
- Module-ready screens for Docker, networks, volumes, images, reverse proxy, domains, DNS, backups, logs, health checks, reports and settings
- Interactive command palette, node details drawer, alert actions and live-style service filtering

The UI currently uses representative data while the agent and SQLite persistence layers are connected. The API contract in `backend/app/main.py` is the starting point for those integrations.

## Local development

```bash
npm install
npm run dev
```

The frontend is available on port `5080`. The backend can be started separately:

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

The application is exposed on port `5080`. The backend remains available inside the container on port `8000`.

## Manuale utente

La guida completa in italiano è disponibile in [MANUALE_UTENTE.md](MANUALE_UTENTE.md).

## Planned integration layers

1. MSCC Agent for secure node enrollment and metric collection.
2. SQLModel/SQLite persistence with PostgreSQL-compatible migrations.
3. Docker Engine, Nginx Proxy Manager, OVH DNS, Tailscale and Pushover adapters.
4. Notification rules and scheduled morning reports.
5. Plugin registry with capability-scoped module manifests.
6. AI Assistant for anomaly analysis and infrastructure recommendations.