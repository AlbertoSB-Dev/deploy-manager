@echo off
echo Limpando cache do Next.js...
rmdir /s /q .next 2>nul
rmdir /s /q node_modules\.cache 2>nul
echo Cache limpo!
echo.
echo Agora execute: npm run dev
pause
