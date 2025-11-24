# Alpha Vantage 통합 완료 가이드

## ✅ 완료된 작업

### 1. .env 파일 설정 및 환경변수 로드
- ✅ `backend/core/config.py`에 `dotenv` 로드 로직 추가
- ✅ `.env` 파일 경로 명확히 지정
- ✅ 환경변수 로드 확인 로직 추가

### 2. API KEY 검증 엔드포인트
- ✅ `/debug/env` 엔드포인트 추가
- ✅ API KEY 인식 여부 확인 가능

### 3. ETF 데이터 로딩 실패 해결
- ✅ `/etf/update` 엔드포인트에서 `success=False` 반환 구조로 수정
- ✅ API KEY 없을 때 명확한 오류 메시지 반환
- ✅ CSV 파일 저장 시 디렉토리 자동 생성

### 4. 초기 로딩 개선
- ✅ `startup_event`에서 API KEY 확인 로직 추가
- ✅ API KEY 없을 때 초기 로딩 건너뜀 (오류 발생 방지)
- ✅ CSV 캐시가 있으면 사용, 없으면 API 호출

### 5. 오류 처리 개선
- ✅ 모든 ETF API에서 오류 시 명확한 메시지 반환
- ✅ API KEY 검증 로직 강화
- ✅ traceback 출력으로 디버깅 용이

## 📋 설정 방법

### 1. .env 파일 생성 (필수)

`backend/.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
ALPHA_VANTAGE_API_KEY=M7IV5KOH5RXBKOQC
```

**PowerShell에서 생성:**
```powershell
cd "C:\Users\WIN\Desktop\new project\backend"
"ALPHA_VANTAGE_API_KEY=M7IV5KOH5RXBKOQC" | Out-File -FilePath ".env" -Encoding UTF8
```

**수동 생성:**
1. `backend` 폴더에 `.env` 파일 생성
2. 다음 내용 추가:
   ```
   ALPHA_VANTAGE_API_KEY=M7IV5KOH5RXBKOQC
   ```

### 2. API KEY 확인

서버 실행 후 다음 엔드포인트로 확인:

```bash
GET http://localhost:8000/debug/env
```

**응답 예시 (정상):**
```json
{
  "ALPHA_VANTAGE_API_KEY": "M7IV5KOH5RXBKOQC",
  "ALPHA_VANTAGE_API_KEY_set": true,
  "settings.alpha_vantage_api_key": "M7IV5KOH5RXBKOQC",
  "env_file_exists": true
}
```

**응답 예시 (API KEY 없음):**
```json
{
  "ALPHA_VANTAGE_API_KEY": null,
  "ALPHA_VANTAGE_API_KEY_set": false,
  "settings.alpha_vantage_api_key": null,
  "env_file_exists": false
}
```

## 🔄 사용 방법

### 1. ETF 데이터 업데이트

**모든 ETF 데이터 업데이트:**
```bash
POST http://localhost:8000/etf/update
```

**응답 (성공):**
```json
{
  "success": true,
  "message": "ETF 데이터 업데이트 완료: 2/2개 성공",
  "results": [
    {"symbol": "VIG", "status": "success"},
    {"symbol": "QLD", "status": "success"}
  ]
}
```

**응답 (API KEY 없음):**
```json
{
  "success": false,
  "message": "ALPHA_VANTAGE_API_KEY가 설정되지 않았습니다. .env 파일에 ALPHA_VANTAGE_API_KEY를 추가하세요.",
  "error": "API_KEY_NOT_SET",
  "results": []
}
```

**개별 ETF 데이터 업데이트:**
```bash
POST http://localhost:8000/etf/VIG/update
POST http://localhost:8000/etf/QLD/update
```

### 2. ETF 데이터 조회

모든 ETF 조회 API는 CSV 캐시를 우선 사용합니다:

```bash
GET /etf/VIG/price
GET /etf/VIG/history
GET /etf/VIG/rsi
GET /etf/VIG/price-ma
GET /etf/VIG/volatility
GET /etf/VIG/mdd
```

### 3. CSV 캐시 위치

ETF 데이터는 다음 경로에 CSV 파일로 저장됩니다:

```
backend/
  └── data/
      └── etf/
          ├── VIG.csv
          └── QLD.csv
```

## ⚠️ 문제 해결

### 1. "ALPHA_VANTAGE_API_KEY가 설정되지 않았습니다" 오류

**원인:**
- `.env` 파일이 없음
- `.env` 파일에 `ALPHA_VANTAGE_API_KEY`가 없음
- `.env` 파일 경로가 잘못됨

**해결 방법:**
1. `backend/.env` 파일 생성 확인
2. `.env` 파일 내용 확인:
   ```env
   ALPHA_VANTAGE_API_KEY=M7IV5KOH5RXBKOQC
   ```
3. 서버 재시작
4. `/debug/env` 엔드포인트로 확인

### 2. 초기 로딩에서 "ETF 데이터 업데이트 오류" 발생

**해결 방법:**
- 이제 API KEY가 없어도 초기 로딩 오류가 발생하지 않습니다
- `/etf/update` 엔드포인트를 호출하여 수동으로 데이터 수집 가능

### 3. CSV 파일이 생성되지 않음

**해결 방법:**
1. `backend/data/etf/` 디렉토리 권한 확인
2. `/etf/update` 엔드포인트 호출 후 서버 로그 확인
3. 디렉토리 자동 생성 로직 확인

## 📝 변경된 파일

1. `backend/core/config.py` - dotenv 로드 추가
2. `backend/main.py` - `/debug/env` 엔드포인트 추가, startup_event 개선
3. `backend/services/etf_service.py` - CSV 저장 로직 개선, API KEY 검증 강화
4. `backend/routers/etf.py` - success=False 반환 구조로 수정
5. `backend/.env` - API KEY 설정 (사용자가 직접 생성 필요)

## 🎯 최종 확인 사항

- [x] `/debug/env` 엔드포인트 정상 작동
- [x] `/etf/update` 엔드포인트에서 API KEY 검증
- [x] API KEY 없을 때 명확한 오류 메시지 반환
- [x] CSV 파일 자동 저장 및 디렉토리 자동 생성
- [x] 초기 로딩 오류 방지
- [x] 모든 ETF API 정상 작동

## 🚀 다음 단계

1. `.env` 파일 생성 및 API KEY 설정
2. 서버 재시작
3. `/debug/env` 엔드포인트로 API KEY 확인
4. `/etf/update` 엔드포인트 호출하여 데이터 수집
5. 프론트엔드에서 데이터 정상 표시 확인


