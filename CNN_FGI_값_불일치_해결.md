# CNN Fear & Greed Index 값 불일치 문제 해결

## 문제 상황

- **CNN 실제 값**: 6
- **프로그램 표시 값**: 14

## 원인 분석

### 가능한 원인들:

1. **잘못된 데이터 파싱**
   - CNN 페이지 구조가 변경되어 다른 숫자를 읽고 있을 수 있음
   - 날짜, 시간, 다른 지수 등의 숫자를 잘못 인식

2. **API 백업 사용**
   - CNN 스크래핑 실패 시 Alternative.me API를 사용하는데, 이 API는 다른 값을 반환할 수 있음
   - Alternative.me API는 Bitcoin Fear & Greed Index로, 다른 데이터 소스

3. **캐시된 오래된 데이터**
   - 15분 캐시에 오래된 데이터가 저장되어 있을 수 있음

4. **페이지 구조 변경**
   - CNN이 페이지 구조를 변경하여 기존 파싱 로직이 작동하지 않을 수 있음

## 해결 방법

### 1. 스크래핑 로직 개선

- ✅ CNN API 엔드포인트 직접 호출 추가
- ✅ 더 정확한 JSON 파싱 로직
- ✅ 낮은 숫자 우선 선택 (공포지수는 보통 낮은 값)
- ✅ 컨텍스트 검증 강화

### 2. 캐시 초기화

```python
# 캐시 강제 초기화
SentimentService._cache = None
SentimentService._cache_timestamp = None
```

### 3. API 강제 새로고침

```
GET /market/fear-greed?force_refresh=true
```

### 4. 테스트 스크립트 실행

```powershell
cd backend
.\venv\Scripts\python.exe test_cnn_scraping.py
```

## 개선된 스크래핑 방법

### 방법 1: CNN API 직접 호출 (가장 정확)

```python
api_url = "https://production.dataviz.cnn.io/index/fearandgreed/graphdata"
# 또는
api_url = "https://edition.cnn.com/.element/api/v2/dataviz/fearandgreed/index.json"
```

### 방법 2: 페이지 텍스트에서 패턴 매칭

- JSON 패턴: `"value": 6`
- 텍스트 패턴: `Fear & Greed Index: 6`

### 방법 3: 낮은 숫자 우선 선택

- 공포지수는 보통 0-30 범위의 낮은 값
- 여러 숫자가 발견되면 가장 작은 값을 선택

## 사용 방법

### 1. 강제 새로고침으로 최신 데이터 가져오기

프론트엔드 또는 API에서:
```javascript
// 프론트엔드
const response = await marketApi.getFearGreed(); // 자동 캐시 사용
// 또는
const response = await fetch('/market/fear-greed?force_refresh=true');
```

### 2. 서버 재시작

```powershell
# 서버 재시작하면 캐시가 초기화됨
python main.py
```

### 3. 수동 캐시 초기화

```python
from services.sentiment_service import SentimentService
SentimentService._cache = None
SentimentService._cache_timestamp = None
```

## 예상 결과

개선된 로직을 사용하면:
- ✅ CNN API에서 직접 값을 가져옴
- ✅ 더 정확한 값 (6)을 반환
- ✅ 실제 CNN 값과 일치

## 주의사항

1. **CNN 페이지 구조 변경**: CNN이 페이지를 변경하면 파싱 로직 수정 필요
2. **API 엔드포인트 변경**: CNN API URL이 변경될 수 있음
3. **네트워크 오류**: 스크래핑 실패 시 API 백업 사용 (다른 값일 수 있음)

---

**작성일**: 2024년
**상태**: 스크래핑 로직 개선 완료



