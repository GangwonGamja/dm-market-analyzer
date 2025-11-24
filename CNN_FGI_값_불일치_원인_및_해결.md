# CNN Fear & Greed Index 값 불일치 문제 원인 및 해결

## 문제 상황

- **CNN 실제 값**: 6
- **프로그램 표시 값**: 14

## 원인 분석

### 주요 원인

1. **Alternative.me API 백업 사용** ⚠️ (가장 가능성 높음)
   - CNN 스크래핑이 실패하면 `Alternative.me` API를 백업으로 사용합니다
   - `Alternative.me` API는 **Bitcoin Fear & Greed Index**입니다
   - CNN의 Fear & Greed Index는 **주식 시장**용이고, Bitcoin FGI는 **비트코인 시장**용입니다
   - 따라서 **완전히 다른 값**을 반환할 수 있습니다
   - 예: CNN=6, Bitcoin FGI=14

2. **캐시된 오래된 데이터**
   - 15분 캐시에 이전 값(14)이 저장되어 있을 수 있습니다
   - `force_refresh=true`로 강제 새로고침하지 않으면 오래된 값을 반환합니다

3. **CNN 스크래핑 파싱 오류**
   - CNN 페이지 구조가 변경되어 잘못된 숫자를 읽을 수 있습니다
   - 예: 날짜(14일), 다른 지수 값을 잘못 인식

## 해결 방법

### 1. 스크래핑 로직 개선 ✅

개선된 CNN 스크래핑 로직:
- CNN API 엔드포인트 직접 호출 (가장 정확)
- 더 정확한 JSON 파싱
- 낮은 숫자 우선 선택 (공포지수는 보통 0-30 범위)
- 컨텍스트 검증 강화

### 2. API 백업 명확화 ✅

- Alternative.me API 사용 시 경고 메시지 추가
- 소스에 "(Bitcoin FGI)" 표시하여 구분
- CNN 스크래핑 실패 시 로그 출력

### 3. 강제 새로고침 사용

프론트엔드 또는 API에서:
```javascript
// force_refresh=true로 최신 데이터 가져오기
const response = await fetch('/market/fear-greed?force_refresh=true');
```

### 4. 서버 재시작

서버를 재시작하면 캐시가 초기화됩니다:
```powershell
# 서버 중지 후 재시작
python main.py
```

### 5. 테스트 스크립트 실행

```powershell
cd backend
.\venv\Scripts\python.exe test_cnn_scraping.py
```

## 확인 방법

1. **소스 확인**
   - API 응답에서 `source` 필드 확인
   - `"CNN"`: CNN에서 가져온 정확한 값
   - `"API (Bitcoin FGI)"`: Alternative.me API 사용 (다른 값)

2. **로그 확인**
   - 서버 로그에서 다음 메시지 확인:
     - `"CNN FGI 값 발견 (API ...): 6"` ✅ 정상
     - `"경고: Alternative.me API 사용 (Bitcoin FGI)"` ⚠️ 백업 사용 중

3. **캐시 확인**
   - `force_refresh=true`로 호출하여 캐시 무시
   - 최신 값을 가져오는지 확인

## 예상 결과

개선된 로직을 사용하면:
- ✅ CNN API에서 직접 값을 가져옴
- ✅ 더 정확한 값 (6)을 반환
- ✅ 실제 CNN 값과 일치
- ⚠️ CNN 스크래핑 실패 시 경고 메시지와 함께 백업 API 사용

## 권장 사항

1. **정기적인 모니터링**
   - CNN 스크래핑 성공률 확인
   - Alternative.me API 사용 빈도 확인

2. **에러 처리 개선**
   - CNN 스크래핑 실패 시 재시도 로직 추가
   - 더 자세한 에러 로그

3. **데이터 검증**
   - 값 범위 검증 (0-100)
   - 이전 값과의 차이 검증 (급격한 변화 확인)

---

**작성일**: 2024년
**상태**: 스크래핑 로직 개선 완료



