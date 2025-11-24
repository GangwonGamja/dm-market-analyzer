"""
시장 데이터 수집 서비스 (VIX, DXY, 금리 등)
"""
import yfinance as yf
import requests
import pandas as pd
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from core.database import SessionLocal, Base
from sqlalchemy import Column, Integer, String, Float, DateTime
from typing import Optional, Dict
import json


class MarketData(Base):
    __tablename__ = "market_data"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, index=True)  # VIX, DXY, TNX 등
    date = Column(DateTime, index=True)
    value = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)


class MarketDataService:
    @staticmethod
    def fetch_vix() -> Optional[pd.DataFrame]:
        """VIX (변동성 지수) 데이터 가져오기"""
        # 여러 대안 티커 시도
        tickers = ["^VIX", "VIX=X"]
        
        for ticker_symbol in tickers:
            try:
                ticker = yf.Ticker(ticker_symbol)
                data = ticker.history(period="1y")  # 기간을 1y로 단축
                if data is not None and not data.empty:
                    return data
            except Exception as e:
                print(f"VIX 티커 {ticker_symbol} 실패: {e}")
                continue
        
        print("VIX 데이터를 가져올 수 없습니다 (모든 티커 실패)")
        return None

    @staticmethod
    def fetch_dxy() -> Optional[pd.DataFrame]:
        """DXY (달러 인덱스) 데이터 가져오기"""
        # 여러 대안 티커 시도
        tickers = ["UUP", "DX-Y.NYB", "DX=F", "DXY=X"]
        
        for ticker_symbol in tickers:
            try:
                ticker = yf.Ticker(ticker_symbol)
                data = ticker.history(period="1y")  # 기간을 1y로 단축하여 네트워크 부하 감소
                if data is not None and not data.empty:
                    print(f"DXY 데이터 가져오기 성공: {ticker_symbol}")
                    return data
            except Exception as e:
                print(f"DXY 티커 {ticker_symbol} 실패: {e}")
                continue
        
        print("DXY 데이터를 가져올 수 없습니다 (모든 티커 실패)")
        return None

    @staticmethod
    def fetch_treasury_rate() -> Optional[pd.DataFrame]:
        """미국 10년 국채 금리 (TNX) 데이터 가져오기"""
        # 여러 대안 티커 시도
        tickers = ["^TNX", "TNX=X", "^IRX", "^FVX", "^TYX"]
        
        for ticker_symbol in tickers:
            try:
                ticker = yf.Ticker(ticker_symbol)
                data = ticker.history(period="1y")  # 기간을 1y로 단축
                if data is not None and not data.empty:
                    print(f"TNX 데이터 가져오기 성공: {ticker_symbol}")
                    return data
            except Exception as e:
                print(f"TNX 티커 {ticker_symbol} 실패: {e}")
                continue
        
        print("TNX 데이터를 가져올 수 없습니다 (모든 티커 실패)")
        return None

    @staticmethod
    def fetch_nq_futures() -> Optional[pd.DataFrame]:
        """나스닥 선물 (NQ) 데이터 가져오기"""
        try:
            ticker = yf.Ticker("NQ=F")
            data = ticker.history(period="2y")
            return data
        except Exception as e:
            print(f"나스닥 선물 데이터 가져오기 실패: {e}")
            return None

    @staticmethod
    def save_market_data(db: Session, symbol: str, data: pd.DataFrame):
        """시장 데이터 저장"""
        for date, row in data.iterrows():
            existing = db.query(MarketData).filter(
                MarketData.symbol == symbol,
                MarketData.date == date
            ).first()
            
            if not existing:
                market_data = MarketData(
                    symbol=symbol,
                    date=date,
                    value=float(row['Close'])
                )
                db.add(market_data)
        
        db.commit()

    @staticmethod
    def get_latest_market_data(db: Session, symbol: str) -> Optional[Dict]:
        """최신 시장 데이터 가져오기"""
        data = db.query(MarketData).filter(
            MarketData.symbol == symbol
        ).order_by(MarketData.date.desc()).first()
        
        if data:
            return {
                "symbol": data.symbol,
                "date": data.date.isoformat(),
                "value": data.value
            }
        return None

    @staticmethod
    def get_market_data_history(db: Session, symbol: str, days: int = 365) -> list:
        """시장 데이터 히스토리"""
        cutoff_date = datetime.now() - timedelta(days=days)
        data = db.query(MarketData).filter(
            MarketData.symbol == symbol,
            MarketData.date >= cutoff_date
        ).order_by(MarketData.date.asc()).all()
        
        return [{
            "date": d.date.isoformat(),
            "value": d.value
        } for d in data]

    @staticmethod
    def update_all_market_data(db: Session):
        """모든 시장 데이터 업데이트"""
        symbols = {
            "VIX": MarketDataService.fetch_vix,
            "DXY": MarketDataService.fetch_dxy,
            "TNX": MarketDataService.fetch_treasury_rate,
            "NQ": MarketDataService.fetch_nq_futures,
        }
        
        success_count = 0
        fail_count = 0
        
        for symbol, fetch_func in symbols.items():
            try:
                print(f"{symbol} 데이터 수집 중...")
                data = fetch_func()
                if data is not None and not data.empty:
                    MarketDataService.save_market_data(db, symbol, data)
                    print(f"{symbol} 데이터 수집 완료: {len(data)}개 레코드")
                    success_count += 1
                else:
                    print(f"{symbol} 데이터를 가져올 수 없습니다 (데이터가 비어있거나 티커 심볼 오류)")
                    fail_count += 1
            except Exception as e:
                print(f"{symbol} 데이터 업데이트 실패: {e}")
                fail_count += 1
        
        print(f"\n시장 데이터 수집 완료: 성공 {success_count}개, 실패 {fail_count}개")
        if fail_count > 0:
            print("참고: 일부 시장 데이터 수집 실패는 네트워크 연결 문제나 티커 심볼 변경 때문일 수 있습니다.")
            print("서버는 정상적으로 실행되지만, 해당 데이터를 사용하는 기능은 기본값으로 동작합니다.")


def init_market_data_table():
    """시장 데이터 테이블 초기화"""
    from core.database import engine
    MarketData.metadata.create_all(bind=engine)

