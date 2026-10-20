@echo off
title Shop Inventory & POS - Start Dev Servers
echo ====================================================
echo Starting Inventory & Sales Tracker for Small Shops
echo ====================================================
echo.
echo Starting Express Backend on port 5000...
start "Backend API (Port 5000)" cmd /k "cd server && npm run dev"

timeout /t 3 /nobreak >nul

echo Starting React Frontend on port 5173...
start "Frontend UI (Port 5173)" cmd /k "cd client && npm run dev"

echo.
echo ====================================================
echo Both servers are launching!
echo Backend:  http://localhost:5000/api
echo Frontend: http://localhost:5173
echo ====================================================
pause
