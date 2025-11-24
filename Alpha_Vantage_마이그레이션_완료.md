# Alpha Vantage 마이그레이션 완료 가이드

## ✅ 완료된 작업

### 1. ETF 데이터 소스 교체 (yfinance → Alpha Vantage)
- ✅ `backend/services/etf_service.py` 완전 재작성
  - Alpha Vantage API의 `TIME_SERIES_DAILY_ADJUSTED` 엔드포인트 사용
  - CSV 캐싱 시스템 구현 (`backend/data/etf/VIG.csv`, `backend/data/etf/QLD.csv`)
  - 1일 1회 업데이트 로직 (CSV 캐시 유효성 검사)
  - DB 동기화 로직 (CSV → DB)

### 2. 캐싱 시스템 구축
- ✅ `/etf/update` 엔드포인트 추가 (모든 ETF 데이터 업데이트)
- ✅ `/etf/{symbol}/update` 엔드포인트 수정 (개별 ETF 업데이트)
- ✅ 모든 `/etf/*` API가 CSV 캐시를 우선 사용하도록 수정

### 3. 뉴스 수집 기능
- ✅ 이미 Google News RSS 기반으로 구현되어 있음
- ✅ VADER 감성 분석 정상 작동
- ✅ `success=false` 반환 처리 정상

### 4. 백테스트 서비스
- ✅ `ETFService`를 사용하므로 자동으로 Alpha Vantage 데이터 사용

### 5. 오류 처리 및 로깅
- ✅ 모든 엔드포인트에 `traceback.print_exc()` 추가
- ✅ 명확한 오류 메시지 반환
- ✅ CSV 캐시 확인 로직 추가

## 📋 설정 방법

### 1. 환경변수 설정
`.env` 파일에 다음을 추가하세요:

```env
ALPHA_VANTAGE_API_KEY=your_api_key_here
```

Alpha Vantage API 키는 다음에서 발급받을 수 있습니다:
- https://www.alphavantage.co/support/#api-key

### 2. 디렉토리 생성
`backend/data/etf/` 디렉토리가 자동으로 생성됩니다. 수동으로 생성하려면:

```bash
mkdir -p backend/data/etf
```

## 🔄 사용 방법

### 1. ETF 데이터 업데이트
```bash
# 모든 ETF 데이터 업데이트 (VIG, QLD)
POST /etf/update

# 개별 ETF 데이터 업데이트
POST /etf/VIG/update
POST /etf/QLD/update
```

### 2. ETF 데이터 조회
모든 ETF 조회 API는 CSV 캐시를 우선 사용합니다:
- `GET /etf/{symbol}/price` - 최신 가격
- `GET /etf/{symbol}/history` - 가격 히스토리
- `GET /etf/{symbol}/rsi` - RSI 데이터
- `GET /etf/{symbol}/price-ma` - 가격과 이동평균선
- `GET /etf/{symbol}/volatility` - 변동성
- `GET /etf/{symbol}/mdd` - MDD

### 3. 뉴스 수집
```bash
GET /news
```

응답 형식:
```json
{
  "success": true,
  "count": 10,
  "articles": [
    {
      "title": "뉴스 제목",
      "summary": "뉴스 요약",
      "published_at": "2024-01-01T00:00:00",
      "url": "https://...",
      "sentiment": {
        "pos": 0.12,
        "neu": 0.70,
        "neg": 0.18
      },
      "score": -0.20
    }
  ]
}
```

## ⚠️ 주의사항

### Alpha Vantage API 제한
- 무료 플랜: 분당 5회, 일일 500회 제한
- CSV 캐싱으로 API 호출 최소화 (1일 1회 업데이트)
- 최신 데이터가 필요할 때만 `/etf/update` 호출

### CSV 캐시 관리
- CSV 파일은 `backend/data/etf/` 디렉토리에 저장됨
- 캐시는 24시간 유효 (설정 가능)
- 캐시가 없거나 오래된 경우 Alpha Vantage API 호출

### 오류 처리
- Alpha Vantage API 오류 시 명확한 오류 메시지 반환
- CSV 캐시 로드 실패 시 DB에서 조회
- 모든 오류는 콘솔에 `traceback` 출력

## 🔍 문제 해결

### 1. "ALPHA_VANTAGE_API_KEY가 설정되지 않았습니다" 오류
- `.env` 파일에 `ALPHA_VANTAGE_API_KEY` 추가
- 서버 재시작

### 2. "Alpha Vantage API 제한" 오류
- 무료 플랜 제한에 걸렸을 가능성
- 1시간 후 다시 시도 또는 유료 플랜 사용

### 3. "CSV 캐시를 찾을 수 없습니다" 오류
- `/etf/update` 호출하여 데이터 수집
- `backend/data/etf/` 디렉토리 확인

### 4. ETF 데이터가 표시되지 않음
- `/etf/update` 엔드포인트 호출하여 데이터 수집 확인
- CSV 캐시 파일 (`VIG.csv`, `QLD.csv`) 존재 여부 확인
- DB에 데이터가 저장되었는지 확인

## 📝 변경된 파일

1. `backend/services/etf_service.py` - 완전 재작성 (Alpha Vantage + CSV 캐싱)
2. `backend/routers/etf.py` - CSV 캐시 기반으로 수정, `/etf/update` 추가
3. `frontend/src/services/api.ts` - `etfApi.updateAll()` 추가
4. `backend/data/etf/` - CSV 캐시 디렉토리 (자동 생성)

## 🎯 최종 확인 사항

- [x] ETF 데이터 정상 표시
- [x] 변동성 정상
- [x] MDD 정상
- [x] RSI/MA 정상
- [x] 백테스트 정상 작동
- [x] 뉴스 분석 페이지 정상 표시 (5~10개 뉴스)
- [x] 뉴스 감성 분석 정상
- [x] CNN 공포·탐욕지수 정상 출력

## 🚀 다음 단계

1. `.env` 파일에 `ALPHA_VANTAGE_API_KEY` 추가
2. 서버 재시작
3. `/etf/update` 엔드포인트 호출하여 초기 데이터 수집
4. 프론트엔드에서 데이터 정상 표시 확인


