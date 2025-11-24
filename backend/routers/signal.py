"""
시그널 관련 라우터 (무료 API 기반)
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from services.signal_service import SignalService
from models.schemas import (
    SwitchingSignalRequest, 
    SwitchingSignalResponse
)
from pydantic import BaseModel


class SignalRequest(BaseModel):
    """기존 시그널 생성용 요청 모델"""
    current_etf: str  # "VIG" or "QLD"


router = APIRouter(prefix="/signal", tags=["signal"])


@router.post("/generate")
def generate_signal(request: SignalRequest, db: Session = Depends(get_db)):
    """스위칭 시그널 생성 (무료 API 기반)"""
    try:
        current_etf = request.current_etf.upper()
        if current_etf not in ["VIG", "QLD"]:
            raise HTTPException(status_code=400, detail="current_etf는 'VIG' 또는 'QLD'여야 합니다")
        
        signal = SignalService.generate_signal(current_etf)
        return signal
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"시그널 생성 오류: {str(e)}"
        print(f"[ERROR] {error_msg}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=error_msg)


@router.get("/market-status")
def get_market_status(symbol: str = "VIG"):
    """시장 상태 조회 (무료 API 기반)"""
    try:
        status = SignalService.determine_market_status(symbol)
        return status
    except Exception as e:
        error_msg = f"시장 상태 조회 오류: {str(e)}"
        print(f"[ERROR] {error_msg}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=error_msg)


def calculate_individual_opinion(symbol: str, price: float, ma200: float, rsi: float, fgi: int) -> dict:
    """개별 종목/ETF 독립 의견 계산 (스위칭 로직 비활성화)
    
    Args:
        symbol: 심볼
        price: 현재 가격
        ma200: 200일 이동평균
        rsi: RSI 값
        fgi: Fear & Greed Index (0-100)
    
    Returns:
        dict: { signal, reason, confidence, golden_cross, death_cross, divergence, risk_score, risk_grade, switch_mode }
    """
    try:
        from services.indicator_service import IndicatorService
        
        symbol = symbol.upper()
        score = 0
        reasons = []
        
        # (1) RSI 기반
        if rsi > 70:
            score -= 2  # 과매수 → 매도/중립
            reasons.append(f"RSI 과매수 구간 ({rsi:.1f}) - 매도 고려")
        elif rsi < 30:
            score += 2  # 과매도 → 매수
            reasons.append(f"RSI 과매도 구간 ({rsi:.1f}) - 매수 기회")
        
        # (2) MA200 추세 기반
        if price < ma200:
            score -= 1  # 하락 추세 → 중립/매도
            reasons.append(f"가격이 200MA 하회 ({price:.2f} < {ma200:.2f}) - 하락 추세")
        elif price > ma200:
            score += 1  # 상승 추세 → 매수/유지
            reasons.append(f"가격이 200MA 상회 ({price:.2f} > {ma200:.2f}) - 상승 추세")
        
        # (3) FGI(공포 탐욕)
        if fgi < 20:
            score += 1  # 극공포 → 매수 기회
            reasons.append(f"FGI 극공포 구간 ({fgi}) - 매수 기회")
        elif fgi > 60:
            score -= 1  # 탐욕 → 주의
            reasons.append(f"FGI 탐욕 구간 ({fgi}) - 과열 주의")
        
        # (4) 골든/데드크로스 추가
        cross_data = IndicatorService.get_golden_death_cross(symbol)
        golden_cross = cross_data.get("golden_cross", False)
        death_cross = cross_data.get("death_cross", False)
        
        if golden_cross:
            score += 2
            reasons.append("골든크로스 발생 - 강한 상승 추세")
        if death_cross:
            score -= 2
            reasons.append("데드크로스 발생 - 강한 하락 추세")
        
        # (5) Divergence 추가
        divergence_data = IndicatorService.get_divergence(symbol)
        divergence = divergence_data.get("divergence", "none")
        
        if divergence == "bullish":
            score += 1
            reasons.append("상승 다이버전스 감지 - 상승 모멘텀")
        elif divergence == "bearish":
            score -= 1
            reasons.append("하락 다이버전스 감지 - 하락 모멘텀")
        
        # (6) Risk Score 추가
        risk_data = IndicatorService.get_risk_score(symbol)
        risk_score = risk_data.get("risk_score", 50.0)
        risk_grade = risk_data.get("risk_grade", "Medium")
        
        if risk_score >= 70:
            score -= 1  # 고위험 → 주의
            reasons.append(f"고위험 구간 (Risk Score: {risk_score:.1f}) - 투자 주의")
        elif risk_score <= 30:
            score += 1  # 저위험 → 안정적
            reasons.append(f"저위험 구간 (Risk Score: {risk_score:.1f}) - 안정적")
        
        # 최종 의견 결정 (매수/매도/중립)
        if score >= 2:
            signal = "buy"
            reason = "매수 권장: " + "; ".join(reasons) if reasons else "매수 기회"
        elif score <= -2:
            signal = "sell"
            reason = "매도/중립 권장: " + "; ".join(reasons) if reasons else "매도 고려"
        else:
            signal = "hold"
            reason = "중립: " + "; ".join(reasons) if reasons else "현재 포지션 유지"
        
        confidence = min(1.0, abs(score) / 4.0)
        
        return {
            "signal": signal,
            "reason": reason,
            "confidence": round(confidence, 2),
            "golden_cross": golden_cross,
            "death_cross": death_cross,
            "divergence": divergence,
            "risk_score": round(risk_score, 2),
            "risk_grade": risk_grade,
            "switch_mode": False,
            "message": f"본 티커({symbol})는 VIG/QLD 전용 스위칭 전략의 대상이 아닙니다."
        }
    except Exception as e:
        print(f"[ERROR] 개별 의견 계산 오류: {e}")
        import traceback
        traceback.print_exc()
        return {
            "signal": "hold",
            "reason": f"의견 계산 중 오류 발생: {str(e)}",
            "confidence": 0.0,
            "golden_cross": False,
            "death_cross": False,
            "divergence": "none",
            "risk_score": 50.0,
            "risk_grade": "Medium",
            "switch_mode": False,
            "message": f"본 티커({symbol})는 VIG/QLD 전용 스위칭 전략의 대상이 아닙니다."
        }


def calculate_switching_signal_extended(symbol: str, price: float, ma200: float, rsi: float, fgi: int) -> dict:
    """확장된 스위칭 시그널 계산 (골든/데드크로스, Divergence, Risk Score 포함)
    
    Args:
        symbol: 심볼 (골든/데드크로스, Divergence, Risk Score 계산에 필요)
        price: 현재 가격
        ma200: 200일 이동평균
        rsi: RSI 값
        fgi: Fear & Greed Index (0-100)
    
    Returns:
        dict: { signal, reason, confidence, golden_cross, death_cross, divergence, risk_score, risk_grade, switch_mode }
    """
    try:
        from services.indicator_service import IndicatorService
        
        symbol = symbol.upper()
        
        # VIG/QLD가 아니면 독립 의견만 반환
        if symbol not in ["VIG", "QLD"]:
            return calculate_individual_opinion(symbol, price, ma200, rsi, fgi)
        
        score = 0
        reasons = []
        
        # (1) RSI 기반
        if rsi > 70:
            score += 2
            reasons.append(f"RSI 과매수 구간 ({rsi:.1f}) - 하락 위험")
        elif rsi < 30:
            score -= 2
            reasons.append(f"RSI 과매도 구간 ({rsi:.1f}) - 상승 반등 기대")
        
        # (2) MA200 추세 기반
        if price < ma200:
            score += 2
            reasons.append(f"가격이 200MA 하회 ({price:.2f} < {ma200:.2f}) - 추세 하락")
        elif price > ma200:
            score -= 1
            reasons.append(f"가격이 200MA 상회 ({price:.2f} > {ma200:.2f}) - 추세 상승")
        
        # (3) FGI(공포 탐욕)
        if fgi < 20:
            score += 2
            reasons.append(f"FGI 극공포 구간 ({fgi}) - 방어적 전환 유리")
        elif fgi > 60:
            score -= 1
            reasons.append(f"FGI 탐욕 구간 ({fgi}) - 상승 추세 강화")
        
        # (4) 골든/데드크로스 추가
        cross_data = IndicatorService.get_golden_death_cross(symbol)
        golden_cross = cross_data.get("golden_cross", False)
        death_cross = cross_data.get("death_cross", False)
        
        if golden_cross:
            score -= 2
            reasons.append("골든크로스 발생 - 강한 상승 추세")
        if death_cross:
            score += 2
            reasons.append("데드크로스 발생 - 강한 하락 추세")
        
        # (5) Divergence 추가
        divergence_data = IndicatorService.get_divergence(symbol)
        divergence = divergence_data.get("divergence", "none")
        
        if divergence == "bullish":
            score -= 1
            reasons.append("상승 다이버전스 감지 - 상승 모멘텀")
        elif divergence == "bearish":
            score += 1
            reasons.append("하락 다이버전스 감지 - 하락 모멘텀")
        
        # (6) Risk Score 추가
        risk_data = IndicatorService.get_risk_score(symbol)
        risk_score = risk_data.get("risk_score", 50.0)
        risk_grade = risk_data.get("risk_grade", "Medium")
        
        if risk_score >= 70:
            score += 1
            reasons.append(f"고위험 구간 (Risk Score: {risk_score:.1f}) - 방어 자산 선호")
        elif risk_score <= 30:
            score -= 1
            reasons.append(f"저위험 구간 (Risk Score: {risk_score:.1f}) - 공격 자산 가능")
        
        # 최종 시그널 결정
        if score >= 3:
            signal = "sell"
            reason = "방어적 전환 권장: " + "; ".join(reasons) if reasons else "시장 조건상 전환 권장"
        elif score <= -2:
            signal = "buy"
            reason = "공격적 유지/매수 권장: " + "; ".join(reasons) if reasons else "시장 조건상 매수/유지 권장"
        else:
            signal = "hold"
            reason = "현재 포지션 유지: " + "; ".join(reasons) if reasons else "중립 구간 - 현재 포지션 유지"
        
        # confidence = min(1.0, abs(score) / 6)
        confidence = min(1.0, abs(score) / 6.0)
        
        return {
            "signal": signal,
            "reason": reason,
            "confidence": round(confidence, 2),
            "golden_cross": golden_cross,
            "death_cross": death_cross,
            "divergence": divergence,
            "risk_score": round(risk_score, 2),
            "risk_grade": risk_grade,
            "switch_mode": True
        }
    except Exception as e:
        print(f"[ERROR] 확장된 시그널 계산 오류: {e}")
        import traceback
        traceback.print_exc()
        # 오류 시 "hold" 반환
        return {
            "signal": "hold",
            "reason": f"시그널 계산 중 오류 발생: {str(e)}",
            "confidence": 0.0,
            "golden_cross": False,
            "death_cross": False,
            "divergence": "none",
            "risk_score": 50.0,
            "risk_grade": "Medium",
            "switch_mode": symbol.upper() in ["VIG", "QLD"]
        }


def calculate_switching_signal(price: float, ma200: float, rsi: float, fgi: int) -> dict:
    """스위칭 시그널 계산 (점수 기반)
    
    Args:
        price: 현재 가격
        ma200: 200일 이동평균
        rsi: RSI 값
        fgi: Fear & Greed Index (0-100)
    
    Returns:
        dict: { signal, reason, confidence }
    """
    try:
        score = 0
        reasons = []
        
        # (1) RSI 기준
        if rsi > 70:
            score += 2
            reasons.append(f"RSI 과매수 구간 ({rsi:.1f}) - 하락 위험")
        elif rsi < 30:
            score -= 2
            reasons.append(f"RSI 과매도 구간 ({rsi:.1f}) - 상승 반등 기대")
        
        # (2) 200MA 기준
        if price < ma200:
            score += 2
            reasons.append(f"가격이 200MA 하회 ({price:.2f} < {ma200:.2f}) - 추세 하락")
        elif price > ma200:
            score -= 1
            reasons.append(f"가격이 200MA 상회 ({price:.2f} > {ma200:.2f}) - 추세 상승")
        
        # (3) FGI 기준
        if fgi < 20:
            score += 2
            reasons.append(f"FGI 극공포 구간 ({fgi}) - 방어적 전환 유리")
        elif fgi > 60:
            score -= 1
            reasons.append(f"FGI 탐욕 구간 ({fgi}) - 공격적 유지")
        
        # 시그널 판단
        if score >= 3:
            signal = "sell"
            reason = "방어적 전환 권장: " + "; ".join(reasons) if reasons else "시장 조건상 전환 권장"
        elif score <= -2:
            signal = "buy"
            reason = "공격적 유지/매수 권장: " + "; ".join(reasons) if reasons else "시장 조건상 매수/유지 권장"
        else:
            signal = "hold"
            reason = "현재 포지션 유지: " + "; ".join(reasons) if reasons else "중립 구간 - 현재 포지션 유지"
        
        # confidence 계산
        confidence = min(1.0, abs(score) / 5.0)
        
        return {
            "signal": signal,
            "reason": reason,
            "confidence": round(confidence, 2)
        }
    except Exception as e:
        print(f"[ERROR] 시그널 계산 오류: {e}")
        import traceback
        traceback.print_exc()
        # 오류 시 "hold" 반환
        return {
            "signal": "hold",
            "reason": f"시그널 계산 중 오류 발생: {str(e)}",
            "confidence": 0.0
        }


@router.post("/g-v", response_model=SwitchingSignalResponse)
def switching_signal_g_to_v(request: SwitchingSignalRequest):
    """QLD → VIG 전환 판단 (확장된 시그널 로직)
    
    프론트엔드에서 제공하는 price, ma200, rsi, fgi 데이터를 기반으로
    QLD에서 VIG로 전환할지 판단합니다.
    
    Args:
        request: { price, ma200, rsi, fgi, symbol(선택적) }
    
    Returns:
        SwitchingSignalResponse: { signal, reason, confidence, golden_cross, death_cross, divergence, risk_score, risk_grade }
    """
    try:
        # symbol이 제공되면 확장된 시그널 계산 사용
        if request.symbol and request.symbol.strip():
            result = calculate_switching_signal_extended(
                symbol=request.symbol,
                price=request.price,
                ma200=request.ma200,
                rsi=request.rsi,
                fgi=request.fgi
            )
        else:
            # 기존 로직 사용 (하위 호환성)
            result = calculate_switching_signal(
                price=request.price,
                ma200=request.ma200,
                rsi=request.rsi,
                fgi=request.fgi
            )
            # 기본값 추가
            result.setdefault("golden_cross", False)
            result.setdefault("death_cross", False)
            result.setdefault("divergence", "none")
            result.setdefault("risk_score", 50.0)
            result.setdefault("risk_grade", "Medium")
        
        # QLD → VIG 전환 맥락에 맞게 reason 조정
        if result["signal"] == "sell":
            result["reason"] = f"QLD → VIG 전환 권장: {result['reason']}"
        elif result["signal"] == "buy":
            result["reason"] = f"QLD 유지 권장: {result['reason']}"
        else:
            result["reason"] = f"현재 포지션 유지: {result['reason']}"
        
        return SwitchingSignalResponse(**result)
    except Exception as e:
        print(f"[ERROR] QLD → VIG 시그널 계산 오류: {e}")
        import traceback
        traceback.print_exc()
        # 오류 시 "hold" 반환
        return SwitchingSignalResponse(
            signal="hold",
            reason=f"시그널 계산 중 오류 발생: {str(e)}",
            confidence=0.0
        )


@router.post("/v-g", response_model=SwitchingSignalResponse)
def switching_signal_v_to_g(request: SwitchingSignalRequest):
    """VIG → QLD 전환 판단 (확장된 시그널 로직)
    
    프론트엔드에서 제공하는 price, ma200, rsi, fgi 데이터를 기반으로
    VIG에서 QLD로 전환할지 판단합니다.
    
    Args:
        request: { price, ma200, rsi, fgi, symbol(선택적) }
    
    Returns:
        SwitchingSignalResponse: { signal, reason, confidence, golden_cross, death_cross, divergence, risk_score, risk_grade }
    """
    try:
        # symbol이 제공되면 확장된 시그널 계산 사용
        if request.symbol and request.symbol.strip():
            result = calculate_switching_signal_extended(
                symbol=request.symbol,
                price=request.price,
                ma200=request.ma200,
                rsi=request.rsi,
                fgi=request.fgi
            )
        else:
            # 기존 로직 사용 (하위 호환성)
            result = calculate_switching_signal(
                price=request.price,
                ma200=request.ma200,
                rsi=request.rsi,
                fgi=request.fgi
            )
            # 기본값 추가
            result.setdefault("golden_cross", False)
            result.setdefault("death_cross", False)
            result.setdefault("divergence", "none")
            result.setdefault("risk_score", 50.0)
            result.setdefault("risk_grade", "Medium")
        
        # VIG → QLD 전환 맥락에 맞게 reason 조정
        # score가 높으면 VIG에서 QLD로 전환 (sell = 전환)
        # score가 낮으면 VIG 유지 (buy = 유지)
        if result["signal"] == "sell":
            result["reason"] = f"VIG → QLD 전환 권장: {result['reason']}"
        elif result["signal"] == "buy":
            result["reason"] = f"VIG 유지 권장: {result['reason']}"
        else:
            result["reason"] = f"현재 포지션 유지: {result['reason']}"
        
        return SwitchingSignalResponse(**result)
    except Exception as e:
        print(f"[ERROR] VIG → QLD 시그널 계산 오류: {e}")
        import traceback
        traceback.print_exc()
        # 오류 시 "hold" 반환
        return SwitchingSignalResponse(
            signal="hold",
            reason=f"시그널 계산 중 오류 발생: {str(e)}",
            confidence=0.0
        )
