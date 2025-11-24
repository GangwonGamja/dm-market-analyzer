@echo off
chcp 65001 >nul
echo === 백엔드 EXE 빌드 ===
cd backend

REM 가상환경 확인 및 생성
if not exist "venv" (
    echo 가상환경 생성 중...
    python -m venv venv
)
call venv\Scripts\activate.bat

REM 패키지 설치
pip install -q --upgrade pip
pip install -q -r ..\requirements.txt
pip install -q pyinstaller

REM 기존 빌드 파일 정리
if exist "main.spec" del main.spec
if exist "build" rmdir /s /q build
if exist "dist" rmdir /s /q dist

REM PyInstaller 실행
echo 백엔드 EXE 빌드 중...
pyinstaller --onefile ^
    --name "dm-backend" ^
    --add-data "core;core" ^
    --add-data "routers;routers" ^
    --add-data "services;services" ^
    --add-data "models;models" ^
    --hidden-import=uvicorn.lifespan.on ^
    --hidden-import=uvicorn.lifespan.off ^
    --hidden-import=uvicorn.protocols.websockets.auto ^
    --hidden-import=uvicorn.protocols.http.auto ^
    --hidden-import=uvicorn.loops.auto ^
    --hidden-import=uvicorn.loops.asyncio ^
    --hidden-import=fastapi ^
    --hidden-import=pydantic ^
    --hidden-import=yfinance ^
    --hidden-import=pandas ^
    --hidden-import=numpy ^
    --collect-all uvicorn ^
    --collect-all fastapi ^
    --noconsole ^
    main.py

REM 빌드 결과 확인
if exist "dist\dm-backend.exe" (
    if not exist "..\build" mkdir ..\build
    copy dist\dm-backend.exe ..\build\backend.exe
    echo.
    echo [성공] 백엔드 EXE 생성 완료: build\backend.exe
) else (
    echo [오류] 백엔드 EXE 빌드 실패
    pause
    exit /b 1
)

cd ..
pause

