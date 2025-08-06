# build-apk.ps1

# === CONFIGURATION ===
# Set Android SDK Path
$env:ANDROID_HOME = "C:\Users\Aditya Deshmukh\AppData\Local\Android\Sdk"

# Ionic project path
$ionicProjectPath = "D:\BookLibrary"

# === EXECUTION ===
# Change to Ionic project directory
cd $ionicProjectPath

Write-Host "`n[1/5] Building Ionic project..." -ForegroundColor Cyan
ionic build

Write-Host "`n[2/5] Adding Android..." -ForegroundColor Cyan
npx cap add android

Write-Host "`n[3/5] Copying web assets to Android..." -ForegroundColor Cyan
npx cap copy android

Write-Host "`n[4/5] Preparing Android project..." -ForegroundColor Cyan
npx cap sync android

# Check/create local.properties file with sdk.dir
$localProps = "$ionicProjectPath\android\local.properties"
if (!(Test-Path $localProps)) {
    "sdk.dir=$env:ANDROID_HOME" | Out-File -Encoding UTF8 -FilePath $localProps
    Write-Host "`n[5/5] Created local.properties with SDK path." -ForegroundColor Yellow
} else {
    Write-Host "`n[5/5] local.properties already exists." -ForegroundColor Green
}

# Build the APK
Write-Host "`n[6/6] Building Android APK..." -ForegroundColor Cyan
cd "$ionicProjectPath\android"
.\gradlew assembleDebug

Write-Host "`nAPK generated successfully!"
Write-Host "Location: $ionicProjectPath\android\app\build\outputs\apk\debug"
