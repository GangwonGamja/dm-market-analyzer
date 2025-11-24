# 프론트엔드 실행 스크립트
Write-Host "=== VIG-QLD 투자 어드바이저 프론트엔드 시작 ===" -ForegroundColor Cyan

# Node.js 확인
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js가 설치되어 있지 않습니다!" -ForegroundColor Red
    Write-Host "다음 주소에서 Node.js를 설치해주세요: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "설치 후 PowerShell을 재시작하고 다시 시도하세요." -ForegroundColor Yellow
    exit 1
}

Write-Host "Node.js 버전: $(node --version)" -ForegroundColor Green
Write-Host "npm 버전: $(npm --version)" -ForegroundColor Green

$frontendPath = Join-Path $PSScriptRoot "frontend"
$nodeModulesPath = Join-Path $frontendPath "node_modules"

if (-not (Test-Path $nodeModulesPath)) {
    Write-Host "프론트엔드 패키지 설치 중..." -ForegroundColor Yellow
    Set-Location $frontendPath
    npm install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "패키지 설치 실패!" -ForegroundColor Red
        exit 1
    }
}

Write-Host "프론트엔드 개발 서버 시작 중..." -ForegroundColor Green
Set-Location $frontendPath
npm run dev



