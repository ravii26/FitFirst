@echo off
echo Starting FitFirst AI Garment Scanner Microservice...
cd /d "%~dp0"
if not exist ".venv" (
    python -m venv .venv
)
call .venv\Scripts\activate.bat
echo Installing dependencies from requirements.txt (torch/transformers may take a while on first run)...
pip install -r requirements.txt
python main.py
