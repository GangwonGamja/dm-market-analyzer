"""
종합 분석 라우터 (모든 심볼 지원)
"""
from fastapi import APIRouter, HTTPException, Query
from services.yahoo_service import YahooService
from services.indicator_service import IndicatorService
from services.fgi_service import FGIService
from services.news_service import NewsService
from services.recommendation_service import RecommendationService
from services.advanced_indicators_service import AdvancedIndicatorsService
from services.fundamental_service import FundamentalService
from services.advanced_analysis_service import AdvancedAnalysisService
from typing import Dict, Any, List
import traceback

router = APIRouter(prefix="/analysis", tags=["analysis"])


@router.get("/{symbol}")
def get_comprehensive_analysis(symbol: str) -> Dict[str, Any]:
    """종합 분석 API (확장된 구조)
    
    Args:
        symbol: 분석할 심볼 (예: AAPL, VIG, QLD 등)
    
    Returns:
        Dict: {
            "ticker": str,
            "ma": {"20": [...], "50": [...], "200": [...]},
            "cross": {"ma50_ma200": "golden"|"death"|"none", "ma20_ma60": "golden"|"death"|"none"},
            "trend": {"short": "up"|"down", "long": "up"|"down", "strength_short": 0-100, "strength_long": 0-100},
            "rsi": {"value": float, "zone": "overbought"|"oversold"|"neutral"},
            "macd": {"signal": "golden"|"death"|"neutral"},
            "volatility": {"atr": float, "risk_score": 0-100},
            "candles": List[str],
            "patterns": List[str],
            "summary": List[str]
        }
    """
    try:
        symbol = symbol.upper()  # 대문자 변환
        summary_reasons = []  # 매수/매도 신호 근거 리스트
        
        # 결과 구조 초기화
        result: Dict[str, Any] = {
            "ticker": symbol,
            "ma": {"20": [], "50": [], "200": []},
            "cross": {"ma50_ma200": "none", "ma20_ma60": "none"},
            "trend": {
                "short": "neutral",
                "long": "neutral",
                "strength_short": 0,
                "strength_long": 0
            },
            "rsi": {"value": 50, "zone": "neutral"},
            "macd": {"signal": "neutral"},
            "volatility": {"atr": 0, "risk_score": 50},
            "candles": [],
            "patterns": [],
            "summary": []
        }
        
        # 1. 이동평균선 데이터 (MA20, MA50, MA200)
        try:
            ma20_data = IndicatorService.get_moving_average(symbol, days=20)
            if ma20_data and len(ma20_data) > 0:
                result["ma"]["20"] = ma20_data[-30:] if len(ma20_data) > 30 else ma20_data  # 최근 30개
            else:
                result["ma"]["20"] = []
        except Exception as e:
            print(f"[WARNING] {symbol} MA20 데이터 수집 실패: {e}")
            result["ma"]["20"] = []
        
        try:
            ma50_data = IndicatorService.get_moving_average(symbol, days=50)
            if ma50_data and len(ma50_data) > 0:
                result["ma"]["50"] = ma50_data[-30:] if len(ma50_data) > 30 else ma50_data  # 최근 30개
            else:
                result["ma"]["50"] = []
        except Exception as e:
            print(f"[WARNING] {symbol} MA50 데이터 수집 실패: {e}")
            result["ma"]["50"] = []
        
        try:
            ma200_data = IndicatorService.get_moving_average(symbol, days=200)
            if ma200_data and len(ma200_data) > 0:
                result["ma"]["200"] = ma200_data[-30:] if len(ma200_data) > 30 else ma200_data  # 최근 30개
            else:
                result["ma"]["200"] = []
        except Exception as e:
            print(f"[WARNING] {symbol} MA200 데이터 수집 실패: {e}")
            result["ma"]["200"] = []
        
        # 2. 골든/데드 크로스 판단
        try:
            cross_data = AdvancedAnalysisService.detect_crosses_extended(symbol)
            ma50_ma200 = cross_data.get("ma50_ma200", {})
            ma20_ma60 = cross_data.get("ma20_ma60", {})
            
            # MA50 vs MA200
            if ma50_ma200.get("golden_cross"):
                result["cross"]["ma50_ma200"] = "golden"
                summary_reasons.append("MA50이 MA200을 상향 돌파 (골든크로스)")
            elif ma50_ma200.get("death_cross"):
                result["cross"]["ma50_ma200"] = "death"
                summary_reasons.append("MA50이 MA200을 하향 돌파 (데드크로스)")
            else:
                result["cross"]["ma50_ma200"] = "none"
            
            # MA20 vs MA60
            if ma20_ma60.get("golden_cross"):
                result["cross"]["ma20_ma60"] = "golden"
                summary_reasons.append("MA20이 MA60을 상향 돌파 (골든크로스)")
            elif ma20_ma60.get("death_cross"):
                result["cross"]["ma20_ma60"] = "death"
                summary_reasons.append("MA20이 MA60을 하향 돌파 (데드크로스)")
            else:
                result["cross"]["ma20_ma60"] = "none"
        except Exception as e:
            print(f"[WARNING] {symbol} 크로스 탐지 실패: {e}")
        
        # 3. 추세 분석
        try:
            trend_analysis = AdvancedAnalysisService.analyze_trend(symbol)
            short_term = trend_analysis.get("short_term", {})
            long_term = trend_analysis.get("long_term", {})
            
            # 단기 추세
            short_trend_str = short_term.get("trend", "unknown")
            if "uptrend" in short_trend_str:
                result["trend"]["short"] = "up"
                summary_reasons.append("단기 상승 추세")
            elif "downtrend" in short_trend_str:
                result["trend"]["short"] = "down"
                summary_reasons.append("단기 하락 추세")
            else:
                result["trend"]["short"] = "neutral"
            
            result["trend"]["strength_short"] = int(short_term.get("strength", 0))
            
            # 장기 추세
            long_trend_str = long_term.get("trend", "unknown")
            if "uptrend" in long_trend_str:
                result["trend"]["long"] = "up"
                price_vs_ma200 = long_term.get("price_vs_ma200", 0)
                if price_vs_ma200 > 0:
                    summary_reasons.append(f"MA200 위에 있어 상승 추세 유지 (+{price_vs_ma200:.2f}%)")
                else:
                    summary_reasons.append("장기 상승 추세")
            elif "downtrend" in long_trend_str:
                result["trend"]["long"] = "down"
                price_vs_ma200 = long_term.get("price_vs_ma200", 0)
                if price_vs_ma200 < 0:
                    summary_reasons.append(f"MA200 아래로 하락 추세 ({price_vs_ma200:.2f}%)")
                else:
                    summary_reasons.append("장기 하락 추세")
            else:
                result["trend"]["long"] = "neutral"
            
            result["trend"]["strength_long"] = int(long_term.get("strength", 0))
        except Exception as e:
            print(f"[WARNING] {symbol} 추세 분석 실패: {e}")
        
        # 4. RSI 분석
        try:
            rsi_data = IndicatorService.get_rsi(symbol)
            if rsi_data and len(rsi_data) > 0:
                latest_rsi = rsi_data[-1].get("rsi", 50)
                result["rsi"]["value"] = round(latest_rsi, 2)
                
                if latest_rsi < 30:
                    result["rsi"]["zone"] = "oversold"
                    summary_reasons.append(f"RSI 과매도 구간 ({latest_rsi:.1f})")
                elif latest_rsi > 70:
                    result["rsi"]["zone"] = "overbought"
                    summary_reasons.append(f"RSI 과매수 구간 ({latest_rsi:.1f})")
                else:
                    result["rsi"]["zone"] = "neutral"
            else:
                result["rsi"]["value"] = 50
                result["rsi"]["zone"] = "neutral"
        except Exception as e:
            print(f"[WARNING] {symbol} RSI 분석 실패: {e}")
        
        # 5. MACD 분석
        try:
            macd_data = IndicatorService.get_macd(symbol)
            if macd_data and len(macd_data) >= 2:
                latest = macd_data[-1]
                prev = macd_data[-2]
                macd = latest.get("macd", 0)
                signal = latest.get("signal", 0)
                prev_macd = prev.get("macd", 0)
                prev_signal = prev.get("signal", 0)
                
                # 골든크로스: MACD가 시그널을 상향 돌파
                if prev_macd <= prev_signal and macd > signal:
                    result["macd"]["signal"] = "golden"
                    summary_reasons.append("MACD 골든크로스 발생")
                # 데드크로스: MACD가 시그널을 하향 돌파
                elif prev_macd >= prev_signal and macd < signal:
                    result["macd"]["signal"] = "death"
                    summary_reasons.append("MACD 데드크로스 발생")
                else:
                    result["macd"]["signal"] = "neutral"
            else:
                result["macd"]["signal"] = "neutral"
        except Exception as e:
            print(f"[WARNING] {symbol} MACD 분석 실패: {e}")
        
        # 6. 변동성 (ATR) 및 위험 점수
        try:
            risk_data = IndicatorService.get_risk_score(symbol)
            if risk_data:
                risk_score = risk_data.get("risk_score", 50)
                atr = risk_data.get("atr", 0)
                
                result["volatility"]["atr"] = round(atr, 2) if atr else 0
                result["volatility"]["risk_score"] = int(risk_score)
                
                if risk_score >= 70:
                    summary_reasons.append(f"높은 변동성 (Risk Score: {risk_score:.0f})")
                elif risk_score <= 30:
                    summary_reasons.append(f"낮은 변동성 (Risk Score: {risk_score:.0f})")
            else:
                # ATR 직접 계산 시도
                vol_timing = AdvancedAnalysisService.analyze_volatility_timing(symbol)
                result["volatility"]["atr"] = round(vol_timing.get("atr_value", 0), 2)
                result["volatility"]["risk_score"] = 50
        except Exception as e:
            print(f"[WARNING] {symbol} 변동성 분석 실패: {e}")
        
        # 7. 캔들 패턴 탐지
        try:
            candle_patterns = AdvancedAnalysisService.detect_candlestick_patterns(symbol)
            recent_patterns = candle_patterns.get("recent_patterns", [])
            
            candle_list = []
            for pattern in recent_patterns[-5:]:  # 최근 5개만
                pattern_name = pattern.get("pattern", "").lower()
                if "hammer" in pattern_name:
                    candle_list.append("hammer")
                elif "doji" in pattern_name:
                    candle_list.append("doji")
                elif "bullish engulfing" in pattern_name:
                    candle_list.append("engulfing_bull")
                elif "bearish engulfing" in pattern_name:
                    candle_list.append("engulfing_bear")
            
            result["candles"] = list(set(candle_list))  # 중복 제거
            
            # summary에 추가
            if "hammer" in result["candles"]:
                summary_reasons.append("Hammer 캔들 패턴 감지")
            if "doji" in result["candles"]:
                summary_reasons.append("Doji 캔들 패턴 감지")
            if "engulfing_bull" in result["candles"]:
                summary_reasons.append("Bullish Engulfing 패턴 감지")
            if "engulfing_bear" in result["candles"]:
                summary_reasons.append("Bearish Engulfing 패턴 감지")
        except Exception as e:
            print(f"[WARNING] {symbol} 캔들 패턴 탐지 실패: {e}")
        
        # 8. 패턴 분석
        try:
            technical_patterns = AdvancedAnalysisService.detect_technical_patterns(symbol)
            pattern_list = []
            
            # 삼각수렴
            triangle = technical_patterns.get("triangle", {})
            if triangle.get("detected"):
                triangle_type = triangle.get("type", "none")
                if triangle_type != "none":
                    pattern_list.append("triangle")
                    summary_reasons.append(f"삼각수렴 패턴 감지 ({triangle_type})")
            
            # 쐐기
            wedge = technical_patterns.get("wedge", {})
            if wedge.get("detected"):
                wedge_type = wedge.get("type", "none")
                if wedge_type == "rising":
                    pattern_list.append("wedge_up")
                    summary_reasons.append("상승 쐐기 패턴 감지")
                elif wedge_type == "falling":
                    pattern_list.append("wedge_down")
                    summary_reasons.append("하락 쐐기 패턴 감지")
            
            # 박스권
            box_range = technical_patterns.get("box_range", {})
            if box_range.get("detected"):
                pattern_list.append("box_range")
                summary_reasons.append("박스권 패턴 감지")
            
            result["patterns"] = pattern_list
        except Exception as e:
            print(f"[WARNING] {symbol} 패턴 분석 실패: {e}")
        
        # 9. summary (모든 근거 리스트)
        result["summary"] = summary_reasons
        
        return result
        
    except Exception as e:
        error_msg = f"{symbol} 종합 분석 오류: {str(e)}"
        print(f"[ERROR] {error_msg}")
        traceback.print_exc()
        return {
            "ticker": symbol.upper(),
            "ma": {"20": [], "50": [], "200": []},
            "cross": {"ma50_ma200": "none", "ma20_ma60": "none"},
            "trend": {"short": "neutral", "long": "neutral", "strength_short": 0, "strength_long": 0},
            "rsi": {"value": 50, "zone": "neutral"},
            "macd": {"signal": "neutral"},
            "volatility": {"atr": 0, "risk_score": 50},
            "candles": [],
            "patterns": [],
            "summary": [f"분석 중 오류 발생: {str(e)}"]
        }


