from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os
from pathlib import Path
from typing import Optional

# .env 파일 경로 명확히 지정
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# 환경변수 로드 확인 (WARN 메시지 제거 - 뉴스 기능은 API KEY가 없으면 자동으로 비활성화됨)
marketaux_api_key = os.getenv("MARKETAUX_API_KEY") or os.getenv("marketaux_api_key")


class Settings(BaseSettings):
    marketaux_api_key: Optional[str] = None
    database_url: str = "sqlite:///./etf_advisor.db"
    host: str = "0.0.0.0"
    port: int = int(os.getenv("PORT", 8000))  # Render는 $PORT 환경 변수 제공

    class Config:
        env_file = str(env_path) if env_path.exists() else ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"  # 추가 필드 무시


settings = Settings()

# Settings에 직접 환경변수 값 할당 (dotenv로 로드된 값 우선 사용)
if marketaux_api_key:
    settings.marketaux_api_key = marketaux_api_key

