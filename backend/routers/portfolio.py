"""
포트폴리오 관련 라우터
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from services.portfolio_service import PortfolioService

router = APIRouter(prefix="/portfolio", tags=["portfolio"])


@router.get("/allocation")
def get_portfolio_allocation(db: Session = Depends(get_db)):
    """AI 기반 포트폴리오 비중 추천"""
    try:
        allocation = PortfolioService.calculate_ai_allocation(db)
        return allocation
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recommendation")
def get_portfolio_recommendation(db: Session = Depends(get_db)):
    """포트폴리오 추천 요약"""
    try:
        allocation = PortfolioService.calculate_ai_allocation(db)
        
        # 추천 액션 결정
        vig_alloc = allocation["vig_allocation"]
        action = "현재 비중 유지"
        
        if vig_alloc > 70:
            action = "VIG 중심 포트폴리오 (방어적)"
        elif vig_alloc < 30:
            action = "QLD 중심 포트폴리오 (공격적)"
        elif vig_alloc > 55:
            action = "VIG 비중 확대 고려"
        elif vig_alloc < 45:
            action = "QLD 비중 확대 고려"
        
        return {
            "recommendation": action,
            "vig_allocation": vig_alloc,
            "qld_allocation": allocation["qld_allocation"],
            "confidence": allocation["confidence"],
            "reasons": allocation["reasons"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



