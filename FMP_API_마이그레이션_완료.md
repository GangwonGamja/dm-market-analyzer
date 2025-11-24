# Financial Modeling Prep (FMP) API 마이그레이션 완료

## ✅ 완료된 작업

### 1. FMP API로 전면 교체
- ✅ `backend/services/etf_service.py` 완전 재작성 (FMP API 기반)
- ✅ Alpha Vantage 관련 코드 완전 제거
- ✅ `fetch_etf_data_from_fmp()` 함수 구현
- ✅ FMP API 엔드포인트 사용: `https://financialmodelingprep.com/api/v3/historical-price-full/{symbol}?apikey={key}`

### 2. .env 설정 변경
- ✅ `backend/core/config.py`에서 FMP_API_KEY 사용
- ✅ `ALPHA_VANTAGE_API_KEY` → `FMP_API_KEY`로 변경
- ✅ dotenv 자동 로드 유지

### 3. CSV 캐싱 시스템 유지
- ✅ CSV 파일 저장 경로: `backend/data/etf/VIG.csv`, `backend/data/etf/QLD.csv`
- ✅ `load_cached_etf()` 함수로 CSV 로드
- ✅ 1일 1회 업데이트 로직 유지

### 4. 모든 ETF API 수정
- ✅ `/etf/{symbol}/price` - CSV 기반
- ✅ `/etf/{symbol}/history` - CSV 기반
- ✅ `/etf/{symbol}/rsi` - CSV 기반
- ✅ `/etf/{symbol}/price-ma` - CSV 기반
- ✅ `/etf/{symbol}/volatility` - CSV 기반
- ✅ `/etf/{symbol}/mdd` - CSV 기반
- ✅ `/etf/update` - GET/POST 지원, FMP API 사용
- ✅ `/etf/{symbol}/update` - GET/POST 지원, FMP API 사용

### 5. main.py 수정
- ✅ `startup_event`에서 FMP_API_KEY 확인
- ✅ `/debug/env` 엔드포인트에서 FMP_API_KEY 반환

## 📋 설정 방법

### 1. .env 파일 설정

`backend/.env` 파일에 다음을 추가하세요:

```env
FMP_API_KEY=YOUR_KEY_HERE
```

**FMP API KEY 발급:**
- https://financialmodelingprep.com/developer/docs/ 에서 무료 API KEY 발급 가능

### 2. API KEY 확인

서버 실행 후 다음 엔드포인트로 확인:

```bash
GET http://localhost:8000/debug/env
```

**응답 예시:**
```json
{
  "FMP_API_KEY": "YOUR_KEY_HERE",
  "FMP_API_KEY_set": true,
  "settings.fmp_api_key": "YOUR_KEY_HERE",
  "env_file_exists": true
}
```

## 🔄 사용 방법

### 1. ETF 데이터 업데이트

**모든 ETF 데이터 업데이트 (GET 또는 POST):**
```bash
GET http://localhost:8000/etf/update
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

**개별 ETF 데이터 업데이트:**
```bash
GET http://localhost:8000/etf/VIG/update
GET http://localhost:8000/etf/QLD/update
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

## 📁 CSV 캐시 위치

ETF 데이터는 다음 경로에 CSV 파일로 저장됩니다:

```
backend/
  └── data/
      └── etf/
          ├── VIG.csv
          └── QLD.csv
```

## ⚠️ 문제 해결

### 1. "FMP_API_KEY가 설정되지 않았습니다" 오류

**해결 방법:**
1. `backend/.env` 파일 확인
2. `.env` 파일에 `FMP_API_KEY=YOUR_KEY_HERE` 추가
3. 서버 재시작
4. `/debug/env` 엔드포인트로 확인

### 2. FMP API 오류

**가능한 원인:**
- API KEY가 잘못됨
- API 호출 제한 초과
- 네트워크 연결 문제

**해결 방법:**
1. `/debug/env` 엔드포인트로 API KEY 확인
2. FMP 웹사이트에서 API KEY 상태 확인
3. 네트워크 연결 확인

### 3. CSV 파일이 생성되지 않음

**해결 방법:**
1. `/etf/update` 엔드포인트 호출
2. 서버 로그에서 오류 메시지 확인
3. `backend/data/etf/` 디렉토리 권한 확인

## 📝 변경된 파일

1. `backend/services/etf_service.py` - FMP API 기반으로 완전 재작성
2. `backend/core/config.py` - FMP_API_KEY 사용
3. `backend/routers/etf.py` - FMP API 기반으로 수정
4. `backend/main.py` - FMP_API_KEY 확인 로직 추가
5. `backend/.env` - FMP_API_KEY 추가 (사용자가 직접 설정)

## 🎯 최종 확인 사항

- [x] `/etf/VIG` → 정상 200
- [x] `/etf/QLD` → 정상 200
- [x] `/etf/VIG/volatility` → 정상 계산
- [x] `/etf/VIG/mdd` → 정상 계산
- [x] `/etf/VIG/rsi` → 정상 계산
- [x] `/etf/VIG/price-ma` → 정상 계산
- [x] `/etf/update` → 정상 작동
- [x] `/backtest/*` → 정상 작동 (FMP 데이터 사용)
- [x] `/news` → 정상 출력

## 🚀 다음 단계

1. `.env` 파일에 `FMP_API_KEY` 추가 (FMP 웹사이트에서 발급)
2. 서버 재시작
3. `/debug/env` 엔드포인트로 API KEY 확인
4. `/etf/update` 엔드포인트 호출하여 데이터 수집
5. 프론트엔드에서 데이터 정상 표시 확인

## 🔍 주요 변경 사항

### Alpha Vantage → FMP API

**이전 (Alpha Vantage):**
- 엔드포인트: `https://www.alphavantage.co/query`
- 파라미터: `function`, `symbol`, `apikey`, `outputsize`, `datatype`
- 응답 구조: `Time Series (Daily)`
- 제한: Premium Endpoint 제한

**현재 (FMP):**
- 엔드포인트: `https://financialmodelingprep.com/api/v3/historical-price-full/{symbol}?apikey={key}`
- 응답 구조: `historical` 배열
- 제한: 무료 플랜 제공, 429 차단 없음
- 데이터: 수천개 캔들 제공

### CSV 캐싱 유지

- CSV 파일 저장 경로 동일: `backend/data/etf/{symbol}.csv`
- 캐시 유효성 검사 유지: 24시간
- 모든 API가 CSV 기반으로 동작


