import hashlib
from collections import Counter
from datetime import datetime, timedelta, timezone
from pathlib import Path

from sqlalchemy import select

from .database import SessionLocal
from .models import Analysis
from .schemas import (
    AnalysisResponse,
    DailyCount,
    HistoryItem,
    StatsResponse,
    WarningCount,
)
def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def save_analysis(result: AnalysisResponse, audio_sha256: str) -> None:
    row = Analysis(
        analysis_id=result.analysis_id,
        filename=result.audio.filename,
        audio_sha256=audio_sha256,
        language=result.analysis_language,
        verdict=result.verdict,
        synthetic_probability=result.synthetic_probability,
        authentic_probability=result.authentic_probability,
        duration_seconds=result.audio.duration_seconds,
        processing_ms=result.processing_ms,
        model_name=result.model.name,
        model_version=result.model.version,
        quality_rating=result.quality.rating,
        window_count=len(result.windows),
        flagged_window_count=sum(1 for w in result.windows if w.flagged),
        result_json=result.model_dump(mode="json"),
    )
    with SessionLocal() as session:
        session.add(row)
        session.commit()


def list_analyses(limit: int, offset: int, language: str | None) -> list[HistoryItem]:
    query = select(Analysis).order_by(Analysis.created_at.desc())
    if language:
        query = query.where(Analysis.language == language.lower())
    query = query.limit(limit).offset(offset)
    with SessionLocal() as session:
        rows = session.scalars(query).all()
        return [HistoryItem.model_validate(row) for row in rows]


def get_analysis_json(analysis_id: str) -> dict | None:
    with SessionLocal() as session:
        row = session.get(Analysis, analysis_id)
        return row.result_json if row else None

def get_stats(days: int, tz_offset_minutes: int) -> StatsResponse:
    offset = timedelta(minutes=tz_offset_minutes)
    today = (datetime.now(timezone.utc) + offset).date()
    first_day = today - timedelta(days=days - 1)
    # Pre-filter in SQL with one day of slack; the exact local-day filter happens below.
    cutoff = datetime.now(timezone.utc) - timedelta(days=days + 1)

    with SessionLocal() as session:
        rows = session.execute(
            select(
                Analysis.created_at,
                Analysis.verdict,
                Analysis.language,
                Analysis.quality_rating,
                Analysis.processing_ms,
                Analysis.synthetic_probability,
                Analysis.duration_seconds,
                Analysis.result_json,
            ).where(Analysis.created_at >= cutoff)
        ).all()

    daily = {first_day + timedelta(days=i): Counter() for i in range(days)}
    verdicts: Counter = Counter()
    languages: Counter = Counter()
    quality: Counter = Counter()
    warnings: Counter = Counter()
    total = 0
    processing_sum = 0
    duration_sum = 0.0
    probability_sum = 0.0

    for created_at, verdict, language, rating, ms, prob, duration, result in rows:
        if created_at.tzinfo is None:  # SQLite returns naive datetimes that are really UTC
            created_at = created_at.replace(tzinfo=timezone.utc)
        local_day = (created_at + offset).date()
        if local_day not in daily:
            continue
        total += 1
        processing_sum += ms
        duration_sum += duration
        probability_sum += prob
        verdicts[verdict] += 1
        languages[language] += 1
        quality[rating] += 1
        daily[local_day]["total"] += 1
        daily[local_day][verdict] += 1
        for message in ((result or {}).get("quality") or {}).get("warnings", []):
            warnings[message] += 1

    return StatsResponse(
        days=days,
        total=total,
        verdicts=dict(verdicts),
        languages=dict(languages),
        quality=dict(quality),
        avg_processing_ms=round(processing_sum / total) if total else None,
        avg_duration_seconds=round(duration_sum / total, 2) if total else None,
        avg_synthetic_probability=round(probability_sum / total, 4) if total else None,
        daily=[
            DailyCount(
                date=day.isoformat(),
                total=counts["total"],
                synthetic=counts["synthetic"],
                authentic=counts["authentic"],
                uncertain=counts["uncertain"],
            )
            for day, counts in sorted(daily.items())
        ],
        warnings=[WarningCount(message=m, count=c) for m, c in warnings.most_common(5)],
    )