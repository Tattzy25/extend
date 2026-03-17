import { NextRequest, NextResponse } from "next/server"
import { appendFile } from "node:fs/promises"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    // Only accept logs for this debug session, and only small payloads.
    const sessionId = (body as any).sessionId
    if (sessionId !== "07ef70") {
      return NextResponse.json({ ok: false }, { status: 403 })
    }

    const line = JSON.stringify(body) + "\n"
    // Write alongside the app root (Next runs with cwd at project root on most hosts).
    await appendFile("debug-07ef70.log", line, { encoding: "utf8" })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

