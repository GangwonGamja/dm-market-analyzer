# DM 시황 분석기 Windows EXE 빌드 가이드

## 📋 개요

DM 시황 분석기를 Windows 실행파일(.exe)로 빌드하는 방법을 안내합니다.

## 🔧 사전 요구사항

### 백엔드 빌드
- Python 3.10 이상
- pip 패키지 관리자

### 프론트엔드 빌드
- Node.js 20 이상
- npm 패키지 관리자

## 🚀 빠른 시작

### 방법 1: 전체 자동 빌드 (권장)

```batch
build_exe.bat
```

이 스크립트는 다음을 자동으로 수행합니다:
1. 백엔드 가상환경 생성 및 패키지 설치
2. 백엔드 EXE 빌드 (PyInstaller)
3. 프론트엔드 빌드 (Vite)
4. 프론트엔드 Electron 패키징

**결과물:**
- `build/backend.exe` - 백엔드 서버 실행파일
- `frontend/dist_electron/` - 프론트엔드 Electron 앱

### 방법 2: 개별 빌드

#### 백엔드만 빌드
```batch
build_backend.bat
```

#### 프론트엔드만 빌드
```batch
build_frontend.bat
```

## 📁 빌드 결과물 구조

```
build/
├── backend.exe          # 백엔드 실행파일
└── frontend.exe         # 프론트엔드 실행파일 (또는 dist_electron 폴더)
```

## 🧪 개발 모드 실행

### 백엔드 개발 서버
```batch
run_backend.bat
```
- URL: http://localhost:8000
- API 문서: http://localhost:8000/docs

### 프론트엔드 개발 서버
```batch
run_frontend.bat
```
- URL: http://localhost:3000

## 📦 배포용 EXE 생성

### 백엔드 EXE (PyInstaller)

**수동 빌드:**
```batch
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r ..\requirements.txt
pip install pyinstaller
pyinstaller --onefile --name dm-backend main.py
```

**결과물:** `backend/dist/dm-backend.exe`

### 프론트엔드 EXE (Electron)

**수동 빌드:**
```batch
cd frontend
npm install
npm run build
npm install --save-dev electron electron-builder
npm run electron:build
```

**결과물:** `frontend/dist_electron/DM 시황 분석기 Setup.exe`

## 🔗 EXE 연동 방법

### Electron 앱에서 백엔드 자동 실행

`frontend/electron/main.js` 파일이 자동으로 백엔드를 실행합니다:

1. Electron 앱 시작 시 `backend.exe`를 같은 디렉토리에서 찾습니다
2. 백엔드를 자동으로 실행합니다
3. 2초 후 프론트엔드 UI를 로드합니다

**주의사항:**
- `backend.exe`와 Electron 앱이 같은 폴더에 있어야 합니다
- 또는 `build/` 폴더에 두 파일을 함께 배치하세요

## 🎯 GitHub Actions 자동 배포

### 릴리즈 생성 방법

1. **태그로 릴리즈:**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **수동 워크플로우 실행:**
   - GitHub Actions 탭에서 "Build and Release Windows EXE" 워크플로우 선택
   - "Run workflow" 클릭
   - 버전 입력 (예: v1.0.0)

### 릴리즈 파일

GitHub Releases에 다음 파일이 자동으로 업로드됩니다:
- `dm-backend.exe` - 백엔드 실행파일
- `DM 시황 분석기 Setup.exe` - 프론트엔드 설치 파일

## ⚙️ 고급 설정

### PyInstaller 옵션 커스터마이징

`backend/pyinstaller.spec` 파일을 수정하여 빌드 옵션을 변경할 수 있습니다.

### Electron 빌드 옵션 커스터마이징

`frontend/package.json`의 `build` 섹션을 수정하여 Electron 빌드 옵션을 변경할 수 있습니다.

## 🐛 문제 해결

### 백엔드 EXE가 실행되지 않음
- Python 가상환경이 제대로 생성되었는지 확인
- `requirements.txt`의 모든 패키지가 설치되었는지 확인
- PyInstaller가 최신 버전인지 확인: `pip install --upgrade pyinstaller`

### 프론트엔드 Electron 빌드 실패
- Node.js 버전이 20 이상인지 확인
- `npm install`이 성공적으로 완료되었는지 확인
- Electron 빌드 로그를 확인하여 오류 메시지 확인

### 백엔드와 프론트엔드 연결 실패
- `backend.exe`가 프론트엔드와 같은 폴더에 있는지 확인
- 백엔드가 정상적으로 시작되는지 확인 (포트 8000)
- 방화벽이 포트 8000을 차단하지 않는지 확인

## 📝 참고사항

- **Windows Defender 경고**: 서명되지 않은 실행파일이므로 처음 실행 시 경고가 표시될 수 있습니다. "추가 정보" → "실행"을 클릭하세요.
- **파일 크기**: EXE 파일은 상대적으로 큽니다 (백엔드: ~50MB, 프론트엔드: ~100MB). 이는 Python 런타임과 Node.js 런타임이 포함되어 있기 때문입니다.
- **성능**: EXE 실행 시 처음 시작이 느릴 수 있습니다 (압축 해제 시간).

## 🔄 업데이트

새 버전을 빌드하려면:
1. 코드 변경사항 커밋
2. `build_exe.bat` 실행
3. GitHub에 태그 생성 및 푸시 (자동 배포)

---

**문의사항이나 문제가 있으면 GitHub Issues에 등록해주세요.**

