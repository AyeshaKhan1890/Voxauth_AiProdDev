from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


BACKEND_ROOT = Path(__file__).resolve().parents[1]


def _env_float(name: str, default: float) -> float:
    raw = os.getenv(name)
    return default if raw is None else float(raw)


def _env_int(name: str, default: int) -> int:
    raw = os.getenv(name)
    return default if raw is None else int(raw)


def _env_path(name: str, default: Path) -> Path:
    raw = os.getenv(name)
    return default if not raw else Path(raw).expanduser().resolve()


@dataclass(frozen=True)
class LanguageProfile:
    code: str
    display_name: str
    model_path: Path
    model_config_path: Path
    description: str


@dataclass(frozen=True)
class Settings:
    language_profiles: dict[str, LanguageProfile]
    device: str
    threshold: float
    uncertainty_margin: float
    max_upload_bytes: int
    max_duration_seconds: float
    batch_size: int
    window_hop_samples: int
    cors_origins: tuple[str, ...]
    database_url: str


def get_settings() -> Settings:
    threshold = _env_float("AASIST_THRESHOLD", 0.5)
    uncertainty_margin = _env_float("AASIST_UNCERTAINTY_MARGIN", 0.1)
    max_upload_bytes = _env_int("AASIST_MAX_UPLOAD_BYTES", 50 * 1024 * 1024)
    max_duration_seconds = _env_float("AASIST_MAX_DURATION_SECONDS", 300.0)
    batch_size = _env_int("AASIST_BATCH_SIZE", 8)
    window_hop_samples = _env_int("AASIST_WINDOW_HOP_SAMPLES", 32_300)

    if not 0.0 < threshold < 1.0:
        raise ValueError("AASIST_THRESHOLD must be between 0 and 1")
    if not 0.0 <= uncertainty_margin < 0.5:
        raise ValueError("AASIST_UNCERTAINTY_MARGIN must be between 0 and 0.5")
    if threshold - uncertainty_margin < 0 or threshold + uncertainty_margin > 1:
        raise ValueError("AASIST threshold and uncertainty margin exceed probability bounds")
    if max_upload_bytes <= 0 or max_duration_seconds <= 0:
        raise ValueError("AASIST upload and duration limits must be positive")
    if batch_size <= 0 or window_hop_samples <= 0:
        raise ValueError("AASIST batch size and window hop must be positive")

    origins = tuple(
        origin.strip()
        for origin in os.getenv(
            "AASIST_CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
        ).split(",")
        if origin.strip()
    )

    shared_config_path = _env_path(
        "AASIST_MODEL_CONFIG", BACKEND_ROOT / "artifacts" / "AASIST-L.conf"
    )

    language_profiles = {
        "ur": LanguageProfile(
            code="ur",
            display_name="Urdu",
            model_path=_env_path(
                "AASIST_MODEL_PATH_UR",
                BACKEND_ROOT / "artifacts" / "AASIST-Urdu-TTS-VC.pth",
            ),
            model_config_path=_env_path("AASIST_MODEL_CONFIG_UR", shared_config_path),
            description="Fine-tuned on TTS + voice conversion (CSALT dataset)",
        ),
        "ar": LanguageProfile(
            code="ar",
            display_name="Arabic",
            model_path=_env_path(
                "AASIST_MODEL_PATH_AR",
                BACKEND_ROOT / "artifacts" / "AASIST-Arabic-AFAD-MSA.pth",
            ),
            model_config_path=_env_path("AASIST_MODEL_CONFIG_AR", shared_config_path),
            description="Fine-tuned on AFAD-MSA (Modern Standard Arabic, proprietary TTS)",
        ),
    }

    return Settings(
        language_profiles=language_profiles,
        device=os.getenv("AASIST_DEVICE", "auto").strip().lower(),
        threshold=threshold,
        uncertainty_margin=uncertainty_margin,
        max_upload_bytes=max_upload_bytes,
        max_duration_seconds=max_duration_seconds,
        batch_size=batch_size,
        window_hop_samples=window_hop_samples,
        cors_origins=origins,
        database_url=os.getenv(
            "DATABASE_URL",
            f"sqlite:///{(BACKEND_ROOT / 'data' / 'voxauth.db').as_posix()}",
        ),
    )