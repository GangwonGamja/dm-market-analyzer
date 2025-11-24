"""
시장 데이터 관련 라우터 (VIX, DXY, 금리 등)
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from services.market_data_service import MarketDataService

router = APIRouter(prefix="/market-data", tags=["market-data"])


@router.get("/{symbol}")
def get_market_data(symbol: str, db: Session = Depends(get_db)):
    """시장 데이터 최신 값 조회"""
    try:
        data = MarketDataService.get_latest_market_data(db, symbol.upper())
        if not data:
            raise HTTPException(status_code=404, detail=f"{symbol} 데이터를 찾을 수 없습니다")
        return data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{symbol}/history")
def get_market_data_history(symbol: str, days: int = 365, db: Session = Depends(get_db)):
    """시장 데이터 히스토리"""
    try:
        history = MarketDataService.get_market_data_history(db, symbol.upper(), days)
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/update")
def update_all_market_data(db: Session = Depends(get_db)):
    """모든 시장 데이터 업데이트"""
    try:
        MarketDataService.update_all_market_data(db)
        return {"message": "시장 데이터 업데이트 완료"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



