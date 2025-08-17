# build-release-apk.ps1

# === CONFIGURATION ===
# Set Android SDK Path
$env:ANDROID_HOME = "C:\Users\Aditya Deshmukh\AppData\Local\Android\Sdk"
$env:PATH = "$env:ANDROID_HOME\tools;$env:ANDROID_HOME\platform-tools;$env:PATH"

# Paths
$projectPath = "D:\BookLibrary"
$keystoreFile = "$projectPath\release-key.jks"
$keystoreAlias = "release-key"
$keystorePassword = "password123"
$keyPassword = "password123"
$outputApk = "$projectPath\app-release.apk"

# Navigate to project folder
Set-Location $projectPath

# Step 1: Install dependencies if needed
if (!(Test-Path "node_modules")) {
    Write-Host "[1/6] Installing dependencies..." -ForegroundColor Yellow
    npm install
} else {
    Write-Host "[1/6] Dependencies already installed." -ForegroundColor Green
}

# Step 2: Build Ionic app for production
Write-Host "[2/6] Building Ionic app for production..." -ForegroundColor Cyan
npm run build:prod

# Step 3: Ensure Android platform exists
if (!(Test-Path "android")) {
    Write-Host "[3/6] Adding Android platform..." -ForegroundColor Cyan
    npx cap add android
} else {
    Write-Host "[3/6] Android platform already exists." -ForegroundColor Green
}

# Step 4: Sync with Capacitor
Write-Host "[4/6] Syncing with Capacitor..." -ForegroundColor Cyan
npx cap copy android
npx cap sync android

# Step 5: Setup local.properties for Android SDK
$localProps = "$projectPath\android\local.properties"
if (!(Test-Path $localProps)) {
    $androidSdkPath = $env:ANDROID_HOME -replace '\\', '/'
    "sdk.dir=$androidSdkPath" | Out-File -Encoding UTF8 -FilePath $localProps
    Write-Host "Created local.properties with SDK path." -ForegroundColor Yellow
}

# Step 6: Generate keystore if not exists
if (-Not (Test-Path $keystoreFile)) {
    Write-Host "[5/6] Generating new keystore..." -ForegroundColor Yellow
    keytool -genkey -v -keystore $keystoreFile -alias $keystoreAlias -keyalg RSA -keysize 2048 -validity 10000 `
        -storepass $keystorePassword -keypass $keyPassword `
        -dname "CN=BookLibrary, OU=Dev, O=BookLibrary, L=Pune, ST=Maharashtra, C=IN"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to generate keystore"
        exit 1
    }
} else {
    Write-Host "[5/6] Keystore already exists." -ForegroundColor Green
}

# Step 7: Build signed release APK
Write-Host "[6/6] Building signed release APK..." -ForegroundColor Cyan
Set-Location "$projectPath\android"

# Use gradlew.bat on Windows
if (Test-Path ".\gradlew.bat") {
    .\gradlew.bat assembleRelease
} else {
    Write-Error "gradlew.bat not found. Please ensure Android platform is properly set up."
    exit 1
}

if ($LASTEXITCODE -ne 0) {
    Write-Error "Release APK build failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

# Step 8: Copy APK to project root
$signedApk = Join-Path $projectPath "android\app\build\outputs\apk\release\app-release.apk"
$unsignedApk = Join-Path $projectPath "android\app\build\outputs\apk\release\app-release-unsigned.apk"

$generatedApk = $null
if (Test-Path $signedApk) {
    $generatedApk = $signedApk
    Write-Host "✅ Signed release APK found!" -ForegroundColor Green
} elseif (Test-Path $unsignedApk) {
    $generatedApk = $unsignedApk
    Write-Host "⚠️  Unsigned release APK found (signing may have failed)" -ForegroundColor Yellow
} else {
    Write-Error "❌ APK build failed. No APK found in release folder"
    Get-ChildItem "$projectPath\android\app\build\outputs\apk\release\" -ErrorAction SilentlyContinue | ForEach-Object { Write-Host "Found: $($_.Name)" }
    exit 1
}

if ($generatedApk) {
    Copy-Item $generatedApk $outputApk -Force
    Write-Host "✅ Release APK copied successfully!" -ForegroundColor Green
    Write-Host "Location: $outputApk" -ForegroundColor Green
    
    # Show file size
    $fileSize = (Get-Item $outputApk).Length / 1MB
    Write-Host "Size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Green
}
