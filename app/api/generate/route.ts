import { NextRequest, NextResponse } from "next/server"

// Server-side generation route.
// Frontend should call ONLY /api/generate.
// This route calls your MCP tool server-side (no browser-to-Dify calls).

type JsonRpcEnvelope = {
  jsonrpc?: string
  id?: string
  result?: unknown
  error?: { code?: number; message?: string; data?: unknown }
}

type McpToolCallResult = {
  content?: Array<{ type?: string; text?: string }>
  isError?: boolean
}

type McpToolResponse = {
  body?: string
  status_code?: number
  files?: unknown[]
}

function tryParseJson<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

const MCP_URL = "https://api.dify.ai/mcp/server/pr44VVol6dVCBNuZ/mcp"

async function mcpRpc(method: string, params: unknown): Promise<{ ok: true; json: JsonRpcEnvelope } | { ok: false; status: number; text: string }> {
  const res = await fetch(MCP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: method,
      method,
      params,
    }),
  })

  const text = await res.text().catch(() => "")
  if (!res.ok) return { ok: false, status: res.status, text }

  const json = tryParseJson<JsonRpcEnvelope>(text)
  if (!json) return { ok: false, status: 502, text: `Invalid JSON from MCP: ${text.slice(0, 160)}` }
  return { ok: true, json }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const prompt = body?.prompt?.trim() as string | undefined
    const artisticStyle = (body?.style ?? "modern") as string
    const colorPreference = (body?.color ?? "vibrant") as string

    if (!prompt) {
      return NextResponse.json({ success: false, error: "Please enter a prompt." }, { status: 400 })
    }

    if (prompt.length < 20) {
      return NextResponse.json({ success: false, error: "Please enter at least 20 characters." }, { status: 400 })
    }

    // IMPORTANT: Dify MCP expects an initialize call before tool calls.
    const init = await mcpRpc("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "extend", version: "0.1" },
    })
    if (!init.ok) {
      return NextResponse.json(
        { success: false, error: init.text || `MCP initialize failed (HTTP ${init.status})` },
        { status: 502 }
      )
    }

    const call = await mcpRpc("tools/call", {
      name: "TaTTTy-MCP",
      arguments: {
        user_story: prompt,
        artistic_style: artisticStyle,
        // NOTE: tool schema uses the misspelled key `color_prefrence`
        color_prefrence: colorPreference,
      },
    })
    if (!call.ok) {
      return NextResponse.json(
        { success: false, error: call.text || `MCP tools/call failed (HTTP ${call.status})` },
        { status: 502 }
      )
    }

    if (call.json.error) {
      return NextResponse.json(
        { success: false, error: call.json.error.message || "MCP error" },
        { status: 502 }
      )
    }

    const result = call.json.result as McpToolCallResult | undefined
    const textContent = result?.content?.find((c) => c.type === "text" && typeof c.text === "string")?.text
    if (!textContent) {
      return NextResponse.json(
        { success: false, error: "MCP returned no text content." },
        { status: 502 }
      )
    }

    const toolResponse = tryParseJson<McpToolResponse>(textContent)
    if (!toolResponse?.body) {
      return NextResponse.json(
        { success: false, error: `MCP tool response missing body: ${textContent.slice(0, 200)}` },
        { status: 502 }
      )
    }

    const parsedBody = tryParseJson<{ output?: unknown; status?: string; error?: unknown }>(toolResponse.body)
    const output = parsedBody?.output
    const images = Array.isArray(output)
      ? (output.filter((x) => typeof x === "string") as string[])
      : []

    if (!images.length) {
      return NextResponse.json(
        {
          success: false,
          error: `No images returned from MCP tool. status=${parsedBody?.status ?? "unknown"}`,
        },
        { status: 502 }
      )
    }

    return NextResponse.json({ success: true, output: images })
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
