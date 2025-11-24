@echo off
chcp 65001 >nul
echo ========================================
echo   DM 시황 분석기 EXE 빌드 시작
echo ========================================
echo.

REM 빌드 디렉토리 생성
if not exist "build" mkdir build
if not exist "build\backend" mkdir build\backend
if not exist "build\frontend" mkdir build\frontend

echo [1/5] 백엔드 가상환경 설정...
cd backend
if not exist "venv" (
    echo 가상환경 생성 중...
    python -m venv venv
)
call venv\Scripts\activate.bat
echo 패키지 설치 중...
pip install -q --upgrade pip
pip install -q -r ..\requirements.txt
pip install -q pyinstaller

echo [2/5] 백엔드 EXE 빌드 중...
if exist "main.spec" del main.spec
if exist "build" rmdir /s /q build
if exist "dist" rmdir /s /q dist

REM PyInstaller로 exe 생성
pyinstaller --onefile ^
    --name "dm-backend" ^
    --add-data "core;core" ^
    --add-data "routers;routers" ^
    --add-data "services;services" ^
    --add-data "models;models" ^
    --hidden-import=uvicorn.lifespan.on ^
    --hidden-import=uvicorn.lifespan.off ^
    --hidden-import=uvicorn.protocols.websockets.auto ^
    --hidden-import=uvicorn.protocols.websockets.websockets_impl ^
    --hidden-import=uvicorn.protocols.http.auto ^
    --hidden-import=uvicorn.protocols.http.h11_impl ^
    --hidden-import=uvicorn.protocols.http.httptools_impl ^
    --hidden-import=uvicorn.loops.auto ^
    --hidden-import=uvicorn.loops.asyncio ^
    --hidden-import=uvicorn.loops.uvloop ^
    --hidden-import=fastapi ^
    --hidden-import=pydantic ^
    --hidden-import=yfinance ^
    --hidden-import=pandas ^
    --hidden-import=numpy ^
    --collect-all uvicorn ^
    --collect-all fastapi ^
    --noconsole ^
    main.py

if exist "dist\dm-backend.exe" (
    copy dist\dm-backend.exe ..\build\backend.exe
    echo [성공] 백엔드 EXE 생성 완료: build\backend.exe
) else (
    echo [오류] 백엔드 EXE 빌드 실패
    pause
    exit /b 1
)

cd ..

echo [3/5] 프론트엔드 빌드 중...
cd frontend
if not exist "node_modules" (
    echo npm 패키지 설치 중...
    call npm install
)
echo Vite 빌드 중...
call npm run build

if not exist "dist" (
    echo [오류] 프론트엔드 빌드 실패
    pause
    exit /b 1
)

echo [4/5] 프론트엔드 Electron 패키징 중...
if not exist "node_modules\electron" (
    echo Electron 설치 중...
    call npm install --save-dev electron electron-builder
)

REM Electron 메인 프로세스 파일 생성
if not exist "electron" mkdir electron
echo const { app, BrowserWindow } = require('electron'); > electron\main.js
echo const { spawn } = require('child_process'); >> electron\main.js
echo const path = require('path'); >> electron\main.js
echo. >> electron\main.js
echo let backendProcess = null; >> electron\main.js
echo let mainWindow = null; >> electron\main.js
echo. >> electron\main.js
echo function createWindow() { >> electron\main.js
echo   mainWindow = new BrowserWindow({ >> electron\main.js
echo     width: 1400, >> electron\main.js
echo     height: 900, >> electron\main.js
echo     webPreferences: { >> electron\main.js
echo       nodeIntegration: false, >> electron\main.js
echo       contextIsolation: true >> electron\main.js
echo     } >> electron\main.js
echo   }); >> electron\main.js
echo   mainWindow.loadFile('dist/index.html'); >> electron\main.js
echo } >> electron\main.js
echo. >> electron\main.js
echo app.whenReady().then(() => { >> electron\main.js
echo   const backendPath = path.join(__dirname, '..', '..', 'backend.exe'); >> electron\main.js
echo   backendProcess = spawn(backendPath, [], { cwd: path.dirname(backendPath) }); >> electron\main.js
echo   backendProcess.on('error', (err) => { console.error('Backend error:', err); }); >> electron\main.js
echo   setTimeout(createWindow, 2000); >> electron\main.js
echo }); >> electron\main.js
echo. >> electron\main.js
echo app.on('window-all-closed', () => { >> electron\main.js
echo   if (backendProcess) backendProcess.kill(); >> electron\main.js
echo   if (process.platform !== 'darwin') app.quit(); >> electron\main.js
echo }); >> electron\main.js

REM package.json에 electron 설정 추가
echo Electron 빌드 중...
call npx electron-builder --win --x64 --dir

cd ..

echo [5/5] 빌드 완료!
echo.
echo ========================================
echo   빌드된 파일 위치:
echo ========================================
echo   백엔드: build\backend.exe
echo   프론트엔드: build\frontend.exe (또는 frontend\dist_electron)
echo ========================================
echo.
pause

