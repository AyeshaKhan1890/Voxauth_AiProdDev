# Awaazera — Production Frontend Implementation Plan

> Working product name: **Awaazera**  
> Tagline: **Hear what’s real.**  
> Product category: Multilingual voice authenticity and audio forensics  
> Frontend: Next.js + React + TypeScript  
> Backend status: Not integrated; all frontend flows use contract-driven mocks until the detection API is ready

---

## 1. Executive product decision

Build Awaazera as a trustworthy audio investigation workspace, not as a one-button “fake/real” toy. The first production journey is still extremely simple—upload or record audio, run an analysis, understand the result—but the information architecture must already support cases, batch scans, live monitoring, reports, team collaboration, language coverage, model versions, and future forensic tools.

The visual personality is **forensic luxury**: near-black surfaces, luminous spectral color, restrained glass, crisp typography, animated signal fields, and tactile transitions. The interface should feel cinematic on the marketing site and calm, fast, and precise inside the analysis workspace.

“Awaazera” combines *awaaz* (voice) with a global, brandable ending. It keeps the Urdu origin visible while leaving room for every language and future media-authenticity capabilities. Treat it as a working name until trademark, domain, and social-handle clearance is completed.

### Product promise

> Awaazera helps people assess whether a voice recording is likely authentic, synthetic, manipulated, or too uncertain to call—and explains the signals behind that assessment.

### Non-negotiable trust rule

Never display a detector result as absolute proof. The primary labels are:

- **Likely synthetic**
- **Uncertain**
- **Likely authentic**

Every result also shows input quality, model version, supported-language status, timestamp, and limitations. “Fake” and “real” may appear in explanatory marketing copy, but not as the only technical verdict.

---

## 2. Goals, assumptions, and non-goals

### Goals

- Deliver a production-quality responsive frontend that is fully useful with mock data.
- Make backend integration a client-adapter change, not a page rewrite.
- Launch with English and Urdu interface support, including genuine RTL layouts.
- Make Urdu the first supported detection language while clearly communicating model coverage.
- Create a striking, ownable visual system with excellent animation performance.
- Support anonymous/demo scanning, authenticated workspaces, cases, history, analytics, and administration as separately releasable modules.
- Establish accessibility, privacy, observability, tests, and performance budgets from the beginning.

### Assumptions to validate with the backend team

- The backend will eventually accept uploaded audio and return an asynchronous analysis job.
- A completed job can return a verdict, probability/score, model version, detected language, input-quality metrics, and optional time-based evidence segments.
- Production uploads will use short-lived presigned object-storage URLs rather than proxying large files through Next.js.
- Progress can initially be polled; Server-Sent Events can be added for job updates and WebSockets reserved for live audio.
- Authentication, organizations, permissions, retention, and billing will be backend-owned later.

### Frontend non-goals

- No detection or signal-processing model will run in the frontend.
- No custom authentication server, database, payment flow, or storage layer will be built now.
- UI mocks must not claim that an audio file was truly analyzed.
- No public voice-cloning or deepfake-generation interface is included.
- Real-time detection remains feature-flagged until latency, privacy, and streaming contracts exist.

---

## 3. Users and permissions

### Primary personas

1. **Quick checker** — wants one answer with no training: upload, scan, understand, leave.
2. **Trust and safety analyst** — reviews many recordings, compares evidence, adds notes, and escalates uncertain cases.
3. **Journalist or fact checker** — needs provenance, a transparent report, timestamps, and reproducible metadata.
4. **Fraud/risk team** — needs batch scanning, API integration, audit history, and role-based access.
5. **Workspace administrator** — manages members, retention, API access, model availability, and audit logs.
6. **Internal ML/review operator** — watches model coverage, failed jobs, feedback, drift indicators, and false-positive reports.

### Planned roles

| Role | Core capabilities |
|---|---|
| Viewer | Read analyses, cases, reports, and shared results |
| Analyst | Create analyses, comment, label, export, and manage cases |
| Manager | All analyst actions plus batch jobs, assignment, and workspace analytics |
| Admin | Members, roles, integrations, retention, API keys, billing shell, audit logs |
| Internal operator | Cross-workspace model and job tooling; never part of normal tenant navigation |

During frontend-only development, role selection is available in the mock developer panel. Authorization in mocks is for UI testing only; the backend must enforce every permission later.

---

## 4. Product surface and information architecture

### Public routes

| Route | Purpose |
|---|---|
| `/[locale]` | Cinematic landing page with interactive detector demo |
| `/[locale]/product` | Platform capabilities and workflow |
| `/[locale]/coverage` | Language/model coverage and roadmap |
| `/[locale]/use-cases/[slug]` | Journalism, fraud, call centers, trust and safety |
| `/[locale]/security` | Privacy, retention, security, and responsible-use posture |
| `/[locale]/pricing` | Plan comparison shell; hidden until commercial model exists |
| `/[locale]/docs` | Product/API documentation landing page |
| `/[locale]/sign-in` | Sign-in shell with demo-workspace access |
| `/[locale]/request-access` | Waitlist/enterprise access form shell |
| `/[locale]/share/[token]` | Restricted, read-only shared report later |

### Authenticated workspace routes

