# DM 시황 분석기 - Windows EXE 빌드 및 배포

## 🚀 빠른 시작

### 전체 빌드 (권장)
```batch
build_exe.bat
```

### 개별 빌드
- 백엔드만: `build_backend.bat`
- 프론트엔드만: `build_frontend.bat`

## 📦 빌드 결과물

빌드 완료 후 다음 파일이 생성됩니다:

```
build/
└── backend.exe              # 백엔드 서버 실행파일

frontend/dist_electron/
└── DM 시황 분석기 Setup.exe  # 프론트엔드 설치 파일
```

## 🎯 사용 방법

1. **빌드된 파일 배치**
   - `backend.exe`와 `DM 시황 분석기 Setup.exe`를 같은 폴더에 배치
   - 또는 설치 시 자동으로 배치됨

2. **프로그램 실행**
   - `DM 시황 분석기 Setup.exe`를 실행하여 설치
   - 설치된 프로그램 실행 시 백엔드가 자동으로 시작됨

## 🔄 GitHub 릴리즈 자동 배포

### 태그로 릴리즈 생성
```bash
git tag v1.0.0
git push origin v1.0.0
```

### 수동 워크플로우 실행
1. GitHub → Actions 탭
2. "Build and Release Windows EXE" 선택
3. "Run workflow" 클릭
4. 버전 입력 (예: v1.0.0)

## 📚 상세 가이드

자세한 내용은 [EXE_BUILD_GUIDE.md](./EXE_BUILD_GUIDE.md)를 참조하세요.

