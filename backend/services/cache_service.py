from __future__ import annotations

import hashlib
import json
import time
from threading import RLock
from typing import Any


class TTLCache:
    def __init__(self, maxsize: int = 1000, ttl_seconds: int = 900) -> None:
        self.maxsize = maxsize
        self.ttl_seconds = ttl_seconds
        self._values: dict[str, tuple[float, Any]] = {}
        self._lock = RLock()

    def get(self, key: str) -> Any:
        with self._lock:
            item = self._values.get(key)
            if item is None:
                return None

            expires_at, value = item
            if expires_at < time.monotonic():
                self._values.pop(key, None)
                return None

            return value

    def set(self, key: str, value: Any) -> None:
        with self._lock:
            self._evict_expired_locked()
            if len(self._values) >= self.maxsize:
                oldest_key = min(self._values.items(), key=lambda item: item[1][0])[0]
                self._values.pop(oldest_key, None)

            self._values[key] = (time.monotonic() + self.ttl_seconds, value)

    def _evict_expired_locked(self) -> None:
        now = time.monotonic()
        expired = [key for key, (expires_at, _) in self._values.items() if expires_at < now]
        for key in expired:
            self._values.pop(key, None)


analysis_cache = TTLCache(maxsize=1000, ttl_seconds=900)


def make_point_cache_key(latitude: float, longitude: float) -> str:
    return f"point:{round(latitude, 5)}:{round(longitude, 5)}"


def make_route_cache_key(origin: dict[str, float], destination: dict[str, float]) -> str:
    payload = json.dumps(
        {
            "origin": {"latitude": round(origin["latitude"], 5), "longitude": round(origin["longitude"], 5)},
            "destination": {"latitude": round(destination["latitude"], 5), "longitude": round(destination["longitude"], 5)},
        },
        sort_keys=True,
    )
    digest = hashlib.sha1(payload.encode("utf-8")).hexdigest()
    return f"route:{digest}"


def get_cached_result(key: str) -> Any:
    return analysis_cache.get(key)


def set_cached_result(key: str, value: Any) -> None:
    analysis_cache.set(key, value)


def clear_cache() -> None:
    analysis_cache._values.clear()