| Route | Purpose | Initial release |
|---|---|---|
| `/[locale]/app` | Overview, recent scans, usage, alerts, quick scan | Yes |
| `/[locale]/app/analyze/new` | Upload, record, URL-import shell, options, consent | Yes |
| `/[locale]/app/analyses/[id]` | Processing and result experience | Yes |
| `/[locale]/app/history` | Searchable/filterable analysis history | Yes |
| `/[locale]/app/cases` | Case list, ownership, status, priority | Beta |
| `/[locale]/app/cases/[id]` | Evidence, analyses, notes, activity, reports | Beta |
| `/[locale]/app/batch` | CSV/multi-file batch workflow | Beta |
| `/[locale]/app/compare` | Compare two authorized recordings | Later |
| `/[locale]/app/live` | Live-call monitoring shell | Later |
| `/[locale]/app/analytics` | Volume, verdict mix, languages, quality, review SLA | Beta |
| `/[locale]/app/integrations` | API, webhook, contact-center and storage connectors | Later |
| `/[locale]/app/team` | Members, invites, and roles | Beta |
| `/[locale]/app/settings/*` | Profile, preferences, data, security, notifications | Yes |
| `/[locale]/app/help` | Guides, shortcuts, support, system status | Yes |

### Internal operations routes

| Route | Purpose |
|---|---|
| `/ops` | Model/job/feedback overview; separate layout and authorization |
| `/ops/models` | Languages, versions, release stage, thresholds, changelog |
| `/ops/jobs` | Queue, failures, latency, retry UI |
| `/ops/feedback` | User-confirmed labels and disputed verdicts |
| `/ops/audit` | Administrative audit trail |

Internal routes must never be exposed by merely hiding navigation. Backend authorization and a separate operator identity boundary are required before they ship.

---

## 5. Core user journeys

### Journey A — first scan

1. User arrives on the landing page and sees the promise, supported-language badge, and a visual mini-detector.
2. User chooses **Upload audio** or **Record now**.
3. Frontend validates file type, size, duration when locally readable, and browser capabilities.
4. User confirms they have permission to analyze the recording and sees the temporary-retention statement.
5. A three-step progress experience shows upload, audio inspection, and model analysis.
6. The result reveals the verdict, synthetic-likelihood range/score, quality, language, and key evidence.
7. User can listen with evidence segments highlighted, inspect limitations, download a demo report, submit feedback, or create an account to save it.

### Journey B — analyst case

1. Analyst creates a case or opens an existing one.
2. Analyst attaches one or more recordings and contextual notes.
3. Analyses appear as independently versioned evidence items.
4. Analyst reviews suspicious time segments, adds a human disposition, and assigns a teammate.
5. Case activity records comments, verdict changes, model re-runs, and exports.
6. Analyst generates a report clearly separating machine output from human conclusions.

### Journey C — batch review

1. User uploads multiple recordings or a manifest.
2. Preflight identifies unsupported/corrupt/oversized items before submission.
3. Batch progress supports partial success, retry, cancel, and filters.
4. Completed results can be filtered by verdict, quality, language, and model version.
5. Selected items can be moved into a case or exported.

### Journey D — live shield (future)

1. User chooses a microphone/input source and explicitly grants permission.
2. Local Web Audio visualization shows input level and connection state; it does not pretend to perform detection.
3. Audio chunks stream to the backend through a future WebSocket contract.
4. The UI displays rolling risk windows with latency and confidence caveats.
5. The session can be ended, discarded, or saved under the configured retention policy.

---

## 6. Screen-by-screen design specification

### 6.1 Landing page

**Navigation:** wordmark, Product, Coverage, Use cases, Security, Docs, language switcher, Sign in, and a luminous “Analyze audio” CTA.

**Hero:**

- Eyebrow: “Multilingual voice authenticity” with “Urdu available” status dot.
- Headline: “Hear what’s real.”
- Supporting line: “Detect synthetic and manipulated speech, understand the evidence, and act with confidence.”
- Primary CTA: Analyze audio. Secondary CTA: Explore the platform.
- Interactive detector card with upload/record tabs, animated waveform, and a clearly labeled “demo result.”
- Ambient “Signal Field” background: spectral curves and particles bending gently around the detector card.

**Below the fold:**

1. Trust strip with privacy, explainability, multilingual, and report-ready principles—use principles until real customer logos exist.
2. Three-step product story: Capture → Analyze → Understand.
3. Feature mosaic: detection, evidence timeline, provenance, cases, live shield, analytics.
4. Language constellation: Urdu active; planned languages shown as roadmap, not as available.
5. Use-case cards.
6. Security/retention panel.
7. Final CTA and compact footer.

Do not use fabricated testimonials, fake usage counts, or unsupported accuracy percentages.

### 6.2 Sign-in and onboarding

- Split screen: compact brand animation on the left, focused auth card on the right.
- Auth UI supports email, SSO placeholders, passkey placeholder, and “Enter demo workspace.”
- Onboarding: choose use case, team size, default interface language, default analysis language, and retention preference placeholder.
- Skip is always available; onboarding progress persists only in mock storage until backend profiles exist.

### 6.3 Workspace dashboard

- Greeting and command bar: “Analyze a recording.”
- Summary cards: scans this month, needs review, synthetic-likelihood mix, average processing time.
- Recent analyses table/list with verdict, language, duration, model, quality, owner, and time.
- “Needs review” queue for uncertain or low-quality results.
- Coverage/update banner when a new language or model becomes available.
- Quick actions: New analysis, Create case, Batch upload.

Use honest empty states for new accounts and mock-data controls only in development/demo mode.

### 6.4 New analysis

One focused wizard with three input methods:

1. **Upload** — drag/drop and file picker; multi-file mode behind a feature flag.
2. **Record** — microphone permission, input meter, timer, pause/resume, playback, re-record.
3. **Import** — URL/cloud placeholder, disabled with “coming soon” until backend support exists.

The preflight panel shows:

