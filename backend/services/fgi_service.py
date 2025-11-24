"""
Fear & Greed Index 서비스 (CNN FGI Scraper / Mirror API)
"""
import requests
import json
from typing import Optional, Dict
from datetime import datetime
import traceback
from core.cache import cache


class FGIService:
    """Fear & Greed Index 서비스"""
    
    # Mirror API 엔드포인트들
    MIRROR_URLS = [
        "https://fear-and-greed-index.p.rapidapi.com/v1/fgi",
        "https://api.allorigins.win/raw?url=https://money.cnn.com/data/fear-and-greed/",
    ]
    
    # CNN 직접 스크래핑 URL
    CNN_URLS = [
        "https://production.dataviz.cnn.io/index/fearandgreed/graphdata",
        "https://production.dataviz.cnn.io/index/fearandgreed/latest",
    ]
    
    CACHE_TTL = 15 * 60  # 15분 캐시
    
    @staticmethod
    def _fetch_from_mirror(url: str) -> Optional[Dict]:
        """Mirror API에서 FGI 가져오기"""
        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                return data
        except:
            pass
        return None
    
    @staticmethod
    def _fetch_from_cnn(url: str) -> Optional[Dict]:
        """CNN API에서 FGI 가져오기"""
        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "application/json"
            }
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                return data
        except:
            pass
        return None
    
    @staticmethod
    def _parse_fgi_value(data: any, depth: int = 0) -> Optional[int]:
        """JSON 데이터에서 FGI 값 찾기 (재귀적)"""
        if depth > 10:
            return None
        
        if isinstance(data, dict):
            # 직접적인 키 확인
            priority_keys = ['value', 'score', 'fearGreed', 'fear_greed', 'fearAndGreed', 
                            'fear_and_greed', 'index', 'currentValue', 'today', 'current']
            for key in priority_keys:
                if key in data:
                    val = data[key]
                    if isinstance(val, dict):
                        nested = FGIService._parse_fgi_value(val, depth + 1)
                        if nested is not None:
                            return nested
                    elif isinstance(val, (int, float)) and 0 <= val <= 100:
                        return int(val)
            
            # 중첩된 딕셔너리 탐색
            for k, v in data.items():
                if isinstance(v, dict):
                    nested = FGIService._parse_fgi_value(v, depth + 1)
                    if nested is not None:
                        return nested
                elif isinstance(v, (int, float)) and 0 <= v <= 100:
                    return int(v)
        
        elif isinstance(data, list):
            for item in data:
                nested = FGIService._parse_fgi_value(item, depth + 1)
                if nested is not None:
                    return nested
        
        return None
    
    @staticmethod
    def _get_rating_from_score(score: int) -> str:
        """점수로부터 등급 결정"""
        if score <= 24:
            return "Extreme Fear"
        elif score <= 44:
            return "Fear"
        elif score <= 55:
            return "Neutral"
        elif score <= 75:
            return "Greed"
        else:
            return "Extreme Greed"
    
    @staticmethod
    def fetch_fgi() -> Optional[Dict]:
        """Fear & Greed Index 가져오기 (캐싱 포함)
        
        Returns:
            Dict: {
                "score": int,  # 0-100
                "rating": str,
                "timestamp": str,
                "source": str
            }
        """
        cache_key = "fgi:current"
        cached = cache.get(cache_key)
        if cached is not None:
            return cached
        
        # 1. CNN API 시도
        for url in FGIService.CNN_URLS:
            try:
                data = FGIService._fetch_from_cnn(url)
                if data:
                    score = FGIService._parse_fgi_value(data)
                    if score is not None:
                        result = {
                            "score": score,
                            "rating": FGIService._get_rating_from_score(score),
                            "timestamp": datetime.now().isoformat(),
                            "source": "CNN"
                        }
                        cache.set(cache_key, result, FGIService.CACHE_TTL)
                        print(f"[INFO] CNN FGI 가져옴: score={score}, rating={result['rating']}")
                        return result
            except Exception as e:
                print(f"[WARNING] CNN API {url} 실패: {e}")
                continue
        
        # 2. Mirror API 시도
        for url in FGIService.MIRROR_URLS:
            try:
                data = FGIService._fetch_from_mirror(url)
                if data:
                    score = FGIService._parse_fgi_value(data)
                    if score is not None:
                        result = {
                            "score": score,
                            "rating": FGIService._get_rating_from_score(score),
                            "timestamp": datetime.now().isoformat(),
                            "source": "Mirror"
                        }
                        cache.set(cache_key, result, FGIService.CACHE_TTL)
                        print(f"[INFO] Mirror FGI 가져옴: score={score}, rating={result['rating']}")
                        return result
            except Exception as e:
                print(f"[WARNING] Mirror API {url} 실패: {e}")
                continue
        
        # 3. 모든 시도 실패
        print("[ERROR] Fear & Greed Index를 가져올 수 없습니다.")
        return None
    
    @staticmethod
    def get_current_fgi() -> Dict:
        """현재 Fear & Greed Index 가져오기 (에러 처리 포함)
        
        Returns:
            Dict: {
                "success": bool,
                "score": Optional[int],
                "rating": Optional[str],
                "timestamp": str,
                "error": Optional[str]
            }
        """
        fgi = FGIService.fetch_fgi()
        if fgi:
            return {
                "success": True,
                **fgi
            }
        else:
            return {
                "success": False,
                "score": -1,
                "rating": None,
                "timestamp": datetime.now().isoformat(),
                "error": "Fear & Greed Index를 가져올 수 없습니다."
            }
