import { NextRequest, NextResponse } from "next/server"
import { appendFile } from "node:fs/promises"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== "object") return NextResponse.json({ ok: false }, { status: 400 })
    const sessionId = (body as any).sessionId
    if (sessionId !== "07ef70") return NextResponse.json({ ok: false }, { status: 403 })

    await appendFile("debug-07ef70.log", JSON.stringify(body) + "\n", { encoding: "utf8" })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

