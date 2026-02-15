import time
import asyncio
from typing import Any, Optional, Dict, Tuple

class SimpleCache:
    """
    A simple in-memory cache with TTL (Time To Live).
    Designed to reduce DB hits for frequently accessed data like User Profiles.
    """
    def __init__(self):
        self._cache: Dict[str, Tuple[Any, float]] = {}
        self._lock = asyncio.Lock()

    async def get(self, key: str) -> Optional[Any]:
        """Retrieve a value from cache if it hasn't expired."""
        async with self._lock:
            data = self._cache.get(key)
            if not data:
                return None
            
            value, expiry = data
            if time.time() > expiry:
                del self._cache[key]
                return None
            
            return value

    async def set(self, key: str, value: Any, ttl_seconds: int = 300):
        """Store a value in cache with a TTL (default 5 mins)."""
        async with self._lock:
            expiry = time.time() + ttl_seconds
            self._cache[key] = (value, expiry)

    async def delete(self, key: str):
        """Remove a key from cache."""
        async with self._lock:
            if key in self._cache:
                del self._cache[key]

    async def clear(self):
        """Clear all cache."""
        async with self._lock:
            self._cache.clear()

# Global instance
memory_cache = SimpleCache()
