"""
데이터 업데이트 스케줄러
APScheduler를 사용하여 매일 데이터를 업데이트합니다.
"""
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from core.database import SessionLocal
from services.etf_service import ETFService
from services.sentiment_service import SentimentService


def update_data():
    """ETF 데이터 및 Fear & Greed Index 업데이트"""
    db = SessionLocal()
    try:
        print("ETF 데이터 업데이트 시작...")
        ETFService.update_etf_data(db, "VIG")
        ETFService.update_etf_data(db, "QLD")
        
        print("Fear & Greed Index 업데이트 시작...")
        fgi_data = SentimentService.fetch_fear_greed_index()
        if fgi_data:
            SentimentService.save_fear_greed_index(db, fgi_data)
        
        print("데이터 업데이트 완료")
    except Exception as e:
        print(f"데이터 업데이트 오류: {e}")
    finally:
        db.close()


def start_scheduler():
    """스케줄러 시작"""
    scheduler = BackgroundScheduler()
    # 매일 오전 9시에 실행
    scheduler.add_job(
        update_data,
        trigger=CronTrigger(hour=9, minute=0),
        id="daily_update",
        name="일일 데이터 업데이트",
        replace_existing=True
    )
    scheduler.start()
    print("스케줄러가 시작되었습니다. 매일 오전 9시에 데이터를 업데이트합니다.")


if __name__ == "__main__":
    start_scheduler()



