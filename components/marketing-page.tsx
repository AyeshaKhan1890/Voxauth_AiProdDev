"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import {
  ArrowRight,
  AudioLines,
  Check,
  ChevronRight,
  CircleDot,
  FileAudio,
  Fingerprint,
  Globe2,
  LockKeyhole,
  Menu,
  Mic2,
  Play,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { VoxauthLogo } from "./voxauth-logo";
import { ImmersiveSignalScene } from "./immersive-scene";
import { SignalField } from "./signal-field";
import { ThemeSwitcher, useVoxauthTheme } from "./theme-controller";

const waveform = [
  18, 32, 22, 46, 64, 34, 78, 52, 88, 42, 68, 92, 56, 74, 38, 62, 86, 48,
  70, 96, 60, 80, 44, 68, 36, 54, 82, 46, 70, 32, 48, 76, 28, 58, 40, 72,
  50, 84, 36, 62, 44, 70, 26, 54, 34, 66, 30, 48,
];

const features = [
  {
    icon: ScanSearch,
    kicker: "DETECTION",
    title: "See beyond the score",
    copy: "Review suspicious moments on an evidence timeline instead of trusting a lonely percentage.",
    className: "feature-card-wide feature-cyan",
  },
  {
    icon: Globe2,
    kicker: "MULTILINGUAL",
    title: "Built in Urdu. Going global.",
    copy: "Clear model coverage for every language and dialect—available, beta, limited, or planned.",
    className: "feature-violet",
  },
  {
    icon: Fingerprint,
    kicker: "PROVENANCE",
    title: "Keep the chain intact",
    copy: "Preserve model version, file metadata, limitations, and human review in every report.",
    className: "feature-dark",
  },
  {
    icon: LockKeyhole,
    kicker: "PRIVACY",
    title: "Sensitive by design",
    copy: "Visible consent, retention, and deletion controls for audio that deserves careful handling.",
    className: "feature-card-wide feature-pink",
  },
];

function MiniWaveform({ active = false }: { active?: boolean }) {
  return (
    <div className={`mini-waveform ${active ? "waveform-active" : ""}`} aria-hidden="true">
      {waveform.map((height, index) => (
        <i key={index} style={{ height: `${height}%`, animationDelay: `${index * -35}ms` }} />
      ))}
    </div>
  );
}

