const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

let backendProcess = null;
let mainWindow = null;

// 백엔드 실행
function startBackend() {
  // exe와 같은 디렉토리에서 backend.exe 찾기
  const exeDir = path.dirname(process.execPath);
  const backendExe = path.join(exeDir, 'backend.exe');
  
  // 개발 모드에서는 다른 경로 시도
  let backendPath = backendExe;
  if (!fs.existsSync(backendPath)) {
    // 개발 모드: 프로젝트 루트의 build 폴더 확인
    const devBackend = path.join(exeDir, '..', 'build', 'backend.exe');
    if (fs.existsSync(devBackend)) {
      backendPath = devBackend;
    } else {
      console.error('백엔드 실행파일을 찾을 수 없습니다:', backendExe);
      return;
    }
  }

  console.log('백엔드 시작:', backendExe);
  backendProcess = spawn(backendExe, [], {
    cwd: path.dirname(backendExe),
    stdio: 'ignore'
  });

  backendProcess.on('error', (err) => {
    console.error('백엔드 실행 오류:', err);
  });

  backendProcess.on('exit', (code) => {
    console.log('백엔드 종료:', code);
  });
}

// Electron 창 생성
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    icon: path.join(__dirname, '..', 'public', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // 개발 모드와 프로덕션 모드 구분
  const isDev = !app.isPackaged;
  
  if (isDev) {
    // 개발 모드: Vite 개발 서버
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // 프로덕션 모드: 빌드된 파일
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    mainWindow.loadFile(indexPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 앱 준비 완료
app.whenReady().then(() => {
  // 백엔드 시작 (2초 대기 후 프론트엔드 로드)
  startBackend();
  setTimeout(createWindow, 2000);
});

// 모든 창이 닫혔을 때
app.on('window-all-closed', () => {
  // 백엔드 프로세스 종료
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 앱 종료 시 백엔드 프로세스 정리
app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});

