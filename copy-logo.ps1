# BS Engineering Logo Copy Script
# This script helps you copy your logo to the correct location

$logoSource = Read-Host "Enter the full path to your logo file (e.g., C:\Downloads\bs-logo.png)"
$logoDestination = "backend\static\bs-engineering-logo.png"

if (Test-Path $logoSource) {
    Write-Host "Found logo file: $logoSource" -ForegroundColor Green
    
    # Ensure static directory exists
    $staticDir = "backend\static"
    if (-not (Test-Path $staticDir)) {
        New-Item -ItemType Directory -Path $staticDir -Force | Out-Null
        Write-Host "Created static directory" -ForegroundColor Yellow
    }
    
    # Copy the logo
    Copy-Item -Path $logoSource -Destination $logoDestination -Force
    Write-Host "✓ Logo copied successfully to: $logoDestination" -ForegroundColor Green
    
    # Verify
    if (Test-Path $logoDestination) {
        $fileInfo = Get-Item $logoDestination
        Write-Host "✓ Logo file size: $($fileInfo.Length) bytes" -ForegroundColor Green
        Write-Host ""
        Write-Host "Logo setup complete! Your PDFs will now use the new logo." -ForegroundColor Cyan
        Write-Host "To deploy: git add backend/static/bs-engineering-logo.png && git commit -m 'Add logo' && fly deploy" -ForegroundColor Yellow
    }
} else {
    Write-Host "✗ Logo file not found: $logoSource" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please:" -ForegroundColor Yellow
    Write-Host "1. Save the BS Engineering logo image" -ForegroundColor Yellow
    Write-Host "2. Note the full path where you saved it" -ForegroundColor Yellow
    Write-Host "3. Run this script again" -ForegroundColor Yellow
}
