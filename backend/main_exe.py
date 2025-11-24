"""
DM 시황 분석기 백엔드 - EXE 실행용
PyInstaller로 패키징할 때 사용하는 진입점
"""
import sys
import os
import uvicorn

# PyInstaller로 패키징 시 경로 문제 해결
if getattr(sys, 'frozen', False):
    # exe로 실행되는 경우
    application_path = os.path.dirname(sys.executable)
else:
    # 일반 Python 스크립트로 실행되는 경우
    application_path = os.path.dirname(os.path.abspath(__file__))

# 작업 디렉토리를 exe 위치로 변경
os.chdir(application_path)

# 상대 경로로 모듈 import
sys.path.insert(0, application_path)

# FastAPI 앱 import
from main import app

if __name__ == "__main__":
    # EXE 실행 시 자동으로 서버 시작
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )

