"use client";

import {
  ChangeEvent,
  DragEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  AudioLines,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Clock3,
  CloudUpload,
  Download,
  FileAudio,
  FileText,
  FolderKanban,
  Gauge,
  Globe2,
  History,
  Languages,
  LayoutDashboard,
  LifeBuoy,
  LockKeyhole,
  Menu,
  Mic2,
  MoreHorizontal,
  Play,
  Plus,
  ScanSearch,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Square,
  Upload,
  UserRound,
  Users,
  Volume2,
  WandSparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import { VoxauthLogo } from "./voxauth-logo";
import { ImmersiveSignalScene } from "./immersive-scene";
import { SignalField } from "./signal-field";
import { ThemeSwitcher, useVoxauthTheme, type VoxauthTheme } from "./theme-controller";
import {
  AnalysisApiError,
  analyzeAudio,
  type AnalysisResponse,
  type WindowScore,
} from "@/lib/analysis-api";

type View = "dashboard" | "analyze" | "history" | "cases" | "analytics" | "coverage" | "settings";
type AnalysisPhase = "input" | "processing" | "result";
type ApiStatus = "checking" | "ready" | "unavailable";

const navItems: { id: View; label: string; icon: LucideIcon }[] = [
  { id: "dashboard", label: "Overview", icon: LayoutDashboard },
  { id: "analyze", label: "New analysis", icon: WandSparkles },
  { id: "history", label: "Analysis history", icon: History },
  { id: "cases", label: "Cases", icon: FolderKanban },
  { id: "analytics", label: "Analytics", icon: Activity },
  { id: "coverage", label: "Model coverage", icon: Globe2 },
];

const waveform = [
  22, 36, 18, 48, 72, 42, 82, 58, 92, 38, 62, 86, 54, 74, 32, 68, 94, 46,
  76, 56, 88, 64, 42, 72, 30, 58, 84, 48, 78, 36, 64, 90, 52, 70, 40, 80,
  46, 92, 58, 74, 34, 68, 28, 62, 44, 82, 38, 70, 52, 88, 42, 64, 28, 54,
  78, 44, 68, 34, 60, 84, 48, 72, 38, 64,
];
const languageProfiles = {
  ur: {
    label: "Urdu",
    modelName: "AASIST-L Urdu",
    modelDescription: "Fine-tuned on TTS + voice conversion",
  },
  ar: {
    label: "Arabic",
    modelName: "AASIST-L Arabic",
    modelDescription: "Fine-tuned on AFAD-MSA (proprietary TTS)",
  },
} as const;
const recentAnalyses = [
  { id: "AV-2841", name: "customer_call_14.wav", verdict: "Likely synthetic", tone: "synthetic", language: "Urdu", quality: "Good", time: "4 min ago", score: "87%" },
  { id: "AV-2840", name: "field_interview.mp3", verdict: "Likely authentic", tone: "authentic", language: "Urdu", quality: "Excellent", time: "18 min ago", score: "06%" },
  { id: "AV-2839", name: "whatsapp_voice_02.ogg", verdict: "Uncertain", tone: "uncertain", language: "Urdu", quality: "Limited", time: "1 hr ago", score: "48%" },
  { id: "AV-2838", name: "newsroom_tip.m4a", verdict: "Likely authentic", tone: "authentic", language: "Urdu", quality: "Good", time: "3 hrs ago", score: "11%" },
];

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function StudioWaveform({
  scanning = false,
  result = false,
  evidence = [],
  duration = 0,
}: {
  scanning?: boolean;
  result?: boolean;
  evidence?: WindowScore[];
  duration?: number;
}) {
  return (
    <div className={`studio-waveform ${scanning ? "studio-wave-scanning" : ""} ${result ? "studio-wave-result" : ""}`} aria-hidden="true">
      {waveform.map((height, index) => (
        <i key={index} style={{ height: `${height}%`, animationDelay: `${index * -28}ms` }} />
      ))}
      {scanning && <span className="scan-playhead" />}
      {result && duration > 0 && evidence.map((window) => {
        const left = Math.max(0, Math.min(100, (window.start_seconds / duration) * 100));
        const right = Math.max(left, Math.min(100, (window.end_seconds / duration) * 100));
        return <span className="evidence-zone" key={window.index} style={{ left: `${left}%`, width: `${Math.max(1.5, right - left)}%` }} />;
      })}
    </div>
  );
}

function VerdictBadge({ tone, children }: { tone: string; children: React.ReactNode }) {
  return <span className={`verdict-badge verdict-${tone}`}><i />{children}</span>;
}

function formatAnalysisTime(seconds: number, precise = false) {
  const factor = precise ? 10 : 1;
  const rounded = Math.round(seconds * factor) / factor;
  const mins = Math.floor(rounded / 60);
  const remaining = rounded - mins * 60;
  return `${mins.toString().padStart(2, "0")}:${remaining.toFixed(precise ? 1 : 0).padStart(precise ? 4 : 2, "0")}`;
}

function PageHeader({ eyebrow, title, copy, action }: { eyebrow: string; title: string; copy?: string; action?: React.ReactNode }) {
  return (
    <div className="studio-page-header">
      <div><span>{eyebrow}</span><h1>{title}</h1>{copy && <p>{copy}</p>}</div>
      {action}
    </div>
  );
}

function DashboardView({ onNavigate, theme }: { onNavigate: (view: View) => void; theme: VoxauthTheme }) {
  return (
    <div className="view-stack">
      <PageHeader eyebrow="MONDAY, AUGUST 10" title="Good morning" copy="Here’s what’s happening across your audio workspace." action={<button className="studio-primary" onClick={() => onNavigate("analyze")}><Plus size={17} /> New analysis</button>} />

      <section className="dashboard-hero">
        <SignalField />
        <div className="dashboard-3d-scene"><ImmersiveSignalScene theme={theme} /></div>
        <div className="dashboard-hero-copy">
          <span className="dashboard-kicker"><Sparkles size={14} /> VOICE AUTHENTICITY LAB</span>
          <h2>What do you want to verify?</h2>
          <p>Upload or record a voice sample and get an evidence-led assessment in moments.</p>
          <button className="studio-light-button" onClick={() => onNavigate("analyze")}><Upload size={17} /> Analyze audio <ArrowRight size={16} /></button>
        </div>
        <div className="dashboard-signal">
          <StudioWaveform scanning />
          <div><span>AASIST-L</span><strong>CONFIGURED</strong></div>
        </div>
      </section>

      <section className="metric-grid">
        <article><div><span>ANALYSES THIS MONTH</span><AudioLines /></div><strong>1,284</strong><small className="metric-up">↗ 18.2% from July</small></article>
        <article><div><span>NEEDS REVIEW</span><AlertTriangle /></div><strong>24</strong><small>9 high priority</small></article>
        <article><div><span>AVG. PROCESSING</span><Clock3 /></div><strong>8.4s</strong><small className="metric-up">↘ 1.2s faster</small></article>
        <article><div><span>MODEL AVAILABILITY</span><ShieldCheck /></div><strong>99.97%</strong><small className="metric-up">All systems healthy</small></article>
      </section>

      <section className="dashboard-columns">
        <article className="studio-panel recent-panel">
          <div className="panel-heading"><div><span>RECENT ACTIVITY</span><h3>Latest analyses</h3></div><button onClick={() => onNavigate("history")}>View all <ArrowRight size={15} /></button></div>
          <div className="recent-list">
            {recentAnalyses.map((item) => <button className="recent-row" key={item.id} onClick={() => onNavigate("history")}>
              <span className="file-type-icon"><FileAudio size={18} /></span>
              <span className="recent-name"><strong>{item.name}</strong><small>{item.id} · {item.language} · {item.time}</small></span>
              <VerdictBadge tone={item.tone}>{item.verdict}</VerdictBadge>
              <span className="recent-score"><strong>{item.score}</strong><small>synthetic</small></span>
              <ChevronRight size={16} />
            </button>)}
          </div>
        </article>

        <article className="studio-panel signal-overview">
          <div className="panel-heading"><div><span>30-DAY SIGNAL</span><h3>Verdict mix</h3></div><button aria-label="More options"><MoreHorizontal /></button></div>
          <div className="donut-wrap">
            <div className="donut-chart"><div><strong>1,284</strong><span>analyses</span></div></div>
            <div className="donut-legend"><span><i className="dot-authentic" />Likely authentic <strong>68%</strong></span><span><i className="dot-uncertain" />Uncertain <strong>12%</strong></span><span><i className="dot-synthetic" />Likely synthetic <strong>20%</strong></span></div>
          </div>
          <div className="quality-callout"><ShieldCheck size={18} /><span><strong>92% good input quality</strong><small>Up 4% after capture guidance</small></span></div>
        </article>
      </section>
    </div>
  );
}

function AnalysisResult({ result, audioUrl, onReset }: { result: AnalysisResponse; audioUrl: string; onReset: () => void }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const score = Math.round(result.synthetic_probability * 100);
  const flaggedWindows = result.windows.filter((window) => window.flagged);
  const strongestWindows = [...result.windows]
    .sort((first, second) => second.synthetic_probability - first.synthetic_probability)
    .slice(0, 5);
  const evidenceWindows = flaggedWindows.length
    ? [...flaggedWindows].sort((first, second) => second.synthetic_probability - first.synthetic_probability).slice(0, 5)
    : strongestWindows.slice(0, 3);
  const extension = result.audio.filename.split(".").pop()?.toUpperCase() || "Audio";
  const verdictCopy = {
    synthetic: {
      label: "Likely synthetic",
      heading: "Deepfake Speech Detected.",
      copy: "The recording-level AASIST-L score is above the configured synthetic threshold. Review the highest-scoring windows and original context before taking action.",
    },
    authentic: {
      label: "Likely authentic",
      heading: "Authetic Speech.",
      copy: "The recording-level AASIST-L score is below the configured authentic threshold. This lowers model suspicion but does not prove provenance or identity.",
    },
    uncertain: {
      label: "Uncertain",
      heading: "The model cannot make a clear call.",
      copy: "The recording-level score falls inside the configured uncertainty band. Treat this result as inconclusive and seek additional evidence.",
    },
  }[result.verdict];

  function playFrom(startSeconds?: number) {
    const audio = audioRef.current;
    if (!audio) return;
    if (typeof startSeconds === "number") audio.currentTime = startSeconds;
    if (audio.paused) void audio.play();
    else if (typeof startSeconds !== "number") audio.pause();
  }

  return (
    <motion.div className={`analysis-result-page result-${result.verdict}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="result-page-top">
        <button className="back-button" onClick={onReset}><ArrowLeft size={17} /> New analysis</button>
        <div><button className="studio-secondary"><Download size={16} /> Export report</button><button className="studio-primary"><FolderKanban size={16} /> Add to case</button></div>
      </div>

      <section className={`result-hero-card result-hero-${result.verdict}`}>
        <div className="result-file-line"><span className="file-type-icon"><FileAudio size={18} /></span><span><strong>{result.audio.filename}</strong><small>{result.analysis_id} · Analyzed just now · {result.model.name}</small></span><VerdictBadge tone={result.verdict}>{verdictCopy.label}</VerdictBadge></div>
        <div className="result-assessment">
          <div className="assessment-orbit"><span>{score}<small>%</small></span><i /></div>
          <div className="assessment-copy"><span>MODEL ASSESSMENT</span><h2>{verdictCopy.heading}</h2><p>{verdictCopy.copy}</p></div>
          <div className="assessment-meta"><span><small>INPUT QUALITY</small><strong><i className={`quality-dot quality-dot-${result.quality.rating}`} /> {result.quality.rating === "good" ? "Good" : "Limited"}</strong></span><span><small>ANALYSIS LANGUAGE</small><strong>{result.analysis_language === "ar" ? "Arabic" : "Urdu"} · selected</strong></span><span><small>PROCESSING</small><strong>{(result.processing_ms / 1000).toFixed(2)} seconds</strong></span></div>
        </div>
      </section>

      <section className="studio-panel evidence-player">
        <div className="panel-heading"><div><span>WINDOW TIMELINE</span><h3>AASIST synthetic-likelihood regions</h3></div><span className="evidence-count">{flaggedWindows.length} {flaggedWindows.length === 1 ? "window" : "windows"} above threshold</span></div>
        <div className="audio-controls-line">
          <button className="play-button" aria-label="Play or pause audio" onClick={() => playFrom()}><Play size={17} fill="currentColor" /></button>
          <span>00:00</span><StudioWaveform result evidence={flaggedWindows} duration={result.audio.duration_seconds} /><span>{formatAnalysisTime(result.audio.duration_seconds)}</span>
          <button className="plain-icon-button" aria-label="Mute or unmute" onClick={() => { if (audioRef.current) audioRef.current.muted = !audioRef.current.muted; }}><Volume2 size={18} /></button>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          {audioUrl && <audio ref={audioRef} src={audioUrl} preload="metadata" aria-label="Uploaded recording preview" />}
        </div>
        <div className="timeline-legend"><span><i className="evidence-color" />Above the configured {Math.round(result.model.threshold * 100)}% window threshold</span><span>Overlapping {result.model.window_seconds.toFixed(2)}s windows</span></div>
      </section>

      <section className="result-grid">
        <article className="studio-panel evidence-list-panel">
          <div className="panel-heading"><div><span>MODEL OUTPUT</span><h3>{flaggedWindows.length ? "Highest flagged windows" : "Highest synthetic-likelihood windows"}</h3></div></div>
          {evidenceWindows.map((window, index) => <button className="evidence-item" key={window.index} onClick={() => playFrom(window.start_seconds)}><span className="evidence-index">{(index + 1).toString().padStart(2, "0")}</span><span><strong>Window {window.index + 1} synthetic likelihood</strong><small>{formatAnalysisTime(window.start_seconds, true)} – {formatAnalysisTime(window.end_seconds, true)} · {Math.round(window.synthetic_probability * 100)}% synthetic</small><p>AASIST-L scored this overlapping excerpt; it does not generate a textual acoustic explanation.</p></span><Play size={15} /></button>)}
          <div className="evidence-note"><AlertTriangle size={17} /><p>{result.quality.warnings[0] || result.limitations[0]}</p></div>
        </article>

        <article className="studio-panel result-info-panel">
          <div className="panel-heading"><div><span>ANALYSIS DETAILS</span><h3>File & model</h3></div></div>
          <dl><div><dt>Duration</dt><dd>{formatAnalysisTime(result.audio.duration_seconds, true)}</dd></div><div><dt>Format</dt><dd>{extension}</dd></div><div><dt>Sample rate</dt><dd>{(result.audio.sample_rate_hz / 1000).toFixed(1)} kHz</dd></div><div><dt>Channels</dt><dd>{result.audio.channels === 1 ? "Mono" : `${result.audio.channels} channels`}</dd></div><div><dt>Model</dt><dd>{result.model.name}</dd></div><div><dt>Analysis ID</dt><dd>{result.analysis_id}</dd></div></dl>
          <button className="detail-link"><FileText size={16} /> View complete methodology <ArrowRight size={14} /></button>
        </article>
      </section>

      <section className="feedback-card"><div><CircleDot size={19} /><span><strong>Does this assessment look right?</strong><small>Your feedback helps reviewers evaluate model performance.</small></span></div><div><button>Yes, looks right</button><button>Needs review</button></div></section>
    </motion.div>
  );
}

function AnalyzeView({ theme }: { theme: VoxauthTheme }) {
  const [phase, setPhase] = useState<AnalysisPhase>("input");
  const [language, setLanguage] = useState<"ur" | "ar">("ur");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [analysisError, setAnalysisError] = useState("");
  const [consent, setConsent] = useState(false);
  const [tab, setTab] = useState<"upload" | "record">("upload");
  const [stage, setStage] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingError, setRecordingError] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const reduceMotion = useReducedMotion();
  const stages = ["Upload received", "Audio normalized", "AASIST windows scored", "Assessment prepared"];
  const selectedName = file?.name || "";
  const audioUrl = useMemo(() => file ? URL.createObjectURL(file) : "", [file]);

  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); }, [audioUrl]);
  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    abortRef.current?.abort();
  }, []);

  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => setRecordingSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [recording]);

  useEffect(() => {
    if (phase !== "processing") return;
    const timer = window.setInterval(() => {
      setStage((current) => Math.min(current + 1, stages.length - 2));
    }, reduceMotion ? 180 : 820);
    return () => window.clearInterval(timer);
  }, [phase, reduceMotion, stages.length]);

  function handleFile(selected?: File) {
    if (!selected) return;
    const supportedExtensions = ["wav", "mp3", "m4a", "flac", "ogg", "webm", "aac"];
    const extension = selected.name.split(".").pop()?.toLowerCase();
    if (!extension || !supportedExtensions.includes(extension)) {
      setAnalysisError("Choose a WAV, MP3, M4A, FLAC, OGG, WebM, or AAC audio file.");
      return;
    }
    if (selected.size > 50 * 1024 * 1024) {
      setAnalysisError("Audio files are limited to 50 MB.");
      return;
    }
    setFile(selected);
    setResult(null);
    setAnalysisError("");
    setRecordingError("");
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  }

  async function toggleRecording() {
    if (recording) {
      recorderRef.current?.stop();
      setRecording(false);
      return;
    }
    setRecordingError("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setRecordingError("Recording is not supported in this browser. Upload an audio file instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const recordedFile = new File([blob], `voxauth-recording-${Date.now()}.webm`, { type: blob.type });
        setFile(recordedFile);
        setAnalysisError("");
        stream.getTracks().forEach((track) => track.stop());
      };
      setRecordingSeconds(0);
      recorder.start();
      setRecording(true);
    } catch {
      setRecordingError("Microphone access was not granted. You can still upload an audio file.");
    }
  }

  async function startAnalysis() {
    if (!file || !consent) return;
    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;
    setAnalysisError("");
    setResult(null);
    setStage(0);
    setPhase("processing");
    try {
      const analysis = await analyzeAudio(file, language, controller.signal);
      if (controller.signal.aborted) return;
      setStage(stages.length - 1);
      setResult(analysis);
      setPhase("result");
    } catch (error) {
      if (controller.signal.aborted) return;
      setAnalysisError(error instanceof AnalysisApiError ? error.message : "The audio analysis failed unexpectedly.");
      setPhase("input");
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }

  function cancelAnalysis() {
    abortRef.current?.abort();
    abortRef.current = null;
    setPhase("input");
    setStage(0);
  }

  function reset() {
    abortRef.current?.abort();
    setPhase("input"); setFile(null); setResult(null); setConsent(false); setStage(0); setRecordingError(""); setAnalysisError("");
  }

  if (phase === "result" && result) return <AnalysisResult result={result} audioUrl={audioUrl} onReset={reset} />;

  if (phase === "processing") return (
    <div className="analysis-processing-page">
      <div className="processing-card-large">
        <SignalField />
        <ImmersiveSignalScene theme={theme} className="processing-3d-scene" />
        <div className="processing-file"><span className="file-type-icon"><FileAudio size={20} /></span><span><strong>{selectedName}</strong><small>Fine-tuned AASIST-L · {languageProfiles[language].label} profile</small></span></div>        <div className="processing-visual"><StudioWaveform scanning /><div className="processing-orbit"><ScanSearch size={23} /><i /></div></div>
        <span className="processing-kicker">ANALYSIS IN PROGRESS</span>
        <h1>{stages[stage]}</h1>
        <p>The API is normalizing the recording and scoring the complete audio in overlapping model windows.</p>
        <div className="large-progress"><i style={{ width: `${((stage + 1) / stages.length) * 100}%` }} /></div>
        <div className="stage-list">{stages.map((item, index) => <span className={index < stage ? "stage-done" : index === stage ? "stage-active" : ""} key={item}>{index < stage ? <Check size={13} /> : <i />}{item}</span>)}</div>
        <button className="cancel-analysis" onClick={cancelAnalysis}>Cancel analysis</button>
      </div>
    </div>
  );

  return (
    <div className="view-stack analyze-view">
      <PageHeader eyebrow="VOICE AUTHENTICITY LAB" title="Analyze a recording" copy={`Upload or capture a ${languageProfiles[language].label} voice sample for a windowed, fine-tuned AASIST-L authenticity assessment.`} />
      <div className="analysis-layout">
        <section className="studio-panel input-panel">
          <div className="input-tabs" role="tablist"><button className={tab === "upload" ? "active" : ""} onClick={() => setTab("upload")}><CloudUpload size={17} /> Upload audio</button><button className={tab === "record" ? "active" : ""} onClick={() => setTab("record")}><Mic2 size={17} /> Record now</button></div>

          <AnimatePresence mode="wait">
            {tab === "upload" ? <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className={`studio-dropzone ${dragging ? "dragging" : ""} ${selectedName ? "has-file" : ""}`} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}>
                <input ref={fileInputRef} type="file" accept="audio/*" onChange={(event: ChangeEvent<HTMLInputElement>) => handleFile(event.target.files?.[0])} />
                {selectedName ? <>
                  <span className="selected-file-icon"><FileAudio size={28} /></span>
                  <strong>{selectedName}</strong>
                  <small>{`${(file!.size / 1024 / 1024).toFixed(2)} MB · ${file!.type || "Audio file"}`}</small>
                  <div className="file-ready"><CheckCircle2 size={15} /> Ready for preflight</div>
                  <button className="remove-file" onClick={() => { setFile(null); setResult(null); setAnalysisError(""); }} aria-label="Remove selected file"><X size={17} /></button>
                </> : <>
                  <span className="dropzone-large-icon"><Upload size={24} /></span>
                  <strong>Drop your audio here</strong>
                  <small>WAV, MP3, M4A, FLAC, OGG, WebM or AAC · up to 50 MB</small>
                  <button className="studio-secondary" onClick={() => fileInputRef.current?.click()}>Choose a file</button>
                </>}
              </div>
            </motion.div> : <motion.div key="record" className="recorder-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className={`recorder-orbit ${recording ? "recording" : ""}`}><button onClick={toggleRecording} aria-label={recording ? "Stop recording" : "Start recording"}>{recording ? <Square fill="currentColor" /> : <Mic2 />}</button><i /><i /></div>
              <span className="recording-time">{formatDuration(recordingSeconds)}</span>
              <strong>{recording ? "Listening…" : file ? "Recording ready" : "Ready to record"}</strong>
              <p>{recording ? "Speak naturally and keep the microphone steady." : "Your browser will ask for microphone permission."}</p>
              {recording && <StudioWaveform scanning />}
              {file && !recording && <div className="recorded-file"><CheckCircle2 size={16} /> {file.name}</div>}
              {recordingError && <div className="recording-error"><AlertTriangle size={15} />{recordingError}</div>}
            </motion.div>}
          </AnimatePresence>
        </section>

        <aside className="analysis-sidebar">
          <section className="studio-panel analysis-options">
            <div className="panel-heading"><div><span>ANALYSIS SETUP</span><h3>Preflight</h3></div></div>
            <label>Analysis profile<select value={language} onChange={(e) => setLanguage(e.target.value as "ur" | "ar")}><option value="ur">Urdu</option><option value="ar">Arabic</option></select><ChevronDown size={16} /></label>
            <div className="model-row"><span><Languages size={17} /><span><strong>{languageProfiles[language].modelName}</strong><small>{languageProfiles[language].modelDescription}</small></span></span><span className="available-badge">CONFIGURED</span></div>
            <div className="quality-guide"><Gauge size={18} /><span><strong>For the best result</strong><small>Use 10+ seconds of clear speech with minimal music or overlapping speakers.</small></span></div>
            <div className="consent-row"><input id="analysis-consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /><label htmlFor="analysis-consent"><i><Check size={12} /></i><span>I have permission to analyze this recording and understand this result is probabilistic.</span></label></div>
            <button className="studio-primary run-analysis" disabled={!file || !consent} onClick={startAnalysis}><Sparkles size={17} /> Run analysis <ArrowRight size={16} /></button>
            {analysisError && <div className="analysis-api-error"><AlertTriangle size={14} /><span>{analysisError}</span></div>}
            <span className="local-note"><LockKeyhole size={13} /> Audio is sent only to your configured AASIST service</span>
          </section>
        </aside>
      </div>
    </div>
  );
}

function HistoryView({ onAnalyze }: { onAnalyze: () => void }) {
  return <div className="view-stack"><PageHeader eyebrow="EVIDENCE LIBRARY" title="Analysis history" copy="Review every model assessment, input-quality note, and human disposition." action={<button className="studio-primary" onClick={onAnalyze}><Plus size={17} /> New analysis</button>} />
    <section className="studio-panel history-panel">
      <div className="history-toolbar"><label><Search size={16} /><input placeholder="Search analyses…" /></label><button>All verdicts <ChevronDown size={15} /></button><button>All languages <ChevronDown size={15} /></button><button>Last 30 days <ChevronDown size={15} /></button></div>
      <div className="history-table"><div className="history-head"><span>FILE</span><span>VERDICT</span><span>LANGUAGE</span><span>QUALITY</span><span>ANALYZED</span><span /></div>{[...recentAnalyses, { id: "AV-2837", name: "support_escalation.wav", verdict: "Likely synthetic", tone: "synthetic", language: "Urdu", quality: "Good", time: "Yesterday", score: "91%" }, { id: "AV-2836", name: "source_clip_final.mp3", verdict: "Uncertain", tone: "uncertain", language: "Urdu", quality: "Limited", time: "Yesterday", score: "53%" }].map((item) => <button className="history-row" key={item.id}><span className="history-file"><span className="file-type-icon"><FileAudio size={17} /></span><span><strong>{item.name}</strong><small>{item.id} · {item.score} synthetic</small></span></span><VerdictBadge tone={item.tone}>{item.verdict}</VerdictBadge><span>{item.language}</span><span><i className={`quality-mark quality-${item.quality.toLowerCase()}`} />{item.quality}</span><span>{item.time}</span><MoreHorizontal size={17} /></button>)}</div>
      <div className="table-footer"><span>Showing 6 of 1,284 analyses</span><div><button disabled><ChevronRight className="flip-icon" /></button><button>1</button><button>2</button><button>3</button><button><ChevronRight /></button></div></div>
    </section>
  </div>;
}

function CasesView() {
  const cases = [
    { id: "CASE-042", title: "Customer support impersonation", meta: "8 evidence items · Updated 12m ago", priority: "HIGH", owner: "ND", progress: 78, verdict: "5 synthetic · 2 authentic · 1 uncertain" },
    { id: "CASE-041", title: "Newsroom source verification", meta: "4 evidence items · Updated 2h ago", priority: "MEDIUM", owner: "SM", progress: 52, verdict: "1 synthetic · 3 authentic" },
    { id: "CASE-039", title: "Executive voice fraud review", meta: "12 evidence items · Updated yesterday", priority: "HIGH", owner: "ND", progress: 91, verdict: "9 synthetic · 2 authentic · 1 uncertain" },
  ];
  return <div className="view-stack"><PageHeader eyebrow="INVESTIGATION WORKSPACE" title="Cases" copy="Keep recordings, model evidence, notes, and human decisions together." action={<button className="studio-primary"><Plus size={17} /> Create case</button>} />
    <div className="case-summary"><span><strong>7</strong><small>Open cases</small></span><span><strong>2</strong><small>High priority</small></span><span><strong>19</strong><small>Awaiting review</small></span><span><strong>4.2h</strong><small>Average resolution</small></span></div>
    <div className="cases-grid">{cases.map((item) => <article className="studio-panel case-card" key={item.id}><div className="case-card-top"><span>{item.id}</span><span className={`priority priority-${item.priority.toLowerCase()}`}>{item.priority}</span></div><div className="case-icon"><BriefcaseBusiness /></div><h3>{item.title}</h3><p>{item.meta}</p><div className="case-verdict">{item.verdict}</div><div className="case-progress"><span><small>Review progress</small><strong>{item.progress}%</strong></span><div><i style={{ width: `${item.progress}%` }} /></div></div><div className="case-footer"><span className="avatar avatar-small">{item.owner}</span><button>Open case <ArrowRight size={14} /></button></div></article>)}</div>
  </div>;
}

function AnalyticsView() {
  const bars = [42, 56, 49, 68, 61, 82, 72, 88, 77, 94, 86, 100];
  return <div className="view-stack"><PageHeader eyebrow="WORKSPACE INTELLIGENCE" title="Analytics" copy="Understand volume, quality, verdict patterns, and the work still needing human review." action={<button className="studio-secondary">Last 30 days <ChevronDown size={15} /></button>} />
    <section className="metric-grid analytics-metrics"><article><div><span>TOTAL ANALYSES</span><AudioLines /></div><strong>1,284</strong><small className="metric-up">↗ 18.2%</small></article><article><div><span>SYNTHETIC SIGNAL</span><AlertTriangle /></div><strong>20.4%</strong><small>262 recordings</small></article><article><div><span>UNCERTAINTY RATE</span><CircleDot /></div><strong>11.8%</strong><small className="metric-up">↘ 2.1%</small></article><article><div><span>HUMAN REVIEW SLA</span><Clock3 /></div><strong>42m</strong><small className="metric-up">Within target</small></article></section>
    <section className="analytics-grid"><article className="studio-panel volume-chart"><div className="panel-heading"><div><span>ANALYSIS VOLUME</span><h3>Signals over time</h3></div><span className="trend-chip">+18.2%</span></div><div className="chart-y-labels"><span>160</span><span>120</span><span>80</span><span>40</span><span>0</span></div><div className="bar-chart">{bars.map((height, index) => <div key={index}><i style={{ height: `${height}%` }} /><span>{index % 2 === 0 ? `${index + 1} Jul` : ""}</span></div>)}</div></article><article className="studio-panel language-chart"><div className="panel-heading"><div><span>LANGUAGE COVERAGE</span><h3>Audio analyzed</h3></div></div><div className="language-big"><span>اُردُو</span><strong>URDU</strong><small>1,284 analyses</small></div><div className="language-progress"><span><small>Good quality</small><strong>92%</strong></span><div><i style={{ width: "92%" }} /></div></div><div className="language-progress violet"><span><small>Supported dialect fit</small><strong>88%</strong></span><div><i style={{ width: "88%" }} /></div></div></article></section>
    <section className="analytics-grid lower"><article className="studio-panel review-chart"><div className="panel-heading"><div><span>REVIEW OUTCOMES</span><h3>Model vs. human disposition</h3></div></div><div className="review-stat"><div className="review-ring"><strong>94%</strong><span>agreement</span></div><div><span><i className="dot-authentic" />Confirmed <strong>812</strong></span><span><i className="dot-uncertain" />Escalated <strong>73</strong></span><span><i className="dot-synthetic" />Overturned <strong>52</strong></span></div></div></article><article className="studio-panel limitation-panel"><div className="panel-heading"><div><span>INPUT LIMITATIONS</span><h3>What reduces certainty</h3></div></div>{[["Heavy compression", 34], ["Background noise", 27], ["Short duration", 21], ["Multiple speakers", 18]].map(([label, value]) => <div className="limitation-row" key={label as string}><span><small>{label as string}</small><strong>{value as number}%</strong></span><div><i style={{ width: `${value}%` }} /></div></div>)}</article></section>
  </div>;
}

function CoverageView() {
  const languages = [
    { native: "اُردُو", name: "Urdu", status: "INTEGRATED", tone: "available", copy: "The fine-tuned AASIST-L TTS+VC inference path is active; broader calibration remains an explicit evaluation task.", version: "AASIST-L Urdu FT" },
    { native: "عر", name: "Arabic", status: "INTEGRATED", tone: "available", copy: "The fine-tuned AASIST-L AFAD-MSA inference path is active; broader calibration remains an explicit evaluation task.", version: "AASIST-L Arabic FT" },
    { native: "پښتو", name: "Pashto", status: "PLANNED", tone: "planned", copy: "Dataset construction and TTS coverage are still being scoped; no pretrained synthesis system currently supports Pashto.", version: "Roadmap" },
    { native: "فارسی", name: "Persian", status: "PLANNED", tone: "planned", copy: "Dataset and dialect (Iranian vs. Dari) requirements under review.", version: "Roadmap" },
  ];
  return <div className="view-stack"><PageHeader eyebrow="MODEL TRANSPARENCY" title="Language coverage" copy="A model is only useful when you know where it works—and where it doesn’t." />
    <section className="coverage-hero-studio"><SignalField /><div><span><Globe2 size={16} /> COVERAGE PRINCIPLE</span><h2>No language ships<br/>as a vague promise.</h2><p>Every model status is explicit, versioned, and paired with limitations. Urdu has an active AASIST-L integration, with calibration still required before operational use.</p></div><div className="coverage-score"><span>02</span><small>integrated<br/>profiles</small></div></section>
    <div className="language-card-grid">{languages.map((item) => <article className={`studio-panel language-card lang-${item.tone}`} key={item.name}><div className="language-card-top"><span>{item.native}</span><span className={`language-status status-${item.tone}`}><i />{item.status}</span></div><h3>{item.name}</h3><p>{item.copy}</p><div><span>MODEL STATUS</span><strong>{item.version}</strong></div></article>)}</div>
    <section className="studio-panel coverage-guidance"><ShieldCheck size={24} /><div><h3>Responsible coverage labels</h3><p>Integrated means the inference path is active, not that accuracy has been validated for every Urdu domain. Evaluation and calibration remain explicit release gates.</p></div><button>Read methodology <ArrowRight size={15} /></button></section>
  </div>;
}

function SettingsView() {
  return <div className="view-stack"><PageHeader eyebrow="WORKSPACE" title="Settings" copy="Manage your profile, workspace preferences, data controls, and notifications." /><section className="settings-layout"><nav className="settings-nav"><button className="active"><UserRound /> Profile</button><button><Users /> Team</button><button><Bell /> Notifications</button><button><LockKeyhole /> Data & privacy</button></nav><article className="studio-panel settings-card"><div className="panel-heading"><div><span>PERSONAL PROFILE</span><h3>Your details</h3></div></div><div className="profile-row"><span className="avatar avatar-large">ND</span><div><strong>Nawaal Dar</strong><small>Workspace administrator</small></div><button>Change photo</button></div><div className="settings-form"><label>Full name<input defaultValue="Nawaal Dar" /></label><label>Work email<input defaultValue="nawaal@example.com" /></label><label>Interface language<select defaultValue="English"><option>English</option><option>Urdu</option></select></label><label>Default analysis language<select defaultValue="Auto-detect"><option>Auto-detect</option><option>Urdu</option></select></label></div><div className="settings-save"><button className="studio-primary">Save changes</button></div></article></section></div>;
}

export function StudioPage() {
  const [view, setView] = useState<View>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState<ApiStatus>("checking");
  const reduceMotion = useReducedMotion();
  const { theme } = useVoxauthTheme();

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("view") as View | null;
    if (requested && [...navItems.map((item) => item.id), "settings"].includes(requested)) {
      const timer = window.setTimeout(() => setView(requested), 0);
      return () => window.clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/health", { cache: "no-store", signal: controller.signal })
      .then((response) => response.json().then((body) => ({ response, body })))
      .then(({ response, body }) => setApiStatus(response.ok && body.model_loaded ? "ready" : "unavailable"))
      .catch((error) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) setApiStatus("unavailable");
      });
    return () => controller.abort();
  }, []);

  function navigate(next: View) {
    setView(next);
    setSidebarOpen(false);
    window.history.replaceState({}, "", next === "dashboard" ? "/studio" : `/studio?view=${next}`);
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }

  let content: React.ReactNode;
  if (view === "dashboard") content = <DashboardView onNavigate={navigate} theme={theme} />;
  else if (view === "analyze") content = <AnalyzeView theme={theme} />;
  else if (view === "history") content = <HistoryView onAnalyze={() => navigate("analyze")} />;
  else if (view === "cases") content = <CasesView />;
  else if (view === "analytics") content = <AnalyticsView />;
  else if (view === "coverage") content = <CoverageView />;
  else content = <SettingsView />;

  return (
    <main className="studio-shell">
      <aside className={`studio-sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand"><Link href="/" aria-label="Back to Voxauth home"><VoxauthLogo /></Link><button onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X /></button></div>
        <div className="workspace-switcher"><span className="workspace-icon">AU</span><span><strong>Voxauth Labs</strong><small>Production workspace</small></span><ChevronDown size={15} /></div>
        <nav aria-label="Workspace navigation"><span className="nav-label">WORKSPACE</span>{navItems.slice(0, 5).map((item) => { const Icon = item.icon; return <button className={view === item.id ? "active" : ""} key={item.id} onClick={() => navigate(item.id)}><Icon size={18} /><span>{item.label}</span>{item.id === "cases" && <small>7</small>}</button>; })}<span className="nav-label nav-label-spaced">MODELS</span>{navItems.slice(5).map((item) => { const Icon = item.icon; return <button className={view === item.id ? "active" : ""} key={item.id} onClick={() => navigate(item.id)}><Icon size={18} /><span>{item.label}</span><i className="nav-live-dot" /></button>; })}</nav>
        <div className="sidebar-bottom"><button><BookOpen size={17} /> Documentation <span>↗</span></button><button><LifeBuoy size={17} /> Help & support</button><div className="usage-card"><div><span>MONTHLY USAGE</span><strong>64%</strong></div><div><i /></div><small>1,284 of 2,000 analyses</small></div><button className={`profile-button ${view === "settings" ? "active" : ""}`} onClick={() => navigate("settings")}><span className="avatar">ND</span><span><strong>Nawaal Dar</strong><small>Administrator</small></span><Settings size={16} /></button></div>
      </aside>

      {sidebarOpen && <button className="sidebar-scrim" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}

      <section className="studio-main">
        <header className="studio-topbar"><button className="studio-menu" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu /></button><div className="command-search"><Search size={16} /><span>Search anything…</span><kbd>⌘ K</kbd></div><div className="topbar-actions"><ThemeSwitcher compact /><span className={`system-health system-health-${apiStatus}`}><i /> {apiStatus === "ready" ? "AASIST ready" : apiStatus === "unavailable" ? "AASIST unavailable" : "Checking AASIST"}</span><button aria-label="Notifications" className="notification-button"><Bell size={18} /><i /></button><span className="topbar-divider" /><button className="topbar-profile"><span className="avatar">ND</span><ChevronDown size={14} /></button></div></header>
        <div className="studio-content"><AnimatePresence mode="wait" initial={false}><motion.div key={view} initial={false} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>{content}</motion.div></AnimatePresence></div>
      </section>
    </main>
  );
}
