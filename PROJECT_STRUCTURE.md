# 프로젝트 구조

## 전체 프로젝트 구조

```
.
├── backend/                      # FastAPI 백엔드
│   ├── core/                     # 핵심 설정
│   │   ├── __init__.py
│   │   ├── config.py             # 설정 관리
│   │   └── database.py           # 데이터베이스 설정 및 모델
│   ├── services/                 # 비즈니스 로직
│   │   ├── __init__.py
│   │   ├── etf_service.py        # ETF 데이터 수집 및 관리
│   │   ├── indicator_service.py  # RSI, MA 계산
│   │   ├── sentiment_service.py  # Fear & Greed Index 처리
│   │   ├── signal_service.py     # 시그널 생성 로직
│   │   └── backtest_service.py   # 백테스트 로직
│   ├── routers/                  # API 라우터
│   │   ├── __init__.py
│   │   ├── market.py             # 시장 관련 API
│   │   ├── etf.py                # ETF 관련 API
│   │   ├── signal.py             # 시그널 관련 API
│   │   └── backtest.py           # 백테스트 API
│   ├── models/                   # 데이터 모델
│   │   ├── __init__.py
│   │   └── schemas.py            # Pydantic 스키마
│   ├── main.py                   # FastAPI 앱 진입점
│   ├── scheduler.py              # 데이터 업데이트 스케줄러
│   ├── requirements.txt          # Python 의존성
│   └── .env.example              # 환경 변수 예제
│
├── frontend/                     # React + Vite 프론트엔드
│   ├── src/
│   │   ├── components/           # 재사용 가능한 컴포넌트
│   │   │   ├── common/           # 공통 컴포넌트
│   │   │   │   ├── Layout.tsx    # 레이아웃 컴포넌트
│   │   │   │   ├── Sidebar.tsx   # 사이드바
│   │   │   │   ├── Topbar.tsx    # 상단바
│   │   │   │   ├── Card.tsx      # 카드 컴포넌트
│   │   │   │   └── Loading.tsx   # 로딩 컴포넌트
│   │   │   └── charts/           # 차트 컴포넌트
│   │   │       ├── PriceChart.tsx      # 가격 차트
│   │   │       ├── IndicatorChart.tsx  # 지표 차트
│   │   │       └── BacktestChart.tsx   # 백테스트 차트
│   │   ├── pages/                # 페이지 컴포넌트
│   │   │   ├── Dashboard.tsx     # 대시보드 페이지
│   │   │   ├── ETFAnalysis.tsx   # ETF 분석 페이지
│   │   │   ├── MarketSentiment.tsx    # 시장 심리 페이지
│   │   │   ├── SwitchingSignal.tsx    # 스위칭 시그널 페이지
│   │   │   ├── Backtest.tsx      # 백테스트 페이지
│   │   │   └── Settings.tsx      # 설정 페이지
│   │   ├── services/             # API 서비스
│   │   │   └── api.ts            # API 클라이언트
│   │   ├── styles/               # 스타일
│   │   │   └── globals.css       # 전역 스타일
│   │   ├── App.tsx               # 메인 앱 컴포넌트
│   │   └── main.tsx              # 앱 진입점
│   ├── index.html                # HTML 템플릿
│   ├── package.json              # npm 의존성
│   ├── vite.config.ts            # Vite 설정
│   ├── tailwind.config.js        # TailwindCSS 설정
│   ├── postcss.config.js         # PostCSS 설정
│   ├── tsconfig.json             # TypeScript 설정
│   └── tsconfig.node.json        # Node TypeScript 설정
│
├── .gitignore                    # Git 무시 파일
├── README.md                     # 프로젝트 문서
└── PROJECT_STRUCTURE.md          # 프로젝트 구조 문서
```

## 백엔드 구조

### Core 모듈
- **config.py**: 환경 변수 및 설정 관리
- **database.py**: SQLAlchemy 데이터베이스 설정 및 모델 정의

### Services 모듈
- **etf_service.py**: ETF 데이터 수집(yfinance), 저장, 조회
- **indicator_service.py**: 기술적 지표 계산 (RSI, MA200)
- **sentiment_service.py**: Fear & Greed Index 수집 및 저장
- **signal_service.py**: 시장 상태 판단 및 스위칭 시그널 생성
- **backtest_service.py**: 백테스트 로직 구현

### Routers 모듈
- **market.py**: 시장 관련 API (/market/*)
- **etf.py**: ETF 관련 API (/etf/*)
- **signal.py**: 시그널 관련 API (/signal/*)
- **backtest.py**: 백테스트 API (/backtest/*)

### Models 모듈
- **schemas.py**: Pydantic 데이터 모델 정의

## 프론트엔드 구조

### Components
- **common/**: 재사용 가능한 공통 컴포넌트
  - Layout: 전체 레이아웃 구조
  - Sidebar: 좌측 메뉴
  - Topbar: 상단 헤더
  - Card: 카드 컴포넌트
  - Loading: 로딩 및 스켈레톤 UI
- **charts/**: 차트 컴포넌트
  - PriceChart: 가격 및 이동평균 차트
  - IndicatorChart: RSI 및 FGI 차트
  - BacktestChart: 백테스트 결과 차트

### Pages
- **Dashboard**: 대시보드 (시장 상태, 추천 액션, 차트)
- **ETFAnalysis**: ETF 분석 (가격 추세, RSI, 변동성)
- **MarketSentiment**: 시장 심리 (Fear & Greed Index)
- **SwitchingSignal**: 스위칭 시그널 (추천 액션)
- **Backtest**: 백테스트 (전략 비교)
- **Settings**: 설정 (API 키, 업데이트 주기)

### Services
- **api.ts**: Axios 기반 API 클라이언트

## 데이터베이스 스키마

### ETFPrice 테이블
- id: Primary Key
- symbol: ETF 심볼 (VIG, QLD)
- date: 날짜
- open, high, low, close: 가격 데이터
- volume: 거래량
- created_at: 생성일시

### FearGreedIndex 테이블
- id: Primary Key
- date: 날짜
- value: Fear & Greed Index 값 (0-100)
- classification: 분류 (Extreme Fear, Fear, Neutral, Greed, Extreme Greed)
- created_at: 생성일시

## API 엔드포인트

### ETF 관련
- `GET /etf/{symbol}/price` - 최신 가격
- `GET /etf/{symbol}/history?days={days}` - 가격 히스토리
- `GET /etf/{symbol}/price-ma` - 가격 + 200MA
- `GET /etf/{symbol}/rsi` - RSI 데이터
- `POST /etf/{symbol}/update` - 데이터 업데이트

### 시장 관련
- `GET /market/status` - 시장 상태
- `GET /market/fear-greed` - Fear & Greed Index
- `GET /market/fear-greed/history?days={days}` - FGI 히스토리

### 시그널 관련
- `POST /signal/generate` - 스위칭 시그널 생성
- `GET /signal/market-status` - 시장 상태

### 백테스트 관련
- `POST /backtest/run` - 백테스트 실행



