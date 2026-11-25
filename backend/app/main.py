from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path
from tempfile import TemporaryDirectory

from fastapi import FastAPI, File, Form, HTTPException, Query, Request, UploadFile
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
from .database import init_db
from .inference import AasistService, ServiceConfig
from .repository import get_analysis_json, list_analyses, save_analysis, sha256_file, get_stats
from .schemas import AnalysisResponse, ErrorResponse, HealthResponse, HistoryItem, StatsResponse


settings = get_settings()
logger = logging.getLogger("voxauth")


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
    await run_in_threadpool(init_db)
    services: dict[str, AasistService] = {}
    enabled = {
        code.strip()
        for code in os.getenv("AASIST_LANGUAGES", "ur").split(",")
        if code.strip()
    }
    for language_code in settings.language_profiles:
        if language_code not in enabled:
            continue
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
            result = await run_in_threadpool(
                _normalize_and_analyze,
                service,
                source,
                normalized,
                filename,
                audio.content_type,
            )
            try:
                audio_sha256 = await run_in_threadpool(sha256_file, source)
                await run_in_threadpool(save_analysis, result, audio_sha256)
            except Exception:
                # A database problem should never break the detection result.
                logger.exception("Could not save analysis %s", result.analysis_id)
            return result
    except AudioProcessingError as exc:
        status_code = 413 if "larger than" in str(exc) else 400
        raise HTTPException(status_code=status_code, detail=str(exc)) from exc
    finally:
        await audio.close()


@app.get("/v1/history", response_model=list[HistoryItem])
async def history(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    language: str | None = None,
) -> list[HistoryItem]:
    return await run_in_threadpool(list_analyses, limit, offset, language)


@app.get(
    "/v1/history/{analysis_id}",
    response_model=AnalysisResponse,
    responses={404: {"model": ErrorResponse}},
)
async def history_item(analysis_id: str):
    stored = await run_in_threadpool(get_analysis_json, analysis_id)
    if stored is None:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    return stored

@app.get("/v1/stats", response_model=StatsResponse)
async def stats(
    days: int = Query(30, ge=1, le=365),
    tz_offset_minutes: int = Query(0, ge=-840, le=840),
) -> StatsResponse:
    return await run_in_threadpool(get_stats, days, tz_offset_minutes)