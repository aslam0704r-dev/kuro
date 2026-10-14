param([string]$Keystore=$env:KURO_ANDROID_KEYSTORE,[string]$KeyAlias='kuro',[string]$Gradle=$env:KURO_GRADLE)
$ErrorActionPreference='Stop'
$kuroRoot=Split-Path (Split-Path $PSScriptRoot)
$kuroSdk=$env:ANDROID_SDK_ROOT
if (-not $kuroSdk) { $kuroSdk=$env:ANDROID_HOME }
if (-not $kuroSdk -or -not (Test-Path -LiteralPath $kuroSdk)) { throw 'Set ANDROID_SDK_ROOT to an installed Android SDK with platform 36 and build-tools 36.0.0.' }
if (-not $Keystore -or -not (Test-Path -LiteralPath $Keystore) -or -not $env:KURO_APK_PASSWORD) { throw 'Provide the private signing keystore and KURO_APK_PASSWORD locally; never upload or paste them.' }
$kuroJava=Get-Command java -ErrorAction Stop
if (-not $env:JAVA_HOME) { $env:JAVA_HOME=Split-Path (Split-Path $kuroJava.Source) }
Set-Content -LiteralPath (Join-Path $PSScriptRoot 'local.properties') -Value ('sdk.dir='+$kuroSdk.Replace('\','/')) -Encoding ascii
Push-Location $PSScriptRoot
try {
    if (-not $Gradle) { $Gradle=Join-Path $PSScriptRoot 'gradlew.bat' }
    & $Gradle --no-daemon --console=plain --max-workers=2 :app:assembleRelease
    if ($LASTEXITCODE -ne 0) { throw 'Android compilation failed.' }
    $kuroTools=Join-Path $kuroSdk 'build-tools/36.0.0'
    $kuroUnsigned=Join-Path $PSScriptRoot 'app/build/outputs/apk/release/app-release-unsigned.apk'
    $kuroAligned=Join-Path $PSScriptRoot 'app/build/outputs/apk/release/kuro-aligned.apk'
    & (Join-Path $kuroTools 'zipalign.exe') -p -f 4 $kuroUnsigned $kuroAligned
    if ($LASTEXITCODE -ne 0) { throw 'APK alignment failed.' }
    $kuroDownloads=Join-Path $kuroRoot 'dist/downloads'
    New-Item -ItemType Directory -Path $kuroDownloads -Force | Out-Null
    $kuroApk=Join-Path $kuroDownloads 'KURO-3.9.0-android.apk'
    & (Join-Path $kuroTools 'apksigner.bat') sign --ks $Keystore --ks-key-alias $KeyAlias --ks-pass env:KURO_APK_PASSWORD --key-pass env:KURO_APK_PASSWORD --min-sdk-version 29 --out $kuroApk $kuroAligned
    if ($LASTEXITCODE -ne 0) { throw 'APK signing failed.' }
    $kuroSignature=& (Join-Path $kuroTools 'apksigner.bat') verify --verbose --print-certs $kuroApk
    if ($LASTEXITCODE -ne 0) { throw 'APK signature verification failed.' }
    $kuroCertMatch=[regex]::Match(($kuroSignature -join "`n"),'Signer #1 certificate SHA-256 digest: ([a-fA-F0-9]{64})')
    if (-not $kuroCertMatch.Success) { throw 'Could not extract public signing certificate digest.' }
    $kuroFingerprint=([regex]::Matches($kuroCertMatch.Groups[1].Value.ToUpperInvariant(),'.{2}') | ForEach-Object { $_.Value }) -join ':'
    $kuroAssetLinks=@(@{relation=@('delegate_permission/common.handle_all_urls');target=@{namespace='android_app';package_name='app.kuro.manga';sha256_cert_fingerprints=@($kuroFingerprint)}})
    $kuroWellKnown=Join-Path $kuroRoot 'dist/.well-known'
    New-Item -ItemType Directory -Path $kuroWellKnown -Force | Out-Null
    $ErrorActionPreference='Continue'
    & keytool -exportcert -keystore $Keystore -alias $KeyAlias -storepass:env KURO_APK_PASSWORD -file (Join-Path $kuroWellKnown 'android-signing-cert.der') 2>&1 | Out-Null
    $kuroCertificateExit=$LASTEXITCODE
    $ErrorActionPreference='Stop'
    if ($kuroCertificateExit -ne 0) { throw 'Could not export public Android signing certificate.' }
    [System.IO.File]::WriteAllText((Join-Path $kuroWellKnown 'assetlinks.json'),(ConvertTo-Json -InputObject $kuroAssetLinks -Depth 5),(New-Object System.Text.UTF8Encoding($false)))
    $kuroResults=Join-Path $kuroRoot 'docs/test-results'
    New-Item -ItemType Directory -Path $kuroResults -Force | Out-Null
    $kuroSignature | Set-Content -LiteralPath (Join-Path $kuroResults 'apk-signature.txt') -Encoding utf8
    & (Join-Path $kuroTools 'aapt.exe') dump badging $kuroApk | Set-Content -LiteralPath (Join-Path $kuroResults 'apk-badging.txt') -Encoding utf8
    if ($LASTEXITCODE -ne 0) { throw 'APK manifest inspection failed.' }
    Write-Output 'Built, signed and verified KURO 3.9.0 APK; generated matching public Digital Asset Links.'
} finally { Pop-Location }
