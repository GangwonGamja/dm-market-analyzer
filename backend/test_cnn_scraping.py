"""
CNN Fear & Greed Index 스크래핑 테스트 스크립트
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.path.insert(0, '.')

from services.sentiment_service import SentimentService
import json

def test_cnn_scraping():
    """CNN 스크래핑 테스트"""
    print("=" * 50)
    print("CNN Fear & Greed Index 스크래핑 테스트")
    print("=" * 50)
    print()
    
    # 캐시 초기화
    SentimentService._cache = None
    SentimentService._cache_timestamp = None
    
    print("1. CNN 스크래핑 시작...")
    result = SentimentService.fetch_cnn_fear_greed_index()
    
    if result:
        print(f"\n[성공] 스크래핑 성공!")
        print(f"  값: {result['value']}")
        print(f"  상태: {result['classification']}")
        print(f"  소스: {result.get('source', 'Unknown')}")
        print(f"  시간: {result['timestamp']}")
    else:
        print("\n[실패] 스크래핑 실패")
        print("  API 백업을 시도합니다...")
        
        # API 백업 테스트
        result = SentimentService.fetch_fear_greed_index()
        if result:
            print(f"\n[성공] API 백업 성공!")
            print(f"  값: {result['value']}")
            print(f"  상태: {result['classification']}")
            print(f"  소스: {result.get('source', 'API')}")
            print(f"\n[주의] Alternative.me API는 Bitcoin Fear & Greed Index입니다.")
            print(f"       CNN의 Fear & Greed Index와 다른 값일 수 있습니다.")
        else:
            print("\n[실패] 모든 방법 실패")
    
    print("\n" + "=" * 50)

if __name__ == "__main__":
    test_cnn_scraping()