- Filename (redacted in analytics), type, duration, size, channel count, sample rate when available.
- Detected or selected language; Auto-detect is the default.
- Quality guidance: minimum useful duration, speech presence, clipping/noise warnings when the browser can calculate them safely.
- Consent checkbox and retention message.
- Advanced options in a drawer: model mode, priority, case assignment, and reference ID. Keep hidden for basic users.

### 6.5 Processing state

- Preserve the real file waveform and metadata rather than replacing the page with a spinner.
- Stages: Uploading → Queued → Inspecting audio → Detecting language → Analyzing authenticity → Preparing evidence.
- Progress is determinate only when the API supplies real progress. Otherwise animate the current stage without inventing a percentage.
- Support cancel, leave-page behavior, reconnect, offline, retry, and partial failure.
- Screen-reader announcements are throttled to meaningful stage changes.

### 6.6 Analysis result

**Result header:** verdict badge, synthetic likelihood, confidence/calibration note, detected language, model version, and timestamp.

**Primary visualization:** an audio player and waveform with colored evidence bands. Keyboard users can jump between flagged segments, and a text list mirrors all visual segments.

**Evidence layout:**

- Model assessment: likely synthetic, uncertain, or likely authentic.
- Input quality: excellent/good/limited/insufficient, with reasons.
- Signal indicators: only backend-supplied interpretable features; never manufacture explanations from the score.
- Segment table: start/end, risk, reason code, and play button.
- Provenance/metadata: format, encoding, duration, sample rate, hash/reference, and available content credentials later.
- Limitations: unsupported dialect, short duration, heavy compression, music, multiple speakers, noise, or model coverage.

**Actions:** Add to case, assign reviewer, submit feedback, re-run with a newer model, share, and export report. Unavailable actions are feature-flagged or labeled, never dead controls.

### 6.7 History

- Desktop table and mobile cards from the same accessible semantic data.
- Search by safe reference/name fields; filter by date, verdict, quality, language, status, model, owner, and case.
- URL-backed filters for shareable/reload-safe views.
- Saved views later.
- Bulk selection supports add to case, export metadata, re-run, and delete request; destructive actions require explicit confirmation and retention context.

### 6.8 Cases

- Case states: Open, In review, Escalated, Resolved, Archived.
- Header: title, priority, owner, status, external reference, created/updated.
- Tabs: Overview, Evidence, Analyses, Notes, Activity, Reports.
- Activity items distinguish model events from human decisions.
- Reports show a visible “machine-assisted assessment” disclaimer and model details.

### 6.9 Analytics

- Date and workspace filters at the top.
- Charts: analysis volume, verdict mix, uncertainty rate, language mix, quality distribution, processing latency, human-overturn rate, and review backlog.
- Every chart has a table/text alternative and a definition tooltip.
- Avoid accuracy charts until ground-truth methodology exists.

### 6.10 Settings and administration

- Profile and locale.
- Notifications.
- Workspace members and roles.
- Data retention, deletion, and consent copy.
- Integrations/webhooks/API keys shells.
- Audit log.
- Model/language preferences.
- Theme: dark default, system, and a production-ready light token set even if light mode ships later.

---

## 7. Visual design system

### Creative direction

**Mood:** midnight studio, spectral analysis, precision instrument, quiet confidence.  
**Avoid:** generic cyberpunk, neon everywhere, excessive glass, fake 3D globes, constant motion, red/green-only status, and dashboard clutter.

### Color tokens

| Token | Dark value | Use |
|---|---:|---|
| `canvas` | `#05070B` | Main background |
| `canvas-elevated` | `#080D14` | App shell |
| `surface-1` | `#0C121C` | Cards |
| `surface-2` | `#111A27` | Raised/hover surfaces |
| `line` | `#223044` | Borders and dividers |
| `text-primary` | `#F4F7FB` | Main text |
| `text-secondary` | `#9CACBF` | Supporting text |
| `signal-cyan` | `#59F3E5` | Primary brand/action |
| `signal-violet` | `#8B7CFF` | Secondary spectral accent |
| `signal-magenta` | `#F46FC8` | Rare highlight |
| `authentic` | `#55D6A8` | Likely-authentic state |
| `uncertain` | `#F3BF5B` | Uncertain state |
| `synthetic` | `#FF6F7D` | Likely-synthetic state |

All state colors must be paired with an icon, shape, and explicit label. Verify normal and large text against WCAG AA contrast.

### Typography

- Latin UI: **Geist Sans** or a similarly neutral variable sans, self-hosted/pinned.
- Numeric/technical values: **Geist Mono**.
- Urdu UI: **Noto Sans Arabic** for controls and dense application text.
- Urdu editorial/display moments: **Noto Nastaliq Urdu**, used sparingly because of line-height and rendering cost.
- Use tabular numerals for scores, timecodes, file size, and latency.
- Default body 16px; never shrink core UI text below 14px.

### Layout

- Marketing max width: 1280px with generous 24–32px gutters.
- App: 256px desktop sidebar, 64px top command bar, content max 1440px.
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Radius scale: 10px controls, 16px cards, 24px hero surfaces, full pill only for chips.
- Glass is reserved for hero overlays and transient panels; application cards use opaque surfaces for legibility.

### Logo concept

An abstract **A** formed by two mirrored waveform peaks with a small verification cut/notch at the center. It must work as a single-color 16px favicon before any animated or gradient version is considered.

### Core component inventory

