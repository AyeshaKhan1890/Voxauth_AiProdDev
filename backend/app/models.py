from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class Analysis(Base):
    __tablename__ = "analyses"

    analysis_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )
    filename: Mapped[str] = mapped_column(String(255))
    audio_sha256: Mapped[str] = mapped_column(String(64), index=True)
    language: Mapped[str] = mapped_column(String(8), index=True)
    verdict: Mapped[str] = mapped_column(String(16), index=True)
    synthetic_probability: Mapped[float] = mapped_column(Float)
    authentic_probability: Mapped[float] = mapped_column(Float)
    duration_seconds: Mapped[float] = mapped_column(Float)
    processing_ms: Mapped[int] = mapped_column(Integer)
    model_name: Mapped[str] = mapped_column(String(128))
    model_version: Mapped[str] = mapped_column(String(64))
    quality_rating: Mapped[str] = mapped_column(String(16))
    window_count: Mapped[int] = mapped_column(Integer)
    flagged_window_count: Mapped[int] = mapped_column(Integer)
    # The complete API response, so a past result can be re-displayed exactly.
    result_json: Mapped[dict] = mapped_column(JSON)