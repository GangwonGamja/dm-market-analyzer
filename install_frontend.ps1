# 프론트엔드 패키지 설치 스크립트
Write-Host "=== 프론트엔드 패키지 설치 ===" -ForegroundColor Cyan

# Node.js 확인
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js가 설치되어 있지 않습니다!" -ForegroundColor Red
    Write-Host "" -ForegroundColor Yellow
    Write-Host "Node.js 설치 방법:" -ForegroundColor Yellow
    Write-Host "1. https://nodejs.org/ 접속" -ForegroundColor Yellow
    Write-Host "2. LTS 버전 다운로드 및 설치" -ForegroundColor Yellow
    Write-Host "3. PowerShell 재시작" -ForegroundColor Yellow
    Write-Host "4. 이 스크립트 다시 실행" -ForegroundColor Yellow
    exit 1
}

Write-Host "Node.js 버전: $(node --version)" -ForegroundColor Green
Write-Host "npm 버전: $(npm --version)" -ForegroundColor Green

$frontendPath = Join-Path $PSScriptRoot "frontend"

if (-not (Test-Path $frontendPath)) {
    Write-Host "ERROR: frontend 폴더를 찾을 수 없습니다!" -ForegroundColor Red
    exit 1
}

Write-Host "프론트엔드 패키지 설치 중..." -ForegroundColor Yellow
Set-Location $frontendPath
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "" -ForegroundColor Green
    Write-Host "✓ 프론트엔드 패키지 설치 완료!" -ForegroundColor Green
    Write-Host "" -ForegroundColor Green
    Write-Host "다음 명령으로 프론트엔드를 실행할 수 있습니다:" -ForegroundColor Cyan
    Write-Host "  .\start_frontend.ps1" -ForegroundColor Cyan
    Write-Host "  또는" -ForegroundColor Cyan
    Write-Host "  cd frontend" -ForegroundColor Cyan
    Write-Host "  npm run dev" -ForegroundColor Cyan
} else {
    Write-Host "" -ForegroundColor Red
    Write-Host "패키지 설치 중 오류가 발생했습니다." -ForegroundColor Red
    exit 1
}



