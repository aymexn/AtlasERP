# Script to free ports 3000 and 3001
Write-Host "Checking ports 3000 and 3001..." -ForegroundColor Cyan

# Kill node processes
Write-Host "Killing all running Node.exe processes..." -ForegroundColor Yellow
Stop-Process -Name node -Force -ErrorAction SilentlyContinue

# Target ports 3000 and 3001 specifically
$ports = @(3000, 3001)
foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        foreach ($conn in $connections) {
            $targetPid = $conn.OwningProcess
            if ($targetPid) {
                $proc = Get-Process -Id $targetPid -ErrorAction SilentlyContinue
                if ($proc) {
                    if ($proc.Name -eq "EonVPNRoutingService") {
                        Write-Warning "Port 3000 is occupied by EonVPN Routing Service (system service). You need to run PowerShell as Administrator and run: Stop-Service EonVPNRoutingService"
                    } else {
                        Write-Host "Killing process $($proc.Name) (PID: $targetPid) on port $port..." -ForegroundColor Red
                        Stop-Process -Id $targetPid -Force -ErrorAction SilentlyContinue
                    }
                }
            }
        }
    }
}

Write-Host "Done! Ports 3000 and 3001 checked." -ForegroundColor Green
