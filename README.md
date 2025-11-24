# VIG-QLD 스위칭 투자 어드바이저

VIG-QLD 스위칭 기반 주식 투자 어드바이저 프로그램입니다.

## 프로젝트 구조

```
.
├── backend/                 # FastAPI 백엔드
│   ├── core/               # 설정 및 데이터베이스
│   ├── services/           # 비즈니스 로직
│   ├── routers/            # API 라우터
│   ├── models/             # 데이터 모델
│   ├── main.py             # FastAPI 앱 진입점
│   ├── scheduler.py        # 데이터 업데이트 스케줄러
│   └── requirements.txt    # Python 의존성
│
├── frontend/               # React + Vite 프론트엔드
│   ├── src/
│   │   ├── components/     # 재사용 가능한 컴포넌트
│   │   │   ├── common/     # 공통 컴포넌트
│   │   │   └── charts/     # 차트 컴포넌트
│   │   ├── pages/          # 페이지 컴포넌트
│   │   ├── services/       # API 서비스
│   │   └── styles/         # 스타일
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

## 기술 스택

### 백엔드
- FastAPI
- SQLAlchemy (SQLite)
- yfinance (ETF 데이터 수집)
- pandas, numpy (데이터 처리)

### 프론트엔드
- React 18
- TypeScript
- Vite
- TailwindCSS
- Recharts (차트)
- React Router
- Axios

## 설치 및 실행

### 백엔드 설정

1. 백엔드 디렉토리로 이동:
```bash
cd backend
```

2. 가상 환경 생성 및 활성화:
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
```

3. 의존성 설치:
```bash
pip install -r requirements.txt
```

4. 환경 변수 설정 (선택사항):
```bash
# .env 파일 생성
cp .env.example .env
# .env 파일 편집하여 API 키 입력
```

5. 백엔드 실행:
```bash
python main.py
```

백엔드는 `http://localhost:8000`에서 실행됩니다.

### 프론트엔드 설정

1. 프론트엔드 디렉토리로 이동:
```bash
cd frontend
```

2. 의존성 설치:
```bash
npm install
```

3. 프론트엔드 실행:
```bash
npm run dev
```

프론트엔드는 `http://localhost:3000`에서 실행됩니다.

## 주요 기능

### 1. 대시보드
- 현재 시장 상태 (과매수/과매도/중립)
- 추천 액션 (VIG/QLD 보유 기반)
- Fear & Greed Index
- VIG/QLD 가격 + 200MA 차트
- RSI·FGI 심리지표 차트

### 2. ETF 분석
- VIG/QLD 가격 추세 + MA 비교
- RSI 트렌드
- 변동성 분석
- 회복 속도/드로우다운 비교

### 3. 시장 심리
- Fear & Greed Index 실시간 데이터
- 히스토리 차트
- 분류별 통계

### 4. 스위칭 시그널
- 현재 보유 ETF 기반 추천
- 신호 생성 이유 시각화
- 신뢰도 표시

### 5. 백테스트
- 3년/5년/10년 백테스트
- 전략 A: VIG 단순 보유
- 전략 B: VIG↔QLD 스위칭 전략
- CAGR / MDD / 누적수익률 비교

### 6. 설정
- API 키 입력
- 데이터 업데이트 주기 설정
- 테마 전환
- 차트 리프레시 주기 설정

## API 엔드포인트

### ETF 관련
- `GET /etf/{symbol}/price` - ETF 최신 가격
- `GET /etf/{symbol}/history?days=500` - 가격 히스토리
- `GET /etf/{symbol}/price-ma` - 가격 + 200MA
- `GET /etf/{symbol}/rsi` - RSI 데이터
- `POST /etf/{symbol}/update` - 데이터 업데이트

### 시장 관련
- `GET /market/status` - 시장 상태
- `GET /market/fear-greed` - Fear & Greed Index
- `GET /market/fear-greed/history?days=365` - FGI 히스토리

### 시그널 관련
- `POST /signal/generate` - 스위칭 시그널 생성
- `GET /signal/market-status` - 시장 상태

### 백테스트 관련
- `POST /backtest/run` - 백테스트 실행

## 시그널 로직

### 시장 상태 판단
- **강한 과매도**: RSI < 30 + 종가 < 200MA + FGI < 40
- **강한 과매수**: RSI > 70 + 종가 > 200MA + FGI > 60
- **중립**: 나머지 조건

### 스위칭 전략
- **감정지표 악화** → VIG 유지
- **모멘텀 강화 + 추세 전환** → QLD 스위칭
- 사용자는 현재 보유 ETF 입력 (VIG/QLD)
- 자동으로 "유지/스위칭/부분 전환" 추천

## 라이선스

MIT



