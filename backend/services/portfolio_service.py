"""
포트폴리오 비중 추천 서비스 (AI 기반)
"""
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from services.etf_service import ETFService
from services.indicator_service import IndicatorService
from services.sentiment_service import SentimentService
from services.market_data_service import MarketDataService
from typing import Dict
from datetime import datetime


class PortfolioService:
    @staticmethod
    def calculate_ai_allocation(db: Session) -> Dict:
        """AI 기반 포트폴리오 비중 추천"""
        try:
            # 데이터 수집
            vig_price_data = IndicatorService.get_price_with_ma(db, "VIG")
            qld_price_data = IndicatorService.get_price_with_ma(db, "QLD")
            vig_rsi = IndicatorService.get_latest_rsi(db, "VIG")
            qld_rsi = IndicatorService.get_latest_rsi(db, "QLD")
            fgi_data = SentimentService.get_latest_fgi(db)
            
            # 시장 데이터
            vix_data = MarketDataService.get_latest_market_data(db, "VIX")
            dxy_data = MarketDataService.get_latest_market_data(db, "DXY")
            tnx_data = MarketDataService.get_latest_market_data(db, "TNX")
            
            if not vig_price_data or not qld_price_data:
                return {
                    "vig_allocation": 50.0,
                    "qld_allocation": 50.0,
                    "confidence": 0.0,
                    "reasons": ["데이터 부족"]
                }
            
            # 초기 점수
            vig_score = 50.0
            qld_score = 50.0
            
            reasons = []
            
            # 1. RSI 기반 점수 (0-20점)
            if vig_rsi < 30:
                vig_score += 10  # 과매도 → 매수 기회
                reasons.append("VIG RSI 과매도 구간")
            elif vig_rsi > 70:
                vig_score -= 10
            
            if qld_rsi < 30:
                qld_score += 10
                reasons.append("QLD RSI 과매도 구간")
            elif qld_rsi > 70:
                qld_score -= 10
            
            # 2. 이동평균선 기반 (0-20점)
            vig_current = vig_price_data[-1]["price"]
            vig_ma200 = vig_price_data[-1]["ma200"]
            qld_current = qld_price_data[-1]["price"]
            qld_ma200 = qld_price_data[-1]["ma200"]
            
            if vig_current > vig_ma200:
                vig_score += 10
                reasons.append("VIG가 200MA 상회")
            else:
                vig_score -= 10
            
            if qld_current > qld_ma200:
                qld_score += 10
                reasons.append("QLD가 200MA 상회")
            else:
                qld_score -= 10
            
            # 3. Fear & Greed Index 기반 (FGI 로직 개선)
            fgi = fgi_data["value"] if fgi_data else 50
            fgi_change = fgi_data.get("change", 0) if fgi_data else 0
            
            if 0 <= fgi <= 40:  # 공포·극공포 구간: QLD 매수 신호 강화
                qld_score += 20  # QLD 점수 증가
                vig_score -= 10  # VIG 점수 감소
                if fgi <= 25:
                    reasons.append(f"극공포 구간 (FGI: {fgi}) - QLD 매수 신호 매우 강함")
                    qld_score += 10
                else:
                    reasons.append(f"공포 구간 (FGI: {fgi}) - QLD 매수 신호 강화")
                
                # 공포 구간 반등 시작 시 신뢰도 추가
                if fgi_change > 0:
                    qld_score += 5
                    reasons.append(f"공포 구간 반등 시작 (전일 대비 +{abs(fgi_change)})")
            elif 60 <= fgi <= 100:  # 탐욕·극탐욕 구간: VIG 유지/매수, QLD 비중 축소
                vig_score += 20  # VIG 점수 증가
                qld_score -= 15  # QLD 점수 감소
                if fgi >= 75:
                    reasons.append(f"극탐욕 구간 (FGI: {fgi}) - VIG 유지/매수 강력 권장, QLD 비중 축소")
                    vig_score += 10
                else:
                    reasons.append(f"탐욕 구간 (FGI: {fgi}) - VIG 비중 확대, QLD 비중 축소")
                
                # 탐욕 구간 약화 시 신뢰도 추가
                if fgi_change < 0:
                    vig_score += 5
                    reasons.append(f"탐욕 구간 약화 (전일 대비 {fgi_change}) - VIG 유지 신뢰도 상승")
            else:  # 중립 구간 (40~60): 기술지표 기반 판단
                reasons.append(f"중립 구간 (FGI: {fgi}) - 기술지표(RSI/MA200) 기반 판단")
            
            # 4. VIX (변동성) 기반 (0-15점)
            vix = vix_data["value"] if vix_data else 20
            if vix > 30:  # 높은 변동성
                vig_score += 12
                qld_score -= 12
                reasons.append("VIX 높음 - 변동성 커 방어적 자산 선호")
            elif vix < 15:  # 낮은 변동성
                qld_score += 12
                vig_score -= 12
                reasons.append("VIX 낮음 - 변동성 낮아 공격적 자산 선호")
            
            # 6. 뉴스 감성 기반 (0-15점) - 뉴스 서비스는 함수 기반으로 변경되어 기본값 사용
            # 뉴스 감성 분석은 별도 API를 통해 처리되므로 여기서는 기본값 사용
            news_sentiment = 50.0  # 기본값
            news_risk_keywords = []
            
            # 5. 금리 기반 (0-15점)
            tnx = tnx_data["value"] if tnx_data else 4.0
            if tnx > 5.0:  # 높은 금리
                vig_score += 10
                qld_score -= 10
                reasons.append("금리 상승 - 방어적 자산 선호")
            elif tnx < 3.0:  # 낮은 금리
                qld_score += 10
                vig_score -= 10
                reasons.append("금리 하락 - 공격적 자산 선호")
            
            # 7. 달러 인덱스 기반 (0-10점)
            dxy = dxy_data["value"] if dxy_data else 100
            if dxy > 105:  # 강한 달러
                vig_score += 5
                reasons.append("달러 강세")
            
            # 점수 정규화 (0-100)
            vig_score = max(0, min(100, vig_score))
            qld_score = max(0, min(100, qld_score))
            
            # 비중 계산
            total_score = vig_score + qld_score
            if total_score == 0:
                vig_allocation = 50.0
                qld_allocation = 50.0
            else:
                vig_allocation = (vig_score / total_score) * 100
                qld_allocation = (qld_score / total_score) * 100
            
            # 신뢰도 계산 (데이터가 많을수록 높음)
            confidence = 0.5
            if fgi_data:
                confidence += 0.1
            if vix_data:
                confidence += 0.1
            if tnx_data:
                confidence += 0.1
            if dxy_data:
                confidence += 0.1
            if len(vig_price_data) > 200 and len(qld_price_data) > 200:
                confidence += 0.1
            
            confidence = min(0.95, confidence)
            
            return {
                "vig_allocation": round(vig_allocation, 1),
                "qld_allocation": round(qld_allocation, 1),
                "confidence": round(confidence, 2),
                "reasons": reasons if reasons else ["기본 비중 유지"],
                "scores": {
                    "vig_score": round(vig_score, 1),
                    "qld_score": round(qld_score, 1)
                },
                "market_data": {
                    "vix": round(vix, 2) if vix_data else None,
                    "dxy": round(dxy, 2) if dxy_data else None,
                    "tnx": round(tnx, 2) if tnx_data else None,
                    "fgi": fgi if fgi_data else None
                }
            }
        except Exception as e:
            print(f"포트폴리오 비중 계산 오류: {e}")
            return {
                "vig_allocation": 50.0,
                "qld_allocation": 50.0,
                "confidence": 0.0,
                "reasons": [f"계산 오류: {str(e)}"]
            }

