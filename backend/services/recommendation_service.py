"""
투자 의견 시스템 (Opinion Score 기반)
"""
from typing import Dict, Optional, List
from services.indicator_service import IndicatorService
from services.fgi_service import FGIService
from services.news_service import NewsService
from services.yahoo_service import YahooService
from datetime import datetime


class RecommendationService:
    """투자 의견 서비스"""
    
    @staticmethod
    def calculate_opinion_score(symbol: str) -> Dict:
        """Opinion Score 계산 및 투자 의견 생성
        
        Args:
            symbol: 분석할 심볼
        
        Returns:
            Dict: {
                "opinion_score": int,
                "recommendation": str,  # "Strong Buy", "Buy", "Hold", "Sell", "Strong Sell"
                "confidence": float,  # 0-1
                "components": {
                    "trend": int,  # -3 ~ +3
                    "rsi": int,  # -2 ~ +2
                    "macd": int,  # -2 ~ +2
                    "risk": int,  # -2 ~ +2
                    "news": int,  # -2 ~ +2
                    "fgi": int,  # -1 ~ +1
                },
                "reasons": {
                    "positive": List[str],
                    "negative": List[str],
                    "neutral": List[str]
                },
                "strategy": str,
                "target_price": Optional[float],
                "stop_loss": Optional[float],
                "reward_risk_ratio": Optional[float],
            }
        """
        try:
            symbol = symbol.upper()
            components = {
                "trend": 0,
                "rsi": 0,
                "macd": 0,
                "risk": 0,
                "news": 0,
                "fgi": 0,
            }
            reasons = {
                "positive": [],
                "negative": [],
                "neutral": []
            }
            
            # 1. 추세 점수 (-3 ~ +3)
            try:
                ma_data = IndicatorService.get_moving_average(symbol, days=200)
                if ma_data and len(ma_data) >= 2:
                    current_price = ma_data[-1].get("price", 0)
                    ma200 = ma_data[-1].get("ma200", 0)
                    prev_ma200 = ma_data[-2].get("ma200", 0) if len(ma_data) >= 2 else ma200
                    
                    # 가격이 MA200 위에 있고 상승 추세
                    if current_price > ma200 and ma200 > prev_ma200:
                        components["trend"] = 3
                        reasons["positive"].append("강한 상승 추세 (가격 > MA200 상승)")
                    elif current_price > ma200:
                        components["trend"] = 2
                        reasons["positive"].append("상승 추세 (가격 > MA200)")
                    elif current_price < ma200 and ma200 < prev_ma200:
                        components["trend"] = -3
                        reasons["negative"].append("강한 하락 추세 (가격 < MA200 하락)")
                    elif current_price < ma200:
                        components["trend"] = -2
                        reasons["negative"].append("하락 추세 (가격 < MA200)")
                    else:
                        components["trend"] = 0
                        reasons["neutral"].append("중립 추세")
            except:
                components["trend"] = 0
            
            # 2. RSI 점수 (-2 ~ +2)
            try:
                rsi_data = IndicatorService.get_rsi(symbol)
                if rsi_data and len(rsi_data) > 0:
                    latest_rsi = rsi_data[-1].get("rsi", 50)
                    if latest_rsi > 70:
                        components["rsi"] = -2
                        reasons["negative"].append(f"RSI 과매수 ({latest_rsi:.1f})")
                    elif latest_rsi > 60:
                        components["rsi"] = -1
                        reasons["negative"].append(f"RSI 높음 ({latest_rsi:.1f})")
                    elif latest_rsi < 30:
                        components["rsi"] = 2
                        reasons["positive"].append(f"RSI 과매도 ({latest_rsi:.1f})")
                    elif latest_rsi < 40:
                        components["rsi"] = 1
                        reasons["positive"].append(f"RSI 낮음 ({latest_rsi:.1f})")
                    else:
                        components["rsi"] = 0
                        reasons["neutral"].append(f"RSI 중립 ({latest_rsi:.1f})")
            except:
                components["rsi"] = 0
            
            # 3. MACD 점수 (-2 ~ +2)
            try:
                macd_data = IndicatorService.get_macd(symbol)
                if macd_data and len(macd_data) >= 2:
                    latest = macd_data[-1]
                    prev = macd_data[-2]
                    macd = latest.get("macd", 0)
                    signal = latest.get("signal", 0)
                    histogram = latest.get("histogram", 0)
                    prev_histogram = prev.get("histogram", 0)
                    
                    # MACD가 시그널 위에 있고 히스토그램 증가
                    if macd > signal and histogram > prev_histogram:
                        components["macd"] = 2
                        reasons["positive"].append("MACD 강한 상승 모멘텀")
                    elif macd > signal:
                        components["macd"] = 1
                        reasons["positive"].append("MACD 상승 모멘텀")
                    elif macd < signal and histogram < prev_histogram:
                        components["macd"] = -2
                        reasons["negative"].append("MACD 강한 하락 모멘텀")
                    elif macd < signal:
                        components["macd"] = -1
                        reasons["negative"].append("MACD 하락 모멘텀")
                    else:
                        components["macd"] = 0
            except:
                components["macd"] = 0
            
            # 4. Risk Score 점수 (-2 ~ +2)
            try:
                risk_data = IndicatorService.get_risk_score(symbol)
                if risk_data:
                    risk_score = risk_data.get("risk_score", 50)
                    if risk_score >= 70:
                        components["risk"] = -2
                        reasons["negative"].append(f"높은 변동성 (Risk Score: {risk_score:.0f})")
                    elif risk_score >= 50:
                        components["risk"] = -1
                        reasons["negative"].append(f"중간 변동성 (Risk Score: {risk_score:.0f})")
                    elif risk_score <= 30:
                        components["risk"] = 2
                        reasons["positive"].append(f"낮은 변동성 (Risk Score: {risk_score:.0f})")
                    elif risk_score <= 40:
                        components["risk"] = 1
                        reasons["positive"].append(f"낮은-중간 변동성 (Risk Score: {risk_score:.0f})")
                    else:
                        components["risk"] = 0
            except:
                components["risk"] = 0
            
            # 5. 뉴스 감성 점수 (-2 ~ +2)
            try:
                news_result = NewsService.fetch_news(symbol, limit=20)
                articles = news_result.get("articles", [])
                if articles:
                    positive_keywords = ["up", "rise", "gain", "bullish", "positive", "growth", "strong", "surge", "rally"]
                    negative_keywords = ["down", "fall", "drop", "bearish", "negative", "decline", "weak", "crash", "plunge"]
                    
                    positive_count = 0
                    negative_count = 0
                    
                    for article in articles:
                        title = article.get("title", "").lower()
                        summary = article.get("summary", "").lower()
                        text = f"{title} {summary}"
                        
                        pos = sum(1 for kw in positive_keywords if kw in text)
                        neg = sum(1 for kw in negative_keywords if kw in text)
                        
                        if pos > neg:
                            positive_count += 1
                        elif neg > pos:
                            negative_count += 1
                    
                    total = len(articles)
                    positive_ratio = positive_count / total if total > 0 else 0.5
                    negative_ratio = negative_count / total if total > 0 else 0.5
                    
                    if positive_ratio > 0.6:
                        components["news"] = 2
                        reasons["positive"].append(f"뉴스 감성 매우 긍정적 ({positive_count}/{total})")
                    elif positive_ratio > 0.4:
                        components["news"] = 1
                        reasons["positive"].append(f"뉴스 감성 긍정적 ({positive_count}/{total})")
                    elif negative_ratio > 0.6:
                        components["news"] = -2
                        reasons["negative"].append(f"뉴스 감성 매우 부정적 ({negative_count}/{total})")
                    elif negative_ratio > 0.4:
                        components["news"] = -1
                        reasons["negative"].append(f"뉴스 감성 부정적 ({negative_count}/{total})")
                    else:
                        components["news"] = 0
                        reasons["neutral"].append(f"뉴스 감성 중립 ({positive_count}/{negative_count}/{total})")
                else:
                    components["news"] = 0
            except:
                components["news"] = 0
            
            # 6. FGI 점수 (-1 ~ +1)
            try:
                fgi = FGIService.get_current_fgi()
                if fgi.get("success"):
                    fgi_score = fgi.get("score", 50)
                    if fgi_score >= 75:
                        components["fgi"] = 1
                        reasons["positive"].append(f"FGI 극탐욕 ({fgi_score})")
                    elif fgi_score >= 55:
                        components["fgi"] = 0
                        reasons["neutral"].append(f"FGI 탐욕 ({fgi_score})")
                    elif fgi_score <= 25:
                        components["fgi"] = -1
                        reasons["negative"].append(f"FGI 극공포 ({fgi_score})")
                    elif fgi_score <= 45:
                        components["fgi"] = 0
                        reasons["neutral"].append(f"FGI 공포 ({fgi_score})")
                    else:
                        components["fgi"] = 0
            except:
                components["fgi"] = 0
            
            # Opinion Score 계산
            opinion_score = sum(components.values())
            
            # 의견 결정
            if opinion_score >= 5:
                recommendation = "Strong Buy"
            elif opinion_score >= 2:
                recommendation = "Buy"
            elif opinion_score >= -1:
                recommendation = "Hold"
            elif opinion_score >= -4:
                recommendation = "Sell"
            else:
                recommendation = "Strong Sell"
            
            # Confidence 계산 (절대값 기반)
            confidence = min(1.0, abs(opinion_score) / 10.0)
            
            # 전략 추천
            strategy = RecommendationService._get_strategy(opinion_score, components, reasons)
            
            # 목표가 및 손절가 계산
            target_price, stop_loss = RecommendationService._calculate_targets(symbol)
            
            # Reward/Risk Ratio 계산
            reward_risk_ratio = None
            if target_price and stop_loss:
                price_data = YahooService.get_price_data(symbol)
                if price_data:
                    current_price = price_data.get("close", 0)
                    if current_price > 0:
                        reward = target_price - current_price
                        risk = current_price - stop_loss
                        if risk > 0:
                            reward_risk_ratio = reward / risk
            
            return {
                "symbol": symbol,
                "opinion_score": opinion_score,
                "recommendation": recommendation,
                "confidence": confidence,
                "components": components,
                "reasons": reasons,
                "strategy": strategy,
                "target_price": target_price,
                "stop_loss": stop_loss,
                "reward_risk_ratio": reward_risk_ratio,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"[ERROR] {symbol} Opinion Score 계산 실패: {e}")
            import traceback
            traceback.print_exc()
            return {
                "symbol": symbol,
                "opinion_score": 0,
                "recommendation": "Hold",
                "confidence": 0.0,
                "components": {},
                "reasons": {"positive": [], "negative": [], "neutral": []},
                "strategy": "데이터 부족으로 분석 불가",
                "target_price": None,
                "stop_loss": None,
                "reward_risk_ratio": None,
                "error": str(e)
            }
    
    @staticmethod
    def _get_strategy(opinion_score: int, components: Dict, reasons: Dict) -> str:
        """전략 추천"""
        if opinion_score >= 5:
            return "추세추종 전략: 강한 상승 추세이므로 분할 매수 후 추세 추종"
        elif opinion_score >= 2:
            return "추세추종 전략: 상승 추세이므로 분할 매수 권장"
        elif opinion_score <= -5:
            return "손절 중심 전략: 강한 하락 추세이므로 보수적 접근 권장"
        elif opinion_score <= -2:
            return "손절 중심 전략: 하락 추세이므로 손절선 설정 필수"
        elif components.get("rsi", 0) <= -2:
            return "역추세 전략: 과매도 구간이므로 분할 매수 고려"
        elif components.get("risk", 0) <= -2:
            return "수량 조절 전략: 높은 변동성이므로 포지션 크기 축소 권장"
        else:
            return "현재 포지션 유지: 중립적 시장 상황"
    
    @staticmethod
    def _calculate_targets(symbol: str) -> tuple:
        """목표가 및 손절가 계산
        
        Returns:
            tuple: (target_price, stop_loss)
        """
        try:
            # 현재 가격
            price_data = YahooService.get_price_data(symbol)
            if not price_data:
                return (None, None)
            
            current_price = price_data.get("close", 0)
            if current_price <= 0:
                return (None, None)
            
            # 히스토리 데이터
            history = YahooService.get_history(symbol, years=1)
            if history is None or history.empty:
                return (None, None)
            
            # ATR 계산 (손절가용)
            atr = IndicatorService.get_atr(symbol, period=14, period_years=1)
            if atr:
                stop_loss = current_price - (atr * 2)
            else:
                # ATR 실패 시 5% 손절
                stop_loss = current_price * 0.95
            
            # 목표가 계산 (MA200 회귀선 기반)
            ma_data = IndicatorService.get_moving_average(symbol, days=200)
            if ma_data and len(ma_data) >= 20:
                # 최근 20일 MA200 추세
                recent_ma = [item.get("ma200", 0) for item in ma_data[-20:]]
                if len(recent_ma) >= 2:
                    ma_trend = (recent_ma[-1] - recent_ma[0]) / len(recent_ma)
                    # 추세 기반 목표가
                    target_price = current_price + (ma_trend * 30)  # 30일 추세 연장
                else:
                    # MA200 위/아래에 따라 목표가 설정
                    ma200 = ma_data[-1].get("ma200", current_price)
                    if current_price > ma200:
                        target_price = current_price * 1.15  # 15% 상승 목표
                    else:
                        target_price = current_price * 1.10  # 10% 상승 목표
            else:
                # 기본 목표가 (10% 상승)
                target_price = current_price * 1.10
            
            return (round(target_price, 2), round(stop_loss, 2))
            
        except Exception as e:
            print(f"[ERROR] {symbol} 목표가/손절가 계산 실패: {e}")
            return (None, None)

