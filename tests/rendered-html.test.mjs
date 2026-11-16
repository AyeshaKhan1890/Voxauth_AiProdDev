import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const fromRoot = (path) => new URL(`../${path}`, import.meta.url);

test("ships the complete Awaazera marketing and studio surfaces", async () => {
  const [page, layout, marketing, studio] = await Promise.all([
    readFile(fromRoot("app/page.tsx"), "utf8"),
    readFile(fromRoot("app/layout.tsx"), "utf8"),
    readFile(fromRoot("components/marketing-page.tsx"), "utf8"),
    readFile(fromRoot("components/studio-page.tsx"), "utf8"),
  ]);

  assert.match(page, /<MarketingPage \/>/);
  assert.match(layout, /Awaazera/);
  assert.match(layout, /\/og\.png/);
  assert.match(marketing, /Hear what/);
  assert.match(marketing, /VOICE AUTHENTICITY LAB/);
  assert.match(marketing, /Demo output/);
  assert.match(studio, /Good morning, Nawaal/);
  assert.match(studio, /Latest analyses/);
  assert.match(studio, /result is probabilistic/);
});

test("includes the realtime 3D scene, theme system, and motion safeguards", async () => {
  const [scene, themes, marketing, studio, styles] = await Promise.all([
    readFile(fromRoot("components/immersive-scene.tsx"), "utf8"),
    readFile(fromRoot("components/theme-controller.tsx"), "utf8"),
    readFile(fromRoot("components/marketing-page.tsx"), "utf8"),
    readFile(fromRoot("components/studio-page.tsx"), "utf8"),
    readFile(fromRoot("app/globals.css"), "utf8"),
  ]);

  assert.match(scene, /<Canvas/);
  assert.match(scene, /icosahedronGeometry/);
  assert.match(scene, /ParticleWavefield/);
  assert.match(scene, /useReducedMotion/);
  assert.match(themes, /Spectral/);
  assert.match(themes, /Ember/);
  assert.match(themes, /Aurora/);
  assert.match(marketing, /ImmersiveSignalScene/);
  assert.match(studio, /ImmersiveSignalScene/);
  assert.match(styles, /prefers-reduced-motion:\s*reduce/);
});

test("uses standard local Next.js without GPT or Cloudflare hosting wiring", async () => {
  const packageJson = JSON.parse(await readFile(fromRoot("package.json"), "utf8"));

  assert.equal(packageJson.scripts.dev, "next dev");
  assert.equal(packageJson.scripts.build, "next build");
  assert.equal(packageJson.scripts.start, "next start");
  assert.ok(packageJson.dependencies.next);
  assert.equal(packageJson.devDependencies?.vinext, undefined);
  assert.equal(packageJson.devDependencies?.wrangler, undefined);
  assert.equal(packageJson.devDependencies?.["@cloudflare/vite-plugin"], undefined);

  await Promise.all([
    assert.rejects(access(fromRoot(".openai/hosting.json"))),
    assert.rejects(access(fromRoot("vite.config.ts"))),
    assert.rejects(access(fromRoot("worker/index.ts"))),
    assert.rejects(access(fromRoot("app/chatgpt-auth.ts"))),
  ]);
});

test("connects the studio to the windowed AASIST analysis API", async () => {
  const [studio, client, proxy, healthProxy, backend] = await Promise.all([
    readFile(fromRoot("components/studio-page.tsx"), "utf8"),
    readFile(fromRoot("lib/analysis-api.ts"), "utf8"),
    readFile(fromRoot("app/api/analyze/route.ts"), "utf8"),
    readFile(fromRoot("app/api/health/route.ts"), "utf8"),
    readFile(fromRoot("backend/app/inference.py"), "utf8"),
  ]);

  assert.match(studio, /analyzeAudio\(file, "ur"/);
  assert.match(studio, /AASIST-L scored this overlapping excerpt/);
  assert.doesNotMatch(studio, /Secure mock analysis/);
  assert.match(client, /fetch\("\/api\/analyze"/);
  assert.match(proxy, /AASIST_API_URL/);
  assert.match(proxy, /\/v1\/analyze/);
  assert.match(healthProxy, /\/health/);
  assert.match(studio, /Urdu AASIST unavailable/);
  assert.match(backend, /build_window_starts/);
  assert.match(backend, /probabilities\[:, 0\]/);
});
