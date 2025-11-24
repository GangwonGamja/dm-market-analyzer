# 백엔드 실행 스크립트
Write-Host "=== VIG-QLD 투자 어드바이저 백엔드 시작 ===" -ForegroundColor Cyan

$backendPath = Join-Path $PSScriptRoot "backend"
$venvPath = Join-Path $backendPath "venv\Scripts\Activate.ps1"

if (-not (Test-Path $venvPath)) {
    Write-Host "가상환경이 없습니다. 생성 중..." -ForegroundColor Yellow
    Set-Location $backendPath
    python -m venv venv
}

Write-Host "가상환경 활성화 중..." -ForegroundColor Green
Set-Location $backendPath
& $venvPath

Write-Host "백엔드 서버 시작 중..." -ForegroundColor Green
python main.py



