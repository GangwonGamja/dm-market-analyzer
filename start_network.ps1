# 네트워크 접근용 시작 스크립트
Write-Host "=== DM 시황 분석기 네트워크 모드 시작 ===" -ForegroundColor Cyan

# 현재 IP 주소 확인
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.InterfaceAlias -notlike "*Loopback*" -and 
    $_.IPAddress -notlike "169.254.*"
}).IPAddress | Select-Object -First 1

if (-not $ipAddress) {
    Write-Host "IP 주소를 찾을 수 없습니다." -ForegroundColor Red
    exit 1
}

Write-Host "`n현재 컴퓨터 IP 주소: $ipAddress" -ForegroundColor Green
Write-Host "백엔드 URL: http://$ipAddress:8000" -ForegroundColor Yellow
Write-Host "프론트엔드 URL: http://$ipAddress:3000" -ForegroundColor Yellow
Write-Host "`n다른 컴퓨터에서 접근하려면 위 URL을 사용하세요." -ForegroundColor Cyan
Write-Host "`n방화벽 설정이 필요할 수 있습니다." -ForegroundColor Yellow
Write-Host "`n=== 백엔드 시작 ===" -ForegroundColor Cyan

# 백엔드 시작 (새 창)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; `$env:VITE_API_URL='http://$ipAddress:8000'; uvicorn main:app --host 0.0.0.0 --port 8000"

Start-Sleep -Seconds 3

Write-Host "`n=== 프론트엔드 시작 ===" -ForegroundColor Cyan

# 프론트엔드 시작
Set-Location frontend
$env:VITE_API_URL = "http://$ipAddress:8000"
npm run dev -- --host 0.0.0.0

