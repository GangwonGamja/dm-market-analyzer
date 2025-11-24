@echo off
chcp 65001 >nul
echo === VIG-QLD 투자 어드바이저 프론트엔드 시작 ===
echo.

cd /d "%~dp0frontend"

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [오류] Node.js가 설치되어 있지 않습니다!
    echo.
    echo Node.js 설치 방법:
    echo 1. https://nodejs.org/ 접속
    echo 2. LTS 버전 다운로드 및 설치
    echo 3. 설치 후 이 스크립트를 다시 실행하세요.
    echo.
    pause
    exit /b 1
)

echo Node.js 버전:
node --version
echo npm 버전:
npm --version
echo.

if not exist "node_modules" (
    echo 프론트엔드 패키지 설치 중...
    echo (처음 실행 시 시간이 걸릴 수 있습니다)
    echo.
    call npm install
    
    if %errorlevel% neq 0 (
        echo.
        echo [오류] 패키지 설치 실패!
        echo.
        pause
        exit /b 1
    )
    echo.
    echo 패키지 설치 완료!
    echo.
)

echo 프론트엔드 개발 서버 시작 중...
echo 서버 주소: http://localhost:3000
echo 종료하려면 Ctrl+C를 누르세요.
echo.

call npm run dev

pause



