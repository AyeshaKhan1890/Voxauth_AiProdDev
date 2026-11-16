import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const baseUrl = (process.env.AASIST_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
  const { search } = new URL(request.url);
  try {
    const upstream = await fetch(`${baseUrl}/v1/stats${search}`, { cache: "no-store" });
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: { "content-type": "application/json" },
    });
  } catch {
    return NextResponse.json({ detail: "The AASIST service is unavailable." }, { status: 503 });
  }
}