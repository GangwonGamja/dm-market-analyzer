@echo off
chcp 65001 >nul
echo === VIG-QLD 투자 어드바이저 백엔드 시작 ===
echo.

cd /d "%~dp0backend"

if not exist "venv\Scripts\activate.bat" (
    echo 가상환경이 없습니다. 생성 중...
    python -m venv venv
    echo 가상환경 생성 완료.
    echo.
)

echo 가상환경 활성화 중...
call venv\Scripts\activate.bat

echo.
echo 백엔드 서버 시작 중...
echo 서버 주소: http://localhost:8000
echo 종료하려면 Ctrl+C를 누르세요.
echo.

python main.py

pause



