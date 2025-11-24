# 설치 가이드

## Node.js 설치 (필수)

프론트엔드를 실행하려면 Node.js가 필요합니다.

### 설치 방법

1. **Node.js 공식 웹사이트 방문**
   - https://nodejs.org/ 접속
   - LTS (Long Term Support) 버전 다운로드
   - Windows Installer (.msi) 파일 다운로드

2. **설치 실행**
   - 다운로드한 .msi 파일 실행
   - 기본 설정으로 설치 진행 (모든 옵션 체크 권장)
   - 설치 완료 후 PowerShell 재시작

3. **설치 확인**
   PowerShell에서 다음 명령 실행:
   ```powershell
   node --version
   npm --version
   ```

### 설치 후 프론트엔드 패키지 설치

Node.js 설치가 완료되면 다음 명령을 실행하세요:

```powershell
cd "C:\Users\WIN\Desktop\new project\frontend"
npm install
```

## 백엔드 실행

백엔드는 이미 설치가 완료되었습니다. 다음 명령으로 실행할 수 있습니다:

```powershell
cd "C:\Users\WIN\Desktop\new project\backend"
.\venv\Scripts\Activate.ps1
python main.py
```

백엔드는 `http://localhost:8000`에서 실행됩니다.

## 프론트엔드 실행

Node.js 설치 및 npm install 완료 후:

```powershell
cd "C:\Users\WIN\Desktop\new project\frontend"
npm run dev
```

프론트엔드는 `http://localhost:3000`에서 실행됩니다.

## 빠른 시작

1. **Node.js 설치** (아직 설치하지 않았다면)
2. **프론트엔드 패키지 설치**: `cd frontend && npm install`
3. **백엔드 실행**: `cd backend && .\venv\Scripts\Activate.ps1 && python main.py`
4. **프론트엔드 실행**: (새 터미널) `cd frontend && npm run dev`

## 문제 해결

### Node.js 설치 오류
- 관리자 권한으로 실행
- 바이러스 백신 일시 비활성화
- 이전 Node.js 버전이 있다면 제거 후 재설치

### npm install 오류
- PowerShell 실행 정책 확인: `Get-ExecutionPolicy`
- 필요한 경우: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
- npm 캐시 정리: `npm cache clean --force`

### Python 패키지 설치 오류
- 가상환경 활성화 확인
- pip 업그레이드: `python -m pip install --upgrade pip`



