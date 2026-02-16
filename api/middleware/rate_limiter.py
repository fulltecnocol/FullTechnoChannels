import time
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from shared.database import redis_client
import structlog

logger = structlog.get_logger(__name__)

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp, limit: int = 100, window: int = 60):
        super().__init__(app)
        self.limit = limit
        self.window = window

    async def dispatch(self, request: Request, call_next):
        # Identify user by IP or User ID (if auth middleware ran before)
        # For simplicity and speed, use Client IP
        client_ip = request.client.host if request.client else "unknown"
        key = f"rate_limit:{client_ip}"

        try:
            # Simple Fixed Window Counter
            current = await redis_client.incr(key)
            if current == 1:
                await redis_client.expire(key, self.window)
            
            if current > self.limit:
                logger.warning("Rate limit exceeded", ip=client_ip)
                return Response("Too Many Requests", status_code=429)
        except Exception as e:
            # Fail open if Redis is down
            logger.error("Rate limit error", error=str(e))

        response = await call_next(request)
        return response
