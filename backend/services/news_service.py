"""
뉴스 서비스 (Marketaux API 기반)
"""
import requests
import os
from typing import List, Dict, Optional
from datetime import datetime
import traceback
from core.cache import cache


class NewsService:
    """뉴스 서비스 (Marketaux 무료 API)"""
    
    BASE_URL = "https://api.marketaux.com/v1/news/all"
    CACHE_TTL = 15 * 60  # 15분 캐시
    
    @staticmethod
    def get_api_key() -> Optional[str]:
        """Marketaux API Key 가져오기"""
        api_key = os.getenv("MARKETAUX_API_KEY") or os.getenv("marketaux_api_key")
        if not api_key or api_key.strip() == "":
            return None
        return api_key.strip()
    
    @staticmethod
    def fetch_news(symbol: str = "VIG", limit: int = 20) -> Dict:
        """뉴스 가져오기 (Marketaux API)
        
        Args:
            symbol: 심볼 (VIG, QLD 등)
            limit: 가져올 뉴스 개수 (최대 100)
        
        Returns:
            Dict: {
                "success": bool,
                "count": int,
                "articles": List[Dict],
                "error": Optional[str]
            }
        """
        cache_key = f"news:{symbol}:{limit}"
        cached = cache.get(cache_key)
        if cached is not None:
            return cached
        
        api_key = NewsService.get_api_key()
        if not api_key:
            # API KEY가 없으면 뉴스 기능 비활성화, 빈 리스트 반환
            return {
                "success": True,
                "count": 0,
                "articles": []
            }
        
        try:
            params = {
                "symbols": symbol.upper(),
                "filter_entities": "true",
                "language": "en",
                "api_token": api_key,
                "limit": min(limit, 100)  # 최대 100개
            }
            
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
            
            response = requests.get(
                NewsService.BASE_URL,
                params=params,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                articles = []
                for item in data.get("data", []):
                    articles.append({
                        "title": item.get("title", ""),
                        "summary": item.get("description", ""),
                        "url": item.get("url", ""),
                        "published": item.get("published_at", ""),
                        "published_at": item.get("published_at", ""),
                        "source": item.get("source", ""),
                        "score": 0.0,  # Marketaux는 감성 점수를 제공하지 않음
                        "sentiment": {
                            "pos": 0.0,
                            "neu": 1.0,
                            "neg": 0.0
                        }
                    })
                
                result = {
                    "success": True,
                    "count": len(articles),
                    "articles": articles
                }
                
                # 캐시 저장
                cache.set(cache_key, result, NewsService.CACHE_TTL)
                return result
            else:
                error_msg = f"Marketaux API 오류: HTTP {response.status_code}"
                if response.status_code == 401:
                    error_msg = "Marketaux API 인증 실패: API 키가 올바르지 않습니다."
                elif response.status_code == 429:
                    error_msg = "Marketaux API 호출 한도 초과: 무료 플랜은 일일 100회 제한이 있습니다."
                
                return {
                    "success": False,
                    "count": 0,
                    "articles": [],
                    "error": error_msg
                }
                
        except requests.RequestException as e:
            error_msg = f"Marketaux API 네트워크 오류: {e}"
            print(f"[ERROR] {error_msg}")
            traceback.print_exc()
            return {
                "success": False,
                "count": 0,
                "articles": [],
                "error": error_msg
            }
        except Exception as e:
            error_msg = f"뉴스 가져오기 오류: {e}"
            print(f"[ERROR] {error_msg}")
            traceback.print_exc()
            return {
                "success": False,
                "count": 0,
                "articles": [],
                "error": error_msg
            }
    
    @staticmethod
    def fetch_multiple_symbols(symbols: List[str], limit: int = 20) -> Dict:
        """여러 심볼의 뉴스 가져오기"""
        all_articles = []
        errors = []
        
        for symbol in symbols:
            result = NewsService.fetch_news(symbol, limit)
            if result.get("success"):
                all_articles.extend(result.get("articles", []))
            else:
                errors.append(f"{symbol}: {result.get('error', '알 수 없는 오류')}")
        
        # 날짜순 정렬 (최신순)
        all_articles.sort(key=lambda x: x.get("published", ""), reverse=True)
        
        # 중복 제거 (URL 기준)
        seen_urls = set()
        unique_articles = []
        for article in all_articles:
            url = article.get("url", "")
            if url and url not in seen_urls:
                seen_urls.add(url)
                unique_articles.append(article)
        
        return {
            "success": len(unique_articles) > 0,
            "count": len(unique_articles),
            "articles": unique_articles[:limit],  # 최종 limit 적용
            "error": "; ".join(errors) if errors else None
        }
