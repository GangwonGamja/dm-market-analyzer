"""
확장된 기술 분석 서비스 (캔들 패턴, 추세 분석, 패턴 탐지 등)
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from services.indicator_service import IndicatorService
from services.yahoo_service import YahooService
from services.fgi_service import FGIService
from services.fundamental_service import FundamentalService
from core.cache import cache


class AdvancedAnalysisService:
    """확장된 기술 분석 서비스"""
    
    @staticmethod
    def detect_candlestick_patterns(symbol: str, period_years: int = 3) -> Dict:
        """캔들 패턴 탐지
        
        Returns:
            Dict: {
                "patterns": List[Dict],  # [{date, pattern, signal}]
                "recent_patterns": List[Dict],  # 최근 5개 패턴
                "bullish_count": int,
                "bearish_count": int
            }
        """
        try:
            symbol = symbol.upper()
            df = IndicatorService._get_history_with_fallback(symbol, period_years)
            if df is None or df.empty or len(df) < 3:
                return {"patterns": [], "recent_patterns": [], "bullish_count": 0, "bearish_count": 0}
            
            patterns = []
            bullish_count = 0
            bearish_count = 0
            
            for i in range(2, len(df)):
                row = df.iloc[i]
                prev_row = df.iloc[i-1]
                prev2_row = df.iloc[i-2]
                
                open_price = row["open"]
                high = row["high"]
                low = row["low"]
                close = row["close"]
                prev_open = prev_row["open"]
                prev_high = prev_row["high"]
                prev_low = prev_row["low"]
                prev_close = prev_row["close"]
                prev2_open = prev2_row["open"]
                prev2_close = prev2_row["close"]
                
                body = abs(close - open_price)
                upper_shadow = high - max(open_price, close)
                lower_shadow = min(open_price, close) - low
                total_range = high - low
                
                pattern_name = None
                signal = None
                
                # Hammer (망치형)
                if lower_shadow > 2 * body and upper_shadow < 0.1 * body and close > open_price:
                    pattern_name = "Hammer"
                    signal = "bullish"
                    bullish_count += 1
                
                # Doji (십자형)
                elif body < 0.1 * total_range:
                    pattern_name = "Doji"
                    signal = "neutral"
                
                # Bullish Engulfing
                elif prev_close < prev_open and close > open_price and open_price < prev_close and close > prev_open:
                    pattern_name = "Bullish Engulfing"
                    signal = "bullish"
                    bullish_count += 1
                
                # Bearish Engulfing
                elif prev_close > prev_open and close < open_price and open_price > prev_close and close < prev_open:
                    pattern_name = "Bearish Engulfing"
                    signal = "bearish"
                    bearish_count += 1
                
                # Morning Star
                elif (i >= 2 and 
                      prev2_close < prev2_open and
                      prev_close < prev2_close and
                      close > prev2_close and
                      close > open_price):
                    pattern_name = "Morning Star"
                    signal = "bullish"
                    bullish_count += 1
                
                # Evening Star
                elif (i >= 2 and
                      prev2_close > prev2_open and
                      prev_close > prev2_close and
                      close < prev2_close and
                      close < open_price):
                    pattern_name = "Evening Star"
                    signal = "bearish"
                    bearish_count += 1
                
                if pattern_name:
                    date_str = row["date"].strftime("%Y-%m-%d") if hasattr(row["date"], 'strftime') else str(row["date"])
                    patterns.append({
                        "date": date_str,
                        "pattern": pattern_name,
                        "signal": signal,
                        "price": float(close)
                    })
            
            recent_patterns = patterns[-5:] if len(patterns) >= 5 else patterns
            
            return {
                "patterns": patterns,
                "recent_patterns": recent_patterns,
                "bullish_count": bullish_count,
                "bearish_count": bearish_count
            }
        except Exception as e:
            print(f"[ERROR] 캔들 패턴 탐지 오류 ({symbol}): {e}")
            return {"patterns": [], "recent_patterns": [], "bullish_count": 0, "bearish_count": 0}
    
    @staticmethod
    def detect_crosses_extended(symbol: str, period_years: int = 3) -> Dict:
        """확장된 골든/데드크로스 탐지 (MA50 vs MA200, MA20 vs MA60)
        
        Returns:
            Dict: {
                "ma50_ma200": {golden_cross, death_cross, cross_date, trend},
                "ma20_ma60": {golden_cross, death_cross, cross_date, trend},
                "recent_crosses": List[Dict]
            }
        """
        try:
            symbol = symbol.upper()
            df = IndicatorService._get_history_with_fallback(symbol, period_years)
            if df is None or df.empty or len(df) < 200:
                return {
                    "ma50_ma200": {"golden_cross": False, "death_cross": False, "cross_date": None, "trend": "none"},
                    "ma20_ma60": {"golden_cross": False, "death_cross": False, "cross_date": None, "trend": "none"},
                    "recent_crosses": []
                }
            
            df = df.copy()
            df["ma20"] = df["close"].rolling(window=20, min_periods=1).mean()
            df["ma50"] = df["close"].rolling(window=50, min_periods=1).mean()
            df["ma60"] = df["close"].rolling(window=60, min_periods=1).mean()
            df["ma200"] = df["close"].rolling(window=200, min_periods=1).mean()
            
            recent_crosses = []
            
            # MA50 vs MA200
            ma50_ma200_result = {"golden_cross": False, "death_cross": False, "cross_date": None, "trend": "none"}
            if len(df) >= 2:
                curr_ma50 = df.iloc[-1]["ma50"]
                curr_ma200 = df.iloc[-1]["ma200"]
                prev_ma50 = df.iloc[-2]["ma50"]
                prev_ma200 = df.iloc[-2]["ma200"]
                
                if prev_ma50 < prev_ma200 and curr_ma50 > curr_ma200:
                    ma50_ma200_result["golden_cross"] = True
                    ma50_ma200_result["trend"] = "bullish"
                    date_str = df.iloc[-1]["date"].strftime("%Y-%m-%d") if hasattr(df.iloc[-1]["date"], 'strftime') else str(df.iloc[-1]["date"])
                    ma50_ma200_result["cross_date"] = date_str
                    recent_crosses.append({
                        "type": "Golden Cross",
                        "description": "MA50 crossed above MA200",
                        "date": date_str
                    })
                elif prev_ma50 > prev_ma200 and curr_ma50 < curr_ma200:
                    ma50_ma200_result["death_cross"] = True
                    ma50_ma200_result["trend"] = "bearish"
                    date_str = df.iloc[-1]["date"].strftime("%Y-%m-%d") if hasattr(df.iloc[-1]["date"], 'strftime') else str(df.iloc[-1]["date"])
                    ma50_ma200_result["cross_date"] = date_str
                    recent_crosses.append({
                        "type": "Death Cross",
                        "description": "MA50 crossed below MA200",
                        "date": date_str
                    })
                elif curr_ma50 > curr_ma200:
                    ma50_ma200_result["trend"] = "bullish"
                elif curr_ma50 < curr_ma200:
                    ma50_ma200_result["trend"] = "bearish"
            
            # MA20 vs MA60
            ma20_ma60_result = {"golden_cross": False, "death_cross": False, "cross_date": None, "trend": "none"}
            if len(df) >= 2:
                curr_ma20 = df.iloc[-1]["ma20"]
                curr_ma60 = df.iloc[-1]["ma60"]
                prev_ma20 = df.iloc[-2]["ma20"]
                prev_ma60 = df.iloc[-2]["ma60"]
                
                if prev_ma20 < prev_ma60 and curr_ma20 > curr_ma60:
                    ma20_ma60_result["golden_cross"] = True
                    ma20_ma60_result["trend"] = "bullish"
                    date_str = df.iloc[-1]["date"].strftime("%Y-%m-%d") if hasattr(df.iloc[-1]["date"], 'strftime') else str(df.iloc[-1]["date"])
                    ma20_ma60_result["cross_date"] = date_str
                    recent_crosses.append({
                        "type": "Golden Cross",
                        "description": "MA20 crossed above MA60",
                        "date": date_str
                    })
                elif prev_ma20 > prev_ma60 and curr_ma20 < curr_ma60:
                    ma20_ma60_result["death_cross"] = True
                    ma20_ma60_result["trend"] = "bearish"
                    date_str = df.iloc[-1]["date"].strftime("%Y-%m-%d") if hasattr(df.iloc[-1]["date"], 'strftime') else str(df.iloc[-1]["date"])
                    ma20_ma60_result["cross_date"] = date_str
                    recent_crosses.append({
                        "type": "Death Cross",
                        "description": "MA20 crossed below MA60",
                        "date": date_str
                    })
                elif curr_ma20 > curr_ma60:
                    ma20_ma60_result["trend"] = "bullish"
                elif curr_ma20 < curr_ma60:
                    ma20_ma60_result["trend"] = "bearish"
            
            return {
                "ma50_ma200": ma50_ma200_result,
                "ma20_ma60": ma20_ma60_result,
                "recent_crosses": recent_crosses[-5:]  # 최근 5개만
            }
        except Exception as e:
            print(f"[ERROR] 확장된 크로스 탐지 오류 ({symbol}): {e}")
            return {
                "ma50_ma200": {"golden_cross": False, "death_cross": False, "cross_date": None, "trend": "none"},
                "ma20_ma60": {"golden_cross": False, "death_cross": False, "cross_date": None, "trend": "none"},
                "recent_crosses": []
            }
    
    @staticmethod
    def analyze_trend(symbol: str, period_years: int = 3) -> Dict:
        """장기/단기 추세 분석 및 강도 계산
        
        Returns:
            Dict: {
                "long_term": {trend, strength, price_vs_ma200, ma200_direction},
                "short_term": {trend, strength, ma20_slope, recent_high_low_break},
                "overall_trend": str
            }
        """
        try:
            symbol = symbol.upper()
            df = IndicatorService._get_history_with_fallback(symbol, period_years)
            if df is None or df.empty or len(df) < 200:
                return {
                    "long_term": {"trend": "unknown", "strength": 0, "price_vs_ma200": 0, "ma200_direction": "flat"},
                    "short_term": {"trend": "unknown", "strength": 0, "ma20_slope": 0, "recent_high_low_break": "none"},
                    "overall_trend": "unknown"
                }
            
            df = df.copy()
            df["ma20"] = df["close"].rolling(window=20, min_periods=1).mean()
            df["ma200"] = df["close"].rolling(window=200, min_periods=1).mean()
            
            current_price = df.iloc[-1]["close"]
            ma200_current = df.iloc[-1]["ma200"]
            ma200_prev = df.iloc[-2]["ma200"] if len(df) >= 2 else ma200_current
            
            # 장기 추세
            price_vs_ma200_pct = ((current_price - ma200_current) / ma200_current * 100) if ma200_current > 0 else 0
            ma200_direction = "up" if ma200_current > ma200_prev else ("down" if ma200_current < ma200_prev else "flat")
            
            if current_price > ma200_current and ma200_direction == "up":
                long_term_trend = "strong_uptrend"
                long_term_strength = min(100, 50 + abs(price_vs_ma200_pct))
            elif current_price > ma200_current:
                long_term_trend = "uptrend"
                long_term_strength = min(100, 30 + abs(price_vs_ma200_pct) * 0.5)
            elif current_price < ma200_current and ma200_direction == "down":
                long_term_trend = "strong_downtrend"
                long_term_strength = min(100, 50 + abs(price_vs_ma200_pct))
            elif current_price < ma200_current:
                long_term_trend = "downtrend"
                long_term_strength = min(100, 30 + abs(price_vs_ma200_pct) * 0.5)
            else:
                long_term_trend = "sideways"
                long_term_strength = 20
            
            # 단기 추세
            if len(df) >= 20:
                ma20_current = df.iloc[-1]["ma20"]
                ma20_prev_10 = df.iloc[-11]["ma20"] if len(df) >= 11 else ma20_current
                ma20_slope = ((ma20_current - ma20_prev_10) / ma20_prev_10 * 100) if ma20_prev_10 > 0 else 0
                
                # 최근 10일 고점/저점 브레이크
                recent_10 = df.tail(10)
                recent_high = recent_10["high"].max()
                recent_low = recent_10["low"].min()
                prev_10_high = df.iloc[-11:-1]["high"].max() if len(df) >= 11 else recent_high
                prev_10_low = df.iloc[-11:-1]["low"].min() if len(df) >= 11 else recent_low
                
                high_low_break = "none"
                if current_price > prev_10_high:
                    high_low_break = "high_break"
                elif current_price < prev_10_low:
                    high_low_break = "low_break"
                
                if ma20_slope > 2:
                    short_term_trend = "strong_uptrend"
                    short_term_strength = min(100, 60 + abs(ma20_slope))
                elif ma20_slope > 0.5:
                    short_term_trend = "uptrend"
                    short_term_strength = min(100, 40 + abs(ma20_slope) * 5)
                elif ma20_slope < -2:
                    short_term_trend = "strong_downtrend"
                    short_term_strength = min(100, 60 + abs(ma20_slope))
                elif ma20_slope < -0.5:
                    short_term_trend = "downtrend"
                    short_term_strength = min(100, 40 + abs(ma20_slope) * 5)
                else:
                    short_term_trend = "sideways"
                    short_term_strength = 20
            else:
                ma20_slope = 0
                high_low_break = "none"
                short_term_trend = "unknown"
                short_term_strength = 0
            
            # 전체 추세 판단
            if long_term_trend in ["strong_uptrend", "uptrend"] and short_term_trend in ["strong_uptrend", "uptrend"]:
                overall_trend = "strong_uptrend"
            elif long_term_trend in ["strong_uptrend", "uptrend"] or short_term_trend in ["strong_uptrend", "uptrend"]:
                overall_trend = "uptrend"
            elif long_term_trend in ["strong_downtrend", "downtrend"] and short_term_trend in ["strong_downtrend", "downtrend"]:
                overall_trend = "strong_downtrend"
            elif long_term_trend in ["strong_downtrend", "downtrend"] or short_term_trend in ["strong_downtrend", "downtrend"]:
                overall_trend = "downtrend"
            else:
                overall_trend = "sideways"
            
            return {
                "long_term": {
                    "trend": long_term_trend,
                    "strength": round(long_term_strength, 1),
                    "price_vs_ma200": round(price_vs_ma200_pct, 2),
                    "ma200_direction": ma200_direction
                },
                "short_term": {
                    "trend": short_term_trend,
                    "strength": round(short_term_strength, 1),
                    "ma20_slope": round(ma20_slope, 2),
                    "recent_high_low_break": high_low_break
                },
                "overall_trend": overall_trend
            }
        except Exception as e:
            print(f"[ERROR] 추세 분석 오류 ({symbol}): {e}")
            return {
                "long_term": {"trend": "unknown", "strength": 0, "price_vs_ma200": 0, "ma200_direction": "flat"},
                "short_term": {"trend": "unknown", "strength": 0, "ma20_slope": 0, "recent_high_low_break": "none"},
                "overall_trend": "unknown"
            }
    
    @staticmethod
    def detect_technical_patterns(symbol: str, period_years: int = 3) -> Dict:
        """기술적 패턴 탐지 (박스권, 쐐기, 삼각수렴, 볼린저 밴드)
        
        Returns:
            Dict: {
                "box_range": {detected, support, resistance, width},
                "wedge": {type, detected, trend},
                "triangle": {type, detected, breakout_direction},
                "bollinger": {upper_touch, lower_touch, position}
            }
        """
        try:
            symbol = symbol.upper()
            df = IndicatorService._get_history_with_fallback(symbol, period_years)
            if df is None or df.empty or len(df) < 60:
                return {
                    "box_range": {"detected": False, "support": 0, "resistance": 0, "width": 0},
                    "wedge": {"type": "none", "detected": False, "trend": "none"},
                    "triangle": {"type": "none", "detected": False, "breakout_direction": "none"},
                    "bollinger": {"upper_touch": False, "lower_touch": False, "position": "middle"}
                }
            
            df = df.copy()
            recent_60 = df.tail(60)
            
            # 박스권 탐지
            support = recent_60["low"].min()
            resistance = recent_60["high"].max()
            width = resistance - support
            price_range_pct = (width / support * 100) if support > 0 else 0
            
            box_detected = price_range_pct < 15  # 15% 이내 변동폭
            
            # 볼린저 밴드
            period = 20
            std_dev = 2
            recent_20 = df.tail(20)
            sma = recent_20["close"].mean()
            std = recent_20["close"].std()
            upper_band = sma + (std_dev * std)
            lower_band = sma - (std_dev * std)
            current_price = df.iloc[-1]["close"]
            
            upper_touch = current_price >= upper_band * 0.98
            lower_touch = current_price <= lower_band * 1.02
            if upper_touch:
                bb_position = "upper"
            elif lower_touch:
                bb_position = "lower"
            else:
                bb_position = "middle"
            
            # 쐐기 패턴 (간단한 구현)
            wedge_detected = False
            wedge_type = "none"
            if len(recent_60) >= 30:
                first_half_high = recent_60.head(30)["high"].max()
                second_half_high = recent_60.tail(30)["high"].max()
                first_half_low = recent_60.head(30)["low"].min()
                second_half_low = recent_60.tail(30)["low"].min()
                
                # 상승 쐐기: 고점은 유사하지만 저점이 상승
                if abs(first_half_high - second_half_high) < (first_half_high * 0.05) and second_half_low > first_half_low * 1.05:
                    wedge_detected = True
                    wedge_type = "rising"
                # 하락 쐐기: 저점은 유사하지만 고점이 하락
                elif abs(first_half_low - second_half_low) < (first_half_low * 0.05) and second_half_high < first_half_high * 0.95:
                    wedge_detected = True
                    wedge_type = "falling"
            
            # 삼각수렴 (간단한 구현)
            triangle_detected = False
            triangle_type = "none"
            breakout_direction = "none"
            if len(recent_60) >= 40:
                # 고점과 저점이 수렴하는지 확인
                early_high = recent_60.head(20)["high"].max()
                late_high = recent_60.tail(20)["high"].max()
                early_low = recent_60.head(20)["low"].min()
                late_low = recent_60.tail(20)["low"].min()
                
                high_convergence = abs(early_high - late_high) < (early_high * 0.1)
                low_divergence = abs(early_low - late_low) < (early_low * 0.1)
                
                if high_convergence and not low_divergence:
                    triangle_detected = True
                    triangle_type = "ascending"
                    if current_price > late_high:
                        breakout_direction = "up"
                    elif current_price < late_low:
                        breakout_direction = "down"
                elif not high_convergence and low_divergence:
                    triangle_detected = True
                    triangle_type = "descending"
                    if current_price > late_high:
                        breakout_direction = "up"
                    elif current_price < late_low:
                        breakout_direction = "down"
            
            return {
                "box_range": {
                    "detected": box_detected,
                    "support": round(float(support), 2),
                    "resistance": round(float(resistance), 2),
                    "width": round(float(width), 2)
                },
                "wedge": {
                    "type": wedge_type,
                    "detected": wedge_detected,
                    "trend": "bullish" if wedge_type == "rising" else ("bearish" if wedge_type == "falling" else "none")
                },
                "triangle": {
                    "type": triangle_type,
                    "detected": triangle_detected,
                    "breakout_direction": breakout_direction
                },
                "bollinger": {
                    "upper_touch": upper_touch,
                    "lower_touch": lower_touch,
                    "position": bb_position
                }
            }
        except Exception as e:
            print(f"[ERROR] 기술적 패턴 탐지 오류 ({symbol}): {e}")
            return {
                "box_range": {"detected": False, "support": 0, "resistance": 0, "width": 0},
                "wedge": {"type": "none", "detected": False, "trend": "none"},
                "triangle": {"type": "none", "detected": False, "breakout_direction": "none"},
                "bollinger": {"upper_touch": False, "lower_touch": False, "position": "middle"}
            }
    
    @staticmethod
    def analyze_volatility_timing(symbol: str, period_years: int = 3) -> Dict:
        """변동성 기반 매수 타이밍 분석
        
        Returns:
            Dict: {
                "atr_spike": bool,
                "low_volatility_zone": bool,
                "atr_value": float,
                "atr_percentile": float,
                "buy_timing_score": float  # 0-100
            }
        """
        try:
            symbol = symbol.upper()
            df = IndicatorService._get_history_with_fallback(symbol, period_years)
            if df is None or df.empty or len(df) < 30:
                return {
                    "atr_spike": False,
                    "low_volatility_zone": False,
                    "atr_value": 0,
                    "atr_percentile": 50,
                    "buy_timing_score": 50
                }
            
            df = df.copy()
            period = 14
            
            # ATR 계산
            high_low = df["high"] - df["low"]
            high_close = abs(df["high"] - df["close"].shift(1))
            low_close = abs(df["low"] - df["close"].shift(1))
            tr = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
            atr = tr.rolling(window=period).mean()
            
            current_atr = atr.iloc[-1]
            current_price = df.iloc[-1]["close"]
            atr_percent = (current_atr / current_price * 100) if current_price > 0 else 0
            
            # ATR 히스토리 백분위수
            atr_percentiles = []
            for i in range(period, len(df)):
                price_at_i = df.iloc[i]["close"]
                atr_at_i = atr.iloc[i]
                if price_at_i > 0:
                    atr_percentiles.append((atr_at_i / price_at_i * 100))
            
            if atr_percentiles:
                atr_percentile = (sum(1 for p in atr_percentiles if p < atr_percent) / len(atr_percentiles) * 100)
            else:
                atr_percentile = 50
            
            # ATR 스파이크 감지 (90% 백분위수 이상)
            atr_spike = atr_percentile >= 90
            
            # 저변동성 구간 감지 (20% 백분위수 이하)
            low_volatility_zone = atr_percentile <= 20
            
            # 매수 타이밍 점수 (저변동성일수록 높음)
            buy_timing_score = 100 - atr_percentile
            
            return {
                "atr_spike": atr_spike,
                "low_volatility_zone": low_volatility_zone,
                "atr_value": round(float(current_atr), 2),
                "atr_percentile": round(atr_percentile, 1),
                "buy_timing_score": round(buy_timing_score, 1)
            }
        except Exception as e:
            print(f"[ERROR] 변동성 타이밍 분석 오류 ({symbol}): {e}")
            return {
                "atr_spike": False,
                "low_volatility_zone": False,
                "atr_value": 0,
                "atr_percentile": 50,
                "buy_timing_score": 50
            }
    
    @staticmethod
    def analyze_obv(symbol: str, period_years: int = 3) -> Dict:
        """OBV (On-Balance Volume) 분석
        
        Returns:
            Dict: {
                "obv_trend": str,  # "up", "down", "neutral"
                "obv_slope": float,
                "volume_breakout": bool,
                "money_flow": str  # "inflow", "outflow", "neutral"
            }
        """
        try:
            symbol = symbol.upper()
            df = IndicatorService._get_history_with_fallback(symbol, period_years)
            if df is None or df.empty or "volume" not in df.columns or len(df) < 20:
                return {
                    "obv_trend": "neutral",
                    "obv_slope": 0,
                    "volume_breakout": False,
                    "money_flow": "neutral"
                }
            
            df = df.copy()
            df["obv"] = 0.0
            obv = 0.0
            
            for i in range(1, len(df)):
                if df.iloc[i]["close"] > df.iloc[i-1]["close"]:
                    obv += df.iloc[i]["volume"]
                elif df.iloc[i]["close"] < df.iloc[i-1]["close"]:
                    obv -= df.iloc[i]["volume"]
                df.iloc[i, df.columns.get_loc("obv")] = obv
            
            # OBV 추세
            if len(df) >= 20:
                recent_obv = df.tail(20)["obv"]
                obv_slope = (recent_obv.iloc[-1] - recent_obv.iloc[0]) / abs(recent_obv.iloc[0]) * 100 if recent_obv.iloc[0] != 0 else 0
                
                if obv_slope > 5:
                    obv_trend = "up"
                    money_flow = "inflow"
                elif obv_slope < -5:
                    obv_trend = "down"
                    money_flow = "outflow"
                else:
                    obv_trend = "neutral"
                    money_flow = "neutral"
            else:
                obv_slope = 0
                obv_trend = "neutral"
                money_flow = "neutral"
            
            # 거래량 돌파 (7일 평균 대비 200% 이상)
            if len(df) >= 7:
                recent_volume = df.tail(7)["volume"]
                avg_volume = recent_volume.mean()
                current_volume = df.iloc[-1]["volume"]
                volume_breakout = current_volume > (avg_volume * 2)
            else:
                volume_breakout = False
            
            return {
                "obv_trend": obv_trend,
                "obv_slope": round(obv_slope, 2),
                "volume_breakout": volume_breakout,
                "money_flow": money_flow
            }
        except Exception as e:
            print(f"[ERROR] OBV 분석 오류 ({symbol}): {e}")
            return {
                "obv_trend": "neutral",
                "obv_slope": 0,
                "volume_breakout": False,
                "money_flow": "neutral"
            }
    
    @staticmethod
    def calculate_comprehensive_opinion(symbol: str) -> Dict:
        """종합 투자 의견 생성 (점수 기반)
        
        Returns:
            Dict: {
                "total_score": int,  # -10 ~ +10
                "recommendation": str,  # "Strong Buy", "Buy", "Hold", "Sell", "Strong Sell"
                "confidence": float,  # 0-1
                "reasons": {
                    "positive": List[str],
                    "negative": List[str],
                    "neutral": List[str]
                },
                "buy_timing": str,  # "excellent", "good", "fair", "poor", "avoid"
                "risk_level": str,  # "low", "medium", "high"
                "summary": str
            }
        """
        try:
            symbol = symbol.upper()
            score = 0
            reasons = {"positive": [], "negative": [], "neutral": []}
            
            # 1. RSI 분석
            rsi_data = IndicatorService.get_rsi(symbol)
            if rsi_data and len(rsi_data) > 0:
                latest_rsi = rsi_data[-1].get("rsi", 50)
                if latest_rsi < 30:
                    score += 3
                    reasons["positive"].append(f"RSI 과매도 구간 ({latest_rsi:.1f}) - 강한 매수 신호")
                elif latest_rsi < 40:
                    score += 1
                    reasons["positive"].append(f"RSI 낮음 ({latest_rsi:.1f}) - 매수 후보")
                elif latest_rsi > 70:
                    score -= 3
                    reasons["negative"].append(f"RSI 과매수 구간 ({latest_rsi:.1f}) - 매도 고려")
                elif latest_rsi > 60:
                    score -= 1
                    reasons["negative"].append(f"RSI 높음 ({latest_rsi:.1f}) - 주의")
            
            # 2. 추세 분석
            trend_data = AdvancedAnalysisService.analyze_trend(symbol)
            overall_trend = trend_data.get("overall_trend", "unknown")
            long_term = trend_data.get("long_term", {})
            short_term = trend_data.get("short_term", {})
            
            if overall_trend == "strong_uptrend":
                score += 2
                reasons["positive"].append("강한 상승 추세 - 매수 유리")
            elif overall_trend == "uptrend":
                score += 1
                reasons["positive"].append("상승 추세 - 매수 고려")
            elif overall_trend == "strong_downtrend":
                score -= 2
                reasons["negative"].append("강한 하락 추세 - 매도/관망")
            elif overall_trend == "downtrend":
                score -= 1
                reasons["negative"].append("하락 추세 - 주의")
            
            # 3. 골든/데드크로스
            cross_data = AdvancedAnalysisService.detect_crosses_extended(symbol)
            ma50_ma200 = cross_data.get("ma50_ma200", {})
            ma20_ma60 = cross_data.get("ma20_ma60", {})
            
            if ma50_ma200.get("golden_cross") or ma20_ma60.get("golden_cross"):
                score += 2
                reasons["positive"].append("골든크로스 발생 - 상승 모멘텀")
            if ma50_ma200.get("death_cross") or ma20_ma60.get("death_cross"):
                score -= 2
                reasons["negative"].append("데드크로스 발생 - 하락 모멘텀")
            
            # 4. MACD
            macd_data = IndicatorService.get_macd(symbol)
            if macd_data and len(macd_data) >= 2:
                latest = macd_data[-1]
                prev = macd_data[-2]
                macd = latest.get("macd", 0)
                signal = latest.get("signal", 0)
                histogram = latest.get("histogram", 0)
                prev_histogram = prev.get("histogram", 0)
                
                if macd > signal and histogram > prev_histogram:
                    score += 1
                    reasons["positive"].append("MACD 골든크로스 + 모멘텀 강화")
                elif macd < signal and histogram < prev_histogram:
                    score -= 1
                    reasons["negative"].append("MACD 데드크로스 + 모멘텀 약화")
            
            # 5. 캔들 패턴
            candle_patterns = AdvancedAnalysisService.detect_candlestick_patterns(symbol)
            recent_patterns = candle_patterns.get("recent_patterns", [])
            bullish_count = candle_patterns.get("bullish_count", 0)
            bearish_count = candle_patterns.get("bearish_count", 0)
            
            if bullish_count > bearish_count * 2:
                score += 1
                reasons["positive"].append(f"캔들 패턴: 상승 신호 우세 ({bullish_count}개)")
            elif bearish_count > bullish_count * 2:
                score -= 1
                reasons["negative"].append(f"캔들 패턴: 하락 신호 우세 ({bearish_count}개)")
            
            # 6. 변동성 타이밍
            vol_timing = AdvancedAnalysisService.analyze_volatility_timing(symbol)
            if vol_timing.get("low_volatility_zone"):
                score += 1
                reasons["positive"].append("저변동성 구간 - 매수 타이밍 유리")
            elif vol_timing.get("atr_spike"):
                score -= 1
                reasons["negative"].append("변동성 급증 - 주의 필요")
            
            # 7. 위험도
            risk_data = IndicatorService.get_risk_score(symbol)
            if risk_data:
                risk_score = risk_data.get("risk_score", 50)
                if risk_score >= 70:
                    score -= 1
                    reasons["negative"].append(f"고위험 구간 (Risk Score: {risk_score:.0f})")
                elif risk_score <= 30:
                    score += 1
                    reasons["positive"].append(f"저위험 구간 (Risk Score: {risk_score:.0f})")
            
            # 8. OBV
            obv_data = AdvancedAnalysisService.analyze_obv(symbol)
            if obv_data.get("money_flow") == "inflow":
                score += 1
                reasons["positive"].append("자금 유입 (OBV 상승)")
            elif obv_data.get("money_flow") == "outflow":
                score -= 1
                reasons["negative"].append("자금 유출 (OBV 하락)")
            
            # 9. FGI
            fgi_data = FGIService.get_current_fgi()
            if fgi_data.get("success"):
                fgi_score = fgi_data.get("score", 50)
                if fgi_score < 20:
                    score += 1
                    reasons["positive"].append(f"FGI 극공포 ({fgi_score}) - 반등 기회")
                elif fgi_score > 80:
                    score -= 1
                    reasons["negative"].append(f"FGI 극탐욕 ({fgi_score}) - 과열 주의")
            
            # 10. MA200 위치
            ma_data = IndicatorService.get_moving_average(symbol, days=200)
            if ma_data and len(ma_data) > 0:
                current_price = ma_data[-1].get("price", 0)
                ma200 = ma_data[-1].get("ma200", 0)
                if current_price > ma200:
                    score += 1
                    reasons["positive"].append("가격이 MA200 위 - 상승 추세")
                elif current_price < ma200 * 0.95:  # 5% 이상 하회
                    score -= 1
                    reasons["negative"].append("가격이 MA200 하회 - 하락 추세")
            
            # 점수 기반 추천
            if score >= 5:
                recommendation = "Strong Buy"
                buy_timing = "excellent"
            elif score >= 2:
                recommendation = "Buy"
                buy_timing = "good"
            elif score >= -1:
                recommendation = "Hold"
                buy_timing = "fair"
            elif score >= -4:
                recommendation = "Sell"
                buy_timing = "poor"
            else:
                recommendation = "Strong Sell"
                buy_timing = "avoid"
            
            # 신뢰도 계산
            total_factors = len(reasons["positive"]) + len(reasons["negative"]) + len(reasons["neutral"])
            confidence = min(1.0, total_factors / 10.0)
            
            # 위험도
            risk_score_val = risk_data.get("risk_score", 50) if risk_data else 50
            if risk_score_val <= 30:
                risk_level = "low"
            elif risk_score_val <= 70:
                risk_level = "medium"
            else:
                risk_level = "high"
            
            # 요약 생성
            summary_parts = []
            if recommendation in ["Strong Buy", "Buy"]:
                summary_parts.append("매수 기회로 판단됩니다.")
            elif recommendation in ["Sell", "Strong Sell"]:
                summary_parts.append("매도/관망을 권장합니다.")
            else:
                summary_parts.append("현재 포지션 유지를 권장합니다.")
            
            if long_term.get("trend") in ["strong_uptrend", "uptrend"]:
                summary_parts.append("상승 추세가 지속되고 있습니다.")
            elif long_term.get("trend") in ["strong_downtrend", "downtrend"]:
                summary_parts.append("하락 추세가 지속되고 있습니다.")
            
            summary = " ".join(summary_parts) if summary_parts else "종합 분석 결과입니다."
            
            return {
                "total_score": score,
                "recommendation": recommendation,
                "confidence": round(confidence, 2),
                "reasons": reasons,
                "buy_timing": buy_timing,
                "risk_level": risk_level,
                "summary": summary
            }
        except Exception as e:
            print(f"[ERROR] 종합 의견 생성 오류 ({symbol}): {e}")
            import traceback
            traceback.print_exc()
            return {
                "total_score": 0,
                "recommendation": "Hold",
                "confidence": 0.0,
                "reasons": {"positive": [], "negative": [], "neutral": []},
                "buy_timing": "fair",
                "risk_level": "medium",
                "summary": "분석 중 오류가 발생했습니다."
            }