- App shell, marketing nav, sidebar, command palette, mobile navigation.
- Button, icon button, link, split button, segmented control.
- Input, search, select, combobox, textarea, checkbox, radio, switch, slider.
- Dialog, drawer, popover, tooltip, dropdown, toast, inline alert.
- Card, stat, badge, avatar, tabs, accordion, breadcrumb.
- Data table, filter bar, pagination, empty/error/skeleton states.
- Upload dropzone, file preflight card, recorder, audio player, waveform, evidence marker.
- Verdict badge, likelihood meter, quality indicator, language badge, model badge.
- Job progress, activity feed, comments, report preview, chart container.
- Consent notice, retention notice, unsupported-language notice, AI limitation callout.

Every component needs hover, active, focus, disabled, loading, error, RTL, reduced-motion, and mobile behavior in Storybook.

---

## 8. Motion and background-animation system

Motion should make signals feel alive while preserving a serious investigative tone.

### Signature animations

1. **Signal Field background** — one fixed canvas/SVG layer of slow spectral curves and sparse particles. Curves react subtly to pointer position on capable desktop devices. It stops when hidden and becomes static under reduced motion.
2. **Hero waveform** — morphs from ambient noise into a clean voice pattern as the page enters; it never implies a real analysis result.
3. **Upload resonance** — the dropzone emits one restrained ripple when a valid file lands.
4. **Analysis scan** — a luminous playhead travels across the real waveform while the current processing stage changes.
5. **Verdict reveal** — waveform settles, evidence bands fade in, then the verdict and supporting values enter in sequence. Total reveal under 700ms.
6. **Shared-layout transitions** — analysis cards expand into detail context without disorienting motion.
7. **Microinteractions** — buttons compress by 1–2%, toggles spring, table rows tint, charts draw once when entering view.

### Motion tokens

| Token | Duration | Purpose |
|---|---:|---|
| `instant` | 90ms | Press feedback |
| `fast` | 140ms | Hover/focus |
| `standard` | 220ms | Menus, tabs, small layout changes |
| `expressive` | 420ms | Drawers, page elements, waveform changes |
| `cinematic` | 650ms | Hero/result reveal only |

Preferred easing: a restrained ease-out for entrances and ease-in for exits; spring motion only for direct manipulation. Route transitions are opacity plus 6–10px movement, not full-screen wipes.

### Implementation rules

- Use Motion for React for presence, layout, gesture, and orchestration.
- Use CSS keyframes for ambient loops and trivial opacity/transform effects.
- Use Canvas 2D or SVG for the Signal Field; do not add a full WebGL/Three.js stack to the first release.
- Animate only `transform` and `opacity` wherever possible.
- One continuous full-screen animation maximum; pause with Page Visibility and Intersection Observer.
- Clamp canvas device-pixel ratio, reduce particles on small/low-power devices, and avoid large animated blur filters.
- Honor `prefers-reduced-motion`; replace motion with instant state changes and a static spectral gradient.
- Animation must never delay form submission, navigation, error recovery, or access to results.

---

## 9. Responsive and international behavior

### Breakpoint intent

- **Mobile (<640px):** single column, bottom/compact navigation, full-screen drawers, sticky analysis action, waveform evidence mirrored in a list.
- **Tablet (640–1023px):** collapsible sidebar, two-column result sections where safe.
- **Desktop (1024–1439px):** persistent sidebar and full result composition.
- **Wide (1440px+):** constrained content width; never stretch tables and prose across the screen.

### Localization strategy

- Initial interface locales: `en` and `ur`.
- Use the Next.js `[locale]` route segment, locale dictionaries, BCP 47 values, and locale-aware number/date formatting.
- Set `lang` and `dir` at the document layout. Urdu renders `dir="rtl"`.
- Use CSS logical properties (`margin-inline`, `padding-inline`, `inset-inline`) rather than left/right assumptions.
- Mirror navigational arrows and layout direction; do not mirror play icons, charts/time, media controls, or waveform chronology.
- Keep interface locale independent from detected/selected audio language.
- Never build sentences by concatenating translated fragments.
- Include long-copy, plural, missing-key, mixed-script, and RTL screenshots in visual regression tests.
- Urdu translations require native review; machine translation is acceptable only as marked draft copy.

### Language coverage UI

Each model language has a status:

- Available
- Beta
- Limited/dialect-specific
- In evaluation
- Planned
- Unsupported

Coverage pages display model version, minimum recommended audio, supported dialects where known, limitations, and last evaluation date. Never show planned languages as active.

---

## 10. Frontend technical architecture

### Recommended stack

- **Framework:** latest stable Next.js App Router, pinned in the lockfile.
- **Runtime/UI:** React and strict TypeScript.
- **Styling:** Tailwind CSS with CSS-variable design tokens.
- **Accessible primitives:** Radix-based primitives or shadcn/ui source components, fully restyled as Awaazera—not an unchanged template.
- **Animation:** Motion for React.
- **Icons:** Lucide with a small custom audio/brand icon set.
- **Async server state:** TanStack Query only where interactive client caching/polling is needed.
- **Forms/contracts:** React Hook Form + Zod.
- **Small client state:** Zustand only for recorder/upload-wizard session state; otherwise component or URL state.
- **Audio visualization:** WaveSurfer.js or a thin Canvas waveform abstraction, wrapped behind an internal `AudioTimeline` interface.
- **Charts:** Recharts behind shared accessible chart components.
- **Localization:** dictionary-based App Router localization or `next-intl`; choose once during foundation and do not mix systems.
- **Mocks:** Mock Service Worker (MSW), shared by browser development, Storybook, and tests.
- **Testing:** Vitest, React Testing Library, Playwright, axe, and Storybook visual checks.
- **Quality:** ESLint, Prettier, strict TypeScript, commit hooks, and CI quality gates.

