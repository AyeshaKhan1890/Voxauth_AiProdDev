import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

export async function POST(request: Request) {
  let incoming: FormData;
  try {
    incoming = await request.formData();
  } catch {
    return NextResponse.json({ detail: "Expected a multipart audio upload." }, { status: 400 });
  }

  const audio = incoming.get("audio");
if (!(audio instanceof File)) {
  return NextResponse.json({ detail: "An audio file is required." }, { status: 400 });
}
if (audio.size > MAX_UPLOAD_BYTES) {
  return NextResponse.json({ detail: "Audio file is larger than the 50 MB limit." }, { status: 413 });
}

const language = incoming.get("language");
if (typeof language !== "string" || !language.trim()) {
  return NextResponse.json({ detail: "An analysis language is required." }, { status: 400 });
}

const upstreamBody = new FormData();
upstreamBody.append("audio", audio, audio.name);
upstreamBody.append("language", language);

  const baseUrl = (process.env.AASIST_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
  try {
    const upstream = await fetch(`${baseUrl}/v1/analyze`, {
      method: "POST",
      body: upstreamBody,
      cache: "no-store",
      signal: AbortSignal.timeout(115_000),
    });
    const responseBody = await upstream.text();
    return new Response(responseBody, {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") || "application/json" },
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    return NextResponse.json(
      {
        detail: timedOut
          ? "The AASIST service timed out while processing this recording."
          : "The AASIST service is unavailable. Start the Python API and try again.",
      },
      { status: 503 },
    );
  }
}

