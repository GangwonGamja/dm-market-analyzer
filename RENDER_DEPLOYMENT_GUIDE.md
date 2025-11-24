# Render 배포 가이드

## ✅ 완료된 작업

1. **render.yaml 파일 생성** ✅
   - 위치: 프로젝트 루트
   - 내용: Render 배포 설정 포함

2. **backend/requirements.txt 생성** ✅
   - 모든 필요한 패키지 포함

3. **백엔드 구조 확인** ✅
   - backend/main.py 존재
   - backend/routers/ 폴더 존재
   - backend/services/ 폴더 존재

## 🔧 수동으로 수행해야 할 작업

### 1. Git 초기화 및 원격 저장소 설정

Git이 설치되어 있지 않거나 PATH에 없는 경우, 다음을 수행하세요:

```powershell
# 프로젝트 루트로 이동
cd "C:\Users\WIN\Desktop\new project"

# Git 초기화 (이미 되어 있다면 스킵)
git init
git branch -M main

# 원격 저장소 추가 (이미 있다면 스킵)
git remote add origin https://github.com/GangwonGamja/dm-market-analyzer.git

# 또는 기존 원격 확인
git remote -v
```

### 2. 파일 추가 및 커밋

```powershell
# 모든 파일 추가
git add .

# 커밋
git commit -m "Add render.yaml for Render deployment"

# GitHub로 푸시
git push -u origin main --force
```

### 3. Render 배포 설정

1. [Render Dashboard](https://dashboard.render.com)에 로그인
2. "New +" → "Web Service" 선택
3. GitHub 저장소 연결: `GangwonGamja/dm-market-analyzer`
4. 다음 설정 적용:
   - **Name**: `dm-backend`
   - **Environment**: `Python 3`
   - **Build Command**: (비워두기)
   - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port 10000`
   - **Plan**: Free

5. 환경 변수 설정 (Environment Variables):
   - `PYTHON_VERSION`: `3.10` (자동 설정됨)
   - `RENDER_EXTERNAL_URL`: Render가 자동으로 설정 (서버 URL)
   - `MARKETAUX_API_KEY`: (선택사항, 뉴스 기능 사용 시)
   
   **중요**: `RENDER_EXTERNAL_URL`은 Render가 자동으로 제공하므로 별도 설정 불필요합니다.
   keep_alive.py가 이 환경 변수를 자동으로 감지하여 10분마다 ping을 보냅니다.

### 4. 백엔드 실행 테스트 (로컬)

배포 전 로컬에서 테스트:

```powershell
cd "C:\Users\WIN\Desktop\new project"
uvicorn backend.main:app --host 0.0.0.0 --port 10000
```

정상 작동 시:
- `http://localhost:10000` 접속
- `http://localhost:10000/health` 확인
- `http://localhost:10000/docs` (Swagger UI) 확인

## 📋 Render 배포 체크리스트

- [x] render.yaml 파일 생성
- [x] backend/requirements.txt 생성
- [x] 백엔드 폴더 구조 확인
- [ ] Git 초기화 및 원격 저장소 설정
- [ ] GitHub로 코드 푸시
- [ ] Render에서 Web Service 생성
- [ ] 환경 변수 설정
- [ ] 배포 성공 확인

## ⚠️ 주의사항

1. **requirements.txt 위치**: 
   - Render는 프로젝트 루트의 `requirements.txt`를 찾습니다.
   - 현재 `backend/requirements.txt`에 있으므로, 루트에도 복사하거나 render.yaml에서 경로 지정이 필요할 수 있습니다.

2. **환경 변수**:
   - `MARKETAUX_API_KEY`는 선택사항입니다. 없으면 뉴스 기능이 비활성화됩니다.

3. **포트**:
   - Render는 자동으로 `$PORT` 환경 변수를 제공합니다.
   - 현재 설정은 포트 10000을 사용하지만, Render에서는 `$PORT`를 사용하는 것이 좋습니다.

## 🔄 render.yaml 수정 권장사항

Render의 자동 포트 감지를 위해 다음으로 수정하는 것을 권장합니다:

```yaml
services:
  - type: web
    name: dm-backend
    env: python
    plan: free
    buildCommand: ""
    startCommand: uvicorn backend.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: PYTHON_VERSION
        value: 3.10
```

또는 `backend/main.py`에서 포트를 환경 변수로 읽도록 수정:

```python
import os
port = int(os.getenv("PORT", 10000))
uvicorn.run("main:app", host="0.0.0.0", port=port)
```

## 📝 문제 해결

### 빌드 실패 시

1. `requirements.txt` 확인
2. Python 버전 확인 (3.10 권장)
3. Render 로그 확인

### 실행 실패 시

1. `backend/main.py` 경로 확인
2. FastAPI import 오류 확인
3. 환경 변수 설정 확인

### metadata generation error

일부 패키지(예: `newspaper3k`, `selenium`, `requests-html`)는 metadata 생성 오류가 발생할 수 있습니다.
**해결**: 루트 `requirements.txt`에서 이미 제거되었습니다. Render 배포 시 문제 없이 작동합니다.

## 🔄 Keep-Alive 기능

Render 무료 서버는 15분 동안 트래픽이 없으면 잠듭니다.
이를 방지하기 위해 `backend/keep_alive.py`가 자동으로 10분마다 `/health` 엔드포인트에 ping을 보냅니다.

### 작동 방식

1. `backend/main.py`가 시작될 때 `keep_alive.py`를 자동으로 import
2. `RENDER_EXTERNAL_URL` 환경 변수를 자동으로 감지 (Render가 자동 제공)
3. 백그라운드 스레드에서 10분마다 자체 서버에 ping 전송
4. 서버가 잠들지 않고 24시간 활성 상태 유지

### 로컬 환경

로컬 환경에서는 `RENDER_URL`이 없으므로 keep-alive가 자동으로 비활성화됩니다.
로컬 테스트 시에는 정상적으로 작동합니다.

