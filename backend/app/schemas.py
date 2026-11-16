from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

class AudioMetadata(BaseModel):
    filename: str
    content_type: str | None
    duration_seconds: float = Field(ge=0)
    sample_rate_hz: int = Field(gt=0)
    channels: int = Field(gt=0)
    normalized_sample_rate_hz: int = Field(gt=0)


class InputQuality(BaseModel):
    rating: Literal["good", "limited"]
    rms_dbfs: float
    clipping_ratio: float = Field(ge=0, le=1)
    silence_ratio: float = Field(ge=0, le=1)
    warnings: list[str]


class WindowScore(BaseModel):
    index: int = Field(ge=0)
    start_seconds: float = Field(ge=0)
    end_seconds: float = Field(ge=0)
    synthetic_probability: float = Field(ge=0, le=1)
    authentic_probability: float = Field(ge=0, le=1)
    flagged: bool


class ModelMetadata(BaseModel):
    name: str
    version: str
    device: str
    checkpoint_sha256: str
    window_seconds: float = Field(gt=0)
    hop_seconds: float = Field(gt=0)
    threshold: float = Field(gt=0, lt=1)
    uncertainty_margin: float = Field(ge=0, lt=0.5)


class AnalysisResponse(BaseModel):
    analysis_id: str
    verdict: Literal["synthetic", "authentic", "uncertain"]
    synthetic_probability: float = Field(ge=0, le=1)
    authentic_probability: float = Field(ge=0, le=1)
    processing_ms: int = Field(ge=0)
    analysis_language: Literal["ur","ar"]
    audio: AudioMetadata
    quality: InputQuality
    windows: list[WindowScore]
    model: ModelMetadata
    limitations: list[str]


class HealthResponse(BaseModel):
    status: Literal["ok", "starting", "error"]
    model_loaded: bool
    model_name: str
    device: str | None = None


class ErrorResponse(BaseModel):
    detail: str

class HistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    analysis_id: str
    quality_rating: str
    created_at: datetime
    filename: str
    language: str
    verdict: Literal["synthetic", "authentic", "uncertain"]
    synthetic_probability: float
    authentic_probability: float
    duration_seconds: float
    processing_ms: int
    window_count: int
    flagged_window_count: int

class DailyCount(BaseModel):
    date: str
    total: int
    synthetic: int
    authentic: int
    uncertain: int


class WarningCount(BaseModel):
    message: str
    count: int


class StatsResponse(BaseModel):
    days: int
    total: int
    verdicts: dict[str, int]
    languages: dict[str, int]
    quality: dict[str, int]
    avg_processing_ms: int | None
    avg_duration_seconds: float | None
    avg_synthetic_probability: float | None
    daily: list[DailyCount]
    warnings: list[WarningCount]