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

export interface HistoryItem {
  analysis_id: string;
  created_at: string;
  filename: string;
  language: string;
  verdict: AnalysisVerdict;
  synthetic_probability: number;
  authentic_probability: number;
  duration_seconds: number;
  processing_ms: number;
  window_count: number;
  flagged_window_count: number;
  quality_rating: string;
}

export async function fetchHistory(signal?: AbortSignal): Promise<HistoryItem[]> {
  const response = await fetch("/api/history?limit=100", { cache: "no-store", signal });
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as ApiErrorBody;
    throw new AnalysisApiError(payload.detail || "Could not load analysis history.", response.status);
  }
  return (await response.json()) as HistoryItem[];
}

export interface DailyCount {
  date: string;
  total: number;
  synthetic: number;
  authentic: number;
  uncertain: number;
}

export interface StatsResponse {
  days: number;
  total: number;
  verdicts: Partial<Record<AnalysisVerdict, number>>;
  languages: Record<string, number>;
  quality: Record<string, number>;
  avg_processing_ms: number | null;
  avg_duration_seconds: number | null;
  avg_synthetic_probability: number | null;
  daily: DailyCount[];
  warnings: { message: string; count: number }[];
}

export async function fetchStats(days: number, signal?: AbortSignal): Promise<StatsResponse> {
  const offset = -new Date().getTimezoneOffset(); // minutes ahead of UTC
  const response = await fetch(`/api/stats?days=${days}&tz_offset_minutes=${offset}`, {
    cache: "no-store",
    signal,
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as ApiErrorBody;
    throw new AnalysisApiError(payload.detail || "Could not load analytics.", response.status);
  }
  return (await response.json()) as StatsResponse;
}