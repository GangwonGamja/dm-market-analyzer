import requests
from bs4 import BeautifulSoup
import re
import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from core.database import FearGreedIndex
from typing import Optional, Dict
import time


class SentimentService:
    _cache = None
    _cache_timestamp = None
    _cache_duration = 15 * 60  # 15분 캐시
    
    @staticmethod
    def fetch_cnn_fear_greed_index() -> Optional[Dict]:
        """CNN Fear & Greed Index 스크래핑 (개선된 버전)"""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://edition.cnn.com/markets/fear-and-greed',
            }
            
            value = None
            classification = None
            
            # 방법 1: CNN API 엔드포인트 직접 호출 (가장 정확한 방법)
            api_urls = [
                "https://production.dataviz.cnn.io/index/fearandgreed/graphdata",
                "https://production.dataviz.cnn.io/index/fearandgreed/latest",
                "https://edition.cnn.com/.element/api/v2/dataviz/fearandgreed/index.json",
                "https://money.cnn.com/data/fear-and-greed/"
            ]
            
            for api_url in api_urls:
                try:
                    api_response = requests.get(api_url, headers=headers, timeout=10)
                    if api_response.status_code == 200:
                        api_data = api_response.json()
                        print(f"CNN API 응답 받음: {api_url}")
                        print(f"API 데이터 구조: {str(api_data)[:500]}")  # 디버깅용
                        
                        # JSON 구조에서 값 찾기 (개선된 버전)
                        def find_value_in_json(obj, depth=0):
                            if depth > 10:  # 깊이 증가
                                return None
                            if isinstance(obj, dict):
                                # 직접적인 키 확인 (우선순위 높음)
                                priority_keys = ['value', 'score', 'fearGreed', 'fear_greed', 'fearAndGreed', 
                                                'fear_and_greed', 'index', 'currentValue', 'today', 'current']
                                for key in priority_keys:
                                    if key in obj:
                                        val = obj[key]
                                        # 중첩된 딕셔너리인 경우
                                        if isinstance(val, dict):
                                            nested = find_value_in_json(val, depth+1)
                                            if nested is not None:
                                                return nested
                                        # 숫자 값인 경우
                                        elif isinstance(val, (int, float)) and 0 <= val <= 100:
                                            print(f"CNN FGI 값 발견 (키: {key}): {int(val)}")
                                            return int(val)
                                
                                # 중첩된 딕셔너리에서 찾기 (fear_and_greed 등)
                                for k, v in obj.items():
                                    key_lower = str(k).lower()
                                    if 'fear' in key_lower and 'greed' in key_lower:
                                        if isinstance(v, dict):
                                            nested = find_value_in_json(v, depth+1)
                                            if nested is not None:
                                                return nested
                                        elif isinstance(v, (int, float)) and 0 <= v <= 100:
                                            print(f"CNN FGI 값 발견 (중첩 키: {k}): {int(v)}")
                                            return int(v)
                                
                                # 재귀적 탐색
                                for k, v in obj.items():
                                    result = find_value_in_json(v, depth+1)
                                    if result is not None:
                                        return result
                            elif isinstance(obj, list):
                                # 리스트의 첫 번째 요소 확인 (최신 데이터)
                                for item in obj:
                                    result = find_value_in_json(item, depth+1)
                                    if result is not None:
                                        return result
                            return None
                        
                        api_value = find_value_in_json(api_data)
                        if api_value is not None:
                            value = api_value
                            print(f"✓ CNN FGI 값 확인 (API {api_url}): {value}")
                            break
                except Exception as api_e:
                    print(f"CNN API {api_url} 호출 실패: {api_e}")
                    continue
            
            # 방법 2: 페이지에서 직접 스크래핑 (API 실패 시)
            if not value:
                try:
                    url = "https://edition.cnn.com/markets/fear-and-greed"
                    response = requests.get(url, headers=headers, timeout=15)
                    response.raise_for_status()
                    
                    page_text = response.text
                    soup = BeautifulSoup(response.content, 'html.parser')
                    
                    # JSON 데이터가 script 태그에 포함된 경우
                    scripts = soup.find_all('script', type='application/json')
                    for script in scripts:
                        try:
                            script_data = json.loads(script.string)
                            api_value = find_value_in_json(script_data) if 'find_value_in_json' in locals() else None
                            if api_value is not None:
                                value = api_value
                                print(f"CNN FGI 값 발견 (script 태그): {value}")
                                break
                        except:
                            continue
                    
                    # 패턴 매칭 (가장 낮은 값 우선 - 공포지수는 낮은 값)
                    if not value:
                        patterns = [
                            r'"value":\s*(\d+)',  # "value": 6
                            r'"score":\s*(\d+)',  # "score": 6
                            r'"fearGreed":\s*(\d+)',  # "fearGreed": 6
                            r'fear.*greed.*index.*?(\d+)',  # fear greed index 6
                            r'index.*?(\d+).*?(?:extreme\s*)?(?:fear|greed)',  # index 6 fear
                        ]
                        
                        all_matches = []
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
                                                all_matches.append(num)
                                except:
                                    continue
                        
                        # 가장 낮은 값 선택 (공포지수는 낮은 값)
                        if all_matches:
                            all_matches.sort()
                            value = all_matches[0]
                            print(f"CNN FGI 값 발견 (패턴 매칭, 가장 낮은 값): {value}")
                except Exception as page_e:
                    print(f"페이지 스크래핑 실패: {page_e}")
            
            # 상태명 찾기 및 값 검증
            if value is not None:
                # 상태명 결정
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
                
                # 페이지에서 실제 상태명 찾기 (page_text가 정의된 경우만)
                page_lower = ""
                try:
                    if 'page_text' in locals():
                        page_lower = page_text.lower()
                except:
                    pass
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
            
            print("CNN FGI 값을 찾을 수 없습니다. 페이지 구조 확인 필요.")
            
        except requests.RequestException as e:
            print(f"CNN Fear & Greed Index 스크래핑 네트워크 오류: {e}")
        except Exception as e:
            print(f"CNN Fear & Greed Index 스크래핑 오류: {e}")
            import traceback
            traceback.print_exc()
        
        return None
    
    @staticmethod
    def fetch_fear_greed_index(force_refresh: bool = False) -> Optional[Dict]:
        """Fear & Greed Index 가져오기 (CNN 우선, API 백업)"""
        # 캐시 확인 (force_refresh가 True면 무시)
        if not force_refresh:
            current_time = time.time()
            if (SentimentService._cache is not None and 
                SentimentService._cache_timestamp is not None and
                current_time - SentimentService._cache_timestamp < SentimentService._cache_duration):
                print("캐시된 FGI 데이터 반환")
                return SentimentService._cache
        
        # 캐시 강제 초기화
        if force_refresh:
            print("캐시 강제 초기화 - CNN에서 최신 데이터 가져오기")
            SentimentService._cache = None
            SentimentService._cache_timestamp = None
        
        # CNN에서 스크래핑 시도
        cnn_data = SentimentService.fetch_cnn_fear_greed_index()
        if cnn_data and cnn_data.get("source") == "CNN":
            current_time = time.time()
            SentimentService._cache = cnn_data
            SentimentService._cache_timestamp = current_time
            print(f"✓ CNN FGI 데이터 캐시 저장: 값={cnn_data.get('value')}, 상태={cnn_data.get('classification')}")
            return cnn_data
        
        # CNN 실패 시 API 백업 (명확한 경고 표시)
        try:
            print("[WARNING] CNN 스크래핑 실패. Alternative.me API (Bitcoin FGI) 사용 중...")
            # Alternative.me의 무료 Fear & Greed Index API
            url = "https://api.alternative.me/fng/?limit=1"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "data" in data and len(data["data"]) > 0:
                    fgi_data = data["data"][0]
                    result = {
                        "value": int(fgi_data["value"]),
                        "classification": fgi_data["value_classification"],
                        "timestamp": datetime.fromtimestamp(int(fgi_data["timestamp"])),
                        "source": "Alternative.me (Bitcoin FGI)"
                    }
                    print(f"[WARNING] Alternative.me API 사용: 값={result['value']} (CNN 값과 다를 수 있음)")
                    current_time = time.time()
                    SentimentService._cache = result
                    SentimentService._cache_timestamp = current_time
                    return result
        except Exception as e:
            print(f"Fear & Greed Index API 가져오기 실패: {e}")
        
        return None

    @staticmethod
    def save_fear_greed_index(db: Session, fgi_data: Dict):
        """Fear & Greed Index 저장"""
        date = fgi_data["timestamp"]
        existing = db.query(FearGreedIndex).filter(
            FearGreedIndex.date == date
        ).first()
        
        if not existing:
            fgi = FearGreedIndex(
                date=date,
                value=fgi_data["value"],
                classification=fgi_data["classification"]
            )
            db.add(fgi)
            db.commit()

    @staticmethod
    def get_latest_fgi(db: Session, force_refresh: bool = False) -> Optional[Dict]:
        """최신 Fear & Greed Index 가져오기 (변화율 포함, 고정된 형식)"""
        # 캐시 확인
        if not force_refresh:
            current_time = time.time()
            if (SentimentService._cache is not None and 
                SentimentService._cache_timestamp is not None and
                current_time - SentimentService._cache_timestamp < SentimentService._cache_duration):
                fgi_data = SentimentService._cache.copy()
                # DB에서 이전 값 찾기 (1일 전, 1주 전, 1개월 전, 1년 전)
                now = datetime.now()
                previous_1d = db.query(FearGreedIndex).filter(
                    FearGreedIndex.date <= now - timedelta(days=1)
                ).order_by(FearGreedIndex.date.desc()).first()
                previous_1w = db.query(FearGreedIndex).filter(
                    FearGreedIndex.date <= now - timedelta(days=7)
                ).order_by(FearGreedIndex.date.desc()).first()
                previous_1m = db.query(FearGreedIndex).filter(
                    FearGreedIndex.date <= now - timedelta(days=30)
                ).order_by(FearGreedIndex.date.desc()).first()
                previous_1y = db.query(FearGreedIndex).filter(
                    FearGreedIndex.date <= now - timedelta(days=365)
                ).order_by(FearGreedIndex.date.desc()).first()
                
                # 이전 값 (전일)
                previous_fgi = db.query(FearGreedIndex).order_by(
                    FearGreedIndex.date.desc()
                ).offset(1).first()
                
                score = fgi_data.get("value") or fgi_data.get("score")
                result = {
                    "score": int(score) if score is not None else None,
                    "rating": fgi_data.get("classification") or fgi_data.get("rating"),
                    "timestamp": fgi_data.get("timestamp").isoformat() if hasattr(fgi_data.get("timestamp"), 'isoformat') else fgi_data.get("date") or datetime.now().isoformat(),
                    "previous_close": float(previous_1d.value) if previous_1d else None,
                    "previous_1_week": float(previous_1w.value) if previous_1w else None,
                    "previous_1_month": float(previous_1m.value) if previous_1m else None,
                    "previous_1_year": float(previous_1y.value) if previous_1y else None,
                }
                
                # 호환성을 위해 value와 classification도 포함 (하위 호환성)
                result["value"] = result["score"]
                result["classification"] = result["rating"]
                result["date"] = result["timestamp"]
                
                if previous_fgi:
                    change = (result["score"] or 0) - previous_fgi.value
                    change_rate = (change / previous_fgi.value * 100) if previous_fgi.value > 0 else 0
                    result["change"] = change
                    result["change_rate"] = round(change_rate, 2)
                    result["previous_value"] = previous_fgi.value
                else:
                    result["change"] = 0
                    result["change_rate"] = 0
                
                return result
        
        # DB에서 최신 값 확인
        fgi = db.query(FearGreedIndex).order_by(
            FearGreedIndex.date.desc()
        ).first()
        
        # DB 값이 오래되었거나 없으면 새로 가져오기
        should_fetch = True
        if fgi:
            # 최근 15분 이내 데이터면 DB 값 사용
            time_diff = datetime.now() - fgi.date
            if time_diff.total_seconds() < SentimentService._cache_duration:
                should_fetch = False
                # 이전 값 찾기
                now = datetime.now()
                previous_1d = db.query(FearGreedIndex).filter(
                    FearGreedIndex.date <= now - timedelta(days=1)
                ).order_by(FearGreedIndex.date.desc()).first()
                previous_1w = db.query(FearGreedIndex).filter(
                    FearGreedIndex.date <= now - timedelta(days=7)
                ).order_by(FearGreedIndex.date.desc()).first()
                previous_1m = db.query(FearGreedIndex).filter(
                    FearGreedIndex.date <= now - timedelta(days=30)
                ).order_by(FearGreedIndex.date.desc()).first()
                previous_1y = db.query(FearGreedIndex).filter(
                    FearGreedIndex.date <= now - timedelta(days=365)
                ).order_by(FearGreedIndex.date.desc()).first()
                
                previous_fgi = db.query(FearGreedIndex).order_by(
                    FearGreedIndex.date.desc()
                ).offset(1).first()
                
                result = {
                    "score": int(fgi.value) if fgi.value is not None else None,
                    "rating": fgi.classification or None,
                    "timestamp": fgi.date.isoformat() if hasattr(fgi.date, 'isoformat') else str(fgi.date),
                    "previous_close": float(previous_1d.value) if previous_1d else None,
                    "previous_1_week": float(previous_1w.value) if previous_1w else None,
                    "previous_1_month": float(previous_1m.value) if previous_1m else None,
                    "previous_1_year": float(previous_1y.value) if previous_1y else None,
                }
                
                # 호환성을 위해 value와 classification도 포함
                result["value"] = result["score"]
                result["classification"] = result["rating"]
                result["date"] = result["timestamp"]
                
                if previous_fgi:
                    change = (result["score"] or 0) - previous_fgi.value
                    change_rate = (change / previous_fgi.value * 100) if previous_fgi.value > 0 else 0
                    result["change"] = change
                    result["change_rate"] = round(change_rate, 2)
                    result["previous_value"] = previous_fgi.value
                else:
                    result["change"] = 0
                    result["change_rate"] = 0
                
                return result
        
        if should_fetch:
            # 새로 가져오기 (force_refresh 옵션 전달)
            fgi_data = SentimentService.fetch_fear_greed_index(force_refresh=force_refresh)
            if fgi_data:
                # 저장
                SentimentService.save_fear_greed_index(db, fgi_data)
                
                # 이전 값 찾기
                now = datetime.now()
                previous_1d = db.query(FearGreedIndex).filter(
                    FearGreedIndex.date <= now - timedelta(days=1)
                ).order_by(FearGreedIndex.date.desc()).first()
                previous_1w = db.query(FearGreedIndex).filter(
                    FearGreedIndex.date <= now - timedelta(days=7)
                ).order_by(FearGreedIndex.date.desc()).first()
                previous_1m = db.query(FearGreedIndex).filter(
                    FearGreedIndex.date <= now - timedelta(days=30)
                ).order_by(FearGreedIndex.date.desc()).first()
                previous_1y = db.query(FearGreedIndex).filter(
                    FearGreedIndex.date <= now - timedelta(days=365)
                ).order_by(FearGreedIndex.date.desc()).first()
                
                previous_fgi = db.query(FearGreedIndex).order_by(
                    FearGreedIndex.date.desc()
                ).offset(1).first()
                
                score = fgi_data.get("value") or fgi_data.get("score")
                result = {
                    "score": int(score) if score is not None else None,
                    "rating": fgi_data.get("classification") or fgi_data.get("rating"),
                    "timestamp": fgi_data.get("timestamp").isoformat() if hasattr(fgi_data.get("timestamp"), 'isoformat') else datetime.now().isoformat(),
                    "previous_close": float(previous_1d.value) if previous_1d else None,
                    "previous_1_week": float(previous_1w.value) if previous_1w else None,
                    "previous_1_month": float(previous_1m.value) if previous_1m else None,
                    "previous_1_year": float(previous_1y.value) if previous_1y else None,
                }
                
                # 호환성을 위해 value와 classification도 포함
                result["value"] = result["score"]
                result["classification"] = result["rating"]
                result["date"] = result["timestamp"]
                
                if previous_fgi:
                    change = (result["score"] or 0) - previous_fgi.value
                    change_rate = (change / previous_fgi.value * 100) if previous_fgi.value > 0 else 0
                    result["change"] = change
                    result["change_rate"] = round(change_rate, 2)
                    result["previous_value"] = previous_fgi.value
                else:
                    result["change"] = 0
                    result["change_rate"] = 0
                
                return result
        
        # 데이터가 없을 때 fallback 반환
        return {
            "score": None,
            "rating": None,
            "timestamp": datetime.now().isoformat(),
            "previous_close": None,
            "previous_1_week": None,
            "previous_1_month": None,
            "previous_1_year": None,
        }
    
    @staticmethod
    def get_fgi_trigger_signal(db: Session) -> Optional[Dict]:
        """FGI 트리거 신호 및 행동 가이드"""
        fgi_data = SentimentService.get_latest_fgi(db)
        if not fgi_data:
            return None
        
        value = fgi_data["value"]
        change = fgi_data.get("change", 0)
        previous_value = fgi_data.get("previous_value")
        
        signals = []
        confidence_boost = 0.0
        
        # 현재 상태에 따른 기본 신호
        if 0 <= value <= 40:  # 공포 구간
            signals.append("공포 구간 - QLD 매수 신호 강화 가능성")
            if value <= 25:  # 극공포
                signals.append("극공포 구간 - 강한 반등 기대")
                confidence_boost = 0.2
        elif 60 <= value <= 100:  # 탐욕 구간
            signals.append("탐욕 구간 - VIG 유지/매수 권장, QLD 비중 축소")
            if value >= 75:  # 극탐욕
                signals.append("극탐욕 구간 - 조정 주의")
                confidence_boost = 0.15
        else:  # 중립 구간 (40~60)
            signals.append("중립 구간 - 기술지표(RSI/MA200) 기반 판단 권장")
        
        # 변화율에 따른 트리거 신호
        if previous_value is not None and change != 0:
            if 0 <= previous_value <= 40 and change > 0:
                # 공포 구간에서 상승
                signals.append(f"공포 구간 반등 시작 ({previous_value}→{value}) → QLD 진입 신뢰도↑")
                confidence_boost += 0.1
            elif 60 <= previous_value <= 100 and change < 0:
                # 탐욕 구간에서 하락
                signals.append(f"탐욕 구간 약화 ({previous_value}→{value}) → VIG 유지 신뢰도↑")
                confidence_boost += 0.1
            elif abs(change) >= 10:  # 급격한 변화
                if change > 0:
                    signals.append(f"FGI 급등 ({previous_value}→{value}, +{abs(change)}) → 시장 심리 개선")
                else:
                    signals.append(f"FGI 급락 ({previous_value}→{value}, {abs(change)}) → 시장 심리 악화")
        
        return {
            "signals": signals,
            "confidence_boost": confidence_boost,
            "action_guide": "; ".join(signals)
        }

    @staticmethod
    def get_fgi_history(db: Session, days: int = 365) -> list:
        """Fear & Greed Index 히스토리 (DB 기반, 3개년 지원)"""
        cutoff_date = datetime.now() - timedelta(days=days)
        fgis = db.query(FearGreedIndex).filter(
            FearGreedIndex.date >= cutoff_date
        ).order_by(FearGreedIndex.date.asc()).all()
        
        result = [{
            "date": fgi.date.isoformat() if hasattr(fgi.date, 'isoformat') else str(fgi.date),
            "score": int(fgi.value) if fgi.value is not None else None,
            "rating": fgi.classification or None,
            # 호환성을 위해 value와 classification도 포함
            "value": int(fgi.value) if fgi.value is not None else None,
            "classification": fgi.classification or None
        } for fgi in fgis]
        
        # DB에 데이터가 부족하면 Alternative.me API로 보완 (최대 365일)
        if len(result) < days * 0.3 and days <= 365:  # 30% 미만이면 보완
            try:
                print(f"[INFO] FGI 히스토리 데이터 부족 ({len(result)}개), Alternative.me API로 보완 시도...")
                url = f"https://api.alternative.me/fng/?limit={min(days, 365)}"
                response = requests.get(url, timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    if "data" in data and len(data["data"]) > 0:
                        # DB 데이터와 병합 (중복 제거)
                        db_dates = {item["date"][:10] for item in result}  # 날짜만 추출
                        for fgi_data in data["data"]:
                            timestamp = int(fgi_data["timestamp"])
                            fgi_date = datetime.fromtimestamp(timestamp).date().isoformat()
                            if fgi_date not in db_dates:
                                result.append({
                                    "date": fgi_date,
                                    "score": int(fgi_data["value"]),
                                    "rating": fgi_data["value_classification"],
                                    "value": int(fgi_data["value"]),
                                    "classification": fgi_data["value_classification"]
                                })
                        # 날짜순 정렬
                        result.sort(key=lambda x: x["date"])
                        print(f"[INFO] Alternative.me API로 {len(data['data'])}개 데이터 보완 완료")
            except Exception as e:
                print(f"[WARNING] Alternative.me API 보완 실패: {e}")
        
        return result

