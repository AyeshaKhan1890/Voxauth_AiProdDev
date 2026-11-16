from __future__ import annotations

import math
import subprocess
import wave
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from fastapi import UploadFile


TARGET_SAMPLE_RATE = 16_000
ALLOWED_EXTENSIONS = {".wav", ".mp3", ".m4a", ".flac", ".ogg", ".webm", ".aac"}


class AudioProcessingError(ValueError):
    """Raised when an upload cannot be safely normalized or inspected."""


@dataclass(frozen=True)
class DecodedAudio:
    samples: np.ndarray
    duration_seconds: float
    original_sample_rate_hz: int
    original_channels: int
    rms_dbfs: float
    clipping_ratio: float
    silence_ratio: float
    quality_rating: str
    warnings: list[str]


def validate_upload_name(filename: str) -> str:
    safe_name = Path(filename or "audio-upload").name
    extension = Path(safe_name).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        supported = ", ".join(sorted(ALLOWED_EXTENSIONS))
        raise AudioProcessingError(f"Unsupported audio format. Supported extensions: {supported}")
    return safe_name


async def save_upload(upload: UploadFile, destination: Path, max_bytes: int) -> int:
    size = 0
    with destination.open("wb") as output:
        while chunk := await upload.read(1024 * 1024):
            size += len(chunk)
            if size > max_bytes:
                raise AudioProcessingError(
                    f"Audio file is larger than the {max_bytes // (1024 * 1024)} MB limit"
                )
            output.write(chunk)

    if size == 0:
        raise AudioProcessingError("The uploaded audio file is empty")
    return size


def _probe_audio(source: Path) -> tuple[int, int]:
    try:
        import imageio_ffmpeg
    except ImportError as exc:
        raise RuntimeError("imageio-ffmpeg is required to decode uploaded audio") from exc

    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    command = [ffmpeg, "-hide_banner", "-i", str(source)]
    completed = subprocess.run(command, capture_output=True, text=True, timeout=30, check=False)
    details = completed.stderr

    sample_rate = 0
    channels = 0
    for line in details.splitlines():
        if "Audio:" not in line:
            continue
        parts = [part.strip() for part in line.split(",")]
        for part in parts:
            if part.endswith(" Hz"):
                try:
                    sample_rate = int(part.removesuffix(" Hz"))
                except ValueError:
                    pass
            lowered = part.lower()
            if lowered == "mono":
                channels = 1
            elif lowered == "stereo":
                channels = 2
            elif "channels" in lowered:
                try:
                    channels = int(lowered.split()[0])
                except (ValueError, IndexError):
                    pass
        break

    if sample_rate <= 0:
        sample_rate = TARGET_SAMPLE_RATE
    if channels <= 0:
        channels = 1
    return sample_rate, channels


def normalize_audio(
    source: Path,
    destination: Path,
    max_duration_seconds: float,
) -> tuple[int, int]:
    try:
        import imageio_ffmpeg
    except ImportError as exc:
        raise RuntimeError("imageio-ffmpeg is required to decode uploaded audio") from exc

    original_sample_rate, original_channels = _probe_audio(source)
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    command = [
        ffmpeg,
        "-nostdin",
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-i",
        str(source),
        "-vn",
        "-ac",
        "1",
        "-ar",
        str(TARGET_SAMPLE_RATE),
        "-t",
        str(max_duration_seconds + 1),
        "-c:a",
        "pcm_s16le",
        str(destination),
    ]
    completed = subprocess.run(command, capture_output=True, text=True, timeout=120, check=False)
    if completed.returncode != 0 or not destination.exists():
        message = completed.stderr.strip().splitlines()
        reason = message[-1] if message else "FFmpeg could not decode this file"
        raise AudioProcessingError(f"Audio normalization failed: {reason}")
    return original_sample_rate, original_channels


def _quality_metrics(samples: np.ndarray, sample_rate: int) -> tuple[float, float, float]:
    absolute = np.abs(samples)
    rms = float(np.sqrt(np.mean(np.square(samples), dtype=np.float64)))
    rms_dbfs = 20 * math.log10(max(rms, 1e-8))
    clipping_ratio = float(np.mean(absolute >= 0.999))

    frame_length = max(1, int(sample_rate * 0.025))
    usable = len(samples) - (len(samples) % frame_length)
    if usable == 0:
        silence_ratio = float(rms_dbfs < -45)
    else:
        frames = samples[:usable].reshape(-1, frame_length)
        frame_rms = np.sqrt(np.mean(np.square(frames), axis=1, dtype=np.float64))
        frame_dbfs = 20 * np.log10(np.maximum(frame_rms, 1e-8))
        silence_ratio = float(np.mean(frame_dbfs < -45))
    return rms_dbfs, clipping_ratio, silence_ratio


def read_normalized_audio(
    normalized_path: Path,
    original_sample_rate: int,
    original_channels: int,
    max_duration_seconds: float,
) -> DecodedAudio:
    try:
        with wave.open(str(normalized_path), "rb") as wav_file:
            channels = wav_file.getnchannels()
            sample_width = wav_file.getsampwidth()
            sample_rate = wav_file.getframerate()
            frames = wav_file.getnframes()
            raw = wav_file.readframes(frames)
    except (wave.Error, EOFError) as exc:
        raise AudioProcessingError("The normalized audio stream is invalid") from exc

    if channels != 1 or sample_width != 2 or sample_rate != TARGET_SAMPLE_RATE:
        raise AudioProcessingError("Audio normalization produced an unexpected PCM format")
    if frames <= 0:
        raise AudioProcessingError("No audio samples were found")

    duration = frames / sample_rate
    if duration > max_duration_seconds:
        raise AudioProcessingError(
            f"Audio is {duration:.1f}s; the current limit is {max_duration_seconds:.0f}s"
        )

    samples = np.frombuffer(raw, dtype="<i2").astype(np.float32) / 32768.0
    rms_dbfs, clipping_ratio, silence_ratio = _quality_metrics(samples, sample_rate)

    warnings: list[str] = []
    if duration < 1.0:
        warnings.append("The recording is very short; use at least a few seconds when possible.")
    if rms_dbfs < -40:
        warnings.append("The recording level is very quiet.")
    if clipping_ratio > 0.01:
        warnings.append("Clipping may reduce detection reliability.")
    if silence_ratio > 0.7:
        warnings.append("Most of the recording is near silence.")

    return DecodedAudio(
        samples=samples,
        duration_seconds=duration,
        original_sample_rate_hz=original_sample_rate,
        original_channels=original_channels,
        rms_dbfs=rms_dbfs,
        clipping_ratio=clipping_ratio,
        silence_ratio=silence_ratio,
        quality_rating="limited" if warnings else "good",
        warnings=warnings,
    )
