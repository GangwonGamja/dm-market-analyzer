# 네트워크 접근 가이드

## 현재 상태 분석

### ✅ 백엔드 설정 (다른 컴퓨터 접근 가능)
- **Host**: `0.0.0.0` (모든 네트워크 인터페이스에서 접근 가능)
- **Port**: `8000` (기본값)
- **CORS**: 모든 출처 허용 (`allow_origins=["*"]`)

### ⚠️ 프론트엔드 설정 (현재 문제)
- **API URL**: `http://localhost:8000` (하드코딩)
- **문제**: 다른 컴퓨터에서 접근 불가

## 다른 컴퓨터에서 접근하는 방법

### 방법 1: 같은 네트워크(LAN)에서 접근

#### 1단계: 현재 컴퓨터의 IP 주소 확인

**Windows PowerShell:**
```powershell
ipconfig
# IPv4 주소 확인 (예: 192.168.0.100)
```

**또는:**
```powershell
(Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike "*Loopback*"}).IPAddress
```

#### 2단계: 백엔드 실행 (이미 0.0.0.0으로 설정됨)

```powershell
cd "C:\Users\WIN\Desktop\new project"
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

#### 3단계: 프론트엔드 API URL 변경

**옵션 A: 환경 변수 사용 (권장)**

프로젝트 루트에 `.env` 파일 생성:
```
VITE_API_URL=http://192.168.0.100:8000
```
(192.168.0.100을 실제 IP 주소로 변경)

**옵션 B: api.ts 직접 수정**

`frontend/src/services/api.ts`:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://192.168.0.100:8000';
```

#### 4단계: 프론트엔드 실행

```powershell
cd frontend
npm run dev -- --host 0.0.0.0
```

#### 5단계: 다른 컴퓨터에서 접근

- 브라우저에서: `http://192.168.0.100:3000`
- (192.168.0.100을 실제 IP 주소로 변경)

### 방법 2: Render 배포 후 인터넷 접근

Render에 배포하면:
- 백엔드: `https://dm-backend.onrender.com`
- 프론트엔드 API URL을 Render URL로 변경

## 빠른 설정 스크립트

### Windows용 배치 파일 생성

`start_network.bat`:
```batch
@echo off
echo 현재 IP 주소 확인 중...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set IP=%%a
    set IP=!IP:~1!
    echo IP 주소: !IP!
    goto :found
)
:found
echo.
echo 백엔드 시작 중...
start "Backend" cmd /k "cd backend && uvicorn main:app --host 0.0.0.0 --port 8000"
timeout /t 3
echo.
echo 프론트엔드 시작 중...
echo API URL: http://%IP%:8000
cd frontend
set VITE_API_URL=http://%IP%:8000
npm run dev -- --host 0.0.0.0
```

## 방화벽 설정

다른 컴퓨터에서 접근하려면 Windows 방화벽에서 포트를 열어야 합니다:

### PowerShell (관리자 권한):

```powershell
# 포트 8000 (백엔드) 열기
New-NetFirewallRule -DisplayName "Backend API" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow

# 포트 3000 (프론트엔드) 열기
New-NetFirewallRule -DisplayName "Frontend Dev" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

### 또는 GUI로:
1. Windows 설정 → 네트워크 및 인터넷 → Windows 방화벽
2. 고급 설정 → 인바운드 규칙 → 새 규칙
3. 포트 선택 → TCP → 특정 로컬 포트: 8000, 3000
4. 연결 허용 → 모든 프로필 → 이름 지정

## 요약

### 현재 설정으로 다른 컴퓨터 접근 가능 여부

| 시나리오 | 백엔드 | 프론트엔드 | 접근 가능? |
|---------|--------|-----------|----------|
| 같은 네트워크 (LAN) | ✅ 0.0.0.0 | ❌ localhost | ⚠️ API URL 변경 필요 |
| 인터넷 (Render 배포) | ✅ Render URL | ❌ localhost | ⚠️ API URL 변경 필요 |
| 같은 컴퓨터 | ✅ localhost | ✅ localhost | ✅ 가능 |

### 해결 방법

1. **같은 네트워크**: 프론트엔드 API URL을 서버 IP로 변경
2. **인터넷**: Render 배포 후 Render URL 사용
3. **자동화**: 환경 변수로 API URL 설정