@router.get("/{symbol}/enhanced")
def get_enhanced_analysis(symbol: str) -> Dict[str, Any]:
    """확장된 종합 분석 API (캔들 패턴, 추세, 패턴 탐지 등 포함)
    
    Args:
        symbol: 분석할 심볼
    
    Returns:
        Dict: 확장된 종합 분석 결과
    """
    try:
        symbol = symbol.upper()
        
        result: Dict[str, Any] = {
            "symbol": symbol,
            "success": True,
            "data": {}
        }
        
        # 기본 분석 데이터
        basic_analysis = get_comprehensive_analysis(symbol)
        if basic_analysis:
            result["data"].update(basic_analysis)
        
        # 1. 캔들 패턴
        try:
            candle_patterns = AdvancedAnalysisService.detect_candlestick_patterns(symbol)
            result["data"]["candlestick_patterns"] = candle_patterns
        except Exception as e:
            print(f"[WARNING] {symbol} 캔들 패턴 분석 실패: {e}")
            result["data"]["candlestick_patterns"] = {"error": str(e)}
        
        # 2. 확장된 크로스 탐지
        try:
            crosses = AdvancedAnalysisService.detect_crosses_extended(symbol)
            result["data"]["crosses"] = crosses
        except Exception as e:
            print(f"[WARNING] {symbol} 크로스 탐지 실패: {e}")
            result["data"]["crosses"] = {"error": str(e)}
        
        # 3. 추세 분석
        try:
            trend_analysis = AdvancedAnalysisService.analyze_trend(symbol)
            result["data"]["trend"] = trend_analysis
        except Exception as e:
            print(f"[WARNING] {symbol} 추세 분석 실패: {e}")
            result["data"]["trend"] = {"error": str(e)}
        
        # 4. 기술적 패턴
        try:
            technical_patterns = AdvancedAnalysisService.detect_technical_patterns(symbol)
            result["data"]["technical_patterns"] = technical_patterns
        except Exception as e:
            print(f"[WARNING] {symbol} 기술적 패턴 탐지 실패: {e}")
            result["data"]["technical_patterns"] = {"error": str(e)}
        
        # 5. 변동성 타이밍
        try:
            vol_timing = AdvancedAnalysisService.analyze_volatility_timing(symbol)
            result["data"]["volatility_timing"] = vol_timing
        except Exception as e:
            print(f"[WARNING] {symbol} 변동성 타이밍 분석 실패: {e}")
            result["data"]["volatility_timing"] = {"error": str(e)}
        
        # 6. OBV 분석
        try:
            obv_analysis = AdvancedAnalysisService.analyze_obv(symbol)
            result["data"]["obv"] = obv_analysis
        except Exception as e:
            print(f"[WARNING] {symbol} OBV 분석 실패: {e}")
            result["data"]["obv"] = {"error": str(e)}
        
        # 7. 종합 의견
        try:
            comprehensive_opinion = AdvancedAnalysisService.calculate_comprehensive_opinion(symbol)
            result["data"]["comprehensive_opinion"] = comprehensive_opinion
        except Exception as e:
            print(f"[WARNING] {symbol} 종합 의견 생성 실패: {e}")
            result["data"]["comprehensive_opinion"] = {"error": str(e)}
        
        # 8. 기존 추천 서비스
        try:
            recommendation = RecommendationService.calculate_opinion_score(symbol)
            result["data"]["recommendation"] = recommendation
        except Exception as e:
            print(f"[WARNING] {symbol} 추천 서비스 실패: {e}")
            result["data"]["recommendation"] = {"error": str(e)}
        
        return result
        
    except Exception as e:
        error_msg = f"{symbol} 확장 분석 오류: {str(e)}"
        print(f"[ERROR] {error_msg}")
        traceback.print_exc()
        return {
            "symbol": symbol.upper(),
            "success": False,
            "error": "확장 분석 실패",
            "message": error_msg,
            "data": {}
        }
