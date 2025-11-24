"""
데이터 로더 - 백그라운드에서 주기적으로 데이터를 업데이트
"""
import asyncio
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from core.database import SessionLocal
from services.etf_service import ETFService
from services.sentiment_service import SentimentService


async def update_all_data():
    """모든 데이터 업데이트"""
    db = SessionLocal()
    try:
        print(f"[{datetime.now()}] 데이터 업데이트 시작...")
        
        # ETF 데이터 업데이트
        for symbol in ["VIG", "QLD"]:
            try:
                ETFService.update_etf_data(db, symbol)
            except Exception as e:
                print(f"[{datetime.now()}] {symbol} 업데이트 실패: {e}")
        
        # Fear & Greed Index 업데이트
        try:
            fgi_data = SentimentService.fetch_fear_greed_index()
            if fgi_data:
                SentimentService.save_fear_greed_index(db, fgi_data)
                print(f"[{datetime.now()}] Fear & Greed Index 업데이트 완료")
        except Exception as e:
            print(f"[{datetime.now()}] Fear & Greed Index 업데이트 실패: {e}")
        
        print(f"[{datetime.now()}] 데이터 업데이트 완료")
    except Exception as e:
        print(f"[{datetime.now()}] 데이터 업데이트 오류: {e}")
    finally:
        db.close()


async def periodic_update(interval_hours: int = 1):
    """주기적으로 데이터 업데이트 (기본 1시간마다)"""
    while True:
        try:
            await update_all_data()
            await asyncio.sleep(interval_hours * 3600)  # 시간을 초로 변환
        except Exception as e:
            print(f"[{datetime.now()}] 주기적 업데이트 오류: {e}")
            await asyncio.sleep(60)  # 오류 시 1분 후 재시도



