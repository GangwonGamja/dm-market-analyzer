@echo off
chcp 65001 >nul
echo === DM 시황 분석기 프론트엔드 실행 ===
cd frontend

REM npm 패키지 확인
if not exist "node_modules" (
    echo npm 패키지 설치 중...
    call npm install
)

REM 환경 변수 설정 (로컬 개발용)
set VITE_API_URL=http://localhost:8000

REM 프론트엔드 실행
echo 프론트엔드 개발 서버 시작 중...
echo 접속 URL: http://localhost:3000
echo.
call npm run dev

pause

