# Capacitor Step 6 (Mobile)

This project now has initial Capacitor scaffold in `packages/web/src-capacitor`.
Quasar also requires `packages/web/index.html` as entry template.

## Run setup (PowerShell, copy/paste)

```powershell
Set-Location D:\dev\bndstr
powershell -ExecutionPolicy Bypass -File .\scripts\setup-capacitor.ps1
```

## Prerequisites

- Android build: JDK 21+ (`java -version`)
- Android SDK/Studio installed
- iOS build: macOS + Xcode (script auto-skips iOS on Windows/Linux)

Optional custom app id/name:

```powershell
Set-Location D:\dev\bndstr
powershell -ExecutionPolicy Bypass -File .\scripts\setup-capacitor.ps1 -AppId "com.example.bndstr" -AppName "bndstr" -SkipIos
```

## Manual commands (if script is interrupted)

```powershell
Set-Location D:\dev\bndstr
"org.capacitor.bndstr`nbndstr`n" | pnpm --filter @bndstr/web exec quasar mode add capacitor
pnpm --filter @bndstr/web run build:android
# macOS only:
pnpm --filter @bndstr/web run build:ios
```

## Deep-link placeholders

Current app id is configured in:
- `packages/web/src-capacitor/capacitor.config.json`

For production deep links/universal links, complete native platform configs after Android/iOS projects are generated:
- Android intent filters (`AndroidManifest.xml`)
- iOS Associated Domains entitlements (`*.entitlements`)
