import { NextRequest, NextResponse } from "next/server"

const GENERATE_URL = "https://TaTTTy--61d298c4216911f1bea342dde27851f2.web.val.run/generate"
const RESULT_URL = "https://TaTTTy--61d298c4216911f1bea342dde27851f2.web.val.run/result"
const MAX_RETRIES = 3
const POLL_INTERVAL_MS = 3000
const MAX_POLL_ATTEMPTS = 60

async function pollResult(predictionId: string): Promise<{ status: string; images?: string[] }> {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    const res = await fetch(`${RESULT_URL}?id=${predictionId}`)
    if (!res.ok) throw new Error(`Poll failed: ${res.status}`)
    const data = await res.json()
    if (data?.status === "succeeded") {
      return { status: "succeeded", images: Array.isArray(data.images) ? data.images : [] }
    }
    if (data?.status === "failed") {
      return { status: "failed" }
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
  }
  return { status: "timeout" }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const prompt = body?.prompt?.trim()
    const style = body?.style ?? "Blackwork"
    const color = body?.color ?? "Black & White"

    if (!prompt) {
      return NextResponse.json({ success: false, error: "Please enter a prompt." }, { status: 400 })
    }

    if (prompt.length < 20) {
      return NextResponse.json({ success: false, error: "Please enter at least 20 characters." }, { status: 400 })
    }

    let predictionId: string | undefined
    let lastErr: unknown

    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        const res = await fetch(GENERATE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ style, color, prompt }),
        })
        if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`))
        const json = await res.json()
        predictionId = json?.prediction_id
        if (!predictionId) throw new Error("No prediction_id in response")
        break
      } catch (e) {
        lastErr = e
      }
    }

    if (!predictionId) {
      return NextResponse.json(
        { success: false, error: "Please check your network connection." },
        { status: 502 }
      )
    }

    const result = await pollResult(predictionId)

    if (result.status === "failed") {
      return NextResponse.json(
        { success: false, error: "Generation failed. Please try again." },
        { status: 500 }
      )
    }

    if (result.status === "timeout") {
      return NextResponse.json(
        { success: false, error: "Server is taking longer than expected. Please try again." },
        { status: 504 }
      )
    }

    return NextResponse.json({ success: true, output: result.images ?? [] })
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error ? err.message : "Server error. Please try again later.",
      },
      { status: 500 }
    )
  }
}
