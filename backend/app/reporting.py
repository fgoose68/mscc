from __future__ import annotations

import json
import os
import sqlite3
from datetime import datetime, timezone
from typing import Any, Iterable
from zoneinfo import ZoneInfo


DEFAULT_DB_PATH = "data/mscc.db"


def database_path() -> str:
    return os.getenv("MSCC_DB_PATH", DEFAULT_DB_PATH)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _connect(db_path: str | None = None) -> sqlite3.Connection:
    path = db_path or database_path()
    directory = os.path.dirname(path)
    if directory:
        os.makedirs(directory, exist_ok=True)
    connection = sqlite3.connect(path, timeout=30)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA journal_mode=WAL")
    connection.execute("PRAGMA busy_timeout=30000")
    return connection


def initialize_database(db_path: str | None = None) -> None:
    with _connect(db_path) as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS daily_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                report_date TEXT NOT NULL UNIQUE,
                generated_at TEXT NOT NULL,
                overall_status TEXT NOT NULL,
                summary_json TEXT NOT NULL,
                findings_json TEXT NOT NULL,
                payload_json TEXT NOT NULL DEFAULT '{}'
            );

            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fingerprint TEXT NOT NULL UNIQUE,
                severity TEXT NOT NULL,
                title TEXT NOT NULL,
                detail TEXT NOT NULL,
                is_active INTEGER NOT NULL DEFAULT 1,
                first_seen_at TEXT NOT NULL,
                last_seen_at TEXT NOT NULL,
                resolved_at TEXT
            );

            CREATE TABLE IF NOT EXISTS worker_heartbeats (
                worker_id TEXT PRIMARY KEY,
                last_seen_at TEXT NOT NULL,
                status TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_daily_reports_generated_at
                ON daily_reports (generated_at DESC);
            CREATE INDEX IF NOT EXISTS idx_alerts_active_severity
                ON alerts (is_active, severity, last_seen_at DESC);
            """
        )
        columns = {
            row["name"]
            for row in connection.execute("PRAGMA table_info(daily_reports)").fetchall()
        }
        if "payload_json" not in columns:
            connection.execute(
                "ALTER TABLE daily_reports ADD COLUMN payload_json TEXT NOT NULL DEFAULT '{}'"
            )


def _value(resource: Any, key: str, default: Any = None) -> Any:
    if isinstance(resource, dict):
        return resource.get(key, default)
    if hasattr(resource, "model_dump"):
        return resource.model_dump().get(key, default)
    return getattr(resource, key, default)


def _node_statuses(nodes: Iterable[Any]) -> list[dict[str, Any]]:
    return [
        {
            "id": _value(node, "id"),
            "name": _value(node, "name"),
            "status": _value(node, "status"),
            "cpu_percent": _value(node, "cpu_percent"),
            "ram_percent": _value(node, "ram_percent"),
            "disk_percent": _value(node, "disk_percent"),
            "temperature_celsius": _value(node, "temperature_celsius"),
        }
        for node in nodes
    ]


def _service_statuses(services: Iterable[Any]) -> list[dict[str, Any]]:
    return [
        {
            "id": _value(service, "id"),
            "name": _value(service, "name"),
            "status": _value(service, "status"),
            "domain": _value(service, "domain"),
            "ssl_days_remaining": _value(service, "ssl_days_remaining"),
            "response_time_ms": _value(service, "response_time_ms"),
        }
        for service in services
    ]


def build_report(
    nodes: Iterable[Any],
    services: Iterable[Any],
    report_date: str | None = None,
) -> dict[str, Any]:
    node_items = list(nodes)
    service_items = list(services)
    node_statuses = _node_statuses(node_items)
    service_statuses = _service_statuses(service_items)
    findings: list[dict[str, str]] = []

    for node in node_statuses:
        if node["status"] != "online":
            findings.append(
                {
                    "fingerprint": f"node:{node['id']}:offline",
                    "severity": "critical",
                    "title": f"Nodo {node['name']} non operativo",
                    "detail": f"Lo stato attuale del nodo è {node['status']}.",
                }
            )
        thresholds = (
            ("cpu_percent", 85, "CPU elevata", "warning"),
            ("ram_percent", 90, "RAM elevata", "warning"),
            ("disk_percent", 85, "Disco quasi pieno", "warning"),
            ("temperature_celsius", 75, "Temperatura elevata", "critical"),
        )
        for metric, threshold, title, severity in thresholds:
            value = node[metric]
            if value is not None and value >= threshold:
                findings.append(
                    {
                        "fingerprint": f"node:{node['id']}:{metric}",
                        "severity": severity,
                        "title": f"{title} su {node['name']}",
                        "detail": f"{metric} rilevato: {value}. Soglia: {threshold}.",
                    }
                )

    for service in service_statuses:
        if service["status"] != "healthy":
            findings.append(
                {
                    "fingerprint": f"service:{service['id']}:status",
                    "severity": "critical" if service["status"] == "stopped" else "warning",
                    "title": f"Servizio {service['name']} {service['status']}",
                    "detail": f"Il servizio {service['domain']} richiede attenzione.",
                }
            )
        ssl_days = service["ssl_days_remaining"]
        if ssl_days is not None and ssl_days <= 30:
            findings.append(
                {
                    "fingerprint": f"service:{service['id']}:ssl",
                    "severity": "critical" if ssl_days <= 7 else "warning",
                    "title": f"SSL in scadenza per {service['domain']}",
                    "detail": f"Restano {ssl_days} giorni alla scadenza del certificato.",
                }
            )
        response_time = service["response_time_ms"]
        if response_time is not None and response_time >= 1000:
            findings.append(
                {
                    "fingerprint": f"service:{service['id']}:response",
                    "severity": "warning",
                    "title": f"Risposta lenta per {service['name']}",
                    "detail": f"Tempo di risposta rilevato: {response_time} ms.",
                }
            )

    critical_count = sum(finding["severity"] == "critical" for finding in findings)
    warning_count = sum(finding["severity"] == "warning" for finding in findings)
    overall_status = "critical" if critical_count else "warning" if warning_count else "healthy"
    generated_at = utc_now()

    return {
        "report_date": report_date or generated_at.date().isoformat(),
        "generated_at": generated_at.isoformat(),
        "overall_status": overall_status,
        "summary": {
            "nodes_total": len(node_statuses),
            "nodes_online": sum(node["status"] == "online" for node in node_statuses),
            "services_total": len(service_statuses),
            "services_healthy": sum(service["status"] == "healthy" for service in service_statuses),
            "running_containers": sum(
                _value(item, "container_count", 0) or 0 for item in node_items
            ),
            "stopped_containers": 0,
            "warnings": warning_count,
            "critical_alerts": critical_count,
        },
        "findings": findings,
        "nodes": node_statuses,
        "services": service_statuses,
        "infrastructure": {
            "cpu_percent_average": round(
                sum(node["cpu_percent"] or 0 for node in node_statuses) / len(node_statuses),
                1,
            )
            if node_statuses
            else 0,
            "ram_percent_average": round(
                sum(node["ram_percent"] or 0 for node in node_statuses) / len(node_statuses),
                1,
            )
            if node_statuses
            else 0,
            "disk_percent_max": max(
                (node["disk_percent"] or 0 for node in node_statuses),
                default=0,
            ),
            "temperature_celsius_max": max(
                (node["temperature_celsius"] or 0 for node in node_statuses),
                default=0,
            ),
        },
    }


def _sync_alerts(connection: sqlite3.Connection, findings: list[dict[str, str]], now: str) -> None:
    fingerprints = {finding["fingerprint"] for finding in findings}
    for finding in findings:
        connection.execute(
            """
            INSERT INTO alerts (
                fingerprint, severity, title, detail, is_active,
                first_seen_at, last_seen_at, resolved_at
            ) VALUES (?, ?, ?, ?, 1, ?, ?, NULL)
            ON CONFLICT(fingerprint) DO UPDATE SET
                severity = excluded.severity,
                title = excluded.title,
                detail = excluded.detail,
                is_active = 1,
                last_seen_at = excluded.last_seen_at,
                resolved_at = NULL
            """,
            (
                finding["fingerprint"],
                finding["severity"],
                finding["title"],
                finding["detail"],
                now,
                now,
            ),
        )
    if fingerprints:
        placeholders = ",".join("?" for _ in fingerprints)
        connection.execute(
            f"""
            UPDATE alerts
            SET is_active = 0, resolved_at = ?
            WHERE is_active = 1 AND fingerprint NOT IN ({placeholders})
            """,
            (now, *fingerprints),
        )
    else:
        connection.execute(
            "UPDATE alerts SET is_active = 0, resolved_at = ? WHERE is_active = 1",
            (now,),
        )


def save_report(report: dict[str, Any], db_path: str | None = None) -> dict[str, Any]:
    initialize_database(db_path)
    now = report["generated_at"]
    with _connect(db_path) as connection:
        connection.execute(
            """
            INSERT INTO daily_reports (
                report_date, generated_at, overall_status, summary_json, findings_json, payload_json
            ) VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(report_date) DO UPDATE SET
                generated_at = excluded.generated_at,
                overall_status = excluded.overall_status,
                summary_json = excluded.summary_json,
                findings_json = excluded.findings_json,
                payload_json = excluded.payload_json
            """,
            (
                report["report_date"],
                report["generated_at"],
                report["overall_status"],
                json.dumps(report["summary"]),
                json.dumps(report["findings"]),
                json.dumps(report),
            ),
        )
        _sync_alerts(connection, report["findings"], now)
        report_row = connection.execute(
            "SELECT id FROM daily_reports WHERE report_date = ?",
            (report["report_date"],),
        ).fetchone()
    report["id"] = report_row["id"] if report_row else None
    return report


def sync_current_alerts(
    nodes: Iterable[Any],
    services: Iterable[Any],
    db_path: str | None = None,
) -> list[dict[str, str]]:
    report = build_report(nodes, services)
    initialize_database(db_path)
    with _connect(db_path) as connection:
        _sync_alerts(connection, report["findings"], report["generated_at"])
    return report["findings"]


def _report_from_row(row: sqlite3.Row) -> dict[str, Any]:
    if row["payload_json"] and row["payload_json"] != "{}":
        report = json.loads(row["payload_json"])
        report["id"] = row["id"]
        return report
    return {
        "id": row["id"],
        "report_date": row["report_date"],
        "generated_at": row["generated_at"],
        "overall_status": row["overall_status"],
        "summary": json.loads(row["summary_json"]),
        "findings": json.loads(row["findings_json"]),
    }


def get_latest_report(db_path: str | None = None) -> dict[str, Any] | None:
    initialize_database(db_path)
    with _connect(db_path) as connection:
        row = connection.execute(
            "SELECT * FROM daily_reports ORDER BY generated_at DESC LIMIT 1"
        ).fetchone()
    return _report_from_row(row) if row else None


def get_reports(limit: int = 30, db_path: str | None = None) -> list[dict[str, Any]]:
    initialize_database(db_path)
    safe_limit = max(1, min(limit, 100))
    with _connect(db_path) as connection:
        rows = connection.execute(
            "SELECT * FROM daily_reports ORDER BY generated_at DESC LIMIT ?",
            (safe_limit,),
        ).fetchall()
    return [_report_from_row(row) for row in rows]


def get_alerts(active_only: bool = True, db_path: str | None = None) -> list[dict[str, Any]]:
    initialize_database(db_path)
    query = "SELECT * FROM alerts"
    if active_only:
        query += " WHERE is_active = 1"
    query += " ORDER BY CASE severity WHEN 'critical' THEN 0 ELSE 1 END, last_seen_at DESC"
    with _connect(db_path) as connection:
        rows = connection.execute(query).fetchall()
    return [dict(row) for row in rows]


def record_worker_heartbeat(
    worker_id: str,
    status: str = "online",
    db_path: str | None = None,
) -> str:
    initialize_database(db_path)
    timestamp = utc_now().isoformat()
    with _connect(db_path) as connection:
        connection.execute(
            """
            INSERT INTO worker_heartbeats (worker_id, last_seen_at, status)
            VALUES (?, ?, ?)
            ON CONFLICT(worker_id) DO UPDATE SET
                last_seen_at = excluded.last_seen_at,
                status = excluded.status
            """,
            (worker_id, timestamp, status),
        )
    return timestamp


def get_worker_heartbeat(worker_id: str = "report-worker", db_path: str | None = None) -> dict[str, Any] | None:
    initialize_database(db_path)
    with _connect(db_path) as connection:
        row = connection.execute(
            "SELECT * FROM worker_heartbeats WHERE worker_id = ?",
            (worker_id,),
        ).fetchone()
    return dict(row) if row else None


def is_report_due(
    report_time: str,
    local_date: str,
    local_time: str,
    timezone_name: str = "UTC",
    db_path: str | None = None,
) -> bool:
    if local_time < report_time:
        return False
    latest = get_reports(limit=1, db_path=db_path)
    if not latest or latest[0]["report_date"] != local_date:
        return True
    generated_at = datetime.fromisoformat(latest[0]["generated_at"])
    if generated_at.tzinfo is None:
        generated_at = generated_at.replace(tzinfo=timezone.utc)
    local_generated_at = generated_at.astimezone(ZoneInfo(timezone_name))
    return local_generated_at.strftime("%H:%M") < report_time