Use latest stable versions when scaffolding, then commit the lockfile and upgrade intentionally. Avoid pinning speculative version numbers in this plan.

### Rendering model

- Marketing pages and documentation: Server Components by default, statically rendered where appropriate.
- Workspace shell and initial data: Server Components where authentication/data will later be available server-side.
- Recorder, uploader, waveform, filters, dialogs, live progress, and charts: isolated Client Components.
- Keep `use client` boundaries low in the tree so the entire dashboard does not become a client bundle.
- Lazy-load recorder, waveform engine, charts, command palette, and heavy report preview code.

### State ownership

| State | Owner |
|---|---|
| Route, search, pagination, filters | URL search params |
| API resources and job polling | TanStack Query/client adapter |
| Upload/record wizard draft | Local state or small Zustand slice |
| Form input and validation | React Hook Form + Zod |
| Theme/locale preference | Cookie plus server layout |
| Toast/dialog/transient UI | Component/context |
| Authentication/session | Future server/provider adapter |
| Feature availability | Typed feature-flag adapter |

### Proposed source structure

```text
src/
  app/
    [locale]/
      (marketing)/
      (auth)/
      app/
        analyses/[id]/
        analyze/new/
        history/
        cases/
        analytics/
        settings/
      layout.tsx
    ops/
  components/
    ui/
    brand/
    audio/
    analysis/
    cases/
    charts/
    layout/
  features/
    auth/
    upload/
    recorder/
    analyses/
    cases/
    reports/
    workspace/
  lib/
    api/
      contracts/
      client.ts
      http-client.ts
      mock-client.ts
      errors.ts
    analytics/
    audio/
    auth/
    flags/
    i18n/
    security/
  mocks/
    handlers/
    fixtures/
    browser.ts
    server.ts
  styles/
    globals.css
    tokens.css
  test/
messages/
  en.json
  ur.json
public/
  brand/
  demo-audio/
tests/
  e2e/
  visual/
```

Feature folders own business components and hooks. `components/ui` contains only reusable primitives. Pages compose features but do not call `fetch` directly.

---

## 11. Backend-independent contract design

### Adapter rule

All pages consume a typed `AwaazeraClient` interface. Development injects `MockAwaazeraClient`; future production injects `HttpAwaazeraClient`. Components never know which client is active.

```ts
interface AwaazeraClient {
  createUpload(input: CreateUploadInput): Promise<UploadSession>;
  completeUpload(input: CompleteUploadInput): Promise<AudioAsset>;
  createAnalysis(input: CreateAnalysisInput): Promise<AnalysisJob>;
  getAnalysis(id: string): Promise<Analysis>;
  listAnalyses(query: AnalysisQuery): Promise<Page<AnalysisSummary>>;
  cancelAnalysis(id: string): Promise<void>;
  submitFeedback(id: string, input: FeedbackInput): Promise<void>;
}
```

### Core frontend types

```ts
type AnalysisStatus =
  | "draft"
  | "uploading"
  | "queued"
  | "preprocessing"
  | "analyzing"
  | "completed"
  | "failed"
  | "canceled";

type Verdict =
  | "likely_authentic"
  | "uncertain"
  | "likely_synthetic";

interface AnalysisResult {
  verdict: Verdict;
  syntheticLikelihood: number | null; // 0..1; null when not calibrated/available
  calibrationLabel?: string;
  quality: {
    grade: "excellent" | "good" | "limited" | "insufficient";
    reasons: QualityReason[];
  };
  language: {
    code: string;
    label: string;
    confidence?: number;
    support: "available" | "beta" | "limited" | "unsupported";
  };
  model: {
    id: string;
    version: string;
    evaluatedAt?: string;
  };
  segments: EvidenceSegment[];
  limitations: Limitation[];
}
```

The likelihood is not automatically the same as calibrated confidence. The backend contract must define the meaning of every numeric field before the UI labels it.

### Asynchronous upload and analysis contract

1. `POST /uploads` returns asset ID, short-lived presigned URL, accepted headers, limits, and expiry.
2. Browser uploads directly to storage with progress and cancellation.
3. `POST /uploads/{id}/complete` confirms checksum/metadata.
4. `POST /analyses` returns job and analysis IDs.
5. UI receives progress through polling initially, SSE later.
6. Completed analysis returns immutable result plus model version.

For recordings, the frontend creates a local `Blob`, previews it, then follows the same upload contract. Object URLs are revoked when no longer needed.

### Error envelope

The frontend expects a stable error shape with `code`, safe `message`, `fieldErrors`, `requestId`, `retryable`, and optional `retryAfter`. Map codes into localized user copy; never display raw server traces.

Required error scenarios:

- Unsupported format/language.
- File too large/short/long or audio unreadable.
- No speech/multiple speakers/quality too low.
- Upload expired/interrupted/checksum mismatch.
- Analysis queue busy/rate limited/model unavailable.
- Job failed/canceled/not found/permission denied.
- Session expired/network offline/server unreachable.

### Mock strategy

Provide deterministic fixtures for:

- Urdu likely-authentic result.
- Urdu likely-synthetic result with two evidence segments.
- Uncertain/low-quality result.
- Unsupported planned language.
- Upload progress, long queue, cancel, retry, offline, expired session, server error.
- Empty/new workspace, populated analyst workspace, and restricted viewer workspace.

MSW handlers simulate realistic stage timing, latency, and failures. A development-only scenario switcher changes persona, role, feature flags, and response state. Production builds exclude the switcher and demo debug controls.

