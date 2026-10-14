$ErrorActionPreference='Stop'
$kuroRoot=Split-Path $PSScriptRoot
$kuroCore=Join-Path $kuroRoot 'native/windows/InstallCore.cs'
if (-not (Test-Path -LiteralPath $kuroCore)) { Write-Output 'FAIL: Windows installation feature is not implemented'; exit 1 }
$kuroEvidence=Join-Path $kuroRoot 'work/native-evidence'
New-Item -ItemType Directory -Path $kuroEvidence -Force | Out-Null
$kuroCompiler=Join-Path $env:WINDIR 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
$kuroHarness=Join-Path $kuroEvidence 'WindowsChecks.exe'
& $kuroCompiler /nologo /target:exe "/out:$kuroHarness" /main:InstallerTests $kuroCore (Join-Path $PSScriptRoot 'windows-installer-tests.cs')
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& $kuroHarness (Join-Path $kuroRoot 'native/windows/build/Kuro.exe')
exit $LASTEXITCODE
