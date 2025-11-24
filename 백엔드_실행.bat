@echo off
chcp 65001 >nul
title VIG-QLD 백엔드 서버
color 0A

cd /d "%~dp0backend"
call venv\Scripts\activate.bat
python main.py



