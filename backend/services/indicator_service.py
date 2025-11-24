"""
기술적 지표 계산 서비스 (yfinance 데이터 기반, fallback 로직 포함)
"""
import pandas as pd
import numpy as np
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from services.yahoo_service import YahooService
from core.cache import cache


class IndicatorService:
    """기술적 지표 계산 서비스 (fallback 기간 지원)"""
    
    # Fallback 기간 목록
    FALLBACK_YEARS = [3, 2, 1]
    
    @staticmethod
    def _get_cache_key(prefix: str, symbol: str, *args) -> str:
        """캐시 키 생성"""
        symbol = symbol.upper()  # 항상 대문자로 변환
        key_parts = [prefix, symbol]
        if args:
            key_parts.extend(str(arg) for arg in args)
        return ":".join(key_parts)
    
    @staticmethod
    def _get_history_with_fallback(symbol: str, preferred_years: int = 3) -> Optional[pd.DataFrame]:
        """히스토리 데이터 가져오기 (fallback 기간 포함)"""
        symbol = symbol.upper()
        
        # 선호하는 기간부터 시도
        years_to_try = [preferred_years] + [y for y in IndicatorService.FALLBACK_YEARS if y != preferred_years]
        
        for years in years_to_try:
            df = YahooService.get_history(symbol, years)
            if df is not None and not df.empty:
                # date 컬럼 확인
                if "date" in df.columns and len(df) > 0:
                    # date가 비어있지 않은지 확인
                    if not df["date"].isna().all():
                        print(f"[INFO] {symbol} 데이터 수집 성공: {len(df)}개 레코드 ({years}년 기간)")
                        return df
                    else:
                        print(f"[WARNING] {symbol} date 컬럼이 비어있음, 다음 기간 시도...")
                else:
                    print(f"[WARNING] {symbol} 데이터 구조 문제, 다음 기간 시도...")
        
        print(f"[ERROR] {symbol} 모든 fallback 기간 시도 실패")
        return None
    
    @staticmethod
    def get_moving_average(symbol: str, days: int = 200, period_years: int = 3) -> List[Dict]:
        """이동평균선 계산 (fallback 지원)"""
        symbol = symbol.upper()
        cache_key = IndicatorService._get_cache_key("ma", symbol, days, period_years)
        cached = cache.get(cache_key)
        if cached is not None:
            return cached
        
        try:
            # 히스토리 데이터 가져오기 (fallback 포함)
            df = IndicatorService._get_history_with_fallback(symbol, period_years)
            if df is None or df.empty:
                print(f"[ERROR] {symbol} 이동평균 계산 실패: 데이터 없음")
                return []
            
            if len(df) < days:
                # 최근 데이터만 사용
                print(f"[WARNING] {symbol} 데이터 부족 ({len(df)}개 < {days}개), 최근 데이터만 사용")
                df = df.tail(len(df)).copy()
            
            # 이동평균 계산
            df = df.copy()
            df[f"ma{days}"] = df["close"].rolling(window=days, min_periods=1).mean()
            
            result = []
            for _, row in df.iterrows():
                if pd.notna(row.get(f"ma{days}")):
                    date_str = row["date"].strftime("%Y-%m-%d") if hasattr(row["date"], 'strftime') else str(row["date"])
                    result.append({
                        "date": date_str,
                        "price": float(row["close"]),
                        f"ma{days}": float(row[f"ma{days}"])
                    })
            
            if not result:
                print(f"[ERROR] {symbol} 이동평균 계산 결과 없음")
                return []
            
            # 캐시 저장 (15분)
            cache.set(cache_key, result, 15 * 60)
            print(f"[INFO] {symbol} 이동평균 계산 완료: {len(result)}개 데이터")
            return result
            
        except Exception as e:
            print(f"[ERROR] {symbol} 이동평균 계산 실패: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    @staticmethod
    def get_rsi(symbol: str, period: int = 14, period_years: int = 3) -> List[Dict]:
        """RSI 계산 (14일 기준, fallback 지원)"""
        symbol = symbol.upper()
        cache_key = IndicatorService._get_cache_key("rsi", symbol, period, period_years)
        cached = cache.get(cache_key)
        if cached is not None:
            return cached
        
        try:
            # 히스토리 데이터 가져오기 (fallback 포함)
            df = IndicatorService._get_history_with_fallback(symbol, period_years)
            if df is None or df.empty:
                print(f"[ERROR] {symbol} RSI 계산 실패: 데이터 없음")
                return []
            
            if len(df) < period:
                # 최근 데이터만 사용
                print(f"[WARNING] {symbol} 데이터 부족 ({len(df)}개 < {period}개), 최근 데이터만 사용")
                df = df.tail(len(df)).copy()
            
            # RSI 계산
            df = df.copy()
            delta = df["close"].diff()
            gain = (delta.where(delta > 0, 0)).rolling(window=period, min_periods=1).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=period, min_periods=1).mean()
            rs = gain / loss.replace(0, np.nan)
            df["rsi"] = 100 - (100 / (1 + rs))
            df["rsi"] = df["rsi"].fillna(50)
            
            result = []
            for _, row in df.iterrows():
                date_str = row["date"].strftime("%Y-%m-%d") if hasattr(row["date"], 'strftime') else str(row["date"])
                result.append({
                    "date": date_str,
                    "rsi": float(row["rsi"]),
                    "price": float(row["close"])
                })
            
            if not result:
                print(f"[ERROR] {symbol} RSI 계산 결과 없음")
                return []
            
            # 캐시 저장 (15분)
            cache.set(cache_key, result, 15 * 60)
            print(f"[INFO] {symbol} RSI 계산 완료: {len(result)}개 데이터")
            return result
            
        except Exception as e:
            print(f"[ERROR] {symbol} RSI 계산 실패: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    @staticmethod
    def get_macd(symbol: str, fast: int = 12, slow: int = 26, signal: int = 9, period_years: int = 3) -> List[Dict]:
        """MACD 계산 (12/26/9, fallback 지원)"""
        symbol = symbol.upper()
        cache_key = IndicatorService._get_cache_key("macd", symbol, fast, slow, signal, period_years)
        cached = cache.get(cache_key)
        if cached is not None:
            return cached
        
        try:
            # 히스토리 데이터 가져오기 (fallback 포함)
            df = IndicatorService._get_history_with_fallback(symbol, period_years)
            if df is None or df.empty:
                print(f"[ERROR] {symbol} MACD 계산 실패: 데이터 없음")
                return []
            
            min_required = slow + signal
            if len(df) < min_required:
                # 최근 데이터만 사용
                print(f"[WARNING] {symbol} 데이터 부족 ({len(df)}개 < {min_required}개), 최근 데이터만 사용")
                df = df.tail(len(df)).copy()
            
            # MACD 계산
            df = df.copy()
            ema_fast = df["close"].ewm(span=fast, adjust=False).mean()
            ema_slow = df["close"].ewm(span=slow, adjust=False).mean()
            df["macd"] = ema_fast - ema_slow
            df["signal"] = df["macd"].ewm(span=signal, adjust=False).mean()
            df["histogram"] = df["macd"] - df["signal"]
            
            result = []
            for _, row in df.iterrows():
                if pd.notna(row.get("macd")):
                    date_str = row["date"].strftime("%Y-%m-%d") if hasattr(row["date"], 'strftime') else str(row["date"])
                    result.append({
                        "date": date_str,
                        "macd": float(row["macd"]),
                        "signal": float(row["signal"]),
                        "histogram": float(row["histogram"]),
                        "price": float(row["close"])
                    })
            
            if not result:
                print(f"[ERROR] {symbol} MACD 계산 결과 없음")
                return []
            
            # 캐시 저장 (15분)
            cache.set(cache_key, result, 15 * 60)
            print(f"[INFO] {symbol} MACD 계산 완료: {len(result)}개 데이터")
            return result
            
        except Exception as e:
            print(f"[ERROR] {symbol} MACD 계산 실패: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    @staticmethod
    def get_stochastic(symbol: str, k_period: int = 14, d_period: int = 3, period_years: int = 3) -> List[Dict]:
        """Stochastic Oscillator 계산 (14일 + 3일 smoothing, fallback 지원)"""
        symbol = symbol.upper()
        cache_key = IndicatorService._get_cache_key("stochastic", symbol, k_period, d_period, period_years)
        cached = cache.get(cache_key)
        if cached is not None:
            return cached
        
        try:
            # 히스토리 데이터 가져오기 (fallback 포함)
            df = IndicatorService._get_history_with_fallback(symbol, period_years)
            if df is None or df.empty:
                print(f"[ERROR] {symbol} Stochastic 계산 실패: 데이터 없음")
                return []
            
            min_required = k_period + d_period
            if len(df) < min_required:
                # 최근 데이터만 사용
                print(f"[WARNING] {symbol} 데이터 부족 ({len(df)}개 < {min_required}개), 최근 데이터만 사용")
                df = df.tail(len(df)).copy()
            
            # Stochastic 계산
            df = df.copy()
            low_min = df["low"].rolling(window=k_period, min_periods=1).min()
            high_max = df["high"].rolling(window=k_period, min_periods=1).max()
            df["%K"] = 100 * ((df["close"] - low_min) / (high_max - low_min))
            df["%D"] = df["%K"].rolling(window=d_period, min_periods=1).mean()
            
            result = []
            for _, row in df.iterrows():
                if pd.notna(row.get("%K")):
                    date_str = row["date"].strftime("%Y-%m-%d") if hasattr(row["date"], 'strftime') else str(row["date"])
                    result.append({
                        "date": date_str,
                        "%K": float(row["%K"]),
                        "%D": float(row["%D"]),
                        "price": float(row["close"])
                    })
            
            if not result:
                print(f"[ERROR] {symbol} Stochastic 계산 결과 없음")
                return []
            
            # 캐시 저장 (15분)
            cache.set(cache_key, result, 15 * 60)
            print(f"[INFO] {symbol} Stochastic 계산 완료: {len(result)}개 데이터")
            return result
            
        except Exception as e:
            print(f"[ERROR] {symbol} Stochastic 계산 실패: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    @staticmethod
    def get_volatility(symbol: str, period: int = 30, period_years: int = 3) -> Optional[float]:
        """변동성 계산 (표준편차 기반, fallback 지원)"""
        symbol = symbol.upper()
        cache_key = IndicatorService._get_cache_key("volatility", symbol, period, period_years)
        cached = cache.get(cache_key)
        if cached is not None:
            return cached
        
        try:
            # 히스토리 데이터 가져오기 (fallback 포함)
            df = IndicatorService._get_history_with_fallback(symbol, period_years)
            if df is None or df.empty:
                print(f"[ERROR] {symbol} 변동성 계산 실패: 데이터 없음")
                return None
            
            if len(df) < period:
                print(f"[WARNING] {symbol} 데이터 부족 ({len(df)}개 < {period}개)")
                return None
            
            # 수익률 계산
            returns = df["close"].pct_change().dropna()
            if len(returns) < period:
                return None
            
            # 변동성 계산 (연율화)
            volatility = returns.rolling(window=period).std().iloc[-1]
            if pd.isna(volatility):
                return None
            
            # 연율화 (252 거래일 기준)
            annualized_volatility = volatility * np.sqrt(252) * 100
            
            # 캐시 저장 (15분)
            cache.set(cache_key, annualized_volatility, 15 * 60)
            return float(annualized_volatility)
            
        except Exception as e:
            print(f"[ERROR] {symbol} 변동성 계산 실패: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    @staticmethod
    def get_mdd(symbol: str, period_years: int = 3) -> Optional[float]:
        """MDD (Maximum Drawdown) 계산 (fallback 지원)"""
        symbol = symbol.upper()
        cache_key = IndicatorService._get_cache_key("mdd", symbol, period_years)
        cached = cache.get(cache_key)
        if cached is not None:
            return cached
        
        try:
            # 히스토리 데이터 가져오기 (fallback 포함)
            df = IndicatorService._get_history_with_fallback(symbol, period_years)
            if df is None or df.empty:
                print(f"[ERROR] {symbol} MDD 계산 실패: 데이터 없음")
                return None
            
            if len(df) < 2:
                return None
            
            # 누적 수익률 계산
            returns = df["close"].pct_change().dropna()
            if len(returns) == 0:
                return None
            
            cumulative = (1 + returns).cumprod()
            running_max = cumulative.expanding().max()
            drawdown = (cumulative - running_max) / running_max * 100
            mdd = abs(drawdown.min())
            
            if pd.isna(mdd):
                return None
            
            # 캐시 저장 (15분)
            cache.set(cache_key, mdd, 15 * 60)
            return float(mdd)
            
        except Exception as e:
            print(f"[ERROR] {symbol} MDD 계산 실패: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    @staticmethod
    def get_golden_death_cross(symbol: str, period_years: int = 3) -> Dict:
        """골든/데드크로스 판단 (MA20, MA60, MA200 기반)
        
        Returns:
            Dict: {
                "golden_cross": bool,
                "death_cross": bool,
                "cross_type": "golden" | "death" | "none",
                "ma20_current": float,
                "ma60_current": float,
                "ma200_current": float,
                "ma20_previous": float,
                "ma60_previous": float,
                "ma200_previous": float
            }
        """
        symbol = symbol.upper()
        cache_key = IndicatorService._get_cache_key("cross", symbol, period_years)
        cached = cache.get(cache_key)
        if cached is not None:
            return cached
        
        try:
            # MA20, MA60, MA200 데이터 가져오기
            ma20_data = IndicatorService.get_moving_average(symbol, days=20, period_years=period_years)
            ma60_data = IndicatorService.get_moving_average(symbol, days=60, period_years=period_years)
            ma200_data = IndicatorService.get_moving_average(symbol, days=200, period_years=period_years)
            
            if not ma20_data or not ma60_data or not ma200_data:
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
            
            # 최신 2개 데이터 추출
            if len(ma20_data) < 2 or len(ma60_data) < 2 or len(ma200_data) < 2:
                return {
                    "golden_cross": False,
                    "death_cross": False,
                    "cross_type": "none",
                    "ma20_current": ma20_data[-1].get("ma20") if ma20_data else None,
                    "ma60_current": ma60_data[-1].get("ma60") if ma60_data else None,
                    "ma200_current": ma200_data[-1].get("ma200") if ma200_data else None,
                    "ma20_previous": None,
                    "ma60_previous": None,
                    "ma200_previous": None
                }
            
            # 현재 및 이전 값
            ma20_current = ma20_data[-1].get("ma20")
            ma20_previous = ma20_data[-2].get("ma20")
            ma60_current = ma60_data[-1].get("ma60")
            ma60_previous = ma60_data[-2].get("ma60")
            ma200_current = ma200_data[-1].get("ma200")
            ma200_previous = ma200_data[-2].get("ma200")
            
            golden_cross = False
            death_cross = False
            
            # 골든크로스 판단
            # 조건 A: 이전 MA20 < MA60 AND 현재 MA20 > MA60
            if ma20_previous and ma60_previous and ma20_current and ma60_current:
                if ma20_previous < ma60_previous and ma20_current > ma60_current:
                    golden_cross = True
            
            # 조건 B: 이전 MA20 < MA200 AND 현재 MA20 > MA200
            if not golden_cross and ma20_previous and ma200_previous and ma20_current and ma200_current:
                if ma20_previous < ma200_previous and ma20_current > ma200_current:
                    golden_cross = True
            
            # 데드크로스 판단
            # 조건 A: 이전 MA20 > MA60 AND 현재 MA20 < MA60
            if ma20_previous and ma60_previous and ma20_current and ma60_current:
                if ma20_previous > ma60_previous and ma20_current < ma60_current:
                    death_cross = True
            
            # 조건 B: 이전 MA20 > MA200 AND 현재 MA20 < MA200
            if not death_cross and ma20_previous and ma200_previous and ma20_current and ma200_current:
                if ma20_previous > ma200_previous and ma20_current < ma200_current:
                    death_cross = True
            
            cross_type = "golden" if golden_cross else ("death" if death_cross else "none")
            
            result = {
                "golden_cross": golden_cross,
                "death_cross": death_cross,
                "cross_type": cross_type,
                "ma20_current": ma20_current,
                "ma60_current": ma60_current,
                "ma200_current": ma200_current,
                "ma20_previous": ma20_previous,
                "ma60_previous": ma60_previous,
                "ma200_previous": ma200_previous
            }
            
            # 캐시 저장 (15분)
            cache.set(cache_key, result, 15 * 60)
            return result
            
        except Exception as e:
            print(f"[ERROR] {symbol} 골든/데드크로스 계산 실패: {e}")
            import traceback
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
    
    @staticmethod
    def get_divergence(symbol: str, period_days: int = 60, period_years: int = 3) -> Dict:
        """RSI/가격 기반 Divergence 판단 (최근 30~60일)
        
        Returns:
            Dict: {
                "divergence": "bullish" | "bearish" | "none",
                "price_low1": float,
                "price_low2": float,
                "rsi_low1": float,
                "rsi_low2": float,
                "price_high1": float,
                "price_high2": float,
                "rsi_high1": float,
                "rsi_high2": float
            }
        """
        symbol = symbol.upper()
        cache_key = IndicatorService._get_cache_key("divergence", symbol, period_days, period_years)
        cached = cache.get(cache_key)
        if cached is not None:
            return cached
        
        try:
            # 히스토리 및 RSI 데이터 가져오기
            df = IndicatorService._get_history_with_fallback(symbol, period_years)
            rsi_data = IndicatorService.get_rsi(symbol, period_years=period_years)
            
            if df is None or df.empty or not rsi_data or len(rsi_data) < period_days:
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
            
            # 최근 period_days일 데이터만 사용
            df_recent = df.tail(period_days).copy()
            rsi_recent = rsi_data[-period_days:] if len(rsi_data) >= period_days else rsi_data
            
            # RSI 데이터를 DataFrame과 병합 (날짜 형식 통일)
            rsi_dict = {}
            for item in rsi_recent:
                date_key = item["date"]
                if hasattr(date_key, 'strftime'):
                    date_key = date_key.strftime("%Y-%m-%d")
                else:
                    date_key = str(date_key)
                rsi_dict[date_key] = item["rsi"]
            
            def get_rsi_value(date_val):
                if hasattr(date_val, 'strftime'):
                    date_key = date_val.strftime("%Y-%m-%d")
                else:
                    date_key = str(date_val)
                return rsi_dict.get(date_key, None)
            
            df_recent["rsi"] = df_recent["date"].apply(get_rsi_value)
            
            # 최근 두 개의 저점 찾기 (가격)
            price_lows = df_recent.nsmallest(2, "low")
            if len(price_lows) < 2:
                price_low1 = price_low2 = None
            else:
                price_low1 = float(price_lows.iloc[0]["low"])
                price_low2 = float(price_lows.iloc[1]["low"])
            
            # 최근 두 개의 저점 찾기 (RSI)
            rsi_lows = df_recent.nsmallest(2, "rsi")
            if len(rsi_lows) < 2:
                rsi_low1 = rsi_low2 = None
            else:
                rsi_low1 = float(rsi_lows.iloc[0]["rsi"])
                rsi_low2 = float(rsi_lows.iloc[1]["rsi"])
            
            # 최근 두 개의 고점 찾기 (가격)
            price_highs = df_recent.nlargest(2, "high")
            if len(price_highs) < 2:
                price_high1 = price_high2 = None
            else:
                price_high1 = float(price_highs.iloc[0]["high"])
                price_high2 = float(price_highs.iloc[1]["high"])
            
            # 최근 두 개의 고점 찾기 (RSI)
            rsi_highs = df_recent.nlargest(2, "rsi")
            if len(rsi_highs) < 2:
                rsi_high1 = rsi_high2 = None
            else:
                rsi_high1 = float(rsi_highs.iloc[0]["rsi"])
                rsi_high2 = float(rsi_highs.iloc[1]["rsi"])
            
            divergence = "none"
            
            # 상승 다이버전스 (Bullish Divergence)
            # price_low2 < price_low1 (가격은 더 낮아짐) AND rsi_low2 > rsi_low1 (RSI는 더 높아짐)
            if price_low1 and price_low2 and rsi_low1 and rsi_low2:
                if price_low2 < price_low1 and rsi_low2 > rsi_low1:
                    divergence = "bullish"
            
            # 하락 다이버전스 (Bearish Divergence)
            # price_high2 > price_high1 (가격은 더 높아짐) AND rsi_high2 < rsi_high1 (RSI는 낮아짐)
            if divergence == "none" and price_high1 and price_high2 and rsi_high1 and rsi_high2:
                if price_high2 > price_high1 and rsi_high2 < rsi_high1:
                    divergence = "bearish"
            
            result = {
                "divergence": divergence,
                "price_low1": price_low1,
                "price_low2": price_low2,
                "rsi_low1": rsi_low1,
                "rsi_low2": rsi_low2,
                "price_high1": price_high1,
                "price_high2": price_high2,
                "rsi_high1": rsi_high1,
                "rsi_high2": rsi_high2
            }
            
            # 캐시 저장 (15분)
            cache.set(cache_key, result, 15 * 60)
            return result
            
        except Exception as e:
            print(f"[ERROR] {symbol} Divergence 계산 실패: {e}")
            import traceback
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
    
    @staticmethod
    def detect_patterns(symbol: str, period_years: int = 1) -> Dict:
        """시장 패턴 탐지 (삼각수렴, 쐐기, 박스권, 볼린저밴드 돌파, 급등/급락)
        
        Returns:
            Dict: {
                "patterns": List[Dict],
                "spike_days": List[Dict],  # 급등/급락일
                "bollinger_breakout": Optional[Dict]
            }
        """
        symbol = symbol.upper()
        cache_key = IndicatorService._get_cache_key("patterns", symbol, period_years)
        cached = cache.get(cache_key)
        if cached is not None:
            return cached
        
        try:
            df = IndicatorService._get_history_with_fallback(symbol, period_years)
            if df is None or df.empty or len(df) < 30:
                return {
                    "patterns": [],
                    "spike_days": [],
                    "bollinger_breakout": None
                }
            
            patterns = []
            spike_days = []
            
            # 최근 60일 데이터로 패턴 분석
            df_recent = df.tail(60).copy()
            
            # 1. 삼각수렴 패턴 (최근 30일)
            if len(df_recent) >= 30:
                recent_30 = df_recent.tail(30)
                highs = recent_30["high"].values
                lows = recent_30["low"].values
                
                # 상승 삼각 (저점 상승, 고점 유지)
                if len(lows) >= 3 and len(highs) >= 3:
                    low_trend = (lows[-1] - lows[0]) / len(lows)
                    high_volatility = np.std(highs)
                    
                    if low_trend > 0 and high_volatility < np.std(lows) * 0.5:
                        patterns.append({
                            "type": "ascending_triangle",
                            "description": "상승 삼각수렴",
                            "start_date": recent_30.iloc[0]["date"].strftime("%Y-%m-%d") if hasattr(recent_30.iloc[0]["date"], 'strftime') else str(recent_30.iloc[0]["date"]),
                            "end_date": recent_30.iloc[-1]["date"].strftime("%Y-%m-%d") if hasattr(recent_30.iloc[-1]["date"], 'strftime') else str(recent_30.iloc[-1]["date"]),
                        })
                    
                    # 하락 삼각 (고점 하락, 저점 유지)
                    high_trend = (highs[-1] - highs[0]) / len(highs)
                    low_volatility = np.std(lows)
                    
                    if high_trend < 0 and low_volatility < np.std(highs) * 0.5:
                        patterns.append({
                            "type": "descending_triangle",
                            "description": "하락 삼각수렴",
                            "start_date": recent_30.iloc[0]["date"].strftime("%Y-%m-%d") if hasattr(recent_30.iloc[0]["date"], 'strftime') else str(recent_30.iloc[0]["date"]),
                            "end_date": recent_30.iloc[-1]["date"].strftime("%Y-%m-%d") if hasattr(recent_30.iloc[-1]["date"], 'strftime') else str(recent_30.iloc[-1]["date"]),
                        })
            
            # 2. 박스권 패턴
            if len(df_recent) >= 20:
                recent_20 = df_recent.tail(20)
                prices = recent_20["close"].values
                max_price = np.max(prices)
                min_price = np.min(prices)
                range_ratio = (max_price - min_price) / np.mean(prices)
                
                if range_ratio < 0.05:  # 5% 이내 변동
                    patterns.append({
                        "type": "box",
                        "description": "박스권 패턴",
                        "start_date": recent_20.iloc[0]["date"].strftime("%Y-%m-%d") if hasattr(recent_20.iloc[0]["date"], 'strftime') else str(recent_20.iloc[0]["date"]),
                        "end_date": recent_20.iloc[-1]["date"].strftime("%Y-%m-%d") if hasattr(recent_20.iloc[-1]["date"], 'strftime') else str(recent_20.iloc[-1]["date"]),
                        "upper": float(max_price),
                        "lower": float(min_price),
                    })
            
            # 3. 급등/급락일 탐지 (전일 대비 ±8%)
            for i in range(1, len(df_recent)):
                prev_close = df_recent.iloc[i-1]["close"]
                current_close = df_recent.iloc[i]["close"]
                change_pct = ((current_close - prev_close) / prev_close) * 100
                
                if abs(change_pct) >= 8:
                    date_str = df_recent.iloc[i]["date"].strftime("%Y-%m-%d") if hasattr(df_recent.iloc[i]["date"], 'strftime') else str(df_recent.iloc[i]["date"])
                    spike_days.append({
                        "date": date_str,
                        "change_pct": round(change_pct, 2),
                        "type": "spike_up" if change_pct > 0 else "spike_down",
                        "price": float(current_close)
                    })
            
            # 4. 볼린저밴드 돌파 확인
            try:
                from services.advanced_indicators_service import AdvancedIndicatorsService
                bb_data = AdvancedIndicatorsService.get_bollinger_bands(symbol, period=20, std_dev=2, period_years=period_years)
            except ImportError:
                bb_data = []
            if bb_data and len(bb_data) > 0:
                latest_bb = bb_data[-1]
                price_data = YahooService.get_price_data(symbol)
                if price_data:
                    current_price = price_data.get("close", 0)
                    upper = latest_bb.get("upper")
                    lower = latest_bb.get("lower")
                    
                    if upper and lower and current_price > 0:
                        if current_price > upper:
                            bollinger_breakout = {
                                "type": "upper_breakout",
                                "description": "볼린저밴드 상단 돌파",
                                "price": current_price,
                                "upper_band": upper
                            }
                        elif current_price < lower:
                            bollinger_breakout = {
                                "type": "lower_breakout",
                                "description": "볼린저밴드 하단 돌파",
                                "price": current_price,
                                "lower_band": lower
                            }
                        else:
                            bollinger_breakout = None
                    else:
                        bollinger_breakout = None
                else:
                    bollinger_breakout = None
            else:
                bollinger_breakout = None
            
            result = {
                "patterns": patterns,
                "spike_days": spike_days[-10:],  # 최근 10개만
                "bollinger_breakout": bollinger_breakout
            }
            
            cache.set(cache_key, result, 15 * 60)
            return result
            
        except Exception as e:
            print(f"[ERROR] {symbol} 패턴 탐지 실패: {e}")
            import traceback
            traceback.print_exc()
            return {
                "patterns": [],
                "spike_days": [],
                "bollinger_breakout": None
            }
    
    @staticmethod
    def get_atr(symbol: str, period: int = 14, period_years: int = 3) -> Optional[float]:
        """ATR (Average True Range) 계산
        
        Returns:
            Optional[float]: ATR 값
        """
        symbol = symbol.upper()
        cache_key = IndicatorService._get_cache_key("atr", symbol, period, period_years)
        cached = cache.get(cache_key)
        if cached is not None:
            return cached
        
        try:
            df = IndicatorService._get_history_with_fallback(symbol, period_years)
            if df is None or df.empty or len(df) < period + 1:
                return None
            
            # True Range 계산
            df = df.copy()
            df["prev_close"] = df["close"].shift(1)
            df["tr1"] = df["high"] - df["low"]
            df["tr2"] = abs(df["high"] - df["prev_close"])
            df["tr3"] = abs(df["low"] - df["prev_close"])
            df["tr"] = df[["tr1", "tr2", "tr3"]].max(axis=1)
            
            # ATR 계산 (period일 평균)
            atr = df["tr"].rolling(window=period, min_periods=1).mean().iloc[-1]
            
            if pd.isna(atr):
                return None
            
            result = float(atr)
            
            # 캐시 저장 (15분)
            cache.set(cache_key, result, 15 * 60)
            return result
            
        except Exception as e:
            print(f"[ERROR] {symbol} ATR 계산 실패: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    @staticmethod
    def get_risk_score(symbol: str, period: int = 30, period_years: int = 3) -> Dict:
        """변동성 기반 Risk Score 계산
        
        Returns:
            Dict: {
                "risk_score": float (0-100),
                "risk_grade": "Low" | "Medium" | "High",
                "atr_normalized": float,
                "volatility_std": float,
                "range_vol": float
            }
        """
        symbol = symbol.upper()
        cache_key = IndicatorService._get_cache_key("risk_score", symbol, period, period_years)
        cached = cache.get(cache_key)
        if cached is not None:
            return cached
        
        try:
            df = IndicatorService._get_history_with_fallback(symbol, period_years)
            if df is None or df.empty or len(df) < period:
                return {
                    "risk_score": 50.0,
                    "risk_grade": "Medium",
                    "atr_normalized": None,
                    "volatility_std": None,
                    "range_vol": None
                }
            
            # 최근 period일 데이터만 사용
            df_recent = df.tail(period).copy()
            current_price = float(df_recent.iloc[-1]["close"])
            
            # 1) ATR 계산 및 정규화
            atr = IndicatorService.get_atr(symbol, period=14, period_years=period_years)
            atr_normalized = (atr / current_price) if atr and current_price > 0 else 0.0
            
            # 2) 최근 30일 수익률의 표준편차
            returns = df_recent["close"].pct_change().dropna()
            volatility_std = float(returns.std()) if len(returns) > 0 else 0.0
            
            # 3) 일일 변동폭(고가-저가)의 평균값 / 종가
            df_recent["range"] = (df_recent["high"] - df_recent["low"]) / df_recent["close"]
            range_vol = float(df_recent["range"].mean()) if len(df_recent) > 0 else 0.0
            
            # 4) 총 변동성 = (ATR_normalized + volatility_std + range_vol) / 3
            total_volatility = (atr_normalized + volatility_std + range_vol) / 3.0
            
            # 5) risk_score = min(100, 총 변동성 × 1000)
            risk_score = min(100.0, total_volatility * 1000.0)
            
            # 6) 위험 등급 분류
            if risk_score <= 30:
                risk_grade = "Low"
            elif risk_score <= 70:
                risk_grade = "Medium"
            else:
                risk_grade = "High"
            
            result = {
                "risk_score": round(risk_score, 2),
                "risk_grade": risk_grade,
                "atr_normalized": round(atr_normalized, 6),
                "volatility_std": round(volatility_std, 6),
                "range_vol": round(range_vol, 6)
            }
            
            # 캐시 저장 (15분)
            cache.set(cache_key, result, 15 * 60)
            return result
            
        except Exception as e:
            print(f"[ERROR] {symbol} Risk Score 계산 실패: {e}")
            import traceback
            traceback.print_exc()
            return {
                "risk_score": 50.0,
                "risk_grade": "Medium",
                "atr_normalized": None,
                "volatility_std": None,
                "range_vol": None
            }
