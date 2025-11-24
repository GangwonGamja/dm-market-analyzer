# Git Push 수동 실행 가이드

## ✅ 완료된 작업

1. **루트 requirements.txt 생성** ✅
   - `backend/requirements.txt` 내용을 기반으로 생성
   - 오류를 유발할 수 있는 패키지 제거:
     - `newspaper3k` (metadata 오류 가능)
     - `requests-html` (의존성 문제 가능)
     - `selenium` (무거운 패키지, metadata 오류 가능)
   - 버전 고정:
     - `pandas==2.2.0` (>=2.2.0 → 고정)
     - `numpy==1.26.0` (>=2.0.0 → 1.26.0으로 다운그레이드, 호환성)

2. **keep_alive.py 생성** ✅
   - Render 무료 서버 24시간 유지 기능

3. **render.yaml 생성** ✅
   - Render 배포 설정

## 🔧 Git Push 수동 실행

Git이 PATH에 없어 자동 실행이 불가능합니다. 다음 명령을 수동으로 실행하세요:

### PowerShell에서 실행:

```powershell
# 프로젝트 루트로 이동
cd "C:\Users\WIN\Desktop\new project"

# 변경사항 확인
git status

# 모든 파일 추가
git add .

# 커밋
git commit -m "Add requirements.txt, keep_alive.py, and render.yaml for Render deployment"

# GitHub로 푸시
git push -u origin main --force
```

### 또는 Git Bash에서 실행:

```bash
cd "/c/Users/WIN/Desktop/new project"
git add .
git commit -m "Add requirements.txt, keep_alive.py, and render.yaml for Render deployment"
git push -u origin main --force
```

## 📋 생성/수정된 파일 목록

- ✅ `requirements.txt` (루트) - 새로 생성
- ✅ `backend/requirements.txt` - 기존 유지
- ✅ `backend/keep_alive.py` - 새로 생성
- ✅ `render.yaml` - 새로 생성
- ✅ `.gitignore` - 새로 생성
- ✅ `backend/core/config.py` - 포트 설정 개선
- ✅ `backend/main.py` - keep_alive import 추가

## ⚠️ 주의사항

1. **requirements.txt 위치**:
   - 루트에 `requirements.txt`가 있어야 Render가 자동으로 인식합니다.
   - `backend/requirements.txt`는 기존 파일로 유지됩니다.

2. **제거된 패키지**:
   - `newspaper3k`, `requests-html`, `selenium`은 제거되었습니다.
   - 실제 코드에서 사용되지 않는 것으로 확인되었습니다.

3. **버전 고정**:
   - `numpy==1.26.0`: numpy 2.0.0은 일부 패키지와 호환성 문제가 있을 수 있어 1.26.0으로 고정
   - `pandas==2.2.0`: 안정적인 버전으로 고정

## 🚀 Render 배포 준비 완료

모든 파일이 준비되었습니다. Git push 후 Render에서 배포를 진행하세요.

