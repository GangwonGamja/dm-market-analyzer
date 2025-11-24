"""
개선된 CNN Fear & Greed Index 스크래핑 로직
"""
import requests
from bs4 import BeautifulSoup
import re
import json
from datetime import datetime
from typing import Optional, Dict

def fetch_cnn_fear_greed_index_improved() -> Optional[Dict]:
    """개선된 CNN Fear & Greed Index 스크래핑"""
    try:
        url = "https://edition.cnn.com/markets/fear-and-greed"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
        }
        
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        
        page_text = response.text
        soup = BeautifulSoup(response.content, 'html.parser')
        
        value = None
        classification = None
        
        # 방법 1: CNN API 엔드포인트 직접 호출 (가장 정확)
        api_urls = [
            "https://production.dataviz.cnn.io/index/fearandgreed/graphdata",
            "https://production.dataviz.cnn.io/index/fearandgreed/latest",
            "https://edition.cnn.com/.element/api/v2/dataviz/fearandgreed/index.json"
        ]
        
        for api_url in api_urls:
            try:
                api_response = requests.get(api_url, headers=headers, timeout=10)
                if api_response.status_code == 200:
                    api_data = api_response.json()
                    
                    def find_value_in_json(obj, depth=0):
                        if depth > 5:
                            return None
                        if isinstance(obj, dict):
                            for key in ['value', 'score', 'fearGreed', 'fear_greed', 'fearAndGreed', 'index', 'currentValue', 'today']:
                                if key in obj:
                                    val = obj[key]
                                    if isinstance(val, (int, float)) and 0 <= val <= 100:
                                        return int(val)
                            for k, v in obj.items():
                                if isinstance(v, (int, float)) and 0 <= v <= 100:
                                    key_lower = str(k).lower()
                                    if any(word in key_lower for word in ['fear', 'greed', 'value', 'score', 'index']):
                                        return int(v)
                                result = find_value_in_json(v, depth+1)
                                if result is not None:
                                    return result
                        elif isinstance(obj, list):
                            for item in obj:
                                result = find_value_in_json(item, depth+1)
                                if result is not None:
                                    return result
                        return None
                    
                    api_value = find_value_in_json(api_data)
                    if api_value is not None:
                        value = api_value
                        print(f"CNN FGI 값 발견 (API {api_url}): {value}")
                        break
            except:
                continue
        
        # 방법 2: 페이지 텍스트에서 패턴 매칭
        if not value:
            patterns = [
                r'"value":\s*(\d+)',  # "value": 6
                r'"fearGreed":\s*(\d+)',  # "fearGreed": 6
                r'fear.*greed.*index.*?(\d+)',  # fear greed index 6
                r'index.*?(\d+).*?(?:extreme\s*)?(?:fear|greed)',  # index 6 fear
            ]
            
            for pattern in patterns:
                matches = re.findall(pattern, page_text, re.IGNORECASE)
                for match in matches:
                    try:
                        num = int(match)
                        if 0 <= num <= 100:
                            match_pos = page_text.lower().find(match.lower())
                            if match_pos != -1:
                                context = page_text[max(0, match_pos-50):match_pos+50].lower()
                                if any(keyword in context for keyword in ['fear', 'greed', 'index', 'market']):
                                    value = num
                                    print(f"CNN FGI 값 발견 (패턴 매칭): {value}")
                                    break
                    except:
                        continue
                if value:
                    break
        
        # 방법 3: 메인 콘텐츠에서 가장 작은 숫자 찾기 (공포지수는 낮은 값)
        if not value:
            main_content = soup.find('main') or soup.find('article') or soup.find('div', class_=re.compile('content|main|article', re.I))
            
            if main_content:
                all_numbers = []
                for text in main_content.stripped_strings:
                    numbers = re.findall(r'\b([0-9]|[1-9][0-9]|100)\b', text)
                    for num_str in numbers:
                        try:
                            num = int(num_str)
                            if 0 <= num <= 100:
                                text_lower = text.lower()
                                if any(keyword in text_lower for keyword in ['fear', 'greed', 'index']):
                                    all_numbers.append((num, text))
                        except:
                            continue
                
                if all_numbers:
                    all_numbers.sort(key=lambda x: x[0])
                    for num, context in all_numbers[:5]:
                        if num <= 30:  # 공포 구간 값 우선
                            value = num
                            print(f"CNN FGI 값 발견 (낮은 값 우선): {value}")
                            break
                    
                    if not value and all_numbers:
                        value = all_numbers[0][0]
                        print(f"CNN FGI 값 발견 (첫 번째 값): {value}")
        
        # 상태명 찾기
        if value is not None:
            if value <= 24:
                classification = "Extreme Fear"
            elif value <= 44:
                classification = "Fear"
            elif value <= 55:
                classification = "Neutral"
            elif value <= 75:
                classification = "Greed"
            else:
                classification = "Extreme Greed"
            
            page_lower = page_text.lower()
            status_patterns = [
                r'(extreme\s*fear|fear|neutral|greed|extreme\s*greed)',
            ]
            for pattern in status_patterns:
                matches = re.findall(pattern, page_lower)
                if matches:
                    status = matches[0].strip()
                    if 'extreme fear' in status:
                        classification = "Extreme Fear"
                    elif 'extreme greed' in status:
                        classification = "Extreme Greed"
                    elif 'fear' in status and 'extreme' not in status:
                        classification = "Fear"
                    elif 'greed' in status and 'extreme' not in status:
                        classification = "Greed"
                    elif 'neutral' in status:
                        classification = "Neutral"
                    break
            
            print(f"CNN FGI 파싱 결과: 값={value}, 상태={classification}")
            return {
                "value": value,
                "classification": classification or "Unknown",
                "timestamp": datetime.now(),
                "source": "CNN"
            }
        
        print("CNN FGI 값을 찾을 수 없습니다.")
        
    except Exception as e:
        print(f"CNN Fear & Greed Index 스크래핑 오류: {e}")
        import traceback
        traceback.print_exc()
    
    return None



