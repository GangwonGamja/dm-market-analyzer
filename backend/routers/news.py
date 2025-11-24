"""
뉴스 관련 라우터 (Marketaux API 기반)
"""
from fastapi import APIRouter, HTTPException, Query
from services.news_service import NewsService
import traceback

router = APIRouter()


@router.get("/news")
def get_news(
    symbol: str = Query("VIG", description="심볼 (VIG, QLD, AAPL 등 모든 심볼 지원)"),
    limit: int = Query(20, ge=1, le=100, description="가져올 뉴스 개수 (최대 100)")
):
    """뉴스 가져오기 (Marketaux API, 모든 심볼 지원)"""
    try:
        symbol = symbol.upper()  # 대문자 변환
        result = NewsService.fetch_news(symbol, limit)
        
        # API KEY가 없으면 빈 리스트를 정상적으로 반환하므로 에러 로깅은 하지 않음
        # 실제 API 오류가 발생한 경우에만 로깅
        if not result.get("success") and result.get("error"):
            print(f"[ERROR] 뉴스 수집 실패: {result.get('error')}")
        
        return result
        
    except Exception as e:
        error_msg = f"뉴스 API 오류: {str(e)}"
        print(f"[ERROR] {error_msg}")
        traceback.print_exc()
        # 오류 시에도 기본 형식 반환
        return {
            "success": False,
            "count": 0,
            "articles": [],
            "error": error_msg
        }
