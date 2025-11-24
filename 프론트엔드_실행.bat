@echo off
chcp 65001 >nul
title VIG-QLD 프론트엔드 서버
color 0B

cd /d "%~dp0frontend"

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js가 설치되어 있지 않습니다!
    echo https://nodejs.org/ 에서 설치해주세요.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo 패키지 설치 중...
    call npm install
)

call npm run dev



