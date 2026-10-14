$ErrorActionPreference='Stop'
$kuroRoot=Split-Path (Split-Path $PSScriptRoot)
$kuroCompiler=Join-Path $env:WINDIR 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
if (-not (Test-Path -LiteralPath $kuroCompiler)) { $kuroCompiler=Join-Path $env:WINDIR 'Microsoft.NET/Framework/v4.0.30319/csc.exe' }
$kuroBuild=Join-Path $PSScriptRoot 'build'
New-Item -ItemType Directory -Path $kuroBuild -Force | Out-Null
$kuroCommon=@('/nologo','/target:winexe','/platform:anycpu','/optimize+',('/win32icon:'+(Join-Path $kuroRoot 'dist/favicon.ico')),('/win32manifest:'+(Join-Path $PSScriptRoot 'app.manifest')),'/reference:System.Windows.Forms.dll','/reference:System.Drawing.dll')
$kuroLauncher=Join-Path $kuroBuild 'Kuro.exe'
& $kuroCompiler @kuroCommon "/out:$kuroLauncher" /main:Kuro.Native.Launcher (Join-Path $PSScriptRoot 'InstallCore.cs') (Join-Path $PSScriptRoot 'Launcher.cs')
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
$kuroDownloads=Join-Path $kuroRoot 'dist/downloads'
New-Item -ItemType Directory -Path $kuroDownloads -Force | Out-Null
$kuroInstaller=Join-Path $kuroDownloads 'KURO-3.9.0-windows.exe'
& $kuroCompiler @kuroCommon "/out:$kuroInstaller" /main:Kuro.Native.Installer "/resource:$kuroLauncher,KuroLauncher" (Join-Path $PSScriptRoot 'InstallCore.cs') (Join-Path $PSScriptRoot 'Launcher.cs') (Join-Path $PSScriptRoot 'Installer.cs')
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'Kuro.exe.config') -Destination ($kuroLauncher+'.config')
Write-Output "Built KURO 3.9.0 Windows per-user installer and launcher."