---

## 12. Audio UX implementation details

### Supported input policy for the UI

Start with WAV, MP3, M4A/AAC, FLAC, OGG, and WebM if the backend can decode them. Display limits from backend-provided configuration; do not hardcode a marketing limit separately from validation.

### Browser responsibilities

- File selection, drag/drop, local preview, and best-effort metadata extraction.
- Microphone recording with `MediaRecorder` where supported.
- Input-level visualization through Web Audio APIs.
- Waveform peaks generated locally for immediate display or returned by the backend for large files.
- Basic warnings for silent/clipped audio only if implemented and tested; they are preflight hints, not forensic judgments.
- Feature detection and a clear fallback when recording or codec support is unavailable.

### Waveform accessibility

- Provide play/pause, skip, playback speed, time display, and volume as normal controls outside the canvas.
- Evidence segments are also an ordered text list with buttons such as “Play 00:12–00:18.”
- Canvas/SVG itself is not the only source of information.
- Focus never becomes trapped in dozens of visual samples.

### Live audio later

Use `AudioWorklet` only for low-latency local metering/chunk preparation after performance testing and HTTPS deployment. Actual authenticity inference stays on the backend. The live UI must show connection status, analysis latency, missing windows, and that a rolling signal is provisional.

---

## 13. Privacy, safety, and security requirements

This product handles potentially biometric and highly sensitive audio. The interface must make data handling visible, while the backend remains responsible for enforcement.

### Required frontend controls

- Explicit permission/consent confirmation before upload or microphone capture.
- Retention disclosure before analysis and a visible deletion request action afterward.
- Microphone indicator and immediate stop control.
- No filenames, transcripts, audio URLs, raw scores tied to identities, or recording content in analytics/telemetry.
- No access tokens in `localStorage`; prefer secure, HTTP-only, same-site cookies when authentication is integrated.
- Clear cached query/audio state on sign-out and tenant switch.
- Revoke local object URLs and stop all media tracks on unmount/end.
- Avoid `dangerouslySetInnerHTML`; sanitize any future rich report content.
- Strict CSP, frame-ancestors policy, referrer policy, permissions policy, secure headers, and dependency review before deployment.
- Upload accept filters are convenience only; server-side signature/type validation remains mandatory.
- Sensitive share links require expiry, revocation, access logging, and optional authentication later.

### Responsible-result language

- “This assessment is probabilistic and should be reviewed with context.”
- “Low-quality or out-of-distribution audio may produce unreliable results.”
- Do not recommend punitive actions solely from a model result.
- Human feedback and case disposition must remain visually distinct from model output.

### Legal/product work before public launch

- Privacy policy, terms, consent basis, biometric/audio data classification, jurisdictional review, retention schedule, data-processing agreements, deletion/export process, and abuse-reporting route.
- Trademark/domain review for Awaazera.
- Document model evaluation methodology, supported conditions, and limitations.

---

## 14. Accessibility requirements

Target WCAG 2.2 AA.

- Full keyboard access and visible `:focus-visible` treatment.
- Semantic headings, landmarks, labels, tables, and dialog focus management.
- Verdict communicated through text/icon/shape in addition to color.
- Minimum 44×44px coarse-pointer targets for primary mobile actions.
- Reduced-motion mode removes parallax, looping particles, waveform scan, count-ups, and large transitions.
- Screen-reader live regions announce upload completion, stage changes, error, cancel, and result once—not every percent.
- Audio has timecode and evidence alternatives; future transcripts should be available when backend support exists.
- Charts include table/text summaries.
- English LTR, Urdu RTL, browser zoom at 200%, high-contrast mode, and keyboard-only journeys are release gates.
- Do not use Nastaliq for dense controls or tiny labels.

---

## 15. Performance and reliability budgets

### User-experience targets

- Core Web Vitals at the 75th percentile: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1.
- Marketing initial JavaScript target: ≤ 170KB gzip excluding consented analytics.
- Workspace route initial JavaScript target: ≤ 250KB gzip; waveform/charts load on demand.
- No layout shift from fonts, waveform, skeletons, or async verdict content.
- Maintain responsive playback and input while animation is active.
- Background animation pauses on hidden tabs and becomes static on low capability/reduced motion.
- Upload resumes/retries where the backend/storage protocol permits; leaving a page does not silently lose a running analysis.

### Reliability states

Every data surface implements loading, empty, partial, stale, offline, permission denied, not found, rate limited, retryable error, non-retryable error, and success. Use error boundaries at route and feature level. Preserve safe form/upload state after recoverable errors.

---

## 16. Analytics and observability plan

Create provider-neutral wrappers so the analytics/error vendor can change later.

### Product events

- `landing_cta_clicked`
- `analysis_input_selected`
- `recording_started` / `recording_stopped`
- `preflight_failed`
- `consent_confirmed`
- `upload_started` / `upload_completed` / `upload_failed`
- `analysis_created` / `analysis_completed` / `analysis_failed` / `analysis_canceled`
- `result_segment_played`
- `result_feedback_submitted`
- `report_exported`
- `case_created` / `analysis_added_to_case`
- `locale_changed`
- `reduced_motion_detected`

Properties may include safe enum values, size/duration buckets, supported-language code, generic error code, browser capability, and timing. Never include file names, raw URLs, transcripts, audio, email, free-text notes, or share tokens.

### Operational telemetry

- Web Vitals and route performance.
- Client errors with redaction and release version.
- Upload and processing-stage timing.
- API failure code/rate and reconnect behavior.
- Animation long tasks and waveform initialization time in sampled performance sessions.

