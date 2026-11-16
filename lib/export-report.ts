import type { AnalysisResponse } from "./analysis-api";

const VERDICT_LABELS = {
  synthetic: "Likely synthetic",
  authentic: "Likely authentic",
  uncertain: "Uncertain",
} as const;

function esc(value: unknown): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmt(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds - mins * 60;
  return `${String(mins).padStart(2, "0")}:${secs.toFixed(1).padStart(4, "0")}`;
}

export function exportJson(result: AnalysisResponse) {
  const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `voxauth-${result.analysis_id}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function buildReportHtml(r: AnalysisResponse): string {
  const score = Math.round(r.synthetic_probability * 100);
  const rows = r.windows
    .map(
      (w) => `<tr${w.flagged ? ' class="flag"' : ""}>
        <td>${w.index + 1}</td>
        <td>${fmt(w.start_seconds)} – ${fmt(w.end_seconds)}</td>
        <td>${Math.round(w.synthetic_probability * 100)}%</td>
        <td>${w.flagged ? "Above threshold" : "–"}</td>
      </tr>`,
    )
    .join("");
  const list = (items: string[]) =>
    items.length ? `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : "<p>None recorded.</p>";

  return `<!doctype html><html><head><meta charset="utf-8">
<title>Voxauth report ${esc(r.analysis_id)}</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:32px;line-height:1.45}
  h1{margin:0 0 4px;font-size:24px} h2{font-size:15px;margin:26px 0 8px;border-bottom:1px solid #ccc;padding-bottom:4px}
  .muted{color:#666;font-size:12px}
  .score{display:flex;gap:20px;align-items:center;margin:16px 0}
  .score b{font-size:44px}
  table{border-collapse:collapse;width:100%;font-size:12px}
  td,th{border:1px solid #ccc;padding:5px 8px;text-align:left}
  tr.flag td{background:#fde8e8}
  dl{display:grid;grid-template-columns:200px 1fr;gap:4px 12px;font-size:13px;margin:0}
  dt{color:#666} dd{margin:0}
  .note{font-size:12px;background:#f4f4f4;padding:10px;border-radius:6px}
</style></head><body>
<h1>Voxauth analysis report</h1>
<div class="muted">${esc(r.analysis_id)} · generated ${esc(new Date().toLocaleString())}</div>

<div class="score"><b>${score}%</b>
  <div><strong>${VERDICT_LABELS[r.verdict]}</strong><br>
  <span class="muted">Recording-level synthetic score from ${esc(r.model.name)}</span></div></div>
<div class="note">This score is the model's synthetic-class probability for the whole recording. It is not the
percentage of the audio that is fake, and it is not a calibrated confidence. Treat it as one piece of evidence.</div>

<h2>File</h2>
<dl>
  <dt>Filename</dt><dd>${esc(r.audio.filename)}</dd>
  <dt>Duration</dt><dd>${fmt(r.audio.duration_seconds)}</dd>
  <dt>Sample rate</dt><dd>${(r.audio.sample_rate_hz / 1000).toFixed(1)} kHz</dd>
  <dt>Channels</dt><dd>${r.audio.channels}</dd>
  <dt>Analysis language</dt><dd>${r.analysis_language === "ar" ? "Arabic" : "Urdu"}</dd>
  <dt>Input quality</dt><dd>${esc(r.quality.rating)}</dd>
  <dt>Processing time</dt><dd>${(r.processing_ms / 1000).toFixed(2)} s</dd>
</dl>

<h2>Model</h2>
<dl>
  <dt>Name / version</dt><dd>${esc(r.model.name)} · ${esc(r.model.version)}</dd>
  <dt>Checkpoint SHA-256</dt><dd>${esc(r.model.checkpoint_sha256)}</dd>
  <dt>Window / hop</dt><dd>${r.model.window_seconds.toFixed(2)} s / ${r.model.hop_seconds.toFixed(2)} s</dd>
  <dt>Threshold</dt><dd>${r.model.threshold} (uncertainty margin ${r.model.uncertainty_margin})</dd>
</dl>

<h2>Window scores</h2>
<table><thead><tr><th>#</th><th>Time</th><th>Synthetic</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>

<h2>Input quality warnings</h2>${list(r.quality.warnings)}
<h2>Limitations</h2>${list(r.limitations)}
</body></html>`;
}

export function printReport(result: AnalysisResponse) {
  // A hidden iframe avoids popup blockers; the user picks "Save as PDF" in the print dialog.
  const frame = document.createElement("iframe");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  const win = frame.contentWindow;
  if (!doc || !win) {
    frame.remove();
    return;
  }
  doc.open();
  doc.write(buildReportHtml(result));
  doc.close();
  win.onafterprint = () => frame.remove();
  window.setTimeout(() => {
    win.focus();
    win.print();
  }, 250);
  window.setTimeout(() => frame.remove(), 120_000);
}