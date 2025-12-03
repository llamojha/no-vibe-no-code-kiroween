# PowerShell script to start development server with mock mode enabled
# Usage: .\scripts\start-test-server.ps1

Write-Host "🚀 Starting development server with mock mode enabled..." -ForegroundColor Green

# Set environment variables for mock mode
$env:FF_USE_MOCK_API = "true"
$env:NEXT_PUBLIC_FF_USE_MOCK_API = "true"
$env:FF_MOCK_SCENARIO = "success"
$env:FF_SIMULATE_LATENCY = "false"
$env:FF_LOG_MOCK_REQUESTS = "true"
$env:NODE_ENV = "development"

Write-Host "✅ Mock mode environment variables set:" -ForegroundColor Cyan
Write-Host "   FF_USE_MOCK_API = $env:FF_USE_MOCK_API" -ForegroundColor Gray
Write-Host "   NEXT_PUBLIC_FF_USE_MOCK_API = $env:NEXT_PUBLIC_FF_USE_MOCK_API" -ForegroundColor Gray
Write-Host "   FF_MOCK_SCENARIO = $env:FF_MOCK_SCENARIO" -ForegroundColor Gray
Write-Host "   FF_SIMULATE_LATENCY = $env:FF_SIMULATE_LATENCY" -ForegroundColor Gray
Write-Host ""
Write-Host "🌐 Starting Next.js development server..." -ForegroundColor Green
Write-Host ""

# Start the development server
npm run dev
