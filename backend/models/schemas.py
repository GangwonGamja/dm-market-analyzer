from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class ETFPriceResponse(BaseModel):
    symbol: str
    date: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int

    model_config = {"from_attributes": True}


class MovingAverageResponse(BaseModel):
    date: datetime
    price: float
    ma200: float


class RSIResponse(BaseModel):
    date: datetime
    rsi: float
    price: float


class FearGreedResponse(BaseModel):
    date: datetime
    value: int
    classification: str


class MarketStatusResponse(BaseModel):
    status: str  # "과매수", "과매도", "중립"
    description: str


class SignalResponse(BaseModel):
    action: str  # "유지", "스위칭", "부분전환"
    current_etf: str
    target_etf: Optional[str]
    reason: str
    confidence: float


class SwitchingSignalRequest(BaseModel):
    """스위칭 시그널 계산용 요청 모델"""
    price: float
    ma200: float
    rsi: float
    fgi: int
    symbol: str = ""  # 확장된 시그널 계산에 필요 (선택적)


class SwitchingSignalResponse(BaseModel):
    """스위칭 시그널 응답 모델 (확장)"""
    signal: str  # "buy" | "sell" | "hold"
    reason: str
    confidence: float  # 0~1
    golden_cross: bool = False
    death_cross: bool = False
    divergence: str = "none"  # "bullish" | "bearish" | "none"
    risk_score: float = 50.0  # 0-100
    risk_grade: str = "Medium"  # "Low" | "Medium" | "High"
    switch_mode: bool = True  # True: VIG/QLD 스위칭 모드, False: 개별 종목 분석 모드
    message: Optional[str] = None  # 개별 종목일 경우 안내 메시지


class BacktestRequest(BaseModel):
    period: int  # 3, 5, 10 years
    initial_investment: float = 10000


class BacktestResult(BaseModel):
    strategy_a: dict  # VIG 단순 보유
    strategy_b: dict  # VIG↔QLD 스위칭
    strategy_c: dict  # AI 추천 비중 자동조절
    comparison: dict


class BacktestResponse(BaseModel):
    period: int
    results: BacktestResult
    chart_data: List[dict]
