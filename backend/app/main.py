from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path
from tempfile import TemporaryDirectory

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from starlette.concurrency import run_in_threadpool

from .audio import (
    AudioProcessingError,
    normalize_audio,
    read_normalized_audio,
    save_upload,
    validate_upload_name,
)
from .config import get_settings
from .inference import AasistService, ServiceConfig
from .schemas import AnalysisResponse, ErrorResponse, HealthResponse


settings = get_settings()


def _build_service(language_code: str) -> AasistService:
    profile = settings.language_profiles[language_code]
    config = ServiceConfig(
        language_code=profile.code,
        model_name=f"AASIST-L {profile.display_name}",
        model_version=f"fine-tuned-{profile.code}",
        model_path=profile.model_path,
        model_config_path=profile.model_config_path,
        device=settings.device,
        threshold=settings.threshold,
        uncertainty_margin=settings.uncertainty_margin,
        batch_size=settings.batch_size,
        window_hop_samples=settings.window_hop_samples,
    )
    return AasistService(config)


@asynccontextmanager
async def lifespan(app: FastAPI):
    services: dict[str, AasistService] = {}
    for language_code in settings.language_profiles:
        service = _build_service(language_code)
        await run_in_threadpool(service.load)
        services[language_code] = service
    app.state.aasist_services = services
    yield


app = FastAPI(
    title="Awaazera AASIST API",
    version="0.1.0",
    description="Windowed, fine-tuned AASIST-L inference for uploaded speech recordings across supported languages.",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
async def health(request: Request) -> HealthResponse:
    services: dict[str, AasistService] = request.app.state.aasist_services
    all_loaded = all(service.loaded for service in services.values())
    # report the first loaded model's name for backwards compatibility with existing UI
    example_service = next(iter(services.values()), None)
    return HealthResponse(
        status="ok" if all_loaded else "starting",
        model_loaded=all_loaded,
        model_name=example_service.config.model_name if example_service else None,
        device=str(example_service.device) if example_service and example_service.device else None,
    )


def _normalize_and_analyze(
    service: AasistService,
    source: Path,
    normalized: Path,
    filename: str,
    content_type: str | None,
) -> AnalysisResponse:
    sample_rate, channels = normalize_audio(
        source,
        normalized,
        max_duration_seconds=settings.max_duration_seconds,
    )
    decoded = read_normalized_audio(
        normalized,
        original_sample_rate=sample_rate,
        original_channels=channels,
        max_duration_seconds=settings.max_duration_seconds,
    )
    return service.analyze(decoded, filename=filename, content_type=content_type)


@app.post(
    "/v1/analyze",
    response_model=AnalysisResponse,
    responses={400: {"model": ErrorResponse}, 413: {"model": ErrorResponse}},
)
async def analyze_audio(
    request: Request,
    audio: UploadFile = File(...),
    language: str = Form("ur"),
) -> AnalysisResponse:
    language_code = language.lower()
    services: dict[str, AasistService] = request.app.state.aasist_services

    if language_code not in services:
        supported = ", ".join(sorted(services.keys()))
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported analysis profile '{language}'. Supported profiles: {supported}.",
        )

    try:
        filename = validate_upload_name(audio.filename or "audio-upload")
        suffix = Path(filename).suffix.lower()
        with TemporaryDirectory(prefix="awaazera-aasist-") as temporary_dir:
            source = Path(temporary_dir) / f"upload{suffix}"
            normalized = Path(temporary_dir) / "normalized.wav"
            await save_upload(audio, source, settings.max_upload_bytes)
            service = services[language_code]
            return await run_in_threadpool(
                _normalize_and_analyze,
                service,
                source,
                normalized,
                filename,
                audio.content_type,
            )
    except AudioProcessingError as exc:
        status_code = 413 if "larger than" in str(exc) else 400
        raise HTTPException(status_code=status_code, detail=str(exc)) from exc
    finally:
        await audio.close()