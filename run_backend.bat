@echo off
chcp 65001 >nul
echo === DM 시황 분석기 백엔드 실행 ===
cd backend

REM 가상환경 활성화
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
) else (
    echo 가상환경이 없습니다. build_backend.bat를 먼저 실행하세요.
    pause
    exit /b 1
)

REM 백엔드 실행
echo 백엔드 서버 시작 중...
echo 접속 URL: http://localhost:8000
echo API 문서: http://localhost:8000/docs
echo.
uvicorn main:app --host 0.0.0.0 --port 8000

pause

