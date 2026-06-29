"""Observabilité centralisée pour DZnutri.

Ce module regroupe deux briques indépendantes mais complémentaires :

1. ``setup_logging`` : configure un logging professionnel, structuré en JSON,
   avec rotation des fichiers. Le JSON est exploitable par n'importe quel
   collecteur (Datadog, Loki, ELK...) sans parsing fragile.

2. ``metrics`` : un magasin de métriques en mémoire, thread-safe et borné, qui
   alimente le dashboard "Statistiques & Monitoring" de l'admin sans dépendance
   externe (pas de Prometheus à déployer). Il suit le trafic temps réel, les
   latences, le taux de succès de l'OCR et lève des alertes de performance.

Tout est en bibliothèque standard : aucune dépendance supplémentaire requise.
"""

from __future__ import annotations

import json
import logging
import logging.handlers
import os
import threading
import time
from collections import Counter, deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Deque, Dict, List, Optional

# ---------------------------------------------------------------------------
# 1. LOGGING JSON + ROTATION
# ---------------------------------------------------------------------------

# Champs déjà présents sur un LogRecord standard : on ne les recopie pas dans
# le bloc "extra" pour éviter le bruit.
_RESERVED_LOG_KEYS = frozenset(
    vars(logging.makeLogRecord({})).keys()
) | {"message", "asctime", "taskName"}


class JsonLogFormatter(logging.Formatter):
    """Formate chaque log en une ligne JSON.

    Inclut systématiquement timestamp ISO 8601 (UTC), niveau, logger, message,
    et, le cas échéant, la stack trace et tout attribut ``extra`` passé au log
    (ex: ``logger.info("...", extra={"request_id": rid})``).
    """

    def format(self, record: logging.LogRecord) -> str:
        payload: Dict[str, Any] = {
            "timestamp": datetime.fromtimestamp(
                record.created, tz=timezone.utc
            ).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        if record.stack_info:
            payload["stack"] = self.formatStack(record.stack_info)

        # Attributs personnalisés passés via extra=...
        for key, value in record.__dict__.items():
            if key not in _RESERVED_LOG_KEYS and not key.startswith("_"):
                try:
                    json.dumps(value)  # on ne garde que le sérialisable
                    payload[key] = value
                except (TypeError, ValueError):
                    payload[key] = repr(value)

        return json.dumps(payload, ensure_ascii=False)


def setup_logging() -> logging.Logger:
    """Configure le logging racine de l'application.

    - Niveau pilotable via ``LOG_LEVEL`` (INFO par défaut ; jamais DEBUG en prod).
    - Sortie console JSON (captée par Docker/journald).
    - Fichier ``logs/dznutri.log`` avec rotation (5 fichiers de 10 Mo) si
      ``LOG_TO_FILE`` n'est pas désactivé.

    Idempotent : un second appel ne duplique pas les handlers.
    """
    level = os.getenv("LOG_LEVEL", "INFO").upper()
    root = logging.getLogger()
    root.setLevel(level)

    # Évite la duplication des handlers en cas de rechargement (uvicorn --reload).
    for handler in list(root.handlers):
        root.removeHandler(handler)

    formatter = JsonLogFormatter()

    console = logging.StreamHandler()
    console.setFormatter(formatter)
    root.addHandler(console)

    if os.getenv("LOG_TO_FILE", "true").lower() in ("1", "true", "yes"):
        log_dir = Path(os.getenv("LOG_DIR", "logs"))
        log_dir.mkdir(exist_ok=True)
        file_handler = logging.handlers.RotatingFileHandler(
            log_dir / "dznutri.log",
            maxBytes=int(os.getenv("LOG_MAX_BYTES", str(10 * 1024 * 1024))),
            backupCount=int(os.getenv("LOG_BACKUP_COUNT", "5")),
            encoding="utf-8",
        )
        file_handler.setFormatter(formatter)
        root.addHandler(file_handler)

    # Aligne les loggers bavards d'uvicorn sur notre format JSON.
    for noisy in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        lg = logging.getLogger(noisy)
        lg.handlers = []
        lg.propagate = True

    return logging.getLogger("dznutri")


# ---------------------------------------------------------------------------
# 2. MÉTRIQUES TEMPS RÉEL EN MÉMOIRE
# ---------------------------------------------------------------------------


class MetricsStore:
    """Magasin de métriques en mémoire, thread-safe et borné.

    Conçu pour un coût quasi nul par requête (O(1) sous lock court) et une
    empreinte mémoire constante grâce à des ``deque`` bornées. Réinitialisé à
    chaque redémarrage du process : c'est volontaire, on suit l'état "live".
    Les données durables (historique des scans, OCR passés) restent en base.
    """

    def __init__(
        self,
        latency_window: int = 500,
        active_user_ttl: int = 300,
    ) -> None:
        self._lock = threading.Lock()
        self._started_at = time.time()

        # Compteurs globaux.
        self._requests_total = 0
        self._errors_total = 0
        self._status_counter: Counter = Counter()
        self._path_counter: Counter = Counter()

        # Fenêtre glissante de latences (ms) pour calculer moyenne / p95.
        self._latencies: Deque[float] = deque(maxlen=latency_window)

        # Latences récentes par endpoint, pour repérer les goulots.
        self._endpoint_latencies: Dict[str, Deque[float]] = {}
        self._endpoint_window = 100

        # OCR : succès / échecs depuis le démarrage du process.
        self._ocr_success = 0
        self._ocr_failure = 0
        self._ocr_durations: Deque[float] = deque(maxlen=200)

        # Utilisateurs actifs : clé de session -> dernier timestamp vu.
        self._active_users: Dict[str, float] = {}
        self._active_user_ttl = active_user_ttl

        # Erreurs récentes (pour affichage admin), bornées.
        self._recent_errors: Deque[Dict[str, Any]] = deque(maxlen=50)

        # Seuils d'alerte (pilotables par variables d'env).
        self._slow_request_ms = float(os.getenv("ALERT_SLOW_REQUEST_MS", "1500"))
        self._error_rate_threshold = float(os.getenv("ALERT_ERROR_RATE", "0.05"))
        self._ocr_failure_threshold = float(os.getenv("ALERT_OCR_FAILURE_RATE", "0.25"))

    # --- Enregistrement (chemin chaud, doit rester rapide) ----------------

    def record_request(
        self,
        path: str,
        status_code: int,
        duration_ms: float,
        session_key: Optional[str] = None,
    ) -> None:
        now = time.time()
        with self._lock:
            self._requests_total += 1
            self._status_counter[status_code] += 1
            self._path_counter[path] += 1
            self._latencies.append(duration_ms)

            bucket = self._endpoint_latencies.get(path)
            if bucket is None:
                bucket = deque(maxlen=self._endpoint_window)
                self._endpoint_latencies[path] = bucket
            bucket.append(duration_ms)

            if status_code >= 500:
                self._errors_total += 1

            if session_key:
                self._active_users[session_key] = now

    def record_error(self, path: str, message: str, request_id: str = "") -> None:
        with self._lock:
            self._recent_errors.appendleft(
                {
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "path": path,
                    "message": message[:300],
                    "request_id": request_id,
                }
            )

    def record_ocr(self, success: bool, duration_ms: Optional[float] = None) -> None:
        with self._lock:
            if success:
                self._ocr_success += 1
            else:
                self._ocr_failure += 1
            if duration_ms is not None:
                self._ocr_durations.append(duration_ms)

    # --- Lecture (chemin froid, appelé par le dashboard admin) ------------

    def _prune_active_users(self, now: float) -> int:
        cutoff = now - self._active_user_ttl
        stale = [k for k, ts in self._active_users.items() if ts < cutoff]
        for k in stale:
            del self._active_users[k]
        return len(self._active_users)

    @staticmethod
    def _percentile(values: List[float], pct: float) -> float:
        if not values:
            return 0.0
        ordered = sorted(values)
        idx = min(len(ordered) - 1, int(round((pct / 100) * (len(ordered) - 1))))
        return round(ordered[idx], 2)

    def snapshot(self) -> Dict[str, Any]:
        """Retourne une photo complète des métriques pour l'API admin."""
        now = time.time()
        with self._lock:
            latencies = list(self._latencies)
            active_users = self._prune_active_users(now)
            ocr_total = self._ocr_success + self._ocr_failure
            ocr_durations = list(self._ocr_durations)

            avg_latency = round(sum(latencies) / len(latencies), 2) if latencies else 0.0
            error_rate = (
                round(self._errors_total / self._requests_total, 4)
                if self._requests_total
                else 0.0
            )
            ocr_success_rate = round(self._ocr_success / ocr_total, 4) if ocr_total else None

            slowest = sorted(
                (
                    {
                        "path": path,
                        "avg_ms": round(sum(buf) / len(buf), 2),
                        "count": len(buf),
                    }
                    for path, buf in self._endpoint_latencies.items()
                    if buf
                ),
                key=lambda e: e["avg_ms"],
                reverse=True,
            )[:5]

            snap = {
                "uptime_seconds": int(now - self._started_at),
                "requests_total": self._requests_total,
                "errors_total": self._errors_total,
                "error_rate": error_rate,
                "active_users": active_users,
                "latency_ms": {
                    "avg": avg_latency,
                    "p95": self._percentile(latencies, 95),
                    "p99": self._percentile(latencies, 99),
                    "sample_size": len(latencies),
                },
                "status_codes": dict(self._status_counter),
                "top_endpoints": [
                    {"path": p, "count": c} for p, c in self._path_counter.most_common(5)
                ],
                "slowest_endpoints": slowest,
                "ocr_runtime": {
                    "success": self._ocr_success,
                    "failure": self._ocr_failure,
                    "success_rate": ocr_success_rate,
                    "avg_ms": round(sum(ocr_durations) / len(ocr_durations), 2)
                    if ocr_durations
                    else 0.0,
                },
                "recent_errors": list(self._recent_errors)[:10],
            }
            snap["alerts"] = self._build_alerts(snap, ocr_success_rate)
            return snap

    def _build_alerts(
        self, snap: Dict[str, Any], ocr_success_rate: Optional[float]
    ) -> List[Dict[str, str]]:
        """Dérive des alertes de performance lisibles à partir du snapshot."""
        alerts: List[Dict[str, str]] = []

        if snap["latency_ms"]["p95"] > self._slow_request_ms:
            alerts.append(
                {
                    "level": "warning",
                    "message": (
                        f"Latence p95 élevée : {snap['latency_ms']['p95']} ms "
                        f"(seuil {self._slow_request_ms:.0f} ms)"
                    ),
                }
            )

        if snap["requests_total"] >= 20 and snap["error_rate"] > self._error_rate_threshold:
            alerts.append(
                {
                    "level": "critical",
                    "message": (
                        f"Taux d'erreur serveur : {snap['error_rate'] * 100:.1f}% "
                        f"(seuil {self._error_rate_threshold * 100:.0f}%)"
                    ),
                }
            )

        if (
            ocr_success_rate is not None
            and (snap["ocr_runtime"]["success"] + snap["ocr_runtime"]["failure"]) >= 5
            and (1 - ocr_success_rate) > self._ocr_failure_threshold
        ):
            alerts.append(
                {
                    "level": "warning",
                    "message": (
                        f"Taux d'échec OCR : {(1 - ocr_success_rate) * 100:.1f}% "
                        f"(seuil {self._ocr_failure_threshold * 100:.0f}%)"
                    ),
                }
            )

        if not alerts:
            alerts.append({"level": "ok", "message": "Tous les indicateurs sont nominaux."})
        return alerts


# Instance unique partagée par toute l'application (middleware, OCR, admin).
metrics = MetricsStore()
