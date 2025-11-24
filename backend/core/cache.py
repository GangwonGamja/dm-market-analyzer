"""
In-memory 캐싱 시스템
"""
import time
from typing import Any, Optional, Dict
from datetime import datetime, timedelta
import threading


class CacheItem:
    """캐시 아이템"""
    def __init__(self, value: Any, ttl: int = 900):  # 기본 15분
        self.value = value
        self.created_at = time.time()
        self.ttl = ttl
    
    def is_expired(self) -> bool:
        """캐시 만료 여부 확인"""
        return time.time() - self.created_at > self.ttl
    
    def get_age_seconds(self) -> float:
        """캐시 생성 후 경과 시간 (초)"""
        return time.time() - self.created_at


class InMemoryCache:
    """In-memory 캐시 시스템 (스레드 안전)"""
    
    def __init__(self):
        self._cache: Dict[str, CacheItem] = {}
        self._lock = threading.Lock()
    
    def get(self, key: str) -> Optional[Any]:
        """캐시에서 값 가져오기"""
        with self._lock:
            if key in self._cache:
                item = self._cache[key]
                if not item.is_expired():
                    return item.value
                else:
                    # 만료된 항목 삭제
                    del self._cache[key]
            return None
    
    def set(self, key: str, value: Any, ttl: int = 900) -> None:
        """캐시에 값 저장 (TTL: 초 단위, 기본 15분)"""
        with self._lock:
            self._cache[key] = CacheItem(value, ttl)
    
    def delete(self, key: str) -> None:
        """캐시에서 항목 삭제"""
        with self._lock:
            if key in self._cache:
                del self._cache[key]
    
    def clear(self) -> None:
        """모든 캐시 삭제"""
        with self._lock:
            self._cache.clear()
    
    def cleanup_expired(self) -> None:
        """만료된 항목 정리"""
        with self._lock:
            expired_keys = [
                key for key, item in self._cache.items()
                if item.is_expired()
            ]
            for key in expired_keys:
                del self._cache[key]
    
    def get_stats(self) -> Dict:
        """캐시 통계"""
        with self._lock:
            total = len(self._cache)
            expired = sum(1 for item in self._cache.values() if item.is_expired())
            return {
                "total_items": total,
                "expired_items": expired,
                "active_items": total - expired
            }


# 전역 캐시 인스턴스
cache = InMemoryCache()

