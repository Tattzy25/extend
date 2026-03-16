import { NextRequest, NextResponse } from "next/server"

/**
 * Placeholder like/favorite endpoint.
 * Replace this with your actual like destination (e.g. DB save, external API).
 * Request body: { url: string; index?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, index } = body ?? {}
    // TODO: Add your like logic here (e.g. persist to DB, call external service)
    return NextResponse.json({ ok: true, url, index })
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
