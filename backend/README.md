# Awaazera AASIST API

This service loads the bundled fine-tuned AASIST-L Urdu TTS+VC checkpoint once at startup and analyzes the complete recording as overlapping 64,600-sample windows (about 4.04 seconds at 16 kHz). It returns real class probabilities for every window plus a recording-level assessment.

## Local setup

Use Python 3.11 or 3.12 from this directory:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements-dev.txt
uvicorn app.main:app --reload --port 8000
```

`imageio-ffmpeg` supplies the decoder used to normalize WAV, MP3, M4A, FLAC, OGG, WebM, and AAC files to mono 16 kHz PCM. A system FFmpeg installation is not required.

Check `http://127.0.0.1:8000/health`, then send `multipart/form-data` to `POST /v1/analyze` with an `audio` file and `language=ur`.

## Runtime controls

Copy `.env.example` values into your process environment as needed. `AASIST_THRESHOLD` and `AASIST_UNCERTAINTY_MARGIN` determine the three-way verdict: synthetic, uncertain, or authentic. These defaults are integration defaults, not a completed domain calibration. Validate and calibrate them against a representative Urdu evaluation set before using decisions operationally.

The API deliberately does not claim to detect language, identify a voice generator, or provide spectral explanations. The supplied checkpoint supports spoof-versus-bonafide classification only.

## Tests

```powershell
pytest
```
