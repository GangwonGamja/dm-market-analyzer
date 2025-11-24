"""
시장 관련 라우터 (Fear & Greed Index, 센티먼트)
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime
from core.database import get_db
from services.fgi_service import FGIService
from services.news_service import NewsService
from services.fgi_history_service import FGIHistoryService
from services.indicator_service import IndicatorService
from typing import Dict, List

router = APIRouter(prefix="/market", tags=["market"])


@router.get("/fgi")
def get_fear_greed_index():
    """Fear & Greed Index 조회"""
    try:
        fgi = FGIService.get_current_fgi()
        return fgi
    except Exception as e:
        error_msg = f"Fear & Greed Index 조회 오류: {str(e)}"
        print(f"[ERROR] {error_msg}")
        return {
            "success": False,
            "score": -1,
            "rating": None,
            "timestamp": datetime.now().isoformat(),
            "error": error_msg
        }


@router.get("/fgi/history")
def get_fgi_history(days: int = Query(365, ge=1, le=365, description="조회할 일수 (1-365)")):
    """Fear & Greed Index 히스토리 조회
    
    Args:
        days: 조회할 일수 (기본값: 365)
    
    Returns:
        Dict: {
            "success": bool,
            "days": int,
            "count": int,
            "data": List[Dict]
        }
    """
    try:
        # 오늘 데이터가 없으면 업데이트 시도
        FGIHistoryService.update_daily_fgi()
        
        history = FGIHistoryService.get_history(days=days)
        
        return {
            "success": True,
            "days": days,
            "count": len(history),
            "data": history
        }
    except Exception as e:
        error_msg = f"FGI 히스토리 조회 오류: {str(e)}"
        print(f"[ERROR] {error_msg}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "days": days,
            "count": 0,
            "data": [],
            "error": error_msg
        }


@router.get("/fgi/statistics")
def get_fgi_statistics():
    """Fear & Greed Index 통계 (분류별 비율)
    
    Returns:
        Dict: {
            "success": bool,
            "extreme_fear": float,
            "fear": float,
            "neutral": float,
            "greed": float,
            "extreme_greed": float,
            "total_days": int
        }
    """
    try:
        stats = FGIHistoryService.get_statistics()
        
        return {
            "success": True,
            **stats
        }
    except Exception as e:
        error_msg = f"FGI 통계 조회 오류: {str(e)}"
        print(f"[ERROR] {error_msg}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "extreme_fear": 0.0,
            "fear": 0.0,
            "neutral": 0.0,
            "greed": 0.0,
            "extreme_greed": 0.0,
            "total_days": 0,
            "error": error_msg
        }


@router.get("/sentiment/aggregate")
def get_aggregate_sentiment():
    """종합 심리지수 계산 (FGI + VIX + 시장 RSI + 뉴스 감성)
    
    Returns:
        Dict: {
            "success": bool,
            "score": float,  # 0-100
            "components": {
                "fgi": float,
                "vix": float,
                "market_rsi": float,
                "news_sentiment": float
            },
            "timestamp": str
        }
    """
    try:
        components = {
            "fgi": 0.0,
            "vix": 0.0,
            "market_rsi": 0.0,
            "news_sentiment": 0.0
        }
        
        # 1. FGI (0-100 -> 0-30점)
        fgi = FGIService.get_current_fgi()
        if fgi.get("success") and fgi.get("score") is not None:
            fgi_score = fgi.get("score", 50)
            components["fgi"] = (fgi_score / 100.0) * 30.0
        else:
            components["fgi"] = 15.0  # 중립값
        
        # 2. VIX (높을수록 부정적, 0-20점)
        # VIX는 실제로는 yfinance로 가져와야 하지만, 여기서는 fallback 사용
        # VIX가 20이면 10점, 30이면 0점, 10이면 20점
        try:
            # VIX 데이터는 나중에 추가 가능, 현재는 fallback
            vix_value = 20.0  # 기본값
            if vix_value <= 10:
                components["vix"] = 20.0
            elif vix_value >= 30:
                components["vix"] = 0.0
            else:
                components["vix"] = 20.0 - ((vix_value - 10) / 20.0) * 20.0
        except:
            components["vix"] = 10.0  # 중립값
        
        # 3. 시장 RSI (VIG/QLD 평균, 0-25점)
        try:
            vig_rsi_data = IndicatorService.get_rsi("VIG")
            qld_rsi_data = IndicatorService.get_rsi("QLD")
            
            if vig_rsi_data and len(vig_rsi_data) > 0 and qld_rsi_data and len(qld_rsi_data) > 0:
                vig_rsi = vig_rsi_data[-1].get("rsi", 50)
                qld_rsi = qld_rsi_data[-1].get("rsi", 50)
                avg_rsi = (vig_rsi + qld_rsi) / 2.0
                # RSI 50이면 12.5점, 70이면 25점, 30이면 0점
                if avg_rsi >= 50:
                    components["market_rsi"] = 12.5 + ((avg_rsi - 50) / 20.0) * 12.5
                else:
                    components["market_rsi"] = (avg_rsi / 50.0) * 12.5
            else:
                components["market_rsi"] = 12.5  # 중립값
        except:
            components["market_rsi"] = 12.5  # 중립값
        
        # 4. 뉴스 감성 (0-25점)
        try:
            news_result = NewsService.fetch_news("VIG", limit=20)
            news_count = news_result.get("count", 0)
            
            if news_count > 0:
                articles = news_result.get("articles", [])
                positive_keywords = ["up", "rise", "gain", "bullish", "positive", "growth", "strong", "surge"]
                negative_keywords = ["down", "fall", "drop", "bearish", "negative", "decline", "weak", "crash"]
                
                sentiment_score = 0.0
                for article in articles:
                    title = article.get("title", "").lower()
                    summary = article.get("summary", "").lower()
                    text = f"{title} {summary}"
                    
                    positive_count = sum(1 for keyword in positive_keywords if keyword in text)
                    negative_count = sum(1 for keyword in negative_keywords if keyword in text)
                    
                    if positive_count > negative_count:
                        sentiment_score += 0.1
                    elif negative_count > positive_count:
                        sentiment_score -= 0.1
                
                # -1~1을 0~25로 변환
                normalized = (sentiment_score + 1.0) / 2.0
                components["news_sentiment"] = normalized * 25.0
            else:
                components["news_sentiment"] = 12.5  # 중립값
        except:
            components["news_sentiment"] = 12.5  # 중립값
        
        # 종합 점수 계산 (0-100)
        total_score = sum(components.values())
        total_score = max(0.0, min(100.0, total_score))
        
        return {
            "success": True,
            "score": round(total_score, 2),
            "components": components,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        error_msg = f"종합 심리지수 계산 오류: {str(e)}"
        print(f"[ERROR] {error_msg}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "score": 50.0,  # fallback 중립값
            "components": {
                "fgi": 15.0,
                "vix": 10.0,
                "market_rsi": 12.5,
                "news_sentiment": 12.5
            },
            "timestamp": datetime.now().isoformat(),
            "error": error_msg
        }


@router.get("/sentiment")
def get_market_sentiment(symbol: str = "VIG"):
    """종합 센티먼트 스코어 (뉴스 + Fear & Greed Index)
    
    Args:
        symbol: 분석할 심볼 (기본값: VIG)
    
    Returns:
        Dict: {
            "symbol": str,
            "fgi_score": int,
            "fgi_rating": str,
            "news_count": int,
            "sentiment_score": float,  # -1 ~ 1
            "overall_sentiment": str,  # "Bearish", "Neutral", "Bullish"
            "timestamp": str
        }
    """
    try:
        # Fear & Greed Index 가져오기
        fgi = FGIService.get_current_fgi()
        fgi_score = fgi.get("score", -1) if fgi.get("success") else -1
        fgi_rating = fgi.get("rating", "Unknown") if fgi.get("success") else "Unknown"
        
        # 뉴스 가져오기
        news_result = NewsService.fetch_news(symbol, limit=20)
        news_count = news_result.get("count", 0)
        articles = news_result.get("articles", [])
        
        # 간단한 센티먼트 분석 (키워드 기반)
        positive_keywords = ["up", "rise", "gain", "bullish", "positive", "growth", "strong", "surge"]
        negative_keywords = ["down", "fall", "drop", "bearish", "negative", "decline", "weak", "crash"]
        
        sentiment_score = 0.0
        if news_count > 0:
            for article in articles:
                title = article.get("title", "").lower()
                summary = article.get("summary", "").lower()
                text = f"{title} {summary}"
                
                positive_count = sum(1 for keyword in positive_keywords if keyword in text)
                negative_count = sum(1 for keyword in negative_keywords if keyword in text)
                
                if positive_count > negative_count:
                    sentiment_score += 0.1
                elif negative_count > positive_count:
                    sentiment_score -= 0.1
            
            # 정규화 (-1 ~ 1)
            sentiment_score = max(-1.0, min(1.0, sentiment_score / news_count))
        
        # FGI 점수를 센티먼트에 반영 (0-100을 -1~1로 변환)
        fgi_sentiment = (fgi_score - 50) / 50.0 if fgi_score >= 0 else 0.0
        
        # 종합 센티먼트 (뉴스 60%, FGI 40%)
        overall_sentiment_score = (sentiment_score * 0.6) + (fgi_sentiment * 0.4)
        
        # 등급 결정
        if overall_sentiment_score >= 0.3:
            overall_sentiment = "Bullish"
        elif overall_sentiment_score <= -0.3:
            overall_sentiment = "Bearish"
        else:
            overall_sentiment = "Neutral"
        
        return {
            "symbol": symbol.upper(),
            "fgi_score": fgi_score,
            "fgi_rating": fgi_rating,
            "news_count": news_count,
            "sentiment_score": round(overall_sentiment_score, 3),
            "overall_sentiment": overall_sentiment,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        error_msg = f"센티먼트 분석 오류: {str(e)}"
        print(f"[ERROR] {error_msg}")
        import traceback
        traceback.print_exc()
        return {
            "symbol": symbol.upper(),
            "fgi_score": -1,
            "fgi_rating": "Unknown",
            "news_count": 0,
            "sentiment_score": 0.0,
            "overall_sentiment": "Unknown",
            "timestamp": datetime.now().isoformat(),
            "error": error_msg
        }
