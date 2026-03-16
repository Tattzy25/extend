import { NextRequest, NextResponse } from "next/server"
import { buildDifyPrompt } from "@/lib/buildPrompt"

const DIFY_BASE = "https://api.dify.ai/v1"
const PROMPT_KEY = process.env.DIFY_PROMPT_INPUT ?? "prompt"
const OUTPUT_PATHS = (process.env.DIFY_OUTPUT_PATHS ?? "outputs.images,outputs.result,outputs").split(",")

function extractImageUrls(outputs: unknown): string[] {
  if (!outputs || typeof outputs !== "object") return []

  const tryPath = (path: string) => {
    const keys = path.split(".")
    let cur: unknown = outputs
    for (const k of keys) {
      if (cur == null) return null
      cur = (cur as Record<string, unknown>)[k]
    }
    return cur
  }

  for (const path of OUTPUT_PATHS) {
    const val = tryPath(path.trim())
    if (!val) continue
    if (Array.isArray(val)) {
      const urls = val
        .map((item) => {
          if (typeof item === "string") return item
          if (item && typeof item === "object" && "url" in item)
            return String((item as { url: unknown }).url)
          return null
        })
        .filter((u): u is string => !!u && u.startsWith("http"))
      if (urls.length > 0) return urls
    }
    if (typeof val === "string" && val.startsWith("http")) return [val]
  }
  return []
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.DIFY_API_KEY
  if (!apiKey) {
    return NextResponse.json({ success: false, error: "DIFY_API_KEY not configured" }, { status: 500 })
  }

  let prompt: string
  let user: string
  let traceId: string

  const contentType = request.headers.get("content-type") ?? ""
  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => ({}))
    const { story, colorMode, styleId, customStyle } = body
    prompt = buildDifyPrompt({
      story: story ?? "",
      colorMode: colorMode ?? "full_color",
      styleId: styleId ?? null,
      customStyle: customStyle ?? "",
    })
    user = body.user ?? `extend-${Date.now()}`
    traceId = body.trace_id ?? `extend-${Date.now()}`
  } else {
    const formData = await request.formData()
    const rawPrompt = formData.get("prompt") as string | null
    prompt = rawPrompt?.trim() ?? ""
    user = `extend-${Date.now()}`
    traceId = `extend-${Date.now()}`
  }

  if (!prompt.trim()) {
    return NextResponse.json({ success: false, error: "Prompt is required" }, { status: 400 })
  }

  const workflowId = process.env.DIFY_WORKFLOW_ID
  const url = workflowId
    ? `${DIFY_BASE}/workflows/${workflowId}/run`
    : `${DIFY_BASE}/workflows/run`

  const inputs: Record<string, string> = {}
  inputs[PROMPT_KEY] = prompt

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Trace-Id": traceId,
      },
      body: JSON.stringify({
        inputs,
        response_mode: "blocking",
        user,
      }),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      const err = data?.message ?? data?.error ?? res.statusText
      return NextResponse.json({ success: false, error: String(err) }, { status: res.status })
    }

    const result = data?.data ?? data
    const outputs = result?.outputs ?? result
    const urls = extractImageUrls(outputs)

    if (urls.length === 0) {
      return NextResponse.json(
        { success: false, error: "No image URLs in Dify output. Check DIFY_OUTPUT_PATHS and workflow outputs." },
        { status: 502 }
      )
    }

    return NextResponse.json({ success: true, output: urls, workflow_run_id: data?.workflow_run_id })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
