# ============================================================
# AtlasERP - PostgreSQL Service Fix + Backend Launcher
# RUN THIS AS ADMINISTRATOR (right-click > "Run as Administrator")
# ============================================================

$PG_SERVICE = "postgresql-x64-15"
$PG_BIN     = "C:\Program Files\PostgreSQL\15\bin"
$PG_DATA    = "C:\Program Files\PostgreSQL\15\data"

Write-Host "=== Checking PostgreSQL service ===" -ForegroundColor Cyan

$svc = sc.exe query $PG_SERVICE 2>&1
if ($svc -match "1060") {
    Write-Host "Service not registered. Registering now..." -ForegroundColor Yellow

    sc.exe create $PG_SERVICE `
        binPath= "`"$PG_BIN\postgres.exe`" runservice -N `"$PG_SERVICE`" -D `"$PG_DATA`"" `
        obj= "NT AUTHORITY\NetworkService" `
        start= auto `
        DisplayName= $PG_SERVICE

    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to create service. Are you running as Administrator?" -ForegroundColor Red
        exit 1
    }
    Write-Host "Service registered." -ForegroundColor Green
} else {
    Write-Host "Service already registered." -ForegroundColor Green
}

Write-Host "=== Starting PostgreSQL ===" -ForegroundColor Cyan
net start $PG_SERVICE

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Could not start PostgreSQL service." -ForegroundColor Red
    Write-Host "Check Windows Event Viewer > Application logs for details." -ForegroundColor Yellow
    exit 1
}

Write-Host "PostgreSQL started on port 5432." -ForegroundColor Green

Write-Host "=== Waiting for DB to be ready ===" -ForegroundColor Cyan
Start-Sleep -Seconds 3

Write-Host "=== Starting AtlasERP Backend ===" -ForegroundColor Cyan
Set-Location "C:\Users\LENOVO\Desktop\AtlasERP\backend"
npm run start:dev