Define a telemetry schema and privacy review before adding a vendor SDK.

---

## 17. Testing strategy and quality gates

### Unit tests

- Verdict/quality display mapping.
- Contract parsing and error mapping.
- Date, duration, likelihood, and locale formatting.
- Feature flags, permissions, retention copy selection.
- Upload validation and recorder state machine.

### Component/interaction tests

- Dropzone keyboard/pointer behavior.
- Recorder permission allowed/denied/revoked.
- Processing stage and reconnect states.
- Result evidence navigation and audio controls.
- Data filters, bulk selection, dialog focus, toasts.
- English and Urdu/RTL render behavior.

### End-to-end tests

1. Landing → demo scan → result.
2. Sign in/demo → upload → consent → processing → result → feedback.
3. Record → preview → re-record → submit.
4. Offline/interrupted upload → recovery.
5. Failed analysis → retry.
6. History filters persist in URL.
7. Add analysis to case → note → report preview.
8. Viewer cannot see/use analyst actions.
9. English ↔ Urdu maintains route/context and correct direction.
10. Reduced-motion experience contains no continuous motion.

### Visual/a11y/performance tests

- Storybook snapshots at mobile/tablet/desktop and LTR/RTL.
- Playwright screenshots for high-value flows.
- Automated axe checks plus manual keyboard and screen-reader smoke tests.
- Lighthouse CI budgets for marketing and analysis result pages.
- Bundle-size checks and no-unexpected-client-component review.
- Test Chrome, Firefox, Safari, Edge, iOS Safari, and Android Chrome for upload/playback; explicitly document codec differences.

### CI gates

Pull requests must pass formatting, lint, TypeScript, unit/component tests, critical e2e smoke tests, accessibility checks, and production build. Main/release additionally runs the full browser matrix, visual regression, and Lighthouse budget.

---

## 18. Delivery roadmap

Estimates assume two frontend engineers with part-time product design/QA. A strong solo developer should expect roughly 1.7–2× the calendar time. Backend integration is not included.

### Phase 0 — product and foundation (Week 1)

- Confirm name as working brand, personas, vocabulary, supported formats, result semantics, and backend assumptions.
- Create Next.js project, strict TypeScript, formatting/linting, CI, Storybook, test harness, and route groups.
- Implement design tokens, fonts, icons, base primitives, dark theme, locale routing, and RTL foundation.
- Define typed contracts, mock fixtures, mock client, feature flags, and developer scenario panel.

**Exit:** app boots in English/Urdu, primitives and mocks work in Storybook/tests, CI is green.

### Phase 1 — brand and marketing (Week 2)

- Wordmark/logo starter assets.
- Marketing shell, landing page, Signal Field, hero detector demo, Product, Coverage, Security, and responsive footer.
- Metadata, sitemap, social cards, reduced motion, performance baseline.

**Exit:** polished deployable marketing experience with no fabricated claims and strong mobile behavior.

### Phase 2 — workspace and analysis input (Weeks 3–4)

- Auth/demo and onboarding shells.
- Workspace navigation, dashboard, settings skeleton.
- Upload dropzone, local audio preview, validation, preflight, consent.
- Recorder with permission/error states and local playback.

**Exit:** all supported mock input journeys reach a created analysis job.

### Phase 3 — processing and results (Weeks 5–6)

- Asynchronous stage UI, polling adapter, cancellation/reconnect/retry.
- Audio timeline, evidence bands/list, verdict, quality, metadata, limitations.
- Feedback, export preview, share/add-to-case feature gates.
- Full state matrix and result-reveal animation.

**Exit:** end-to-end detector flow is production-quality against mocks and contract-ready.

### Phase 4 — investigation workflow (Weeks 7–8)

- History, filters, pagination, bulk actions.
- Cases, evidence, notes, activity, assignment, and report preview.
- Analytics dashboard and accessible chart framework.

**Exit:** analyst can organize and review a realistic mock workload.

### Phase 5 — hardening and frontend MVP release (Weeks 9–10)

- Native Urdu copy review and complete RTL QA.
- Browser/codec matrix, accessibility audit, performance/bundle tuning.
- Security headers/config plan, analytics redaction, error telemetry adapter.
- E2E/visual coverage, contributor documentation, backend integration runbook.

**Exit:** frontend MVP meets the definition of done and is ready for API integration.

### Phase 6 — beta/enterprise modules (Weeks 11–14, optional)

- Batch scanning, team/roles, saved views, audit log, report templates.
- Integrations/API key/webhook shells.
- Internal operations console.
- Light theme and additional UI locales if needed.

### Phase 7 — backend integration (separate project)

- Generate/validate types from the final OpenAPI schema.
- Implement production HTTP client, auth/session adapter, presigned uploads, job progress, and server-side authorization UX.
- Contract tests against staging, privacy/security review, telemetry validation, and load/failure testing.
- Remove demo-only pathways from production bundles.

### Phase 8 — advanced audio (future)

- Live Shield with WebSocket/backend support.
- Voice comparison only with a defined lawful/consensual use case.
- Provenance/content-credential verification.
- Transcription/translation, diarization, watermark detection, and multi-modal expansion as independently evaluated tools.

---

## 19. Prioritized implementation backlog

### P0 — required for frontend MVP

