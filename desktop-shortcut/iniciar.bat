@echo off
cd /d "%~dp0.."

curl -s -o NUL -w "%%{http_code}" http://localhost:3001 > "%TEMP%\mf_status.txt" 2>NUL
set /p STATUS=<"%TEMP%\mf_status.txt"

if not "%STATUS%"=="200" (
  start "Minhas Financas - servidor" /min cmd /c "npm run start > ""%TEMP%\mf_server.log"" 2>&1"
  timeout /t 6 /nobreak > NUL
)

start "" http://localhost:3001
