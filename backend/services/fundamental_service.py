"""
펀더멘털 데이터 서비스 (yfinance 기반)
"""
import yfinance as yf
from typing import Dict, Optional
from services.yahoo_service import YahooService
from core.cache import cache


class FundamentalService:
    """펀더멘털 데이터 서비스"""
    
    CACHE_TTL = 60 * 60  # 1시간 캐시
    
    @staticmethod
    def get_fundamental_data(symbol: str) -> Dict:
        """펀더멘털 데이터 가져오기
        
        Returns:
            Dict: {
                "symbol": str,
                "per": Optional[float],
                "psr": Optional[float],
                "pbr": Optional[float],
                "peg": Optional[float],
                "revenue_growth": Optional[float],
                "eps_growth": Optional[float],
                "value_score": float,  # 0-100
                "value_grade": "저평가" | "정상" | "고평가"
            }
        """
        symbol = symbol.upper()
        cache_key = f"fundamental:{symbol}"
        cached = cache.get(cache_key)
        if cached is not None:
            return cached
        
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            
            per = info.get("trailingPE") or info.get("forwardPE")
            psr = info.get("priceToSalesTrailing12Months")
            pbr = info.get("priceToBook")
            peg = info.get("pegRatio")
            
            # 성장률
            revenue_growth = info.get("revenueGrowth")
            eps_growth = info.get("earningsQuarterlyGrowth")
            
            # Value Score 계산 (간단한 로직)
            value_score = 50.0  # 기본값
            factors = []
            
            if per:
                # PER이 낮을수록 좋음 (10 이하면 +점수, 30 이상이면 -점수)
                if per < 10:
                    value_score += 15
                    factors.append("PER 저평가")
                elif per < 20:
                    value_score += 5
                elif per > 30:
                    value_score -= 15
                    factors.append("PER 고평가")
            
            if pbr:
                # PBR이 낮을수록 좋음 (1 이하면 +점수, 3 이상이면 -점수)
                if pbr < 1:
                    value_score += 15
                    factors.append("PBR 저평가")
                elif pbr < 2:
                    value_score += 5
                elif pbr > 3:
                    value_score -= 15
                    factors.append("PBR 고평가")
            
            if peg:
                # PEG가 1 이하면 좋음
                if peg < 1:
                    value_score += 10
                    factors.append("PEG 저평가")
                elif peg > 2:
                    value_score -= 10
                    factors.append("PEG 고평가")
            
            if revenue_growth:
                # 성장률이 높을수록 좋음
                if revenue_growth > 0.2:
                    value_score += 10
                elif revenue_growth < -0.1:
                    value_score -= 10
            
            value_score = max(0.0, min(100.0, value_score))
            
            # 등급 결정
            if value_score <= 30:
                value_grade = "저평가"
            elif value_score <= 70:
                value_grade = "정상"
            else:
                value_grade = "고평가"
            
            result = {
                "symbol": symbol,
                "per": per,
                "psr": psr,
                "pbr": pbr,
                "peg": peg,
                "revenue_growth": revenue_growth,
                "eps_growth": eps_growth,
                "value_score": round(value_score, 2),
                "value_grade": value_grade,
                "factors": factors
            }
            
            cache.set(cache_key, result, FundamentalService.CACHE_TTL)
            return result
            
        except Exception as e:
            print(f"[ERROR] {symbol} 펀더멘털 데이터 가져오기 실패: {e}")
            return {
                "symbol": symbol,
                "per": None,
                "psr": None,
                "pbr": None,
                "peg": None,
                "revenue_growth": None,
                "eps_growth": None,
                "value_score": 50.0,
                "value_grade": "정상",
                "factors": [],
                "error": str(e)
            }