- `FND-01` Scaffold Next.js App Router, TypeScript, lint/build/test CI.
- `FND-02` Tokens, typography, themes, locale routing, RTL utilities.
- `FND-03` Core accessible components and Storybook.
- `FND-04` Client contracts, mock adapter, MSW, fixtures, flags.
- `BRD-01` Wordmark/icon starter and brand usage rules.
- `MKT-01` Landing page and responsive marketing shell.
- `MOT-01` Signal Field and reduced-motion fallback.
- `APP-01` Auth/demo/onboarding and protected-layout shell.
- `APP-02` Dashboard and app navigation.
- `AUD-01` Upload, validation, metadata, consent, preview.
- `AUD-02` Microphone recorder and browser fallbacks.
- `ANL-01` Job status state machine and progress/recovery.
- `ANL-02` Result summary, likelihood, quality, limitations.
- `ANL-03` Accessible waveform and evidence segments.
- `ANL-04` Feedback and report preview.
- `HIS-01` History, URL filters, pagination, mobile view.
- `I18N-01` English/Urdu copy and complete RTL QA.
- `QA-01` Unit/component/e2e/a11y/visual/performance gates.
- `SEC-01` Consent, retention, telemetry redaction, secure config checklist.

### P1 — beta

- `CAS-01` Case CRUD mock flows, assignments, activity, notes.
- `CAS-02` Evidence management and report composition.
- `BAT-01` Batch upload/preflight/results.
- `ANA-01` Accessible analytics.
- `TEAM-01` Members/roles/invites shell.
- `SET-01` Workspace/data/notification settings.
- `AUDIT-01` Audit-log interface.

### P2 — after backend capabilities exist

- `LIVE-01` Live capture/streaming and rolling result windows.
- `INT-01` API keys, webhooks, contact-center/cloud integrations.
- `PROV-01` Provenance and content credentials.
- `CMP-01` Authorized voice comparison.
- `OPS-01` Internal model/job/feedback operations.
- `BILL-01` Pricing, plans, usage, invoices.

---

## 20. Definition of done

A feature is complete only when:

- Its happy path, empty, loading, offline, error, permission, and retry states exist.
- It works at 360px mobile width through wide desktop.
- It works in English LTR and Urdu RTL with correct locale formatting.
- Keyboard, focus, screen-reader naming, contrast, and reduced motion are verified.
- Business components use the typed client adapter and do not fetch directly.
- No sensitive content enters logs or analytics.
- Unit/component tests and relevant e2e flows pass.
- Storybook stories cover important variants.
- Animation stays within performance rules and never blocks an action.
- Copy does not overclaim accuracy, support, availability, or legal certainty.
- Design, product, engineering, accessibility, and QA acceptance criteria are recorded.

Frontend MVP is ready for backend integration when all P0 items are complete, the result contract has been reviewed by the ML/backend team, MSW scenarios cover the agreed API state matrix, and changing from mock to HTTP requires no screen-level rewrite.

---

## 21. Product success measures

Measure these after real integration without collecting sensitive recording content:

- Time from landing to a valid submitted scan.
- Upload/record preflight failure rate and recovery rate.
- Analysis completion and retry success rate.
- Percentage of results where evidence/limitations are opened.
- User-rated result clarity, separate from agreement with the verdict.
- Uncertain-result review/escalation rate.
- Human disposition versus model output, only where ground-truth governance exists.
- Case resolution time and review backlog for team users.
- Mobile versus desktop completion, performance, and error rate.
- English versus Urdu journey completion and layout defects.

Do not optimize for making the model appear more certain. Optimize for successful, informed decisions.

---

## 22. Open decisions before implementation begins

1. What exact fields and calibration meaning does the current Urdu model return?
2. What minimum/maximum duration, size, codecs, channels, and sample rates are supported?
3. Will the model return time-based evidence or only a file-level score at first?
4. What does “confidence” mean statistically, and is it calibrated across languages?
5. What languages/dialects follow Urdu, and which status labels are accurate today?
6. Is anonymous scanning permitted, and what are its rate/retention rules?
7. What is the default raw-audio/result retention policy?
8. Are transcripts stored, returned transiently, or not produced?
9. Which regions and compliance regimes are in initial launch scope?
10. Which personas are MVP: individual checker, analyst team, or both?
11. Is report export required for MVP, and what fields/disclaimers must it contain?
12. Does the commercial model use per-minute usage, seats, credits, or enterprise contracts?

None of these blocks the visual prototype because the mock contracts isolate the assumptions, but questions 1–7 must be resolved before a real public analysis flow ships.

---

## 23. Reference basis

- Next.js App Router and Server/Client Component guidance: <https://nextjs.org/docs/app>
- Next.js internationalization guidance: <https://nextjs.org/docs/app/guides/internationalization>
- React Server Components: <https://react.dev/reference/rsc/server-components>
- Motion for React and presence/reduced-motion patterns: <https://motion.dev/docs/react>
- Web Audio and off-main-thread AudioWorklet behavior: <https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API>
- Core Web Vitals thresholds: <https://web.dev/articles/defining-core-web-vitals-thresholds>
- Playwright testing guidance: <https://playwright.dev/docs/next/writing-tests>

---

## 24. Recommended first build slice

The fastest slice that proves both the brand and the architecture is:

1. Create the design tokens, fonts, button/card/input primitives, English/Urdu layouts, and mock client.
2. Build the landing hero with Signal Field, waveform, and an honest demo result.
3. Build `/app/analyze/new` with upload, record, preflight, consent, and six mock outcomes.
4. Build `/app/analyses/[id]` with stage progression and the complete result/evidence experience.
5. Validate mobile, Urdu RTL, keyboard, reduced motion, bundle size, and all failure states.

This vertical slice produces the signature experience early. Dashboard, history, cases, and enterprise tooling can then reuse its contracts and components without redefining the product.
