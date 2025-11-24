"""
무료 API 기반 백엔드 테스트 스크립트
"""
import requests
import sys
from datetime import datetime

BASE_URL = "http://localhost:8000"


def test_health():
    """헬스 체크"""
    print("\n" + "="*60)
    print("테스트 1: 헬스 체크")
    print("="*60)
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✓ 서버 정상 작동")
            print(f"  캐시 통계: {data.get('cache', {})}")
        else:
            print(f"✗ 서버 오류: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print("✗ 서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인하세요.")
        return False
    except Exception as e:
        print(f"✗ 오류: {e}")
        return False
    return True


def test_etf_price():
    """ETF 가격 조회 테스트"""
    print("\n" + "="*60)
    print("테스트 2: ETF 가격 조회 (VIG)")
    print("="*60)
    try:
        response = requests.get(f"{BASE_URL}/etf/VIG/price", timeout=30)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✓ 가격 조회 성공")
            print(f"  심볼: {data.get('symbol')}")
            print(f"  날짜: {data.get('date')}")
            print(f"  종가: ${data.get('close', 0):.2f}")
            print(f"  거래량: {data.get('volume', 0):,}")
        else:
            print(f"✗ HTTP 오류: {response.status_code}")
            print(f"  Response: {response.text[:200]}")
    except Exception as e:
        print(f"✗ 오류: {e}")


def test_etf_history():
    """ETF 히스토리 조회 테스트"""
    print("\n" + "="*60)
    print("테스트 3: ETF 히스토리 조회 (VIG, 3년)")
    print("="*60)
    try:
        response = requests.get(f"{BASE_URL}/etf/VIG/history?years=3", timeout=60)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            count = data.get("count", 0)
            print(f"✓ 히스토리 조회 성공")
            print(f"  데이터 개수: {count}")
            if count > 0:
                first = data.get("data", [])[0]
                last = data.get("data", [])[-1]
                print(f"  첫 번째 날짜: {first.get('date')}")
                print(f"  마지막 날짜: {last.get('date')}")
        else:
            print(f"✗ HTTP 오류: {response.status_code}")
    except Exception as e:
        print(f"✗ 오류: {e}")


def test_rsi():
    """RSI 계산 테스트"""
    print("\n" + "="*60)
    print("테스트 4: RSI 계산 (VIG)")
    print("="*60)
    try:
        response = requests.get(f"{BASE_URL}/etf/VIG/rsi", timeout=60)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            count = data.get("count", 0)
            print(f"✓ RSI 계산 성공")
            print(f"  데이터 개수: {count}")
            if count > 0:
                last = data.get("data", [])[-1]
                print(f"  최신 RSI: {last.get('rsi', 0):.2f}")
        else:
            print(f"✗ HTTP 오류: {response.status_code}")
    except Exception as e:
        print(f"✗ 오류: {e}")


def test_macd():
    """MACD 계산 테스트"""
    print("\n" + "="*60)
    print("테스트 5: MACD 계산 (VIG)")
    print("="*60)
    try:
        response = requests.get(f"{BASE_URL}/etf/VIG/macd", timeout=60)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            count = data.get("count", 0)
            print(f"✓ MACD 계산 성공")
            print(f"  데이터 개수: {count}")
            if count > 0:
                last = data.get("data", [])[-1]
                print(f"  최신 MACD: {last.get('macd', 0):.4f}")
                print(f"  최신 Signal: {last.get('signal', 0):.4f}")
        else:
            print(f"✗ HTTP 오류: {response.status_code}")
    except Exception as e:
        print(f"✗ 오류: {e}")


def test_fgi():
    """Fear & Greed Index 테스트"""
    print("\n" + "="*60)
    print("테스트 6: Fear & Greed Index")
    print("="*60)
    try:
        response = requests.get(f"{BASE_URL}/market/fgi", timeout=30)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                print(f"✓ FGI 조회 성공")
                print(f"  점수: {data.get('score')}")
                print(f"  등급: {data.get('rating')}")
                print(f"  소스: {data.get('source')}")
            else:
                print(f"✗ FGI 조회 실패: {data.get('error')}")
        else:
            print(f"✗ HTTP 오류: {response.status_code}")
    except Exception as e:
        print(f"✗ 오류: {e}")


def test_news():
    """뉴스 API 테스트"""
    print("\n" + "="*60)
    print("테스트 7: 뉴스 API (VIG)")
    print("="*60)
    try:
        response = requests.get(f"{BASE_URL}/news?symbol=VIG&limit=10", timeout=30)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                count = data.get("count", 0)
                print(f"✓ 뉴스 조회 성공")
                print(f"  뉴스 개수: {count}")
                if count > 0:
                    first = data.get("articles", [])[0]
                    print(f"  첫 번째 뉴스: {first.get('title', '')[:50]}...")
            else:
                print(f"✗ 뉴스 조회 실패: {data.get('error')}")
                print(f"  (Marketaux API Key가 없으면 뉴스 기능이 제한됩니다)")
        else:
            print(f"✗ HTTP 오류: {response.status_code}")
    except Exception as e:
        print(f"✗ 오류: {e}")


def test_sentiment():
    """센티먼트 분석 테스트"""
    print("\n" + "="*60)
    print("테스트 8: 종합 센티먼트 (VIG)")
    print("="*60)
    try:
        response = requests.get(f"{BASE_URL}/market/sentiment?symbol=VIG", timeout=30)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✓ 센티먼트 분석 성공")
            print(f"  FGI 점수: {data.get('fgi_score')}")
            print(f"  FGI 등급: {data.get('fgi_rating')}")
            print(f"  뉴스 개수: {data.get('news_count')}")
            print(f"  센티먼트 점수: {data.get('sentiment_score', 0):.3f}")
            print(f"  종합 판단: {data.get('overall_sentiment')}")
        else:
            print(f"✗ HTTP 오류: {response.status_code}")
    except Exception as e:
        print(f"✗ 오류: {e}")


def main():
    """모든 테스트 실행"""
    print("\n" + "="*60)
    print("무료 API 기반 백엔드 테스트 시작")
    print(f"테스트 시간: {datetime.now().isoformat()}")
    print(f"백엔드 URL: {BASE_URL}")
    print("="*60)
    
    # 헬스 체크 먼저
    if not test_health():
        print("\n[중단] 서버가 실행되지 않았습니다. 백엔드를 먼저 실행하세요.")
        sys.exit(1)
    
    # 각 기능 테스트
    test_etf_price()
    test_etf_history()
    test_rsi()
    test_macd()
    test_fgi()
    test_news()
    test_sentiment()
    
    print("\n" + "="*60)
    print("모든 테스트 완료")
    print("="*60)


if __name__ == "__main__":
    main()

