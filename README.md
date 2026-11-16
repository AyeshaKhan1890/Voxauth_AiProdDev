# Awaazera

A production-oriented Next.js interface for voice authenticity and audio forensics, connected to a local FastAPI service using the fine-tuned AASIST-L Urdu TTS+VC checkpoint.

## Local development

Requirements: Node.js 22.13 or newer and Python 3.11 or 3.12.

```powershell
cd C:\Users\Office\Desktop\awaazera-frontend
npm install
Copy-Item .env.example .env.local
```

Start the AASIST API in the first terminal:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements-dev.txt
uvicorn app.main:app --reload --port 8000
```

Start Next.js in a second terminal:

```powershell
npm run dev
```

Open `http://localhost:3000/studio?view=analyze`. The Next.js route `/api/analyze` proxies the upload to `AASIST_API_URL`, which defaults to `http://127.0.0.1:8000`.

## Local production build

```powershell
cd C:\Users\Office\Desktop\awaazera-frontend
npm install
npm run build
npm run start
```

Open `http://localhost:3000`. To use another port, run `npm run start -- -p 3001`.

## Quality checks

```powershell
npm run lint
npm test
npm run build
cd backend
pytest
```

## Product surfaces

- `/` — immersive marketing page, interactive detector demo, product story, model coverage, and privacy narrative
- `/studio` — operational dashboard
- `/studio?view=analyze` — upload/record analysis workflow
- `/studio?view=history` — analysis history
- `/studio?view=cases` — investigation cases
- `/studio?view=analytics` — model analytics
- `/studio?view=coverage` — language coverage
- `/studio?view=settings` — workspace settings
- `/api/analyze` — server-side proxy to `POST /v1/analyze` on the AASIST service

The interface includes three persistent visual atmospheres: Spectral, Ember, and Aurora. WebGL scenes automatically fall back to a lightweight CSS visual when the user requests reduced motion.

See `FRONTEND_IMPLEMENTATION_PLAN.md` for the backend contract, architecture, rollout phases, accessibility requirements, and production roadmap.

The current model integration is a spoof-likelihood signal, not forensic proof. It does not detect language, identify the generator, or explain spectral causes. The API scores the full recording in overlapping ~4-second windows and exposes its limitations with every result. See `backend/README.md` for model configuration and calibration guidance.
