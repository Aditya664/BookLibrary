# BookLibrary - Secure Production Build Instructions

## Security Features Implemented

✅ **Network Security**
- Disabled cleartext traffic (`usesCleartextTraffic="false"`)
- HTTPS-only communication (`androidScheme: 'https'`)
- Network security configuration file

✅ **Build Optimization**
- Code minification enabled
- Resource shrinking enabled
- ProGuard optimization
- Debug mode disabled in release builds

✅ **App Configuration**
- Consistent app ID across all files (`com.adbooklib.app`)
- Proper namespace configuration
- Secure build types

## Build Commands

### Option 1: Using NPM Scripts (Recommended)
```bash
# Build production APK
npm run android:release

# Build debug APK (for testing)
npm run android:debug
```

### Option 2: Using PowerShell Script
```powershell
# Run the secure production build script
.\build-release-apk.ps1
```

### Option 3: Manual Steps
```bash
# 1. Build for production
npm run build:prod

# 2. Copy to Android
npx cap copy android

# 3. Sync Android project
npx cap sync android

# 4. Build release APK
cd android
./gradlew assembleRelease
```

## Output Locations

- **Release APK**: `android/app/build/outputs/apk/release/app-release.apk`
- **Debug APK**: `android/app/build/outputs/apk/debug/app-debug.apk`

## Security Checklist

Before distributing your APK, ensure:

- [ ] Built using `assembleRelease` (not `assembleDebug`)
- [ ] No cleartext traffic warnings
- [ ] Code is minified and obfuscated
- [ ] Debug mode is disabled
- [ ] App uses HTTPS for all network requests
- [ ] Network security config is properly configured

## Troubleshooting

### If you get cleartext traffic warnings:
- Ensure your API endpoints use HTTPS
- Update `network_security_config.xml` with your actual domain
- Verify `capacitor.config.ts` uses `androidScheme: 'https'`

### If build fails:
- Run `./gradlew clean` before building
- Check that Android SDK path is correct in `local.properties`
- Ensure all dependencies are installed: `npm install`

## App Signing (For Play Store)

To sign your APK for Play Store distribution:

1. Generate a signing key:
```bash
keytool -genkey -v -keystore my-release-key.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias
```

2. Add to `android/app/build.gradle`:
```gradle
android {
    signingConfigs {
        release {
            storeFile file('path/to/my-release-key.keystore')
            storePassword 'your-store-password'
            keyAlias 'my-key-alias'
            keyPassword 'your-key-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            // ... other release config
        }
    }
}
```

3. Build signed APK:
```bash
./gradlew assembleRelease
```

## Notes

- The release APK will be unsigned by default
- For Play Store distribution, you need to sign the APK
- Always test the release build before distribution
- Keep your signing keys secure and backed up
