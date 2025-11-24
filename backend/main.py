"""
ETF Advisor 백엔드 (무료 API 기반)
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.database import init_db
from routers import market, etf, news, signal, analysis, backtest
from core.cache import cache
import uvicorn
from core.config import settings

# Render 무료 서버 24시간 유지 트릭
try:
    import backend.keep_alive
    backend.keep_alive.start_keep_alive()
except Exception as e:
    print(f"[WARNING] Keep-alive 모듈 로드 실패 (로컬 환경일 수 있음): {e}")

app = FastAPI(
    title="ETF Advisor API",
    description="무료 API 기반 ETF 투자 어드바이저 API",
    version="2.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(market.router)
app.include_router(etf.router)
app.include_router(news.router)
app.include_router(signal.router)
app.include_router(analysis.router)
app.include_router(backtest.router)


@app.on_event("startup")
async def startup_event():
    """앱 시작 시 초기화"""
    init_db()
    
    # 캐시 정리
    cache.cleanup_expired()
    
    print("[INFO] ETF Advisor 백엔드 시작")
    print("[INFO] 데이터 소스: Yahoo Finance (yfinance)")
    print("[INFO] 뉴스: Marketaux API")
    print("[INFO] Fear & Greed Index: CNN FGI Scraper")
    print("[INFO] 캐싱: In-memory (15-30분)")


@app.get("/")
def root():
    return {
        "message": "ETF Advisor API (무료 API 기반)",
        "version": "2.0.0",
        "data_sources": {
            "price": "Yahoo Finance (yfinance)",
            "news": "Marketaux API",
            "fgi": "CNN FGI Scraper"
        }
    }


@app.get("/health")
def health_check():
    cache_stats = cache.get_stats()
    return {
        "status": "healthy",
        "cache": cache_stats
    }


@app.get("/debug/env")
def debug_env():
    """환경변수 디버깅용 엔드포인트"""
    import os
    marketaux_key = os.getenv("MARKETAUX_API_KEY") or os.getenv("marketaux_api_key")
    return {
        "MARKETAUX_API_KEY": marketaux_key,
        "MARKETAUX_API_KEY_set": bool(marketaux_key),
        "env_file_exists": os.path.exists(".env")
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True
    )