function DetectorDemo() {
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState<"idle" | "ready" | "processing" | "done">("idle");
  const [stage, setStage] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const stages = ["Inspecting audio", "Detecting language", "Testing authenticity", "Preparing evidence"];

  useEffect(() => {
    if (status !== "processing") return;
    const timer = window.setInterval(() => {
      setStage((current) => {
        if (current >= stages.length - 1) {
          window.clearInterval(timer);
          window.setTimeout(() => setStatus("done"), 500);
          return current;
        }
        return current + 1;
      });
    }, 720);
    return () => window.clearInterval(timer);
  }, [status, stages.length]);

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setStatus("ready");
    setStage(0);
  }

  function startDemo() {
    if (status === "idle") {
      setFileName("urdu_voice_note.wav");
    }
    setStage(0);
    setStatus("processing");
  }

  function resetDemo() {
    setStatus("idle");
    setStage(0);
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="detector-shell">
      <div className="detector-topline">
        <div className="window-dots" aria-hidden="true"><i /><i /><i /></div>
        <span>VOICE AUTHENTICITY LAB</span>
        <span className="demo-pill">INTERACTIVE DEMO</span>
      </div>

      <div className="detector-body">
        {status === "done" ? (
          <motion.div
            className="demo-result"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="result-summary">
              <div className="verdict-orbit"><ShieldCheck size={27} /><i /></div>
              <div>
                <span className="eyebrow">ASSESSMENT COMPLETE</span>
                <h3>Likely authentic</h3>
              </div>
              <div className="likelihood"><strong>08%</strong><span>synthetic likelihood</span></div>
            </div>
            <div className="result-wave-wrap">
              <MiniWaveform />
              <span className="wave-playhead" />
            </div>
            <div className="result-details">
              <span><Check size={14} /> Urdu detected</span>
              <span><Check size={14} /> Good input quality</span>
              <span><Check size={14} /> No flagged segments</span>
            </div>
            <div className="demo-disclaimer">Demo output—not a real model analysis.</div>
            <div className="demo-actions">
              <button className="button-secondary" onClick={resetDemo}>Try another</button>
              <a className="button-primary button-small" href="/studio?view=analyze">
                Open full studio <ArrowRight size={16} />
              </a>
            </div>
          </motion.div>
        ) : (
          <>
            <button className="dropzone" onClick={() => fileRef.current?.click()} type="button">
              <input ref={fileRef} type="file" accept="audio/*" onChange={selectFile} tabIndex={-1} />
              <span className="dropzone-icon"><Upload size={21} /></span>
              <span className="dropzone-copy">
                <strong>{fileName || "Drop an audio file here"}</strong>
                <small>{fileName ? "Ready for the demo scan" : "WAV, MP3, M4A, FLAC · up to 100 MB"}</small>
              </span>
              <span className="browse-label">Browse</span>
            </button>

            <div className="or-row"><span />or<span /></div>

            <button className="record-row" type="button" onClick={() => { setFileName("live_recording.webm"); setStatus("ready"); }}>
              <span><Mic2 size={18} /></span>
              <span><strong>Record from microphone</strong><small>Capture a clean voice sample</small></span>
              <ChevronRight size={17} />
            </button>

            {status === "processing" ? (
              <div className="demo-processing">
                <MiniWaveform active />
                <div className="processing-copy">
                  <span>{stages[stage]}</span>
                  <small>Stage {stage + 1} of {stages.length}</small>
                </div>
                <div className="processing-track"><i style={{ width: `${((stage + 1) / stages.length) * 100}%` }} /></div>
              </div>
            ) : (
              <button className="button-primary analyze-demo-button" onClick={startDemo} type="button">
                <Sparkles size={17} /> Analyze {status === "ready" ? "this audio" : "demo audio"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ProofChip({ children }: { children: React.ReactNode }) {
  return <span className="proof-chip"><Check size={13} />{children}</span>;
}

export function MarketingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const { theme } = useVoxauthTheme();
  const { scrollY } = useScroll();
  const sceneY = useTransform(scrollY, [0, 950], [0, 175]);
  const sceneScale = useTransform(scrollY, [0, 950], [1, 1.12]);
  const heroCopyY = useTransform(scrollY, [0, 760], [0, 85]);
  const heroCopyOpacity = useTransform(scrollY, [0, 700], [1, 0.16]);

  return (
    <main className="marketing-page">
      <section className="hero-section hero-immersive">
        <SignalField />
        <motion.div className="hero-scene-layer" style={{ y: sceneY, scale: sceneScale }}>
          <ImmersiveSignalScene theme={theme} />
        </motion.div>
        <div className="hero-vignette" aria-hidden="true" />
        <header className="marketing-header site-container">
          <a href="#top" className="brand-link" aria-label="Voxauth home"><VoxauthLogo /></a>
          <nav className={`desktop-nav ${menuOpen ? "nav-open" : ""}`} aria-label="Main navigation">
            <a href="#platform" onClick={() => setMenuOpen(false)}>Platform</a>
            <a href="#workflow" onClick={() => setMenuOpen(false)}>How it works</a>
            <a href="#coverage" onClick={() => setMenuOpen(false)}>Coverage</a>
            <a href="#security" onClick={() => setMenuOpen(false)}>Security</a>
          </nav>
          <div className="header-actions">
            <ThemeSwitcher compact />
            <a className="text-link header-signin" href="/studio">Sign in</a>
            <a className="button-primary button-small header-cta" href="/studio?view=analyze">Analyze audio <ArrowRight size={15} /></a>
            <button className="menu-button" aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </header>

        <div className="hero-content site-container" id="top">
          <motion.div
            className="hero-copy"
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
            style={reduceMotion ? undefined : { y: heroCopyY, opacity: heroCopyOpacity }}
          >
            <div className="status-badge"><i /> Multilingual voice authenticity <span>URDU LIVE</span></div>
            <h1>Hear what’s<br/><em>real.</em></h1>
            <p>Detect synthetic and manipulated speech, understand the evidence, and act with confidence.</p>
            <div className="hero-actions">
              <a className="button-primary button-large" href="/studio?view=analyze">Analyze audio <ArrowRight size={18} /></a>
              <a className="watch-link" href="#workflow"><span><Play size={15} fill="currentColor" /></span> See how it works</a>
            </div>
            <div className="proof-row">
              <ProofChip>Privacy-first</ProofChip>
              <ProofChip>Evidence-led</ProofChip>
              <ProofChip>Human-reviewed</ProofChip>
            </div>
          </motion.div>

          <motion.div className="hero-3d-hud" initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: .35 }}>
            <div className="hud-readout hud-readout-top"><span>VOICE CORE</span><strong>ACTIVE</strong><i /></div>
            <div className="hud-readout hud-readout-side"><span>LATENT SIGNAL</span><strong>03.482 THz</strong><i /></div>
            <div className="core-tracker"><span /><i /><small>UR-v1.4<br/>SPECTRAL FIELD</small></div>
            <div className="scene-coordinate coordinate-a">X 03.14 / Y 08.72</div>
            <div className="scene-coordinate coordinate-b">SIGNAL DEPTH 04</div>
          </motion.div>
        </div>

        <div className="hero-foot site-container">
          <span>BUILT FOR HIGH-STAKES AUDIO</span>
          <div><span>NEWSROOMS</span><span>TRUST & SAFETY</span><span>FRAUD TEAMS</span><span>CALL CENTERS</span></div>
        </div>
      </section>

      <section className="lab-demo-section">
        <div className="lab-demo-noise" aria-hidden="true" />
        <div className="site-container lab-demo-grid">
          <motion.div className="lab-demo-copy" initial={reduceMotion ? false : { opacity: 0, x: -25 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: .35 }}>
            <span className="lab-index">LIVE / 001</span>
            <p className="overline">STEP INTO THE SIGNAL</p>
            <h2>Don’t just watch it.<br/><em>Interrogate it.</em></h2>
            <p>Drop in a recording and experience the complete authenticity flow. This interactive demo stays honest: it simulates the future model response without sending your audio anywhere.</p>
            <div className="lab-specs"><span><small>MODEL</small><strong>UR-v1.4</strong></span><span><small>INPUT</small><strong>VOICE / 48kHz</strong></span><span><small>MODE</small><strong>LOCAL DEMO</strong></span></div>
          </motion.div>
          <motion.div className="lab-demo-instrument" initial={reduceMotion ? false : { opacity: 0, y: 25, rotateX: 4 }} whileInView={{ opacity: 1, y: 0, rotateX: 0 }} viewport={{ once: true, amount: .25 }}>
            <div className="instrument-glow" />
            <DetectorDemo />
            <div className="floating-signal floating-signal-one"><AudioLines size={15} /><span>Signal quality</span><strong>GOOD</strong></div>
            <div className="floating-signal floating-signal-two"><CircleDot size={15} /><span>Model</span><strong>UR-v1.4</strong></div>
          </motion.div>
        </div>
      </section>

      <section className="manifesto-section" id="platform">
        <div className="site-container manifesto-grid">
          <div className="section-label"><span>01</span> THE PLATFORM</div>
          <div className="manifesto-copy">
            <p className="overline">A NEW STANDARD FOR AUDIO TRUTH</p>
            <h2>A detector should give you more than <em>a number.</em></h2>
            <p className="section-lead">Voxauth combines multilingual deepfake detection with evidence, context, and responsible human review—so every verdict can be understood, questioned, and acted on.</p>
          </div>
        </div>

        <div className="site-container feature-grid">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.article
                key={feature.title}
                className={`feature-card ${feature.className}`}
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: index * 0.06 }}
              >
                <div className="feature-card-head"><span>{feature.kicker}</span><span className="feature-icon"><Icon size={20} /></span></div>
                {index === 0 && <div className="feature-wave"><MiniWaveform /><i /><i /></div>}
                {index === 1 && <div className="language-orbit"><span>اُردُو</span><i>EN</i><i>AR</i><i>ES</i></div>}
                {index === 2 && <div className="fingerprint-rings"><i /><i /><i /><Fingerprint size={30} /></div>}
                {index === 3 && <div className="privacy-visual"><LockKeyhole size={26} /><span>Audio encrypted</span><span className="privacy-line" /></div>}
                <div className="feature-copy"><h3>{feature.title}</h3><p>{feature.copy}</p></div>
              </motion.article>
            );
          })}
        </div>
      </section>

      <section className="workflow-section" id="workflow">
        <div className="site-container">
          <div className="workflow-heading">
            <div className="section-label"><span>02</span> THE FLOW</div>
            <div><p className="overline">FROM AUDIO TO EVIDENCE</p><h2>Three steps.<br/>No black box.</h2></div>
          </div>
          <div className="workflow-grid">
            {[
              ["01", "Capture", "Upload a file or record directly. Preflight checks quality, duration, and language support before analysis.", FileAudio],
              ["02", "Analyze", "The right language model evaluates the recording and maps suspicious signal windows across time.", ScanSearch],
              ["03", "Understand", "Review the verdict, evidence, limitations, and model version—then save, share, or escalate.", ShieldCheck],
            ].map(([number, title, copy, Icon], index) => {
              const StepIcon = Icon as typeof FileAudio;
              return <article className="workflow-card" key={title as string}>
                <span className="workflow-number">{number as string}</span>
                <div className="workflow-icon"><StepIcon /></div>
                <h3>{title as string}</h3><p>{copy as string}</p>
                {index < 2 && <span className="workflow-connector"><ArrowRight /></span>}
              </article>;
            })}
          </div>
        </div>
      </section>

      <section className="coverage-section" id="coverage">
        <div className="site-container coverage-grid">
          <div className="coverage-copy">
            <div className="section-label light"><span>03</span> LANGUAGE COVERAGE</div>
            <p className="overline">LOCAL FIRST. GLOBAL NEXT.</p>
            <h2>Every voice deserves a model that understands it.</h2>
            <p>Voxauth started with Urdu—not as an afterthought, but as the foundation. Every new language ships with visible coverage, limitations, and evaluation status.</p>
            <a className="button-light" href="/studio?view=coverage">Explore model coverage <ArrowRight size={17} /></a>
          </div>
          <div className="coverage-panel">
            <div className="coverage-core"><span>اُردُو</span><strong>AVAILABLE</strong><i /></div>
            <div className="coverage-node node-en"><span>EN</span><small>IN EVALUATION</small></div>
            <div className="coverage-node node-ar"><span>عر</span><small>PLANNED</small></div>
            <div className="coverage-node node-es"><span>ES</span><small>PLANNED</small></div>
            <div className="coverage-node node-hi"><span>हि</span><small>PLANNED</small></div>
            <div className="coverage-radar radar-one" /><div className="coverage-radar radar-two" /><div className="coverage-radar radar-three" />
          </div>
        </div>
      </section>

      <section className="security-section" id="security">
        <div className="site-container security-card">
          <SignalField />
          <div className="security-copy">
            <span className="security-kicker"><ShieldCheck size={16} /> BUILT FOR RESPONSIBLE DECISIONS</span>
            <h2>Truth needs<br/><em>good instruments.</em></h2>
            <p>Start with a detector that shows its work—and treats every recording like the sensitive evidence it is.</p>
            <div className="security-actions"><a className="button-primary button-large" href="/studio?view=analyze">Open Voxauth <ArrowRight size={18} /></a><a href="#top">Read our principles</a></div>
          </div>
          <div className="security-seal"><span><ShieldCheck size={38} /></span><strong>ASSESS.<br/>DON’T ASSUME.</strong><small>Voxauth / 2026</small></div>
        </div>
      </section>

      <footer className="marketing-footer">
        <div className="site-container footer-top">
          <div><VoxauthLogo /><p>Multilingual voice authenticity,<br/>built for evidence.</p></div>
          <div className="footer-links"><div><strong>PRODUCT</strong><a href="#platform">Platform</a><a href="#coverage">Coverage</a><a href="/studio">Studio</a></div><div><strong>TRUST</strong><a href="#security">Security</a><a href="#security">Responsible use</a><a href="#security">Privacy</a></div></div>
        </div>
        <div className="site-container footer-bottom"><span>© 2026 Voxauth. All rights reserved.</span><span>Hear what’s real.</span></div>
      </footer>
    </main>
  );
}
