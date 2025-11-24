# ETF Advisor 백엔드 (무료 API 기반)

무료 API를 사용하는 ETF 투자 어드바이저 백엔드입니다.

## 주요 특징

- ✅ **완전 무료**: FMP API 제거, 무료 API만 사용
- ✅ **Yahoo Finance**: yfinance로 가격 데이터 수집
- ✅ **Marketaux**: 무료 뉴스 API (선택사항)
- ✅ **CNN FGI**: Fear & Greed Index 스크래핑
- ✅ **In-memory 캐싱**: API 호출 최소화
- ✅ **FastAPI**: 빠르고 현대적인 API 프레임워크

## 데이터 소스

| 데이터 | 소스 | API Key 필요 | 제한 |
|--------|------|--------------|------|
| 가격 데이터 | Yahoo Finance (yfinance) | ❌ | 과도한 호출 시 일시적 제한 |
| 기술적 지표 | 서버 계산 (pandas/numpy) | ❌ | 없음 |
| 뉴스 | Marketaux API | ✅ (선택) | 일일 100회 (무료) |
| Fear & Greed Index | CNN FGI Scraper | ❌ | 없음 |

## 설치

```bash
# 가상환경 생성
python -m venv venv

# 가상환경 활성화 (Windows)
venv\Scripts\activate

# 가상환경 활성화 (Linux/Mac)
source venv/bin/activate

# 패키지 설치
pip install -r requirements.txt
```

## 환경변수 설정

`.env` 파일을 생성하고 다음을 추가하세요:

```env
# Marketaux API Key (선택사항, 뉴스 기능용)
MARKETAUX_API_KEY=your_api_key_here
```

자세한 내용은 [환경변수_설정_가이드.md](./환경변수_설정_가이드.md)를 참조하세요.

## 실행

```bash
# 개발 모드
python main.py

# 또는 uvicorn 직접 실행
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

서버가 실행되면 http://localhost:8000 에서 접근할 수 있습니다.

## API 엔드포인트

### ETF 가격

- `GET /etf/{symbol}/price` - 최신 가격
- `GET /etf/{symbol}/history?years=3` - 히스토리 (기본 3년)

### 기술적 지표

- `GET /etf/{symbol}/ma?days=200` - 이동평균 (20, 60, 120, 200)
- `GET /etf/{symbol}/rsi` - RSI (14일 기준)
- `GET /etf/{symbol}/macd` - MACD (12/26/9)
- `GET /etf/{symbol}/stochastic` - Stochastic (14일 + 3일 smoothing)
- `GET /etf/{symbol}/volatility?period=30` - 변동성
- `GET /etf/{symbol}/mdd` - MDD (Maximum Drawdown)

### 시장 데이터

- `GET /market/fgi` - Fear & Greed Index
- `GET /market/sentiment?symbol=VIG` - 종합 센티먼트 (뉴스 + FGI)

### 뉴스

- `GET /news?symbol=VIG&limit=20` - 뉴스 목록

## 예제

### 최신 가격 조회

```bash
curl http://localhost:8000/etf/VIG/price
```

### 3년치 히스토리

```bash
curl http://localhost:8000/etf/VIG/history?years=3
```

### RSI 데이터

```bash
curl http://localhost:8000/etf/VIG/rsi
```

### Fear & Greed Index

```bash
curl http://localhost:8000/market/fgi
```

## 캐싱

모든 데이터는 in-memory 캐시에 저장됩니다:

- **가격 데이터**: 15분
- **히스토리 데이터**: 30분
- **기술적 지표**: 15분
- **뉴스**: 15분
- **FGI**: 15분

캐시 통계는 `/health` 엔드포인트에서 확인할 수 있습니다.

## 프로젝트 구조

```
backend/
├── core/
│   ├── cache.py          # In-memory 캐싱 시스템
│   ├── config.py         # 설정 관리
│   └── database.py       # 데이터베이스 설정
├── services/
│   ├── yahoo_service.py  # Yahoo Finance 데이터
│   ├── indicator_service.py  # 기술적 지표 계산
│   ├── news_service.py   # Marketaux 뉴스 API
│   └── fgi_service.py   # Fear & Greed Index
├── routers/
│   ├── etf.py           # ETF 관련 엔드포인트
│   ├── market.py         # 시장 데이터 엔드포인트
│   └── news.py          # 뉴스 엔드포인트
├── main.py              # FastAPI 앱
└── requirements.txt     # 패키지 의존성
```

## 기술 스택

- **FastAPI**: 웹 프레임워크
- **yfinance**: Yahoo Finance 데이터
- **pandas/numpy**: 데이터 처리 및 기술적 지표 계산
- **SQLAlchemy**: 데이터베이스 ORM
- **requests**: HTTP 클라이언트

## 라이선스

이 프로젝트는 무료 API를 사용하므로 상업적 사용 시 각 API의 이용약관을 확인하세요.

