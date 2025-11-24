"""
Fear & Greed Index 히스토리 저장 및 관리 서비스
"""
import json
import os
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from pathlib import Path
from services.fgi_service import FGIService


class FGIHistoryService:
    """FGI 히스토리 관리 서비스"""
    
    HISTORY_FILE = Path("data/fgi_history.json")
    MAX_DAYS = 365  # 최대 저장 기간
    
    @staticmethod
    def _ensure_data_dir():
        """데이터 디렉토리 생성"""
        FGIHistoryService.HISTORY_FILE.parent.mkdir(parents=True, exist_ok=True)
    
    @staticmethod
    def _load_history() -> List[Dict]:
        """히스토리 파일에서 데이터 로드"""
        FGIHistoryService._ensure_data_dir()
        
        if not FGIHistoryService.HISTORY_FILE.exists():
            return []
        
        try:
            with open(FGIHistoryService.HISTORY_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data if isinstance(data, list) else []
        except Exception as e:
            print(f"[ERROR] FGI 히스토리 로드 실패: {e}")
            return []
    
    @staticmethod
    def _save_history(history: List[Dict]):
        """히스토리 파일에 저장"""
        FGIHistoryService._ensure_data_dir()
        
        try:
            with open(FGIHistoryService.HISTORY_FILE, 'w', encoding='utf-8') as f:
                json.dump(history, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"[ERROR] FGI 히스토리 저장 실패: {e}")
    
    @staticmethod
    def _cleanup_old_data(history: List[Dict]) -> List[Dict]:
        """오래된 데이터 정리 (최근 MAX_DAYS일만 유지)"""
        cutoff_date = datetime.now() - timedelta(days=FGIHistoryService.MAX_DAYS)
        cutoff_str = cutoff_date.strftime("%Y-%m-%d")
        
        return [
            item for item in history
            if item.get("date", "") >= cutoff_str
        ]
    
    @staticmethod
    def update_daily_fgi():
        """매일 한 번 FGI를 가져와서 저장 (스케줄러에서 호출)"""
        try:
            fgi = FGIService.fetch_fgi()
            if not fgi:
                print("[WARNING] FGI를 가져올 수 없어 히스토리에 저장하지 않습니다.")
                return False
            
            history = FGIHistoryService._load_history()
            today = datetime.now().strftime("%Y-%m-%d")
            
            # 오늘 데이터가 이미 있는지 확인
            existing_index = None
            for i, item in enumerate(history):
                if item.get("date") == today:
                    existing_index = i
                    break
            
            # 오늘 데이터 추가 또는 업데이트
            new_entry = {
                "date": today,
                "score": fgi["score"],
                "rating": fgi["rating"],
                "timestamp": datetime.now().isoformat(),
            }
            
            if existing_index is not None:
                history[existing_index] = new_entry
            else:
                history.append(new_entry)
            
            # 날짜순 정렬
            history.sort(key=lambda x: x.get("date", ""))
            
            # 오래된 데이터 정리
            history = FGIHistoryService._cleanup_old_data(history)
            
            # 저장
            FGIHistoryService._save_history(history)
            print(f"[INFO] FGI 히스토리 업데이트 완료: {today} (score={fgi['score']})")
            return True
            
        except Exception as e:
            print(f"[ERROR] FGI 히스토리 업데이트 실패: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    @staticmethod
    def get_history(days: int = 365) -> List[Dict]:
        """히스토리 데이터 가져오기
        
        Args:
            days: 가져올 일수 (기본값: 365)
        
        Returns:
            List[Dict]: 히스토리 데이터 리스트
        """
        history = FGIHistoryService._load_history()
        
        if not history:
            # 히스토리가 없으면 오늘 데이터라도 추가
            FGIHistoryService.update_daily_fgi()
            history = FGIHistoryService._load_history()
        
        # 최근 days일만 필터링
        cutoff_date = datetime.now() - timedelta(days=days)
        cutoff_str = cutoff_date.strftime("%Y-%m-%d")
        
        filtered = [
            {
                "date": item.get("date"),
                "value": item.get("score", 0),
                "classification": item.get("rating", "Unknown"),
            }
            for item in history
            if item.get("date", "") >= cutoff_str
        ]
        
        return filtered
    
    @staticmethod
    def get_statistics() -> Dict:
        """FGI 통계 (분류별 비율)
        
        Returns:
            Dict: {
                "extreme_fear": float,
                "fear": float,
                "neutral": float,
                "greed": float,
                "extreme_greed": float,
                "total_days": int
            }
        """
        history = FGIHistoryService.get_history(days=365)
        
        if not history:
            return {
                "extreme_fear": 0.0,
                "fear": 0.0,
                "neutral": 0.0,
                "greed": 0.0,
                "extreme_greed": 0.0,
                "total_days": 0
            }
        
        total = len(history)
        classification_count = {
            "Extreme Fear": 0,
            "Fear": 0,
            "Neutral": 0,
            "Greed": 0,
            "Extreme Greed": 0,
        }
        
        for item in history:
            classification = item.get("classification", "Unknown")
            if classification in classification_count:
                classification_count[classification] += 1
        
        return {
            "extreme_fear": round(classification_count["Extreme Fear"] / total * 100, 2) if total > 0 else 0.0,
            "fear": round(classification_count["Fear"] / total * 100, 2) if total > 0 else 0.0,
            "neutral": round(classification_count["Neutral"] / total * 100, 2) if total > 0 else 0.0,
            "greed": round(classification_count["Greed"] / total * 100, 2) if total > 0 else 0.0,
            "extreme_greed": round(classification_count["Extreme Greed"] / total * 100, 2) if total > 0 else 0.0,
            "total_days": total
        }

