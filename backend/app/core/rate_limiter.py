"""
TuneFetch Rate Limiter Middleware
Thread-safe sliding-window rate limiter protecting FastAPI endpoints from abuse,
automated scrapers, and denial-of-service attempts.
"""

import time
import logging
import threading
from typing import Dict, List, Tuple
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

logger = logging.getLogger("rate_limiter")


class InMemoryRateLimiter:
    """
    Sliding window in-memory rate limiter per client IP.
    Supports tiered limits for general API vs resource-heavy download/session endpoints.
    """

    def __init__(
        self,
        default_limit: int = 120,
        default_window: int = 60,
        heavy_limit: int = 30,
        heavy_window: int = 60,
        cleanup_interval: int = 300,
    ):
        self.default_limit = default_limit
        self.default_window = default_window
        self.heavy_limit = heavy_limit
        self.heavy_window = heavy_window
        self.cleanup_interval = cleanup_interval

        # Map: ip -> list of request timestamps [float]
        self._requests: Dict[str, List[float]] = {}
        self._heavy_requests: Dict[str, List[float]] = {}
        self._lock = threading.Lock()
        self._last_cleanup = time.time()

    def _get_client_ip(self, request: Request) -> str:
        """Extracts the true client IP from proxy headers or socket connection."""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            # First IP in comma-separated list is the original client
            client_ip = forwarded.split(",")[0].strip()
            if client_ip:
                return client_ip

        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip.strip()

        if request.client and request.client.host:
            return request.client.host.strip()

        return "127.0.0.1"

    def _cleanup_expired(self, now: float):
        """Purge entries older than the longest window to prevent memory leaks."""
        if now - self._last_cleanup < self.cleanup_interval:
            return

        self._last_cleanup = now
        max_window = max(self.default_window, self.heavy_window)
        cutoff = now - max_window

        for store in (self._requests, self._heavy_requests):
            dead_ips = []
            for ip, timestamps in store.items():
                store[ip] = [t for t in timestamps if t > cutoff]
                if not store[ip]:
                    dead_ips.append(ip)
            for ip in dead_ips:
                store.pop(ip, None)

    def is_rate_limited(self, request: Request) -> Tuple[bool, int, int, int]:
        """
        Evaluates rate limits for the incoming request.
        Returns:
            (is_blocked, limit, remaining, retry_after)
        """
        path = request.url.path.lower()
        method = request.method.upper()

        # Always exempt OPTIONS, HEAD, static assets, and health checks
        if method in ("OPTIONS", "HEAD"):
            return False, self.default_limit, self.default_limit, 0

        exempt_prefixes = (
            "/assets/",
            "/static/",
            "/favicon.ico",
            "/docs",
            "/openapi.json",
            "/redoc",
            "/health",
        )
        if any(path.startswith(prefix) for prefix in exempt_prefixes) or path == "/" or path == "/health":
            return False, self.default_limit, self.default_limit, 0

        # Identify if this is a heavy endpoint
        heavy_prefixes = (
            "/api/download",
            "/api/cloud-session",
            "/api/stream-url",
            "/spotify/download",
            "/spotify/download-single",
        )
        is_heavy = any(path.startswith(prefix) for prefix in heavy_prefixes)

        client_ip = self._get_client_ip(request)
        now = time.time()

        with self._lock:
            self._cleanup_expired(now)

            if is_heavy:
                limit = self.heavy_limit
                window = self.heavy_window
                store = self._heavy_requests
            else:
                limit = self.default_limit
                window = self.default_window
                store = self._requests

            timestamps = store.get(client_ip, [])
            cutoff = now - window
            valid_timestamps = [t for t in timestamps if t > cutoff]

            if len(valid_timestamps) >= limit:
                # Rate limit exceeded
                oldest = valid_timestamps[0]
                retry_after = max(1, int(window - (now - oldest)))
                store[client_ip] = valid_timestamps
                return True, limit, 0, retry_after

            # Record this request
            valid_timestamps.append(now)
            store[client_ip] = valid_timestamps
            remaining = max(0, limit - len(valid_timestamps))
            return False, limit, remaining, 0


# Shared rate limiter instance
rate_limiter = InMemoryRateLimiter(
    default_limit=120,   # 120 requests/minute for standard navigation & API
    default_window=60,
    heavy_limit=30,      # 30 requests/minute for download generation & session creation
    heavy_window=60,
)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Starlette middleware interceptor that applies rate_limiter rules."""

    async def dispatch(self, request: Request, call_next):
        is_blocked, limit, remaining, retry_after = rate_limiter.is_rate_limited(request)

        if is_blocked:
            logger.warning(
                f"[RateLimiter] IP {request.client.host if request.client else 'unknown'} "
                f"exceeded rate limit on '{request.url.path}'. Retry-After: {retry_after}s"
            )
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Too many requests. Please slow down and try again later.",
                    "retry_after": retry_after,
                },
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": "0",
                },
            )

        response: Response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response
