"""
Render 무료 서버 24시간 유지 트릭
15분마다 자체 ping을 보내서 서버가 잠들지 않도록 함
"""
import time
import threading
import requests
import os
from typing import Optional

# Render 배포 URL (환경 변수에서 읽거나 기본값 사용)
RENDER_URL: Optional[str] = os.getenv("RENDER_URL") or os.getenv("RENDER_EXTERNAL_URL")

def keep_alive():
    """10분마다 자체 서버에 ping을 보내서 서버가 잠들지 않도록 함"""
    if not RENDER_URL:
        print("[INFO] RENDER_URL이 설정되지 않아 keep_alive 기능이 비활성화됩니다.")
        print("[INFO] Render 배포 후 RENDER_URL 환경 변수를 설정하세요.")
        return
    
    print(f"[INFO] Keep-alive 스케줄러 시작: {RENDER_URL}")
    
    while True:
        try:
            # /health 엔드포인트로 ping (가벼운 요청)
            response = requests.get(f"{RENDER_URL}/health", timeout=10)
            if response.status_code == 200:
                print(f"[INFO] Keep-alive ping 성공: {response.status_code}")
            else:
                print(f"[WARNING] Keep-alive ping 응답: {response.status_code}")
        except requests.exceptions.RequestException as e:
            print(f"[WARNING] Keep-alive ping 실패: {e}")
        except Exception as e:
            print(f"[ERROR] Keep-alive 오류: {e}")
        
        # 10분(600초)마다 실행
        time.sleep(600)

# 백그라운드 스레드로 실행
def start_keep_alive():
    """Keep-alive 스레드 시작"""
    if RENDER_URL:
        thread = threading.Thread(target=keep_alive, daemon=True)
        thread.start()
        print(f"[INFO] Keep-alive 스레드 시작됨 (daemon=True)")
    else:
        print("[INFO] RENDER_URL이 없어 keep-alive가 시작되지 않습니다.")

