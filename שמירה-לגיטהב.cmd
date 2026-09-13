@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo   שומר את המשחק ל-GitHub ומעדכן את האתר
echo ============================================
echo.

git add -A
git commit -m "update %date% %time%"
if errorlevel 1 echo (no changes to save)

git push
if errorlevel 1 (
  echo.
  echo ** push failed - check internet / GitHub sign-in **
) else (
  echo.
  echo Done. Live site updates in about a minute:
  echo   https://anat1969.github.io/COLOR_GAME-GH/
)

echo.
pause
