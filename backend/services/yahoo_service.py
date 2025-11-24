"""
Yahoo Finance 데이터 서비스 (yfinance 기반, retry 및 fallback 로직 포함)
"""
import yfinance as yf
import pandas as pd
import requests
import time
from typing import Optional, Dict, List
from datetime import datetime, timedelta
import traceback
from core.cache import cache
import warnings

# SSL 경고 무시
warnings.filterwarnings('ignore')


class YahooService:
    """Yahoo Finance 데이터 서비스 (retry 및 fallback 포함)"""
    
    CACHE_TTL = 15 * 60  # 15분 캐시
    MAX_RETRIES = 3  # 최대 재시도 횟수
    TIMEOUT = 30  # 타임아웃 (초)
    
    # Fallback 기간 목록 (긴 기간부터 짧은 기간 순서)
    FALLBACK_PERIODS = {
        3: ["3y", "2y", "1y", "6mo", "3mo", "1mo"],
        2: ["2y", "1y", "6mo", "3mo", "1mo"],
        1: ["1y", "6mo", "3mo", "1mo", "5d", "1d"]
    }
    
    @staticmethod
    def _get_cache_key(prefix: str, symbol: str, *args) -> str:
        """캐시 키 생성"""
        symbol = symbol.upper()  # 항상 대문자로 변환
        key_parts = [prefix, symbol]
        if args:
            key_parts.extend(str(arg) for arg in args)
        return ":".join(key_parts)
    
    @staticmethod
    def _create_ticker(symbol: str):
        """Ticker 객체 생성 (DNS 문제 대비)"""
        symbol = symbol.upper()
        try:
            # requests.Session을 사용하여 DNS 문제 대비
            session = requests.Session()
            session.verify = False  # SSL 검증 비활성화 (필요시)
            
            # yfinance에 session 전달
            ticker = yf.Ticker(symbol, session=session)
            return ticker
        except Exception as e:
            print(f"[WARNING] Session 생성 실패, 기본 Ticker 사용: {e}")
            return yf.Ticker(symbol)
    
    @staticmethod
    def _fetch_history_with_retry(ticker, period: str, max_retries: int = MAX_RETRIES) -> Optional[pd.DataFrame]:
        """히스토리 데이터 가져오기 (retry 로직 포함)"""
        last_error = None
        
        for attempt in range(max_retries):
            try:
                print(f"[INFO] yfinance 호출 시도 {attempt + 1}/{max_retries}: period={period}")
                hist = ticker.history(period=period, timeout=YahooService.TIMEOUT)
                
                if hist is not None and not hist.empty:
                    print(f"[INFO] yfinance 데이터 수집 성공: {len(hist)}개 레코드")
                    return hist
                else:
                    print(f"[WARNING] yfinance 빈 DataFrame 반환: period={period}")
                    if attempt < max_retries - 1:
                        wait_time = (attempt + 1) * 2
                        print(f"[INFO] {wait_time}초 후 재시도...")
                        time.sleep(wait_time)
                        continue
                    else:
                        return None
                        
            except Exception as e:
                last_error = e
                print(f"[ERROR] yfinance 호출 실패 (시도 {attempt + 1}/{max_retries}): {e}")
                if attempt < max_retries - 1:
                    wait_time = (attempt + 1) * 2
                    print(f"[INFO] {wait_time}초 후 재시도...")
                    time.sleep(wait_time)
                    continue
                else:
                    traceback.print_exc()
        
        if last_error:
            print(f"[ERROR] yfinance 최종 실패: {last_error}")
        return None
    
    @staticmethod
    def get_history(symbol: str, years: int = 3) -> Optional[pd.DataFrame]:
        """히스토리 데이터 가져오기 (fallback 기간 포함, 캐싱)
        
        Args:
            symbol: ETF 심볼 (대소문자 구분 없음)
            years: 원하는 데이터 기간 (년)
        
        Returns:
            DataFrame 또는 None
        """
        symbol = symbol.upper()  # 항상 대문자로 변환
        cache_key = YahooService._get_cache_key("history", symbol, years)
        cached = cache.get(cache_key)
        if cached is not None:
            return cached.copy()
        
        # Fallback 기간 목록 가져오기
        fallback_periods = YahooService.FALLBACK_PERIODS.get(years, YahooService.FALLBACK_PERIODS[3])
        
        ticker = YahooService._create_ticker(symbol)
        
        # 각 기간을 시도
        for period in fallback_periods:
            try:
                hist = YahooService._fetch_history_with_retry(ticker, period)
                
                if hist is not None and not hist.empty:
                    # DataFrame 정리
                    df = pd.DataFrame({
                        "date": hist.index,
                        "open": hist["Open"],
                        "high": hist["High"],
                        "low": hist["Low"],
                        "close": hist["Close"],
                        "volume": hist["Volume"].fillna(0).astype(int),
                        "adjusted_close": hist["Close"]
                    })
                    
                    # date 컬럼이 datetime이 아니면 변환
                    if not pd.api.types.is_datetime64_any_dtype(df["date"]):
                        df["date"] = pd.to_datetime(df["date"])
                    
                    df = df.sort_values("date", ascending=True).reset_index(drop=True)
                    
                    print(f"[INFO] {symbol} 히스토리 데이터 수집 성공: {len(df)}개 레코드 (period={period})")
                    
                    # 캐시 저장 (30분)
                    cache.set(cache_key, df, 30 * 60)
                    return df
                    
            except Exception as e:
                print(f"[ERROR] {symbol} period={period} 시도 실패: {e}")
                continue
        
        # 모든 시도 실패
        print(f"[ERROR] {symbol} 히스토리 데이터 수집 실패: 모든 fallback 기간 시도 실패")
        traceback.print_exc()
        return None
    
    @staticmethod
    def get_ticker_info(symbol: str) -> Optional[Dict]:
        """티커 기본 정보 가져오기 (캐싱)"""
        symbol = symbol.upper()
        cache_key = YahooService._get_cache_key("ticker:info", symbol)
        cached = cache.get(cache_key)
        if cached is not None:
            return cached
        
        try:
            ticker = YahooService._create_ticker(symbol)
            info = ticker.info
            
            if not info or len(info) == 0:
                return None
            
            # 필요한 정보만 추출
            result = {
                "symbol": symbol,
                "name": info.get("longName") or info.get("shortName", ""),
                "current_price": info.get("currentPrice") or info.get("regularMarketPrice"),
                "previous_close": info.get("previousClose"),
                "market_cap": info.get("marketCap"),
                "volume": info.get("volume") or info.get("regularMarketVolume"),
                "currency": info.get("currency", "USD"),
                "exchange": info.get("exchange", ""),
                "sector": info.get("sector"),
                "industry": info.get("industry"),
            }
            
            cache.set(cache_key, result, YahooService.CACHE_TTL)
            return result
            
        except Exception as e:
            print(f"[ERROR] {symbol} 티커 정보 가져오기 실패: {e}")
            traceback.print_exc()
            return None
    
    @staticmethod
    def get_price_data(symbol: str, period: str = "1d") -> Optional[Dict]:
        """최신 가격 데이터 가져오기 (캐싱)"""
        symbol = symbol.upper()
        cache_key = YahooService._get_cache_key("price", symbol, period)
        cached = cache.get(cache_key)
        if cached is not None:
            return cached
        
        try:
            ticker = YahooService._create_ticker(symbol)
            hist = YahooService._fetch_history_with_retry(ticker, period)
            
            if hist is None or hist.empty:
                return None
            
            # 최신 데이터
            latest = hist.iloc[-1]
            
            result = {
                "symbol": symbol,
                "date": latest.name.strftime("%Y-%m-%d") if hasattr(latest.name, 'strftime') else str(latest.name),
                "open": float(latest["Open"]),
                "high": float(latest["High"]),
                "low": float(latest["Low"]),
                "close": float(latest["Close"]),
                "volume": int(latest["Volume"]) if pd.notna(latest["Volume"]) else 0,
                "adjusted_close": float(latest["Close"])
            }
            
            cache.set(cache_key, result, YahooService.CACHE_TTL)
            return result
            
        except Exception as e:
            print(f"[ERROR] {symbol} 가격 데이터 가져오기 실패: {e}")
            traceback.print_exc()
            return None
    
    @staticmethod
    def get_history_list(symbol: str, years: int = 3) -> List[Dict]:
        """히스토리 데이터를 리스트 형식으로 반환"""
        symbol = symbol.upper()
        df = YahooService.get_history(symbol, years)
        if df is None or df.empty:
            return []
        
        result = []
        for _, row in df.iterrows():
            result.append({
                "symbol": symbol,
                "date": row["date"].strftime("%Y-%m-%d") if hasattr(row["date"], 'strftime') else str(row["date"]),
                "open": float(row["open"]),
                "high": float(row["high"]),
                "low": float(row["low"]),
                "close": float(row["close"]),
                "volume": int(row["volume"]) if pd.notna(row["volume"]) else 0
            })
        
        return result
    
    @staticmethod
    def get_multiple_symbols(symbols: List[str], period: str = "1d") -> Dict[str, Optional[Dict]]:
        """여러 심볼의 가격 데이터를 한 번에 가져오기"""
        result = {}
        for symbol in symbols:
            result[symbol.upper()] = YahooService.get_price_data(symbol, period)
        return result
