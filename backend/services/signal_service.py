"""
스위칭 시그널 서비스 (무료 API 기반)
"""
from typing import Dict, Optional
from services.yahoo_service import YahooService
from services.indicator_service import IndicatorService
from services.fgi_service import FGIService
from models.schemas import SignalResponse, MarketStatusResponse


class SignalService:
    """스위칭 시그널 서비스 (무료 API 기반)"""
    
    @staticmethod
    def determine_market_status(symbol: str = "VIG") -> MarketStatusResponse:
        """시장 상태 판단 (무료 API 기반)
        
        Args:
            symbol: 분석할 심볼 (기본값: VIG)
        
        Returns:
            MarketStatusResponse: 시장 상태
        """
        try:
            # RSI 데이터 가져오기
            rsi_data = IndicatorService.get_rsi(symbol)
            if not rsi_data or len(rsi_data) == 0:
                return MarketStatusResponse(
                    status="중립",
                    description="데이터 부족"
                )
            
            latest_rsi = rsi_data[-1]["rsi"]
            
            # MA 데이터 가져오기
            ma_data = IndicatorService.get_moving_average(symbol, days=200)
            if not ma_data or len(ma_data) == 0:
                return MarketStatusResponse(
                    status="중립",
                    description="데이터 부족"
                )
            
            current_price = ma_data[-1]["price"]
            ma200 = ma_data[-1]["ma200"]
            
            # FGI 가져오기
            fgi = FGIService.get_current_fgi()
            fgi_score = fgi.get("score", 50) if fgi.get("success") else 50
            
            # 강한 과매도: RSI < 30 + 종가 < 200MA + FGI < 40
            if latest_rsi < 30 and current_price < ma200 and fgi_score < 40:
                return MarketStatusResponse(
                    status="과매도",
                    description="강한 매수 신호"
                )
            
            # 강한 과매수: RSI > 70 + 종가 > 200MA + FGI > 60
            if latest_rsi > 70 and current_price > ma200 and fgi_score > 60:
                return MarketStatusResponse(
                    status="과매수",
                    description="매도 고려"
                )
            
            return MarketStatusResponse(
                status="중립",
                description="현재 상태 유지"
            )
        except Exception as e:
            print(f"[ERROR] 시장 상태 판단 실패: {e}")
            import traceback
            traceback.print_exc()
            return MarketStatusResponse(
                status="중립",
                description="데이터 분석 실패"
            )
    
    @staticmethod
    def generate_signal(current_etf: str) -> SignalResponse:
        """스위칭 시그널 생성 (무료 API 기반)
        
        Args:
            current_etf: 현재 보유 ETF ("VIG" 또는 "QLD")
        
        Returns:
            SignalResponse: 스위칭 시그널
        """
        try:
            current_etf = current_etf.upper()
            if current_etf not in ["VIG", "QLD"]:
                return SignalResponse(
                    action="유지",
                    current_etf=current_etf,
                    target_etf=None,
                    reason="유효하지 않은 심볼",
                    confidence=0.0
                )
            
            # 데이터 수집
            vig_rsi_data = IndicatorService.get_rsi("VIG")
            qld_rsi_data = IndicatorService.get_rsi("QLD")
            vig_ma_data = IndicatorService.get_moving_average("VIG", days=200)
            qld_ma_data = IndicatorService.get_moving_average("QLD", days=200)
            fgi = FGIService.get_current_fgi()
            
            # 데이터 검증
            if not vig_rsi_data or not qld_rsi_data or not vig_ma_data or not qld_ma_data:
                return SignalResponse(
                    action="유지",
                    current_etf=current_etf,
                    target_etf=None,
                    reason="데이터 부족으로 분석 불가",
                    confidence=0.0
                )
            
            # 최신 값 추출
            vig_rsi = vig_rsi_data[-1]["rsi"]
            qld_rsi = qld_rsi_data[-1]["rsi"]
            vig_price = vig_ma_data[-1]["price"]
            vig_ma200 = vig_ma_data[-1]["ma200"]
            qld_price = qld_ma_data[-1]["price"]
            qld_ma200 = qld_ma_data[-1]["ma200"]
            
            fgi_score = fgi.get("score", 50) if fgi.get("success") else 50
            
            # 시장 상태 판단
            market_status = SignalService.determine_market_status("VIG")
            
            reasons = []
            confidence = 0.5
            
            # FGI 기반 스위칭 로직
            # FGI 0~40 (공포·극공포): QLD 매수 신호 강화
            # FGI 60~100 (탐욕·극탐욕): VIG 매수 신호 강화, QLD 비중 축소
            # FGI 40~60 (중립): 기술지표 기반 판단
            
            if fgi_score < 40:  # 공포 구간
                if current_etf == "QLD":
                    # QLD 유지 또는 추가 매수 신호
                    return SignalResponse(
                        action="유지" if qld_rsi < 70 else "추가 매수",
                        current_etf=current_etf,
                        target_etf="QLD",
                        reason=f"공포 구간(FGI: {fgi_score}) - QLD 매수 신호 강화. {market_status.description}",
                        confidence=min(0.85 + (40 - fgi_score) / 200, 0.95)
                    )
                elif current_etf == "VIG":
                    # QLD로 스위칭 고려
                    if qld_rsi > 50 and qld_price > qld_ma200:
                        return SignalResponse(
                            action="스위칭",
                            current_etf=current_etf,
                            target_etf="QLD",
                            reason=f"공포 구간(FGI: {fgi_score})에서 QLD 매수 신호. QLD 기술지표 양호.",
                            confidence=0.8 + (40 - fgi_score) / 200
                        )
            
            if fgi_score > 60:  # 탐욕 구간
                if current_etf == "VIG":
                    # VIG 유지 강화
                    return SignalResponse(
                        action="유지",
                        current_etf=current_etf,
                        target_etf=None,
                        reason=f"탐욕 구간(FGI: {fgi_score}) - VIG 유지 권장, QLD 비중 축소.",
                        confidence=0.85 + (fgi_score - 60) / 200
                    )
                elif current_etf == "QLD":
                    # VIG로 스위칭 고려
                    if vig_rsi > 45 and vig_price > vig_ma200:
                        return SignalResponse(
                            action="스위칭",
                            current_etf=current_etf,
                            target_etf="VIG",
                            reason=f"탐욕 구간(FGI: {fgi_score})에서 방어적 전환. VIG 비중 확대 권장.",
                            confidence=0.75 + (fgi_score - 60) / 200
                        )
            
            # 중립 구간 (40~60): 기술지표 기반 판단
            # 모멘텀 강화 + 추세 전환 → QLD 스위칭
            if 40 <= fgi_score <= 60 and qld_rsi > 50 and qld_price > qld_ma200:
                if current_etf == "VIG":
                    reasons.append("QLD 모멘텀 강화")
                    reasons.append("QLD가 200MA 상회")
                    confidence += 0.3
                    
                    if qld_rsi > 60:
                        return SignalResponse(
                            action="스위칭",
                            current_etf=current_etf,
                            target_etf="QLD",
                            reason="; ".join(reasons) if reasons else "모멘텀 강화 신호",
                            confidence=min(confidence, 0.9)
                        )
            
            # VIG 유지 조건
            if vig_price > vig_ma200 and vig_rsi > 45:
                if current_etf == "VIG":
                    return SignalResponse(
                        action="유지",
                        current_etf=current_etf,
                        target_etf=None,
                        reason="VIG 추세 안정적",
                        confidence=0.7
                    )
            
            # 기본: 유지
            return SignalResponse(
                action="유지",
                current_etf=current_etf,
                target_etf=None,
                reason="현재 포지션 유지 권장",
                confidence=0.6
            )
            
        except Exception as e:
            print(f"[ERROR] 시그널 생성 실패: {e}")
            import traceback
            traceback.print_exc()
            return SignalResponse(
                action="유지",
                current_etf=current_etf,
                target_etf=None,
                reason=f"시그널 생성 실패: {str(e)}",
                confidence=0.0
            )
