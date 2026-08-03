from datetime import datetime, timezone
from pathlib import Path
from typing import Literal

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

app = FastAPI(title="MSCC API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Node(BaseModel):
    id: str
    name: str
    description: str
    hostname: str
    operating_system: str
    architecture: str
    status: Literal["online", "offline", "maintenance"]
    cpu_percent: float
    ram_percent: float
    disk_percent: float
    temperature_celsius: float
    docker_version: str
    docker_compose_version: str
    uptime_seconds: int
    container_count: int


class HealthSummary(BaseModel):
    cpu_percent: float
    ram_percent: float
    disk_percent: float
    temperature_celsius: float
    running_containers: int
    stopped_containers: int
    warnings: int
    critical_alerts: int
    collected_at: datetime


class Service(BaseModel):
    id: str
    name: str
    node_id: str
    container_name: str
    status: Literal["healthy", "degraded", "stopped"]
    domain: str
    ssl_days_remaining: int
    response_time_ms: int


nodes = [
    Node(
        id="node-mac-mini",
        name="Mac mini",
        description="Primary production server",
        hostname="macmini.local",
        operating_system="Ubuntu 24.04 LTS",
        architecture="x86_64",
        status="online",
        cpu_percent=28,
        ram_percent=61,
        disk_percent=72,
        temperature_celsius=48,
        docker_version="27.4.1",
        docker_compose_version="2.32.1",
        uptime_seconds=1222002,
        container_count=18,
    ),
    Node(
        id="node-raspberry-pi",
        name="Raspberry Pi",
        description="Edge & home automation",
        hostname="raspberrypi.local",
        operating_system="Raspberry Pi OS",
        architecture="aarch64",
        status="online",
        cpu_percent=46,
        ram_percent=74,
        disk_percent=64,
        temperature_celsius=57,
        docker_version="26.1.4",
        docker_compose_version="2.27.0",
        uptime_seconds=734940,
        container_count=7,
    ),
]

services = [
    Service(
        id="service-status-page",
        name="Status Page",
        node_id="node-mac-mini",
        container_name="status-page",
        status="healthy",
        domain="status.microsaas.dev",
        ssl_days_remaining=89,
        response_time_ms=182,
    ),
    Service(
        id="service-analytics",
        name="Analytics Hub",
        node_id="node-mac-mini",
        container_name="plausible",
        status="healthy",
        domain="analytics.microsaas.dev",
        ssl_days_remaining=61,
        response_time_ms=241,
    ),
]


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "mscc-api"}


@app.get("/api/nodes", response_model=list[Node])
def list_nodes() -> list[Node]:
    return nodes


@app.get("/api/nodes/{node_id}", response_model=Node)
def get_node(node_id: str) -> Node:
    return next(node for node in nodes if node.id == node_id)


@app.get("/api/health/summary", response_model=HealthSummary)
def health_summary() -> HealthSummary:
    return HealthSummary(
        cpu_percent=27.4,
        ram_percent=47.5,
        disk_percent=58.3,
        temperature_celsius=46,
        running_containers=36,
        stopped_containers=1,
        warnings=2,
        critical_alerts=0,
        collected_at=datetime.now(timezone.utc),
    )


@app.get("/api/services", response_model=list[Service])
def list_services() -> list[Service]:
    return services


if Path("dist").is_dir():
    app.mount("/", StaticFiles(directory="dist", html=True), name="frontend")