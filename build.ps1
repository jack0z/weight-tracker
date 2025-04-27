# Clean previous builds
Write-Host "Cleaning previous builds..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .next, out -ErrorAction SilentlyContinue

# Build the application
Write-Host "Building Next.js application..." -ForegroundColor Yellow
npm run build

# Verify output directory
if (!(Test-Path "out")) {
    Write-Error "Build failed - 'out' directory not created"
    exit 1
}

# Copy static assets
Write-Host "Copying static assets..." -ForegroundColor Yellow
Copy-Item -Path "public\*" -Destination "out\" -Recurse -Force

Write-Host "Build completed successfully!" -ForegroundColor Green