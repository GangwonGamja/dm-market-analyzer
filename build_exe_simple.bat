@echo off
chcp 65001 >nul
echo ========================================
echo   DM 시황 분석기 EXE 빌드 (간단 버전)
echo ========================================
echo.

REM 빌드 디렉토리 생성
if not exist "build" mkdir build

echo [1/3] 백엔드 EXE 빌드...
call build_backend.bat
if errorlevel 1 (
    echo 백엔드 빌드 실패
    pause
    exit /b 1
)

echo [2/3] 프론트엔드 빌드...
call build_frontend.bat
if errorlevel 1 (
    echo 프론트엔드 빌드 실패
    pause
    exit /b 1
)

echo [3/3] Electron 패키징...
cd frontend
if not exist "node_modules\electron" (
    echo Electron 설치 중...
    call npm install --save-dev electron electron-builder concurrently wait-on
)

echo Electron 빌드 중...
call npm run electron:build

cd ..

echo.
echo ========================================
echo   빌드 완료!
echo ========================================
echo   백엔드: build\backend.exe
echo   프론트엔드: frontend\dist_electron\
echo ========================================
echo.
pause

