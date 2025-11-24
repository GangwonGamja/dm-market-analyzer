from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from core.config import settings

engine = create_engine(settings.database_url, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class ETFPrice(Base):
    __tablename__ = "etf_prices"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, index=True)
    date = Column(DateTime, index=True)
    open = Column(Float)
    high = Column(Float)
    low = Column(Float)
    close = Column(Float)
    volume = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)


class FearGreedIndex(Base):
    __tablename__ = "fear_greed_index"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, index=True, unique=True)
    value = Column(Integer)
    classification = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
    # 시장 데이터 테이블 초기화
    try:
        from services.market_data_service import MarketData
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"시장 데이터 테이블 초기화 오류: {e}")
    
    # 뉴스 테이블은 더 이상 사용하지 않음 (함수 기반으로 변경)
    # 뉴스 데이터는 실시간으로 Google News RSS에서 가져옴

