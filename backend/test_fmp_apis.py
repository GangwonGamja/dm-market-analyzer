"""
FMP API 및 뉴스 API 테스트 스크립트
"""
import requests
import os
import sys
from datetime import datetime

# 백엔드 경로 추가
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

BASE_URL = "http://localhost:8000"


def test_fear_greed_fmp():
    """FMP Fear & Greed Index API 테스트"""
    print("\n" + "="*60)
    print("테스트 1: FMP Fear & Greed Index API")
    print("="*60)
    
    try:
        # 현재 FGI 조회
        response = requests.get(f"{BASE_URL}/market/fear-greed-fmp", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {data}")
            
            if data.get("success"):
                print(f"✓ FMP Fear & Greed Index 조회 성공")
                print(f"  - Score: {data.get('score')}")
                print(f"  - Rating: {data.get('rating')}")
                print(f"  - Timestamp: {data.get('timestamp')}")
            else:
                print(f"✗ FMP Fear & Greed Index 조회 실패: {data.get('error')}")
        else:
            print(f"✗ HTTP 오류: {response.status_code}")
            print(f"  Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("✗ 서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인하세요.")
    except Exception as e:
        print(f"✗ 오류 발생: {e}")
        import traceback
        traceback.print_exc()


def test_fear_greed_history_fmp():
    """FMP Fear & Greed Index 히스토리 API 테스트"""
    print("\n" + "="*60)
    print("테스트 2: FMP Fear & Greed Index 히스토리 API")
    print("="*60)
    
    try:
        # 히스토리 조회 (최근 30일)
        response = requests.get(f"{BASE_URL}/market/fear-greed-fmp/history?limit=30", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response keys: {list(data.keys())}")
            
            if data.get("success"):
                count = data.get("count", 0)
                print(f"✓ FMP Fear & Greed Index 히스토리 조회 성공")
                print(f"  - 데이터 개수: {count}")
                
                if count > 0:
                    first_item = data.get("data", [])[0] if data.get("data") else None
                    if first_item:
                        print(f"  - 첫 번째 항목: score={first_item.get('score')}, rating={first_item.get('rating')}")
            else:
                print(f"✗ FMP Fear & Greed Index 히스토리 조회 실패: {data.get('error')}")
        else:
            print(f"✗ HTTP 오류: {response.status_code}")
            print(f"  Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("✗ 서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인하세요.")
    except Exception as e:
        print(f"✗ 오류 발생: {e}")
        import traceback
        traceback.print_exc()


def test_news_api():
    """뉴스 API 테스트"""
    print("\n" + "="*60)
    print("테스트 3: 뉴스 API")
    print("="*60)
    
    try:
        response = requests.get(f"{BASE_URL}/news", timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response keys: {list(data.keys())}")
            
            if data.get("success"):
                count = data.get("count", 0)
                print(f"✓ 뉴스 API 조회 성공")
                print(f"  - 뉴스 개수: {count}")
                
                if count > 0:
                    articles = data.get("articles", [])
                    if articles:
                        first_article = articles[0]
                        print(f"  - 첫 번째 뉴스:")
                        print(f"    제목: {first_article.get('title', 'N/A')[:50]}...")
                        print(f"    감성 점수: {first_article.get('score', 'N/A')}")
                        print(f"    발행일: {first_article.get('published', 'N/A')}")
            else:
                print(f"✗ 뉴스 API 조회 실패: {data.get('error')}")
        else:
            print(f"✗ HTTP 오류: {response.status_code}")
            print(f"  Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("✗ 서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인하세요.")
    except Exception as e:
        print(f"✗ 오류 발생: {e}")
        import traceback
        traceback.print_exc()


def test_etf_update():
    """ETF 업데이트 API 테스트 (FMP API 403 오류 확인)"""
    print("\n" + "="*60)
    print("테스트 4: ETF 업데이트 API (FMP API 403 오류 확인)")
    print("="*60)
    
    try:
        # QLD 업데이트 시도
        response = requests.post(f"{BASE_URL}/etf/QLD/update", timeout=60)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {data}")
            
            if data.get("success"):
                print(f"✓ ETF 업데이트 성공")
            else:
                error_msg = data.get("message", data.get("error", "알 수 없는 오류"))
                print(f"✗ ETF 업데이트 실패: {error_msg}")
                
                # 403 오류인지 확인
                if "403" in error_msg or "Forbidden" in error_msg or "FMP_API_403" in str(data.get("error", "")):
                    print(f"  → FMP API 403 오류가 명확히 표시됨 (정상)")
                else:
                    print(f"  → 오류 메시지에 403 정보가 없음 (개선 필요)")
        else:
            print(f"✗ HTTP 오류: {response.status_code}")
            print(f"  Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("✗ 서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인하세요.")
    except Exception as e:
        print(f"✗ 오류 발생: {e}")
        import traceback
        traceback.print_exc()


def main():
    """모든 테스트 실행"""
    print("\n" + "="*60)
    print("FMP API 및 뉴스 API 테스트 시작")
    print(f"테스트 시간: {datetime.now().isoformat()}")
    print(f"백엔드 URL: {BASE_URL}")
    print("="*60)
    
    # 테스트 실행
    test_fear_greed_fmp()
    test_fear_greed_history_fmp()
    test_news_api()
    test_etf_update()
    
    print("\n" + "="*60)
    print("모든 테스트 완료")
    print("="*60)


if __name__ == "__main__":
    main()

