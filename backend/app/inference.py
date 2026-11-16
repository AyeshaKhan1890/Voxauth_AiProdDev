from __future__ import annotations

import hashlib
import json
import threading
import time
import uuid
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import torch

from .audio import DecodedAudio, TARGET_SAMPLE_RATE
from .schemas import (
    AnalysisResponse,
    AudioMetadata,
    InputQuality,
    ModelMetadata,
    WindowScore,
)
from .vendor.aasist import Model


def build_window_starts(sample_count: int, window_size: int, hop_size: int) -> list[int]:
    if sample_count <= 0:
        raise ValueError("sample_count must be positive")
    if window_size <= 0 or hop_size <= 0:
        raise ValueError("window_size and hop_size must be positive")
    if sample_count <= window_size:
        return [0]

    starts = list(range(0, sample_count - window_size + 1, hop_size))
    final_start = sample_count - window_size
    if starts[-1] != final_start:
        starts.append(final_start)
    return starts


def fit_window(samples: np.ndarray, start: int, window_size: int) -> np.ndarray:
    segment = samples[start : start + window_size]
    if len(segment) == window_size:
        return segment
    if len(segment) == 0:
        raise ValueError("Cannot build a model window from empty audio")
    repeats = int(np.ceil(window_size / len(segment)))
    return np.tile(segment, repeats)[:window_size]


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as model_file:
        for chunk in iter(lambda: model_file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


@dataclass(frozen=True)
class ServiceConfig:
    """Everything one AasistService instance needs, independent of language."""
    language_code: str
    model_name: str
    model_version: str
    model_path: Path
    model_config_path: Path
    device: str
    threshold: float
    uncertainty_margin: float
    batch_size: int
    window_hop_samples: int


class AasistService:
    def __init__(self, config: ServiceConfig):
        self.config = config
        self.model: Model | None = None
        self.device: torch.device | None = None
        self.window_size = 64_600
        self.checkpoint_sha256 = ""
        self._lock = threading.Lock()

    @property
    def loaded(self) -> bool:
        return self.model is not None and self.device is not None

    def load(self) -> None:
        if not self.config.model_path.is_file():
            raise FileNotFoundError(f"AASIST checkpoint not found: {self.config.model_path}")
        if not self.config.model_config_path.is_file():
            raise FileNotFoundError(
                f"AASIST model config not found: {self.config.model_config_path}"
            )

        with self.config.model_config_path.open("r", encoding="utf-8") as config_file:
            model_json = json.load(config_file)
        model_config = model_json["model_config"]
        self.window_size = int(model_config["nb_samp"])

        requested = self.config.device
        if requested == "auto":
            requested = "cuda" if torch.cuda.is_available() else "cpu"
        if requested.startswith("cuda") and not torch.cuda.is_available():
            raise RuntimeError("AASIST_DEVICE requests CUDA, but CUDA is not available")

        device = torch.device(requested)
        model = Model(model_config).to(device)
        try:
            state_dict = torch.load(
                self.config.model_path, map_location=device, weights_only=True
            )
        except TypeError:
            state_dict = torch.load(self.config.model_path, map_location=device)
        model.load_state_dict(state_dict)
        model.eval()

        self.model = model
        self.device = device
        self.checkpoint_sha256 = _sha256(self.config.model_path)

    def analyze(
        self,
        decoded: DecodedAudio,
        filename: str,
        content_type: str | None,
    ) -> AnalysisResponse:
        if not self.loaded or self.model is None or self.device is None:
            raise RuntimeError("AASIST model is not loaded")

        started = time.perf_counter()
        starts = build_window_starts(
            len(decoded.samples), self.window_size, self.config.window_hop_samples
        )
        synthetic_scores: list[float] = []

        with self._lock, torch.inference_mode():
            for offset in range(0, len(starts), self.config.batch_size):
                batch_starts = starts[offset : offset + self.config.batch_size]
                batch = np.stack(
                    [fit_window(decoded.samples, start, self.window_size) for start in batch_starts]
                )
                tensor = torch.from_numpy(batch).to(self.device)
                _, logits = self.model(tensor)
                probabilities = torch.softmax(logits, dim=1)
                synthetic_scores.extend(probabilities[:, 0].detach().cpu().tolist())

        overall_synthetic = float(np.mean(synthetic_scores))
        upper = self.config.threshold + self.config.uncertainty_margin
        lower = self.config.threshold - self.config.uncertainty_margin
        if overall_synthetic >= upper:
            verdict = "synthetic"
        elif overall_synthetic <= lower:
            verdict = "authentic"
        else:
            verdict = "uncertain"

        windows: list[WindowScore] = []
        for index, (start, synthetic_probability) in enumerate(zip(starts, synthetic_scores)):
            start_seconds = start / TARGET_SAMPLE_RATE
            end_seconds = min(
                decoded.duration_seconds,
                (start + self.window_size) / TARGET_SAMPLE_RATE,
            )
            windows.append(
                WindowScore(
                    index=index,
                    start_seconds=round(start_seconds, 3),
                    end_seconds=round(end_seconds, 3),
                    synthetic_probability=round(synthetic_probability, 6),
                    authentic_probability=round(1 - synthetic_probability, 6),
                    flagged=synthetic_probability >= self.config.threshold,
                )
            )

        processing_ms = round((time.perf_counter() - started) * 1000)
        return AnalysisResponse(
            analysis_id=f"AV-{uuid.uuid4().hex[:8].upper()}",
            verdict=verdict,
            synthetic_probability=round(overall_synthetic, 6),
            authentic_probability=round(1 - overall_synthetic, 6),
            processing_ms=processing_ms,
            analysis_language=self.config.language_code,
            audio=AudioMetadata(
                filename=filename,
                content_type=content_type,
                duration_seconds=round(decoded.duration_seconds, 3),
                sample_rate_hz=decoded.original_sample_rate_hz,
                channels=decoded.original_channels,
                normalized_sample_rate_hz=TARGET_SAMPLE_RATE,
            ),
            quality=InputQuality(
                rating=decoded.quality_rating,
                rms_dbfs=round(decoded.rms_dbfs, 2),
                clipping_ratio=round(decoded.clipping_ratio, 6),
                silence_ratio=round(decoded.silence_ratio, 6),
                warnings=decoded.warnings,
            ),
            windows=windows,
            model=ModelMetadata(
                name=self.config.model_name,
                version=self.config.model_version,
                device=str(self.device),
                checkpoint_sha256=self.checkpoint_sha256,
                window_seconds=round(self.window_size / TARGET_SAMPLE_RATE, 4),
                hop_seconds=round(self.config.window_hop_samples / TARGET_SAMPLE_RATE, 4),
                threshold=self.config.threshold,
                uncertainty_margin=self.config.uncertainty_margin,
            ),
            limitations=[
                "AASIST-L estimates spoof likelihood; it does not identify a generator or intent.",
                "Model probabilities are not calibrated forensic certainty.",
                "Long recordings are summarized from overlapping model windows.",
            ],
        )