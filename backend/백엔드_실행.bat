@echo off
chcp 65001 >nul
echo ============================================
echo  백엔드 서버 실행
echo ============================================
echo.

cd /d "%~dp0"

if not exist "venv\Scripts\python.exe" (
    echo [오류] 가상환경을 찾을 수 없습니다.
    echo 가상환경을 생성하고 패키지를 설치해주세요.
    pause
    exit /b 1
)

echo [1] 가상환경 활성화...
call venv\Scripts\activate.bat

echo [2] 필수 패키지 확인 중...
python -c "import feedparser, bs4, vaderSentiment, nltk" 2>nul
if errorlevel 1 (
    echo [경고] 일부 패키지가 설치되지 않았습니다.
    echo [3] 필수 패키지 설치 중...
    pip install feedparser beautifulsoup4 lxml vaderSentiment nltk newspaper3k requests-html selenium --quiet
    echo 패키지 설치 완료.
)

echo [4] 백엔드 서버 시작...
echo 서버 주소: http://localhost:8000
echo API 문서: http://localhost:8000/docs
echo.
python main.py

pause



