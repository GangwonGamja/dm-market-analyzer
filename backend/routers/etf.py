"""
ETF 관련 라우터 (yfinance 기반)
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from core.database import get_db
from services.yahoo_service import YahooService
from services.indicator_service import IndicatorService
from typing import List, Dict
import traceback

router = APIRouter(prefix="/etf", tags=["etf"])


@router.get("/{symbol}/price")
def get_etf_price(symbol: str):
    """ETF 최신 가격 조회 (모든 심볼 지원)"""
    try:
        symbol = symbol.upper()  # 대문자 변환
        price_data = YahooService.get_price_data(symbol)
        if price_data is None:
            return {
                "symbol": symbol,
                "error": "데이터 없음",
                "message": f"{symbol} 가격 데이터를 사용할 수 없습니다. 심볼을 확인하거나 나중에 다시 시도하세요."
            }
        return price_data
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"{symbol} 가격 조회 오류: {str(e)}"
        print(f"[ERROR] {error_msg}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=error_msg)


@router.get("/{symbol}/history")
def get_etf_history(
    symbol: str,
    years: int = Query(3, ge=1, le=5, description="데이터 기간 (년, 1-5)")
):
    """ETF 가격 히스토리 (3년치 기본, 모든 심볼 지원)"""
    try:
        symbol = symbol.upper()  # 대문자 변환
        history = YahooService.get_history_list(symbol, years)
        if not history:
            return {
                "symbol": symbol,
                "years": years,
                "count": 0,
                "data": [],
                "error": "데이터 없음",
                "message": f"{symbol} 히스토리 데이터 수집 실패: yfinance에서 데이터를 가져올 수 없습니다."
            }
        return {
            "symbol": symbol.upper(),
            "years": years,
            "count": len(history),
            "data": history
        }
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"{symbol} 히스토리 조회 오류: {str(e)}"
        print(f"[ERROR] {error_msg}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=error_msg)


@router.get("/{symbol}/ma")
def get_moving_average(
    symbol: str,
    days: int = Query(200, description="이동평균 기간 (20, 60, 120, 200 등)")
):
    """이동평균선 데이터 (모든 심볼 지원)"""
    try:
        symbol = symbol.upper()  # 대문자 변환
        if days not in [20, 60, 120, 200]:
            raise HTTPException(
                status_code=400,
                detail="days는 20, 60, 120, 200 중 하나여야 합니다."
            )
        
        ma_data = IndicatorService.get_moving_average(symbol, days)
        if not ma_data:
            return {
                "symbol": symbol,
                "period": days,
                "count": 0,
                "data": [],
                "error": "데이터 없음",
                "message": f"{symbol} 이동평균 데이터 수집 실패: yfinance에서 데이터를 가져올 수 없습니다."
            }
        return {
            "symbol": symbol.upper(),
            "period": days,
            "count": len(ma_data),
            "data": ma_data
        }
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"{symbol} 이동평균 계산 오류: {str(e)}"
        print(f"[ERROR] {error_msg}")
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=error_msg)


@router.get("/{symbol}/rsi")
def get_rsi_data(
    symbol: str,
    days: int = Query(1095, description="데이터 기간 (일)")
):
    """RSI 데이터 (14일 기준, 모든 심볼 지원)"""
    try:
        symbol = symbol.upper()  # 대문자 변환
        rsi_data = IndicatorService.get_rsi(symbol)
        if not rsi_data:
            return {
                "symbol": symbol,
                "period": 14,
                "count": 0,
                "data": [],
                "error": "데이터 없음",
                "message": f"{symbol} RSI 데이터 수집 실패: yfinance에서 데이터를 가져올 수 없습니다."
            }
        return {
            "symbol": symbol.upper(),
            "period": 14,
            "count": len(rsi_data),
            "data": rsi_data
        }
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"{symbol} RSI 계산 오류: {str(e)}"
        print(f"[ERROR] {error_msg}")
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=error_msg)


@router.get("/{symbol}/macd")
def get_macd_data(symbol: str):
    """MACD 데이터 (12/26/9, 모든 심볼 지원)"""
    try:
        symbol = symbol.upper()  # 대문자 변환
        macd_data = IndicatorService.get_macd(symbol)
        if not macd_data:
            return {
                "symbol": symbol,
                "fast": 12,
                "slow": 26,
                "signal": 9,
                "count": 0,
                "data": [],
                "error": "데이터 없음",
                "message": f"{symbol} MACD 데이터 수집 실패: yfinance에서 데이터를 가져올 수 없습니다."
            }
        return {
            "symbol": symbol.upper(),
            "fast": 12,
            "slow": 26,
            "signal": 9,
            "count": len(macd_data),
            "data": macd_data
        }
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"{symbol} MACD 계산 오류: {str(e)}"
        print(f"[ERROR] {error_msg}")
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=error_msg)


@router.get("/{symbol}/stochastic")
def get_stochastic_data(symbol: str):
    """Stochastic Oscillator 데이터 (14일 + 3일 smoothing, 모든 심볼 지원)"""
    try:
        symbol = symbol.upper()  # 대문자 변환
        stoch_data = IndicatorService.get_stochastic(symbol)
        if not stoch_data:
            return {
                "symbol": symbol,
                "k_period": 14,
                "d_period": 3,
                "count": 0,
                "data": [],
                "error": "데이터 없음",
                "message": f"{symbol} Stochastic 데이터 수집 실패: yfinance에서 데이터를 가져올 수 없습니다."
            }
        return {
            "symbol": symbol.upper(),
            "k_period": 14,
            "d_period": 3,
            "count": len(stoch_data),
            "data": stoch_data
        }
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"{symbol} Stochastic 계산 오류: {str(e)}"
        print(f"[ERROR] {error_msg}")
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=error_msg)


@router.get("/{symbol}/volatility")
def get_volatility(
    symbol: str,
    period: int = Query(30, ge=1, le=252, description="변동성 계산 기간 (일)")
):
    """변동성 지표 (모든 심볼 지원)"""
    try:
        symbol = symbol.upper()  # 대문자 변환
        volatility = IndicatorService.get_volatility(symbol, period)
        if volatility is None:
            return {
                "symbol": symbol,
                "volatility": None,
                "period": period,
                "unit": "percent",
                "error": "데이터 없음",
                "message": f"{symbol} 변동성 데이터 수집 실패: yfinance에서 데이터를 가져올 수 없습니다."
            }
        return {
            "symbol": symbol.upper(),
            "volatility": volatility,
            "period": period,
            "unit": "percent"
        }
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"{symbol} 변동성 계산 오류: {str(e)}"
        print(f"[ERROR] {error_msg}")
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=error_msg)


@router.get("/{symbol}/mdd")
def get_mdd(symbol: str):
    """MDD (Maximum Drawdown, 모든 심볼 지원)"""
    try:
        symbol = symbol.upper()  # 대문자 변환
        mdd = IndicatorService.get_mdd(symbol)
        if mdd is None:
            return {
                "symbol": symbol,
                "mdd": None,
                "unit": "percent",
                "error": "데이터 없음",
                "message": f"{symbol} MDD 데이터 수집 실패: yfinance에서 데이터를 가져올 수 없습니다."
            }
        return {
            "symbol": symbol.upper(),
            "mdd": mdd,
            "unit": "percent"
        }
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"{symbol} MDD 계산 오류: {str(e)}"
        print(f"[ERROR] {error_msg}")
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=error_msg)


@router.get("/{symbol}/cross")
def get_golden_death_cross(symbol: str):
    """골든/데드크로스 판단 (모든 심볼 지원)"""
    try:
        symbol = symbol.upper()
        cross_data = IndicatorService.get_golden_death_cross(symbol)
        return cross_data
    except Exception as e:
        error_msg = f"{symbol} 골든/데드크로스 계산 오류: {str(e)}"
        print(f"[ERROR] {error_msg}")
        traceback.print_exc()
        return {
            "golden_cross": False,
            "death_cross": False,
            "cross_type": "none",
            "ma20_current": None,
            "ma60_current": None,
            "ma200_current": None,
            "ma20_previous": None,
            "ma60_previous": None,
            "ma200_previous": None
        }


@router.get("/{symbol}/divergence")
def get_divergence(symbol: str):
    """RSI/가격 Divergence 판단 (모든 심볼 지원)"""
    try:
        symbol = symbol.upper()
        divergence_data = IndicatorService.get_divergence(symbol)
        return divergence_data
    except Exception as e:
        error_msg = f"{symbol} Divergence 계산 오류: {str(e)}"
        print(f"[ERROR] {error_msg}")
        traceback.print_exc()
        return {
            "divergence": "none",
            "price_low1": None,
            "price_low2": None,
            "rsi_low1": None,
            "rsi_low2": None,
            "price_high1": None,
            "price_high2": None,
            "rsi_high1": None,
            "rsi_high2": None
        }


@router.get("/{symbol}/risk-score")
def get_risk_score(symbol: str):
    """Risk Score 계산 (모든 심볼 지원)"""
    try:
        symbol = symbol.upper()
        risk_data = IndicatorService.get_risk_score(symbol)
        return risk_data
    except Exception as e:
        error_msg = f"{symbol} Risk Score 계산 오류: {str(e)}"
        print(f"[ERROR] {error_msg}")
        traceback.print_exc()
        return {
            "risk_score": 50.0,
            "risk_grade": "Medium",
            "atr_normalized": None,
            "volatility_std": None,
            "range_vol": None
        }


@router.get("/correlation")
def get_correlation(
    symbol1: str = Query("VIG", description="첫 번째 심볼"),
    symbol2: str = Query("QLD", description="두 번째 심볼")
):
    """두 ETF 간 상관관계 (모든 심볼 지원)"""
    try:
        import pandas as pd
        import numpy as np
        
        symbol1 = symbol1.upper()  # 대문자 변환
        symbol2 = symbol2.upper()  # 대문자 변환
        
        # 두 심볼의 히스토리 데이터 가져오기
        df1 = YahooService.get_history(symbol1, 3)
        df2 = YahooService.get_history(symbol2, 3)
        
        if df1 is None or df1.empty or df2 is None or df2.empty:
            raise HTTPException(
                status_code=404,
                detail=f"{symbol1} 또는 {symbol2} 데이터를 사용할 수 없습니다."
            )
        
        # 날짜 기준으로 병합
        merged = pd.merge(
            df1[["date", "close"]].rename(columns={"close": f"{symbol1}_close"}),
            df2[["date", "close"]].rename(columns={"close": f"{symbol2}_close"}),
            on="date",
            how="inner"
        )
        
        if len(merged) < 2:
            raise HTTPException(
                status_code=404,
                detail="공통 날짜 데이터가 부족합니다."
            )
        
        # 수익률 계산
        returns1 = merged[f"{symbol1}_close"].pct_change().dropna()
        returns2 = merged[f"{symbol2}_close"].pct_change().dropna()
        
        if len(returns1) != len(returns2) or len(returns1) < 2:
            raise HTTPException(
                status_code=404,
                detail="수익률 데이터가 부족합니다."
            )
        
        correlation = returns1.corr(returns2)
        correlation = float(correlation) if not pd.isna(correlation) else 0.0
        
        return {
            "symbol1": symbol1.upper(),
            "symbol2": symbol2.upper(),
            "correlation": correlation,
            "period_days": len(merged)
        }
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"상관관계 계산 오류: {str(e)}"
        print(f"[ERROR] {error_msg}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=error_msg)
