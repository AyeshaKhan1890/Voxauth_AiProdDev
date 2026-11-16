export type AnalysisVerdict = "synthetic" | "authentic" | "uncertain";

export interface AudioMetadata {
  filename: string;
  content_type: string | null;
  duration_seconds: number;
  sample_rate_hz: number;
  channels: number;
  normalized_sample_rate_hz: number;
}

export interface InputQuality {
  rating: "good" | "limited";
  rms_dbfs: number;
  clipping_ratio: number;
  silence_ratio: number;
  warnings: string[];
}

export interface WindowScore {
  index: number;
  start_seconds: number;
  end_seconds: number;
  synthetic_probability: number;
  authentic_probability: number;
  flagged: boolean;
}

export interface ModelMetadata {
  name: string;
  version: string;
  device: string;
  checkpoint_sha256: string;
  window_seconds: number;
  hop_seconds: number;
  threshold: number;
  uncertainty_margin: number;
}
export type AnalysisLanguage = "ur" | "ar";

export interface AnalysisResponse {
  analysis_id: string;
  verdict: AnalysisVerdict;
  synthetic_probability: number;
  authentic_probability: number;
  processing_ms: number;
  analysis_language: AnalysisLanguage;   // was: "ur"
  audio: AudioMetadata;
  quality: InputQuality;
  windows: WindowScore[];
  model: ModelMetadata;
  limitations: string[];
}

interface ApiErrorBody {
  detail?: string;
}

export class AnalysisApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "AnalysisApiError";
  }
}

export async function analyzeAudio(
  file: File,
  language: AnalysisLanguage,
  signal?: AbortSignal,
): Promise<AnalysisResponse> {
  const body = new FormData();
  body.append("audio", file, file.name);
  body.append("language", language);

  let response: Response;
  try {
    response = await fetch("/api/analyze", {
      method: "POST",
      body,
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new AnalysisApiError(
      "The AASIST service could not be reached. Confirm that the Python API is running.",
    );
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as ApiErrorBody;
    throw new AnalysisApiError(payload.detail || "The audio analysis failed.", response.status);
  }

  return (await response.json()) as AnalysisResponse;
}

