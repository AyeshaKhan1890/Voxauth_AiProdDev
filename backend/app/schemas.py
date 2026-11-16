from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


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

