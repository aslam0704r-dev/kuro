@echo off
cd /d "%~dp0"
node -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>22||(a===22&&b>=13)?0:1)"
if errorlevel 1 (
 echo Install Node.js 22.13 or newer, then retry.
 pause
 exit /b 1
)
if not exist node_modules (
 call npm ci --omit=dev
 if errorlevel 1 exit /b 1
)
echo Read docs\ACCOUNTS.md to activate verification, OTP and Google.
echo Open http://localhost:8081 for default local settings.
call npm start
pause
