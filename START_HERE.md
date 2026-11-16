# Start Awaazera after unzipping

The package contains the complete Next.js frontend and FastAPI backend with the fine-tuned AASIST-L Urdu TTS+VC checkpoint. It intentionally excludes generated dependencies and research datasets to keep the archive small and portable.

## Requirements

- Windows 10 or 11
- Node.js 22.13 or newer
- Python 3.12

Verify both runtimes in PowerShell:

```powershell
node --version
npm.cmd --version
py -3.12 --version
```

## Terminal 1: backend

Run these commands from the unzipped project folder:

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m ensurepip --upgrade
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Leave that terminal open. After `Application startup complete` appears, verify the model from another PowerShell window:

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/health"
```

The response should report `model_loaded: True` and `model_name: AASIST-L Urdu TTS+VC`.

## Terminal 2: frontend

Run these commands from the project root:

```powershell
Copy-Item .env.example .env.local -Force
npm.cmd install
npm.cmd run dev
```

Open the application:

```powershell
Start-Process "http://localhost:3000/studio?view=analyze"
```

Upload a supported audio file, accept the permission checkbox, and run the analysis. WAV, MP3, M4A, FLAC, OGG, WebM, and AAC files up to 50 MB are accepted.

## Later runs

Backend:

```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Frontend, from the project root:

```powershell
npm.cmd run dev
```

