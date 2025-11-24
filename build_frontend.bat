@echo off
chcp 65001 >nul
echo === 프론트엔드 빌드 ===
cd frontend

REM npm 패키지 설치
if not exist "node_modules" (
    echo npm 패키지 설치 중...
    call npm install
)

REM Vite 빌드
echo Vite 빌드 중...
call npm run build

if not exist "dist" (
    echo [오류] 프론트엔드 빌드 실패
    pause
    exit /b 1
)

echo.
echo [성공] 프론트엔드 빌드 완료: frontend\dist
cd ..
pause

