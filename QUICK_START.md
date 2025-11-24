# 🚀 빠른 실행 가이드

## 한 줄 요약

### 백엔드 실행
```powershell
.\start_backend.ps1
```

### 프론트엔드 실행 (Node.js 필요)
```powershell
.\start_frontend.ps1
```

---

## 📋 실행 체크리스트

- [ ] 백엔드 실행 스크립트 실행 (`.\start_backend.ps1`)
- [ ] 백엔드가 http://localhost:8000 에서 실행되는지 확인
- [ ] Node.js 설치 확인 (`node --version`)
- [ ] 프론트엔드 실행 스크립트 실행 (`.\start_frontend.ps1`)
- [ ] 프론트엔드가 http://localhost:3000 에서 실행되는지 확인
- [ ] 브라우저에서 http://localhost:3000 접속

---

## 🎯 실행 순서

1. **터미널 1 - 백엔드 실행**
   ```
   .\start_backend.ps1
   ```

2. **터미널 2 - 프론트엔드 실행** (새 터미널에서)
   ```
   .\start_frontend.ps1
   ```

3. **브라우저에서 접속**
   - http://localhost:3000

---

## 💡 실행 스크립트 위치

프로젝트 루트 디렉토리에 있습니다:
- `start_backend.ps1` - 백엔드 실행
- `start_frontend.ps1` - 프론트엔드 실행
- `install_frontend.ps1` - 프론트엔드 패키지 설치



