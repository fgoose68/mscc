from __future__ import annotations

import logging
import os
import time
from datetime import datetime
from zoneinfo import ZoneInfo

from backend.app.main import nodes, services
from backend.app.reporting import (
    build_report,
    initialize_database,
    is_report_due,
    record_worker_heartbeat,
    save_report,
    sync_current_alerts,
)


logging.basicConfig(
    level=os.getenv("MSCC_LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("mscc.worker")


def timezone_name() -> str:
    return os.getenv("MSCC_TIMEZONE", "Europe/Rome")


def report_time() -> str:
    configured = os.getenv("MSCC_REPORT_TIME", "11:15")
    hours, minutes = configured.split(":", 1)
    return f"{int(hours):02d}:{int(minutes):02d}"


def local_now() -> datetime:
    return datetime.now(ZoneInfo(timezone_name()))


def run_report_once(report_date: str | None = None) -> dict:
    report = build_report(nodes, services, report_date=report_date)
    saved_report = save_report(report)
    logger.info(
        "daily report generated date=%s status=%s findings=%s",
        saved_report["report_date"],
        saved_report["overall_status"],
        len(saved_report["findings"]),
    )
    return saved_report


def run_worker() -> None:
    worker_id = os.getenv("MSCC_WORKER_ID", "report-worker")
    interval = max(10, int(os.getenv("MSCC_WORKER_INTERVAL_SECONDS", "30")))
    initialize_database()
    logger.info(
        "worker started id=%s schedule=%s timezone=%s",
        worker_id,
        report_time(),
        timezone_name(),
    )

    if os.getenv("MSCC_RUN_REPORT_ON_START", "false").lower() == "true":
        run_report_once()

    while True:
        heartbeat = record_worker_heartbeat(worker_id)
        current = local_now()
        current_date = current.date().isoformat()
        current_time = current.strftime("%H:%M")
        findings = sync_current_alerts(nodes, services)
        if is_report_due(
            report_time(),
            current_date,
            current_time,
            timezone_name=timezone_name(),
        ):
            run_report_once(report_date=current_date)
        logger.debug(
            "heartbeat worker=%s at=%s active_findings=%s",
            worker_id,
            heartbeat,
            len(findings),
        )
        time.sleep(interval)


if __name__ == "__main__":
    run_worker()