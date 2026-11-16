# Awaazera final package

This distribution contains the complete runnable frontend and backend for the Awaazera FYP application.

## Runtime model

- Model: AASIST-L Urdu TTS+VC fine-tuned checkpoint
- File: `backend/artifacts/AASIST-Urdu-TTS-VC.pth`
- SHA-256: `fbdf8b7fa7f0e6cd997f4be35ac4100bcf5582191ae005dc257b4f1f9063f64c`
- Input: mono 16 kHz audio
- Inference: overlapping 64,600-sample windows across the complete recording

## Included

- Next.js frontend source and public assets
- FastAPI inference service
- Fine-tuned AASIST checkpoint, architecture and configuration
- Frontend and backend tests
- Dependency manifests
- Environment examples
- AASIST license and third-party notices
- `START_HERE.md` setup instructions

## Intentionally excluded

- `node_modules`
- `.next` build output
- Python `.venv`
- Python and test caches
- Git history
- The 6.6 GB `backend_source` research archive
- Original ZIP downloads and prepared training/evaluation datasets
- Alternate CNN, SSL and Whisper comparison checkpoints
- The unused zero-shot AASIST checkpoint

All excluded generated dependencies can be recreated using the commands in `START_HERE.md`.

