@echo off
title Initialize PostgreSQL Database
echo ====================================================
echo Initializing Inventory and Sales Tracker Database...
echo ====================================================
echo.
cd server
node src/config/initDb.js
echo.
pause
